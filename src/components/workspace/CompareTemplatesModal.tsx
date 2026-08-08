import React, { useState, useMemo } from 'react';
import {
  X,
  Columns,
  CheckCircle2,
  GitBranch,
  Clock,
  DollarSign,
  ListTodo,
  Network,
  ArrowRight,
  ShieldAlert,
  Sparkles,
  Zap,
  Copy,
  Layers,
  TrendingUp,
  Tag,
  SlidersHorizontal,
  ChevronRight
} from 'lucide-react';
import { ProjectTemplate, TemplateTask, TemplateDependency } from '../../types';

interface CompareTemplatesModalProps {
  templates: ProjectTemplate[];
  isOpen: boolean;
  onClose: () => void;
  initialTemplateAId?: string;
  initialTemplateBId?: string;
  onInstantiateTemplate: (template: ProjectTemplate) => void;
}

export const CompareTemplatesModal: React.FC<CompareTemplatesModalProps> = ({
  templates,
  isOpen,
  onClose,
  initialTemplateAId,
  initialTemplateBId,
  onInstantiateTemplate
}) => {
  const [templateAId, setTemplateAId] = useState<string>(
    initialTemplateAId || templates[0]?.id || ''
  );
  const [templateBId, setTemplateBId] = useState<string>(
    initialTemplateBId || (templates[1]?.id || templates[0]?.id || '')
  );
  const [activeTab, setActiveTab] = useState<'overview' | 'tasks' | 'dependencies'>('overview');

  // Keep state synced if props change or modal opens
  React.useEffect(() => {
    if (isOpen) {
      if (initialTemplateAId) setTemplateAId(initialTemplateAId);
      if (initialTemplateBId) {
        setTemplateBId(initialTemplateBId);
      } else if (templates.length > 1) {
        const other = templates.find(t => t.id !== (initialTemplateAId || templates[0]?.id));
        if (other) setTemplateBId(other.id);
      }
    }
  }, [isOpen, initialTemplateAId, initialTemplateBId, templates]);

  const templateA = useMemo(() => templates.find(t => t.id === templateAId) || null, [templates, templateAId]);
  const templateB = useMemo(() => templates.find(t => t.id === templateBId) || null, [templates, templateBId]);

  // Compute metrics helper
  const getMetrics = (tpl: ProjectTemplate | null) => {
    if (!tpl) return null;
    const tasks = tpl.tasks || [];
    const deps = tpl.dependencies || [];
    const totalSubtasks = tasks.reduce((sum, t) => sum + (t.subtasks?.length || 0), 0);
    const totalEffortHours = tasks.reduce((sum, t) => sum + (t.estimatedHours || 10), 0);
    
    const priorityCounts = {
      Urgent: tasks.filter(t => t.priority === 'Urgent').length,
      High: tasks.filter(t => t.priority === 'High').length,
      Medium: tasks.filter(t => t.priority === 'Medium' || !t.priority).length,
      Low: tasks.filter(t => t.priority === 'Low').length
    };

    const maxDayOffset = tasks.reduce((max, t) => Math.max(max, (t.dayOffset || 0) + (t.durationDays || 5)), 0);

    return {
      taskCount: tasks.length,
      dependencyCount: deps.length,
      subtaskCount: totalSubtasks,
      effortHours: totalEffortHours,
      estimatedDays: tpl.estimatedDurationDays || maxDayOffset || 14,
      estimatedBudget: tpl.estimatedBudget || 250000,
      priorityCounts
    };
  };

  const metricsA = useMemo(() => getMetrics(templateA), [templateA]);
  const metricsB = useMemo(() => getMetrics(templateB), [templateB]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#16222F] border border-[#233549] rounded-2xl w-full max-w-6xl h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95">
        
        {/* MODAL HEADER */}
        <div className="p-4 bg-[#0D1520] border-b border-[#233549] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/30 shrink-0">
              <Columns className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white">Side-by-Side Template Comparison</h2>
                <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-mono font-bold">
                  {templates.length} Templates Available
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Analyze task structures, predecessor linkages, and budget estimates between two templates before creating a new workspace.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-[#16222F] text-slate-400 hover:text-white transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* TEMPLATE SELECTOR CONTROLS BAR */}
        <div className="p-3.5 bg-[#111A24] border-b border-[#233549] grid grid-cols-1 md:grid-cols-2 gap-4 shrink-0 text-xs">
          {/* SELECTOR A */}
          <div className="p-3 bg-[#0D1520] border border-indigo-500/40 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-indigo-300 uppercase font-mono tracking-wider text-[10px] flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-indigo-400"></span>
                Template Option A
              </span>
              {templateA && (
                <span className="text-[11px] font-mono text-slate-400">
                  {metricsA?.taskCount} Tasks • {metricsA?.dependencyCount} Deps
                </span>
              )}
            </div>
            <select
              value={templateAId}
              onChange={(e) => setTemplateAId(e.target.value)}
              className="w-full bg-[#16222F] border border-[#233549] text-white rounded-lg p-2 font-semibold text-xs focus:outline-none focus:border-indigo-500"
            >
              {templates.map((tpl) => (
                <option key={tpl.id} value={tpl.id}>
                  {tpl.name} ({tpl.category} - {tpl.tasks?.length || 0} tasks)
                </option>
              ))}
            </select>
          </div>

          {/* SELECTOR B */}
          <div className="p-3 bg-[#0D1520] border border-teal-500/40 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-teal-300 uppercase font-mono tracking-wider text-[10px] flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#3BC0BB]"></span>
                Template Option B
              </span>
              {templateB && (
                <span className="text-[11px] font-mono text-slate-400">
                  {metricsB?.taskCount} Tasks • {metricsB?.dependencyCount} Deps
                </span>
              )}
            </div>
            <select
              value={templateBId}
              onChange={(e) => setTemplateBId(e.target.value)}
              className="w-full bg-[#16222F] border border-[#233549] text-white rounded-lg p-2 font-semibold text-xs focus:outline-none focus:border-teal-500"
            >
              {templates.map((tpl) => (
                <option key={tpl.id} value={tpl.id}>
                  {tpl.name} ({tpl.category} - {tpl.tasks?.length || 0} tasks)
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* COMPARISON VIEW TABS */}
        <div className="px-4 py-2 bg-[#0D1520] border-b border-[#233549] flex items-center justify-between text-xs shrink-0">
          <div className="flex items-center gap-1 font-mono">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'overview'
                  ? 'bg-purple-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Metrics & Diff Matrix</span>
            </button>

            <button
              onClick={() => setActiveTab('tasks')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'tasks'
                  ? 'bg-purple-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ListTodo className="w-3.5 h-3.5" />
              <span>Side-by-Side Tasks</span>
            </button>

            <button
              onClick={() => setActiveTab('dependencies')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'dependencies'
                  ? 'bg-purple-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Network className="w-3.5 h-3.5" />
              <span>Dependency Linkages</span>
            </button>
          </div>

          <div className="text-[11px] text-slate-400 font-mono hidden sm:block">
            Comparing <strong>{templateA?.name || 'A'}</strong> vs <strong>{templateB?.name || 'B'}</strong>
          </div>
        </div>

        {/* MODAL MAIN CONTENT */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* TAB 1: OVERVIEW METRICS & DIFF MATRIX */}
          {activeTab === 'overview' && (
            <div className="space-y-4">
              {/* SUMMARY HIGHLIGHT CARDS */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* TEMPLATE A CARD */}
                <div className="p-4 rounded-xl bg-[#0D1520] border border-indigo-500/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-mono font-bold">
                        {templateA?.category || 'Category'}
                      </span>
                      <h3 className="text-base font-bold text-white mt-1">{templateA?.name}</h3>
                    </div>
                    <button
                      onClick={() => templateA && onInstantiateTemplate(templateA)}
                      className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-indigo-600/20 transition-all shrink-0"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>Instantiate A</span>
                    </button>
                  </div>
                  <p className="text-xs text-slate-300 line-clamp-2">{templateA?.description}</p>
                </div>

                {/* TEMPLATE B CARD */}
                <div className="p-4 rounded-xl bg-[#0D1520] border border-teal-500/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="px-2 py-0.5 rounded bg-teal-500/20 text-teal-300 border border-[#3BC0BB]/30 text-[10px] font-mono font-bold">
                        {templateB?.category || 'Category'}
                      </span>
                      <h3 className="text-base font-bold text-white mt-1">{templateB?.name}</h3>
                    </div>
                    <button
                      onClick={() => templateB && onInstantiateTemplate(templateB)}
                      className="px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-teal-600/20 transition-all shrink-0"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>Instantiate B</span>
                    </button>
                  </div>
                  <p className="text-xs text-slate-300 line-clamp-2">{templateB?.description}</p>
                </div>
              </div>

              {/* COMPARISON METRICS TABLE */}
              <div className="bg-[#0D1520] border border-[#233549] rounded-xl overflow-hidden">
                <div className="p-3 bg-[#111A24] border-b border-[#233549] font-bold text-xs text-white flex items-center justify-between">
                  <span>Structured Comparison Matrix</span>
                  <span className="text-[10px] font-mono text-slate-400">Green = Higher / Detailed</span>
                </div>

                <div className="divide-y divide-[#233549] text-xs">
                  {/* METRIC 1: TASK COUNT */}
                  <div className="grid grid-cols-3 p-3 items-center">
                    <span className="text-slate-400 font-semibold flex items-center gap-1.5">
                      <ListTodo className="w-4 h-4 text-purple-400" />
                      <span>Total Tasks Count</span>
                    </span>
                    <span className={`font-mono font-bold ${
                      (metricsA?.taskCount || 0) >= (metricsB?.taskCount || 0) ? 'text-indigo-300' : 'text-slate-300'
                    }`}>
                      {metricsA?.taskCount} Tasks
                      {metricsA && metricsB && metricsA.taskCount !== metricsB.taskCount && (
                        <span className="text-[10px] ml-1.5 px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300">
                          {metricsA.taskCount > metricsB.taskCount ? `+${metricsA.taskCount - metricsB.taskCount}` : ''}
                        </span>
                      )}
                    </span>
                    <span className={`font-mono font-bold ${
                      (metricsB?.taskCount || 0) >= (metricsA?.taskCount || 0) ? 'text-teal-300' : 'text-slate-300'
                    }`}>
                      {metricsB?.taskCount} Tasks
                      {metricsA && metricsB && metricsB.taskCount !== metricsA.taskCount && (
                        <span className="text-[10px] ml-1.5 px-1.5 py-0.2 rounded bg-teal-500/20 text-teal-300">
                          {metricsB.taskCount > metricsA.taskCount ? `+${metricsB.taskCount - metricsA.taskCount}` : ''}
                        </span>
                      )}
                    </span>
                  </div>

                  {/* METRIC 2: DEPENDENCIES COUNT */}
                  <div className="grid grid-cols-3 p-3 items-center bg-[#16222F]/40">
                    <span className="text-slate-400 font-semibold flex items-center gap-1.5">
                      <GitBranch className="w-4 h-4 text-purple-400" />
                      <span>Predecessor Linkages</span>
                    </span>
                    <span className="font-mono font-bold text-indigo-300">
                      {metricsA?.dependencyCount} Predecessors
                    </span>
                    <span className="font-mono font-bold text-teal-300">
                      {metricsB?.dependencyCount} Predecessors
                    </span>
                  </div>

                  {/* METRIC 3: TOTAL SUBTASKS */}
                  <div className="grid grid-cols-3 p-3 items-center">
                    <span className="text-slate-400 font-semibold flex items-center gap-1.5">
                      <Layers className="w-4 h-4 text-purple-400" />
                      <span>Total Subtasks Items</span>
                    </span>
                    <span className="font-mono font-bold text-indigo-300">
                      {metricsA?.subtaskCount} Subtasks
                    </span>
                    <span className="font-mono font-bold text-teal-300">
                      {metricsB?.subtaskCount} Subtasks
                    </span>
                  </div>

                  {/* METRIC 4: EFFORT HOURS */}
                  <div className="grid grid-cols-3 p-3 items-center bg-[#16222F]/40">
                    <span className="text-slate-400 font-semibold flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-purple-400" />
                      <span>Estimated Work Effort</span>
                    </span>
                    <span className="font-mono font-bold text-indigo-300">
                      {metricsA?.effortHours} Hours (~{Math.round((metricsA?.effortHours || 0) / 8)} Days)
                    </span>
                    <span className="font-mono font-bold text-teal-300">
                      {metricsB?.effortHours} Hours (~{Math.round((metricsB?.effortHours || 0) / 8)} Days)
                    </span>
                  </div>

                  {/* METRIC 5: ESTIMATED BUDGET */}
                  <div className="grid grid-cols-3 p-3 items-center">
                    <span className="text-slate-400 font-semibold flex items-center gap-1.5">
                      <DollarSign className="w-4 h-4 text-purple-400" />
                      <span>Estimated Target Budget</span>
                    </span>
                    <span className="font-mono font-bold text-indigo-300">
                      ${(metricsA?.estimatedBudget || 0).toLocaleString()}
                    </span>
                    <span className="font-mono font-bold text-teal-300">
                      ${(metricsB?.estimatedBudget || 0).toLocaleString()}
                    </span>
                  </div>

                  {/* METRIC 6: PRIORITY BREAKDOWN */}
                  <div className="grid grid-cols-3 p-3 items-center bg-[#16222F]/40">
                    <span className="text-slate-400 font-semibold flex items-center gap-1.5">
                      <ShieldAlert className="w-4 h-4 text-purple-400" />
                      <span>Task Priority Breakdown</span>
                    </span>
                    <div className="space-y-1 text-[11px] font-mono">
                      <span className="text-rose-400 block font-bold">
                        Urgent/High: {(metricsA?.priorityCounts.Urgent || 0) + (metricsA?.priorityCounts.High || 0)}
                      </span>
                      <span className="text-amber-400 block">
                        Medium: {metricsA?.priorityCounts.Medium}
                      </span>
                    </div>
                    <div className="space-y-1 text-[11px] font-mono">
                      <span className="text-rose-400 block font-bold">
                        Urgent/High: {(metricsB?.priorityCounts.Urgent || 0) + (metricsB?.priorityCounts.High || 0)}
                      </span>
                      <span className="text-amber-400 block">
                        Medium: {metricsB?.priorityCounts.Medium}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SIDE-BY-SIDE TASK LISTS */}
          {activeTab === 'tasks' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* COLUMN A TASKS */}
              <div className="p-3 bg-[#0D1520] border border-indigo-500/30 rounded-xl space-y-3">
                <div className="flex items-center justify-between border-b border-[#233549] pb-2">
                  <span className="font-bold text-white text-xs">{templateA?.name} Tasks</span>
                  <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-mono text-[10px]">
                    {templateA?.tasks?.length || 0} Tasks
                  </span>
                </div>

                <div className="space-y-2">
                  {templateA?.tasks?.map((task, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-[#16222F] border border-[#233549] space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white text-xs truncate">{task.title}</span>
                        <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                          task.priority === 'Urgent' || task.priority === 'High'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                        }`}>
                          {task.priority || 'Medium'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                        <span>Day +{task.dayOffset || 0} ({task.durationDays || 5}d)</span>
                        <span>Effort: {task.estimatedHours || 10}h</span>
                        <span>{task.subtasks?.length || 0} subtasks</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* COLUMN B TASKS */}
              <div className="p-3 bg-[#0D1520] border border-teal-500/30 rounded-xl space-y-3">
                <div className="flex items-center justify-between border-b border-[#233549] pb-2">
                  <span className="font-bold text-white text-xs">{templateB?.name} Tasks</span>
                  <span className="px-2 py-0.5 rounded bg-teal-500/20 text-teal-300 font-mono text-[10px]">
                    {templateB?.tasks?.length || 0} Tasks
                  </span>
                </div>

                <div className="space-y-2">
                  {templateB?.tasks?.map((task, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-[#16222F] border border-[#233549] space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white text-xs truncate">{task.title}</span>
                        <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                          task.priority === 'Urgent' || task.priority === 'High'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                        }`}>
                          {task.priority || 'Medium'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                        <span>Day +{task.dayOffset || 0} ({task.durationDays || 5}d)</span>
                        <span>Effort: {task.estimatedHours || 10}h</span>
                        <span>{task.subtasks?.length || 0} subtasks</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: DEPENDENCY LINKAGES SIDE-BY-SIDE */}
          {activeTab === 'dependencies' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* DEPENDENCIES A */}
              <div className="p-3 bg-[#0D1520] border border-indigo-500/30 rounded-xl space-y-3">
                <div className="flex items-center justify-between border-b border-[#233549] pb-2">
                  <span className="font-bold text-white text-xs">{templateA?.name} Predecessors</span>
                  <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-mono text-[10px]">
                    {templateA?.dependencies?.length || 0} Links
                  </span>
                </div>

                {templateA?.dependencies && templateA.dependencies.length > 0 ? (
                  <div className="space-y-2">
                    {templateA.dependencies.map((dep, dIdx) => {
                      const src = templateA.tasks?.find(t => t.tempId === dep.dependsOnTaskTempId);
                      const tgt = templateA.tasks?.find(t => t.tempId === dep.taskTempId);
                      return (
                        <div key={dIdx} className="p-2.5 rounded-xl bg-[#16222F] border border-[#233549] text-xs space-y-1">
                          <div className="flex items-center gap-1.5 text-slate-300">
                            <span className="font-semibold text-indigo-300 truncate flex-1">{src?.title || dep.dependsOnTaskTempId}</span>
                            <ArrowRight className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                            <span className="font-semibold text-white truncate flex-1">{tgt?.title || dep.taskTempId}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 p-4 text-center italic">No predecessor linkages defined for Template A.</p>
                )}
              </div>

              {/* DEPENDENCIES B */}
              <div className="p-3 bg-[#0D1520] border border-teal-500/30 rounded-xl space-y-3">
                <div className="flex items-center justify-between border-b border-[#233549] pb-2">
                  <span className="font-bold text-white text-xs">{templateB?.name} Predecessors</span>
                  <span className="px-2 py-0.5 rounded bg-teal-500/20 text-teal-300 font-mono text-[10px]">
                    {templateB?.dependencies?.length || 0} Links
                  </span>
                </div>

                {templateB?.dependencies && templateB.dependencies.length > 0 ? (
                  <div className="space-y-2">
                    {templateB.dependencies.map((dep, dIdx) => {
                      const src = templateB.tasks?.find(t => t.tempId === dep.dependsOnTaskTempId);
                      const tgt = templateB.tasks?.find(t => t.tempId === dep.taskTempId);
                      return (
                        <div key={dIdx} className="p-2.5 rounded-xl bg-[#16222F] border border-[#233549] text-xs space-y-1">
                          <div className="flex items-center gap-1.5 text-slate-300">
                            <span className="font-semibold text-teal-300 truncate flex-1">{src?.title || dep.dependsOnTaskTempId}</span>
                            <ArrowRight className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                            <span className="font-semibold text-white truncate flex-1">{tgt?.title || dep.taskTempId}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 p-4 text-center italic">No predecessor linkages defined for Template B.</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* MODAL FOOTER */}
        <div className="p-3 bg-[#0D1520] border-t border-[#233549] flex items-center justify-between text-xs shrink-0">
          <span className="text-slate-400 font-mono text-[11px]">
            ⚡ Choose either template above to instantiate a pre-configured project workspace.
          </span>
          <div className="flex items-center gap-2">
            {templateA && (
              <button
                type="button"
                onClick={() => {
                  onInstantiateTemplate(templateA);
                  onClose();
                }}
                className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-all"
              >
                Apply {templateA.name}
              </button>
            )}
            {templateB && (
              <button
                type="button"
                onClick={() => {
                  onInstantiateTemplate(templateB);
                  onClose();
                }}
                className="px-3.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold transition-all"
              >
                Apply {templateB.name}
              </button>
            )}
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-xl bg-[#16222F] text-slate-300 hover:text-white font-semibold"
            >
              Close
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
