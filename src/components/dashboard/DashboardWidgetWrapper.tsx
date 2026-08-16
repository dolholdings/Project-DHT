import React, { useState, useRef, useEffect } from 'react';
import {
  GripVertical,
  X,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  Trash2,
  Columns,
  MoveHorizontal
} from 'lucide-react';

export interface DashboardWidgetWrapperProps {
  id: string;
  title: string;
  category?: string;
  icon?: React.ComponentType<{ className?: string }>;
  colSpan?: 1 | 2 | 3;
  onResize?: (id: string, newColSpan: 1 | 2 | 3) => void;
  onRemove?: (id: string) => void;
  onMove?: (id: string, direction: 'up' | 'down') => void;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
  theme?: 'dark' | 'light';
  children: React.ReactNode;
  headerActions?: React.ReactNode;
  hideHeader?: boolean;
  className?: string;
}

export const DashboardWidgetWrapper: React.FC<DashboardWidgetWrapperProps> = ({
  id,
  title,
  category,
  icon: Icon,
  colSpan = 1,
  onResize,
  onRemove,
  onMove,
  canMoveUp = true,
  canMoveDown = true,
  theme = 'dark',
  children,
  headerActions,
  hideHeader = false,
  className = ''
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isDraggingResize, setIsDraggingResize] = useState(false);
  const [dragPreviewSpan, setDragPreviewSpan] = useState<1 | 2 | 3>(colSpan);
  const containerRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef<number>(0);
  const startColSpanRef = useRef<1 | 2 | 3>(colSpan);

  // Sync dragPreviewSpan with colSpan when not dragging
  useEffect(() => {
    if (!isDraggingResize) {
      setDragPreviewSpan(colSpan);
    }
  }, [colSpan, isDraggingResize]);

  // Handle drag-to-resize logic
  const handleResizeStart = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingResize(true);
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    startXRef.current = clientX;
    startColSpanRef.current = colSpan;

    const handlePointerMove = (moveEvent: MouseEvent | TouchEvent) => {
      const currentX = 'touches' in moveEvent ? moveEvent.touches[0].clientX : moveEvent.clientX;
      const deltaX = currentX - startXRef.current;

      // Container or grid estimated column width (approx 360-450px on desktop)
      const columnThreshold = 180;
      let spanChange = Math.round(deltaX / columnThreshold);
      let calculatedSpan = (startColSpanRef.current + spanChange) as 1 | 2 | 3;
      if (calculatedSpan < 1) calculatedSpan = 1;
      if (calculatedSpan > 3) calculatedSpan = 3;

      setDragPreviewSpan(calculatedSpan);
    };

    const handlePointerEnd = (endEvent: MouseEvent | TouchEvent) => {
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('mouseup', handlePointerEnd);
      window.removeEventListener('touchmove', handlePointerMove);
      window.removeEventListener('touchend', handlePointerEnd);

      setIsDraggingResize(false);
      const finalX = 'changedTouches' in endEvent ? endEvent.changedTouches[0].clientX : (endEvent as MouseEvent).clientX;
      const deltaX = finalX - startXRef.current;
      const columnThreshold = 180;
      let spanChange = Math.round(deltaX / columnThreshold);
      let calculatedSpan = (startColSpanRef.current + spanChange) as 1 | 2 | 3;
      if (calculatedSpan < 1) calculatedSpan = 1;
      if (calculatedSpan > 3) calculatedSpan = 3;

      if (onResize && calculatedSpan !== colSpan) {
        onResize(id, calculatedSpan);
      }
    };

    window.addEventListener('mousemove', handlePointerMove);
    window.addEventListener('mouseup', handlePointerEnd);
    window.addEventListener('touchmove', handlePointerMove);
    window.addEventListener('touchend', handlePointerEnd);
  };

  // Map colSpan to Tailwind grid classes
  const getColSpanClass = (span: 1 | 2 | 3) => {
    switch (span) {
      case 3:
        return 'col-span-1 lg:col-span-3';
      case 2:
        return 'col-span-1 lg:col-span-2';
      case 1:
      default:
        return 'col-span-1 lg:col-span-1';
    }
  };

  const activeColSpan = isDraggingResize ? dragPreviewSpan : colSpan;

  return (
    <div
      ref={containerRef}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`relative flex flex-col rounded-2xl border transition-all duration-200 group ${getColSpanClass(
        activeColSpan
      )} ${
        isDraggingResize
          ? 'ring-2 ring-[#3BC0BB] border-[#3BC0BB] shadow-2xl scale-[1.008] z-20'
          : theme === 'light'
          ? 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'
          : 'bg-[#16222F]/90 border-[#233549] hover:border-[#3BC0BB]/40 shadow-xl'
      } ${className}`}
    >
      {/* Widget Control Bar (Top) */}
      {!hideHeader && (
        <div
          className={`flex items-center justify-between px-4 py-2.5 border-b select-none transition-colors ${
            theme === 'light'
              ? 'bg-slate-50/80 border-slate-200'
              : 'bg-[#0D1520]/70 border-[#233549]/70'
          }`}
        >
          {/* Left: Drag Handle, Icon, Title & Category */}
          <div className="flex items-center gap-2 min-w-0 flex-1 mr-2">
            <div
              className="text-slate-500 hover:text-slate-300 cursor-grab active:cursor-grabbing p-0.5"
              title="Dashboard Widget"
            >
              <GripVertical className="w-3.5 h-3.5" />
            </div>

            {Icon && (
              <div
                className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
                  theme === 'light'
                    ? 'bg-teal-50 text-[#0D9488]'
                    : 'bg-[#0773BB]/20 text-[#3BC0BB]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
              </div>
            )}

            <div className="min-w-0 flex items-center gap-2">
              <span
                className={`text-xs font-bold truncate ${
                  theme === 'light' ? 'text-slate-800' : 'text-slate-200'
                }`}
              >
                {title}
              </span>
              {category && (
                <span
                  className={`hidden sm:inline-flex text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider ${
                    theme === 'light'
                      ? 'bg-slate-100 text-slate-600 border-slate-200'
                      : 'bg-[#16222F] text-slate-400 border-[#233549]'
                  }`}
                >
                  {category}
                </span>
              )}
            </div>
          </div>

          {/* Right: Size Switcher Pills, Move Controls, Remove Button */}
          <div className="flex items-center gap-1.5 shrink-0">
            {headerActions}

            {/* Column Span Resize Buttons */}
            {onResize && (
              <div
                className={`flex items-center p-0.5 rounded-lg border text-[10px] font-mono font-bold transition-opacity ${
                  isHovered || isDraggingResize ? 'opacity-100' : 'opacity-75 sm:opacity-90'
                } ${
                  theme === 'light'
                    ? 'bg-white border-slate-200 text-slate-600'
                    : 'bg-[#0D1520] border-[#233549] text-slate-400'
                }`}
                title="Resize widget width (1/3, 2/3, Full)"
              >
                <button
                  type="button"
                  onClick={() => onResize(id, 1)}
                  className={`px-1.5 py-0.5 rounded transition-all ${
                    colSpan === 1
                      ? 'bg-[#0773BB] text-white shadow-xs'
                      : 'hover:text-slate-200 hover:bg-slate-700/30'
                  }`}
                  title="1 Column (1/3 Width)"
                >
                  1/3
                </button>
                <button
                  type="button"
                  onClick={() => onResize(id, 2)}
                  className={`px-1.5 py-0.5 rounded transition-all ${
                    colSpan === 2
                      ? 'bg-[#0773BB] text-white shadow-xs'
                      : 'hover:text-slate-200 hover:bg-slate-700/30'
                  }`}
                  title="2 Columns (2/3 Width)"
                >
                  2/3
                </button>
                <button
                  type="button"
                  onClick={() => onResize(id, 3)}
                  className={`px-1.5 py-0.5 rounded transition-all ${
                    colSpan === 3
                      ? 'bg-[#0773BB] text-white shadow-xs'
                      : 'hover:text-slate-200 hover:bg-slate-700/30'
                  }`}
                  title="Full Width (3 Columns)"
                >
                  Full
                </button>
              </div>
            )}

            {/* Reorder Buttons (Move Up / Move Down) */}
            {onMove && (
              <div className="flex items-center gap-0.5">
                <button
                  type="button"
                  onClick={() => onMove(id, 'up')}
                  disabled={!canMoveUp}
                  className={`p-1 rounded-md transition-all disabled:opacity-30 ${
                    theme === 'light'
                      ? 'text-slate-500 hover:bg-slate-200'
                      : 'text-slate-400 hover:text-white hover:bg-[#1A2838]'
                  }`}
                  title="Move widget up/left"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => onMove(id, 'down')}
                  disabled={!canMoveDown}
                  className={`p-1 rounded-md transition-all disabled:opacity-30 ${
                    theme === 'light'
                      ? 'text-slate-500 hover:bg-slate-200'
                      : 'text-slate-400 hover:text-white hover:bg-[#1A2838]'
                  }`}
                  title="Move widget down/right"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Remove / Unpin Button */}
            {onRemove && (
              <button
                type="button"
                onClick={() => onRemove(id)}
                className="p-1 rounded-md text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors ml-0.5"
                title="Remove widget from dashboard (You can re-add it from 'Customize')"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Widget Body Content */}
      <div className="flex-1 flex flex-col relative">{children}</div>

      {/* Drag to Resize Handle (Right Edge & Bottom-Right Corner) */}
      {onResize && (
        <div
          onMouseDown={handleResizeStart}
          onTouchStart={handleResizeStart}
          className={`absolute top-0 right-0 bottom-0 w-2.5 cursor-ew-resize hover:bg-[#3BC0BB]/40 transition-all flex items-center justify-center z-10 select-none ${
            isDraggingResize ? 'bg-[#3BC0BB] opacity-100' : 'opacity-0 group-hover:opacity-60'
          }`}
          title="Drag horizontally to resize widget width"
        >
          {/* Subtle resize grip line */}
          <div className="w-0.5 h-6 bg-[#3BC0BB] rounded-full shadow-xs pointer-events-none" />
        </div>
      )}

      {/* Visual Live Drag-Resize Toast Indicator */}
      {isDraggingResize && (
        <div className="absolute inset-0 bg-[#0773BB]/10 backdrop-blur-[1px] border-2 border-dashed border-[#3BC0BB] rounded-2xl flex items-center justify-center z-30 pointer-events-none">
          <div className="px-4 py-2 rounded-xl bg-[#0D1520] border border-[#3BC0BB] text-white shadow-2xl flex items-center gap-2 font-mono font-bold text-xs animate-in zoom-in-95">
            <MoveHorizontal className="w-4 h-4 text-[#3BC0BB] animate-pulse" />
            <span>
              Target Width: {dragPreviewSpan === 1 ? '1/3 Column (Narrow)' : dragPreviewSpan === 2 ? '2/3 Columns (Wide)' : '3 Columns (Full Width)'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
