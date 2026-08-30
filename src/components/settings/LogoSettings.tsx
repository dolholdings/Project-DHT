import React, { useState, useRef, useEffect } from 'react';
import {
  Image as ImageIcon,
  Upload,
  Link as LinkIcon,
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
  AlertCircle,
  AlertTriangle,
  Trash2,
  Maximize2,
  Sun,
  Moon,
  Info,
  Scale,
  Gauge,
  XCircle,
  ArrowRight,
  Cloud,
  Database
} from 'lucide-react';
import { useLogo, LogoArea, DEFAULT_LOGO_CONFIGS, LogoAreaConfig } from '../../context/LogoContext';
import { useApp } from '../../context/AppContext';
import { LogoVisualPreviewSection } from './LogoVisualPreviewSection';

export interface LogoSettingsProps {
  theme?: string;
}

export interface AreaDimensionSpec {
  area: LogoArea;
  label: string;
  recommendedWidth: number;
  recommendedHeight: number;
  minWidth: number;
  minHeight: number;
  recommendedRatio: number; // width / height
  ratioTolerance: number; // allowed ratio variance
  recommendedRatioText: string;
  description: string;
}

export const AREA_DIMENSION_SPECS: Record<LogoArea, AreaDimensionSpec> = {
  sidebar: {
    area: 'sidebar',
    label: 'Sidebar Navigation Dock',
    recommendedWidth: 128,
    recommendedHeight: 128,
    minWidth: 48,
    minHeight: 48,
    recommendedRatio: 1.0,
    ratioTolerance: 0.25,
    recommendedRatioText: '1:1 Square (128×128 px)',
    description: 'A compact square emblem or vector icon optimized for the 40×40 px sidebar navigation dock.'
  },
  reports: {
    area: 'reports',
    label: 'Printable Client PSR Reports',
    recommendedWidth: 300,
    recommendedHeight: 80,
    minWidth: 180,
    minHeight: 45,
    recommendedRatio: 3.75,
    ratioTolerance: 0.9,
    recommendedRatioText: '3.75:1 Horizontal (300×80 px)',
    description: 'High-resolution horizontal header banner for executive PDF, A4 and printable engineering sheets.'
  },
  header: {
    area: 'header',
    label: 'Top Header Navigation Bar',
    recommendedWidth: 240,
    recommendedHeight: 60,
    minWidth: 120,
    minHeight: 30,
    recommendedRatio: 4.0,
    ratioTolerance: 1.2,
    recommendedRatioText: '4:1 Horizontal (240×60 px)',
    description: 'Horizontal brand lockup sized for the 28–32px top navigation bar.'
  },
  login: {
    area: 'login',
    label: 'Sign-in & Authentication Modal',
    recommendedWidth: 256,
    recommendedHeight: 256,
    minWidth: 96,
    minHeight: 96,
    recommendedRatio: 1.0,
    ratioTolerance: 0.35,
    recommendedRatioText: '1:1 Square (256×256 px)',
    description: 'Prominent square brand mark centered above authentication cards.'
  },
  emailVerification: {
    area: 'emailVerification',
    label: 'Domain Email Verification Badge',
    recommendedWidth: 256,
    recommendedHeight: 256,
    minWidth: 96,
    minHeight: 96,
    recommendedRatio: 1.0,
    ratioTolerance: 0.35,
    recommendedRatioText: '1:1 Square (256×256 px)',
    description: 'Security & workspace domain gatekeeper emblem.'
  },
  dashboard: {
    area: 'dashboard',
    label: 'Dashboard Hero Welcome Banner',
    recommendedWidth: 200,
    recommendedHeight: 200,
    minWidth: 80,
    minHeight: 80,
    recommendedRatio: 1.0,
    ratioTolerance: 0.4,
    recommendedRatioText: '1:1 Square (200×200 px)',
    description: 'Workspace welcome overview badge or brand emblem.'
  },
  general: {
    area: 'general',
    label: 'General Workspace Fallback',
    recommendedWidth: 160,
    recommendedHeight: 160,
    minWidth: 48,
    minHeight: 48,
    recommendedRatio: 1.0,
    ratioTolerance: 0.35,
    recommendedRatioText: '1:1 Square (160×160 px)',
    description: 'Standard fallback brand mark for miscellaneous dialogs and badges.'
  }
};

export interface LogoDimensionReport {
  width: number;
  height: number;
  aspectRatio: number;
  isVector: boolean;
  isSuboptimal: boolean;
  severity: 'optimal' | 'warning' | 'critical';
  warnings: string[];
  recommendation: string;
}

