import React from 'react';

interface CompanyLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
}

export const CompanyLogo: React.FC<CompanyLogoProps> = ({
  className = '',
  showText = false
}) => {
  if (!showText) return null;

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <div className="overflow-hidden">
        <div className="text-xs font-bold text-white tracking-wider uppercase leading-tight">
          DOLPHIN GLOBAL HOLDINGS
        </div>
        <div className="text-[10px] font-semibold text-[#3BC0BB] uppercase tracking-wider mt-0.5">
          Project Management Tools
        </div>
      </div>
    </div>
  );
};
