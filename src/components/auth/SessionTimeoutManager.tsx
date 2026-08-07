import React from 'react';

interface SessionTimeoutManagerProps {
  onTriggerLoginModal: () => void;
}

// Session timeout warning removed per user request (no idle popups)
export const SessionTimeoutManager: React.FC<SessionTimeoutManagerProps> = () => {
  return null;
};

