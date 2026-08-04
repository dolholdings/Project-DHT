import React from 'react';
import { Network, Calendar, CheckCircle2, ChevronRight, Zap } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const TimelineView: React.FC = () => {
  const { projects, tasks, activeCompany } = useApp();

  const companyProjects = projects.filter((p) => p.companyId === activeCompany.id);

  const quarters = [
    { name: 'Q2 2026 (Apr - Jun)', active: false },
    { name: 'Q3 2026 (Jul - Sep)', active: true },
    { name: 'Q4 2026 (Oct - Dec)', active: false },
    { name: 'Q1 2027 (Jan - Mar)', active: false },
  ];

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto animate-in fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Network className="w-6 h-6 text-[#3BC0BB]" />
            <span>Roadmap & Quarterly Timeline</span>
          </h1>
          <p className="text-xs text-slate-400">
            Macro-level strategic milestone timeline for {activeCompany.name}.
          </p>
        </div>
      </div>

      <div className="p-6 rounded-2xl bg-[#16222F]/80 backdrop-blur-md border border-[#233549] space-y-6 shadow-xl">
        {/* Quarters Bar */}
        <div className="grid grid-cols-4 gap-2 border-b border-[#233549] pb-4">
          {quarters.map((q) => (
            <div
              key={q.name}
              className={`p-3 rounded-xl border text-center font-mono text-xs font-bold ${
                q.active
                  ? 'bg-[#0773BB]/20 border-[#0773BB] text-[#3BC0BB]'
                  : 'bg-[#0D1520] border-[#233549] text-slate-400'
              }`}
            >
              {q.name}
            </div>
          ))}
        </div>

        {/* Strategic Streams */}
        <div className="space-y-4">
          {companyProjects.map((p) => {
            const pTasks = tasks.filter((t) => t.projectId === p.id);
            return (
              <div
                key={p.id}
                className="p-5 rounded-xl bg-[#0D1520] border border-[#233549] space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono font-bold px-2.5 py-1 rounded bg-[#0773BB]/20 text-[#3BC0BB]">
                      {p.code}
                    </span>
                    <h3 className="text-base font-bold text-white">{p.title}</h3>
                  </div>
                  <span className="text-xs font-mono text-slate-400">
                    {p.startDate} ➔ {p.dueDate}
                  </span>
                </div>

                {/* Milestone nodes */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                  {pTasks.slice(0, 3).map((t) => (
                    <div
                      key={t.id}
                      className="p-3 rounded-lg bg-[#16222F] border border-[#233549] space-y-1"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-white truncate">{t.title}</span>
                        <span
                          className={`text-[9px] px-1.5 py-0.2 rounded font-mono ${
                            t.status === 'Done'
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : 'bg-amber-500/20 text-amber-400'
                          }`}
                        >
                          {t.status}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        Target: {t.dueDate}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
