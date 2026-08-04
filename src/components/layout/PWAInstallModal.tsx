import React, { useState, useEffect } from 'react';
import {
  Smartphone,
  Globe,
  Sparkles,
  Zap,
  CheckCircle2,
  X,
  Share2,
  MoreVertical,
  PlusSquare,
  ShieldCheck,
  RefreshCw,
  Server,
  Download,
  ArrowRight
} from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const PWAInstallModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [activeDeviceTab, setActiveDeviceTab] = useState<'android' | 'ios' | 'desktop'>('android');

  useEffect(() => {
    // Check if running in standalone PWA mode
    if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone) {
      setIsInstalled(true);
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    } else {
      alert(
        'To install on Android:\n1. Open Google Chrome menu (3 dots at top right)\n2. Tap "Add to Home screen" or "Install app"\n\nAny prompt updates in AI Studio will automatically sync instantly to your app!'
      );
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-[#070D14]/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-[#16222F] border border-[#233549] rounded-2xl shadow-2xl overflow-hidden flex flex-col border-t-2 border-t-[#3BC0BB]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Banner */}
        <div className="p-6 bg-gradient-to-r from-[#0D1520] via-[#16222F] to-[#0D1520] border-b border-[#233549] flex items-start justify-between gap-4 relative overflow-hidden">
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-[#0773BB]/10 rounded-full blur-2xl pointer-events-none" />
          <div className="relative z-10 flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-[#0773BB]/20 border border-[#0773BB]/40 text-[#3BC0BB]">
              <Smartphone className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-[#3BC0BB]/20 text-[#3BC0BB] uppercase tracking-wider">
                  Zero-Cost Sync Architecture
                </span>
                <span className="text-xs font-mono text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> $0 Hosting
                </span>
              </div>
              <h2 className="text-xl font-bold text-white mt-1">
                Install Mobile Android App & Web Client
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-[#233549] text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Highlight Box: How Prompt Updates Work */}
        <div className="p-5 bg-[#0D1520]/90 border-b border-[#233549] space-y-3">
          <div className="flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="text-xs text-slate-300 space-y-1">
              <p className="font-semibold text-slate-100">
                100% Instant Synchronization Across Mobile & Web:
              </p>
              <p className="text-slate-400 leading-relaxed">
                Whenever you modify this app in AI Studio using natural language prompts, changes go live immediately on Google's global serverless environment. Your installed Android App and browser bookmark will <strong className="text-[#3BC0BB]">automatically load the newest version</strong> on launch—with <strong className="text-emerald-400">zero manual re-uploads, zero hosting costs, and zero data loss!</strong>
              </p>
            </div>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="px-6 pt-4 flex items-center gap-2 border-b border-[#233549] bg-[#121C28]">
          <button
            onClick={() => setActiveDeviceTab('android')}
            className={`px-4 py-2 text-xs font-bold rounded-t-xl transition-all border-t border-x ${
              activeDeviceTab === 'android'
                ? 'bg-[#16222F] text-[#3BC0BB] border-[#233549]'
                : 'bg-transparent text-slate-400 border-transparent hover:text-slate-200'
            }`}
          >
            📱 Android Installation
          </button>
          <button
            onClick={() => setActiveDeviceTab('ios')}
            className={`px-4 py-2 text-xs font-bold rounded-t-xl transition-all border-t border-x ${
              activeDeviceTab === 'ios'
                ? 'bg-[#16222F] text-[#3BC0BB] border-[#233549]'
                : 'bg-transparent text-slate-400 border-transparent hover:text-slate-200'
            }`}
          >
            🍏 iOS iPhone / iPad
          </button>
          <button
            onClick={() => setActiveDeviceTab('desktop')}
            className={`px-4 py-2 text-xs font-bold rounded-t-xl transition-all border-t border-x ${
              activeDeviceTab === 'desktop'
                ? 'bg-[#16222F] text-[#3BC0BB] border-[#233549]'
                : 'bg-transparent text-slate-400 border-transparent hover:text-slate-200'
            }`}
          >
            💻 Desktop Chrome / Edge
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 space-y-5 flex-1 overflow-y-auto">
          {activeDeviceTab === 'android' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-[#0D1520] border border-[#233549] flex items-center justify-between gap-4">
                <div>
                  <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
                    <span>Direct 1-Tap Android App Installation</span>
                    {isInstalled && (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-mono">
                        Installed
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Installs a native standalone APK icon on your phone homescreen.
                  </p>
                </div>

                <button
                  onClick={handleInstallClick}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#0773BB] to-[#3BC0BB] hover:opacity-90 text-white font-bold text-xs shadow-lg shadow-[#0773BB]/30 flex items-center gap-2 shrink-0 transition-transform active:scale-95"
                >
                  <Download className="w-4 h-4" />
                  <span>Install Android App</span>
                </button>
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
                  Manual Step-by-Step for Android Chrome:
                </h4>
                <ol className="space-y-2 text-xs text-slate-300">
                  <li className="flex items-start gap-3 p-2.5 rounded-lg bg-[#0D1520]/60 border border-[#233549]/60">
                    <span className="w-5 h-5 rounded-full bg-[#0773BB] text-white font-bold flex items-center justify-center shrink-0 text-[11px]">
                      1
                    </span>
                    <span>
                      Open this URL in <strong>Google Chrome</strong> on your Android mobile device.
                    </span>
                  </li>
                  <li className="flex items-start gap-3 p-2.5 rounded-lg bg-[#0D1520]/60 border border-[#233549]/60">
                    <span className="w-5 h-5 rounded-full bg-[#0773BB] text-white font-bold flex items-center justify-center shrink-0 text-[11px]">
                      2
                    </span>
                    <span className="flex items-center gap-1.5 flex-wrap">
                      Tap the <strong>Chrome Options Menu</strong> (<MoreVertical className="w-3.5 h-3.5 inline text-slate-400" /> 3 dots at top right).
                    </span>
                  </li>
                  <li className="flex items-start gap-3 p-2.5 rounded-lg bg-[#0D1520]/60 border border-[#233549]/60">
                    <span className="w-5 h-5 rounded-full bg-[#0773BB] text-white font-bold flex items-center justify-center shrink-0 text-[11px]">
                      3
                    </span>
                    <span>
                      Select <strong>"Add to Home screen"</strong> or <strong>"Install app"</strong>.
                    </span>
                  </li>
                </ol>
              </div>
            </div>
          )}

          {activeDeviceTab === 'ios' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-[#0D1520] border border-[#233549] space-y-3">
                <h3 className="font-bold text-sm text-slate-100">
                  Installing on Apple Safari (iOS / iPadOS)
                </h3>
                <ol className="space-y-2 text-xs text-slate-300">
                  <li className="flex items-center gap-2">
                    <Share2 className="w-4 h-4 text-[#3BC0BB]" />
                    <span>1. Tap the <strong>Share button</strong> at the bottom of Safari.</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <PlusSquare className="w-4 h-4 text-emerald-400" />
                    <span>2. Scroll down and select <strong>"Add to Home Screen"</strong>.</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                    <span>3. Tap <strong>Add</strong> at top right. Launch DOLPHIN GLOBAL HOLDINGS from your iOS home screen!</span>
                  </li>
                </ol>
              </div>
            </div>
          )}

          {activeDeviceTab === 'desktop' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-[#0D1520] border border-[#233549] space-y-3">
                <h3 className="font-bold text-sm text-slate-100">
                  Installing Standalone App on PC / Mac
                </h3>
                <p className="text-xs text-slate-400">
                  Click the install icon in your browser's address bar (right side next to bookmark star) or tap Chrome Menu → Save and Share → Install DOLPHIN GLOBAL HOLDINGS.
                </p>
              </div>
            </div>
          )}

          {/* Core Guarantees Matrix */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
            <div className="p-3 rounded-xl bg-[#0D1520] border border-[#233549] space-y-1">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                <ShieldCheck className="w-4 h-4" />
                <span>Zero Data Loss</span>
              </div>
              <p className="text-[11px] text-slate-400">
                All tasks, projects, & logs remain safely saved in persistent local storage during code updates.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-[#0D1520] border border-[#233549] space-y-1">
              <div className="flex items-center gap-2 text-[#3BC0BB] font-bold text-xs">
                <RefreshCw className="w-4 h-4" />
                <span>Instant Prompt Sync</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Prompt any code changes in AI Studio and they reflect immediately across web & mobile.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-[#0D1520] border border-[#233549] space-y-1">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
                <Zap className="w-4 h-4" />
                <span>$0.00 Hosting</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Google Cloud Run dev preview server is completely free with no domain/hosting maintenance fees.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#0D1520] border-t border-[#233549] flex items-center justify-between">
          <span className="text-xs text-slate-500 font-mono">
            PWA Version 1.0.4 • Manifest & ServiceWorker Active
          </span>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[#16222F] hover:bg-[#233549] text-slate-300 font-bold text-xs transition-colors"
          >
            Close Window
          </button>
        </div>
      </div>
    </div>
  );
};
