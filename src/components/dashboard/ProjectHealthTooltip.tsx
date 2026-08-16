import React from 'react';
import { Project, Task } from '../../types';
import { AlertCircle, CheckCircle2, Clock } from 'lucide-react';

export interface ProjectHealthTooltipProps {
  isVisible: boolean;
  project: Project;
  tasks: Task[];
}

export const ProjectHealthTooltip: React.FC<ProjectHealthTooltipProps> = ({
  isVisible,
  project,
  tasks
}) => {
  if (!isVisible) return null;

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === 'Done').length;
  const now = new Date();
  const overdueTasks = tasks.filter((t) => t.status !== 'Done' && t.dueDate && new Date(t.dueDate) < now);
  const urgentTasks = tasks.filter((t) => t.status !== 'Done' && t.priority === 'Urgent');

  return (
    <div className="absolute z-30 bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 p-3.5 rounded-xl bg-[#090D14] border border-[#233549] text-white shadow-2xl pointer-events-none animate-in fade-in zoom-in-95">
      <div className="flex items-center justify-between border-b border-[#233549] pb-2 mb-2">
        <h4 className="text-xs font-bold text-white truncate">{project.title}</h4>
        <span className="text-[10px] font-mono text-[#3BC0BB] font-bold">
          {project.progress}% Done
        </span>
      </div>

      <div className="space-y-1.5 text-[11px] font-mono">
        <div className="flex justify-between items-center text-slate-300">
          <span className="flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Total Tasks
          </span>
          <span className="font-bold">{completedTasks} / {totalTasks}</span>
        </div>

        {overdueTasks.length > 0 && (
          <div className="flex justify-between items-center text-rose-400">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-rose-400" /> Overdue
            </span>
            <span className="font-bold">{overdueTasks.length} tasks</span>
          </div>
        )}

        {urgentTasks.length > 0 && (
          <div className="flex justify-between items-center text-amber-400">
            <span className="flex items-center gap-1">
              <AlertCircle className="w-3 h-3 text-amber-400" /> Urgent
            </span>
            <span className="font-bold">{urgentTasks.length} tasks</span>
          </div>
        )}

        <div className="pt-1.5 border-t border-[#233549]/60 flex justify-between text-slate-400 text-[10px]">
          <span>Due: {project.dueDate || 'N/A'}</span>
          <span>Budget: ${project.spentBudget?.toLocaleString() || 0}</span>
        </div>
      </div>
    </div>
  );
};
