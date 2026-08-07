import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

export interface DolphinTooltipProps {
  content: React.ReactNode;
  title?: string;
  badge?: string;
  shortcut?: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
  variant?: 'default' | 'accent' | 'glass' | 'dark' | 'light';
  children: React.ReactElement;
  className?: string;
  disabled?: boolean;
  maxWidth?: string;
}

export const DolphinTooltip: React.FC<DolphinTooltipProps> = ({
  content,
  title,
  badge,
  shortcut,
  position = 'top',
  delay = 150,
  variant = 'default',
  children,
  className = '',
  disabled = false,
  maxWidth = 'max-w-xs'
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = () => {
    if (disabled || !content) return;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
    }, delay);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsVisible(false);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  // Variant styling according to Dolphin Enterprise Brand standards
  const getVariantStyles = () => {
    switch (variant) {
      case 'accent':
        return 'bg-gradient-to-br from-[#0773BB] to-[#05578E] text-white border-[#3BC0BB]/40 shadow-lg shadow-[#0773BB]/30';
      case 'glass':
        return 'bg-[#101923]/90 backdrop-blur-md text-slate-100 border-[#3BC0BB]/30 shadow-2xl shadow-black/60';
      case 'light':
        return 'bg-white text-slate-800 border-slate-200 shadow-xl shadow-slate-300/50';
      case 'dark':
      case 'default':
      default:
        return 'bg-[#0E1722] text-slate-100 border-[#233549] shadow-2xl shadow-black/80';
    }
  };

  // Position offset classes
  const getPositionClasses = () => {
    switch (position) {
      case 'bottom':
        return 'top-full left-1/2 -translate-x-1/2 mt-2';
      case 'left':
        return 'right-full top-1/2 -translate-y-1/2 mr-2';
      case 'right':
        return 'left-full top-1/2 -translate-y-1/2 ml-2';
      case 'top':
      default:
        return 'bottom-full left-1/2 -translate-x-1/2 mb-2';
    }
  };

  // Motion animation parameters
  const getMotionVariants = () => {
    switch (position) {
      case 'bottom':
        return { initial: { opacity: 0, y: -4, scale: 0.96 }, animate: { opacity: 1, y: 0, scale: 1 }, exit: { opacity: 0, y: -4, scale: 0.96 } };
      case 'left':
        return { initial: { opacity: 0, x: 4, scale: 0.96 }, animate: { opacity: 1, x: 0, scale: 1 }, exit: { opacity: 0, x: 4, scale: 0.96 } };
      case 'right':
        return { initial: { opacity: 0, x: -4, scale: 0.96 }, animate: { opacity: 1, x: 0, scale: 1 }, exit: { opacity: 0, x: -4, scale: 0.96 } };
      case 'top':
      default:
        return { initial: { opacity: 0, y: 4, scale: 0.96 }, animate: { opacity: 1, y: 0, scale: 1 }, exit: { opacity: 0, y: 4, scale: 0.96 } };
    }
  };

  // Arrow position indicator
  const getArrowClasses = () => {
    switch (position) {
      case 'bottom':
        return '-top-1 left-1/2 -translate-x-1/2 border-t border-l';
      case 'left':
        return '-right-1 top-1/2 -translate-y-1/2 border-t border-r';
      case 'right':
        return '-left-1 top-1/2 -translate-y-1/2 border-b border-l';
      case 'top':
      default:
        return '-bottom-1 left-1/2 -translate-x-1/2 border-b border-r';
    }
  };

  const arrowBgStyle = variant === 'light' ? 'bg-white border-slate-200' : 'bg-[#0E1722] border-[#233549]';

  return (
    <div
      className={`relative inline-flex items-center ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleMouseEnter}
      onBlur={handleMouseLeave}
    >
      {children}

      <AnimatePresence>
        {isVisible && !disabled && (
          <motion.div
            {...getMotionVariants()}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className={`absolute z-[999] pointer-events-none ${getPositionClasses()} ${maxWidth}`}
          >
            <div
              className={`p-2.5 rounded-xl border text-xs font-sans leading-relaxed transition-all ${getVariantStyles()}`}
            >
              {/* Optional Header Row */}
              {(title || badge || shortcut) && (
                <div className="flex items-center justify-between gap-2 mb-1 pb-1 border-b border-white/10">
                  {title && <span className="font-bold text-slate-100 text-[11px] tracking-tight">{title}</span>}
                  <div className="flex items-center gap-1 ml-auto">
                    {badge && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-[#3BC0BB]/20 text-[#3BC0BB] border border-[#3BC0BB]/30">
                        {badge}
                      </span>
                    )}
                    {shortcut && (
                      <kbd className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-slate-800 text-slate-300 border border-slate-700">
                        {shortcut}
                      </kbd>
                    )}
                  </div>
                </div>
              )}

              {/* Main Content Body */}
              <div className="text-slate-300 text-[11px] whitespace-normal">
                {content}
              </div>

              {/* Arrow Indicator */}
              <div
                className={`absolute w-2 h-2 rotate-45 ${arrowBgStyle} ${getArrowClasses()}`}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
