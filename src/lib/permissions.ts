import { User, Project, Task, SpaceRole } from '../types';

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

  // Also check if user's email is in members or memberRoles (for newly invited users before ID match)
  if (user.email) {
    const userEmailLower = user.email.toLowerCase();
    if (project.members && project.members.some((m) => m.toLowerCase() === userEmailLower)) {
      return 'Editor';
    }
    if (project.memberRoles) {
      for (const [key, roleVal] of Object.entries(project.memberRoles)) {
        if (key.toLowerCase() === userEmailLower) return roleVal;
      }
    }
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

/**
 * Returns true if the user has access to view this project space.
 */
export function canAccessProject(user: User | null, project: Project | null): boolean {
  if (!user || !project) return false;
  if (user.role === 'Admin') return true;
  return getSpaceRole(user, project) !== null;
}

/**
 * Filters a list of projects so non-admin users ONLY see spaces they have explicit access to.
 */
export function getAccessibleProjects(user: User | null, projects: Project[]): Project[] {
  if (!user) return [];
  if (user.role === 'Admin') return projects;
  return projects.filter((p) => canAccessProject(user, p));
}

/**
 * Filters a list of tasks so non-admin users ONLY see tasks in spaces they have access to, or tasks assigned to them.
 */
export function getAccessibleTasks(user: User | null, tasks: Task[], projects: Project[]): Task[] {
  if (!user) return [];
  if (user.role === 'Admin') return tasks;

  const accessibleProjectIds = new Set(getAccessibleProjects(user, projects).map((p) => p.id));
  return tasks.filter((t) => {
    if (accessibleProjectIds.has(t.projectId)) return true;
    if (t.assigneeIds && (t.assigneeIds.includes(user.id) || (user.email && t.assigneeIds.includes(user.email)))) return true;
    if (t.reporterId === user.id || (user.email && t.reporterId === user.email)) return true;
    return false;
  });
}