export function validateLogoDimensions(
  width: number,
  height: number,
  area: LogoArea,
  isVector = false
): LogoDimensionReport {
  const spec = AREA_DIMENSION_SPECS[area] || AREA_DIMENSION_SPECS.general;
  const ratio = width / (height || 1);
  const ratioDiff = Math.abs(ratio - spec.recommendedRatio);
  const warnings: string[] = [];

  let severity: 'optimal' | 'warning' | 'critical' = 'optimal';

  // 1. Check Aspect Ratio deviation
  if (ratioDiff > spec.ratioTolerance) {
    if (spec.recommendedRatio >= 3.0 && ratio < 1.8) {
      warnings.push(
        `Image is too tall or square (${ratio.toFixed(2)}:1). The "${spec.label}" slot expects a wide horizontal banner (~${spec.recommendedRatioText}). It will appear small or heavily letterboxed.`
      );
      severity = 'critical';
    } else if (spec.recommendedRatio <= 1.2 && ratio > 2.0) {
      warnings.push(
        `Image is too wide (${ratio.toFixed(2)}:1). The "${spec.label}" slot expects a square emblem (~${spec.recommendedRatioText}). It will appear shrunk or squished inside the container.`
      );
      severity = 'critical';
    } else {
      warnings.push(
        `Suboptimal aspect ratio: Detected ${ratio.toFixed(2)}:1 vs recommended ${spec.recommendedRatioText}.`
      );
      severity = 'warning';
    }
  }

  // 2. Check Resolution (for raster formats)
  if (!isVector) {
    if (width < spec.minWidth || height < spec.minHeight) {
      warnings.push(
        `Low resolution (${width}×${height} px): Below minimum recommended size (${spec.minWidth}×${spec.minHeight} px). The logo may appear blurry or pixelated on high-DPI retina screens.`
      );
      severity = 'critical';
    } else if (width > 3200 || height > 3200) {
      warnings.push(
        `Large resolution (${width}×${height} px): Image is larger than necessary. Consider resizing to ~${spec.recommendedWidth * 2}×${spec.recommendedHeight * 2} px for faster page loading.`
      );
      if (severity === 'optimal') severity = 'warning';
    }
  }

  const isSuboptimal = warnings.length > 0;

  return {
    width,
    height,
    aspectRatio: ratio,
    isVector,
    isSuboptimal,
    severity,
    warnings,
    recommendation: `Recommended: ${spec.recommendedWidth}×${spec.recommendedHeight} px (${spec.recommendedRatioText})`
  };
}

const PRESET_LOGOS = [
  {
    name: 'Horizontal Brand Logo',
    path: '/logos/dolphin-logo-horizontal.svg',
    type: 'horizontal' as const,
    recommendedFor: ['header', 'reports'] as LogoArea[],
    badge: '3.75:1 / 4:1'
  },
  {
    name: 'Square Corporate Logo',
    path: '/logos/dolphin-logo-square.svg',
    type: 'square' as const,
    recommendedFor: ['login', 'emailVerification', 'dashboard', 'general'] as LogoArea[],
    badge: '1:1 Square'
  },
  {
    name: 'Vector Emblem Icon',
    path: '/logos/dolphin-logo-emblem.svg',
    type: 'emblem' as const,
    recommendedFor: ['sidebar'] as LogoArea[],
    badge: 'Icon / Emblem'
  },
  {
    name: 'Root Horizontal SVG',
    path: '/dolphin-logo-horizontal.svg',
    type: 'horizontal' as const,
    recommendedFor: ['header', 'reports'] as LogoArea[],
    badge: 'Root Asset'
  },
  {
    name: 'Root Master SVG',
    path: '/dolphin-logo.svg',
    type: 'square' as const,
    recommendedFor: ['login', 'dashboard'] as LogoArea[],
    badge: 'Root Master'
  }
];

interface PendingUpload {
  file: File;
  dataUrl: string;
  areaTarget: LogoArea;
  fileName: string;
  fileSize: number;
  report: LogoDimensionReport;
}

