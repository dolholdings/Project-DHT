import React from 'react';
import { Users, Clock, AlertTriangle, CheckCircle2, Zap } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const WorkloadView: React.FC = () => {
  const { users, tasks, activeCompany } = useApp();

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-[#0773BB]" />
            <span>Resource Workload & Capacity Management</span>
          </h1>
          <p className="text-xs text-slate-400">
            Real-time capacity tracking, allocated hours vs availability, and overload prevention.
          </p>
        </div>
      </div>

      {/* Team Capacity Cards Grid */}
      <div className="space-y-4">
        {users.map((u) => {
          const userTasks = tasks.filter((t) => t.assigneeIds.includes(u.id) && t.status !== 'Done');
          const totalAssignedHours = userTasks.reduce((acc, curr) => acc + curr.estimatedHours, 0);
          const capacityPercent = Math.round((totalAssignedHours / u.maxWeeklyHours) * 100);
          const isOverloaded = capacityPercent > 100;

          return (
            <div
              key={u.id}
              className="p-5 rounded-2xl bg-[#16222F]/80 backdrop-blur-md border border-[#233549] hover:border-[#0773BB] transition-all space-y-4 shadow-xl"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <img
                    src={u.avatar}
                    alt={u.name}
                    className="w-12 h-12 rounded-2xl object-cover ring-2 ring-[#0773BB]"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-white">{u.name}</h3>
                      <span className="text-xs px-2 py-0.5 rounded bg-[#0D1520] text-[#3BC0BB] border border-[#233549] font-mono">
                        {u.role}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 font-mono">
                      {u.email} • {u.department}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs font-mono">
                  <div className="text-right">
                    <div className="text-slate-400">Allocated / Weekly Max</div>
                    <div className="font-bold text-white">
                      <span className={isOverloaded ? 'text-rose-400 font-bold' : 'text-[#3BC0BB]'}>
                        {totalAssignedHours}h
                      </span>{' '}
                      / {u.maxWeeklyHours}h
                    </div>
                  </div>

                  <span
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold ${
                      isOverloaded
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        : capacityPercent > 80
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    }`}
                  >
                    {capacityPercent}% Capacity
                  </span>
                </div>
              </div>

              {/* Capacity Progress Bar */}
              <div className="space-y-1">
                <div className="w-full bg-[#0D1520] h-3 rounded-full overflow-hidden p-0.5 border border-[#233549]">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isOverloaded
                        ? 'bg-rose-500 animate-pulse'
                        : capacityPercent > 80
                        ? 'bg-amber-400'
                        : 'bg-emerald-400'
                    }`}
                    style={{ width: `${Math.min(100, capacityPercent)}%` }}
                  ></div>
                </div>
              </div>

              {/* Active Tasks Assigned list */}
              <div className="pt-2 border-t border-[#233549]">
                <div className="text-xs font-bold text-slate-400 mb-2">
                  Active Tasks Assigned ({userTasks.length})
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                  {userTasks.map((t) => (
                    <div
                      key={t.id}
                      className="p-2.5 rounded-xl bg-[#0D1520] border border-[#233549] text-xs space-y-1"
                    >
                      <div className="font-bold text-white truncate">{t.title}</div>
                      <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                        <span>Est: {t.estimatedHours}h</span>
                        <span className="text-[#3BC0BB]">{t.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
