import React, { useState } from 'react';
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

const MainLayout: React.FC = () => {
  const { activeTab, setActiveTab, isCommandPaletteOpen, setCommandPaletteOpen, theme, currentUser, setCurrentUser } = useApp();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showEmailGatewayModal, setShowEmailGatewayModal] = useState(false);
  const [activeViewTab, setActiveViewTab] = useState('list');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const isMobile = useIsMobile();

  // Block dashboard access if user email is not verified
  if (currentUser && currentUser.isEmailVerified === false) {
    return (
      <EmailVerificationScreen
        onVerified={() => {
          setCurrentUser({ ...currentUser, isEmailVerified: true });
        }}
      />
    );
  }

  const handleViewTabChange = (tabId: string) => {
    setActiveViewTab(tabId);
    if (tabId === 'list' || tabId === 'table') setActiveTab('tasks');
    if (tabId === 'board') setActiveTab('kanban');
    if (tabId === 'team' || tabId === 'workload') setActiveTab('workload');
    if (tabId === 'calendar') setActiveTab('calendar');
    if (tabId === 'activity') setActiveTab('reports');
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
          isMobile={isMobile}
        />

        {/* Active View Router */}
        <main className="flex-1 pb-12 overflow-y-auto">
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
        </main>
      </div>

      {/* Floating Task Due Date Alert Toast Stack */}
      <TaskDueAlertToast />

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

      {showLoginModal && <LoginModal onClose={() => setShowLoginModal(false)} />}

      <TransactionalEmailGatewayModal
        isOpen={showEmailGatewayModal}
        onClose={() => setShowEmailGatewayModal(false)}
      />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}
