import React, { useState, useEffect } from 'react';
import { useLogo, LogoArea } from '../../context/LogoContext';
import { Image as ImageIcon } from 'lucide-react';

export interface LogoPlaceholderProps {
  area: LogoArea;
  companyId?: string;
  alt?: string;
  className?: string;
  imgClassName?: string;
  containerClassName?: string;
  fallback?: React.ReactNode;
  showPlaceholderBorder?: boolean;
  placeholderLabel?: string;
  onClick?: () => void;
  title?: string;
}

export const LogoPlaceholder: React.FC<LogoPlaceholderProps> = ({
  area,
  companyId,
  alt,
  className = '',
  imgClassName = '',
  containerClassName = '',
  fallback = null,
  showPlaceholderBorder,
  placeholderLabel,
  onClick,
  title
}) => {
  const { getLogoForArea, settings } = useLogo();
  const [imgError, setImgError] = useState(false);

  const { path, isVisible, alt: defaultAlt, aspectRatio } = getLogoForArea(area, companyId);

  // Reset img error if path changes
  useEffect(() => {
    setImgError(false);
  }, [path, isVisible]);

  const shouldShowBorders = showPlaceholderBorder ?? settings.showPlaceholderBorders;

  // Aspect-ratio specific styling
  const getAspectRatioClasses = () => {
    switch (aspectRatio) {
      case 'horizontal':
        return 'h-7 w-auto max-w-[240px] object-contain';
      case 'emblem':
        return 'w-full h-full object-contain';
      case 'square':
        return 'w-full h-full object-contain';
      case 'auto':
      default:
        return 'max-h-full max-w-full object-contain';
    }
  };

  // If active and valid image path exists without load error:
  if (isVisible && path && !imgError) {
    return (
      <div
        id={`logo-slot-${area}`}
        className={`inline-flex items-center justify-center shrink-0 select-none transition-all ${className} ${
          onClick ? 'cursor-pointer hover:opacity-90 active:scale-98' : ''
        } ${
          shouldShowBorders ? 'ring-2 ring-[#3BC0BB]/40 rounded-lg p-0.5' : ''
        }`}
        onClick={onClick}
        title={title || alt || defaultAlt}
      >
        <img
          src={path}
          alt={alt || defaultAlt}
          className={`${getAspectRatioClasses()} ${imgClassName}`}
          loading="eager"
          referrerPolicy="no-referrer"
          onError={() => {
            console.warn(`[LogoManager] Logo image failed to load for area: "${area}" (path: ${path}). Falling back gracefully.`);
            setImgError(true);
          }}
        />
      </div>
    );
  }

  // If borders are forced on for visual slot positioning/debugging
  if (shouldShowBorders && !fallback) {
    return (
      <div
        id={`logo-placeholder-${area}`}
        className={`inline-flex items-center justify-center gap-1.5 px-2 py-1 rounded-lg border border-dashed border-[#3BC0BB]/60 bg-[#3BC0BB]/10 text-[10px] font-mono text-[#3BC0BB] shrink-0 ${containerClassName} ${className}`}
        title={`Logo Placeholder Slot: ${area} (Disabled/Empty)`}
        onClick={onClick}
      >
        <ImageIcon className="w-3 h-3 text-[#3BC0BB]" />
        <span>{placeholderLabel || `Slot: ${area}`}</span>
      </div>
    );
  }

  // Otherwise, return fallback component (or null)
  if (fallback) {
    return <>{fallback}</>;
  }

  return null;
};
