import React, { useState } from 'react';
import { AnimatePresence } from 'motion/react';
import { Menu } from 'lucide-react';
import { AppProvider, useApp } from './context/AppContext';
import { Sidebar } from './components/layout/Sidebar';
import { ClickUpHeaderBanners } from './components/layout/ClickUpHeaderBanners';
import { useIsMobile } from './hooks/useIsMobile';
import { DashboardView } from './components/dashboard/DashboardView';
import { ProjectsView } from './components/projects/ProjectsView';
import { TasksView } from './components/tasks/TasksView';
import { GanttView } from './components/gantt/GanttView';
import { TimelineView } from './components/timeline/TimelineView';
import { CalendarView } from './components/calendar/CalendarView';
import { KanbanView } from './components/kanban/KanbanView';
import { WorkloadView } from './components/workload/WorkloadView';
import { TeamChatView } from './components/collaboration/TeamChatView';
import { FilesView } from './components/files/FilesView';
import { ReportsView } from './components/reports/ReportsView';
import { AutomationsView } from './components/automations/AutomationsView';
import { UsersView } from './components/users/UsersView';
import { ArchitectureView } from './components/architecture/ArchitectureView';
import { SettingsView } from './components/settings/SettingsView';
import { AdminView } from './components/admin/AdminView';
import { EmailInboxView } from './components/email/EmailInboxView';
import { WorkspaceManager } from './components/workspace/WorkspaceManager';
import { NotificationsDrawer } from './components/notifications/NotificationsDrawer';
import { TaskDueAlertToast } from './components/notifications/TaskDueAlertToast';
import { LoginModal } from './components/auth/LoginModal';
import { EmailVerificationScreen } from './components/auth/EmailVerificationScreen';
import { SessionTimeoutManager } from './components/auth/SessionTimeoutManager';
import { CommandPalette } from './components/layout/CommandPalette';
import { TransactionalEmailGatewayModal } from './components/notifications/TransactionalEmailGatewayModal';
import { QuickAddFAB } from './components/common/QuickAddFAB';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { hasUserCompletedTour, markUserTourCompleted, startOnboardingTour } from './services/onboardingTour';

