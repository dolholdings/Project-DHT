import React from 'react';
import {
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  Columns,
  GanttChart,
  CalendarDays,
  Clock,
  Users,
  FileText,
  Activity,
  BarChart3,
  Bot,
  ShieldCheck,
  Server,
  MessageSquare,
  Network,
  Settings
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const Sidebar: React.FC = () => {
  const { activeTab, setActiveTab } = useApp();

  const navGroups = [
    {
      title: 'OVERVIEW & EXECUTION',
      items: [
        { id: 'dashboard', label: 'Command Center', icon: LayoutDashboard },
        { id: 'projects', label: 'Projects Portfolio', icon: FolderKanban },
        { id: 'tasks', label: 'Task Management', icon: CheckSquare },
        { id: 'kanban', label: 'Kanban Workflow', icon: Columns },
      ],
    },
    {
      title: 'TIMELINE & PLANNING',
      items: [
        { id: 'gantt', label: 'Gantt Chart', icon: GanttChart },
        { id: 'timeline', label: 'Roadmap Timeline', icon: Network },
        { id: 'calendar', label: 'Master Calendar', icon: CalendarDays },
        { id: 'workload', label: 'Resource Workload', icon: Users },
      ],
    },
    {
      title: 'COLLABORATION & ASSETS',
      items: [
        { id: 'chat', label: 'Team Chat & Mentions', icon: MessageSquare },
        { id: 'files', label: 'Document Vault & AI PDF', icon: FileText, badge: 'AI' },
        { id: 'logs', label: 'Audit Activity Logs', icon: Activity },
        { id: 'time', label: 'Time Tracking & Logs', icon: Clock },
      ],
    },
    {
      title: 'ANALYTICS & GOVERNANCE',
      items: [
        { id: 'reports', label: 'Reporting & KPI Charts', icon: BarChart3 },
        { id: 'automations', label: 'Automation Engine', icon: Bot },
        { id: 'users', label: 'Users & Domain Access', icon: ShieldCheck },
        { id: 'architecture', label: 'GoDaddy & MySQL Spec', icon: Server, badge: 'PHP 8.2' },
        { id: 'settings', label: 'System Settings & Export', icon: Settings, badge: 'EXPORT' },
      ],
    },
  ];

  return (
    <aside className="w-64 bg-[#0D1520] border-r border-[#233549] flex flex-col justify-between shrink-0 h-[calc(100vh-4rem)] overflow-y-auto">
      <div className="p-4 space-y-6">
        {/* Header Banner */}
        <div className="px-3 py-3 rounded-2xl bg-gradient-to-r from-[#16222F] to-[#0D1520] border border-[#233549]">
          <div className="overflow-hidden">
            <div className="text-xs font-bold text-white tracking-wider uppercase leading-tight">
              DOLPHIN GLOBAL HOLDINGS
            </div>
            <div className="text-[10px] font-semibold text-[#3BC0BB] uppercase tracking-wider mt-0.5">
              Project Management Tools
            </div>
          </div>
        </div>

        {/* Navigation Sections */}
        <nav className="space-y-6">
          {navGroups.map((group) => (
            <div key={group.title} className="space-y-1">
              <div className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                {group.title}
              </div>
              <div className="space-y-0.5 mt-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                        isActive
                          ? 'bg-[#0773BB] text-white shadow-lg shadow-[#0773BB]/20 font-semibold'
                          : 'text-slate-400 hover:text-white hover:bg-[#16222F]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                        <span>{item.label}</span>
                      </div>
                      {item.badge && (
                        <span
                          className={`text-[9px] px-1.5 py-0.5 rounded-full font-mono font-bold ${
                            isActive
                              ? 'bg-white/20 text-white'
                              : 'bg-[#3BC0BB]/20 text-[#3BC0BB]'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </div>

      {/* Footer Info Box */}
      <div className="p-4 border-t border-[#233549] bg-[#16222F]/50">
        <div className="p-3 rounded-xl bg-[#0D1520] border border-[#233549] text-xs text-slate-400 space-y-1">
          <div className="flex items-center justify-between text-white font-medium">
            <span>Dolphin Group Cloud</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
          </div>
          <p className="text-[11px] text-slate-500">
            6 Corporate Whitelisted Domains Active
          </p>
        </div>
      </div>
    </aside>
  );
};
