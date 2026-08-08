import { User, Project, SpaceRole } from '../types';

/**
 * Resolves the SpaceRole ('Admin' | 'Editor' | 'Viewer') for a given user in a project space.
 */
export function getSpaceRole(user: User | null, project: Project | null): SpaceRole | null {
  if (!user || !project) return null;

  // Global system Admins always have Admin privileges across all project spaces
  if (user.role === 'Admin') return 'Admin';

  // Project Manager has Admin privileges for their project space
  if (project.managerId === user.id) return 'Admin';

  // Check explicit memberRoles dictionary
  if (project.memberRoles && project.memberRoles[user.id]) {
    return project.memberRoles[user.id];
  }

  // If user is included in members list without explicit role map, default to 'Editor'
  if (project.members && project.members.includes(user.id)) {
    return 'Editor';
  }

  return null;
}

/**
 * Returns true if the user can create, update, or edit tasks in this project space (Admin or Editor role).
 */
export function canEditSpace(user: User | null, project: Project | null): boolean {
  const role = getSpaceRole(user, project);
  return role === 'Admin' || role === 'Editor';
}

/**
 * Returns true if the user can manage settings and assign roles for this space (Admin role).
 */
export function canManageSpaceSettings(user: User | null, project: Project | null): boolean {
  const role = getSpaceRole(user, project);
  return role === 'Admin';
}

/**
 * Returns true if the user has strict read-only Viewer access to this space.
 */
export function isViewerOnly(user: User | null, project: Project | null): boolean {
  const role = getSpaceRole(user, project);
  return role === 'Viewer';
}
