import React, { useState } from 'react';
import {
  useLogo,
  LogoArea,
  DEFAULT_LOGO_CONFIGS
} from '../../context/LogoContext';
import { AREA_DIMENSION_SPECS } from './LogoSettings';
import {
  Crosshair,
  Grid,
  Sun,
  Moon,
  Maximize2,
  CheckCircle2,
  AlertTriangle,
  Building2,
  FolderKanban,
  ShieldCheck,
  FileText,
  Sparkles,
  Edit3,
  Power,
  Check,
  Save,
  Info,
  Search,
  Bell,
  User as UserIcon,
  Home,
  CheckSquare,
  MessageSquare,
  Settings as SettingsIcon,
  ChevronRight,
  Layers,
  Compass
} from 'lucide-react';

interface LogoVisualPreviewSectionProps {
  theme?: string;
  activeCompanyOverride: string;
  onSelectArea: (area: LogoArea) => void;
  onConfirmSavedAlignments?: () => void;
}

type SurfaceMode = 'dark' | 'light' | 'checkerboard';
type CategoryFilter = 'all' | 'core' | 'extended';

export const LogoVisualPreviewSection: React.FC<LogoVisualPreviewSectionProps> = ({
  theme = 'dark',
  activeCompanyOverride,
  onSelectArea,
  onConfirmSavedAlignments
}) => {
  const {
    getLogoForArea,
    settings,
    setAreaEnabled,
    showLogos
  } = useLogo();

  const [surfaceMode, setSurfaceMode] = useState<SurfaceMode>('dark');
  const [showCrosshairs, setShowCrosshairs] = useState<boolean>(true);
  const [zoomLevel, setZoomLevel] = useState<'1x' | '1.25x'>('1x');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('core');
  const [confirmedState, setConfirmedState] = useState<boolean>(false);

  const isLight = theme === 'light';
  const companyId = activeCompanyOverride === 'global' ? undefined : activeCompanyOverride;

  const coreCategories: LogoArea[] = ['sidebar', 'header', 'login'];
  const extendedCategories: LogoArea[] = ['reports', 'emailVerification', 'dashboard'];
  
  const displayedCategories: LogoArea[] = 
    categoryFilter === 'core' 
      ? coreCategories 
      : categoryFilter === 'extended' 
        ? extendedCategories 
        : ['sidebar', 'header', 'login', 'reports', 'emailVerification', 'dashboard', 'general'];

  const handleConfirm = () => {
    setConfirmedState(true);
    if (onConfirmSavedAlignments) {
      onConfirmSavedAlignments();
    }
    setTimeout(() => setConfirmedState(false), 3000);
  };

  // Helper for background container style
  const getSurfaceBgClasses = () => {
    switch (surfaceMode) {
      case 'light':
        return 'bg-white border-slate-300 text-slate-900 shadow-sm';
      case 'checkerboard':
        return 'bg-[linear-gradient(45deg,#1f2937_25%,transparent_25%),linear-gradient(-45deg,#1f2937_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#1f2937_75%),linear-gradient(-45deg,transparent_75%,#1f2937_75%)] bg-[size:16px_16px] bg-[#111827] border-slate-700 text-white';
      case 'dark':
      default:
        return 'bg-[#0D1520] border-[#233549] text-white shadow-inner';
    }
  };

  return (
    <div
      id="logo-visual-alignment-preview-section"
      className={`p-6 rounded-2xl border transition-all space-y-6 ${
        isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#16222F] border-[#233549] shadow-xl'
      }`}
    >
      {/* Header Bar & Control Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[#233549]/60">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="p-2 rounded-xl bg-[#3BC0BB]/20 text-[#3BC0BB] border border-[#3BC0BB]/40">
              <Compass className="w-5 h-5" />
            </div>
            <h3 className={`text-base font-extrabold tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
              Multi-Category Visual Alignment & Live Context Preview
            </h3>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase bg-[#0773BB]/20 text-[#3BC0BB] border border-[#0773BB]/40">
              Realtime Context
            </span>
          </div>
          <p className={`text-xs ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
            Simulate realistic UI placements for <strong>Sidebar</strong>, <strong>Header</strong>, and <strong>Login</strong> modal to verify optical balance, padding, and crosshair alignment before saving.
          </p>
        </div>

        {/* Action Controls & Preview Switches */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Category Filter Pills */}
          <div className="flex items-center p-1 rounded-xl bg-[#0D1520] border border-[#233549]">
            <button
              onClick={() => setCategoryFilter('core')}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                categoryFilter === 'core'
                  ? 'bg-[#0773BB] text-white shadow-sm font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Primary (Sidebar, Header, Login)
            </button>
            <button
              onClick={() => setCategoryFilter('extended')}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                categoryFilter === 'extended'
                  ? 'bg-[#0773BB] text-white shadow-sm font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Reports & Auth
            </button>
            <button
              onClick={() => setCategoryFilter('all')}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                categoryFilter === 'all'
                  ? 'bg-[#0773BB] text-white shadow-sm font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              All Slots ({Object.keys(DEFAULT_LOGO_CONFIGS).length})
            </button>
          </div>

          {/* Alignment Guides Crosshair Toggle */}
          <button
            onClick={() => setShowCrosshairs(!showCrosshairs)}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 border transition-all cursor-pointer ${
              showCrosshairs
                ? 'bg-[#3BC0BB]/20 text-[#3BC0BB] border-[#3BC0BB]/60 shadow-sm'
                : isLight
                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                  : 'bg-[#0D1520] hover:bg-[#1A2838] text-slate-400 border-[#233549]'
            }`}
            title="Toggle optical alignment crosshairs and centerlines"
          >
            <Crosshair className="w-3.5 h-3.5 text-[#3BC0BB]" />
            <span>{showCrosshairs ? 'Crosshairs: ON' : 'Show Guides'}</span>
          </button>

          {/* Surface Background Mode */}
          <div className="flex items-center p-1 rounded-xl bg-[#0D1520] border border-[#233549]">
            <button
              onClick={() => setSurfaceMode('dark')}
              className={`px-2 py-1 rounded-lg text-xs transition-all flex items-center gap-1 ${
                surfaceMode === 'dark' ? 'bg-[#0773BB] text-white' : 'text-slate-400 hover:text-white'
              }`}
              title="Preview on dark surface"
            >
              <Moon className="w-3 h-3" />
            </button>
            <button
              onClick={() => setSurfaceMode('light')}
              className={`px-2 py-1 rounded-lg text-xs transition-all flex items-center gap-1 ${
                surfaceMode === 'light' ? 'bg-[#0773BB] text-white' : 'text-slate-400 hover:text-white'
              }`}
              title="Preview on light surface"
            >
              <Sun className="w-3 h-3" />
            </button>
            <button
              onClick={() => setSurfaceMode('checkerboard')}
              className={`px-2 py-1 rounded-lg text-xs font-mono transition-all flex items-center gap-1 ${
                surfaceMode === 'checkerboard' ? 'bg-[#0773BB] text-white' : 'text-slate-400 hover:text-white'
              }`}
              title="Preview with alpha transparency checkerboard"
            >
              <Grid className="w-3 h-3" />
            </button>
          </div>

          {/* Zoom Level */}
          <button
            onClick={() => setZoomLevel(zoomLevel === '1x' ? '1.25x' : '1x')}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-mono border transition-all cursor-pointer ${
              zoomLevel === '1.25x'
                ? 'bg-[#3BC0BB]/20 text-[#3BC0BB] border-[#3BC0BB]/50'
                : 'bg-[#0D1520] text-slate-400 border-[#233549] hover:text-white'
            }`}
            title="Toggle zoom inspection level"
          >
            {zoomLevel}
          </button>

          {/* Confirm Alignments Button */}
          <button
            onClick={handleConfirm}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-md cursor-pointer ${
              confirmedState
                ? 'bg-emerald-600 text-white'
                : 'bg-gradient-to-r from-[#0773BB] to-[#3BC0BB] hover:from-[#06619e] hover:to-[#34aca7] text-white'
            }`}
          >
            {confirmedState ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
            <span>{confirmedState ? 'Alignment Confirmed!' : 'Confirm Alignments'}</span>
          </button>
        </div>
      </div>

      {/* Grid of Contextual Visual Previews */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {/* ========================================================================= */}
        {/* 1. SIDEBAR NAVIGATION DOCK PREVIEW */}
        {/* ========================================================================= */}
        {displayedCategories.includes('sidebar') && (() => {
          const { path, isVisible, alt } = getLogoForArea('sidebar', companyId);
          const spec = AREA_DIMENSION_SPECS.sidebar;
          const isSlotEnabled = settings.areas.sidebar?.enabled ?? false;

          return (
            <div
              key="preview-sidebar"
              className={`rounded-2xl border flex flex-col overflow-hidden transition-all ${
                isLight ? 'bg-slate-50 border-slate-200 shadow-sm' : 'bg-[#0F1823] border-[#233549]'
              }`}
            >
              {/* Card Header */}
              <div className="p-4 border-b border-[#233549]/60 flex items-center justify-between gap-2 bg-[#0A1017]/60">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="p-1.5 rounded-lg bg-[#3BC0BB]/20 text-[#3BC0BB] shrink-0">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-white truncate">
                      Sidebar Navigation Dock
                    </h4>
                    <div className="text-[10px] text-slate-400 font-mono truncate">
                      Slot: <code>sidebar</code> • {spec.recommendedRatioText}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => onSelectArea('sidebar')}
                    className="p-1.5 rounded-lg bg-[#0D1520] hover:bg-[#0773BB] text-slate-300 hover:text-white border border-[#233549] text-xs transition-colors cursor-pointer"
                    title="Configure sidebar logo"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Realistic Mockup Container */}
              <div className={`p-4 flex-1 flex flex-col justify-center items-center ${getSurfaceBgClasses()}`}>
                <div className="w-full max-w-[260px] flex items-center gap-3 p-3 rounded-xl bg-[#090F16] border border-[#233549] shadow-lg">
                  {/* Left Dock Icon with Logo */}
                  <div className="relative group">
                    <div
                      className={`w-11 h-11 rounded-xl flex items-center justify-center p-1.5 transition-all relative overflow-hidden ${
                        isSlotEnabled && showLogos
                          ? 'bg-white border border-white/80 shadow-md ring-1 ring-white/50'
                          : 'bg-white/80 border border-slate-300 text-slate-500'
                      }`}
                      style={{
                        transform: zoomLevel === '1.25x' ? 'scale(1.15)' : 'scale(1)',
                        transition: 'transform 0.2s'
                      }}
                    >
                      {/* Alignment crosshairs overlay */}
                      {showCrosshairs && (
                        <div className="absolute inset-0 pointer-events-none z-10 flex items-center justify-center">
                          <div className="w-full h-[1px] bg-[#0773BB]/40 border-t border-dashed border-[#0773BB]/70" />
                          <div className="absolute h-full w-[1px] bg-[#0773BB]/40 border-l border-dashed border-[#0773BB]/70" />
                          <div className="w-1.5 h-1.5 rounded-full bg-[#0773BB]/80 ring-2 ring-[#0773BB]/30" />
                        </div>
                      )}

                      {path && (isSlotEnabled || !showLogos) ? (
                        <img
                          src={path}
                          alt={alt || 'Sidebar Emblem'}
                          className="w-full h-full object-contain select-none"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/logos/dolphin-logo-emblem.svg';
                          }}
                        />
                      ) : (
                        <Building2 className="w-5 h-5 text-[#0D9488]" />
                      )}
                    </div>
                  </div>

                  {/* Simulated Nav Items */}
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">Dolphin PMS</span>
                      <span className="text-[9px] font-mono px-1 rounded bg-[#3BC0BB]/20 text-[#3BC0BB]">1:1 Center</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-500">
                      <Home className="w-3 h-3 text-[#3BC0BB]" />
                      <CheckSquare className="w-3 h-3 text-slate-400" />
                      <MessageSquare className="w-3 h-3 text-slate-400" />
                      <SettingsIcon className="w-3 h-3 text-slate-400" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Card Footer Status */}
              <div className="p-3 border-t border-[#233549]/60 bg-[#0A1017]/40 flex items-center justify-between text-[11px] font-mono text-slate-400">
                <span className="truncate max-w-[170px]" title={path}>
                  Path: <strong>{path ? path.split('/').pop() : 'Default'}</strong>
                </span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  isSlotEnabled && showLogos ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-700 text-slate-400'
                }`}>
                  {isSlotEnabled && showLogos ? 'Active in UI' : 'Off'}
                </span>
              </div>
            </div>
          );
        })()}

        {/* ========================================================================= */}
        {/* 2. TOP HEADER NAVIGATION BAR PREVIEW */}
        {/* ========================================================================= */}
        {displayedCategories.includes('header') && (() => {
          const { path, isVisible, alt } = getLogoForArea('header', companyId);
          const spec = AREA_DIMENSION_SPECS.header;
          const isSlotEnabled = settings.areas.header?.enabled ?? false;

          return (
            <div
              key="preview-header"
              className={`rounded-2xl border flex flex-col overflow-hidden transition-all ${
                isLight ? 'bg-slate-50 border-slate-200 shadow-sm' : 'bg-[#0F1823] border-[#233549]'
              }`}
            >
              {/* Card Header */}
              <div className="p-4 border-b border-[#233549]/60 flex items-center justify-between gap-2 bg-[#0A1017]/60">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="p-1.5 rounded-lg bg-[#0773BB]/20 text-[#3BC0BB] shrink-0">
                    <FolderKanban className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-white truncate">
                      Top Header Navigation Bar
                    </h4>
                    <div className="text-[10px] text-slate-400 font-mono truncate">
                      Slot: <code>header</code> • {spec.recommendedRatioText}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => onSelectArea('header')}
                    className="p-1.5 rounded-lg bg-[#0D1520] hover:bg-[#0773BB] text-slate-300 hover:text-white border border-[#233549] text-xs transition-colors cursor-pointer"
                    title="Configure header logo"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Realistic Mockup Container */}
              <div className={`p-4 flex-1 flex flex-col justify-center items-center ${getSurfaceBgClasses()}`}>
                <div className="w-full max-w-[320px] rounded-xl bg-[#090F16] border border-[#233549] p-2.5 shadow-lg space-y-2">
                  {/* Top Bar Representation */}
                  <div className="flex items-center justify-between gap-2 border-b border-[#233549]/40 pb-2">
                    {/* Header Logo Anchor */}
                    <div
                      className="relative h-7 flex items-center px-1 rounded bg-[#16222F]/40 border border-[#233549]"
                      style={{
                        transform: zoomLevel === '1.25x' ? 'scale(1.15)' : 'scale(1)',
                        transformOrigin: 'left center',
                        transition: 'transform 0.2s'
                      }}
                    >
                      {showCrosshairs && (
                        <div className="absolute inset-0 pointer-events-none z-10 flex items-center justify-center">
                          <div className="w-full h-[1px] bg-[#3BC0BB]/40 border-t border-dashed border-[#3BC0BB]/60" />
                          <div className="absolute h-full w-[1px] bg-[#3BC0BB]/40 border-l border-dashed border-[#3BC0BB]/60" />
                        </div>
                      )}

                      {path && (isSlotEnabled || !showLogos) ? (
                        <img
                          src={path}
                          alt={alt || 'Header Logo'}
                          className="h-6 w-auto max-w-[140px] object-contain select-none"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/logos/dolphin-logo-horizontal.svg';
                          }}
                        />
                      ) : (
                        <span className="text-xs font-extrabold text-[#3BC0BB] px-1 font-mono">DOLPHIN</span>
                      )}
                    </div>

                    {/* Simulated Controls */}
                    <div className="flex items-center gap-1.5 text-slate-500">
                      <div className="w-16 h-5 rounded bg-[#16222F] border border-[#233549] flex items-center px-1 gap-1">
                        <Search className="w-2.5 h-2.5 text-slate-400" />
                        <span className="text-[8px] text-slate-500">Search...</span>
                      </div>
                      <Bell className="w-3.5 h-3.5 text-slate-400" />
                      <div className="w-5 h-5 rounded-full bg-[#0773BB]/40 text-[#3BC0BB] flex items-center justify-center text-[9px] font-bold">
                        A
                      </div>
                    </div>
                  </div>

                  {/* Breadcrumbs */}
                  <div className="flex items-center gap-1 text-[10px] text-slate-400">
                    <span className="text-slate-500">Workspace</span>
                    <ChevronRight className="w-2.5 h-2.5 text-slate-600" />
                    <span className="text-slate-200 font-medium">Executive Portfolio</span>
                  </div>
                </div>
              </div>

              {/* Card Footer Status */}
              <div className="p-3 border-t border-[#233549]/60 bg-[#0A1017]/40 flex items-center justify-between text-[11px] font-mono text-slate-400">
                <span className="truncate max-w-[170px]" title={path}>
                  Path: <strong>{path ? path.split('/').pop() : 'Default'}</strong>
                </span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  isSlotEnabled && showLogos ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-700 text-slate-400'
                }`}>
                  {isSlotEnabled && showLogos ? 'Active in UI' : 'Off'}
                </span>
              </div>
            </div>
          );
        })()}

        {/* ========================================================================= */}
        {/* 3. LOGIN & AUTHENTICATION MODAL PREVIEW */}
        {/* ========================================================================= */}
        {displayedCategories.includes('login') && (() => {
          const { path, isVisible, alt } = getLogoForArea('login', companyId);
          const spec = AREA_DIMENSION_SPECS.login;
          const isSlotEnabled = settings.areas.login?.enabled ?? false;

          return (
            <div
              key="preview-login"
              className={`rounded-2xl border flex flex-col overflow-hidden transition-all ${
                isLight ? 'bg-slate-50 border-slate-200 shadow-sm' : 'bg-[#0F1823] border-[#233549]'
              }`}
            >
              {/* Card Header */}
              <div className="p-4 border-b border-[#233549]/60 flex items-center justify-between gap-2 bg-[#0A1017]/60">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 shrink-0">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-white truncate">
                      Sign-in & Authentication Modal
                    </h4>
                    <div className="text-[10px] text-slate-400 font-mono truncate">
                      Slot: <code>login</code> • {spec.recommendedRatioText}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => onSelectArea('login')}
                    className="p-1.5 rounded-lg bg-[#0D1520] hover:bg-[#0773BB] text-slate-300 hover:text-white border border-[#233549] text-xs transition-colors cursor-pointer"
                    title="Configure login logo"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Realistic Mockup Container */}
              <div className={`p-4 flex-1 flex flex-col justify-center items-center ${getSurfaceBgClasses()}`}>
                <div className="w-full max-w-[240px] rounded-xl bg-[#090F16] border border-[#233549] p-3.5 shadow-xl text-center space-y-2.5">
                  {/* Centered Login Hero Logo */}
                  <div className="flex justify-center">
                    <div
                      className="relative w-14 h-14 rounded-xl bg-[#16222F] border border-[#3BC0BB]/40 p-2 flex items-center justify-center shadow-md overflow-hidden"
                      style={{
                        transform: zoomLevel === '1.25x' ? 'scale(1.15)' : 'scale(1)',
                        transition: 'transform 0.2s'
                      }}
                    >
                      {showCrosshairs && (
                        <div className="absolute inset-0 pointer-events-none z-10 flex items-center justify-center">
                          <div className="w-full h-[1px] bg-[#3BC0BB]/40 border-t border-dashed border-[#3BC0BB]/60" />
                          <div className="absolute h-full w-[1px] bg-[#3BC0BB]/40 border-l border-dashed border-[#3BC0BB]/60" />
                          <div className="w-2 h-2 rounded-full border border-[#3BC0BB] bg-[#3BC0BB]/30" />
                        </div>
                      )}

                      {path && (isSlotEnabled || !showLogos) ? (
                        <img
                          src={path}
                          alt={alt || 'Login Logo'}
                          className="w-full h-full object-contain select-none"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/logos/dolphin-logo-square.svg';
                          }}
                        />
                      ) : (
                        <ShieldCheck className="w-7 h-7 text-[#3BC0BB]" />
                      )}
                    </div>
                  </div>

                  {/* Simulated Form Fields */}
                  <div className="space-y-1.5 text-left">
                    <div className="text-[11px] font-bold text-white text-center">
                      Sign in to Dolphin Portfolio
                    </div>
                    <div className="h-5 rounded bg-[#16222F] border border-[#233549] px-2 flex items-center text-[9px] text-slate-500">
                      user@dolphingroup.com
                    </div>
                    <div className="h-5 rounded bg-[#16222F] border border-[#233549] px-2 flex items-center text-[9px] text-slate-500">
                      ••••••••••••
                    </div>
                    <div className="h-6 rounded bg-[#0773BB] text-white flex items-center justify-center text-[9px] font-bold shadow">
                      Sign In
                    </div>
                  </div>
                </div>
              </div>

              {/* Card Footer Status */}
              <div className="p-3 border-t border-[#233549]/60 bg-[#0A1017]/40 flex items-center justify-between text-[11px] font-mono text-slate-400">
                <span className="truncate max-w-[170px]" title={path}>
                  Path: <strong>{path ? path.split('/').pop() : 'Default'}</strong>
                </span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  isSlotEnabled && showLogos ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-700 text-slate-400'
                }`}>
                  {isSlotEnabled && showLogos ? 'Active in UI' : 'Off'}
                </span>
              </div>
            </div>
          );
        })()}

        {/* ========================================================================= */}
        {/* 4. PRINTABLE PSR REPORTS & EXPORTS PREVIEW */}
        {/* ========================================================================= */}
        {displayedCategories.includes('reports') && (() => {
          const { path, isVisible, alt } = getLogoForArea('reports', companyId);
          const spec = AREA_DIMENSION_SPECS.reports;
          const isSlotEnabled = settings.areas.reports?.enabled ?? false;

          return (
            <div
              key="preview-reports"
              className={`rounded-2xl border flex flex-col overflow-hidden transition-all ${
                isLight ? 'bg-slate-50 border-slate-200 shadow-sm' : 'bg-[#0F1823] border-[#233549]'
              }`}
            >
              {/* Card Header */}
              <div className="p-4 border-b border-[#233549]/60 flex items-center justify-between gap-2 bg-[#0A1017]/60">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-300 shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-white truncate">
                      Printable Client PSR Reports
                    </h4>
                    <div className="text-[10px] text-slate-400 font-mono truncate">
                      Slot: <code>reports</code> • {spec.recommendedRatioText}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => onSelectArea('reports')}
                  className="p-1.5 rounded-lg bg-[#0D1520] hover:bg-[#0773BB] text-slate-300 hover:text-white border border-[#233549] text-xs transition-colors cursor-pointer"
                  title="Configure reports logo"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Realistic Report Sheet Mockup */}
              <div className={`p-4 flex-1 flex flex-col justify-center items-center ${getSurfaceBgClasses()}`}>
                <div className="w-full max-w-[280px] bg-white text-slate-900 rounded-xl p-3 shadow-xl border border-slate-300 space-y-2">
                  <div className="flex items-start justify-between gap-2 border-b border-slate-200 pb-2">
                    <div
                      className="relative h-8 flex items-center"
                      style={{
                        transform: zoomLevel === '1.25x' ? 'scale(1.15)' : 'scale(1)',
                        transformOrigin: 'left center'
                      }}
                    >
                      {showCrosshairs && (
                        <div className="absolute inset-0 pointer-events-none z-10 flex items-center justify-center">
                          <div className="w-full h-[1px] bg-[#0773BB]/40 border-t border-dashed border-[#0773BB]/70" />
                          <div className="absolute h-full w-[1px] bg-[#0773BB]/40 border-l border-dashed border-[#0773BB]/70" />
                        </div>
                      )}
                      {path && (isSlotEnabled || !showLogos) ? (
                        <img
                          src={path}
                          alt={alt || 'Report Logo'}
                          className="h-7 w-auto max-w-[130px] object-contain select-none"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/logos/dolphin-logo-horizontal.svg';
                          }}
                        />
                      ) : (
                        <span className="text-xs font-bold text-[#0773BB]">DOLPHIN GROUP</span>
                      )}
                    </div>
                    <div className="text-right text-[8px] font-mono text-slate-500">
                      <div>PSR-2026-Q3</div>
                      <div>CONFIDENTIAL</div>
                    </div>
                  </div>
                  <div className="text-[10px] font-bold text-slate-800">
                    Project Status Report • Executive Overview
                  </div>
                  <div className="h-1.5 rounded bg-slate-200 w-3/4" />
                  <div className="h-1.5 rounded bg-slate-200 w-1/2" />
                </div>
              </div>

              {/* Card Footer Status */}
              <div className="p-3 border-t border-[#233549]/60 bg-[#0A1017]/40 flex items-center justify-between text-[11px] font-mono text-slate-400">
                <span className="truncate max-w-[170px]" title={path}>
                  Path: <strong>{path ? path.split('/').pop() : 'Default'}</strong>
                </span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  isSlotEnabled && showLogos ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-700 text-slate-400'
                }`}>
                  {isSlotEnabled && showLogos ? 'Active in UI' : 'Off'}
                </span>
              </div>
            </div>
          );
        })()}

        {/* ========================================================================= */}
        {/* 5. EMAIL DOMAIN VERIFICATION GATE PREVIEW */}
        {/* ========================================================================= */}
        {displayedCategories.includes('emailVerification') && (() => {
          const { path, isVisible, alt } = getLogoForArea('emailVerification', companyId);
          const spec = AREA_DIMENSION_SPECS.emailVerification;
          const isSlotEnabled = settings.areas.emailVerification?.enabled ?? false;

          return (
            <div
              key="preview-email"
              className={`rounded-2xl border flex flex-col overflow-hidden transition-all ${
                isLight ? 'bg-slate-50 border-slate-200 shadow-sm' : 'bg-[#0F1823] border-[#233549]'
              }`}
            >
              {/* Card Header */}
              <div className="p-4 border-b border-[#233549]/60 flex items-center justify-between gap-2 bg-[#0A1017]/60">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-300 shrink-0">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-white truncate">
                      Email Verification Gate
                    </h4>
                    <div className="text-[10px] text-slate-400 font-mono truncate">
                      Slot: <code>emailVerification</code> • {spec.recommendedRatioText}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => onSelectArea('emailVerification')}
                  className="p-1.5 rounded-lg bg-[#0D1520] hover:bg-[#0773BB] text-slate-300 hover:text-white border border-[#233549] text-xs transition-colors cursor-pointer"
                  title="Configure email verification logo"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Realistic Email Gate Mockup */}
              <div className={`p-4 flex-1 flex flex-col justify-center items-center ${getSurfaceBgClasses()}`}>
                <div className="w-full max-w-[240px] rounded-xl bg-[#090F16] border border-[#233549] p-3 shadow-xl text-center space-y-2">
                  <div className="flex justify-center">
                    <div
                      className="relative w-12 h-12 rounded-xl bg-[#16222F] border border-[#3BC0BB]/40 p-2 flex items-center justify-center shadow-md overflow-hidden"
                      style={{
                        transform: zoomLevel === '1.25x' ? 'scale(1.15)' : 'scale(1)',
                        transition: 'transform 0.2s'
                      }}
                    >
                      {showCrosshairs && (
                        <div className="absolute inset-0 pointer-events-none z-10 flex items-center justify-center">
                          <div className="w-full h-[1px] bg-[#3BC0BB]/40 border-t border-dashed border-[#3BC0BB]/60" />
                          <div className="absolute h-full w-[1px] bg-[#3BC0BB]/40 border-l border-dashed border-[#3BC0BB]/60" />
                        </div>
                      )}
                      {path && (isSlotEnabled || !showLogos) ? (
                        <img
                          src={path}
                          alt={alt || 'Verification Emblem'}
                          className="w-full h-full object-contain select-none"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/logos/dolphin-logo-square.svg';
                          }}
                        />
                      ) : (
                        <ShieldCheck className="w-6 h-6 text-[#3BC0BB]" />
                      )}
                    </div>
                  </div>
                  <div className="text-[11px] font-bold text-white">Domain Verification</div>
                  <div className="text-[9px] text-slate-400">
                    Verify authorization for @dolphingroup.com
                  </div>
                </div>
              </div>

              {/* Card Footer Status */}
              <div className="p-3 border-t border-[#233549]/60 bg-[#0A1017]/40 flex items-center justify-between text-[11px] font-mono text-slate-400">
                <span className="truncate max-w-[170px]" title={path}>
                  Path: <strong>{path ? path.split('/').pop() : 'Default'}</strong>
                </span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  isSlotEnabled && showLogos ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-700 text-slate-400'
                }`}>
                  {isSlotEnabled && showLogos ? 'Active in UI' : 'Off'}
                </span>
              </div>
            </div>
          );
        })()}

        {/* ========================================================================= */}
        {/* 6. DASHBOARD HERO WELCOME BANNER PREVIEW */}
        {/* ========================================================================= */}
        {displayedCategories.includes('dashboard') && (() => {
          const { path, isVisible, alt } = getLogoForArea('dashboard', companyId);
          const spec = AREA_DIMENSION_SPECS.dashboard;
          const isSlotEnabled = settings.areas.dashboard?.enabled ?? false;

          return (
            <div
              key="preview-dashboard"
              className={`rounded-2xl border flex flex-col overflow-hidden transition-all ${
                isLight ? 'bg-slate-50 border-slate-200 shadow-sm' : 'bg-[#0F1823] border-[#233549]'
              }`}
            >
              {/* Card Header */}
              <div className="p-4 border-b border-[#233549]/60 flex items-center justify-between gap-2 bg-[#0A1017]/60">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="p-1.5 rounded-lg bg-pink-500/20 text-pink-300 shrink-0">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-white truncate">
                      Dashboard Hero Welcome Banner
                    </h4>
                    <div className="text-[10px] text-slate-400 font-mono truncate">
                      Slot: <code>dashboard</code> • {spec.recommendedRatioText}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => onSelectArea('dashboard')}
                  className="p-1.5 rounded-lg bg-[#0D1520] hover:bg-[#0773BB] text-slate-300 hover:text-white border border-[#233549] text-xs transition-colors cursor-pointer"
                  title="Configure dashboard logo"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Realistic Dashboard Mockup */}
              <div className={`p-4 flex-1 flex flex-col justify-center items-center ${getSurfaceBgClasses()}`}>
                <div className="w-full max-w-[280px] rounded-xl bg-[#090F16] border border-[#233549] p-3 shadow-xl flex items-center gap-3">
                  <div
                    className="relative w-12 h-12 rounded-xl bg-[#16222F] border border-[#3BC0BB]/40 p-2 flex items-center justify-center shrink-0 overflow-hidden"
                    style={{
                      transform: zoomLevel === '1.25x' ? 'scale(1.15)' : 'scale(1)',
                      transition: 'transform 0.2s'
                    }}
                  >
                    {showCrosshairs && (
                      <div className="absolute inset-0 pointer-events-none z-10 flex items-center justify-center">
                        <div className="w-full h-[1px] bg-[#3BC0BB]/40 border-t border-dashed border-[#3BC0BB]/60" />
                        <div className="absolute h-full w-[1px] bg-[#3BC0BB]/40 border-l border-dashed border-[#3BC0BB]/60" />
                      </div>
                    )}
                    {path && (isSlotEnabled || !showLogos) ? (
                      <img
                        src={path}
                        alt={alt || 'Dashboard Logo'}
                        className="w-full h-full object-contain select-none"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/logos/dolphin-logo-square.svg';
                        }}
                      />
                    ) : (
                      <Sparkles className="w-6 h-6 text-[#3BC0BB]" />
                    )}
                  </div>
                  <div className="min-w-0 space-y-0.5">
                    <div className="text-xs font-bold text-white truncate">
                      Welcome to Portfolio OS
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Active: 14 Projects • 89 Tasks
                    </div>
                  </div>
                </div>
              </div>

              {/* Card Footer Status */}
              <div className="p-3 border-t border-[#233549]/60 bg-[#0A1017]/40 flex items-center justify-between text-[11px] font-mono text-slate-400">
                <span className="truncate max-w-[170px]" title={path}>
                  Path: <strong>{path ? path.split('/').pop() : 'Default'}</strong>
                </span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  isSlotEnabled && showLogos ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-700 text-slate-400'
                }`}>
                  {isSlotEnabled && showLogos ? 'Active in UI' : 'Off'}
                </span>
              </div>
            </div>
          );
        })()}
      </div>

      {/* Alignment Verification Checklist & Legend */}
      <div className="p-4 rounded-xl bg-[#0D1520] border border-[#233549] flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs text-slate-300">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-[#3BC0BB] shrink-0" />
          <span>
            Alignment crosshairs (dotted guidelines) display the exact geometrical center of each bounding box. Inspect for off-center artwork or unwanted letterbox margins.
          </span>
        </div>
        <div className="flex items-center gap-3 shrink-0 text-[11px] font-mono">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[#3BC0BB]" />
            <span>Target Center</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded border border-dashed border-[#3BC0BB]" />
            <span>Optical Guideline</span>
          </span>
        </div>
      </div>
    </div>
  );
};
