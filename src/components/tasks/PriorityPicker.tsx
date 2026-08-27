import React, { useState, useRef, useEffect } from 'react';
import { Flag, Check, Flame, Zap, Activity, Circle } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Priority, Task } from '../../types';

interface PriorityPickerProps {
  task: Task;
  compact?: boolean;
}

export const PRIORITY_CONFIG: Record<
  Priority,
  {
    label: string;
    flagColor: string;
    textColor: string;
    bgColor: string;
    borderColor: string;
    hoverBg: string;
    dotColor: string;
  }
> = {
  Urgent: {
    label: 'Urgent',
    flagColor: 'text-rose-500 fill-rose-500',
    textColor: 'text-rose-400',
    bgColor: 'bg-rose-500/15',
    borderColor: 'border-rose-500/30',
    hoverBg: 'hover:bg-rose-500/25',
    dotColor: 'bg-rose-500',
  },
  High: {
    label: 'High',
    flagColor: 'text-amber-500 fill-amber-500',
    textColor: 'text-amber-400',
    bgColor: 'bg-amber-500/15',
    borderColor: 'border-amber-500/30',
    hoverBg: 'hover:bg-amber-500/25',
    dotColor: 'bg-amber-500',
  },
  Medium: {
    label: 'Normal', // Normal / Medium
    flagColor: 'text-sky-500 fill-sky-500',
    textColor: 'text-sky-400',
    bgColor: 'bg-sky-500/15',
    borderColor: 'border-sky-500/30',
    hoverBg: 'hover:bg-sky-500/25',
    dotColor: 'bg-sky-500',
  },
  Low: {
    label: 'Low',
    flagColor: 'text-slate-400 fill-slate-400',
    textColor: 'text-slate-400',
    bgColor: 'bg-slate-500/10',
    borderColor: 'border-slate-500/20',
    hoverBg: 'hover:bg-slate-500/20',
    dotColor: 'bg-slate-400',
  },
};

export const PriorityPicker: React.FC<PriorityPickerProps> = ({
  task,
  compact = false,
}) => {
  const { updateTask, theme } = useApp();
  const isLight = theme === 'light';
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const currentPriority: Priority = task.priority || 'Low';
  const config = PRIORITY_CONFIG[currentPriority] || PRIORITY_CONFIG.Low;

  // Close dropdown on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handleOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('pointerdown', handleOutside);
    return () => document.removeEventListener('pointerdown', handleOutside);
  }, [isOpen]);

  const handleSelect = (newPriority: Priority, e: React.MouseEvent) => {
    e.stopPropagation();
    updateTask(task.id, { priority: newPriority });
    setIsOpen(false);
  };

  const priorityOptions: { key: Priority; label: string; desc: string }[] = [
    { key: 'Urgent', label: 'Urgent', desc: 'Critical blocker' },
    { key: 'High', label: 'High', desc: 'High priority' },
    { key: 'Medium', label: 'Normal', desc: 'Standard task' },
    { key: 'Low', label: 'Low', desc: 'Trivial / Later' },
  ];

  return (
    <div
      ref={containerRef}
      className="relative inline-block select-none"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Priority Flag Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        title={`Priority: ${config.label} - Click to change`}
        className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-semibold transition-all border cursor-pointer ${
          config.bgColor
        } ${config.textColor} ${config.borderColor} ${config.hoverBg} ${
          compact ? 'px-1.5 py-0.5' : ''
        }`}
      >
        <Flag className={`w-3.5 h-3.5 shrink-0 ${config.flagColor}`} />
        <span>{config.label}</span>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className={`absolute left-0 top-full mt-1.5 z-40 w-44 rounded-xl border p-1.5 shadow-2xl animate-in fade-in zoom-in-95 ${
            isLight
              ? 'bg-white border-slate-200 text-slate-800'
              : 'bg-[#16222F] border-[#233549] text-slate-100'
          }`}
        >
          <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            Set Priority
          </div>

          <div className="space-y-0.5">
            {priorityOptions.map((opt) => {
              const optConfig = PRIORITY_CONFIG[opt.key];
              const isSelected = currentPriority === opt.key;

              return (
                <button
                  key={opt.key}
                  type="button"
                  onClick={(e) => handleSelect(opt.key, e)}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    isSelected
                      ? isLight
                        ? 'bg-slate-100 text-slate-900 font-bold'
                        : 'bg-[#0D1520] text-white font-bold'
                      : isLight
                      ? 'hover:bg-slate-50 text-slate-700'
                      : 'hover:bg-[#0D1520]/60 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Flag className={`w-3.5 h-3.5 ${optConfig.flagColor}`} />
                    <span className={optConfig.textColor}>{opt.label}</span>
                  </div>
                  {isSelected && (
                    <Check className="w-3.5 h-3.5 text-[#00AEA9]" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
