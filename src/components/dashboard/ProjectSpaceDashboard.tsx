import React, { useState } from 'react';
import {
  LayoutDashboard,
  FolderKanban,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Users,
  DollarSign,
  Plus,
  ListTodo,
  TrendingUp,
  BarChart3,
  Calendar,
  Sparkles,
  ArrowRight,
  FileSpreadsheet,
  ChevronRight,
  Layers,
  Activity,
  UserCheck,
  Zap,
  Target
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Project, Task } from '../../types';

interface ProjectSpaceDashboardProps {
  onNavigateToTasks?: (listName?: string) => void;
  onOpenImportModal?: () => void;
  onOpenCreateTaskModal?: () => void;
}

export const ProjectSpaceDashboard: React.FC<ProjectSpaceDashboardProps> = ({
  onNavigateToTasks,
  onOpenImportModal,
  onOpenCreateTaskModal
}) => {
  const {
    projects,
    selectedProjectId,
    setSelectedProjectId,
    setSelectedListFilter,
    tasks,
    users,
    addListToProject,
    theme,
    logActivity,
    setActiveTab
  } = useApp();

  const isLight = theme === 'light';

  const [newListTitle, setNewListTitle] = useState('');
  const [showAddListInput, setShowAddListInput] = useState(false);

  // Active Project or default first project
  const currentProject = projects.find((p) => p.id === selectedProjectId) || projects[0] || null;

  if (!currentProject) {
    return (
      <div className={`p-8 text-center rounded-2xl border ${isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-[#121B26] border-[#233549] text-white'}`}>
        <FolderKanban className="w-12 h-12 mx-auto text-slate-400 mb-3" />
        <h3 className="text-lg font-bold">No Space or Project Selected</h3>
        <p className="text-sm text-slate-400 mt-1">Select a Space from the sidebar to view its dashboard.</p>
      </div>
    );
  }

  // Filter tasks for this project space
  const spaceTasks = tasks.filter((t) => t.projectId === currentProject.id);
  const totalTasks = spaceTasks.length;
  const completedTasks = spaceTasks.filter((t) => t.status === 'Done').length;
  const inProgressTasks = spaceTasks.filter((t) => t.status === 'In Progress').length;
  const inReviewTasks = spaceTasks.filter((t) => t.status === 'In Review').length;
  const toDoTasks = spaceTasks.filter((t) => t.status === 'To Do' || t.status === 'Backlog').length;

  // Overdue tasks
  const now = new Date();
  const overdueTasks = spaceTasks.filter((t) => {
    if (t.status === 'Done' || !t.dueDate) return false;
    return new Date(t.dueDate) < now;
  }).length;

  const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : currentProject.progress;

  // Total Hours
  const totalEstHours = spaceTasks.reduce((acc, t) => acc + (t.estimatedHours || 0), 0);
  const totalLoggedHours = spaceTasks.reduce((acc, t) => acc + (t.loggedHours || 0), 0);

  // Lists in this Space
  const lists = currentProject.lists || [];

  // Team Members in this Space
  const spaceMembers = users.filter((u) => currentProject.members?.includes(u.id));
  const manager = users.find((u) => u.id === currentProject.managerId);

  const handleAddList = (e: React.FormEvent) => {
    e.preventDefault();
    if (newListTitle.trim()) {
      addListToProject(currentProject.id, newListTitle.trim());
      logActivity({
        userId: manager?.id || 'usr_1',
        userName: manager?.name || 'Manager',
        action: 'Created List',
        details: `Added new List "${newListTitle.trim()}" in Space "${currentProject.title}"`,
        category: 'System Activity',
        relatedProjectId: currentProject.id
      });
      setNewListTitle('');
      setShowAddListInput(false);
    }
  };

  const handleOpenListTasks = (listName?: string) => {
    setSelectedProjectId(currentProject.id);
    setSelectedListFilter(listName || null);
    if (onNavigateToTasks) {
      onNavigateToTasks(listName);
    } else {
      setActiveTab('tasks');
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* 1. Space Header & Overview Banner */}
      <div className={`p-6 rounded-2xl border shadow-sm transition-all ${
        isLight
          ? 'bg-gradient-to-br from-white via-slate-50 to-teal-50/30 border-slate-200 text-slate-900'
          : 'bg-gradient-to-br from-[#121B26] via-[#16222F] to-[#0D1520] border-[#233549] text-white'
      }`}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2 max-w-3xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded-md ${
                isLight ? 'bg-teal-100 text-[#0D9488]' : 'bg-[#3BC0BB]/20 text-[#3BC0BB]'
              }`}>
                {currentProject.code}
              </span>
              <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                currentProject.status === 'In Progress'
                  ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                  : 'bg-amber-500/20 text-amber-600 dark:text-amber-400'
              }`}>
                {currentProject.status}
              </span>
              <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
                isLight ? 'bg-slate-200 text-slate-700' : 'bg-[#233549] text-slate-300'
              }`}>
                {currentProject.category}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {currentProject.title}
            </h1>
            <p className={`text-xs sm:text-sm leading-relaxed ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
              {currentProject.description || 'Enterprise project space for managing work streams, tasks, and deliverables.'}
            </p>

            {/* Manager & Timeline */}
            <div className="flex flex-wrap items-center gap-4 text-xs pt-2">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-[#0D9488] dark:text-[#3BC0BB]" />
                <span className="font-medium text-slate-500 dark:text-slate-400">Lead Manager:</span>
                <span className="font-bold">{manager?.name || 'Project Lead'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#0D9488] dark:text-[#3BC0BB]" />
                <span className="font-medium text-slate-500 dark:text-slate-400">Timeline:</span>
                <span className="font-bold">{currentProject.startDate} to {currentProject.dueDate}</span>
              </div>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => handleOpenListTasks()}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm ${
                isLight
                  ? 'bg-[#0D9488] text-white hover:bg-[#0F766E]'
                  : 'bg-[#0773BB] text-white hover:bg-[#0773BB]/80'
              }`}
            >
              <ListTodo className="w-4 h-4" />
              <span>View All Tasks</span>
            </button>
            {onOpenImportModal && (
              <button
                onClick={onOpenImportModal}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all ${
                  isLight
                    ? 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
                    : 'bg-[#16222F] border-[#233549] text-slate-200 hover:bg-[#233549]'
                }`}
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
                <span>Import Tasks</span>
              </button>
            )}
          </div>
        </div>

        {/* Space Progress Bar */}
        <div className="mt-6 pt-4 border-t border-slate-200/60 dark:border-[#233549]/60 space-y-1.5">
          <div className="flex justify-between items-center text-xs font-bold">
            <span className="flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-[#0D9488] dark:text-[#3BC0BB]" />
              <span>Overall Space Execution Progress</span>
            </span>
            <span className="text-[#0D9488] dark:text-[#3BC0BB]">{progressPercent}%</span>
          </div>
          <div className={`w-full h-3 rounded-full overflow-hidden ${isLight ? 'bg-slate-200' : 'bg-[#233549]'}`}>
            <div
              className="h-full bg-gradient-to-r from-[#0D9488] to-emerald-400 rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* 2. Key KPI Metric Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className={`p-4 rounded-xl border ${isLight ? 'bg-white border-slate-200' : 'bg-[#121B26] border-[#233549]'}`}>
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Total Tasks</span>
            <FolderKanban className="w-4 h-4 text-teal-500" />
          </div>
          <div className="text-2xl font-black mt-2">{totalTasks}</div>
          <div className="text-[10px] text-slate-400 mt-1">In this space</div>
        </div>

        <div className={`p-4 rounded-xl border ${isLight ? 'bg-white border-slate-200' : 'bg-[#121B26] border-[#233549]'}`}>
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Completed</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black mt-2 text-emerald-600 dark:text-emerald-400">{completedTasks}</div>
          <div className="text-[10px] text-emerald-600/80 mt-1">{totalTasks > 0 ? Math.round((completedTasks/totalTasks)*100) : 0}% done</div>
        </div>

        <div className={`p-4 rounded-xl border ${isLight ? 'bg-white border-slate-200' : 'bg-[#121B26] border-[#233549]'}`}>
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>In Progress</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black mt-2 text-amber-600 dark:text-amber-400">{inProgressTasks}</div>
          <div className="text-[10px] text-slate-400 mt-1">Active execution</div>
        </div>

        <div className={`p-4 rounded-xl border ${isLight ? 'bg-white border-slate-200' : 'bg-[#121B26] border-[#233549]'}`}>
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Overdue</span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-black mt-2 text-rose-600 dark:text-rose-400">{overdueTasks}</div>
          <div className="text-[10px] text-rose-500/80 mt-1">Action required</div>
        </div>

        <div className={`p-4 rounded-xl border ${isLight ? 'bg-white border-slate-200' : 'bg-[#121B26] border-[#233549]'}`}>
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Logged Hours</span>
            <BarChart3 className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-black mt-2">{totalLoggedHours}h</div>
          <div className="text-[10px] text-slate-400 mt-1">of {totalEstHours}h est.</div>
        </div>

        <div className={`p-4 rounded-xl border ${isLight ? 'bg-white border-slate-200' : 'bg-[#121B26] border-[#233549]'}`}>
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Budget Spent</span>
            <DollarSign className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black mt-2">${(currentProject.spentBudget || 0).toLocaleString()}</div>
          <div className="text-[10px] text-slate-400 mt-1">of ${(currentProject.budget || 0).toLocaleString()}</div>
        </div>
      </div>

      {/* 3. ClickUp Lists inside this Space */}
      <div className={`p-6 rounded-2xl border ${isLight ? 'bg-white border-slate-200' : 'bg-[#121B26] border-[#233549]'}`}>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-lg font-extrabold flex items-center gap-2">
              <ListTodo className="w-5 h-5 text-[#0D9488] dark:text-[#3BC0BB]" />
              <span>Lists in "{currentProject.title}" Space</span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-mono font-bold ${
                isLight ? 'bg-teal-100 text-[#0D9488]' : 'bg-[#233549] text-[#3BC0BB]'
              }`}>
                {lists.length} Lists
              </span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Click on any list to view and manage tasks dedicated to that list.
            </p>
          </div>

          {!showAddListInput ? (
            <button
              onClick={() => setShowAddListInput(true)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                isLight
                  ? 'bg-[#0D9488]/10 text-[#0D9488] hover:bg-[#0D9488]/20'
                  : 'bg-[#3BC0BB]/20 text-[#3BC0BB] hover:bg-[#3BC0BB]/30'
              }`}
            >
              <Plus className="w-4 h-4" />
              <span>+ Create List</span>
            </button>
          ) : (
            <form onSubmit={handleAddList} className="flex items-center gap-2">
              <input
                type="text"
                value={newListTitle}
                onChange={(e) => setNewListTitle(e.target.value)}
                placeholder="Enter list title..."
                autoFocus
                className={`text-xs px-3 py-1.5 rounded-xl border outline-none ${
                  isLight
                    ? 'bg-white border-[#0D9488] text-slate-900'
                    : 'bg-[#16222F] border-[#3BC0BB] text-white'
                }`}
              />
              <button
                type="submit"
                className="px-3 py-1.5 bg-[#0D9488] text-white rounded-xl text-xs font-bold hover:bg-[#0F766E]"
              >
                Add
              </button>
              <button
                type="button"
                onClick={() => setShowAddListInput(false)}
                className="px-2 py-1.5 text-slate-400 hover:text-slate-200 text-xs"
              >
                Cancel
              </button>
            </form>
          )}
        </div>

        {lists.length === 0 ? (
          <div className="p-8 text-center border border-dashed rounded-xl my-2">
            <p className="text-sm text-slate-500">No lists created in this space yet.</p>
            <button
              onClick={() => setShowAddListInput(true)}
              className="mt-2 px-3 py-1.5 bg-[#0D9488] text-white rounded-lg text-xs font-bold"
            >
              + Create First List
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {lists.map((listName) => {
              const listTasks = spaceTasks.filter((t) => t.listName === listName);
              const listTotal = listTasks.length;
              const listDone = listTasks.filter((t) => t.status === 'Done').length;
              const listPct = listTotal > 0 ? Math.round((listDone / listTotal) * 100) : 0;

              return (
                <div
                  key={listName}
                  onClick={() => handleOpenListTasks(listName)}
                  className={`group p-4 rounded-xl border transition-all cursor-pointer hover:shadow-md ${
                    isLight
                      ? 'bg-slate-50 hover:bg-white border-slate-200 hover:border-[#0D9488]'
                      : 'bg-[#16222F] hover:bg-[#1f2f40] border-[#233549] hover:border-[#3BC0BB]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2 truncate">
                      <ListTodo className="w-4 h-4 text-[#0D9488] dark:text-[#3BC0BB] shrink-0" />
                      <h3 className="font-bold text-sm truncate">{listName}</h3>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform shrink-0" />
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                    <span>{listTotal} Tasks</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">{listPct}% Done</span>
                  </div>

                  <div className={`w-full h-1.5 rounded-full overflow-hidden ${isLight ? 'bg-slate-200' : 'bg-[#233549]'}`}>
                    <div
                      className="h-full bg-gradient-to-r from-[#0D9488] to-emerald-400 rounded-full transition-all"
                      style={{ width: `${listPct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. Task Status & Team Workload in Space */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Task Breakdown Chart/List */}
        <div className={`p-6 rounded-2xl border ${isLight ? 'bg-white border-slate-200' : 'bg-[#121B26] border-[#233549]'}`}>
          <h3 className="text-base font-extrabold flex items-center gap-2 mb-4">
            <BarChart3 className="w-5 h-5 text-[#0D9488] dark:text-[#3BC0BB]" />
            <span>Task Status Breakdown</span>
          </h3>

          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-emerald-600 dark:text-emerald-400">Done ({completedTasks})</span>
                <span>{totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0}%` }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-amber-600 dark:text-amber-400">In Progress ({inProgressTasks})</span>
                <span>{totalTasks > 0 ? Math.round((inProgressTasks / totalTasks) * 100) : 0}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800">
                <div className="h-full bg-amber-500 rounded-full" style={{ width: `${totalTasks > 0 ? (inProgressTasks / totalTasks) * 100 : 0}%` }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-indigo-600 dark:text-indigo-400">In Review ({inReviewTasks})</span>
                <span>{totalTasks > 0 ? Math.round((inReviewTasks / totalTasks) * 100) : 0}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800">
                <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${totalTasks > 0 ? (inReviewTasks / totalTasks) * 100 : 0}%` }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-slate-600 dark:text-slate-400">To Do & Backlog ({toDoTasks})</span>
                <span>{totalTasks > 0 ? Math.round((toDoTasks / totalTasks) * 100) : 0}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800">
                <div className="h-full bg-slate-400 rounded-full" style={{ width: `${totalTasks > 0 ? (toDoTasks / totalTasks) * 100 : 0}%` }} />
              </div>
            </div>
          </div>
        </div>

        {/* Space Team Members */}
        <div className={`p-6 rounded-2xl border ${isLight ? 'bg-white border-slate-200' : 'bg-[#121B26] border-[#233549]'}`}>
          <h3 className="text-base font-extrabold flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-[#0D9488] dark:text-[#3BC0BB]" />
            <span>Space Team Assigned Members ({spaceMembers.length})</span>
          </h3>

          <div className="space-y-3">
            {spaceMembers.slice(0, 5).map((member) => {
              const memberTasks = spaceTasks.filter((t) => t.assigneeIds.includes(member.id));
              return (
                <div key={member.id} className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-800/60">
                  <div className="flex items-center gap-3">
                    <img src={member.avatar} alt={member.name} className="w-8 h-8 rounded-full object-cover" />
                    <div>
                      <div className="font-bold text-xs">{member.name}</div>
                      <div className="text-[10px] text-slate-400">{member.role}</div>
                    </div>
                  </div>
                  <div className="text-right text-xs">
                    <div className="font-bold">{memberTasks.length} tasks</div>
                    <div className="text-[10px] text-emerald-500">{memberTasks.filter(t => t.status === 'Done').length} done</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
