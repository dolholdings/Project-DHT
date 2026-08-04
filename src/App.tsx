import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
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
import { NotificationsDrawer } from './components/notifications/NotificationsDrawer';
import { LoginModal } from './components/auth/LoginModal';
import { CommandPalette } from './components/layout/CommandPalette';

const MainLayout: React.FC = () => {
  const { activeTab, isCommandPaletteOpen, setCommandPaletteOpen } = useApp();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  return (
    <div className="min-h-screen bg-[#0D1520] text-slate-100 flex font-sans selection:bg-[#0773BB] selection:text-white">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content Workspace */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen overflow-x-hidden">
        {/* Header Navigation */}
        <Header
          onOpenNotifications={() => setShowNotifications(true)}
          onOpenLogin={() => setShowLoginModal(true)}
        />

        {/* View Switcher */}
        <main className="flex-1 pb-12">
          {activeTab === 'dashboard' && <DashboardView />}
          {activeTab === 'projects' && <ProjectsView />}
          {activeTab === 'tasks' && <TasksView />}
          {activeTab === 'gantt' && <GanttView />}
          {activeTab === 'timeline' && <TimelineView />}
          {activeTab === 'calendar' && <CalendarView />}
          {activeTab === 'kanban' && <KanbanView />}
          {activeTab === 'workload' && <WorkloadView />}
          {activeTab === 'chat' && <TeamChatView />}
          {activeTab === 'files' && <FilesView />}
          {activeTab === 'reports' && <ReportsView />}
          {activeTab === 'automations' && <AutomationsView />}
          {activeTab === 'users' && <UsersView />}
          {activeTab === 'architecture' && <ArchitectureView />}
          {activeTab === 'settings' && <SettingsView />}
        </main>
      </div>

      {/* Command Palette Overlay */}
      {isCommandPaletteOpen && (
        <CommandPalette onClose={() => setCommandPaletteOpen(false)} />
      )}

      {/* Modals & Drawers */}
      {showNotifications && (
        <NotificationsDrawer onClose={() => setShowNotifications(false)} />
      )}

      {showLoginModal && <LoginModal onClose={() => setShowLoginModal(false)} />}
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
