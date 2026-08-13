import { EmailConfig, EmailThread } from '../types';

export interface InboxFolder {
  id: string;
  name: string;
  type: 'system' | 'custom';
  iconName: string;
  color?: string;
  unreadCount?: number;
}

export interface UserInboxConfig {
  userId: string;
  userEmail: string;
  userName: string;
  isAutoConfigured: boolean;
  emailConfig: EmailConfig;
  folders: InboxFolder[];
  defaultSignature: string;
  autoLinkEmailToTasks: boolean;
  notifyOnNewEmail: boolean;
  syncIntervalMinutes: number;
  lastInitializedAt: string;
}

const INBOX_CONFIG_STORAGE_PREFIX = 'dolphin_inbox_user_config_';

/**
 * Derive email host based on user email domain
 */
export function deriveEmailHostFromAddress(email: string): { incomingHost: string; outgoingHost: string; domain: string } {
  const cleanEmail = email.toLowerCase().trim();
  const domain = cleanEmail.includes('@') ? cleanEmail.split('@')[1] : 'dolphingroup.ae';

  if (domain.includes('gmail.com')) {
    return {
      incomingHost: 'imap.gmail.com',
      outgoingHost: 'smtp.gmail.com',
      domain
    };
  }

  // All corporate and Office 365 Hosted domains (Dolphin Group / Microsoft 365)
  return {
    incomingHost: 'outlook.office365.com',
    outgoingHost: 'smtp.office365.com',
    domain
  };
}

/**
 * Generates default Inbox Folders structure for any new user
 */
export function getDefaultInboxFolders(): InboxFolder[] {
  return [
    { id: 'inbox', name: 'Inbox', type: 'system', iconName: 'Inbox', unreadCount: 1 },
    { id: 'sent', name: 'Sent Items', type: 'system', iconName: 'Send', unreadCount: 0 },
    { id: 'linked', name: 'Linked to Tasks', type: 'system', iconName: 'Link', unreadCount: 0 },
    { id: 'starred', name: 'Starred / Flagged', type: 'system', iconName: 'Star', unreadCount: 0 },
    { id: 'archive', name: 'Archive', type: 'system', iconName: 'Archive', unreadCount: 0 },
    // Custom corporate workflow folders
    { id: 'folder_dewa', name: 'DEWA & Compliance', type: 'custom', iconName: 'CheckCircle2', color: '#0773BB', unreadCount: 1 },
    { id: 'folder_aramco', name: 'Aramco Projects', type: 'custom', iconName: 'Building', color: '#3BC0BB', unreadCount: 0 },
    { id: 'folder_it', name: 'IT & Gateway Alerts', type: 'custom', iconName: 'Server', color: '#A855F7', unreadCount: 0 }
  ];
}

/**
 * Automatically initializes default user inbox configuration upon signup or first login
 */
export function generateDefaultUserInboxConfig(user: { id: string; email: string; name: string }): UserInboxConfig {
  const { incomingHost, outgoingHost } = deriveEmailHostFromAddress(user.email);
  const nowStr = new Date().toISOString();

  const defaultConfig: EmailConfig = {
    email: user.email,
    protocol: user.email.toLowerCase().includes('gmail') ? 'Gmail Workspace API' : 'Microsoft Office 365 (IMAP/OAuth2)',
    incomingHost,
    incomingPort: 993,
    outgoingHost,
    outgoingPort: 587,
    useSSL: false,
    username: user.email,
    appToken: '••••••••••••••••',
    isConnected: true,
    lastSyncedAt: nowStr
  };

  return {
    userId: user.id,
    userEmail: user.email,
    userName: user.name,
    isAutoConfigured: true,
    emailConfig: defaultConfig,
    folders: getDefaultInboxFolders(),
    defaultSignature: `Best Regards,\n${user.name}\nDolphin Group Workspace`,
    autoLinkEmailToTasks: true,
    notifyOnNewEmail: true,
    syncIntervalMinutes: 5,
    lastInitializedAt: nowStr
  };
}

/**
 * Retrieve user's specific inbox configuration or auto-initialize if missing
 */
export function getUserInboxConfig(userId: string, userEmail?: string, userName?: string): UserInboxConfig {
  if (!userId) {
    return generateDefaultUserInboxConfig({
      id: 'usr_guest',
      email: userEmail || 'guest@dolphingroup.ae',
      name: userName || 'Workspace Guest'
    });
  }

  try {
    const raw = localStorage.getItem(`${INBOX_CONFIG_STORAGE_PREFIX}${userId}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.emailConfig) {
        return parsed as UserInboxConfig;
      }
    }
  } catch (e) {
    console.warn(`Could not load inbox config for user ${userId}:`, e);
  }

  // Auto-initialize if not configured yet
  const freshConfig = generateDefaultUserInboxConfig({
    id: userId,
    email: userEmail || 'user@dolphingroup.ae',
    name: userName || 'Team Member'
  });

  saveUserInboxConfig(freshConfig);
  return freshConfig;
}

/**
 * Persist user-specific inbox configuration
 */
export function saveUserInboxConfig(config: UserInboxConfig): void {
  if (!config || !config.userId) return;
  try {
    localStorage.setItem(`${INBOX_CONFIG_STORAGE_PREFIX}${config.userId}`, JSON.stringify(config));
  } catch (e) {
    console.warn(`Error saving inbox config for user ${config.userId}:`, e);
  }
}

/**
 * Generates initial welcome email threads for a newly registered user (Starts clean without old sample email data)
 */
export function generateWelcomeEmailThreads(user: { id: string; email: string; name: string }): EmailThread[] {
  return [];
}

/**
 * Complete Service Handler: Called whenever a user signs up or signs in
 */
export function initializeUserInboxOnSignup(user: { id: string; email: string; name: string }): {
  inboxConfig: UserInboxConfig;
  welcomeThreads: EmailThread[];
} {
  const inboxConfig = getUserInboxConfig(user.id, user.email, user.name);
  const welcomeThreads = generateWelcomeEmailThreads(user);

  return {
    inboxConfig,
    welcomeThreads
  };
}
