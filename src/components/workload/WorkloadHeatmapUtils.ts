export interface HeatColor {
  bg: string;
  text: string;
  border: string;
  badge: string;
  hex: string;
  label: string;
  ring?: string;
}

export const getHeatColor = (percent: number, isLight: boolean): HeatColor => {
  if (percent === 0) {
    return {
      bg: isLight ? 'bg-teal-50' : 'bg-teal-950/30',
      text: isLight ? 'text-teal-700' : 'text-teal-400',
      border: isLight ? 'border-teal-200' : 'border-teal-800/40',
      badge: isLight ? 'bg-teal-100 text-teal-800 border-teal-300' : 'bg-teal-900/60 text-teal-300 border-teal-700/50',
      hex: '#14b8a6',
      label: 'Unallocated (0%)'
    };
  }
  if (percent <= 50) {
    return {
      bg: isLight ? 'bg-teal-100/80' : 'bg-teal-900/50',
      text: isLight ? 'text-teal-900' : 'text-teal-200',
      border: isLight ? 'border-teal-300' : 'border-teal-700',
      badge: isLight ? 'bg-teal-200 text-teal-900 border-teal-400' : 'bg-teal-800/80 text-teal-200 border-teal-600',
      hex: '#0d9488',
      label: 'Light Load (1-50%)'
    };
  }
  if (percent <= 80) {
    return {
      bg: isLight ? 'bg-teal-500' : 'bg-teal-600',
      text: 'text-white',
      border: isLight ? 'border-teal-600' : 'border-teal-500',
      badge: isLight ? 'bg-teal-600 text-white border-teal-700' : 'bg-teal-500 text-white border-teal-400',
      hex: '#0284c7',
      label: 'Optimal Load (51-80%)'
    };
  }
  if (percent <= 95) {
    return {
      bg: isLight ? 'bg-amber-400' : 'bg-amber-500/90',
      text: isLight ? 'text-amber-950' : 'text-slate-950',
      border: isLight ? 'border-amber-500' : 'border-amber-400',
      badge: isLight ? 'bg-amber-200 text-amber-900 border-amber-400' : 'bg-amber-500/30 text-amber-200 border-amber-500/50',
      hex: '#f59e0b',
      label: 'High Capacity (81-95%)'
    };
  }
  if (percent <= 100) {
    return {
      bg: isLight ? 'bg-orange-500' : 'bg-orange-600',
      text: 'text-white',
      border: isLight ? 'border-orange-600' : 'border-orange-500',
      badge: isLight ? 'bg-orange-600 text-white border-orange-700' : 'bg-orange-500 text-white border-orange-400',
      hex: '#f97316',
      label: 'At Capacity (96-100%)'
    };
  }
  // OVERLOADED (>100%)
  return {
    bg: isLight ? 'bg-rose-600' : 'bg-rose-600',
    text: 'text-white',
    border: isLight ? 'border-rose-700' : 'border-rose-500',
    ring: 'ring-4 ring-rose-500 animate-pulse shadow-[0_0_20px_rgba(225,29,72,0.6)]',
    badge: 'bg-rose-600 text-white border-rose-700 font-extrabold',
    hex: '#e11d48',
    label: 'OVERLOADED (>100%)'
  };
};
