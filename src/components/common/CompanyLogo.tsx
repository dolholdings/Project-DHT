import React from 'react';
import { Building2 } from 'lucide-react';
import { LogoPlaceholder } from './LogoPlaceholder';

interface CompanyLogoProps {
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  variant?: 'square' | 'horizontal' | 'emblem' | 'full';
  companyName?: string;
  companyDomain?: string;
  logoFallback?: string;
}

export const CompanyLogo: React.FC<CompanyLogoProps> = ({
  className = '',
  size = 'md',
  showText = true,
  variant = 'horizontal',
  companyName = 'Dolphin Heat Transfer L.L.C',
  companyDomain,
  logoFallback
}) => {
  const mappedArea = variant === 'horizontal' ? 'header' : variant === 'square' ? 'dashboard' : 'sidebar';

  if (!showText) {
    return (
      <LogoPlaceholder
        area={mappedArea}
        className={className}
        fallback={
          <div className={`inline-flex items-center justify-center text-[#0773BB] shrink-0 ${className}`}>
            <Building2 className="w-5 h-5" />
          </div>
        }
      />
    );
  }

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <LogoPlaceholder
        area={mappedArea}
        className="shrink-0"
        fallback={
          <div className="p-1 rounded-lg bg-[#0773BB]/10 text-[#0773BB] shrink-0">
            <Building2 className="w-4 h-4" />
          </div>
        }
      />
      <div className="flex flex-col justify-center text-left">
        <div className="flex items-center gap-1.5 leading-tight">
          <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
            {companyName}
          </span>
        </div>
        {companyDomain && (
          <span className="text-[10px] font-mono text-[#3BC0BB] font-semibold">
            @{companyDomain.replace(/^@/, '')}
          </span>
        )}
      </div>
    </div>
  );
};


