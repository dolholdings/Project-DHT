import React, { useState, useEffect } from 'react';
import { useLogo, LogoArea, DEFAULT_LOGO_CONFIGS } from '../../context/LogoContext';
import { useApp } from '../../context/AppContext';
import { Image as ImageIcon, Building2, ShieldCheck, FileText, Layers } from 'lucide-react';

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
  const { activeCompany } = useApp();
  const [imgError, setImgError] = useState(false);

  const targetCompanyId = companyId || activeCompany?.id;
  const { path, isVisible, alt: defaultAlt, aspectRatio } = getLogoForArea(area, targetCompanyId);

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

  const isEmojiOrText = path && !path.startsWith('/') && !path.startsWith('http') && !path.startsWith('data:') && !path.includes('.');

  // If active and path is an emoji or text icon:
  if (isVisible && isEmojiOrText) {
    return (
      <div
        id={`logo-slot-${area}`}
        className={`inline-flex items-center justify-center shrink-0 select-none ${className} ${onClick ? 'cursor-pointer hover:opacity-90' : ''}`}
        onClick={onClick}
        title={title || alt || defaultAlt}
      >
        <span className="text-xl select-none leading-none">{path}</span>
      </div>
    );
  }

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

  // Fallback to default preset SVG if custom path failed
  if (isVisible && imgError && DEFAULT_LOGO_CONFIGS[area]?.path && DEFAULT_LOGO_CONFIGS[area]?.path !== path) {
    const defaultPresetPath = DEFAULT_LOGO_CONFIGS[area].path;
    return (
      <div
        id={`logo-slot-${area}-fallback`}
        className={`inline-flex items-center justify-center shrink-0 select-none ${className} ${onClick ? 'cursor-pointer hover:opacity-90' : ''}`}
        onClick={onClick}
        title={title || `${defaultAlt} (Default)`}
      >
        <img
          src={defaultPresetPath}
          alt={defaultAlt}
          className={`${getAspectRatioClasses()} ${imgClassName}`}
          loading="eager"
          referrerPolicy="no-referrer"
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

  // Otherwise, return fallback component (or default themed fallback)
  if (fallback) {
    return <>{fallback}</>;
  }

  // Built-in intelligent icon fallbacks so UI is never left with a broken hole
  if (area === 'sidebar') {
    return (
      <div className={`inline-flex items-center justify-center text-[#3BC0BB] shrink-0 ${className}`}>
        <Building2 className="w-5 h-5" />
      </div>
    );
  }

  return null;
};