export const LogoSettings: React.FC<LogoSettingsProps> = ({ theme = 'dark' }) => {
  const {
    showLogos,
    updateLogoVisibility,
    settings,
    isSyncedWithFirebase,
    isSavingToFirebase,
    saveToFirebase,
    setGlobalEnabled,
    setAreaEnabled,
    setAreaPath,
    setShowPlaceholderBorders,
    setCompanyOverride,
    enableAllAreas,
    disableAllAreas,
    resetToDefaults
  } = useLogo();

  const { companies, logActivity, currentUser } = useApp();

  const [activeArea, setActiveArea] = useState<LogoArea>('header');
  const [activeCompanyOverride, setActiveCompanyOverride] = useState<string>('global');
  const [copiedCode, setCopiedCode] = useState(false);
  const [previewTheme, setPreviewTheme] = useState<'both' | 'dark' | 'light'>('both');
  const [dragOverArea, setDragOverArea] = useState<LogoArea | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Validation state
  const [pendingUpload, setPendingUpload] = useState<PendingUpload | null>(null);
  const [currentSlotReport, setCurrentSlotReport] = useState<LogoDimensionReport | null>(null);
  const [isInspectingCurrent, setIsInspectingCurrent] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const isLight = theme === 'light';

  const areasList: LogoArea[] = [
    'header',
    'sidebar',
    'login',
    'emailVerification',
    'dashboard',
    'reports',
    'general'
  ];

  const currentAreaConfig: LogoAreaConfig = settings.areas[activeArea] || DEFAULT_LOGO_CONFIGS[activeArea];
  const currentSpec = AREA_DIMENSION_SPECS[activeArea] || AREA_DIMENSION_SPECS.general;

  // Resolve current active path for the selected company/global
  const currentPath = activeCompanyOverride === 'global'
    ? currentAreaConfig.path
    : (settings.companyOverrides[activeCompanyOverride]?.[activeArea] || currentAreaConfig.path);

  // Inspect dimensions of current active image
  useEffect(() => {
    if (!currentPath || currentPath.trim() === '') {
      setCurrentSlotReport(null);
      return;
    }

    setIsInspectingCurrent(true);
    const img = new Image();
    const isSvg = currentPath.toLowerCase().endsWith('.svg') || currentPath.startsWith('data:image/svg+xml');

    img.onload = () => {
      const width = img.naturalWidth || (isSvg ? currentSpec.recommendedWidth : 200);
      const height = img.naturalHeight || (isSvg ? currentSpec.recommendedHeight : 200);
      const report = validateLogoDimensions(width, height, activeArea, isSvg);
      setCurrentSlotReport(report);
      setIsInspectingCurrent(false);
    };

    img.onerror = () => {
      setCurrentSlotReport(null);
      setIsInspectingCurrent(false);
    };

    img.src = currentPath;
  }, [currentPath, activeArea]);

  const inspectAndValidateFile = (file: File, dataUrl: string, areaTarget: LogoArea) => {
    const isSvg = file.type === 'image/svg+xml' || file.name.toLowerCase().endsWith('.svg');

    if (isSvg) {
      // Try to parse SVG dimensions / viewBox
      try {
        const parser = new DOMParser();
        const reader = new FileReader();
        reader.onload = (e) => {
          const text = e.target?.result as string;
          const svgDoc = parser.parseFromString(text, 'image/svg+xml');
          const svgElement = svgDoc.querySelector('svg');

          let width = currentSpec.recommendedWidth;
          let height = currentSpec.recommendedHeight;

          if (svgElement) {
            const viewBox = svgElement.getAttribute('viewBox');
            const svgWidth = parseFloat(svgElement.getAttribute('width') || '0');
            const svgHeight = parseFloat(svgElement.getAttribute('height') || '0');

            if (viewBox) {
              const parts = viewBox.split(/[\s,]+/).map(Number);
              if (parts.length >= 4 && parts[2] > 0 && parts[3] > 0) {
                width = parts[2];
                height = parts[3];
              }
            } else if (svgWidth > 0 && svgHeight > 0) {
              width = svgWidth;
              height = svgHeight;
            }
          }

          const report = validateLogoDimensions(width, height, areaTarget, true);
          handleValidationOutcome(file, dataUrl, areaTarget, report);
        };
        reader.readAsText(file);
      } catch (err) {
        // Fallback to Image() load
        const img = new Image();
        img.onload = () => {
          const report = validateLogoDimensions(img.naturalWidth || currentSpec.recommendedWidth, img.naturalHeight || currentSpec.recommendedHeight, areaTarget, true);
          handleValidationOutcome(file, dataUrl, areaTarget, report);
        };
        img.src = dataUrl;
      }
    } else {
      // Bitmap file: PNG, JPG, WebP
      const img = new Image();
      img.onload = () => {
        const width = img.naturalWidth || 0;
        const height = img.naturalHeight || 0;
        const report = validateLogoDimensions(width, height, areaTarget, false);
        handleValidationOutcome(file, dataUrl, areaTarget, report);
      };
      img.onerror = () => {
        setErrorMessage(`Could not decode image "${file.name}".`);
      };
      img.src = dataUrl;
    }
  };

  const handleValidationOutcome = (
    file: File,
    dataUrl: string,
    areaTarget: LogoArea,
    report: LogoDimensionReport
  ) => {
    if (report.isSuboptimal) {
      // Prompt user with validation warning card/modal
      setPendingUpload({
        file,
        dataUrl,
        areaTarget,
        fileName: file.name,
        fileSize: file.size,
        report
      });
    } else {
      // Dimensions are optimal; apply directly
      applyUploadedLogo(file, dataUrl, areaTarget);
      setSuccessMessage(
        `✓ Uploaded and validated "${file.name}" (${report.width}×${report.height} px). Optimal for ${AREA_DIMENSION_SPECS[areaTarget].label}!`
      );
      setTimeout(() => setSuccessMessage(null), 5000);
    }
  };

  const applyUploadedLogo = (file: File, dataUrl: string, areaTarget: LogoArea) => {
    if (activeCompanyOverride === 'global') {
      setAreaPath(areaTarget, dataUrl);
      setAreaEnabled(areaTarget, true);
    } else {
      setCompanyOverride(activeCompanyOverride, areaTarget, dataUrl);
    }

    logActivity(
      'Updated workspace logo asset',
      `Uploaded custom logo for ${areaTarget} slot (${file.name})`,
      'document',
      undefined,
      undefined,
      `Size: ${(file.size / 1024).toFixed(1)} KB`,
      'info'
    );
  };

  const handleFileUpload = (file: File, areaTarget: LogoArea) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMessage(`Invalid file format "${file.name}". Please upload an image file (SVG, PNG, JPG, WebP).`);
      setTimeout(() => setErrorMessage(null), 4000);
      return;
    }

    // Limit size to 5MB
    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage(`File is too large (${(file.size / 1024 / 1024).toFixed(2)}MB). Maximum allowed logo size is 5MB.`);
      setTimeout(() => setErrorMessage(null), 4000);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      if (dataUrl) {
        inspectAndValidateFile(file, dataUrl, areaTarget);
      }
    };

    reader.onerror = () => {
      setErrorMessage('Failed to read image file. Please try again.');
      setTimeout(() => setErrorMessage(null), 4000);
    };

    reader.readAsDataURL(file);
  };

  const handleConfirmSuboptimalUpload = () => {
    if (!pendingUpload) return;
    applyUploadedLogo(pendingUpload.file, pendingUpload.dataUrl, pendingUpload.areaTarget);
    setSuccessMessage(`Applied "${pendingUpload.fileName}" to ${pendingUpload.areaTarget} logo slot (with dimensional notes).`);
    setPendingUpload(null);
    setTimeout(() => setSuccessMessage(null), 4000);
  };

  const handleCancelPendingUpload = () => {
    setPendingUpload(null);
  };

  const handleDrop = (e: React.DragEvent, areaTarget: LogoArea) => {
    e.preventDefault();
    setDragOverArea(null);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0], areaTarget);
    }
  };

  const handleUrlChange = (newUrl: string) => {
    if (activeCompanyOverride === 'global') {
      setAreaPath(activeArea, newUrl);
    } else {
      setCompanyOverride(activeCompanyOverride, activeArea, newUrl);
    }
  };

  const handleCopySnippet = () => {
    const snippet = `<LogoPlaceholder\n  area="${activeArea}"\n  className="h-7 shrink-0"\n  fallback={<Building2 className="w-5 h-5 text-[#3BC0BB]" />}\n/>`;
    navigator.clipboard.writeText(snippet);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleApplyPreset = (presetPath: string) => {
    handleUrlChange(presetPath);
    setSuccessMessage(`Preset logo applied to ${activeArea} slot!`);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const handleClearLogo = () => {
    handleUrlChange('');
    setSuccessMessage(`Logo path cleared for ${activeArea} slot.`);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const handleResetToDefault = () => {
    const defaultPath = DEFAULT_LOGO_CONFIGS[activeArea].path;
    handleUrlChange(defaultPath);
    setAreaEnabled(activeArea, true);
    setSuccessMessage(`Reset ${activeArea} logo to standard default path.`);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Toast Notifications */}
      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 flex items-center justify-between gap-3 text-xs font-medium animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage(null)} className="text-emerald-400 hover:text-white text-xs">✕</button>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 flex items-center justify-between gap-3 text-xs font-medium animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage(null)} className="text-rose-400 hover:text-white text-xs">✕</button>
        </div>
      )}

      {/* Suboptimal Dimension Validation Modal / Interactive Warning Dialog */}
      {pendingUpload && (
        <div className="p-5 rounded-2xl bg-amber-500/10 border-2 border-amber-500/40 text-amber-200 shadow-xl space-y-4 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 shrink-0 mt-0.5">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono text-[10px] font-bold uppercase border border-amber-500/40">
                    Dimension Warning: Suboptimal Logo Size
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    Slot: <strong>{AREA_DIMENSION_SPECS[pendingUpload.areaTarget].label}</strong>
                  </span>
                </div>
                <h4 className="text-sm font-bold text-white">
                  The uploaded image &quot;{pendingUpload.fileName}&quot; deviates from recommended proportions.
                </h4>
              </div>
            </div>
            <button
              onClick={handleCancelPendingUpload}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <XCircle className="w-5 h-5" />
            </button>
          </div>

          {/* Dimension Comparison Matrix */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
            <div className="p-3.5 rounded-xl bg-[#0D1520] border border-amber-500/30 space-y-1.5">
              <div className="text-[10px] font-mono uppercase text-amber-400 font-bold flex items-center gap-1.5">
                <Scale className="w-3.5 h-3.5" /> Detected Image Proportions
              </div>
              <div className="text-sm font-bold text-white font-mono">
                {pendingUpload.report.width} × {pendingUpload.report.height} px
              </div>
              <div className="text-xs text-slate-300 font-mono flex items-center gap-2">
                <span>Aspect Ratio: <strong>{pendingUpload.report.aspectRatio.toFixed(2)}:1</strong></span>
                <span className="text-slate-500">•</span>
                <span>Type: {pendingUpload.report.isVector ? 'SVG Vector' : 'Raster'}</span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#0D1520] border border-emerald-500/30 space-y-1.5">
              <div className="text-[10px] font-mono uppercase text-emerald-400 font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" /> Recommended Proportions for {AREA_DIMENSION_SPECS[pendingUpload.areaTarget].label}
              </div>
              <div className="text-sm font-bold text-emerald-300 font-mono">
                {AREA_DIMENSION_SPECS[pendingUpload.areaTarget].recommendedWidth} × {AREA_DIMENSION_SPECS[pendingUpload.areaTarget].recommendedHeight} px
              </div>
              <div className="text-xs text-emerald-400/90 font-mono">
                Target Ratio: <strong>{AREA_DIMENSION_SPECS[pendingUpload.areaTarget].recommendedRatioText}</strong>
              </div>
            </div>
          </div>

          {/* List of Detected Warning Items */}
          <div className="p-3 rounded-xl bg-black/30 border border-amber-500/20 space-y-1.5">
            <div className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-amber-400" />
              <span>Inspection Details:</span>
            </div>
            <ul className="space-y-1 text-xs text-amber-100/90 pl-5 list-disc">
              {pendingUpload.report.warnings.map((warn, i) => (
                <li key={i}>{warn}</li>
              ))}
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <p className="text-[11px] text-slate-400">
              You can proceed if you prefer this image, or cancel to crop and upload a matched format.
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCancelPendingUpload}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-700/60 hover:bg-slate-700 text-slate-200 border border-slate-600 transition-colors cursor-pointer"
              >
                Cancel & Try Another
              </button>
              <button
                onClick={handleConfirmSuboptimalUpload}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <span>Accept & Apply Anyway</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Header & Master Controls Card */}
      <div className={`p-6 rounded-2xl border transition-all ${
        isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#16222F] border-[#233549] shadow-lg'
      }`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2.5 flex-wrap">
              <div className="p-2 rounded-xl bg-[#0773BB]/20 text-[#3BC0BB] border border-[#0773BB]/40">
                <ImageIcon className="w-5 h-5" />
              </div>
              <h3 className={`text-base font-extrabold tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
                Workspace Logo Management & Upload Studio
              </h3>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase font-mono border ${
                showLogos 
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                  : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
              }`}>
                {showLogos ? '● Logos Active' : '○ Master Logos Off'}
              </span>
            </div>
            <p className={`text-xs ${isLight ? 'text-slate-600' : 'text-slate-400'} leading-relaxed`}>
              Upload custom image files (SVG, PNG, JPG) or provide image asset URLs for each UI location. Automatic dimension validation ensures optimal display proportions across the entire system.
            </p>
          </div>

          {/* Master Controls */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Firebase Cloud Sync Status Badge */}
            <div className={`px-3 py-2 rounded-xl flex items-center gap-2 border text-xs font-mono ${
              isLight ? 'bg-slate-50 border-slate-200 text-slate-700' : 'bg-[#0D1520] border-[#233549] text-slate-300'
            }`}>
              <div className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${
                  isSavingToFirebase ? 'bg-amber-400 animate-pulse' : isSyncedWithFirebase ? 'bg-emerald-400' : 'bg-rose-400'
                }`} />
                <span className="font-semibold">
                  {isSavingToFirebase ? 'Syncing to Firebase...' : 'Firebase Cloud Synced'}
                </span>
              </div>
            </div>

            {/* Save to Cloud Button */}
            <button
              onClick={async () => {
                await saveToFirebase();
                setSuccessMessage('✓ Branding & Logo settings securely saved to Firebase project (gen-lang-client-0765808259)!');
                setTimeout(() => setSuccessMessage(null), 4000);
              }}
              disabled={isSavingToFirebase}
              className={`px-3 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 border transition-all cursor-pointer shadow-sm ${
                isLight
                  ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-300'
                  : 'bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-300 border-emerald-500/40'
              }`}
              title="Save current branding & logo configuration to Firestore database"
            >
              <Cloud className="w-3.5 h-3.5 text-emerald-400" />
              <span>{isSavingToFirebase ? 'Saving...' : 'Save to Firebase'}</span>
            </button>

            {/* Master Switch */}
            <button
              onClick={() => updateLogoVisibility(!showLogos)}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all shadow-md cursor-pointer ${
                showLogos
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  : 'bg-[#0773BB] hover:bg-[#06619e] text-white'
              }`}
              title="Toggle global logo rendering on or off"
            >
              <Power className="w-4 h-4" />
              <span>{showLogos ? 'Master Switch: ON' : 'Master Switch: OFF'}</span>
            </button>

            {/* Slot Highlighting */}
            <button
              onClick={() => setShowPlaceholderBorders(!settings.showPlaceholderBorders)}
              className={`px-3.5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 border transition-all cursor-pointer ${
                settings.showPlaceholderBorders
                  ? 'bg-[#3BC0BB]/20 text-[#3BC0BB] border-[#3BC0BB]/60'
                  : isLight
                    ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                    : 'bg-[#0D1520] hover:bg-[#1A2838] text-slate-300 border-[#233549]'
              }`}
              title="Highlight all logo slots with dashed badges in the UI for positioning"
            >
              {settings.showPlaceholderBorders ? <Eye className="w-4 h-4 text-[#3BC0BB]" /> : <EyeOff className="w-4 h-4" />}
              <span>{settings.showPlaceholderBorders ? 'Slot Badges ON' : 'Show Slot Badges'}</span>
            </button>

            {/* Enable/Disable All */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={enableAllAreas}
                className={`px-3 py-2 rounded-xl text-xs font-mono font-bold border transition-colors cursor-pointer ${
                  isLight ? 'bg-slate-50 hover:bg-slate-100 border-slate-300 text-slate-700' : 'bg-[#0D1520] hover:bg-[#1A2838] border-[#233549] text-slate-300'
                }`}
                title="Enable all individual slots"
              >
                Enable All
              </button>
              <button
                onClick={disableAllAreas}
                className={`px-3 py-2 rounded-xl text-xs font-mono font-bold border transition-colors cursor-pointer ${
                  isLight ? 'bg-slate-50 hover:bg-slate-100 border-slate-300 text-slate-700' : 'bg-[#0D1520] hover:bg-[#1A2838] border-[#233549] text-slate-300'
                }`}
                title="Disable all individual slots"
              >
                Disable All
              </button>
              <button
                onClick={resetToDefaults}
                className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                  isLight ? 'bg-slate-50 hover:bg-slate-100 border-slate-300 text-slate-600' : 'bg-[#0D1520] hover:bg-[#1A2838] border-[#233549] text-slate-400 hover:text-white'
                }`}
                title="Reset all logo settings and paths to factory defaults"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Company Entity Scope Selector & Recommended Dimension Overview */}
        <div className="mt-5 pt-4 border-t border-[#233549]/40 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-slate-400 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-[#3BC0BB]" />
              <span>Target Scope:</span>
            </span>
            <select
              value={activeCompanyOverride}
              onChange={(e) => setActiveCompanyOverride(e.target.value)}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold border transition-colors ${
                isLight ? 'bg-slate-100 border-slate-300 text-slate-900' : 'bg-[#0D1520] border-[#233549] text-white'
              }`}
            >
              <option value="global">🌐 Global Workspace (All Companies)</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  🏢 {c.name} ({c.code})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 text-[11px] font-mono text-slate-400">
              <Scale className="w-3.5 h-3.5 text-[#3BC0BB]" />
              <span>Slot Recommended Spec:</span>
              <strong className="text-white px-1.5 py-0.5 rounded bg-[#0D1520] border border-[#233549]">
                {currentSpec.recommendedWidth}×{currentSpec.recommendedHeight} px ({currentSpec.recommendedRatioText})
              </strong>
            </div>

            <div className="flex items-center gap-1 bg-[#0D1520] p-1 rounded-xl border border-[#233549]">
              <button
                onClick={() => setPreviewTheme('both')}
                className={`px-2 py-0.5 rounded-lg text-xs font-medium transition-all ${
                  previewTheme === 'both' ? 'bg-[#0773BB] text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Both
              </button>
              <button
                onClick={() => setPreviewTheme('light')}
                className={`px-2 py-0.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1 ${
                  previewTheme === 'light' ? 'bg-[#0773BB] text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Sun className="w-3 h-3" /> Light
              </button>
              <button
                onClick={() => setPreviewTheme('dark')}
                className={`px-2 py-0.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1 ${
                  previewTheme === 'dark' ? 'bg-[#0773BB] text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Moon className="w-3 h-3" /> Dark
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Visual Alignment & Multi-Category Live Preview Section */}
      <LogoVisualPreviewSection
        theme={theme}
        activeCompanyOverride={activeCompanyOverride}
        onSelectArea={(area) => {
          setActiveArea(area);
          const el = document.getElementById('active-slot-editor-panel');
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          }
        }}
        onConfirmSavedAlignments={() => {
          setSuccessMessage('✓ Visually confirmed and validated logo alignments across all UI categories.');
          logActivity(
            'Validated logo alignment across categories',
            `Visual inspection confirmed for sidebar, header, login, and report logos (${activeCompanyOverride} scope)`,
            'document',
            undefined,
            undefined,
            'Visual alignment check: Passed',
            'info'
          );
          setTimeout(() => setSuccessMessage(null), 4000);
        }}
      />

      {/* Main Two-Column Layout: Area Tabs on Left, Active Area Editor on Right */}
      <div id="active-slot-editor-panel" className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: UI Area Selector List */}
        <div className="lg:col-span-4 space-y-2">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">
              Select Logo Slot ({areasList.length})
            </span>
          </div>

          <div className="space-y-2">
            {areasList.map((area) => {
              const cfg = settings.areas[area] || DEFAULT_LOGO_CONFIGS[area];
              const spec = AREA_DIMENSION_SPECS[area] || AREA_DIMENSION_SPECS.general;
              const isSelected = activeArea === area;
              const isSlotActive = showLogos && cfg.enabled && Boolean(cfg.path && cfg.path.trim().length > 0);

              return (
                <button
                  key={area}
                  onClick={() => setActiveArea(area)}
                  className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-center justify-between gap-3 cursor-pointer ${
                    isSelected
                      ? 'bg-[#0773BB] border-[#3BC0BB] text-white shadow-md ring-1 ring-[#3BC0BB]/50'
                      : isLight
                        ? 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                        : 'bg-[#0D1520] hover:bg-[#16222F] border-[#233549] text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`p-2 rounded-lg shrink-0 ${
                      isSelected 
                        ? 'bg-white/20 text-white' 
                        : 'bg-[#16222F] text-[#3BC0BB] border border-[#233549]'
                    }`}>
                      {area === 'header' && <FolderKanban className="w-4 h-4" />}
                      {area === 'sidebar' && <Building2 className="w-4 h-4" />}
                      {area === 'login' && <ShieldCheck className="w-4 h-4" />}
                      {area === 'emailVerification' && <ShieldCheck className="w-4 h-4" />}
                      {area === 'dashboard' && <Sparkles className="w-4 h-4" />}
                      {area === 'reports' && <FileText className="w-4 h-4" />}
                      {area === 'general' && <ImageIcon className="w-4 h-4" />}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold truncate">
                        {cfg.label}
                      </div>
                      <div className={`text-[10px] truncate ${isSelected ? 'text-sky-100' : 'text-slate-400'}`}>
                        {spec.recommendedWidth}×{spec.recommendedHeight} px • {spec.recommendedRatioText}
                      </div>
                    </div>
                  </div>

                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded border uppercase shrink-0 ${
                    isSlotActive
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-bold'
                      : 'bg-slate-700/40 text-slate-400 border-slate-700'
                  }`}>
                    {isSlotActive ? 'Active' : 'Off'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Active Slot Upload & Configuration Panel */}
        <div className="lg:col-span-8 space-y-6">
          <div className={`p-6 rounded-2xl border ${
            isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#16222F] border-[#233549] shadow-lg'
          } space-y-6`}>
            {/* Slot Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#233549]/60">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-[#3BC0BB]/20 text-[#3BC0BB] font-mono text-[10px] font-bold uppercase border border-[#3BC0BB]/30">
                    Slot: {activeArea}
                  </span>
                  <h4 className={`text-base font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    {currentAreaConfig.label}
                  </h4>
                </div>
                <p className={`text-xs mt-1 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                  {currentSpec.description}
                </p>
              </div>

              {/* Slot Visibility Switch */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setAreaEnabled(activeArea, !currentAreaConfig.enabled)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    currentAreaConfig.enabled
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                      : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                  }`}
                >
                  <Power className="w-3.5 h-3.5" />
                  <span>{currentAreaConfig.enabled ? 'Slot Enabled' : 'Slot Disabled'}</span>
                </button>
              </div>
            </div>

            {/* Live Dimension & Proportions Inspector Banner for Current Path */}
            {currentPath && (
              <div className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono transition-all ${
                currentSlotReport?.isSuboptimal
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-200'
                  : 'bg-[#0D1520] border-[#233549] text-slate-300'
              }`}>
                <div className="flex items-center gap-2.5">
                  {currentSlotReport?.isSuboptimal ? (
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                  ) : (
                    <Gauge className="w-4 h-4 text-[#3BC0BB] shrink-0" />
                  )}
                  <div>
                    <div className="font-bold flex items-center gap-2 flex-wrap">
                      <span>Image Spec: {currentSlotReport ? `${currentSlotReport.width}×${currentSlotReport.height} px` : 'Measuring...'}</span>
                      <span className="text-slate-500">•</span>
                      <span>Ratio: {currentSlotReport ? `${currentSlotReport.aspectRatio.toFixed(2)}:1` : '—'}</span>
                      <span className="text-slate-500">•</span>
                      <span className="text-slate-400">{currentSlotReport?.isVector ? 'SVG Vector' : 'Raster Bitmap'}</span>
                    </div>
                    {currentSlotReport?.isSuboptimal && (
                      <div className="text-[11px] text-amber-300/90 mt-0.5">
                        {currentSlotReport.warnings[0]}
                      </div>
                    )}
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-2">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                    currentSlotReport?.isSuboptimal
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  }`}>
                    {currentSlotReport?.isSuboptimal ? 'Suboptimal Size' : '✓ Optimal Dimensions'}
                  </span>
                </div>
              </div>
            )}

            {/* Interactive Live Preview Box */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-300 font-mono">Live Visual Preview</span>
                <span className="text-[11px] font-mono text-slate-400">
                  Target: <strong className="text-[#3BC0BB]">{currentSpec.recommendedWidth}×{currentSpec.recommendedHeight} px ({currentSpec.recommendedRatioText})</strong>
                </span>
              </div>

              <div className={`grid gap-4 ${
                previewTheme === 'both' ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'
              }`}>
                {/* Light Surface Preview */}
                {(previewTheme === 'both' || previewTheme === 'light') && (
                  <div className="space-y-1">
                    <div className="text-[10px] font-mono uppercase text-slate-400 flex items-center gap-1">
                      <Sun className="w-3 h-3 text-amber-400" /> Light Background
                    </div>
                    <div className="h-36 rounded-xl bg-white border border-slate-300 flex items-center justify-center p-4 shadow-inner relative overflow-hidden">
                      {currentPath ? (
                        <img
                          src={currentPath}
                          alt={currentAreaConfig.alt}
                          className="max-h-full max-w-full object-contain"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/logos/dolphin-logo-square.svg';
                          }}
                        />
                      ) : (
                        <div className="text-center text-slate-400 text-xs flex flex-col items-center gap-1">
                          <ImageIcon className="w-6 h-6 text-slate-300" />
                          <span>No logo path defined (Fallback rendered)</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Dark Surface Preview */}
                {(previewTheme === 'both' || previewTheme === 'dark') && (
                  <div className="space-y-1">
                    <div className="text-[10px] font-mono uppercase text-slate-400 flex items-center gap-1">
                      <Moon className="w-3 h-3 text-sky-400" /> Dark Background
                    </div>
                    <div className="h-36 rounded-xl bg-[#0D1520] border border-[#233549] flex items-center justify-center p-4 shadow-inner relative overflow-hidden">
                      {currentPath ? (
                        <img
                          src={currentPath}
                          alt={currentAreaConfig.alt}
                          className="max-h-full max-w-full object-contain"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/logos/dolphin-logo-square.svg';
                          }}
                        />
                      ) : (
                        <div className="text-center text-slate-400 text-xs flex flex-col items-center gap-1">
                          <ImageIcon className="w-6 h-6 text-slate-600" />
                          <span>No logo path defined (Fallback rendered)</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Upload Drag & Drop Zone with Dimension Guidance */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-300 font-mono flex items-center gap-1.5">
                  <Upload className="w-3.5 h-3.5 text-[#3BC0BB]" />
                  <span>Upload Logo File (SVG, PNG, WebP, JPG)</span>
                </label>
                <span className="text-[10px] text-emerald-400 font-mono font-bold">
                  Recommended: {currentSpec.recommendedWidth}×{currentSpec.recommendedHeight} px
                </span>
              </div>

              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOverArea(activeArea);
                }}
                onDragLeave={() => setDragOverArea(null)}
                onDrop={(e) => handleDrop(e, activeArea)}
                onClick={() => fileInputRef.current?.click()}
                className={`p-6 rounded-xl border-2 border-dashed transition-all text-center cursor-pointer flex flex-col items-center justify-center gap-2.5 ${
                  dragOverArea === activeArea
                    ? 'border-[#3BC0BB] bg-[#3BC0BB]/10 text-white'
                    : isLight
                      ? 'border-slate-300 hover:border-[#0773BB] bg-slate-50/50 hover:bg-slate-50'
                      : 'border-[#233549] hover:border-[#3BC0BB]/60 bg-[#0D1520]/60 hover:bg-[#0D1520]'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/svg+xml,image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileUpload(e.target.files[0], activeArea);
                    }
                  }}
                />
                <div className="p-3 rounded-full bg-[#0773BB]/20 text-[#3BC0BB] border border-[#0773BB]/30">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-200">
                    Click to browse or drag & drop image file
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Target: <strong>{currentSpec.recommendedWidth}×{currentSpec.recommendedHeight} px</strong> ({currentSpec.recommendedRatioText}) • Max 5MB
                  </div>
                </div>
              </div>
            </div>

            {/* Direct URL / Path Input */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-300 font-mono flex items-center gap-1.5">
                  <LinkIcon className="w-3.5 h-3.5 text-[#3BC0BB]" />
                  <span>Or Enter Image URL / Public Asset Path</span>
                </label>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleResetToDefault}
                    className="text-[11px] text-[#3BC0BB] hover:underline font-mono cursor-pointer"
                  >
                    Reset Default
                  </button>
                  <span className="text-slate-600">•</span>
                  <button
                    onClick={handleClearLogo}
                    className="text-[11px] text-rose-400 hover:underline font-mono cursor-pointer"
                  >
                    Clear Path
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={currentPath}
                  onChange={(e) => handleUrlChange(e.target.value)}
                  placeholder="/logos/dolphin-logo-horizontal.svg or https://..."
                  className={`w-full px-3.5 py-2 rounded-xl text-xs font-mono border transition-all ${
                    isLight 
                      ? 'bg-white border-slate-300 text-slate-900 focus:border-[#0773BB]'
                      : 'bg-[#0D1520] border-[#233549] text-white focus:border-[#3BC0BB]'
                  }`}
                />
              </div>
            </div>

            {/* Quick Pick Presets */}
            <div className="space-y-2 pt-2 border-t border-[#233549]/40">
              <span className="text-xs font-bold text-slate-300 font-mono">
                Quick Apply Built-In Presets:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                {PRESET_LOGOS.map((preset) => {
                  const isCurrent = currentPath === preset.path;
                  const isRecommended = preset.recommendedFor.includes(activeArea);

                  return (
                    <button
                      key={preset.path}
                      onClick={() => handleApplyPreset(preset.path)}
                      className={`p-2.5 rounded-xl border text-left transition-all flex items-center justify-between gap-2 cursor-pointer ${
                        isCurrent
                          ? 'bg-[#3BC0BB]/20 border-[#3BC0BB] text-white ring-1 ring-[#3BC0BB]/40'
                          : isLight
                            ? 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                            : 'bg-[#0D1520] hover:bg-[#1A2838] border-[#233549] text-slate-300'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="text-xs font-bold truncate flex items-center gap-1.5">
                          <span>{preset.name}</span>
                          {isRecommended && (
                            <span className="px-1 py-0.2 text-[8px] bg-emerald-500/20 text-emerald-300 rounded font-mono">
                              BEST
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono truncate">
                          {preset.path}
                        </div>
                      </div>
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#16222F] text-slate-400 border border-[#233549] shrink-0">
                        {preset.badge}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Developer Integration Code Helper */}
            <div className="pt-2 border-t border-[#233549]/40 flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Info className="w-4 h-4 text-[#3BC0BB]" />
                <span>Component: <code>&lt;LogoPlaceholder area="{activeArea}" /&gt;</code></span>
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
              >
                {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Code2 className="w-3.5 h-3.5 text-[#3BC0BB]" />}
                <span>{copiedCode ? 'JSX Snippet Copied!' : 'Copy JSX Spec'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
