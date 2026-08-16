import { useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Task, Project } from '../types';
import {
  PermissionAction,
  canCreateUser,
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

/**
 * Custom Hook providing reactive permission checks and role evaluations for the current user.
 */
export function usePermissions() {
  const { currentUser } = useApp();

  return useMemo(() => {
    const roleNormalized = normalizeRole(currentUser?.role);
    const isAdmin = roleNormalized === 'admin';
    const isProjectManager = roleNormalized === 'project manager';
    const isTeamMember = roleNormalized === 'team member';
    const isViewer = roleNormalized === 'viewer';

    return {
      currentUser,
      role: currentUser?.role,
      roleNormalized,
      isAdmin,
      isProjectManager,
      isTeamMember,
      isViewer,
      canCreateUser: canCreateUser(currentUser),
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
      getDeniedReason: (action: PermissionAction) =>
        getPermissionDeniedReason(currentUser, action),
    };
  }, [currentUser]);
}

export default usePermissions;
