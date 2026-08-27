import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import { Task } from '../../types';

interface TaskInteractiveProgressBarProps {
  task: Task;
  compact?: boolean;
}

export const TaskInteractiveProgressBar: React.FC<TaskInteractiveProgressBarProps> = ({
  task,
  compact = false,
}) => {
  const { updateTask, theme } = useApp();
  const isLight = theme === 'light';

  const initialProgress =
    task.progress !== undefined && task.progress !== null
      ? Math.max(0, Math.min(100, Math.round(task.progress)))
      : task.customFields?.progress !== undefined && task.customFields?.progress !== null
      ? Math.max(0, Math.min(100, Math.round(Number(task.customFields.progress))))
      : task.status === 'Done'
      ? 100
      : 0;

  const [localProgress, setLocalProgress] = useState<number>(initialProgress);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const [showPresetMenu, setShowPresetMenu] = useState<boolean>(false);

  const barRef = useRef<HTMLDivElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  // Sync external task progress updates when not actively dragging
  useEffect(() => {
    if (!isDragging) {
      setLocalProgress(initialProgress);
    }
  }, [initialProgress, isDragging]);

  // Close preset popup on outside click
  useEffect(() => {
    if (!showPresetMenu) return;
    const handleOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowPresetMenu(false);
      }
    };
    document.addEventListener('pointerdown', handleOutside);
    return () => document.removeEventListener('pointerdown', handleOutside);
  }, [showPresetMenu]);

  // Calculate percentage from client coordinates
  const calculatePercentage = useCallback((clientX: number): number => {
    if (!barRef.current) return 0;
    const rect = barRef.current.getBoundingClientRect();
    if (rect.width <= 0) return 0;
    const rawRatio = (clientX - rect.left) / rect.width;
    const clampedRatio = Math.max(0, Math.min(1, rawRatio));
    return Math.round(clampedRatio * 100);
  }, []);

  const commitProgressChange = useCallback(
    (newProgress: number) => {
      const clamped = Math.max(0, Math.min(100, Math.round(newProgress)));
      
      // Auto-update task status if progress hits 100% or moves off 100%
      const newStatus =
        clamped === 100
          ? 'Done'
          : task.status === 'Done'
          ? 'In Progress'
          : task.status;

      updateTask(task.id, {
        progress: clamped,
        status: newStatus,
        customFields: {
          ...(task.customFields || {}),
          progress: clamped,
        },
      });
    },
    [task.id, task.status, task.customFields, updateTask]
  );

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    e.preventDefault();
    if (!barRef.current) return;

    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // safe fallback if pointer capture is not supported
    }

    setIsDragging(true);
    const newProgress = calculatePercentage(e.clientX);
    setLocalProgress(newProgress);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    e.stopPropagation();
    e.preventDefault();
    const newProgress = calculatePercentage(e.clientX);
    setLocalProgress(newProgress);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    e.stopPropagation();
    e.preventDefault();
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // safe fallback
    }

    setIsDragging(false);
    const finalProgress = calculatePercentage(e.clientX);
    setLocalProgress(finalProgress);
    commitProgressChange(finalProgress);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    let nextProgress = localProgress;
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
      nextProgress = Math.min(100, localProgress + 5);
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
      nextProgress = Math.max(0, localProgress - 5);
    } else if (e.key === 'PageUp') {
      nextProgress = Math.min(100, localProgress + 25);
    } else if (e.key === 'PageDown') {
      nextProgress = Math.max(0, localProgress - 25);
    } else if (e.key === 'Home') {
      nextProgress = 0;
    } else if (e.key === 'End') {
      nextProgress = 100;
    } else {
      return;
    }

    e.preventDefault();
    e.stopPropagation();
    setLocalProgress(nextProgress);
    commitProgressChange(nextProgress);
  };

  // Color dynamic logic based on completion percentage
  const getProgressColor = (val: number) => {
    if (val === 100) return 'bg-emerald-500 shadow-emerald-500/40';
    if (val >= 60) return 'bg-[#00AEA9] shadow-[#00AEA9]/40';
    if (val >= 30) return 'bg-[#7B68EE] shadow-[#7B68EE]/40';
    if (val > 0) return 'bg-sky-500 shadow-sky-500/40';
    return 'bg-slate-400';
  };

  const getTextColor = (val: number) => {
    if (val === 100) return 'text-emerald-500 dark:text-emerald-400';
    if (val >= 60) return 'text-[#00AEA9]';
    if (val >= 30) return 'text-[#7B68EE]';
    if (val > 0) return isLight ? 'text-slate-800' : 'text-slate-200';
    return 'text-slate-400';
  };

  const displayProgress = isDragging ? localProgress : initialProgress;

  return (
    <div
      className="relative flex items-center gap-2 select-none group/progressbar py-1"
      onClick={(e) => e.stopPropagation()}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Interactive Drag Track */}
      <div
        ref={barRef}
        role="slider"
        tabIndex={0}
        aria-label={`Task progress: ${displayProgress}%`}
        aria-valuenow={displayProgress}
        aria-valuemin={0}
        aria-valuemax={100}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onKeyDown={handleKeyDown}
        className={`relative ${
          compact ? 'w-16 sm:w-20' : 'w-20 sm:w-24'
        } h-2.5 rounded-full cursor-ew-resize transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00AEA9] ${
          isLight
            ? 'bg-slate-200 hover:bg-slate-300'
            : 'bg-[#233549] hover:bg-[#2b415a]'
        }`}
        title={`Progress: ${displayProgress}% (Click & drag horizontally to update)`}
      >
        {/* Filled bar track */}
        <div
          className={`h-full rounded-full transition-all duration-100 ${getProgressColor(
            displayProgress
          )}`}
          style={{ width: `${displayProgress}%` }}
        />

        {/* Draggable thumb / handle that lights up on hover/drag */}
        <div
          className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full border-2 border-white shadow-md transition-transform duration-75 pointer-events-none ${
            displayProgress === 100
              ? 'bg-emerald-500'
              : displayProgress >= 60
              ? 'bg-[#00AEA9]'
              : displayProgress > 0
              ? 'bg-[#7B68EE]'
              : 'bg-slate-400'
          } ${
            isDragging || isHovered
              ? 'scale-125 opacity-100 ring-2 ring-[#00AEA9]/50'
              : 'scale-90 opacity-0 group-hover/progressbar:opacity-100'
          }`}
          style={{
            left: `${displayProgress}%`,
          }}
        />

        {/* Floating tooltip during active drag */}
        {isDragging && (
          <div
            className="absolute -top-7 -translate-x-1/2 px-1.5 py-0.5 rounded-md text-[10px] font-mono font-bold bg-slate-900 text-white shadow-lg border border-slate-700 pointer-events-none z-30 whitespace-nowrap animate-in fade-in zoom-in-95"
            style={{ left: `${displayProgress}%` }}
          >
            {displayProgress}%
          </div>
        )}
      </div>

      {/* Percentage Text with Quick Preset Popover Trigger */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setShowPresetMenu((prev) => !prev);
        }}
        className={`text-[11px] font-mono font-bold hover:underline cursor-pointer min-w-[32px] text-left transition-colors ${getTextColor(
          displayProgress
        )}`}
        title="Click to select a preset percentage"
      >
        {displayProgress}%
      </button>

      {/* Quick Presets Dropdown */}
      {showPresetMenu && (
        <div
          ref={menuRef}
          className={`absolute left-0 top-full mt-1.5 z-40 p-2.5 rounded-xl border shadow-2xl w-44 animate-in fade-in zoom-in-95 ${
            isLight
              ? 'bg-white border-slate-200 text-slate-800'
              : 'bg-[#16222F] border-[#233549] text-slate-100'
          }`}
        >
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
            <span>Quick Progress</span>
            <span className="font-mono text-[#00AEA9]">{displayProgress}%</span>
          </div>

          <div className="grid grid-cols-5 gap-1">
            {[0, 25, 50, 75, 100].map((pVal) => (
              <button
                key={pVal}
                type="button"
                onClick={() => {
                  setLocalProgress(pVal);
                  commitProgressChange(pVal);
                  setShowPresetMenu(false);
                }}
                className={`py-1 rounded text-[10px] font-mono font-bold transition-all ${
                  displayProgress === pVal
                    ? 'bg-[#00AEA9] text-slate-950 shadow-xs'
                    : isLight
                    ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    : 'bg-[#0D1520] hover:bg-[#233549] text-slate-300'
                }`}
              >
                {pVal}%
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
