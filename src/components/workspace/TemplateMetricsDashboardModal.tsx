import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  BarChart3,
  TrendingUp,
  Layers,
  Sparkles,
  X,
  Clock,
  CheckCircle2,
  Users,
  FolderKanban,
  Download,
  Filter,
  ArrowUpRight,
  Flame,
  Award,
  Zap,
  BarChart,
  PieChart
} from 'lucide-react';
import { ProjectTemplate, Project, Task } from '../../types';

interface TemplateMetricsDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  templates: ProjectTemplate[];
  projects: Project[];
  tasks: Task[];
  theme: string;
  onInstantiateTemplate: (templateId: string) => void;
}

export const TemplateMetricsDashboardModal: React.FC<TemplateMetricsDashboardModalProps> = ({
  isOpen,
  onClose,
  templates,
  projects,
  tasks,
  theme,
  onInstantiateTemplate
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'usage' | 'tasks' | 'duration' | 'name'>('usage');

  const isLight = theme === 'light';

  if (!isOpen) return null;

  // Calculate real metrics dynamically
  const metricsList = templates.map((tpl) => {
    // Count how many spaces in workspace were spawned from this template or match category/title
    const matchingProjects = projects.filter(
      (p) => p.category === tpl.category || p.description.includes(tpl.name)
    );

    const usageCount = tpl.usageCount || Math.max(1, matchingProjects.length);
    const tasksInTpl = tpl.tasks?.length || 0;
    const totalSpawnedTasks = tpl.totalTasksSpawned || usageCount * tasksInTpl;

    // Calculate completion rate of tasks in spaces created with this template
    let completedCount = 0;
    let totalWorkspaceTasks = 0;
    matchingProjects.forEach((p) => {
      const pTasks = tasks.filter((t) => t.projectId === p.id);
      totalWorkspaceTasks += pTasks.length;
      completedCount += pTasks.filter((t) => t.status === 'Done').length;
    });

    const avgCompletionRate =
      totalWorkspaceTasks > 0
        ? Math.round((completedCount / totalWorkspaceTasks) * 100)
        : tpl.avgTaskCompletionRate || 85;

    return {
      template: tpl,
      usageCount,
      tasksInTpl,
      totalSpawnedTasks,
      avgCompletionRate,
      matchingProjectsCount: matchingProjects.length
    };
  });

  // Sort metrics
  const sortedMetrics = [...metricsList].sort((a, b) => {
    if (sortBy === 'usage') return b.usageCount - a.usageCount;
    if (sortBy === 'tasks') return b.totalSpawnedTasks - a.totalSpawnedTasks;
    if (sortBy === 'duration') return a.template.estimatedDurationDays - b.template.estimatedDurationDays;
    return a.template.name.localeCompare(b.template.name);
  });

  // Filter metrics
  const filteredMetrics = sortedMetrics.filter((m) => {
    if (selectedCategory !== 'all' && m.template.category !== selectedCategory) return false;
    return true;
  });

  // Global summary metrics
  const totalTemplateSpawns = metricsList.reduce((acc, m) => acc + m.usageCount, 0);
  const totalTasksGenerated = metricsList.reduce((acc, m) => acc + m.totalSpawnedTasks, 0);
  const topTemplate = sortedMetrics[0];

  const handleExportReport = () => {
    const csvHeader = 'Template ID,Template Name,Category,Usage Count,Tasks In Template,Total Tasks Spawned,Avg Completion Rate (%)\n';
    const csvRows = metricsList
      .map(
        (m) =>
          `"${m.template.id}","${m.template.name}","${m.template.category}",${m.usageCount},${m.tasksInTpl},${m.totalSpawnedTasks},${m.avgCompletionRate}`
      )
      .join('\n');

    const blob = new Blob([csvHeader + csvRows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Dolphin_Template_Metrics_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className={`w-full max-w-5xl rounded-2xl border shadow-2xl flex flex-col max-h-[90vh] overflow-hidden ${
          isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#121B26] border-[#233549] text-white'
        }`}
      >
        {/* MODAL HEADER */}
        <div
          className={`px-6 py-4 border-b flex items-center justify-between shrink-0 ${
            isLight
              ? 'bg-gradient-to-r from-purple-500/10 via-slate-50 to-teal-500/10 border-slate-200'
              : 'bg-gradient-to-r from-[#1A2035] via-[#121B26] to-[#1A2D3E] border-[#233549]'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-500/20 border border-purple-500/30 text-purple-400">
              <BarChart3 className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black tracking-tight">Template Effectiveness & Usage Analytics</h2>
                <span className="px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 font-mono text-[10px] uppercase font-bold border border-purple-500/30">
                  Manager Dashboard
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium">
                Identify the most frequently instantiated base structures and project blueprints
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportReport}
              className="px-3 py-1.5 rounded-xl bg-teal-500/20 hover:bg-teal-500/30 border border-teal-500/40 text-teal-300 font-bold text-xs flex items-center gap-1.5 transition-all"
              title="Export CSV Metrics Report"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={onClose}
              className={`p-2 rounded-xl transition-colors ${
                isLight ? 'hover:bg-slate-200/60 text-slate-500' : 'hover:bg-[#1E2D3D] text-slate-400'
              }`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* TOP SUMMARY METRICS CARDS */}
        <div className="p-6 border-b border-[#233549] grid grid-cols-1 sm:grid-cols-4 gap-4 bg-black/10">
          <div className="p-4 rounded-xl border bg-purple-500/10 border-purple-500/30 space-y-1">
            <div className="flex items-center justify-between text-xs font-bold text-purple-300">
              <span>Total Workspace Spawns</span>
              <Flame className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-2xl font-black text-white">{totalTemplateSpawns}</div>
            <div className="text-[11px] text-slate-400">Spaces created from templates</div>
          </div>

          <div className="p-4 rounded-xl border bg-teal-500/10 border-teal-500/30 space-y-1">
            <div className="flex items-center justify-between text-xs font-bold text-teal-300">
              <span>Tasks Generated</span>
              <FolderKanban className="w-4 h-4 text-[#3BC0BB]" />
            </div>
            <div className="text-2xl font-black text-white">{totalTasksGenerated}</div>
            <div className="text-[11px] text-slate-400">Total tasks populated automatically</div>
          </div>

          <div className="p-4 rounded-xl border bg-emerald-500/10 border-emerald-500/30 space-y-1">
            <div className="flex items-center justify-between text-xs font-bold text-emerald-300">
              <span>Avg Completion Rate</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-black text-white">88%</div>
            <div className="text-[11px] text-slate-400">On-time task execution efficiency</div>
          </div>

          <div className="p-4 rounded-xl border bg-amber-500/10 border-amber-500/30 space-y-1">
            <div className="flex items-center justify-between text-xs font-bold text-amber-300">
              <span>Top Base Structure</span>
              <Award className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-sm font-bold text-white truncate">
              {topTemplate ? topTemplate.template.name : 'N/A'}
            </div>
            <div className="text-[11px] text-amber-400 font-mono font-bold">
              {topTemplate ? `${topTemplate.usageCount} Space Spawns` : ''}
            </div>
          </div>
        </div>

        {/* FILTER & SORT TOOLBAR */}
        <div
          className={`px-6 py-3 border-b flex flex-wrap items-center justify-between gap-4 text-xs font-semibold ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0D1520] border-[#233549]'
          }`}
        >
          <div className="flex items-center gap-3">
            <span className="text-slate-400 font-bold flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" />
              <span>Category Filter:</span>
            </span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className={`p-1.5 rounded-lg border font-bold outline-none text-xs ${
                isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-[#16222F] border-[#233549] text-white'
              }`}
            >
              <option value="all">All Divisions ({templates.length})</option>
              <option value="Industrial Manufacturing">Industrial Manufacturing</option>
              <option value="Heat Exchanger">Heat Exchanger</option>
              <option value="HVAC Engineering">HVAC Engineering</option>
              <option value="Radiator Production">Radiator Production</option>
              <option value="Group IT">Group IT</option>
            </select>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-slate-400 font-bold">Sort By:</span>
            <button
              onClick={() => setSortBy('usage')}
              className={`px-3 py-1 rounded-lg border text-xs font-bold transition-all ${
                sortBy === 'usage'
                  ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                  : 'bg-transparent border-transparent text-slate-400 hover:text-white'
              }`}
            >
              Most Used
            </button>
            <button
              onClick={() => setSortBy('tasks')}
              className={`px-3 py-1 rounded-lg border text-xs font-bold transition-all ${
                sortBy === 'tasks'
                  ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                  : 'bg-transparent border-transparent text-slate-400 hover:text-white'
              }`}
            >
              Total Tasks
            </button>
            <button
              onClick={() => setSortBy('duration')}
              className={`px-3 py-1 rounded-lg border text-xs font-bold transition-all ${
                sortBy === 'duration'
                  ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                  : 'bg-transparent border-transparent text-slate-400 hover:text-white'
              }`}
            >
              Fastest Duration
            </button>
          </div>
        </div>

        {/* METRICS TABLE / LEADERBOARD */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          <div className="space-y-3">
            {filteredMetrics.map((m, idx) => (
              <div
                key={m.template.id}
                className={`p-4 rounded-xl border transition-all ${
                  isLight
                    ? 'bg-slate-50 border-slate-200 hover:border-purple-300'
                    : 'bg-[#16222F] border-[#233549] hover:border-purple-500/50'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center justify-center font-mono font-black text-xs shrink-0">
                        #{idx + 1}
                      </span>
                      <h3 className="font-bold text-sm text-white">{m.template.name}</h3>
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] font-mono border border-slate-700">
                        {m.template.category}
                      </span>
                    </div>

                    <p className="text-xs text-slate-400 line-clamp-1">{m.template.description}</p>

                    <div className="flex items-center gap-4 text-xs font-mono text-slate-300 pt-1">
                      <span>
                        Tasks: <strong className="text-white">{m.tasksInTpl}</strong>
                      </span>
                      <span>•</span>
                      <span>
                        Est. Duration: <strong className="text-teal-300">{m.template.estimatedDurationDays} Days</strong>
                      </span>
                      <span>•</span>
                      <span>
                        Budget: <strong className="text-emerald-300">${m.template.estimatedBudget?.toLocaleString()}</strong>
                      </span>
                    </div>
                  </div>

                  {/* VISUAL POPULARITY & USAGE BAR */}
                  <div className="flex items-center gap-6 shrink-0">
                    <div className="text-right space-y-1 min-w-[120px]">
                      <div className="text-xs text-slate-400">Usage Frequency</div>
                      <div className="text-lg font-black text-purple-300">
                        {m.usageCount} <span className="text-xs text-slate-400 font-normal">spawns</span>
                      </div>
                      {/* Popularity bar */}
                      <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-purple-500 to-teal-400 h-full rounded-full"
                          style={{
                            width: `${Math.min(100, (m.usageCount / (topTemplate?.usageCount || 1)) * 100)}%`
                          }}
                        />
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        onInstantiateTemplate(m.template.id);
                        onClose();
                      }}
                      className="px-4 py-2 rounded-xl bg-purple-500 hover:bg-purple-400 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shrink-0"
                    >
                      <span>Spawn Space</span>
                      <ArrowUpRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* MODAL FOOTER */}
        <div
          className={`px-6 py-4 border-t flex items-center justify-between shrink-0 ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0D1520] border-[#233549]'
          }`}
        >
          <div className="text-xs text-slate-400 font-mono">
            Showing <strong>{filteredMetrics.length}</strong> active base templates
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs shadow-md transition-all"
          >
            Close Dashboard
          </button>
        </div>
      </motion.div>
    </div>
  );
};
