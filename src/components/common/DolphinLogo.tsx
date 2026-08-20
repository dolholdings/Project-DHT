import React from 'react';
import { LogoPlaceholder } from './LogoPlaceholder';
import { LogoArea } from '../../context/LogoContext';

export interface DolphinLogoProps {
  variant?: 'square' | 'horizontal' | 'emblem' | 'full';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | 'custom';
  className?: string;
  showSubtitle?: boolean;
  subtitleText?: string;
  onClick?: () => void;
  title?: string;
  area?: LogoArea;
}

export const DolphinLogo: React.FC<DolphinLogoProps> = ({
  variant = 'square',
  size = 'md',
  className = '',
  onClick,
  title,
  area
}) => {
  const mappedArea: LogoArea = area || (variant === 'horizontal' ? 'header' : variant === 'emblem' ? 'sidebar' : 'general');

  const getSizeClasses = () => {
    switch (size) {
      case 'xs':
        return 'w-5 h-5';
      case 'sm':
        return 'w-6 h-6';
      case 'md':
        return 'w-8 h-8';
      case 'lg':
        return 'w-12 h-12';
      case 'xl':
        return 'w-24 h-24';
      case '2xl':
        return 'w-36 h-36';
      case '3xl':
        return 'w-48 h-48';
      case 'custom':
      default:
        return '';
    }
  };

  return (
    <LogoPlaceholder
      area={mappedArea}
      className={`${getSizeClasses()} ${className}`}
      onClick={onClick}
      title={title}
    />
  );
};




