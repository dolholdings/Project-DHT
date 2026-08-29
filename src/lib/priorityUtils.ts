import { Priority } from '../types';

export const getPriorityBadgeStyle = (priority: Priority | string, isLight: boolean = false): string => {
  const p = String(priority || 'Medium').toLowerCase();
  if (p === 'urgent') {
    return isLight
      ? 'bg-rose-100 text-rose-800 border-rose-300 font-extrabold'
      : 'bg-rose-500/20 text-rose-300 border-rose-500/40 font-extrabold';
  }
  if (p === 'high') {
    return isLight
      ? 'bg-orange-100 text-orange-800 border-orange-300 font-bold'
      : 'bg-orange-500/20 text-orange-300 border-orange-500/40 font-bold';
  }
  if (p === 'medium') {
    return isLight
      ? 'bg-blue-100 text-blue-800 border-blue-300 font-medium'
      : 'bg-blue-500/20 text-blue-300 border-blue-500/40 font-medium';
  }
  return isLight
    ? 'bg-slate-100 text-slate-700 border-slate-300 font-medium'
    : 'bg-slate-500/20 text-slate-300 border-slate-500/40 font-medium';
};

export const getPriorityTextColor = (priority: Priority | string, isLight: boolean = false): string => {
  const p = String(priority || 'Medium').toLowerCase();
  if (p === 'urgent') return isLight ? 'text-rose-700' : 'text-rose-400';
  if (p === 'high') return isLight ? 'text-orange-700' : 'text-orange-400';
  if (p === 'medium') return isLight ? 'text-blue-700' : 'text-blue-400';
  return isLight ? 'text-slate-600' : 'text-slate-400';
};
