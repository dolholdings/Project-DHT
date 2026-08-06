import React, { useState } from 'react';
import { Clock, Calendar, X, BellOff, Check } from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface CustomSnoozeModalProps {
  taskId: string;
  taskTitle: string;
  onClose: () => void;
  onSnoozed?: () => void;
}

export const CustomSnoozeModal: React.FC<CustomSnoozeModalProps> = ({
  taskId,
  taskTitle,
  onClose,
  onSnoozed,
}) => {
  const { snoozeTaskNotification } = useApp();

  // Default to tomorrow 9:00 AM
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(9, 0, 0, 0);

  const [selectedDate, setSelectedDate] = useState(
    tomorrow.toISOString().split('T')[0]
  );
  const [selectedTime, setSelectedTime] = useState('09:00');
  const [reason, setReason] = useState('');

  const handleApplyCustomSnooze = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate || !selectedTime) return;

    const customDateTime = `${selectedDate}T${selectedTime}:00`;
    snoozeTaskNotification(taskId, 'custom', customDateTime, reason);
    if (onSnoozed) onSnoozed();
    onClose();
  };

  const quickPresets = [
    { label: 'In 15 Mins', preset: '15m' },
    { label: 'In 1 Hour', preset: '1h' },
    { label: 'In 4 Hours', preset: '4h' },
    { label: 'Tomorrow 9 AM', preset: '1d' },
    { label: 'In 2 Days', preset: '2d' },
    { label: 'Next Week', preset: '1w' },
  ];

  const handleQuickPreset = (preset: string) => {
    snoozeTaskNotification(taskId, preset, undefined, reason);
    if (onSnoozed) onSnoozed();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
      <div className="w-full max-w-md bg-[#16222F] border border-[#233549] rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-[#0D1520] border-b border-[#233549] flex items-center justify-between">
          <div className="flex items-center gap-3 text-white font-bold">
            <div className="w-9 h-9 rounded-xl bg-[#0773BB]/20 border border-[#0773BB]/40 flex items-center justify-center text-[#3BC0BB]">
              <BellOff className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Snooze Task Alert</h3>
              <p className="text-[11px] text-slate-400 font-normal truncate max-w-[240px]">
                {taskTitle}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#233549] transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-5">
          {/* Quick Presets Grid */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              Quick Snooze Presets
            </label>
            <div className="grid grid-cols-3 gap-2">
              {quickPresets.map((p) => (
                <button
                  key={p.preset}
                  type="button"
                  onClick={() => handleQuickPreset(p.preset)}
                  className="px-3 py-2 rounded-xl bg-[#0D1520] hover:bg-[#0773BB]/20 hover:border-[#0773BB] border border-[#233549] text-xs font-medium text-slate-200 hover:text-[#3BC0BB] transition-all flex items-center justify-center gap-1.5"
                >
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>{p.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="relative flex items-center py-1">
            <div className="flex-grow border-t border-[#233549]"></div>
            <span className="flex-shrink mx-3 text-[10px] uppercase font-bold tracking-wider text-slate-500">
              Or Choose Custom Date & Time
            </span>
            <div className="flex-grow border-t border-[#233549]"></div>
          </div>

          <form onSubmit={handleApplyCustomSnooze} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-[#3BC0BB]" />
                  <span>Snooze Until Date</span>
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#0D1520] border border-[#233549] text-white text-xs focus:outline-none focus:border-[#0773BB]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-[#3BC0BB]" />
                  <span>Time</span>
                </label>
                <input
                  type="time"
                  value={selectedTime}
                  onChange={(e) => setSelectedTime(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#0D1520] border border-[#233549] text-white text-xs focus:outline-none focus:border-[#0773BB]"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Optional Snooze Note / Reason
              </label>
              <input
                type="text"
                placeholder="e.g. Waiting for client response..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#0D1520] border border-[#233549] text-white text-xs focus:outline-none focus:border-[#0773BB] placeholder:text-slate-600"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-[#233549]">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-[#0D1520] hover:bg-[#233549] text-xs font-medium text-slate-300 transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#0773BB] to-[#3BC0BB] hover:opacity-90 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Set Custom Snooze</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
