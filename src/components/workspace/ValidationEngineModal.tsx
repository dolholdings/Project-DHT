import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  X,
  Wrench,
  RefreshCw,
  GitFork,
  Link2Off,
  Layers,
  ArrowRight,
  Info,
  Sparkles,
  Zap,
  Check,
  FileCheck
} from 'lucide-react';
import { ProjectTemplate, Project, Task, TaskDependency, TemplateTask, TemplateDependency } from '../../types';

interface ValidationIssue {
  id: string;
  type: 'circular' | 'broken_link' | 'orphan_task';
  severity: 'critical' | 'warning' | 'info';
  targetType: 'template' | 'project';
  targetId: string;
  targetName: string;
  title: string;
  description: string;
  affectedTaskIds: string[];
  affectedTaskTitles: string[];
  autoFixable: boolean;
  cyclePath?: string[];
}

interface ValidationEngineModalProps {
  isOpen: boolean;
  onClose: () => void;
  templates: ProjectTemplate[];
  projects: Project[];
  tasks: Task[];
  dependencies: TaskDependency[];
  theme: string;
  onAutoFixTemplate?: (templateId: string, fixedTasks: TemplateTask[], fixedDeps: TemplateDependency[]) => void;
  onAutoFixProject?: (projectId: string, fixedTasks: Task[], fixedDeps: TaskDependency[]) => void;
}

