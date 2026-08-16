import { driver, DriveStep } from 'driver.js';
import 'driver.js/dist/driver.css';

export interface TourOptions {
  theme?: 'dark' | 'light';
  onComplete?: () => void;
  onSkip?: () => void;
  setActiveTab?: (tab: string) => void;
}

const getTourSteps = (isLight: boolean): DriveStep[] => [
  {
    element: '#tour-brand-logo',
    popover: {
      title: '🐬 Welcome to Dolphin Project Hub',
      description: 'Your unified command center for multi-tenant workspace governance, Agile sprints, Gantt critical path tracking, and automated AI assistance.',
      side: 'right',
      align: 'start'
    }
  },
  {
    element: '#tour-workspace-switcher',
    popover: {
      title: '🏢 Multi-Tenant Spaces & Projects',
      description: 'Switch between client companies, sub-departments, and project spaces. Create custom task lists and organize deliverables hierarchically.',
      side: 'right',
      align: 'start'
    }
  },
  {
    element: '#tour-dock-nav',
    popover: {
      title: '🧭 Primary Feature Navigation',
      description: 'Jump seamlessly across Executive Dashboard, Kanban Boards, Sprint Backlogs, Gantt Critical Path, Time Tracking, and Team Workload.',
      side: 'right',
      align: 'center'
    }
  },
  {
    element: '#tour-view-tabs',
    popover: {
      title: '📊 Multi-Dimensional View Switcher',
      description: 'Switch between Overview KPI widgets, List data tables, Kanban boards, Gantt timelines, Calendar, and Audit activity streams.',
      side: 'bottom',
      align: 'start'
    }
  },
  {
    element: '#tour-global-search',
    popover: {
      title: '🔍 Universal Search & Command Center',
      description: 'Instantly find any task, project milestone, team member, or attachment across all workspaces. Press Ctrl+K anytime for quick actions.',
      side: 'bottom',
      align: 'center'
    }
  },
  {
    element: '#tour-time-tracker',
    popover: {
      title: '⏱️ Global Time Tracker Widget',
      description: 'Start live stopwatch timers on any task, log manual billable hours, and track daily team timesheets directly from the top navigation bar.',
      side: 'bottom',
      align: 'center'
    }
  },
  {
    element: '#tour-create-task-btn',
    popover: {
      title: '⚡ Fast Task & Milestone Creation',
      description: 'Add new deliverables with story points, custom metadata fields, predecessor dependencies, and automated due date reminders.',
      side: 'bottom',
      align: 'end'
    }
  },
  {
    element: '#tour-fab-quick-add',
    popover: {
      title: '🪄 Quick Add & AI Copilot',
      description: 'Use the floating action button to rapidly capture tasks from anywhere, log billable hours, or synthesize task health.',
      side: 'left',
      align: 'end'
    }
  },
  {
    element: '#tour-user-menu',
    popover: {
      title: '👤 User Governance & Theme Switcher',
      description: 'Manage your profile, toggle between Ocean Dark and Light themes, switch user roles, or restart this onboarding guide anytime.',
      side: 'bottom',
      align: 'end'
    }
  }
];

export const startOnboardingTour = (options: TourOptions = {}) => {
  const isLight = options.theme === 'light';

  // Filter steps to only those elements present in the DOM
  const rawSteps = getTourSteps(isLight);
  const validSteps = rawSteps.filter((step) => {
    if (typeof step.element === 'string') {
      const el = document.querySelector(step.element);
      return Boolean(el);
    }
    return Boolean(step.element);
  });

  if (validSteps.length === 0) {
    console.warn('No tour targets found on current view.');
    return null;
  }

  const driverInstance = driver({
    showProgress: true,
    animate: true,
    allowClose: true,
    overlayColor: isLight ? '#0f172a' : '#030811',
    overlayOpacity: 0.72,
    stagePadding: 6,
    stageRadius: 12,
    popoverClass: isLight ? 'dolphin-tour-popover light-theme' : 'dolphin-tour-popover dark-theme',
    nextBtnText: 'Next →',
    prevBtnText: '← Back',
    doneBtnText: 'Start Working 🚀',
    progressText: 'Step {{current}} of {{total}}',
    steps: validSteps,
    onDestroyStarted: () => {
      if (options.onComplete) {
        options.onComplete();
      }
      driverInstance.destroy();
    }
  });

  driverInstance.drive();
  return driverInstance;
};

export const hasUserCompletedTour = (userId?: string): boolean => {
  const key = `dolphin_onboarding_completed_${userId || 'default_user'}`;
  return localStorage.getItem(key) === 'true';
};

export const markUserTourCompleted = (userId?: string): void => {
  const key = `dolphin_onboarding_completed_${userId || 'default_user'}`;
  localStorage.setItem(key, 'true');
};

export const resetUserTour = (userId?: string): void => {
  const key = `dolphin_onboarding_completed_${userId || 'default_user'}`;
  localStorage.removeItem(key);
};
