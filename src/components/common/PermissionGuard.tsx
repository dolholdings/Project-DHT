import React, { ReactNode } from 'react';
import { useApp } from '../../context/AppContext';
import { Task, Project, User } from '../../types';
import {
  PermissionAction,
  hasPermission,
  getPermissionDeniedReason,
} from '../../lib/permissions';

export interface PermissionGuardProps {
  /** The action to check permission for */
  action: PermissionAction;
  /** Optional task context for task-specific permission checks (e.g. delete_task) */
  task?: Task | null;
  /** Optional target entity (task, project, user) for context checks */
  target?: Task | Project | User | null;
  /** Optional project space context for space-specific permission checks */
  project?: Project | null;
  /** Fallback UI when permission is denied (defaults to null / hidden) */
  fallback?: ReactNode;
  /** When true, renders children in disabled/grayed-out state instead of completely unmounting */
  disableInsteadOfHide?: boolean;
  /** Optional custom title or tooltip explaining the restriction */
  tooltipText?: string;
  /** Custom check function to override or extend default permission evaluation */
  customCheck?: (user: User | null) => boolean;
  /** Children can be standard ReactNode or a render function receiving the boolean status */
  children: ReactNode | ((hasAccess: boolean) => ReactNode);
}

/**
 * Secure Permission Guard Component.
 * Wraps UI elements (buttons, modals, forms, action toolbars) to enforce role-based access control.
 * Explicitly blocks Team Members and Viewers from triggering protected actions such as:
 * - 'create_user' (Invite/Add User)
 * - 'create_space' (New Workspace/Project Creation)
 * - 'delete_task' (Task Deletion & Bulk Deletion)
 */
export const PermissionGuard: React.FC<PermissionGuardProps> = ({
  action,
  task,
  target,
  project,
  fallback = null,
  disableInsteadOfHide = false,
  tooltipText,
  customCheck,
  children,
}) => {
  const { currentUser } = useApp();

  const effectiveTask = task || (target && 'status' in target ? (target as Task) : undefined);
  const effectiveProject = project || (target && 'category' in target ? (target as Project) : undefined);

  const isAllowed = customCheck
    ? customCheck(currentUser)
    : hasPermission(currentUser, action, { task: effectiveTask, project: effectiveProject });

  if (typeof children === 'function') {
    return <>{children(isAllowed)}</>;
  }

  if (isAllowed) {
    return <>{children}</>;
  }

  if (disableInsteadOfHide) {
    const reason = tooltipText || getPermissionDeniedReason(currentUser, action);
    return (
      <div
        className="inline-flex items-center opacity-40 cursor-not-allowed select-none pointer-events-none"
        title={reason}
        aria-disabled="true"
      >
        {children}
      </div>
    );
  }

  return <>{fallback}</>;
};

export default PermissionGuard;
