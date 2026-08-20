import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export type LogoArea = 
  | 'header' 
  | 'sidebar' 
  | 'login' 
  | 'emailVerification' 
  | 'reports' 
  | 'dashboard' 
  | 'general';

export interface LogoAreaConfig {
  path: string;
  enabled: boolean;
  alt: string;
  aspectRatio: 'horizontal' | 'square' | 'emblem' | 'auto';
  label: string;
  description: string;
}

export interface LogoSettings {
  globalEnabled: boolean;
  showPlaceholderBorders: boolean;
  areas: Record<LogoArea, LogoAreaConfig>;
  companyOverrides: Record<string, Partial<Record<LogoArea, string>>>;
}

export const DEFAULT_LOGO_CONFIGS: Record<LogoArea, LogoAreaConfig> = {
  header: {
    path: '/logos/dolphin-logo-horizontal.svg',
    enabled: false,
    alt: 'Dolphin Group Header Logo',
    aspectRatio: 'horizontal',
    label: 'Top Header & Breadcrumb Bar',
    description: 'Rendered in the sticky top header, breadcrumb navigation, and workspace brand bar.'
  },
  sidebar: {
    path: '/logos/dolphin-logo-emblem.svg',
    enabled: false,
    alt: 'Dolphin Sidebar Emblem',
    aspectRatio: 'emblem',
    label: 'Sidebar Navigation Dock',
    description: 'Rendered in the left vertical dock icon button and drawer triggers.'
  },
  login: {
    path: '/logos/dolphin-logo-square.svg',
    enabled: false,
    alt: 'Dolphin Corporate Login Logo',
    aspectRatio: 'square',
    label: 'Login & Authentication Dialog',
    description: 'Rendered at the top of the sign-in modal, session timeout, and gatekeeper auth screens.'
  },
  emailVerification: {
    path: '/logos/dolphin-logo-square.svg',
    enabled: false,
    alt: 'Dolphin Email Verification Logo',
    aspectRatio: 'square',
    label: 'Email Verification Gate',
    description: 'Rendered on the mandatory domain email verification screen.'
  },
  dashboard: {
    path: '/logos/dolphin-logo-square.svg',
    enabled: false,
    alt: 'Dolphin Dashboard Welcome Logo',
    aspectRatio: 'square',
    label: 'Dashboard Hero Banner',
    description: 'Rendered beside the primary workspace overview headline.'
  },
  reports: {
    path: '/logos/dolphin-logo-horizontal.svg',
    enabled: false,
    alt: 'Dolphin Official Engineering Report Logo',
    aspectRatio: 'horizontal',
    label: 'Printable PSR Reports & Exports',
    description: 'Rendered in printable Project Status Reports, client exports, and PDF headers.'
  },
  general: {
    path: '/logos/dolphin-logo-square.svg',
    enabled: false,
    alt: 'Dolphin Master Logo',
    aspectRatio: 'square',
    label: 'General & Modal Fallbacks',
    description: 'Default fallback logo for general UI components.'
  }
};

const STORAGE_KEY = 'dolphin_logo_manager_settings_v1';

export interface LogoContextValue {
  showLogos: boolean;
  updateLogoVisibility: (visibleOrArea: boolean | LogoArea, visible?: boolean) => void;
  settings: LogoSettings;
  getLogoForArea: (area: LogoArea, companyId?: string) => {
    path: string;
    isVisible: boolean;
    alt: string;
    aspectRatio: 'horizontal' | 'square' | 'emblem' | 'auto';
    isCustomPath: boolean;
  };
  setGlobalEnabled: (enabled: boolean) => void;
  setAreaEnabled: (area: LogoArea, enabled: boolean) => void;
  setAreaPath: (area: LogoArea, path: string) => void;
  setShowPlaceholderBorders: (show: boolean) => void;
  setCompanyOverride: (companyId: string, area: LogoArea, path: string) => void;
  enableAllAreas: () => void;
  disableAllAreas: () => void;
  resetToDefaults: () => void;
}

const defaultInitialSettings: LogoSettings = {
  globalEnabled: false,
  showPlaceholderBorders: false,
  areas: DEFAULT_LOGO_CONFIGS,
  companyOverrides: {}
};

const LogoContext = createContext<LogoContextValue | undefined>(undefined);

