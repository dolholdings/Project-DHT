import { User, ActivityLog } from '../types';

export interface UserLastActiveInfo {
  text: string;
  fullDate: string;
  timestamp: number;
}

export const getUserLastActive = (user: User, activityLogs: ActivityLog[] = []): UserLastActiveInfo => {
  // 1. Find user's latest activity log
  const userLogs = activityLogs.filter((log) => log.userId === user.id);
  let latestIsoStr: string | undefined = undefined;

  if (userLogs.length > 0) {
    const sorted = [...userLogs].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    latestIsoStr = sorted[0]?.timestamp;
  }

  // Fallback to user.lastActive property if log is absent or older
  if (user.lastActive) {
    if (!latestIsoStr || new Date(user.lastActive).getTime() > new Date(latestIsoStr).getTime()) {
      latestIsoStr = user.lastActive;
    }
  }

  if (!latestIsoStr) {
    return {
      text: 'Just now',
      fullDate: 'Recently active on platform',
      timestamp: Date.now()
    };
  }

  const date = new Date(latestIsoStr);
  const timeMs = date.getTime();
  if (isNaN(timeMs)) {
    return {
      text: 'Just now',
      fullDate: 'Recently active',
      timestamp: Date.now()
    };
  }

  const now = new Date();
  const diffMs = Math.max(0, now.getTime() - timeMs);
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  let text = '';
  if (diffMins < 1) {
    text = 'Just now';
  } else if (diffMins < 60) {
    text = `${diffMins}m ago`;
  } else if (diffHours < 24) {
    text = `${diffHours}h ago`;
  } else if (diffDays === 1) {
    text = 'Yesterday';
  } else if (diffDays < 7) {
    text = `${diffDays}d ago`;
  } else {
    text = date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }

  const fullDate = date.toLocaleString([], {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return { text, fullDate, timestamp: timeMs };
};
