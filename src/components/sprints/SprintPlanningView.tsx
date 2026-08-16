import React, { useState, useMemo } from 'react';
import {
  Flame,
  Plus,
  Calendar,
  Target,
  CheckCircle2,
  Clock,
  ArrowRight,
  Sparkles,
  Layers,
  ChevronDown,
  ChevronRight,
  SlidersHorizontal,
  FolderKanban,
  Play,
  RotateCcw,
  Check,
  X,
  AlertCircle,
  MoreVertical,
  Trash2,
  Edit2
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Sprint, Task, TaskStatus, Priority } from '../../types';
import { PriorityBadge } from '../common/PriorityBadge';
import { getStatusBadgeStyle } from '../kanban/KanbanView';

interface SprintPlanningViewProps {
  onSelectTask?: (taskId: string) => void;
}

export const SprintPlanningView: React.FC<SprintPlanningViewProps> = ({ onSelectTask }) => {
  const {
    tasks,
    sprints,
    projects,
    users,
    selectedProjectId,
    addTask,
    updateTask,
    addSprint,
    updateSprint,
    deleteSprint,
    completeSprint,
    moveTaskToSprint,
    theme,
    currentUser
  } = useApp();

  const isLight = theme === 'light';

  // Sprint Creation / Edit Modal State
  const [isSprintModalOpen, setIsSprintModalOpen] = useState(false);
  const [editingSprint, setEditingSprint] = useState<Sprint | null>(null);
  const [sprintName, setSprintName] = useState('');
  const [sprintGoal, setSprintGoal] = useState('');
  const [sprintStartDate, setSprintStartDate] = useState('');
  const [sprintEndDate, setSprintEndDate] = useState('');
  const [sprintTargetPoints, setSprintTargetPoints] = useState<number>(30);

  // Complete Sprint Modal State
  const [completingSprint, setCompletingSprint] = useState<Sprint | null>(null);
  const [rolloverTargetSprintId, setRolloverTargetSprintId] = useState<string>('backlog');

  // Quick Inline Add Task to Sprint or Backlog
  const [quickAddSprintId, setQuickAddSprintId] = useState<string | null | 'backlog'>(null);
  const [quickTaskTitle, setQuickTaskTitle] = useState('');
  const [quickTaskPoints, setQuickTaskPoints] = useState<number>(3);

  // Section collapse state
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});

  const toggleSection = (key: string) => {
    setCollapsedSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Filter sprints for current selected project or show all
  const filteredSprints = useMemo(() => {
    if (!selectedProjectId || selectedProjectId === 'all') {
      return sprints;
    }
    return sprints.filter((s) => s.projectId === selectedProjectId);
  }, [sprints, selectedProjectId]);

  // Project tasks
  const projectTasks = useMemo(() => {
    if (!selectedProjectId || selectedProjectId === 'all') {
      return tasks;
    }
    return tasks.filter((t) => t.projectId === selectedProjectId);
  }, [tasks, selectedProjectId]);

  const activeSprint = useMemo(() => {
    return filteredSprints.find((s) => s.status === 'active');
  }, [filteredSprints]);

  const futureSprints = useMemo(() => {
    return filteredSprints.filter((s) => s.status === 'future');
  }, [filteredSprints]);

  const completedSprints = useMemo(() => {
    return filteredSprints.filter((s) => s.status === 'completed');
  }, [filteredSprints]);

  const backlogTasks = useMemo(() => {
    return projectTasks.filter((t) => !t.sprintId);
  }, [projectTasks]);

  // Helper to calculate sprint metrics
  const getSprintMetrics = (sprintId: string) => {
    const sprintTasks = projectTasks.filter((t) => t.sprintId === sprintId);
    const totalPoints = sprintTasks.reduce(
      (sum, t) => sum + (t.storyPoints || (t.estimatedHours ? Math.ceil(t.estimatedHours / 4) : 1)),
      0
    );
    const completedTasks = sprintTasks.filter((t) => t.status === 'Done');
    const completedPoints = completedTasks.reduce(
      (sum, t) => sum + (t.storyPoints || (t.estimatedHours ? Math.ceil(t.estimatedHours / 4) : 1)),
      0
    );
    const progressPercent = totalPoints > 0 ? Math.round((completedPoints / totalPoints) * 100) : 0;
    return { sprintTasks, totalPoints, completedTasks, completedPoints, progressPercent };
  };

  const handleOpenCreateSprint = () => {
    const today = new Date();
    const inTwoWeeks = new Date(Date.now() + 14 * 86400000);
    const nextSprintNum = sprints.length + 1;

    setEditingSprint(null);
    setSprintName(`Sprint ${nextSprintNum}`);
    setSprintGoal('');
    setSprintStartDate(today.toISOString().split('T')[0]);
    setSprintEndDate(inTwoWeeks.toISOString().split('T')[0]);
    setSprintTargetPoints(35);
    setIsSprintModalOpen(true);
  };

  const handleOpenEditSprint = (sprint: Sprint) => {
    setEditingSprint(sprint);
    setSprintName(sprint.name);
    setSprintGoal(sprint.goal || '');
    setSprintStartDate(sprint.startDate);
    setSprintEndDate(sprint.endDate);
    setSprintTargetPoints(sprint.targetStoryPoints || 30);
    setIsSprintModalOpen(true);
  };

  const handleSaveSprint = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sprintName.trim()) return;

    const projId = selectedProjectId && selectedProjectId !== 'all' ? selectedProjectId : projects[0]?.id || 'proj_1';

    if (editingSprint) {
      updateSprint(editingSprint.id, {
        name: sprintName.trim(),
        goal: sprintGoal.trim() || undefined,
        startDate: sprintStartDate,
        endDate: sprintEndDate,
        targetStoryPoints: sprintTargetPoints
      });
    } else {
      addSprint({
        projectId: projId,
        name: sprintName.trim(),
        goal: sprintGoal.trim() || undefined,
        status: filteredSprints.some((s) => s.status === 'active') ? 'future' : 'active',
        startDate: sprintStartDate,
        endDate: sprintEndDate,
        targetStoryPoints: sprintTargetPoints,
        completedStoryPoints: 0
      });
    }

    setIsSprintModalOpen(false);
  };

  const handleStartSprint = (sprintId: string) => {
    updateSprint(sprintId, { status: 'active' });
  };

  const handleQuickAddTask = (targetSprintId: string | null) => {
    if (!quickTaskTitle.trim()) return;

    const projId = selectedProjectId && selectedProjectId !== 'all' ? selectedProjectId : projects[0]?.id || 'proj_1';
    const proj = projects.find((p) => p.id === projId);

    addTask({
      projectId: projId,
      companyId: proj ? proj.companyId : 'comp_1',
      title: quickTaskTitle.trim(),
      description: targetSprintId ? 'Added to Sprint during agile planning' : 'Added to Product Backlog',
      status: 'To Do',
      priority: 'Medium',
      assigneeIds: [currentUser?.id || 'usr_pk'],
      reporterId: currentUser?.id || 'usr_1',
      startDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      estimatedHours: quickTaskPoints * 4,
      storyPoints: quickTaskPoints,
      sprintId: targetSprintId,
      tags: ['Sprint']
    });

    setQuickTaskTitle('');
    setQuickAddSprintId(null);
  };

  const handleConfirmCompleteSprint = () => {
    if (!completingSprint) return;
    const rolloverId = rolloverTargetSprintId === 'backlog' ? null : rolloverTargetSprintId;
    completeSprint(completingSprint.id, rolloverId);
    setCompletingSprint(null);
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* HEADER CONTROLS */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-orange-500/15 text-orange-400 border border-orange-500/30">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <h2 className={`text-lg font-black tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
                Sprint Planning & Agile Backlog
              </h2>
              <p className="text-xs text-slate-400">
                Lightweight iteration cycles, story point estimation, and deliverable prioritization
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleOpenCreateSprint}
            className="px-4 py-2 rounded-xl bg-[#0773BB] hover:bg-[#0773BB]/80 text-white text-xs font-bold shadow-lg shadow-[#0773BB]/25 transition-all flex items-center gap-1.5 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Create Sprint</span>
          </button>
        </div>
      </div>

      {/* ACTIVE SPRINT HERO CARD */}
      {activeSprint && (
        <div
          className={`p-5 rounded-2xl border shadow-xl relative overflow-hidden ${
            isLight
              ? 'bg-gradient-to-r from-teal-50 via-white to-sky-50 border-teal-200'
              : 'bg-gradient-to-r from-[#0D2538] via-[#121B26] to-[#0D1F2D] border-[#3BC0BB]/40 shadow-[#3BC0BB]/5'
          }`}
        >
          {/* Subtle Decorative Aura */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-[#3BC0BB]/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

          {(() => {
            const metrics = getSprintMetrics(activeSprint.id);
            return (
              <div className="relative z-10 space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2.5">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#3BC0BB]/20 text-[#3BC0BB] border border-[#3BC0BB]/40">
                        ⚡ Active Sprint
                      </span>
                      <h3 className={`text-base font-black ${isLight ? 'text-slate-900' : 'text-white'}`}>
                        {activeSprint.name}
                      </h3>
                    </div>
                    {activeSprint.goal && (
                      <p className="text-xs text-slate-300 flex items-center gap-1.5 pt-0.5">
                        <Target className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span><strong>Goal:</strong> {activeSprint.goal}</span>
                      </p>
                    )}
                  </div>

                  {/* Actions & Dates */}
                  <div className="flex items-center gap-3">
                    <div className="text-right hidden sm:block">
                      <div className="flex items-center gap-1 text-[11px] font-mono text-slate-400">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{activeSprint.startDate} → {activeSprint.endDate}</span>
                      </div>
                      <p className="text-[10px] text-slate-400">
                        {metrics.completedTasks.length} of {metrics.sprintTasks.length} tasks completed
                      </p>
                    </div>

                    <button
                      onClick={() => handleOpenEditSprint(activeSprint)}
                      className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/40 border border-slate-700/50 transition-colors"
                      title="Edit Sprint Settings"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => setCompletingSprint(activeSprint)}
                      className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 transition-all flex items-center gap-1.5 active:scale-95"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Complete Sprint</span>
                    </button>
                  </div>
                </div>

                {/* Progress Bar & Story Points Burndown summary */}
                <div className="space-y-1.5 pt-2">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <Flame className="w-3.5 h-3.5 text-orange-400" />
                      <span>Sprint Velocity & Completion</span>
                    </span>
                    <span className={isLight ? 'text-slate-900' : 'text-white'}>
                      <strong className="text-[#3BC0BB]">{metrics.completedPoints}</strong> /{' '}
                      {metrics.totalPoints} Story Points ({metrics.progressPercent}%)
                    </span>
                  </div>

                  <div className="w-full h-2.5 rounded-full bg-slate-800/70 overflow-hidden p-0.5 border border-slate-700/50">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#0773BB] to-[#3BC0BB] transition-all duration-500"
                      style={{ width: `${Math.min(metrics.progressPercent, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* SPRINT LISTINGS & BACKLOG */}
      <div className="space-y-6">
        {/* 1. ACTIVE SPRINT TASKS SECTION */}
        {activeSprint && (
          <SprintSectionCard
            title={activeSprint.name}
            statusBadge="Active"
            sprint={activeSprint}
            tasks={projectTasks.filter((t) => t.sprintId === activeSprint.id)}
            users={users}
            isLight={isLight}
            isCollapsed={!!collapsedSections[activeSprint.id]}
            onToggleCollapse={() => toggleSection(activeSprint.id)}
            onSelectTask={onSelectTask}
            onMoveToBacklog={(taskId) => moveTaskToSprint(taskId, null)}
            onUpdateTask={updateTask}
            onQuickAddOpen={() => setQuickAddSprintId(activeSprint.id)}
            isQuickAddOpen={quickAddSprintId === activeSprint.id}
            quickTaskTitle={quickTaskTitle}
            setQuickTaskTitle={setQuickTaskTitle}
            quickTaskPoints={quickTaskPoints}
            setQuickTaskPoints={setQuickTaskPoints}
            onSubmitQuickAdd={() => handleQuickAddTask(activeSprint.id)}
            onCancelQuickAdd={() => setQuickAddSprintId(null)}
          />
        )}

        {/* 2. FUTURE / UPCOMING SPRINTS */}
        {futureSprints.map((sprint) => (
          <SprintSectionCard
            key={sprint.id}
            title={sprint.name}
            statusBadge="Upcoming"
            sprint={sprint}
            tasks={projectTasks.filter((t) => t.sprintId === sprint.id)}
            users={users}
            isLight={isLight}
            isCollapsed={!!collapsedSections[sprint.id]}
            onToggleCollapse={() => toggleSection(sprint.id)}
            onSelectTask={onSelectTask}
            onStartSprint={() => handleStartSprint(sprint.id)}
            onMoveToBacklog={(taskId) => moveTaskToSprint(taskId, null)}
            onUpdateTask={updateTask}
            onQuickAddOpen={() => setQuickAddSprintId(sprint.id)}
            isQuickAddOpen={quickAddSprintId === sprint.id}
            quickTaskTitle={quickTaskTitle}
            setQuickTaskTitle={setQuickTaskTitle}
            quickTaskPoints={quickTaskPoints}
            setQuickTaskPoints={setQuickTaskPoints}
            onSubmitQuickAdd={() => handleQuickAddTask(sprint.id)}
            onCancelQuickAdd={() => setQuickAddSprintId(null)}
            onDeleteSprint={() => deleteSprint(sprint.id)}
          />
        ))}

        {/* 3. PRODUCT BACKLOG SECTION */}
        <div
          className={`rounded-2xl border overflow-hidden shadow-lg ${
            isLight ? 'bg-white border-slate-200' : 'bg-[#121B26] border-[#233549]'
          }`}
        >
          <div
            className={`p-4 border-b flex items-center justify-between cursor-pointer select-none ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#16222F] border-[#233549]'
            }`}
            onClick={() => toggleSection('backlog')}
          >
            <div className="flex items-center gap-3">
              <button className="p-1 rounded text-slate-400 hover:text-white">
                {collapsedSections['backlog'] ? (
                  <ChevronRight className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>

              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-purple-400" />
                <h3 className={`text-sm font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  Product Backlog
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/15 text-purple-300 border border-purple-500/30">
                  {backlogTasks.length} Tasks
                </span>
                <span className="text-xs text-slate-400 hidden sm:inline">
                  (Total: {backlogTasks.reduce((sum, t) => sum + (t.storyPoints || 1), 0)} pts)
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => setQuickAddSprintId('backlog')}
                className="px-3 py-1.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/40 text-purple-300 text-xs font-bold transition-all flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add to Backlog</span>
              </button>
            </div>
          </div>

          {!collapsedSections['backlog'] && (
            <div className="divide-y divide-[#233549]/50">
              {/* Inline Quick Add for Backlog */}
              {quickAddSprintId === 'backlog' && (
                <div className="p-3 bg-[#0D1520] border-b border-[#233549] flex items-center gap-2">
                  <input
                    type="text"
                    autoFocus
                    placeholder="Enter backlog task title..."
                    value={quickTaskTitle}
                    onChange={(e) => setQuickTaskTitle(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleQuickAddTask(null)}
                    className="flex-1 px-3 py-1.5 text-xs rounded-xl bg-[#16222F] border border-[#233549] text-white focus:outline-none focus:border-[#3BC0BB]"
                  />
                  <div className="flex items-center gap-1 text-xs text-slate-400">
                    <span>Pts:</span>
                    <select
                      value={quickTaskPoints}
                      onChange={(e) => setQuickTaskPoints(Number(e.target.value))}
                      className="px-2 py-1 text-xs rounded-lg bg-[#16222F] border border-[#233549] text-white focus:outline-none"
                    >
                      {[1, 2, 3, 5, 8, 13].map((pt) => (
                        <option key={pt} value={pt}>
                          {pt}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    onClick={() => handleQuickAddTask(null)}
                    className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold"
                  >
                    Add
                  </button>
                  <button
                    onClick={() => setQuickAddSprintId(null)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {backlogTasks.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500">
                  No backlog tasks remaining. All items are assigned to active or upcoming sprints!
                </div>
              ) : (
                backlogTasks.map((task) => (
                  <SprintTaskRow
                    key={task.id}
                    task={task}
                    users={users}
                    isLight={isLight}
                    onSelectTask={onSelectTask}
                    onUpdateTask={updateTask}
                    availableSprints={filteredSprints.filter((s) => s.status !== 'completed')}
                    onAssignToSprint={(sprintId) => moveTaskToSprint(task.id, sprintId)}
                  />
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* SPRINT CREATE / EDIT MODAL */}
      {isSprintModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div
            className={`w-full max-w-lg rounded-2xl border shadow-2xl overflow-hidden ${
              isLight ? 'bg-white border-slate-200' : 'bg-[#121B26] border-[#233549]'
            }`}
          >
            <div
              className={`p-4 border-b flex items-center justify-between ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#16222F] border-[#233549]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Flame className="w-5 h-5 text-orange-400" />
                <h3 className={`text-base font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  {editingSprint ? 'Edit Sprint' : 'Create New Sprint'}
                </h3>
              </div>
              <button
                onClick={() => setIsSprintModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSprint} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">Sprint Name</label>
                <input
                  type="text"
                  required
                  value={sprintName}
                  onChange={(e) => setSprintName(e.target.value)}
                  placeholder="e.g. Sprint 2 - Quality & Validation"
                  className={`w-full px-3 py-2 text-xs rounded-xl border focus:outline-none focus:border-[#3BC0BB] ${
                    isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-[#16222F] border-[#233549] text-white'
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">Sprint Goal</label>
                <input
                  type="text"
                  value={sprintGoal}
                  onChange={(e) => setSprintGoal(e.target.value)}
                  placeholder="e.g. Deliver compliance audit report & initial client testing"
                  className={`w-full px-3 py-2 text-xs rounded-xl border focus:outline-none focus:border-[#3BC0BB] ${
                    isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-[#16222F] border-[#233549] text-white'
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">Start Date</label>
                  <input
                    type="date"
                    required
                    value={sprintStartDate}
                    onChange={(e) => setSprintStartDate(e.target.value)}
                    className={`w-full px-3 py-2 text-xs rounded-xl border focus:outline-none focus:border-[#3BC0BB] ${
                      isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-[#16222F] border-[#233549] text-white'
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">End Date</label>
                  <input
                    type="date"
                    required
                    value={sprintEndDate}
                    onChange={(e) => setSprintEndDate(e.target.value)}
                    className={`w-full px-3 py-2 text-xs rounded-xl border focus:outline-none focus:border-[#3BC0BB] ${
                      isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-[#16222F] border-[#233549] text-white'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Target Story Points Capacity
                </label>
                <input
                  type="number"
                  min="1"
                  max="500"
                  value={sprintTargetPoints}
                  onChange={(e) => setSprintTargetPoints(Number(e.target.value))}
                  className={`w-full px-3 py-2 text-xs rounded-xl border focus:outline-none focus:border-[#3BC0BB] ${
                    isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-[#16222F] border-[#233549] text-white'
                  }`}
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsSprintModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#0773BB] hover:bg-[#0773BB]/80 text-white text-xs font-bold shadow-lg shadow-[#0773BB]/30"
                >
                  {editingSprint ? 'Update Sprint' : 'Create Sprint'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* COMPLETE SPRINT MODAL */}
      {completingSprint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div
            className={`w-full max-w-md rounded-2xl border shadow-2xl overflow-hidden ${
              isLight ? 'bg-white border-slate-200' : 'bg-[#121B26] border-[#233549]'
            }`}
          >
            <div
              className={`p-4 border-b flex items-center justify-between ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#16222F] border-[#233549]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <h3 className={`text-base font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  Complete {completingSprint.name}
                </h3>
              </div>
              <button
                onClick={() => setCompletingSprint(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {(() => {
                const metrics = getSprintMetrics(completingSprint.id);
                const incompleteTasks = metrics.sprintTasks.filter((t) => t.status !== 'Done');

                return (
                  <div className="space-y-4 text-xs">
                    <div className="p-3.5 rounded-xl bg-[#0D1520] border border-[#233549] space-y-1.5">
                      <p className="text-slate-300">
                        ✅ <strong className="text-emerald-400">{metrics.completedTasks.length} tasks</strong> completed ({metrics.completedPoints} pts)
                      </p>
                      <p className="text-slate-300">
                        ⚠️ <strong className="text-amber-400">{incompleteTasks.length} tasks</strong> remaining incomplete
                      </p>
                    </div>

                    {incompleteTasks.length > 0 && (
                      <div>
                        <label className="block font-bold text-slate-300 mb-1.5">
                          Move incomplete tasks to:
                        </label>
                        <select
                          value={rolloverTargetSprintId}
                          onChange={(e) => setRolloverTargetSprintId(e.target.value)}
                          className="w-full px-3 py-2 text-xs rounded-xl bg-[#16222F] border border-[#233549] text-white focus:outline-none"
                        >
                          <option value="backlog">📦 Product Backlog</option>
                          {futureSprints.map((fs) => (
                            <option key={fs.id} value={fs.id}>
                              🚀 {fs.name} (Upcoming)
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    <div className="flex items-center justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setCompletingSprint(null)}
                        className="px-4 py-2 rounded-xl font-bold text-slate-400 hover:text-white"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleConfirmCompleteSprint}
                        className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-lg shadow-emerald-600/30"
                      >
                        Confirm & Complete Sprint
                      </button>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* SPRINT SECTION CARD COMPONENT */
interface SprintSectionCardProps {
  title: string;
  statusBadge: 'Active' | 'Upcoming' | 'Completed';
  sprint: Sprint;
  tasks: Task[];
  users: any[];
  isLight: boolean;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onSelectTask?: (taskId: string) => void;
  onStartSprint?: () => void;
  onMoveToBacklog: (taskId: string) => void;
  onUpdateTask: (id: string, updates: Partial<Task>) => void;
  onQuickAddOpen: () => void;
  isQuickAddOpen: boolean;
  quickTaskTitle: string;
  setQuickTaskTitle: (v: string) => void;
  quickTaskPoints: number;
  setQuickTaskPoints: (v: number) => void;
  onSubmitQuickAdd: () => void;
  onCancelQuickAdd: () => void;
  onDeleteSprint?: () => void;
}

const SprintSectionCard: React.FC<SprintSectionCardProps> = ({
  title,
  statusBadge,
  sprint,
  tasks,
  users,
  isLight,
  isCollapsed,
  onToggleCollapse,
  onSelectTask,
  onStartSprint,
  onMoveToBacklog,
  onUpdateTask,
  onQuickAddOpen,
  isQuickAddOpen,
  quickTaskTitle,
  setQuickTaskTitle,
  quickTaskPoints,
  setQuickTaskPoints,
  onSubmitQuickAdd,
  onCancelQuickAdd,
  onDeleteSprint
}) => {
  const totalPoints = tasks.reduce((sum, t) => sum + (t.storyPoints || 1), 0);
  const completedTasks = tasks.filter((t) => t.status === 'Done');

  return (
    <div
      className={`rounded-2xl border overflow-hidden shadow-lg ${
        isLight ? 'bg-white border-slate-200' : 'bg-[#121B26] border-[#233549]'
      }`}
    >
      {/* Section Header */}
      <div
        className={`p-4 border-b flex items-center justify-between cursor-pointer select-none ${
          isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#16222F] border-[#233549]'
        }`}
        onClick={onToggleCollapse}
      >
        <div className="flex items-center gap-3">
          <button className="p-1 rounded text-slate-400 hover:text-white">
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          <div className="flex items-center gap-2">
            <h3 className={`text-sm font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>{title}</h3>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                statusBadge === 'Active'
                  ? 'bg-[#3BC0BB]/20 text-[#3BC0BB] border border-[#3BC0BB]/40'
                  : 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
              }`}
            >
              {statusBadge}
            </span>
            <span className="text-xs text-slate-400 hidden sm:inline">
              ({tasks.length} tasks • {totalPoints} pts)
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          {onStartSprint && statusBadge === 'Upcoming' && (
            <button
              onClick={onStartSprint}
              className="px-3 py-1.5 rounded-xl bg-[#0773BB]/20 hover:bg-[#0773BB]/40 text-[#3BC0BB] text-xs font-bold border border-[#0773BB]/40 transition-all flex items-center gap-1.5"
            >
              <Play className="w-3 h-3 fill-current" />
              <span>Start Sprint</span>
            </button>
          )}

          <button
            onClick={onQuickAddOpen}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Task</span>
          </button>

          {onDeleteSprint && (
            <button
              onClick={onDeleteSprint}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
              title="Delete Sprint"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Task Rows */}
      {!isCollapsed && (
        <div className="divide-y divide-[#233549]/50">
          {isQuickAddOpen && (
            <div className="p-3 bg-[#0D1520] border-b border-[#233549] flex items-center gap-2">
              <input
                type="text"
                autoFocus
                placeholder="Enter task title for this sprint..."
                value={quickTaskTitle}
                onChange={(e) => setQuickTaskTitle(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && onSubmitQuickAdd()}
                className="flex-1 px-3 py-1.5 text-xs rounded-xl bg-[#16222F] border border-[#233549] text-white focus:outline-none focus:border-[#3BC0BB]"
              />
              <div className="flex items-center gap-1 text-xs text-slate-400">
                <span>Pts:</span>
                <select
                  value={quickTaskPoints}
                  onChange={(e) => setQuickTaskPoints(Number(e.target.value))}
                  className="px-2 py-1 text-xs rounded-lg bg-[#16222F] border border-[#233549] text-white focus:outline-none"
                >
                  {[1, 2, 3, 5, 8, 13].map((pt) => (
                    <option key={pt} value={pt}>
                      {pt}
                    </option>
                  ))}
                </select>
              </div>
              <button
                onClick={onSubmitQuickAdd}
                className="px-3 py-1.5 rounded-xl bg-[#0773BB] hover:bg-[#0773BB]/80 text-white text-xs font-bold"
              >
                Add
              </button>
              <button onClick={onCancelQuickAdd} className="p-1.5 rounded-lg text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {tasks.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">
              No tasks currently in this sprint. Drag or move tasks from the backlog below!
            </div>
          ) : (
            tasks.map((task) => (
              <SprintTaskRow
                key={task.id}
                task={task}
                users={users}
                isLight={isLight}
                onSelectTask={onSelectTask}
                onUpdateTask={onUpdateTask}
                onMoveToBacklog={() => onMoveToBacklog(task.id)}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
};

/* SPRINT TASK ROW */
interface SprintTaskRowProps {
  task: Task;
  users: any[];
  isLight: boolean;
  onSelectTask?: (taskId: string) => void;
  onUpdateTask: (id: string, updates: Partial<Task>) => void;
  onMoveToBacklog?: () => void;
  availableSprints?: Sprint[];
  onAssignToSprint?: (sprintId: string) => void;
}

const SprintTaskRow: React.FC<SprintTaskRowProps> = ({
  task,
  users,
  isLight,
  onSelectTask,
  onUpdateTask,
  onMoveToBacklog,
  availableSprints,
  onAssignToSprint
}) => {
  const assignees = users.filter((u) => task.assigneeIds?.includes(u.id));

  return (
    <div
      onClick={() => onSelectTask && onSelectTask(task.id)}
      className={`p-3.5 flex items-center justify-between gap-3 text-xs cursor-pointer transition-colors group ${
        isLight ? 'hover:bg-slate-50' : 'hover:bg-[#16222F]/60'
      }`}
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {/* Story Point Chip */}
        <div
          onClick={(e) => e.stopPropagation()}
          className="shrink-0"
          title="Story Point Estimate"
        >
          <select
            value={task.storyPoints || 3}
            onChange={(e) => onUpdateTask(task.id, { storyPoints: Number(e.target.value) })}
            className="w-10 text-center py-1 rounded-lg font-mono font-bold text-[11px] bg-slate-800 text-amber-400 border border-slate-700 focus:outline-none cursor-pointer"
          >
            {[1, 2, 3, 5, 8, 13].map((pt) => (
              <option key={pt} value={pt}>
                {pt}
              </option>
            ))}
          </select>
        </div>

        {/* Title & Tags */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span
              className={`font-bold truncate ${
                task.status === 'Done'
                  ? 'line-through text-slate-500'
                  : isLight
                  ? 'text-slate-900 group-hover:text-[#0773BB]'
                  : 'text-white group-hover:text-[#3BC0BB]'
              }`}
            >
              {task.title}
            </span>

            {task.isCriticalPath && (
              <span className="text-[10px] px-1.5 py-0.2 rounded font-black bg-rose-500/20 text-rose-400 border border-rose-500/30">
                CPM
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 pt-0.5 text-[11px] text-slate-400">
            <span>Due: {task.dueDate || 'No date'}</span>
            {task.tags && task.tags.length > 0 && (
              <span className="hidden sm:inline text-slate-500">• {task.tags.join(', ')}</span>
            )}
          </div>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3 shrink-0" onClick={(e) => e.stopPropagation()}>
        {/* Status Dropdown */}
        <select
          value={task.status}
          onChange={(e) => onUpdateTask(task.id, { status: e.target.value as TaskStatus })}
          className={`text-[11px] font-bold px-2 py-1 rounded-lg border focus:outline-none cursor-pointer ${
            task.status === 'Done'
              ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
              : task.status === 'In Progress'
              ? 'bg-[#7B68EE]/20 text-[#7B68EE] border-[#7B68EE]/40'
              : 'bg-slate-800 text-slate-300 border-slate-700'
          }`}
        >
          <option value="To Do">To Do</option>
          <option value="In Progress">In Progress</option>
          <option value="In Review">In Review</option>
          <option value="Done">Done</option>
        </select>

        {/* Priority */}
        <div className="hidden md:block">
          <PriorityBadge priority={task.priority} />
        </div>

        {/* Assignees */}
        <div className="flex items-center -space-x-1.5">
          {assignees.length > 0 ? (
            assignees.map((u) => (
              <img
                key={u.id}
                src={u.avatar}
                alt={u.name}
                title={u.name}
                className="w-5 h-5 rounded-full border border-slate-800 object-cover"
              />
            ))
          ) : (
            <span className="text-[10px] text-slate-500 italic">Unassigned</span>
          )}
        </div>

        {/* Move Actions */}
        {onMoveToBacklog ? (
          <button
            onClick={onMoveToBacklog}
            className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[10px] font-bold text-slate-300 transition-colors"
            title="Move back to backlog"
          >
            To Backlog
          </button>
        ) : availableSprints && onAssignToSprint ? (
          <select
            defaultValue=""
            onChange={(e) => {
              if (e.target.value) {
                onAssignToSprint(e.target.value);
              }
            }}
            className="text-[10px] font-bold px-2 py-1 rounded-lg bg-[#0773BB]/20 text-[#3BC0BB] border border-[#0773BB]/40 focus:outline-none cursor-pointer"
          >
            <option value="" disabled>
              + Move to Sprint
            </option>
            {availableSprints.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.status})
              </option>
            ))}
          </select>
        ) : null}
      </div>
    </div>
  );
};
