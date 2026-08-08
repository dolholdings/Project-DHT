import React, { useState, useMemo } from 'react';
import {
  X,
  Users,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Zap,
  ArrowRight,
  Search,
  Building,
  Briefcase,
  ShieldAlert,
  TrendingUp,
  Plus,
  Minus,
  RefreshCw,
  SlidersHorizontal,
  Layers,
  ChevronDown,
  ChevronUp,
  PieChart,
  Info,
  Check,
  UserCheck,
  UserX,
  ListTodo,
  ExternalLink
} from 'lucide-react';
import { User, Project, Task } from '../../types';

interface ResourceCapacityPlannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: User[];
  projects: Project[];
  tasks: Task[];
  onUpdateUser: (userId: string, updates: Partial<User>) => void;
  onUpdateTask?: (taskId: string, updates: Partial<Task>) => void;
}

export const ResourceCapacityPlannerModal: React.FC<ResourceCapacityPlannerModalProps> = ({
  isOpen,
  onClose,
  users,
  projects,
  tasks,
  onUpdateUser,
  onUpdateTask
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [allocationFilter, setAllocationFilter] = useState<'all' | 'over' | 'optimal' | 'under'>('all');
  const [expandedUserIds, setExpandedUserIds] = useState<Record<string, boolean>>({});
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editingHours, setEditingHours] = useState<number>(40);
  const [activeTab, setActiveTab] = useState<'user_capacity' | 'project_heatmap' | 'rebalance'>('user_capacity');

  // Task reassignment modal / state
  const [reassignTask, setReassignTask] = useState<{ task: Task; currentUserId: string } | null>(null);
  const [targetUserId, setTargetUserId] = useState<string>('');

  if (!isOpen) return null;

  // Active projects mapping for fast lookup
  const activeProjectsMap = useMemo(() => {
    const map = new Map<string, Project>();
    projects.forEach((p) => {
      // Consider Planning & In Progress as active projects contributing to capacity
      if (p.status === 'In Progress' || p.status === 'Planning' || p.status === 'In Review') {
        map.set(p.id, p);
      }
    });
    return map;
  }, [projects]);

  // Compute capacity and allocations per user
  const userCapacities = useMemo(() => {
    return users.map((u) => {
      const maxHours = u.maxWeeklyHours || 40;

      // Find all active non-completed tasks assigned to this user
      const assignedTasks = tasks.filter((t) => {
        if (!t.assigneeIds || !t.assigneeIds.includes(u.id)) return false;
        if (t.status === 'Done') return false;
        // Check if task belongs to an active project
        return activeProjectsMap.has(t.projectId);
      });

      // Calculate total allocated hours. If task has multiple assignees, split estimatedHours proportionally
      const allocatedHours = assignedTasks.reduce((sum, task) => {
        const numAssignees = task.assigneeIds.length || 1;
        const hoursForThisUser = (task.estimatedHours || 8) / numAssignees;
        return sum + hoursForThisUser;
      }, 0);

      const roundedAllocated = Math.round(allocatedHours * 10) / 10;
      const utilization = Math.round((roundedAllocated / maxHours) * 100);

      // Get distinct active projects count
      const distinctProjectIds = new Set(assignedTasks.map((t) => t.projectId));

      let status: 'over' | 'optimal' | 'under' = 'optimal';
      if (utilization > 100) {
        status = 'over';
      } else if (utilization < 75) {
        status = 'under';
      }

      return {
        user: u,
        maxHours,
        allocatedHours: roundedAllocated,
        utilization,
        status,
        assignedTasks,
        projectCount: distinctProjectIds.size,
        availableHours: Math.max(0, Math.round((maxHours - roundedAllocated) * 10) / 10),
        overHours: Math.max(0, Math.round((roundedAllocated - maxHours) * 10) / 10)
      };
    });
  }, [users, tasks, activeProjectsMap]);

  // Global aggregate metrics
  const globalMetrics = useMemo(() => {
    const totalUsers = userCapacities.length;
    const totalCapacity = userCapacities.reduce((sum, uc) => sum + uc.maxHours, 0);
    const totalAllocated = userCapacities.reduce((sum, uc) => sum + uc.allocatedHours, 0);
    const overAllocatedCount = userCapacities.filter((uc) => uc.status === 'over').length;
    const underAllocatedCount = userCapacities.filter((uc) => uc.status === 'under').length;
    const avgUtilization = totalCapacity > 0 ? Math.round((totalAllocated / totalCapacity) * 100) : 0;

    return {
      totalUsers,
      totalCapacity,
      totalAllocated: Math.round(totalAllocated),
      overAllocatedCount,
      underAllocatedCount,
      avgUtilization
    };
  }, [userCapacities]);

  // Filtered users list
  const filteredUserCapacities = useMemo(() => {
    return userCapacities.filter((uc) => {
      // Search
      const matchesSearch =
        uc.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        uc.user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (uc.user.department || '').toLowerCase().includes(searchQuery.toLowerCase());

      // Department
      const matchesDept =
        departmentFilter === 'all' ||
        (uc.user.department || '').toLowerCase() === departmentFilter.toLowerCase();

      // Status
      const matchesStatus =
        allocationFilter === 'all' ||
        uc.status === allocationFilter;

      return matchesSearch && matchesDept && matchesStatus;
    });
  }, [userCapacities, searchQuery, departmentFilter, allocationFilter]);

  // Distinct departments
  const departments = useMemo(() => {
    const set = new Set<string>();
    users.forEach((u) => {
      if (u.department) set.add(u.department);
    });
    return Array.from(set);
  }, [users]);

  // Toggle user expanded state
  const toggleExpandUser = (userId: string) => {
    setExpandedUserIds((prev) => ({
      ...prev,
      [userId]: !prev[userId]
    }));
  };

  // Handle saving inline capacity updates
  const handleSaveCapacity = (userId: string, newHours: number) => {
    const clamped = Math.max(5, Math.min(100, newHours));
    onUpdateUser(userId, { maxWeeklyHours: clamped });
    setEditingUserId(null);
  };

  // Quick set capacity for all users
  const handleSetAllCapacity = (hours: number) => {
    users.forEach((u) => {
      onUpdateUser(u.id, { maxWeeklyHours: hours });
    });
  };

  // Execute Task Reassignment
  const handleConfirmReassign = () => {
    if (!reassignTask || !targetUserId || !onUpdateTask) return;
    const task = reassignTask.task;
    const currentUserId = reassignTask.currentUserId;

    // Remove current user, add target user
    const updatedAssignees = task.assigneeIds
      .filter((id) => id !== currentUserId)
      .concat(targetUserId);

    // Remove duplicates
    const uniqueAssignees = Array.from(new Set(updatedAssignees));

    onUpdateTask(task.id, { assigneeIds: uniqueAssignees });
    setReassignTask(null);
    setTargetUserId('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5">
      <div className="bg-[#16222F] border border-[#233549] rounded-2xl w-full max-w-6xl h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95">
        
        {/* MODAL HEADER */}
        <div className="p-4 bg-[#0D1520] border-b border-[#233549] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30 shrink-0">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white">Resource Capacity & Allocation Planner</h2>
                {globalMetrics.overAllocatedCount > 0 && (
                  <span className="px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-mono font-bold flex items-center gap-1 animate-pulse">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    {globalMetrics.overAllocatedCount} Over-Allocated
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Define weekly available hours per team member, monitor real-time task load across active projects, and prevent burn-out.
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

        {/* METRICS SUMMARY BANNER */}
        <div className="p-4 bg-[#111A24] border-b border-[#233549] grid grid-cols-2 md:grid-cols-5 gap-3 text-xs shrink-0">
          <div className="p-3 bg-[#0D1520] border border-[#233549] rounded-xl space-y-1">
            <span className="text-slate-400 font-medium text-[11px]">Total Team Capacity</span>
            <div className="text-lg font-black text-white font-mono">{globalMetrics.totalCapacity} hrs/wk</div>
            <span className="text-[10px] text-slate-400 block">{globalMetrics.totalUsers} Active Members</span>
          </div>

          <div className="p-3 bg-[#0D1520] border border-[#233549] rounded-xl space-y-1">
            <span className="text-slate-400 font-medium text-[11px]">Active Allocated Hours</span>
            <div className="text-lg font-black text-amber-300 font-mono">{globalMetrics.totalAllocated} hrs</div>
            <span className="text-[10px] text-slate-400 block">Across Active Tasks</span>
          </div>

          <div className="p-3 bg-[#0D1520] border border-[#233549] rounded-xl space-y-1">
            <span className="text-slate-400 font-medium text-[11px]">Avg Capacity Utilization</span>
            <div className="text-lg font-black text-indigo-300 font-mono">{globalMetrics.avgUtilization}%</div>
            <div className="w-full bg-slate-800 rounded-full h-1 mt-1 overflow-hidden">
              <div
                className={`h-1 rounded-full ${
                  globalMetrics.avgUtilization > 100
                    ? 'bg-rose-500'
                    : globalMetrics.avgUtilization > 80
                    ? 'bg-amber-400'
                    : 'bg-emerald-400'
                }`}
                style={{ width: `${Math.min(100, globalMetrics.avgUtilization)}%` }}
              />
            </div>
          </div>

          <div className="p-3 bg-[#0D1520] border border-rose-500/30 rounded-xl space-y-1">
            <span className="text-rose-400 font-medium text-[11px] flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              Over-Allocated
            </span>
            <div className="text-lg font-black text-rose-300 font-mono">{globalMetrics.overAllocatedCount} Users</div>
            <span className="text-[10px] text-rose-400/80 block">&gt; 100% Workload Cap</span>
          </div>

          <div className="p-3 bg-[#0D1520] border border-blue-500/30 rounded-xl space-y-1">
            <span className="text-blue-400 font-medium text-[11px] flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Under-Allocated
            </span>
            <div className="text-lg font-black text-blue-300 font-mono">{globalMetrics.underAllocatedCount} Users</div>
            <span className="text-[10px] text-blue-400/80 block">&lt; 75% Capacity</span>
          </div>
        </div>

        {/* TOOLBAR CONTROLS */}
        <div className="p-3 bg-[#0D1520] border-b border-[#233549] flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs shrink-0">
          <div className="flex items-center gap-2 flex-wrap">
            {/* View Tabs */}
            <div className="flex items-center bg-[#16222F] border border-[#233549] rounded-xl p-1 font-mono">
              <button
                onClick={() => setActiveTab('user_capacity')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                  activeTab === 'user_capacity'
                    ? 'bg-amber-500 text-black shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>User Capacity</span>
              </button>

              <button
                onClick={() => setActiveTab('project_heatmap')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                  activeTab === 'project_heatmap'
                    ? 'bg-amber-500 text-black shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <PieChart className="w-3.5 h-3.5" />
                <span>Project Matrix</span>
              </button>

              <button
                onClick={() => setActiveTab('rebalance')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                  activeTab === 'rebalance'
                    ? 'bg-amber-500 text-black shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Auto-Rebalancer</span>
              </button>
            </div>

            {/* Quick Presets */}
            <div className="flex items-center gap-1.5 ml-2">
              <span className="text-[10px] font-mono text-slate-400">Preset Capacity:</span>
              <button
                onClick={() => handleSetAllCapacity(40)}
                className="px-2 py-1 rounded bg-[#16222F] border border-[#233549] hover:border-amber-500/40 text-[11px] font-mono text-slate-300 hover:text-white"
                title="Set 40 hours per week for all team members"
              >
                40h All
              </button>
              <button
                onClick={() => handleSetAllCapacity(35)}
                className="px-2 py-1 rounded bg-[#16222F] border border-[#233549] hover:border-amber-500/40 text-[11px] font-mono text-slate-300 hover:text-white"
                title="Set 35 hours per week for all team members"
              >
                35h All
              </button>
              <button
                onClick={() => handleSetAllCapacity(45)}
                className="px-2 py-1 rounded bg-[#16222F] border border-[#233549] hover:border-amber-500/40 text-[11px] font-mono text-slate-300 hover:text-white"
                title="Set 45 hours per week for all team members"
              >
                45h All
              </button>
            </div>
          </div>

          {/* SEARCH AND FILTERS */}
          <div className="flex items-center gap-2">
            <div className="relative w-48">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search user..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-[#16222F] border border-[#233549] rounded-xl text-white focus:outline-none focus:border-amber-500 text-xs"
              />
            </div>

            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="bg-[#16222F] border border-[#233549] rounded-xl px-2.5 py-1.5 text-slate-200 text-xs focus:outline-none"
            >
              <option value="all">All Departments</option>
              {departments.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>

            <select
              value={allocationFilter}
              onChange={(e) => setAllocationFilter(e.target.value as any)}
              className="bg-[#16222F] border border-[#233549] rounded-xl px-2.5 py-1.5 text-slate-200 text-xs focus:outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="over">Over-Allocated (&gt;100%)</option>
              <option value="optimal">Optimal (75%-100%)</option>
              <option value="under">Under-Allocated (&lt;75%)</option>
            </select>
          </div>
        </div>

        {/* MAIN BODY AREA */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          
          {/* TAB 1: USER CAPACITY & WORKLOAD LIST */}
          {activeTab === 'user_capacity' && (
            <div className="space-y-3">
              {filteredUserCapacities.length === 0 ? (
                <div className="p-8 text-center bg-[#0D1520] border border-[#233549] rounded-xl text-slate-400 space-y-2">
                  <UserX className="w-8 h-8 text-slate-500 mx-auto" />
                  <p className="font-semibold text-sm">No team members match current capacity filters.</p>
                  <p className="text-xs text-slate-500">Try adjusting your department or search query above.</p>
                </div>
              ) : (
                filteredUserCapacities.map((uc) => {
                  const isExpanded = !!expandedUserIds[uc.user.id];
                  const isEditing = editingUserId === uc.user.id;

                  return (
                    <div
                      key={uc.user.id}
                      className={`bg-[#0D1520] border rounded-xl overflow-hidden transition-all ${
                        uc.status === 'over'
                          ? 'border-rose-500/50 shadow-lg shadow-rose-950/20'
                          : uc.status === 'under'
                          ? 'border-blue-500/30'
                          : 'border-[#233549]'
                      }`}
                    >
                      {/* USER ROW HEADER */}
                      <div className="p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-[#0D1520]">
                        {/* USER INFO */}
                        <div className="flex items-center gap-3 min-w-[240px]">
                          <img
                            src={uc.user.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                            alt={uc.user.name}
                            className="w-10 h-10 rounded-xl object-cover border border-[#233549] shrink-0"
                          />
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <h3 className="font-bold text-white text-sm truncate">{uc.user.name}</h3>
                              <span className="px-2 py-0.2 rounded bg-[#16222F] text-slate-400 border border-[#233549] text-[10px] font-mono">
                                {uc.user.role}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                              <span>{uc.user.department || 'General'}</span>
                              <span>•</span>
                              <span className="truncate">{uc.user.email}</span>
                            </div>
                          </div>
                        </div>

                        {/* CAPACITY EDIT & STATS */}
                        <div className="flex items-center gap-4 flex-1 justify-between md:justify-end">
                          {/* MAX CAPACITY EDITABLE CONTROL */}
                          <div className="flex items-center gap-2 bg-[#16222F] border border-[#233549] rounded-xl px-3 py-1.5 shrink-0">
                            <span className="text-[11px] text-slate-400 font-mono">Max Cap:</span>
                            {isEditing ? (
                              <div className="flex items-center gap-1">
                                <input
                                  type="number"
                                  min={5}
                                  max={100}
                                  value={editingHours}
                                  onChange={(e) => setEditingHours(Number(e.target.value))}
                                  className="w-14 bg-[#0D1520] border border-amber-500 rounded px-1 py-0.5 text-white font-mono text-xs text-center"
                                />
                                <span className="text-xs text-slate-400">h/wk</span>
                                <button
                                  onClick={() => handleSaveCapacity(uc.user.id, editingHours)}
                                  className="p-1 rounded bg-amber-500 text-black hover:bg-amber-400 transition-all ml-1"
                                  title="Save capacity limit"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-white text-xs">{uc.maxHours} hrs/wk</span>
                                <button
                                  onClick={() => {
                                    setEditingUserId(uc.user.id);
                                    setEditingHours(uc.maxHours);
                                  }}
                                  className="text-[10px] text-amber-400 hover:underline font-mono"
                                >
                                  Edit
                                </button>
                              </div>
                            )}
                          </div>

                          {/* ALLOCATED VS CAPACITY BAR */}
                          <div className="min-w-[180px] max-w-[240px] flex-1 space-y-1">
                            <div className="flex items-center justify-between text-xs font-mono">
                              <span className="text-slate-300 font-bold">{uc.allocatedHours} hrs allocated</span>
                              <span
                                className={`font-bold ${
                                  uc.status === 'over'
                                    ? 'text-rose-400'
                                    : uc.status === 'under'
                                    ? 'text-blue-400'
                                    : 'text-emerald-400'
                                }`}
                              >
                                {uc.utilization}%
                              </span>
                            </div>

                            {/* DUAL PROGRESS BAR */}
                            <div className="w-full bg-[#16222F] rounded-full h-2 overflow-hidden border border-[#233549] relative">
                              <div
                                className={`h-2 rounded-full transition-all ${
                                  uc.status === 'over'
                                    ? 'bg-gradient-to-r from-amber-500 to-rose-500 animate-pulse'
                                    : uc.status === 'under'
                                    ? 'bg-blue-400'
                                    : 'bg-emerald-400'
                                }`}
                                style={{ width: `${Math.min(100, uc.utilization)}%` }}
                              />
                            </div>
                          </div>

                          {/* STATUS BADGE */}
                          <div className="shrink-0 min-w-[120px] text-right">
                            {uc.status === 'over' ? (
                              <span className="px-2.5 py-1 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-500/40 text-xs font-bold font-mono inline-flex items-center gap-1">
                                <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                                +{uc.overHours}h Over!
                              </span>
                            ) : uc.status === 'under' ? (
                              <span className="px-2.5 py-1 rounded-xl bg-blue-500/20 text-blue-300 border border-blue-500/30 text-xs font-bold font-mono inline-flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5 text-blue-400" />
                                {uc.availableHours}h Free
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold font-mono inline-flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                                Optimal Cap
                              </span>
                            )}
                          </div>

                          {/* EXPAND TASKS ACCORDION BUTTON */}
                          <button
                            onClick={() => toggleExpandUser(uc.user.id)}
                            className="p-2 rounded-xl bg-[#16222F] hover:bg-[#1C2C3D] text-slate-300 border border-[#233549] transition-all flex items-center gap-1 text-xs font-mono shrink-0"
                            title="View assigned active tasks"
                          >
                            <span>{uc.assignedTasks.length} Tasks</span>
                            {isExpanded ? <ChevronUp className="w-4 h-4 text-amber-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                          </button>
                        </div>
                      </div>

                      {/* EXPANDED TASK DETAILS DRAWER */}
                      {isExpanded && (
                        <div className="p-3 bg-[#111A24] border-t border-[#233549] space-y-2 animate-in slide-in-from-top-2">
                          <div className="flex items-center justify-between text-xs text-slate-400 font-mono px-1">
                            <span>Assigned Active Tasks ({uc.assignedTasks.length}) across {uc.projectCount} Projects</span>
                            <span>Task Estimated Work Load</span>
                          </div>

                          {uc.assignedTasks.length === 0 ? (
                            <p className="text-xs text-slate-500 p-2 italic text-center">No active tasks assigned to this user.</p>
                          ) : (
                            <div className="space-y-1.5">
                              {uc.assignedTasks.map((task) => {
                                const proj = activeProjectsMap.get(task.projectId);
                                const estHours = Math.round(((task.estimatedHours || 8) / (task.assigneeIds.length || 1)) * 10) / 10;

                                return (
                                  <div
                                    key={task.id}
                                    className="p-2.5 rounded-lg bg-[#0D1520] border border-[#233549] flex items-center justify-between gap-3 text-xs"
                                  >
                                    <div className="min-w-0 flex-1">
                                      <div className="flex items-center gap-2">
                                        <span className="font-bold text-white truncate">{task.title}</span>
                                        <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                                          task.priority === 'Urgent' || task.priority === 'High'
                                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                            : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                                        }`}>
                                          {task.priority || 'Medium'}
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                                        <span className="text-teal-300 font-semibold">{proj?.title || 'Project Space'}</span>
                                        <span>•</span>
                                        <span>Due: {task.dueDate || 'No Date'}</span>
                                        <span>•</span>
                                        <span>Status: {task.status}</span>
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-3 shrink-0">
                                      <span className="font-mono font-bold text-amber-300 text-xs">
                                        {estHours} hrs
                                      </span>

                                      {/* REASSIGN BUTTON */}
                                      {onUpdateTask && (
                                        <button
                                          onClick={() => {
                                            setReassignTask({ task, currentUserId: uc.user.id });
                                            // Pre-select first under-allocated user
                                            const under = userCapacities.find((u) => u.user.id !== uc.user.id && u.status === 'under');
                                            setTargetUserId(under?.user.id || users.find((u) => u.id !== uc.user.id)?.id || '');
                                          }}
                                          className="px-2 py-1 rounded bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 border border-indigo-500/40 text-[10px] font-mono font-bold flex items-center gap-1 transition-all"
                                          title="Reassign this task to another user to balance workload"
                                        >
                                          <ArrowRight className="w-3 h-3 text-indigo-400" />
                                          <span>Reassign</span>
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* TAB 2: PROJECT WORKLOAD MATRIX */}
          {activeTab === 'project_heatmap' && (
            <div className="bg-[#0D1520] border border-[#233549] rounded-xl overflow-x-auto p-4 space-y-3">
              <div className="flex items-center justify-between text-xs text-white font-bold border-b border-[#233549] pb-2">
                <span>Project Resource Distribution Matrix</span>
                <span className="text-slate-400 font-mono text-[11px]">Hours assigned per project</span>
              </div>

              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#233549] text-slate-400 font-mono">
                    <th className="p-2">Team Member</th>
                    <th className="p-2">Total Capacity</th>
                    {projects.map((p) => (
                      <th key={p.id} className="p-2 text-center min-w-[100px] truncate" title={p.title}>
                        {p.code || p.title.slice(0, 10)}
                      </th>
                    ))}
                    <th className="p-2 text-right">Total Allocated</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#233549]">
                  {userCapacities.map((uc) => (
                    <tr key={uc.user.id} className="hover:bg-[#16222F]">
                      <td className="p-2 font-bold text-white flex items-center gap-2">
                        <img src={uc.user.avatar} className="w-6 h-6 rounded-lg object-cover" alt="" />
                        <span className="truncate max-w-[120px]">{uc.user.name}</span>
                      </td>
                      <td className="p-2 font-mono text-slate-300">{uc.maxHours}h</td>
                      {projects.map((p) => {
                        const projTasks = uc.assignedTasks.filter((t) => t.projectId === p.id);
                        const projHours = projTasks.reduce(
                          (sum, t) => sum + (t.estimatedHours || 8) / (t.assigneeIds.length || 1),
                          0
                        );
                        const rounded = Math.round(projHours * 10) / 10;

                        return (
                          <td key={p.id} className="p-2 text-center font-mono">
                            {rounded > 0 ? (
                              <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30 text-[11px]">
                                {rounded}h
                              </span>
                            ) : (
                              <span className="text-slate-600">-</span>
                            )}
                          </td>
                        );
                      })}
                      <td className="p-2 text-right font-mono font-bold">
                        <span className={uc.status === 'over' ? 'text-rose-400' : 'text-emerald-400'}>
                          {uc.allocatedHours}h
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 3: SMART AUTO-REBALANCER */}
          {activeTab === 'rebalance' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/30 space-y-2 text-xs">
                <div className="flex items-center gap-2 text-purple-300 font-bold text-sm">
                  <Zap className="w-5 h-5 text-purple-400" />
                  <span>Workload Rebalancing Engine</span>
                </div>
                <p className="text-purple-200/80 leading-relaxed">
                  Identifies over-allocated team members and suggests under-capacity users in similar departments to receive task assignments.
                </p>
              </div>

              {globalMetrics.overAllocatedCount === 0 ? (
                <div className="p-8 text-center bg-[#0D1520] border border-emerald-500/30 rounded-xl space-y-2">
                  <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
                  <h3 className="font-bold text-white text-base">Perfect Workload Balance Achieved!</h3>
                  <p className="text-xs text-slate-400">No team members are currently over 100% capacity.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {userCapacities
                    .filter((uc) => uc.status === 'over')
                    .map((overUser) => {
                      // Find suitable candidates with available hours
                      const availableCandidates = userCapacities.filter(
                        (uc) => uc.user.id !== overUser.user.id && uc.status === 'under'
                      );

                      return (
                        <div
                          key={overUser.user.id}
                          className="p-4 rounded-xl bg-[#0D1520] border border-rose-500/40 space-y-3"
                        >
                          <div className="flex items-center justify-between border-b border-[#233549] pb-2">
                            <div className="flex items-center gap-2">
                              <AlertTriangle className="w-4 h-4 text-rose-400" />
                              <span className="font-bold text-white text-sm">{overUser.user.name}</span>
                              <span className="text-xs text-rose-300 font-mono">
                                ({overUser.allocatedHours}h assigned / {overUser.maxHours}h max)
                              </span>
                            </div>
                            <span className="px-2.5 py-0.5 rounded bg-rose-500/20 text-rose-300 font-bold text-xs font-mono">
                              +{overUser.overHours}h Over-Allocated
                            </span>
                          </div>

                          <p className="text-xs text-slate-300">
                            Recommended reassignments to bring <strong>{overUser.user.name}</strong> back under 100%:
                          </p>

                          <div className="space-y-2">
                            {overUser.assignedTasks.slice(0, 3).map((task) => (
                              <div
                                key={task.id}
                                className="p-2.5 rounded-lg bg-[#16222F] border border-[#233549] flex items-center justify-between gap-3 text-xs"
                              >
                                <div>
                                  <span className="font-bold text-white">{task.title}</span>
                                  <span className="text-slate-400 ml-2 font-mono text-[11px]">
                                    ({task.estimatedHours || 8}h est)
                                  </span>
                                </div>

                                <div className="flex items-center gap-2">
                                  {availableCandidates.length > 0 ? (
                                    <button
                                      onClick={() => {
                                        setReassignTask({ task, currentUserId: overUser.user.id });
                                        setTargetUserId(availableCandidates[0].user.id);
                                      }}
                                      className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1 shadow"
                                    >
                                      <span>Transfer to {availableCandidates[0].user.name} ({availableCandidates[0].availableHours}h free)</span>
                                      <ArrowRight className="w-3.5 h-3.5" />
                                    </button>
                                  ) : (
                                    <span className="text-slate-500 text-[11px] italic">No under-capacity users available</span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* TASK REASSIGNMENT CONFIRMATION DIALOG */}
        {reassignTask && (
          <div className="fixed inset-0 z-60 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[#16222F] border border-[#233549] rounded-2xl w-full max-w-md p-5 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between border-b border-[#233549] pb-3">
                <h3 className="font-bold text-white text-base flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 text-amber-400" />
                  Reassign Task Workload
                </h3>
                <button onClick={() => setReassignTask(null)} className="text-slate-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2 text-xs">
                <p className="text-slate-300">
                  Task: <strong className="text-white">{reassignTask.task.title}</strong>
                </p>
                <p className="text-slate-300 font-mono">
                  Estimated Load: <strong className="text-amber-300">{reassignTask.task.estimatedHours || 8} Hours</strong>
                </p>

                <div className="pt-2 space-y-1">
                  <label className="block text-slate-300 font-bold">Select Target Team Member *</label>
                  <select
                    value={targetUserId}
                    onChange={(e) => setTargetUserId(e.target.value)}
                    className="w-full bg-[#0D1520] border border-[#233549] rounded-xl p-2 text-white font-semibold focus:outline-none focus:border-amber-500"
                  >
                    {users
                      .filter((u) => u.id !== reassignTask.currentUserId)
                      .map((u) => {
                        const uc = userCapacities.find((c) => c.user.id === u.id);
                        return (
                          <option key={u.id} value={u.id}>
                            {u.name} ({uc?.availableHours || 0}h free capacity - {u.department || 'General'})
                          </option>
                        );
                      })}
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#233549]">
                <button
                  onClick={() => setReassignTask(null)}
                  className="px-3.5 py-1.5 rounded-xl bg-[#0D1520] text-slate-300 text-xs"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmReassign}
                  disabled={!targetUserId}
                  className="px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs shadow disabled:opacity-50"
                >
                  Confirm Reassignment
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL FOOTER */}
        <div className="p-3 bg-[#0D1520] border-t border-[#233549] flex items-center justify-between text-xs shrink-0">
          <span className="text-slate-400 font-mono text-[11px]">
            ⚡ Capacity planning dynamically updates as task estimated hours or assignees change across projects.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-[#16222F] text-slate-300 hover:text-white font-semibold transition-all"
          >
            Close Planner
          </button>
        </div>

      </div>
    </div>
  );
};
