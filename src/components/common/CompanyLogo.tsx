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
  companyId?: string;
}

export const CompanyLogo: React.FC<CompanyLogoProps> = ({
  className = '',
  size = 'md',
  showText = true,
  variant = 'horizontal',
  companyName = 'Dolphin Heat Transfer L.L.C',
  companyDomain,
  logoFallback,
  companyId
}) => {
  const mappedArea = variant === 'horizontal' ? 'header' : variant === 'square' ? 'dashboard' : 'sidebar';

  if (!showText) {
    return (
      <LogoPlaceholder
        area={mappedArea}
        companyId={companyId}
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
        companyId={companyId}
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

export interface CompanyIconBadgeProps {
  logo?: string;
  name?: string;
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
}

export const CompanyIconBadge: React.FC<CompanyIconBadgeProps> = ({
  logo,
  name,
  className = '',
  size = 'sm'
}) => {
  const isImage = logo && (logo.startsWith('http') || logo.startsWith('data:') || logo.startsWith('/') || logo.includes('.svg') || logo.includes('.png') || logo.includes('.jpg') || logo.includes('.webp'));

  const sizeClasses = {
    xs: 'w-4 h-4 text-[10px]',
    sm: 'w-5 h-5 text-xs',
    md: 'w-7 h-7 text-sm',
    lg: 'w-9 h-9 text-base'
  }[size];

  if (isImage) {
    return (
      <img
        src={logo}
        alt={name || 'Workspace Logo'}
        className={`${sizeClasses} object-contain rounded-md shrink-0 ${className}`}
        referrerPolicy="no-referrer"
      />
    );
  }

  return (
    <span className={`inline-flex items-center justify-center shrink-0 select-none ${sizeClasses} ${className}`}>
      {logo || '🏢'}
    </span>
  );
};


