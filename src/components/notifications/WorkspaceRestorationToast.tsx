import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  RotateCcw,
  CheckCircle2,
  X,
  Building2,
  FolderKanban,
  ExternalLink,
  Layers,
  Sparkles
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

const AUTO_DISMISS_MS = 6000; // 6 seconds

export const WorkspaceRestorationToast: React.FC = () => {
  const {
    restorationToast,
    clearRestorationToast,
    setActiveTab,
    theme
  } = useApp();

  const isLight = theme === 'light';
  const [isHovered, setIsHovered] = useState(false);
  const [progress, setProgress] = useState(100);
  const startTimeRef = useRef<number>(Date.now());
  const remainingTimeRef = useRef<number>(AUTO_DISMISS_MS);
  const animationFrameRef = useRef<number | null>(null);

  // Auto-dismiss with progress tracking and pause on hover
  useEffect(() => {
    if (!restorationToast) {
      setProgress(100);
      remainingTimeRef.current = AUTO_DISMISS_MS;
      return;
    }

    startTimeRef.current = Date.now();
    remainingTimeRef.current = AUTO_DISMISS_MS;
    setProgress(100);

    let lastTick = Date.now();

    const tick = () => {
      const now = Date.now();
      const delta = now - lastTick;
      lastTick = now;

      if (!isHovered) {
        remainingTimeRef.current = Math.max(0, remainingTimeRef.current - delta);
        const percent = (remainingTimeRef.current / AUTO_DISMISS_MS) * 100;
        setProgress(percent);

        if (remainingTimeRef.current <= 0) {
          clearRestorationToast();
          return;
        }
      }

      animationFrameRef.current = requestAnimationFrame(tick);
    };

    animationFrameRef.current = requestAnimationFrame(tick);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [restorationToast, isHovered, clearRestorationToast]);

  // Handle escape key to dismiss
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && restorationToast) {
        clearRestorationToast();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [restorationToast, clearRestorationToast]);

  if (!restorationToast) return null;

  const handleNavigate = () => {
    if (restorationToast.itemType === 'space') {
      setActiveTab('projects');
    } else {
      setActiveTab('workspace');
    }
    clearRestorationToast();
  };

  const getEntityIcon = () => {
    if (restorationToast.itemType === 'workspace') {
      return <Building2 className="w-5 h-5 text-emerald-400" />;
    }
    if (restorationToast.itemType === 'space') {
      return <FolderKanban className="w-5 h-5 text-teal-400" />;
    }
    return <Layers className="w-5 h-5 text-cyan-400" />;
  };

  const getHeadline = () => {
    if (restorationToast.itemType === 'workspace') {
      return 'Workspace Recovered';
    }
    if (restorationToast.itemType === 'space') {
      return 'Space Recovered';
    }
    return 'Workspace Data Recovered';
  };

  return (
    <AnimatePresence>
      <div
        id="workspace-restoration-toast-container"
        className="fixed top-5 right-5 sm:top-6 sm:right-6 z-50 max-w-md w-[calc(100%-2.5rem)] sm:w-auto pointer-events-auto"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className={`relative rounded-2xl border shadow-2xl overflow-hidden backdrop-blur-xl transition-all ${
            isLight
              ? 'bg-white/95 border-emerald-500/40 text-slate-900 shadow-emerald-600/10'
              : 'bg-[#0E1724]/95 border-emerald-500/40 text-white shadow-emerald-950/50'
          }`}
        >
          {/* Top colored accent line */}
          <div className="h-1 w-full bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500" />

          <div className="p-4 sm:p-5">
            {/* Header row: badge and dismiss */}
            <div className="flex items-center justify-between gap-3 mb-2.5">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Recovered from Recycle Bin</span>
                </span>
                {restorationToast.code && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    {restorationToast.code}
                  </span>
                )}
              </div>

              <button
                id="workspace-restoration-toast-close-btn"
                onClick={clearRestorationToast}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
                title="Dismiss toast"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Main Content Info */}
            <div className="flex items-start gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shrink-0 shadow-inner">
                {getEntityIcon()}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                    {getHeadline()}
                  </h4>
                  <span className="text-[11px] text-slate-400 font-mono">Just now</span>
                </div>

                <p className="text-sm font-black tracking-tight text-slate-900 dark:text-white truncate mt-0.5">
                  {restorationToast.title}
                </p>

                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                  {restorationToast.details ||
                    'Item and all associated data have been restored from the 30-day Recycle Bin to active status.'}
                </p>

                {/* Action buttons strip */}
                <div className="flex items-center gap-2 mt-3.5 pt-3 border-t border-slate-100 dark:border-slate-800/80">
                  <button
                    id="workspace-restoration-toast-view-btn"
                    onClick={handleNavigate}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
                  >
                    <span>{restorationToast.itemType === 'space' ? 'View Space' : 'View Workspaces'}</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={clearRestorationToast}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors cursor-pointer"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Progress bar at bottom */}
          <div className="h-1 w-full bg-slate-100 dark:bg-slate-800/60 overflow-hidden">
            <div
              className="h-full bg-emerald-500 transition-all duration-75 ease-linear"
              style={{ width: `${progress}%` }}
            />
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
