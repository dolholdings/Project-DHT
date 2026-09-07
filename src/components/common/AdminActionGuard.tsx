import React, { ReactNode, ComponentType } from 'react';
import { useApp } from '../../context/AppContext';
import { User } from '../../types';
import { isStrictAdmin, normalizeRole } from '../../lib/permissions';

export type SensitiveActionType =
  | 'invite'
  | 'delete'
  | 'reset_data'
  | 'admin_only'
  | 'manage_company'
  | 'sync';

export interface AdminActionGuardProps {
  /** The sensitive action being protected (defaults to 'admin_only') */
  action?: SensitiveActionType;
  /** Custom fallback component or element when access is denied (defaults to null) */
  fallback?: ReactNode;
  /** When true, renders child element in disabled/grayed-out state instead of unmounting */
  disableInsteadOfHide?: boolean;
  /** Custom tooltip message when hovering over disabled elements */
  tooltipText?: string;
  /** Optional custom user override to check against */
  user?: User | null;
  /** Children can be standard React nodes or a render-function passing allowed status */
  children: ReactNode | ((isAllowed: boolean) => ReactNode);
}

/**
 * Hook to retrieve strict administrator authorization status.
 * Reconciles currentUser with the live users collection to prevent stale session caching.
 */
export function useStrictAdmin(): {
  isStrictAdmin: boolean;
  isAdmin: boolean;
  currentUser: User | null;
  effectiveUser: User | null;
} {
  const { currentUser, users } = useApp();

  const effectiveUser = React.useMemo(() => {
    if (!currentUser) return null;
    const liveMatch = users?.find(
      (u) =>
        u.id === currentUser.id ||
        (currentUser.email && u.email?.toLowerCase().trim() === currentUser.email.toLowerCase().trim())
    );
    return liveMatch || currentUser;
  }, [users, currentUser]);

  const isAdminRole = React.useMemo(() => {
    return isStrictAdmin(effectiveUser, users);
  }, [effectiveUser, users]);

  return {
    isStrictAdmin: isAdminRole,
    isAdmin: isAdminRole,
    currentUser,
    effectiveUser
  };
}

/**
 * Declarative component wrapper that protects sensitive UI actions (Invite, Delete, Reset Data).
 * Elements are ONLY rendered if the active user's role is strictly 'admin' or 'superadmin'.
 */
export const AdminActionGuard: React.FC<AdminActionGuardProps> = ({
  action = 'admin_only',
  fallback = null,
  disableInsteadOfHide = false,
  tooltipText,
  user,
  children,
}) => {
  const { isStrictAdmin: appIsAdmin, effectiveUser } = useStrictAdmin();
  const { users } = useApp();

  // If a specific user prop is passed, check that user; otherwise use the authenticated user
  const hasAccess = user ? isStrictAdmin(user, users) : appIsAdmin;

  if (typeof children === 'function') {
    return <>{children(hasAccess)}</>;
  }

  if (hasAccess) {
    return <>{children}</>;
  }

  if (disableInsteadOfHide) {
    const defaultReason = (() => {
      switch (action) {
        case 'invite':
          return 'Only administrators can invite or add new users to this workspace.';
        case 'delete':
          return 'Only administrators have authorization to delete users or sensitive resources.';
        case 'reset_data':
          return 'Only administrators have authority to reset or purge workspace data.';
        default:
          return 'Administrator privileges required for this action.';
      }
    })();

    return (
      <div
        className="inline-flex items-center opacity-40 cursor-not-allowed select-none pointer-events-none"
        title={tooltipText || defaultReason}
        aria-disabled="true"
      >
        {children}
      </div>
    );
  }

  return <>{fallback}</>;
};

/**
 * Higher-Order Component (HOC) that wraps any UI component to ensure
 * it is ONLY rendered if the active user's role is strictly 'admin' or 'superadmin'.
 *
 * @example
 * const ProtectedInviteButton = withAdminActionGuard(InviteUserButton, { action: 'invite' });
 * const ProtectedDeleteAction = withAdminActionGuard(DeleteEntityButton, { action: 'delete' });
 * const ProtectedResetDataBtn = withAdminActionGuard(ResetDataModal, { action: 'reset_data' });
 */
export function withAdminActionGuard<P extends object>(
  WrappedComponent: ComponentType<P>,
  options?: {
    action?: SensitiveActionType;
    fallback?: ReactNode;
    disableInsteadOfHide?: boolean;
    tooltipText?: string;
  }
): React.FC<P> {
  const displayName = WrappedComponent.displayName || WrappedComponent.name || 'Component';

  const ProtectedComponent: React.FC<P> = (props) => {
    return (
      <AdminActionGuard
        action={options?.action || 'admin_only'}
        fallback={options?.fallback ?? null}
        disableInsteadOfHide={options?.disableInsteadOfHide}
        tooltipText={options?.tooltipText}
      >
        <WrappedComponent {...props} />
      </AdminActionGuard>
    );
  };

  ProtectedComponent.displayName = `WithAdminGuard(${displayName})`;
  return ProtectedComponent;
}

/**
 * Higher-Order Component specifically for wrapping Invite UI elements.
 */
export function withAdminInvite<P extends object>(
  WrappedComponent: ComponentType<P>,
  fallback?: ReactNode
): React.FC<P> {
  return withAdminActionGuard(WrappedComponent, { action: 'invite', fallback });
}

/**
 * Higher-Order Component specifically for wrapping Delete UI elements.
 */
export function withAdminDelete<P extends object>(
  WrappedComponent: ComponentType<P>,
  fallback?: ReactNode
): React.FC<P> {
  return withAdminActionGuard(WrappedComponent, { action: 'delete', fallback });
}

/**
 * Higher-Order Component specifically for wrapping Data Reset / Clear UI elements.
 */
export function withAdminResetData<P extends object>(
  WrappedComponent: ComponentType<P>,
  fallback?: ReactNode
): React.FC<P> {
  return withAdminActionGuard(WrappedComponent, { action: 'reset_data', fallback });
}

/**
 * Semantic guard for Invite actions.
 */
export const AdminInviteGuard: React.FC<Omit<AdminActionGuardProps, 'action'>> = (props) => (
  <AdminActionGuard action="invite" {...props} />
);

/**
 * Semantic guard for Delete actions.
 */
export const AdminDeleteGuard: React.FC<Omit<AdminActionGuardProps, 'action'>> = (props) => (
  <AdminActionGuard action="delete" {...props} />
);

/**
 * Semantic guard for Data Reset / Purge actions.
 */
export const AdminResetDataGuard: React.FC<Omit<AdminActionGuardProps, 'action'>> = (props) => (
  <AdminActionGuard action="reset_data" {...props} />
);

/**
 * Functional wrapper utility that intercepts execution of sensitive callbacks
 * to guarantee that only strictly authenticated administrators can trigger them at runtime.
 */
export function withStrictAdminExecution<T extends (...args: any[]) => any>(
  fn: T,
  user: User | null,
  users?: User[],
  actionDescription: string = 'perform this administrative action'
): (...args: Parameters<T>) => ReturnType<T> | undefined {
  return (...args: Parameters<T>): ReturnType<T> | undefined => {
    if (!isStrictAdmin(user, users)) {
      console.warn(
        `[Security] Execution blocked: User "${user?.name || user?.email || 'Unknown'}" (${user?.role || 'Guest'}) is not authorized to ${actionDescription}.`
      );
      return undefined;
    }
    return fn(...args);
  };
}

export default AdminActionGuard;
