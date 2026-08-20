import React, { createContext, useContext, useMemo } from 'react';
import { User, Role, Task, Project } from '../types';
import { useApp } from './AppContext';
import {
  PermissionAction,
  canCreateUser,
  canViewUsersDirectory,
  canDeleteUser,
  canCreateSpace,
  canDeleteSpace,
  canDeleteTask,
  canEditSpace,
  canManageSpaceSettings,
  canAccessProject,
  hasPermission,
  getPermissionDeniedReason,
  normalizeRole,
} from '../lib/permissions';

export interface UserContextType {
  currentUser: User | null;
  users: User[];
  setCurrentUser: (user: User) => void;
  updateUser: (userId: string, updates: Partial<User>) => Promise<{ success: boolean; error?: string }> | void;
  deleteUser: (userId: string) => void;
  inviteUser: (
    name: string,
    email: string,
    role: User['role'],
    department: string,
    companyId?: string,
    password?: string,
    assignedSpaceIds?: string[]
  ) => { success: boolean; error?: string; user?: User };
  
  // RBAC Role Flags
  role: Role | undefined;
  roleNormalized: string;
  isAdmin: boolean;
  isProjectManager: boolean;
  isTeamMember: boolean;
  isViewer: boolean;

  // RBAC Permission Capabilities
  canCreateUser: boolean;
  canViewUsersDirectory: boolean;
  canDeleteUser: boolean;
  canCreateSpace: boolean;
  canDeleteSpace: boolean;
  canDeleteTask: (task?: Task | null, project?: Project | null) => boolean;
  canEditSpace: (project: Project | null) => boolean;
  canManageSpaceSettings: (project: Project | null) => boolean;
  canAccessProject: (project: Project | null) => boolean;
  hasPermission: (
    action: PermissionAction,
    options?: { task?: Task | null; project?: Project | null }
  ) => boolean;
  getPermissionDeniedReason: (action: PermissionAction) => string;
}

export const UserContext = createContext<UserContextType | null>(null);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const {
    currentUser,
    users,
    setCurrentUser,
    updateUser,
    deleteUser,
    inviteUser,
  } = useApp();

  const value = useMemo<UserContextType>(() => {
    const roleNormalized = normalizeRole(currentUser?.role);
    const isAdmin = roleNormalized === 'admin';
    const isProjectManager = roleNormalized === 'project manager';
    const isTeamMember = roleNormalized === 'team member';
    const isViewer = roleNormalized === 'viewer';

    return {
      currentUser,
      users,
      setCurrentUser,
      updateUser,
      deleteUser,
      inviteUser,

      // RBAC Flags
      role: currentUser?.role,
      roleNormalized,
      isAdmin,
      isProjectManager,
      isTeamMember,
      isViewer,

      // RBAC Permission Checks
      canCreateUser: canCreateUser(currentUser),
      canViewUsersDirectory: canViewUsersDirectory(currentUser),
      canDeleteUser: canDeleteUser(currentUser),
      canCreateSpace: canCreateSpace(currentUser),
      canDeleteSpace: canDeleteSpace(currentUser),
      canDeleteTask: (task?: Task | null, project?: Project | null) =>
        canDeleteTask(currentUser, task, project),
      canEditSpace: (project: Project | null) => canEditSpace(currentUser, project),
      canManageSpaceSettings: (project: Project | null) =>
        canManageSpaceSettings(currentUser, project),
      canAccessProject: (project: Project | null) =>
        canAccessProject(currentUser, project),
      hasPermission: (
        action: PermissionAction,
        options?: { task?: Task | null; project?: Project | null }
      ) => hasPermission(currentUser, action, options),
      getPermissionDeniedReason: (action: PermissionAction) =>
        getPermissionDeniedReason(currentUser, action),
    };
  }, [currentUser, users, setCurrentUser, updateUser, deleteUser, inviteUser]);

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

/**
 * Hook to consume the RBAC UserContext
 */
export function useUserContext(): UserContextType {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUserContext must be used within a UserProvider');
  }
  return context;
}

export const useUser = useUserContext;
export default UserContext;
