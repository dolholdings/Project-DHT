import React from 'react';
import { Flame, Zap, Activity, Circle, ChevronDown } from 'lucide-react';
import { Priority } from '../../types';

interface PriorityBadgeProps {
  priority: Priority;
  onChange?: (newPriority: Priority) => void;
  interactive?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  className?: string;
}

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({
  priority,
  onChange,
  interactive = false,
  size = 'md',
  showIcon = true,
  className = ''
}) => {
  const getStyles = () => {
    switch (priority) {
      case 'Urgent':
        return {
          bg: 'bg-rose-500/20 text-rose-300 border-rose-500/40 hover:bg-rose-500/30 shadow-sm shadow-rose-500/20',
          dot: 'bg-rose-500 animate-pulse',
          icon: <Flame className={`${size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} text-rose-400 shrink-0`} />,
          label: 'Urgent'
        };
      case 'High':
        return {
          bg: 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30 shadow-sm shadow-amber-500/20',
          dot: 'bg-amber-500',
          icon: <Zap className={`${size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} text-amber-400 shrink-0`} />,
          label: 'High'
        };
      case 'Medium':
        return {
          bg: 'bg-sky-500/20 text-sky-300 border-sky-500/40 hover:bg-sky-500/30',
          dot: 'bg-sky-500',
          icon: <Activity className={`${size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} text-sky-400 shrink-0`} />,
          label: 'Medium'
        };
      case 'Low':
      default:
        return {
          bg: 'bg-slate-700/40 text-slate-300 border-slate-600/50 hover:bg-slate-700/60',
          dot: 'bg-slate-400',
          icon: <Circle className={`${size === 'sm' ? 'w-2.5 h-2.5' : 'w-3 h-3'} text-slate-400 shrink-0 fill-current`} />,
          label: 'Low'
        };
    }
  };

  const config = getStyles();

  const sizeClasses = {
    sm: 'text-[10px] px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
    lg: 'text-xs px-3 py-1.5 gap-2 font-bold'
  }[size];

  if (interactive && onChange) {
    return (
      <div className={`relative inline-flex items-center ${className}`}>
        <select
          value={priority}
          onChange={(e) => onChange(e.target.value as Priority)}
          className={`appearance-none font-bold rounded-lg border cursor-pointer focus:outline-none transition-all flex items-center ${sizeClasses} ${config.bg}`}
        >
          <option value="Urgent" className="bg-[#0D1520] text-rose-300 font-bold">🔥 Urgent</option>
          <option value="High" className="bg-[#0D1520] text-amber-300 font-bold">⚡ High</option>
          <option value="Medium" className="bg-[#0D1520] text-sky-300 font-bold">🔷 Medium</option>
          <option value="Low" className="bg-[#0D1520] text-slate-300 font-bold">⚪ Low</option>
        </select>
      </div>
    );
  }

  return (
    <span
      className={`inline-flex items-center font-bold rounded-lg border transition-all ${sizeClasses} ${config.bg} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${config.dot}`} />
      {showIcon && config.icon}
      <span>{config.label}</span>
    </span>
  );
};
