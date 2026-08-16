import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { APPROVED_DOMAINS } from '../../types';

export interface DomainWhitelistWidgetProps {
  theme?: 'dark' | 'light';
}

export const DomainWhitelistWidget: React.FC<DomainWhitelistWidgetProps> = ({
  theme = 'dark'
}) => {
  return (
    <div className="p-5 sm:p-6 space-y-3">
      <p className="text-xs text-slate-400 leading-relaxed">
        Restricted authorization access across official corporate email domains:
      </p>
      <div className="flex flex-wrap gap-1.5 pt-1">
        {APPROVED_DOMAINS.map((d) => (
          <span
            key={d}
            className={`text-[10px] px-2 py-0.5 rounded-md font-mono ${
              theme === 'light'
                ? 'bg-slate-100 border border-slate-300 text-slate-700'
                : 'bg-[#0D1520] border border-[#233549] text-slate-300'
            }`}
          >
            @{d}
          </span>
        ))}
      </div>
    </div>
  );
};
