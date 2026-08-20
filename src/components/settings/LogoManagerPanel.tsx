import React, { useState } from 'react';
import {
  Image as ImageIcon,
  Check,
  Power,
  RefreshCw,
  Eye,
  EyeOff,
  Sliders,
  Sparkles,
  ExternalLink,
  Code2,
  Copy,
  Layers,
  Building2,
  FolderKanban,
  FileText,
  ShieldCheck,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useLogo, LogoArea, DEFAULT_LOGO_CONFIGS } from '../../context/LogoContext';
import { LogoPlaceholder } from '../common/LogoPlaceholder';

export const LogoManagerPanel: React.FC<{ theme?: string }> = ({ theme = 'dark' }) => {
  const {
    showLogos,
    updateLogoVisibility,
    settings,
    setGlobalEnabled,
    setAreaEnabled,
    setAreaPath,
    setShowPlaceholderBorders,
    enableAllAreas,
    disableAllAreas,
    resetToDefaults
  } = useLogo();

  const [copiedCode, setCopiedCode] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'enabled' | 'disabled'>('all');

  const areasList: LogoArea[] = [
    'header',
    'sidebar',
    'login',
    'emailVerification',
    'dashboard',
    'reports',
    'general'
  ];

  const filteredAreas = areasList.filter(area => {
    const isAreaEnabled = settings.areas[area]?.enabled;
    if (activeFilter === 'enabled') return isAreaEnabled && settings.globalEnabled;
    if (activeFilter === 'disabled') return !isAreaEnabled || !settings.globalEnabled;
    return true;
  });

  const handleCopySnippet = () => {
    const snippet = `<LogoPlaceholder\n  area="header"\n  className="h-7 shrink-0"\n  fallback={<Building2 className="w-5 h-5 text-[#3BC0BB]" />}\n/>`;
    navigator.clipboard.writeText(snippet);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const isLight = theme === 'light';

  return (
    <div className="space-y-6">
      {/* Control Banner */}
      <div className={`p-6 rounded-2xl border transition-all ${
        isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#16222F] border-[#233549] shadow-lg'
      }`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-1.5 max-w-2xl">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-[#3BC0BB]/15 text-[#3BC0BB] border border-[#3BC0BB]/30">
                <Sliders className="w-5 h-5" />
              </div>
              <h3 className={`text-base font-extrabold tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
                Centralized Logo Manager & UI Slot Controller
              </h3>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase font-mono border ${
                settings.globalEnabled 
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                  : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
              }`}>
                {settings.globalEnabled ? '● Rendering Enabled' : '○ Rendering Disabled'}
              </span>
            </div>
            <p className={`text-xs ${isLight ? 'text-slate-600' : 'text-slate-400'} leading-relaxed`}>
              Control workspace logo image rendering across the entire platform. When disabled or if a path is invalid, all UI areas automatically render safe text or icon fallbacks with zero layout shifts.
            </p>
          </div>

          {/* Master Toggles & Quick Actions */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Global Switch */}
            <button
              onClick={() => updateLogoVisibility(!showLogos)}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all shadow-md cursor-pointer ${
                showLogos
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  : 'bg-[#0773BB] hover:bg-[#06619e] text-white'
              }`}
            >
              <Power className="w-4 h-4" />
              <span>{showLogos ? 'Master Logos: Active' : 'Enable Master Logos'}</span>
            </button>

            {/* Placeholder Outline Toggle */}
            <button
              onClick={() => setShowPlaceholderBorders(!settings.showPlaceholderBorders)}
              className={`px-3.5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 border transition-all cursor-pointer ${
                settings.showPlaceholderBorders
                  ? 'bg-[#3BC0BB]/20 text-[#3BC0BB] border-[#3BC0BB]/60'
                  : isLight
                    ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                    : 'bg-[#0D1520] hover:bg-[#1A2838] text-slate-300 border-[#233549]'
              }`}
              title="Highlight all logo slots throughout the application with dashed outlines for easy positioning and debugging"
            >
              {settings.showPlaceholderBorders ? <Eye className="w-4 h-4 text-[#3BC0BB]" /> : <EyeOff className="w-4 h-4" />}
              <span>{settings.showPlaceholderBorders ? 'Slot Outlines On' : 'Highlight Slots'}</span>
            </button>

            {/* Quick Bulk Actions */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={enableAllAreas}
                className={`px-3 py-2 rounded-xl text-xs font-mono font-bold border transition-colors cursor-pointer ${
                  isLight ? 'bg-slate-50 hover:bg-slate-100 border-slate-300 text-slate-700' : 'bg-[#0D1520] hover:bg-[#1A2838] border-[#233549] text-slate-300'
                }`}
                title="Enable all individual UI area slots"
              >
                Enable All
              </button>
              <button
                onClick={disableAllAreas}
                className={`px-3 py-2 rounded-xl text-xs font-mono font-bold border transition-colors cursor-pointer ${
                  isLight ? 'bg-slate-50 hover:bg-slate-100 border-slate-300 text-slate-700' : 'bg-[#0D1520] hover:bg-[#1A2838] border-[#233549] text-slate-300'
                }`}
                title="Disable master logos"
              >
                Disable All
              </button>
              <button
                onClick={resetToDefaults}
                className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                  isLight ? 'bg-slate-50 hover:bg-slate-100 border-slate-300 text-slate-600' : 'bg-[#0D1520] hover:bg-[#1A2838] border-[#233549] text-slate-400 hover:text-white'
                }`}
                title="Reset all logo settings and paths to standard defaults"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Filter bar */}
        <div className="mt-5 pt-4 border-t border-[#233549]/40 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-slate-400">Filter Slots:</span>
            <div className="flex items-center gap-1 bg-[#0D1520] p-1 rounded-xl border border-[#233549]">
              <button
                onClick={() => setActiveFilter('all')}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                  activeFilter === 'all' ? 'bg-[#0773BB] text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                All Slots ({areasList.length})
              </button>
              <button
                onClick={() => setActiveFilter('enabled')}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                  activeFilter === 'enabled' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Active
              </button>
              <button
                onClick={() => setActiveFilter('disabled')}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                  activeFilter === 'disabled' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Disabled
              </button>
            </div>
          </div>

          <button
            onClick={handleCopySnippet}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-mono transition-all cursor-pointer ${
              copiedCode 
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                : isLight
                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                  : 'bg-[#0D1520] hover:bg-[#1A2838] text-slate-300 border-[#233549]'
            }`}
            title="Copy JSX Component Usage Code"
          >
            {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Code2 className="w-3.5 h-3.5 text-[#3BC0BB]" />}
            <span>{copiedCode ? 'Component Snippet Copied!' : 'Copy <LogoPlaceholder /> Spec'}</span>
          </button>
        </div>
      </div>

      {/* Area Configuration Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredAreas.map(area => {
          const config = settings.areas[area] || DEFAULT_LOGO_CONFIGS[area];
          const isSlotActive = settings.globalEnabled && config.enabled && Boolean(config.path && config.path.trim().length > 0);

          return (
            <div
              key={area}
              className={`p-5 rounded-2xl border flex flex-col justify-between space-y-4 transition-all ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0D1520] border-[#233549]'
              } ${isSlotActive ? 'ring-1 ring-emerald-500/30' : ''}`}
            >
              {/* Card Header */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold font-mono text-[#3BC0BB] uppercase tracking-wider">
                      {config.label}
                    </span>
                  </div>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded border uppercase ${
                    isSlotActive 
                      ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30 font-bold'
                      : 'bg-slate-700/30 text-slate-400 border-slate-700'
                  }`}>
                    {isSlotActive ? 'Active' : 'Fallback'}
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed min-h-[32px]">
                  {config.description}
                </p>
              </div>

              {/* Live Preview Box */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span className="font-mono">Live Slot Preview</span>
                  <span className="font-mono uppercase text-[10px] text-slate-500">
                    Ratio: {config.aspectRatio}
                  </span>
                </div>
                <div className="h-32 rounded-xl bg-white flex items-center justify-center p-3 shadow-inner ring-1 ring-slate-200 relative overflow-hidden">
                  {isSlotActive ? (
                    <img
                      src={config.path}
                      alt={config.alt}
                      className="max-h-full max-w-full object-contain"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-center p-2 space-y-1 text-slate-400">
                      <div className="p-2 rounded-xl bg-slate-100 text-slate-600 border border-slate-200">
                        <Building2 className="w-5 h-5" />
                      </div>
                      <span className="text-[11px] font-medium text-slate-500">
                        Fallback Icon / Text Rendered
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Area Path & Controls */}
              <div className="space-y-2.5 pt-2 border-t border-[#233549]/40">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-slate-300 font-mono">
                    Image Asset Path:
                  </label>
                  <button
                    onClick={() => setAreaPath(area, DEFAULT_LOGO_CONFIGS[area].path)}
                    className="text-[10px] text-[#3BC0BB] hover:underline font-mono cursor-pointer"
                  >
                    Reset Path
                  </button>
                </div>
                <input
                  type="text"
                  value={config.path}
                  onChange={(e) => setAreaPath(area, e.target.value)}
                  placeholder="/logos/dolphin-logo.svg"
                  className={`w-full px-3 py-1.5 rounded-lg text-xs font-mono border transition-all ${
                    isLight 
                      ? 'bg-white border-slate-300 text-slate-900 focus:border-[#0773BB]'
                      : 'bg-[#16222F] border-[#233549] text-white focus:border-[#3BC0BB]'
                  }`}
                />

                {/* Individual Slot Switch */}
                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs text-slate-400">Slot Visibility</span>
                  <button
                    onClick={() => setAreaEnabled(area, !config.enabled)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      config.enabled
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    }`}
                  >
                    {config.enabled ? 'Enabled' : 'Disabled'}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