const MainLayout: React.FC = () => {
  const { activeTab, setActiveTab, isCommandPaletteOpen, setCommandPaletteOpen, theme, currentUser, setCurrentUser, isAuthenticated } = useApp();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showEmailGatewayModal, setShowEmailGatewayModal] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const isMobile = useIsMobile();

  // Trigger Onboarding Tour automatically on first login
  React.useEffect(() => {
    if (isAuthenticated && currentUser && currentUser.isEmailVerified !== false) {
      const hasSeen = hasUserCompletedTour(currentUser.id);
      if (!hasSeen) {
        const timer = setTimeout(() => {
          startOnboardingTour({
            theme: theme as 'dark' | 'light',
            onComplete: () => {
              markUserTourCompleted(currentUser.id);
            }
          });
        }, 700);
        return () => clearTimeout(timer);
      }
    }
  }, [isAuthenticated, currentUser?.id, currentUser?.isEmailVerified, theme]);

  // Derive activeViewTab directly from activeTab to prevent state divergence
  const activeViewTab = React.useMemo(() => {
    switch (activeTab) {
      case 'dashboard':
        return 'overview';
      case 'tasks':
        return 'list';
      case 'kanban':
        return 'board';
      case 'workload':
        return 'workload';
      case 'calendar':
        return 'calendar';
      case 'reports':
        return 'activity';
      default:
        return 'list';
    }
  }, [activeTab]);

  // Force Sign In Gatekeeper when hitting the site unauthenticated
  if (!isAuthenticated) {
    return (
      <div className={`min-h-screen ${theme === 'light' ? 'bg-slate-100' : 'bg-[#0D1520]'} flex items-center justify-center p-4 font-sans relative z-50`}>
        <AnimatePresence mode="wait">
          <LoginModal key="gatekeeper-login-modal" isGatekeeper={true} onClose={() => {}} />
        </AnimatePresence>
      </div>
    );
  }

  // Block dashboard access if user email is not verified
  if (currentUser && currentUser.isEmailVerified === false) {
    return (
      <AnimatePresence mode="wait">
        <EmailVerificationScreen
          key="email-verification-screen"
          onVerified={() => {
            setCurrentUser({ ...currentUser, isEmailVerified: true });
          }}
        />
      </AnimatePresence>
    );
  }

  const handleViewTabChange = (tabId: string) => {
    if (tabId === 'overview') setActiveTab('dashboard');
    else if (tabId === 'list' || tabId === 'table') setActiveTab('tasks');
    else if (tabId === 'board') setActiveTab('kanban');
    else if (tabId === 'team' || tabId === 'workload') setActiveTab('workload');
    else if (tabId === 'calendar') setActiveTab('calendar');
    else if (tabId === 'activity') setActiveTab('reports');
    else setActiveTab('tasks');
  };

  return (
    <div className={`min-h-screen ${theme === 'light' ? 'bg-[#F8FAFC] text-slate-900' : 'bg-[#0D1520] text-slate-100'} flex font-sans selection:bg-[#7B68EE] selection:text-white transition-colors duration-200`}>
      {/* Mobile Floating Menu Button (when sidebar is closed on small viewports) */}
      {isMobile && !mobileSidebarOpen && (
        <button
          onClick={() => setMobileSidebarOpen(true)}
          className={`fixed bottom-5 left-5 z-40 p-3 rounded-2xl shadow-2xl flex items-center gap-2 font-bold text-xs transition-transform active:scale-95 ${
            theme === 'light'
              ? 'bg-[#0D9488] text-white hover:bg-[#0F766E] shadow-[#0D9488]/40'
              : 'bg-gradient-to-r from-[#0773BB] to-[#3BC0BB] text-white shadow-[#0773BB]/40'
          }`}
          aria-label="Open Navigation Menu"
          title="Open Navigation Menu"
        >
          <Menu className="w-5 h-5" />
          <span>Menu</span>
        </button>
      )}

      {/* ClickUp Dual Sidebar */}
      <Sidebar
        mobileOpen={mobileSidebarOpen}
        onMobileClose={() => setMobileSidebarOpen(false)}
        onToggleMobile={() => setMobileSidebarOpen(!mobileSidebarOpen)}
      />

      {/* Main Content Workspace */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen overflow-x-hidden">
        {/* ClickUp Yellow/Purple Banners & Breadcrumb Tabs Bar */}
        <ClickUpHeaderBanners
          activeViewTab={activeViewTab}
          setActiveViewTab={handleViewTabChange}
          onOpenCreateTaskModal={() => setActiveTab('tasks')}
          onToggleMobileSidebar={() => setMobileSidebarOpen(!mobileSidebarOpen)}
          onOpenEmailGateway={() => setShowEmailGatewayModal(true)}
          onOpenLoginModal={() => setShowLoginModal(true)}
          isMobile={isMobile}
        />

        {/* Active View Router */}
        <main className="flex-1 pb-12 overflow-y-auto">
          <ErrorBoundary>
            {activeTab === 'dashboard' && <DashboardView />}
            {activeTab === 'projects' && <ProjectsView />}
            {activeTab === 'tasks' && <TasksView />}
            {activeTab === 'gantt' && <GanttView />}
            {activeTab === 'timeline' && <TimelineView />}
            {activeTab === 'calendar' && <CalendarView />}
            {activeTab === 'kanban' && <KanbanView />}
            {activeTab === 'workload' && <WorkloadView />}
            {activeTab === 'chat' && <TeamChatView />}
            {activeTab === 'email' && <EmailInboxView />}
            {activeTab === 'files' && <FilesView />}
            {activeTab === 'reports' && <ReportsView />}
            {activeTab === 'automations' && <AutomationsView />}
            {activeTab === 'users' && <UsersView />}
            {activeTab === 'architecture' && <ArchitectureView />}
            {activeTab === 'workspace' && <WorkspaceManager />}
            {activeTab === 'settings' && <SettingsView />}
            {activeTab === 'admin' && <AdminView />}
          </ErrorBoundary>
        </main>
      </div>

      {/* Floating Task Due Date Alert Toast Stack */}
      <TaskDueAlertToast />

      {/* Mini Quick Add Floating Action Button (FAB) */}
      <QuickAddFAB />

      {/* Session Inactivity Timeout Guard */}
      <SessionTimeoutManager onTriggerLoginModal={() => setShowLoginModal(true)} />

      {/* Command Palette Overlay */}
      {isCommandPaletteOpen && (
        <CommandPalette onClose={() => setCommandPaletteOpen(false)} />
      )}

      {/* Modals & Drawers */}
      {showNotifications && (
        <NotificationsDrawer onClose={() => setShowNotifications(false)} />
      )}

      <AnimatePresence>
        {showLoginModal && <LoginModal key="login-modal" onClose={() => setShowLoginModal(false)} />}
      </AnimatePresence>

      <TransactionalEmailGatewayModal
        isOpen={showEmailGatewayModal}
        onClose={() => setShowEmailGatewayModal(false)}
      />
    </div>
  );
};

export default function App() {
  return (
    <ErrorBoundary fallbackTitle="Application Interface Error">
      <AppProvider>
        <MainLayout />
      </AppProvider>
    </ErrorBoundary>
  );
}
