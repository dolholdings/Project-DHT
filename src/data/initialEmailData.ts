import { EmailThread, EmailConfig } from '../types';

export const INITIAL_EMAIL_CONFIG: EmailConfig = {
  email: 'pawan.kumar@dolphingroup.ae',
  protocol: 'Microsoft Office 365 (IMAP/OAuth2)',
  incomingHost: 'outlook.office365.com',
  incomingPort: 993,
  outgoingHost: 'smtp.office365.com',
  outgoingPort: 587,
  useSSL: true,
  username: 'pawan.kumar@dolphingroup.ae',
  appToken: '••••••••••••••••',
  isConnected: true,
  lastSyncedAt: new Date().toISOString()
};

export const INITIAL_EMAIL_THREADS: EmailThread[] = [];
