import React from 'react';
import { Users, Clock } from 'lucide-react';
import { User, Task, TimeEntry } from '../../types';

export interface WorkloadSummaryWidgetProps {
  theme?: 'dark' | 'light';
  users: User[];
  tasks: Task[];
  timeEntries: TimeEntry[];
}

export const WorkloadSummaryWidget: React.FC<WorkloadSummaryWidgetProps> = ({
  theme = 'dark',
  users,
  tasks,
  timeEntries
}) => {
  const userWorkload = users.map((user) => {
    const userEntries = timeEntries.filter((t) => t.userId === user.id);
    const totalHours = userEntries.reduce((sum, e) => sum + (e.hours || 0), 0);
    const activeTasks = tasks.filter(
      (t) => t.status !== 'Done' && t.assigneeIds && t.assigneeIds.includes(user.id)
    );
    return {
      user,
      hours: Math.round(totalHours * 10) / 10,
      activeTaskCount: activeTasks.length
    };
  });

  const totalLoggedHours = Math.round(
    timeEntries.reduce((acc, curr) => acc + (curr.hours || 0), 0) * 10
  ) / 10;

  return (
    <div className="p-5 sm:p-6 space-y-4">
      <div className="flex items-center justify-between border-b border-slate-200/20 pb-3">
        <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
          <Clock className="w-3.5 h-3.5" />
          <span>Logged Time & Active Loads</span>
        </div>
        <span className="text-[11px] text-[#3BC0BB] font-mono font-bold">{totalLoggedHours}h Total</span>
      </div>

      <div className="space-y-3 max-h-[340px] overflow-y-auto pr-1">
        {userWorkload.map(({ user, hours, activeTaskCount }) => {
          const maxHours = Math.max(40, totalLoggedHours || 1);
          const percentage = Math.min(100, Math.round((hours / maxHours) * 100));

          return (
            <div
              key={user.id}
              className={`p-3 rounded-xl border flex items-center gap-3 ${
                theme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-[#0D1520] border-[#233549]'
              }`}
            >
              <img
                src={user.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                alt={user.name}
                className="w-8 h-8 rounded-full object-cover ring-1 ring-[#0773BB]"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between text-xs">
                  <span className={`font-bold truncate ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
                    {user.name}
                  </span>
                  <span className="font-mono font-bold text-[#3BC0BB]">{hours} hrs</span>
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-400 mt-0.5">
                  <span>{user.role}</span>
                  <span>{activeTaskCount} Active Task(s)</span>
                </div>
                <div className="mt-1.5 w-full bg-slate-700/30 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-indigo-500 h-full transition-all rounded-full"
                    style={{ width: `${Math.max(10, percentage)}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
