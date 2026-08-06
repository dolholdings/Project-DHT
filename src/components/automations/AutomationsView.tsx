import React, { useState } from 'react';
import { Bot, Plus, Zap, CheckCircle2, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const AutomationsView: React.FC = () => {
  const { automations, toggleAutomation, addAutomation, activeCompany, theme } = useApp();

  const [showModal, setShowModal] = useState(false);
  const [ruleName, setRuleName] = useState('');
  const [trigger, setTrigger] = useState<any>('status_changed');
  const [condition, setCondition] = useState('Status changes to Done');
  const [action, setAction] = useState<any>('send_email');
  const [actionTarget, setActionTarget] = useState('Project Manager');

  const handleAddRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ruleName) return;

    addAutomation({
      companyId: activeCompany.id,
      name: ruleName,
      trigger,
      condition,
      action,
      actionTarget,
      active: true,
    });

    setShowModal(false);
    setRuleName('');
  };

  return (
    <div className={`p-3.5 sm:p-6 space-y-6 w-full max-w-[1700px] mx-auto animate-in fade-in ${theme === 'light' ? 'text-slate-800' : 'text-slate-100'}`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className={`text-2xl font-bold tracking-tight flex items-center gap-2 ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
            <Bot className="w-6 h-6 text-[#3BC0BB]" />
            <span>Workflow Automation Engine</span>
          </h1>
          <p className={`text-xs ${theme === 'light' ? 'text-slate-600' : 'text-slate-400'}`}>
            Configure automated IF-THEN triggers for emails, escalation rules, and task assignment.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0773BB] hover:bg-[#0773BB]/80 text-white font-medium text-xs shadow-lg"
        >
          <Plus className="w-4 h-4" />
          <span>New Automation Rule</span>
        </button>
      </div>

      <div className="space-y-3">
        {automations.map((rule) => (
          <div
            key={rule.id}
            className="p-5 rounded-2xl bg-[#16222F]/80 backdrop-blur-md border border-[#233549] flex items-center justify-between gap-4"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#0773BB]/20 text-[#3BC0BB] flex items-center justify-center font-bold">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">{rule.name}</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  WHEN <span className="text-[#3BC0BB]">{rule.trigger}</span> ({rule.condition}) ➔ THEN <span className="text-amber-400">{rule.action}</span> ({rule.actionTarget})
                </p>
              </div>
            </div>

            <button
              onClick={() => toggleAutomation(rule.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold font-mono transition-all ${
                rule.active
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'bg-slate-700/40 text-slate-400'
              }`}
            >
              {rule.active ? 'Active' : 'Disabled'}
            </button>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#16222F] border border-[#233549] rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#233549] pb-3">
              <h2 className="text-base font-bold text-white">Create Automation Rule</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddRule} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Rule Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Send email on overdue task"
                  value={ruleName}
                  onChange={(e) => setRuleName(e.target.value)}
                  className="w-full bg-[#0D1520] border border-[#233549] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#0773BB]"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Trigger Event</label>
                <select
                  value={trigger}
                  onChange={(e) => setTrigger(e.target.value as any)}
                  className="w-full bg-[#0D1520] border border-[#233549] rounded-xl px-3 py-2 text-white"
                >
                  <option value="status_changed">Status Changed</option>
                  <option value="task_overdue">Task Overdue</option>
                  <option value="task_created">Task Created</option>
                  <option value="high_priority_assigned">High Priority Assigned</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Action</label>
                <select
                  value={action}
                  onChange={(e) => setAction(e.target.value as any)}
                  className="w-full bg-[#0D1520] border border-[#233549] rounded-xl px-3 py-2 text-white"
                >
                  <option value="send_email">Send Email Notification</option>
                  <option value="change_priority">Escalate Priority to Urgent</option>
                  <option value="log_activity">Log Audit Event</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#233549]">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl bg-[#0D1520] text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#0773BB] text-white font-medium"
                >
                  Save Rule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
