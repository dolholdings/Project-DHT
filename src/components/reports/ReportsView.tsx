import React from 'react';
import { BarChart3, Download, TrendingUp, PieChart, CheckCircle, Clock } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart as RePieChart,
  Pie,
  Cell
} from 'recharts';
import { useApp } from '../../context/AppContext';

export const ReportsView: React.FC = () => {
  const { projects, tasks, timeEntries, activeCompany } = useApp();

  const companyProjects = projects.filter((p) => p.companyId === activeCompany.id);
  const companyTasks = tasks.filter((t) => t.companyId === activeCompany.id);

  // Data for Project Budget Bar Chart
  const budgetData = companyProjects.map((p) => ({
    name: p.code,
    Budget: p.budget,
    Spent: p.spentBudget,
  }));

  // Data for Task Status Pie Chart
  const statusCounts = {
    Done: companyTasks.filter((t) => t.status === 'Done').length,
    'In Progress': companyTasks.filter((t) => t.status === 'In Progress').length,
    'To Do': companyTasks.filter((t) => t.status === 'To Do').length,
    Backlog: companyTasks.filter((t) => t.status === 'Backlog').length,
  };

  const pieData = Object.keys(statusCounts).map((key) => ({
    name: key,
    value: (statusCounts as any)[key],
  }));

  const COLORS = ['#3BC0BB', '#0773BB', '#F59E0B', '#64748B'];

  const handleExportCsv = () => {
    const csvRows = [
      ['Task ID', 'Title', 'Status', 'Priority', 'Logged Hours', 'Estimated Hours', 'Due Date'],
      ...companyTasks.map((t) => [
        t.id,
        `"${t.title.replace(/"/g, '""')}"`,
        t.status,
        t.priority,
        t.loggedHours,
        t.estimatedHours,
        t.dueDate,
      ]),
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + csvRows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `dolphin_pm_report_${activeCompany.code}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-[#0773BB]" />
            <span>Executive Analytics & KPI Reports</span>
          </h1>
          <p className="text-xs text-slate-400">
            Performance metrics, budget burn rate, and operational velocity reports.
          </p>
        </div>

        <button
          onClick={handleExportCsv}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0773BB] hover:bg-[#0773BB]/80 text-white font-medium text-xs shadow-lg shadow-[#0773BB]/30 transition-all"
        >
          <Download className="w-4 h-4" />
          <span>Export CSV Report</span>
        </button>
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Project Budget vs Spent */}
        <div className="p-6 rounded-2xl bg-[#16222F]/80 backdrop-blur-md border border-[#233549] space-y-4 shadow-xl">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">
            Capital Budget vs Spent ($ USD)
          </h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={budgetData}>
                <XAxis dataKey="name" stroke="#94A3B8" />
                <YAxis stroke="#94A3B8" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0D1520', borderColor: '#233549' }}
                />
                <Bar dataKey="Budget" fill="#0773BB" radius={[6, 6, 0, 0]} />
                <Bar dataKey="Spent" fill="#3BC0BB" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Task Status Breakdown */}
        <div className="p-6 rounded-2xl bg-[#16222F]/80 backdrop-blur-md border border-[#233549] space-y-4 shadow-xl">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">
            Task Status Distribution
          </h2>
          <div className="h-64 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <RePieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#0D1520', borderColor: '#233549' }}
                />
              </RePieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-4 text-xs font-mono">
            {pieData.map((d, idx) => (
              <div key={d.name} className="flex items-center gap-1.5">
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                ></span>
                <span className="text-slate-300">{d.name}: {d.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
