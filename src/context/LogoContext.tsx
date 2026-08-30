import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import {
  saveBrandingSettingsToFirestore,
  subscribeToBrandingSettings,
  fetchBrandingSettingsFromFirestore
} from '../services/dataService';

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
    enabled: true,
    alt: 'Dolphin Group Header Logo',
    aspectRatio: 'horizontal',
    label: 'Top Header & Breadcrumb Bar',
    description: 'Rendered in the sticky top header, breadcrumb navigation, and workspace brand bar.'
  },
  sidebar: {
    path: '/logos/dolphin-logo-emblem.svg',
    enabled: true,
    alt: 'Dolphin Sidebar Emblem',
    aspectRatio: 'emblem',
    label: 'Sidebar Navigation Dock',
    description: 'Rendered in the left vertical dock icon button and drawer triggers.'
  },
  login: {
    path: '/logos/dolphin-logo-square.svg',
    enabled: true,
    alt: 'Dolphin Corporate Login Logo',
    aspectRatio: 'square',
    label: 'Login & Authentication Dialog',
    description: 'Rendered at the top of the sign-in modal, session timeout, and gatekeeper auth screens.'
  },
  emailVerification: {
    path: '/logos/dolphin-logo-square.svg',
    enabled: true,
    alt: 'Dolphin Email Verification Logo',
    aspectRatio: 'square',
    label: 'Email Verification Gate',
    description: 'Rendered on the mandatory domain email verification screen.'
  },
  dashboard: {
    path: '/logos/dolphin-logo-square.svg',
    enabled: true,
    alt: 'Dolphin Dashboard Welcome Logo',
    aspectRatio: 'square',
    label: 'Dashboard Hero Banner',
    description: 'Rendered beside the primary workspace overview headline.'
  },
  reports: {
    path: '/logos/dolphin-logo-horizontal.svg',
    enabled: true,
    alt: 'Dolphin Official Engineering Report Logo',
    aspectRatio: 'horizontal',
    label: 'Printable PSR Reports & Exports',
    description: 'Rendered in printable Project Status Reports, client exports, and PDF headers.'
  },
  general: {
    path: '/logos/dolphin-logo-square.svg',
    enabled: true,
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
  isSyncedWithFirebase: boolean;
  isSavingToFirebase: boolean;
  saveToFirebase: () => Promise<void>;
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
  globalEnabled: true,
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

  const [isSyncedWithFirebase, setIsSyncedWithFirebase] = useState<boolean>(true);
  const [isSavingToFirebase, setIsSavingToFirebase] = useState<boolean>(false);
  const settingsRef = useRef<LogoSettings>(settings);

  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  // Real-time Firestore synchronization for branding and logos
  useEffect(() => {
    let isMounted = true;

    // First fetch once on mount
    fetchBrandingSettingsFromFirestore()
      .then((remote) => {
        if (!isMounted || !remote) return;
        setSettings((prev) => {
          const merged: LogoSettings = {
            ...defaultInitialSettings,
            ...prev,
            ...remote,
            areas: {
              ...DEFAULT_LOGO_CONFIGS,
              ...(prev.areas || {}),
              ...(remote.areas || {})
            },
            companyOverrides: {
              ...(prev.companyOverrides || {}),
              ...(remote.companyOverrides || {})
            }
          };
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
          } catch (_) {}
          return merged;
        });
        setIsSyncedWithFirebase(true);
      })
      .catch((err) => {
        console.warn('Failed initial branding fetch from Firestore:', err);
      });

    // Subscribe to real-time changes
    const unsubscribe = subscribeToBrandingSettings(
      (remote) => {
        if (!isMounted || !remote) return;
        setSettings((prev) => {
          const merged: LogoSettings = {
            ...defaultInitialSettings,
            ...prev,
            ...remote,
            areas: {
              ...DEFAULT_LOGO_CONFIGS,
              ...(prev.areas || {}),
              ...(remote.areas || {})
            },
            companyOverrides: {
              ...(prev.companyOverrides || {}),
              ...(remote.companyOverrides || {})
            }
          };
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
          } catch (_) {}
          return merged;
        });
        setIsSyncedWithFirebase(true);
      },
      (err) => {
        console.warn('Branding Firebase subscription notice:', err);
      }
    );

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  // Sync state changes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (e) {
      console.warn('Failed to persist logo settings to localStorage:', e);
    }
  }, [settings]);

  // Persist branding to Firestore
  const persistToFirebase = useCallback(async (updatedSettings: LogoSettings) => {
    setIsSavingToFirebase(true);
    try {
      await saveBrandingSettingsToFirestore(updatedSettings);
      setIsSyncedWithFirebase(true);
    } catch (e) {
      console.warn('Failed to save branding settings to Firestore:', e);
      setIsSyncedWithFirebase(false);
    } finally {
      setIsSavingToFirebase(false);
    }
  }, []);

  const saveToFirebase = useCallback(async () => {
    await persistToFirebase(settingsRef.current);
  }, [persistToFirebase]);

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
    setSettings((prev) => {
      let updated: LogoSettings;
      if (typeof visibleOrArea === 'boolean') {
        updated = {
          ...prev,
          globalEnabled: visibleOrArea
        };
      } else if (typeof visibleOrArea === 'string' && typeof visible === 'boolean') {
        updated = {
          ...prev,
          areas: {
            ...prev.areas,
            [visibleOrArea]: {
              ...prev.areas[visibleOrArea],
              enabled: visible
            }
          }
        };
      } else {
        updated = prev;
      }
      persistToFirebase(updated);
      return updated;
    });
  }, [persistToFirebase]);

  const setGlobalEnabled = useCallback((enabled: boolean) => {
    setSettings((prev) => {
      const updated: LogoSettings = {
        ...prev,
        globalEnabled: enabled
      };
      persistToFirebase(updated);
      return updated;
    });
  }, [persistToFirebase]);

  const setAreaEnabled = useCallback((area: LogoArea, enabled: boolean) => {
    setSettings((prev) => {
      const updated: LogoSettings = {
        ...prev,
        areas: {
          ...prev.areas,
          [area]: {
            ...prev.areas[area],
            enabled
          }
        }
      };
      persistToFirebase(updated);
      return updated;
    });
  }, [persistToFirebase]);

  const setAreaPath = useCallback((area: LogoArea, path: string) => {
    setSettings((prev) => {
      const updated: LogoSettings = {
        ...prev,
        areas: {
          ...prev.areas,
          [area]: {
            ...prev.areas[area],
            path: path.trim()
          }
        }
      };
      persistToFirebase(updated);
      return updated;
    });
  }, [persistToFirebase]);

  const setShowPlaceholderBorders = useCallback((show: boolean) => {
    setSettings((prev) => {
      const updated: LogoSettings = {
        ...prev,
        showPlaceholderBorders: show
      };
      persistToFirebase(updated);
      return updated;
    });
  }, [persistToFirebase]);

  const setCompanyOverride = useCallback((companyId: string, area: LogoArea, path: string) => {
    setSettings((prev) => {
      const updated: LogoSettings = {
        ...prev,
        companyOverrides: {
          ...prev.companyOverrides,
          [companyId]: {
            ...(prev.companyOverrides[companyId] || {}),
            [area]: path.trim()
          }
        }
      };
      persistToFirebase(updated);
      return updated;
    });
  }, [persistToFirebase]);

  const enableAllAreas = useCallback(() => {
    setSettings((prev) => {
      const updatedAreas = { ...prev.areas };
      (Object.keys(updatedAreas) as LogoArea[]).forEach((area) => {
        updatedAreas[area] = {
          ...updatedAreas[area],
          enabled: true
        };
      });
      const updated: LogoSettings = {
        ...prev,
        globalEnabled: true,
        areas: updatedAreas
      };
      persistToFirebase(updated);
      return updated;
    });
  }, [persistToFirebase]);

  const disableAllAreas = useCallback(() => {
    setSettings((prev) => {
      const updated: LogoSettings = {
        ...prev,
        globalEnabled: false
      };
      persistToFirebase(updated);
      return updated;
    });
  }, [persistToFirebase]);

  const resetToDefaults = useCallback(() => {
    setSettings(defaultInitialSettings);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.warn('Failed to clear saved logo settings:', e);
    }
    persistToFirebase(defaultInitialSettings);
  }, [persistToFirebase]);

  return (
    <LogoContext.Provider
      value={{
        showLogos,
        updateLogoVisibility,
        settings,
        isSyncedWithFirebase,
        isSavingToFirebase,
        saveToFirebase,
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