export const LogoProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<LogoSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...defaultInitialSettings,
          ...parsed,
          areas: {
            ...DEFAULT_LOGO_CONFIGS,
            ...(parsed.areas || {})
          },
          companyOverrides: parsed.companyOverrides || {}
        };
      }
    } catch (e) {
      console.warn('Failed to load saved logo settings from localStorage:', e);
    }
    return defaultInitialSettings;
  });

  // Sync state changes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (e) {
      console.warn('Failed to persist logo settings to localStorage:', e);
    }
  }, [settings]);

  const getLogoForArea = useCallback((area: LogoArea, companyId?: string) => {
    const areaConfig = settings.areas[area] || DEFAULT_LOGO_CONFIGS[area] || DEFAULT_LOGO_CONFIGS.general;
    
    // Check if there is a company-specific override
    let resolvedPath = areaConfig.path;
    let isCustomPath = false;
    
    if (companyId && settings.companyOverrides[companyId]?.[area]) {
      resolvedPath = settings.companyOverrides[companyId]![area]!;
      isCustomPath = true;
    }

    const isVisible = settings.globalEnabled && areaConfig.enabled && Boolean(resolvedPath && resolvedPath.trim().length > 0);

    return {
      path: resolvedPath,
      isVisible,
      alt: areaConfig.alt,
      aspectRatio: areaConfig.aspectRatio,
      isCustomPath
    };
  }, [settings]);

  const showLogos = settings.globalEnabled;

  const updateLogoVisibility = useCallback((visibleOrArea: boolean | LogoArea, visible?: boolean) => {
    if (typeof visibleOrArea === 'boolean') {
      setSettings(prev => ({
        ...prev,
        globalEnabled: visibleOrArea
      }));
    } else if (typeof visibleOrArea === 'string' && typeof visible === 'boolean') {
      setSettings(prev => ({
        ...prev,
        areas: {
          ...prev.areas,
          [visibleOrArea]: {
            ...prev.areas[visibleOrArea],
            enabled: visible
          }
        }
      }));
    }
  }, []);

  const setGlobalEnabled = useCallback((enabled: boolean) => {
    setSettings(prev => ({
      ...prev,
      globalEnabled: enabled
    }));
  }, []);

  const setAreaEnabled = useCallback((area: LogoArea, enabled: boolean) => {
    setSettings(prev => ({
      ...prev,
      areas: {
        ...prev.areas,
        [area]: {
          ...prev.areas[area],
          enabled
        }
      }
    }));
  }, []);

  const setAreaPath = useCallback((area: LogoArea, path: string) => {
    setSettings(prev => ({
      ...prev,
      areas: {
        ...prev.areas,
        [area]: {
          ...prev.areas[area],
          path: path.trim()
        }
      }
    }));
  }, []);

  const setShowPlaceholderBorders = useCallback((show: boolean) => {
    setSettings(prev => ({
      ...prev,
      showPlaceholderBorders: show
    }));
  }, []);

  const setCompanyOverride = useCallback((companyId: string, area: LogoArea, path: string) => {
    setSettings(prev => ({
      ...prev,
      companyOverrides: {
        ...prev.companyOverrides,
        [companyId]: {
          ...(prev.companyOverrides[companyId] || {}),
          [area]: path.trim()
        }
      }
    }));
  }, []);

  const enableAllAreas = useCallback(() => {
    setSettings(prev => {
      const updatedAreas = { ...prev.areas };
      (Object.keys(updatedAreas) as LogoArea[]).forEach(area => {
        updatedAreas[area] = {
          ...updatedAreas[area],
          enabled: true
        };
      });
      return {
        ...prev,
        globalEnabled: true,
        areas: updatedAreas
      };
    });
  }, []);

  const disableAllAreas = useCallback(() => {
    setSettings(prev => ({
      ...prev,
      globalEnabled: false
    }));
  }, []);

  const resetToDefaults = useCallback(() => {
    setSettings(defaultInitialSettings);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.warn('Failed to clear saved logo settings:', e);
    }
  }, []);

  return (
    <LogoContext.Provider
      value={{
        showLogos,
        updateLogoVisibility,
        settings,
        getLogoForArea,
        setGlobalEnabled,
        setAreaEnabled,
        setAreaPath,
        setShowPlaceholderBorders,
        setCompanyOverride,
        enableAllAreas,
        disableAllAreas,
        resetToDefaults
      }}
    >
      {children}
    </LogoContext.Provider>
  );
};

export const useLogo = (): LogoContextValue => {
  const context = useContext(LogoContext);
  if (!context) {
    throw new Error('useLogo must be used within a LogoProvider');
  }
  return context;
};
