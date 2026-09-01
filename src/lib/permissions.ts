import { User, Project, Task, SpaceRole } from '../types';

export type PermissionAction =
  | 'create_user'
  | 'delete_user'
  | 'view_users'
  | 'create_space'
  | 'delete_space'
  | 'delete_task'
  | 'modify_due_date'
  | 'edit_space'
  | 'manage_space_settings'
  | 'view_space';

/**
 * Normalizes user role string for robust comparison (handles variations in casing/spacing).
 */
export function normalizeRole(role?: string | null): string {
  return (role || '').toLowerCase().trim();
}

/**
 * Resolves the SpaceRole ('Admin' | 'Editor' | 'Viewer') for a given user in a project space.
 */
export function getSpaceRole(user: User | null, project: Project | null): SpaceRole | null {
  if (!user || !project) return null;

  const normalizedUserRole = normalizeRole(user.role);

  // Global system Admins always have Admin privileges across all project spaces
  if (normalizedUserRole === 'admin') return 'Admin';

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
  if (user && user.email) {
    const userEmailLower = String(user.email).toLowerCase();
    if (project.members && Array.isArray(project.members) && project.members.some((m) => typeof m === 'string' && m.toLowerCase() === userEmailLower)) {
      return 'Editor';
    }
    if (project.memberRoles && typeof project.memberRoles === 'object') {
      for (const [key, roleVal] of Object.entries(project.memberRoles)) {
        if (typeof key === 'string' && key.toLowerCase() === userEmailLower) return roleVal as SpaceRole;
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
  if (normalizeRole(user.role) === 'admin') return true;
  return getSpaceRole(user, project) !== null;
}

/**
 * Filters a list of projects so non-admin users ONLY see spaces they have explicit access to.
 */
export function getAccessibleProjects(user: User | null, projects: Project[]): Project[] {
  if (!user) return [];
  if (normalizeRole(user.role) === 'admin') return projects;
  return projects.filter((p) => canAccessProject(user, p));
}

/**
 * Filters a list of tasks so non-admin users ONLY see tasks in spaces they have access to, or tasks assigned to them.
 */
export function getAccessibleTasks(user: User | null, tasks: Task[], projects: Project[]): Task[] {
  if (!user) return [];
  if (normalizeRole(user.role) === 'admin') return tasks;

  const accessibleProjectIds = new Set(getAccessibleProjects(user, projects).map((p) => p.id));
  return tasks.filter((t) => {
    if (accessibleProjectIds.has(t.projectId)) return true;
    if (t.assigneeIds && (t.assigneeIds.includes(user.id) || (user.email && t.assigneeIds.includes(user.email)))) return true;
    if (t.reporterId === user.id || (user.email && t.reporterId === user.email)) return true;
    return false;
  });
}

/**
 * Checks if the user has permission to create or invite new users.
 * Strictly restricted to Workspace Administrators.
 */
export function canCreateUser(user: User | null): boolean {
  if (!user) return false;
  const role = normalizeRole(user.role);
  return role === 'admin';
}

/**
 * Checks if the user has permission to view the organization user profiles directory (Users master view).
 * Strictly restricted to Workspace Administrators (Team Members, Viewers, and Project Managers are blocked).
 */
export function canViewUsersDirectory(user: User | null): boolean {
  if (!user) return false;
  const role = normalizeRole(user.role);
  return role === 'admin';
}

/**
 * Checks if the user has permission to remove or delete users.
 * Team Members, Viewers, and Project Managers are NOT allowed to delete users. Only Admins can.
 */
export function canDeleteUser(user: User | null): boolean {
  if (!user) return false;
  const role = normalizeRole(user.role);
  return role === 'admin';
}

/**
 * Checks if the user has permission to create new project spaces.
 * Team Members and Viewers are strictly NOT allowed to create spaces.
 * Only Admins and Project Managers can create spaces.
 */
export function canCreateSpace(user: User | null): boolean {
  if (!user) return false;
  const role = normalizeRole(user.role);
  return role === 'admin' || role === 'project manager';
}

/**
 * Checks if the user has permission to delete project spaces.
 * Only Admins can delete project spaces.
 */
export function canDeleteSpace(user: User | null): boolean {
  if (!user) return false;
  const role = normalizeRole(user.role);
  return role === 'admin';
}

/**
 * Checks if the user has permission to delete a task.
 * Team Members and Viewers are strictly NOT allowed to delete tasks.
 * Admins and Project Managers have deletion privileges.
 */
export function canDeleteTask(user: User | null, task?: Task | null, project?: Project | null): boolean {
  if (!user) return false;
  const role = normalizeRole(user.role);
  if (role === 'admin') return true;
  if (role === 'project manager') {
    if (project) {
      return project.managerId === user.id || getSpaceRole(user, project) === 'Admin';
    }
    return true;
  }
  // Team Member and Viewer roles are strictly forbidden from deleting tasks
  return false;
}

/**
 * Checks if the user has permission to modify task due dates / deadlines.
 * Team Members and Viewers are strictly NOT allowed to modify task due dates.
 * Only Admins and Project Managers can modify due dates.
 */
export function canModifyDueDate(user: User | null, task?: Task | null, project?: Project | null): boolean {
  if (!user) return false;
  const role = normalizeRole(user.role);
  if (role === 'admin') return true;
  if (role === 'project manager') {
    if (project) {
      return project.managerId === user.id || getSpaceRole(user, project) === 'Admin';
    }
    return true;
  }
  // Team Members and Viewers cannot change due dates
  return false;
}

/**
 * Evaluates whether the user has permission for a specific named action.
 */
export function hasPermission(
  user: User | null,
  action: PermissionAction,
  options?: { task?: Task | null; project?: Project | null }
): boolean {
  switch (action) {
    case 'create_user':
      return canCreateUser(user);
    case 'view_users':
      return canViewUsersDirectory(user);
    case 'delete_user':
      return canDeleteUser(user);
    case 'create_space':
      return canCreateSpace(user);
    case 'delete_space':
      return canDeleteSpace(user);
    case 'delete_task':
      return canDeleteTask(user, options?.task, options?.project);
    case 'modify_due_date':
      return canModifyDueDate(user, options?.task, options?.project);
    case 'edit_space':
      return canEditSpace(user, options?.project || null);
    case 'manage_space_settings':
      return canManageSpaceSettings(user, options?.project || null);
    case 'view_space':
      return canAccessProject(user, options?.project || null);
    default:
      return false;
  }
}

/**
 * Returns a human-readable explanation when a permission check fails.
 */
export function getPermissionDeniedReason(user: User | null, action: PermissionAction): string {
  const role = user?.role || 'Guest';
  switch (action) {
    case 'create_user':
      return `Permission Denied: Users with role "${role}" cannot create or invite users. Only Workspace Administrators have this permission.`;
    case 'view_users':
      return `Permission Denied: Access to the Users master view is restricted to Workspace Administrators only. Users with role "${role}" cannot access user administration records.`;
    case 'delete_user':
      return `Permission Denied: Users with role "${role}" cannot delete users. Only Workspace Administrators can delete accounts.`;
    case 'create_space':
      return `Permission Denied: Team Members and Viewers cannot create spaces. Only Administrators and Project Managers can create spaces.`;
    case 'delete_space':
      return `Permission Denied: Users with role "${role}" cannot delete spaces. Only Workspace Administrators can delete spaces.`;
    case 'delete_task':
      return `Permission Denied: Users with role "${role}" cannot delete tasks. Only Project Managers and Workspace Administrators have task deletion authority.`;
    case 'modify_due_date':
      return `Permission Denied: Users with role "${role}" cannot change task due dates. Only Project Managers and Workspace Administrators can modify target completion dates.`;
    case 'edit_space':
      return `Permission Denied: You have read-only access to this space.`;
    case 'manage_space_settings':
      return `Permission Denied: Only space administrators can configure space settings.`;
    default:
      return `Permission Denied: You do not have permission to perform this action.`;
  }
}
