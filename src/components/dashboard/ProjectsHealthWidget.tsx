import React, { useState } from 'react';
import {
  FolderKanban,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  DollarSign
} from 'lucide-react';
import { Project, Task } from '../../types';
import { ProjectHealthTooltip } from './ProjectHealthTooltip';

export interface ProjectsHealthWidgetProps {
  theme?: 'dark' | 'light';
  projects: Project[];
  tasks: Task[];
  onNavigateToProjects?: () => void;
  onSelectProject?: (projectId: string) => void;
}

export const ProjectsHealthWidget: React.FC<ProjectsHealthWidgetProps> = ({
  theme = 'dark',
  projects,
  tasks,
  onNavigateToProjects,
  onSelectProject
}) => {
  const [hoveredProjectId, setHoveredProjectId] = useState<string | null>(null);

  const getProjectTasks = (projectId: string) => {
    return tasks.filter((t) => t.projectId === projectId);
  };

  const getProjectDiagnostics = (project: Project) => {
    const pTasks = getProjectTasks(project.id);
    const completedTasks = pTasks.filter((t) => t.status === 'Done').length;
    const taskCount = pTasks.length;
    const now = new Date();
    const overdueTasks = pTasks.filter((t) => t.status !== 'Done' && t.dueDate && new Date(t.dueDate) < now).length;
    const isBudgetOverrun = project.spentBudget && project.budget ? project.spentBudget > project.budget : false;

    let health: 'Good' | 'At Risk' | 'Critical' = 'Good';
    if (overdueTasks > 2 || (isBudgetOverrun && (project.spentBudget! / (project.budget || 1)) > 1.2)) {
      health = 'Critical';
    } else if (overdueTasks > 0 || isBudgetOverrun) {
      health = 'At Risk';
    }

    return {
      pTasks,
      taskCount,
      completedTasks,
      overdueTasks,
      isBudgetOverrun,
      health
    };
  };

  return (
    <div className="p-5 sm:p-6 space-y-4">
      <div className="flex items-center justify-between border-b border-slate-200/20 pb-3">
        <span className="text-xs text-slate-400 font-medium">
          {projects.length} active initiatives in workspace
        </span>
        {onNavigateToProjects && (
          <button
            type="button"
            onClick={onNavigateToProjects}
            className="text-xs font-semibold text-[#3BC0BB] hover:underline flex items-center gap-1"
          >
            <span>All Projects</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
        {projects.map((project) => {
          const { taskCount, completedTasks, overdueTasks, health } = getProjectDiagnostics(project);

          return (
            <div
              key={project.id}
              onMouseEnter={() => setHoveredProjectId(project.id)}
              onMouseLeave={() => setHoveredProjectId(null)}
              onClick={() => onSelectProject?.(project.id)}
              className={`p-4 rounded-xl border transition-all cursor-pointer relative group ${
                theme === 'light'
                  ? 'bg-slate-50 border-slate-200 hover:border-[#0773BB] hover:bg-slate-100/80 shadow-xs'
                  : 'bg-[#0D1520] border-[#233549] hover:border-[#3BC0BB] hover:bg-[#121C28]'
              }`}
            >
              <ProjectHealthTooltip
                isVisible={hoveredProjectId === project.id}
                project={project}
                tasks={getProjectTasks(project.id)}
              />

              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#0773BB]/20 text-[#3BC0BB] border border-[#0773BB]/30">
                    @{project.code || 'PROJ'}
                  </span>
                  <h4 className={`text-xs font-bold truncate ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
                    {project.title}
                  </h4>
                </div>

                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border shrink-0 ${
                    health === 'Good'
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                      : health === 'At Risk'
                      ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                      : 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                  }`}
                >
                  {health}
                </span>
              </div>

              <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                <span>{completedTasks}/{taskCount} Tasks</span>
                <span className="font-bold text-[#3BC0BB]">{project.progress}%</span>
              </div>

              <div className="mt-1.5 w-full bg-slate-700/30 h-1.5 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all rounded-full ${
                    health === 'Critical' ? 'bg-rose-500' : health === 'At Risk' ? 'bg-amber-500' : 'bg-[#3BC0BB]'
                  }`}
                  style={{ width: `${project.progress}%` }}
                />
              </div>

              <div className="mt-2.5 pt-2 border-t border-[#233549]/40 flex items-center justify-between text-[10px] text-slate-400">
                <span className="flex items-center gap-1">
                  <DollarSign className="w-3 h-3 text-slate-500" />
                  Budget: ${project.spentBudget?.toLocaleString() || 0} / ${project.budget?.toLocaleString() || 0}
                </span>
                {overdueTasks > 0 && (
                  <span className="text-rose-400 font-bold flex items-center gap-0.5">
                    <AlertTriangle className="w-3 h-3" /> {overdueTasks} Overdue
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
