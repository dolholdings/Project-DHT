import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronRight, HelpCircle } from 'lucide-react';

export interface BreakdownItem {
  label: string;
  value: string | number;
  subtext?: string;
  color?: string;
  progress?: number;
}

export interface StatCardTooltipProps {
  isVisible: boolean;
  title: string;
  subtitle?: string;
  icon?: React.ComponentType<{ className?: string }>;
  accentColor?: string;
  items: BreakdownItem[];
  footerNote?: string;
}

export const StatCardTooltip: React.FC<StatCardTooltipProps> = ({
  isVisible,
  title,
  subtitle,
  icon: Icon,
  accentColor = '#3BC0BB',
  items,
  footerNote
}) => {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 12, scale: 0.94 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.95 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-80 p-4 rounded-2xl bg-[#0D1520] border border-[#233549] text-slate-200 shadow-2xl z-50 pointer-events-none ring-1 ring-white/10"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-[#233549]/80">
            <div className="flex items-center gap-2">
              {Icon && (
                <div
                  className="p-1.5 rounded-lg bg-opacity-20 flex items-center justify-center"
                  style={{ backgroundColor: `${accentColor}20`, color: accentColor }}
                >
                  <Icon className="w-4 h-4" />
                </div>
              )}
              <div>
                <h4 className="text-xs font-bold text-white tracking-wide">{title}</h4>
                {subtitle && <p className="text-[10px] text-slate-400">{subtitle}</p>}
              </div>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-bold border border-slate-700">
              Breakdown
            </span>
          </div>

          {/* Breakdown Items List */}
          <div className="space-y-2.5">
            {items.map((item, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300 font-medium flex items-center gap-1.5">
                    <span
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: item.color || accentColor }}
                    />
                    {item.label}
                  </span>
                  <span className="font-mono font-bold text-white">{item.value}</span>
                </div>

                {item.subtext && (
                  <div className="text-[10px] text-slate-400 pl-3 font-mono">
                    {item.subtext}
                  </div>
                )}

                {typeof item.progress === 'number' && (
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, Math.max(0, item.progress))}%` }}
                      transition={{ duration: 0.4, delay: idx * 0.05 }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: item.color || accentColor }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Footer Note */}
          {footerNote && (
            <div className="mt-3 pt-2 border-t border-[#233549]/80 text-[10px] text-slate-400 font-mono flex items-center gap-1">
              <HelpCircle className="w-3 h-3 text-slate-500 shrink-0" />
              <span>{footerNote}</span>
            </div>
          )}

          {/* Arrow indicator */}
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-[1px] w-0 h-0 border-x-8 border-x-transparent border-t-8 border-t-[#0D1520]" />
        </motion.div>
      )}
    </AnimatePresence>
  );
};