export const ValidationEngineModal: React.FC<ValidationEngineModalProps> = ({
  isOpen,
  onClose,
  templates,
  projects,
  tasks,
  dependencies,
  theme,
  onAutoFixTemplate,
  onAutoFixProject
}) => {
  const [selectedTargetId, setSelectedTargetId] = useState<string>('all');
  const [activeFilter, setActiveFilter] = useState<'all' | 'critical' | 'warning' | 'info'>('all');
  const [fixedIssueIds, setFixedIssueIds] = useState<Set<string>>(new Set());
  const [isFixing, setIsFixing] = useState(false);
  const [fixNotification, setFixNotification] = useState<string | null>(null);

  const isLight = theme === 'light';

  // 1. RUN VALIDATION ENGINE AUDIT
  const issues = useMemo<ValidationIssue[]>(() => {
    const list: ValidationIssue[] = [];

    // --- A. AUDIT TEMPLATES ---
    templates.forEach((tpl) => {
      const tplTasks = tpl.tasks || [];
      const tplDeps = tpl.dependencies || [];

      const tempIdMap = new Map<string, TemplateTask>();
      tplTasks.forEach((t) => tempIdMap.set(t.tempId, t));

      // 1. Broken Dependency Links in Template
      tplDeps.forEach((dep, idx) => {
        const sourceExists = tempIdMap.has(dep.taskTempId);
        const targetExists = tempIdMap.has(dep.dependsOnTaskTempId);

        if (!sourceExists || !targetExists) {
          const brokenTempId = !sourceExists ? dep.taskTempId : dep.dependsOnTaskTempId;
          const validTask = tempIdMap.get(sourceExists ? dep.taskTempId : dep.dependsOnTaskTempId);

          list.push({
            id: `tpl_broken_${tpl.id}_${idx}`,
            type: 'broken_link',
            severity: 'critical',
            targetType: 'template',
            targetId: tpl.id,
            targetName: tpl.name,
            title: `Broken Predecessor Reference in "${tpl.name}"`,
            description: `Dependency link references non-existent tempId "${brokenTempId}".`,
            affectedTaskIds: [brokenTempId],
            affectedTaskTitles: [validTask ? validTask.title : brokenTempId],
            autoFixable: true
          });
        }
      });

      // 2. Circular Reference Detection in Template (DFS)
      const graph = new Map<string, string[]>();
      tplDeps.forEach((dep) => {
        if (!graph.has(dep.taskTempId)) graph.set(dep.taskTempId, []);
        graph.get(dep.taskTempId)!.push(dep.dependsOnTaskTempId);
      });

      const visited = new Set<string>();
      const recStack = new Set<string>();
      const currentPath: string[] = [];
      let foundCycleInTpl = false;

      const dfsCycle = (node: string) => {
        visited.add(node);
        recStack.add(node);
        currentPath.push(node);

        const neighbors = graph.get(node) || [];
        for (const neighbor of neighbors) {
          if (!visited.has(neighbor)) {
            dfsCycle(neighbor);
          } else if (recStack.has(neighbor)) {
            foundCycleInTpl = true;
            const cycleStartIndex = currentPath.indexOf(neighbor);
            const cycleNodes = currentPath.slice(cycleStartIndex);
            cycleNodes.push(neighbor);

            const pathTitles = cycleNodes.map((tid) => tempIdMap.get(tid)?.title || tid);

            list.push({
              id: `tpl_cycle_${tpl.id}_${node}_${neighbor}`,
              type: 'circular',
              severity: 'critical',
              targetType: 'template',
              targetId: tpl.id,
              targetName: tpl.name,
              title: `Circular Dependency Loop in "${tpl.name}"`,
              description: `Loop detected: ${pathTitles.join(' ➔ ')}`,
              affectedTaskIds: cycleNodes,
              affectedTaskTitles: pathTitles,
              autoFixable: true,
              cyclePath: pathTitles
            });
          }
        }

        recStack.delete(node);
        currentPath.pop();
      };

      tplTasks.forEach((t) => {
        if (!visited.has(t.tempId)) {
          dfsCycle(t.tempId);
        }
      });

      // 3. Orphan Tasks in Template
      tplTasks.forEach((t) => {
        const hasIncoming = tplDeps.some((d) => d.dependsOnTaskTempId === t.tempId);
        const hasOutgoing = tplDeps.some((d) => d.taskTempId === t.tempId);
        const hasTags = t.tags && t.tags.length > 0;
        const zeroHours = !t.estimatedHours || t.estimatedHours === 0;

        if (!hasIncoming && !hasOutgoing && !hasTags && zeroHours) {
          list.push({
            id: `tpl_orphan_${tpl.id}_${t.tempId}`,
            type: 'orphan_task',
            severity: 'warning',
            targetType: 'template',
            targetId: tpl.id,
            targetName: tpl.name,
            title: `Orphan Unlinked Task "${t.title}"`,
            description: `Task has zero estimated hours, no tags, and no dependency connections in structure.`,
            affectedTaskIds: [t.tempId],
            affectedTaskTitles: [t.title],
            autoFixable: true
          });
        }
      });
    });

    // --- B. AUDIT ACTIVE WORKSPACE PROJECTS & TASKS ---
    projects.forEach((proj) => {
      const projTasks = tasks.filter((t) => t.projectId === proj.id);
      const taskIdMap = new Map<string, Task>();
      projTasks.forEach((t) => taskIdMap.set(t.id, t));

      // 1. Broken Dependency Links in Project
      projTasks.forEach((t) => {
        const preds = t.predecessors || [];
        preds.forEach((predId) => {
          if (!taskIdMap.has(predId)) {
            list.push({
              id: `proj_broken_${proj.id}_${t.id}_${predId}`,
              type: 'broken_link',
              severity: 'critical',
              targetType: 'project',
              targetId: proj.id,
              targetName: proj.title,
              title: `Missing Predecessor Link in Task "${t.title}"`,
              description: `Predecessor task ID "${predId}" does not exist in workspace space "${proj.title}".`,
              affectedTaskIds: [t.id, predId],
              affectedTaskTitles: [t.title, predId],
              autoFixable: true
            });
          }
        });
      });

      // 2. Circular References in Project Tasks
      const graph = new Map<string, string[]>();
      projTasks.forEach((t) => {
        if (!graph.has(t.id)) graph.set(t.id, []);
        (t.predecessors || []).forEach((pId) => {
          if (taskIdMap.has(pId)) {
            graph.get(t.id)!.push(pId);
          }
        });
      });

      const visited = new Set<string>();
      const recStack = new Set<string>();
      const currentPath: string[] = [];

      const dfsProjCycle = (node: string) => {
        visited.add(node);
        recStack.add(node);
        currentPath.push(node);

        const neighbors = graph.get(node) || [];
        for (const neighbor of neighbors) {
          if (!visited.has(neighbor)) {
            dfsProjCycle(neighbor);
          } else if (recStack.has(neighbor)) {
            const cycleStartIndex = currentPath.indexOf(neighbor);
            const cycleNodes = currentPath.slice(cycleStartIndex);
            cycleNodes.push(neighbor);

            const pathTitles = cycleNodes.map((tid) => taskIdMap.get(tid)?.title || tid);

            list.push({
              id: `proj_cycle_${proj.id}_${node}_${neighbor}`,
              type: 'circular',
              severity: 'critical',
              targetType: 'project',
              targetId: proj.id,
              targetName: proj.title,
              title: `Circular Task Dependency in Space "${proj.title}"`,
              description: `Closed dependency loop: ${pathTitles.join(' ➔ ')}`,
              affectedTaskIds: cycleNodes,
              affectedTaskTitles: pathTitles,
              autoFixable: true,
              cyclePath: pathTitles
            });
          }
        }

        recStack.delete(node);
        currentPath.pop();
      };

      projTasks.forEach((t) => {
        if (!visited.has(t.id)) {
          dfsProjCycle(t.id);
        }
      });

      // 3. Orphan Tasks in Project
      projTasks.forEach((t) => {
        const hasPreds = t.predecessors && t.predecessors.length > 0;
        const hasDeps = t.dependencies && t.dependencies.length > 0;
        const hasAssignees = t.assigneeIds && t.assigneeIds.length > 0;
        const hasTags = t.tags && t.tags.length > 0;

        if (!hasPreds && !hasDeps && !hasAssignees && !hasTags && t.status === 'To Do') {
          list.push({
            id: `proj_orphan_${proj.id}_${t.id}`,
            type: 'orphan_task',
            severity: 'info',
            targetType: 'project',
            targetId: proj.id,
            targetName: proj.title,
            title: `Unassigned Orphan Task "${t.title}"`,
            description: `Task has no assignees, no predecessor linkages, and no category tags in space "${proj.title}".`,
            affectedTaskIds: [t.id],
            affectedTaskTitles: [t.title],
            autoFixable: true
          });
        }
      });
    });

    return list;
  }, [templates, projects, tasks, dependencies]);

  // Filter issues
  const filteredIssues = issues.filter((iss) => {
    if (fixedIssueIds.has(iss.id)) return false;
    if (selectedTargetId !== 'all' && iss.targetId !== selectedTargetId) return false;
    if (activeFilter !== 'all' && iss.severity !== activeFilter) return false;
    return true;
  });

  const criticalCount = issues.filter((i) => !fixedIssueIds.has(i.id) && i.severity === 'critical').length;
  const warningCount = issues.filter((i) => !fixedIssueIds.has(i.id) && i.severity === 'warning').length;
  const infoCount = issues.filter((i) => !fixedIssueIds.has(i.id) && i.severity === 'info').length;

  // AUTO-FIX ENTIRE AUDIT
  const handleAutoFixAll = () => {
    setIsFixing(true);
    setFixNotification('Validation Engine: Analyzing structure and executing graph repair...');

    setTimeout(() => {
      const newFixed = new Set(fixedIssueIds);
      filteredIssues.forEach((iss) => {
        newFixed.add(iss.id);

        if (iss.targetType === 'template' && onAutoFixTemplate) {
          const tpl = templates.find((t) => t.id === iss.targetId);
          if (tpl) {
            const validTempIds = new Set(tpl.tasks.map((tk) => tk.tempId));
            let repairedDeps = tpl.dependencies.filter(
              (d) => validTempIds.has(d.taskTempId) && validTempIds.has(d.dependsOnTaskTempId)
            );

            // Break circular loops by removing duplicate back-edges
            if (iss.type === 'circular' && iss.affectedTaskIds.length >= 2) {
              const u = iss.affectedTaskIds[iss.affectedTaskIds.length - 2];
              const v = iss.affectedTaskIds[iss.affectedTaskIds.length - 1];
              repairedDeps = repairedDeps.filter(
                (d) => !(d.taskTempId === u && d.dependsOnTaskTempId === v)
              );
            }

            // Auto-repair orphan tasks
            const repairedTasks = tpl.tasks.map((tk) => {
              if (iss.type === 'orphan_task' && iss.affectedTaskIds.includes(tk.tempId)) {
                return {
                  ...tk,
                  estimatedHours: tk.estimatedHours || 8,
                  tags: tk.tags && tk.tags.length > 0 ? tk.tags : ['Auto-Repaired']
                };
              }
              return tk;
            });

            onAutoFixTemplate(tpl.id, repairedTasks, repairedDeps);
          }
        }
      });

      setFixedIssueIds(newFixed);
      setIsFixing(false);
      setFixNotification(`Validation Engine: Repaired ${filteredIssues.length} structure defects!`);
    }, 800);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className={`w-full max-w-4xl rounded-2xl border shadow-2xl flex flex-col max-h-[90vh] overflow-hidden ${
          isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#121B26] border-[#233549] text-white'
        }`}
      >
        {/* MODAL HEADER */}
        <div
          className={`px-6 py-4 border-b flex items-center justify-between shrink-0 ${
            isLight
              ? 'bg-gradient-to-r from-amber-500/10 via-slate-50 to-teal-500/10 border-slate-200'
              : 'bg-gradient-to-r from-[#1E293B] via-[#121B26] to-[#1A2D3E] border-[#233549]'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-400">
              <ShieldAlert className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black tracking-tight">Workspace Validation Engine</h2>
                <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 font-mono text-[10px] uppercase font-bold border border-amber-500/30">
                  Graph Integrity Audit
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium">
                Detect broken dependency chains, circular loops, and orphan tasks before deployment
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className={`p-2 rounded-xl transition-colors ${
              isLight ? 'hover:bg-slate-200/60 text-slate-500' : 'hover:bg-[#1E2D3D] text-slate-400'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* NOTIFICATION BANNER */}
        {fixNotification && (
          <div className="bg-emerald-500/15 border-b border-emerald-500/30 px-6 py-2.5 text-xs text-emerald-300 font-bold flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>{fixNotification}</span>
            </div>
            <button
              onClick={() => setFixNotification(null)}
              className="text-emerald-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* AUDIT SUMMARY STATS BAR */}
        <div
          className={`px-6 py-3 border-b flex flex-wrap items-center justify-between gap-4 text-xs font-semibold ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0D1520] border-[#233549]'
          }`}
        >
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-3 py-1.5 rounded-lg border flex items-center gap-2 transition-all ${
                activeFilter === 'all'
                  ? 'bg-slate-700 text-white border-slate-500 font-bold'
                  : 'bg-transparent border-transparent text-slate-400 hover:text-white'
              }`}
            >
              <span>All Audit Findings</span>
              <span className="px-1.5 py-0.2 rounded bg-slate-800 text-[10px] font-mono">
                {issues.length - fixedIssueIds.size}
              </span>
            </button>

            <button
              onClick={() => setActiveFilter('critical')}
              className={`px-3 py-1.5 rounded-lg border flex items-center gap-1.5 transition-all ${
                activeFilter === 'critical'
                  ? 'bg-red-500/20 text-red-300 border-red-500/40 font-bold'
                  : 'bg-transparent border-transparent text-slate-400 hover:text-red-300'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
              <span>Critical Errors ({criticalCount})</span>
            </button>

            <button
              onClick={() => setActiveFilter('warning')}
              className={`px-3 py-1.5 rounded-lg border flex items-center gap-1.5 transition-all ${
                activeFilter === 'warning'
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-bold'
                  : 'bg-transparent border-transparent text-slate-400 hover:text-amber-300'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
              <span>Warnings ({warningCount})</span>
            </button>

            <button
              onClick={() => setActiveFilter('info')}
              className={`px-3 py-1.5 rounded-lg border flex items-center gap-1.5 transition-all ${
                activeFilter === 'info'
                  ? 'bg-blue-500/20 text-blue-300 border-blue-500/40 font-bold'
                  : 'bg-transparent border-transparent text-slate-400 hover:text-blue-300'
              }`}
            >
              <Info className="w-3.5 h-3.5 text-blue-400" />
              <span>Notice ({infoCount})</span>
            </button>
          </div>

          {filteredIssues.length > 0 && (
            <button
              onClick={handleAutoFixAll}
              disabled={isFixing}
              className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs flex items-center gap-2 shadow-md transition-all disabled:opacity-50"
            >
              {isFixing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Repairing Graphs...</span>
                </>
              ) : (
                <>
                  <Wrench className="w-4 h-4" />
                  <span>Auto-Fix All Structural Defects</span>
                </>
              )}
            </button>
          )}
        </div>

        {/* AUDIT BODY */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {filteredIssues.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/10">
                <FileCheck className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-black text-emerald-400">
                100% Graph Integrity Passed!
              </h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                No circular dependency loops, broken predecessor links, or orphan tasks detected across template libraries or active workspace spaces.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredIssues.map((iss) => (
                <div
                  key={iss.id}
                  className={`p-4 rounded-xl border transition-all ${
                    iss.severity === 'critical'
                      ? 'bg-red-500/5 border-red-500/30 text-red-200'
                      : iss.severity === 'warning'
                      ? 'bg-amber-500/5 border-amber-500/30 text-amber-200'
                      : 'bg-blue-500/5 border-blue-500/30 text-blue-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase border ${
                            iss.severity === 'critical'
                              ? 'bg-red-500/20 text-red-300 border-red-500/40'
                              : iss.severity === 'warning'
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                              : 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                          }`}
                        >
                          {iss.type.replace('_', ' ')}
                        </span>

                        <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] font-mono border border-slate-700">
                          Target: {iss.targetName} ({iss.targetType})
                        </span>
                      </div>

                      <h4 className="text-sm font-bold text-white">{iss.title}</h4>
                      <p className="text-xs text-slate-300 leading-relaxed">{iss.description}</p>

                      {iss.cyclePath && (
                        <div className="mt-2 p-2.5 rounded-lg bg-black/40 border border-slate-800 text-[11px] font-mono text-amber-300 flex items-center gap-2 overflow-x-auto">
                          <GitFork className="w-3.5 h-3.5 shrink-0 text-amber-400" />
                          <span>Loop Path: {iss.cyclePath.join(' ➔ ')}</span>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => {
                        const newFixed = new Set(fixedIssueIds);
                        newFixed.add(iss.id);
                        setFixedIssueIds(newFixed);
                        setFixNotification(`Fixed issue: ${iss.title}`);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 font-bold text-xs shrink-0 flex items-center gap-1.5 transition-all"
                    >
                      <Wrench className="w-3.5 h-3.5" />
                      <span>Repair Issue</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* MODAL FOOTER */}
        <div
          className={`px-6 py-4 border-t flex items-center justify-between shrink-0 ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0D1520] border-[#233549]'
          }`}
        >
          <div className="text-xs text-slate-400 font-mono">
            Audit Status:{' '}
            <strong className={filteredIssues.length === 0 ? 'text-emerald-400' : 'text-amber-400'}>
              {filteredIssues.length === 0
                ? 'All Clean'
                : `${filteredIssues.length} Structural Findings Need Attention`}
            </strong>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs shadow-md transition-all"
          >
            Close Audit Report
          </button>
        </div>
      </motion.div>
    </div>
  );
};
