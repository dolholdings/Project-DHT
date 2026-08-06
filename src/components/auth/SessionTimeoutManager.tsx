import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import { SessionTimeoutModal } from './SessionTimeoutModal';

// Configurable constants
const IDLE_WARNING_AFTER_MS = 4 * 60 * 1000; // 4 minutes of inactivity before showing warning
const WARNING_COUNTDOWN_SECONDS = 60; // 60 seconds countdown once warning appears

interface SessionTimeoutManagerProps {
  onTriggerLoginModal: () => void;
}

export const SessionTimeoutManager: React.FC<SessionTimeoutManagerProps> = ({ onTriggerLoginModal }) => {
  const { currentUser, signOutFirebase, logActivity } = useApp();

  const [showWarning, setShowWarning] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(WARNING_COUNTDOWN_SECONDS);

  const lastActivityRef = useRef<number>(Date.now());

  const handleAutoLogout = useCallback(() => {
    setShowWarning(false);
    signOutFirebase();
    if (currentUser?.email) {
      logActivity('session expired auto-logout', currentUser.email, 'security');
    }
    onTriggerLoginModal();
  }, [signOutFirebase, currentUser, logActivity, onTriggerLoginModal]);

  const handleManualLogout = useCallback(() => {
    setShowWarning(false);
    signOutFirebase();
    if (currentUser?.email) {
      logActivity('session ended by user from timeout warning', currentUser.email, 'security');
    }
    onTriggerLoginModal();
  }, [signOutFirebase, currentUser, logActivity, onTriggerLoginModal]);

  const handleExtendSession = useCallback(() => {
    lastActivityRef.current = Date.now();
    setShowWarning(false);
    setSecondsLeft(WARNING_COUNTDOWN_SECONDS);
    if (currentUser?.email) {
      logActivity('session extended', currentUser.email, 'security');
    }
  }, [currentUser, logActivity]);

  // Reset activity timestamp on user action if warning is NOT active
  const handleUserActivity = useCallback(() => {
    if (!showWarning) {
      lastActivityRef.current = Date.now();
    }
  }, [showWarning]);

  useEffect(() => {
    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];

    events.forEach((ev) => {
      window.addEventListener(ev, handleUserActivity, { passive: true });
    });

    return () => {
      events.forEach((ev) => {
        window.removeEventListener(ev, handleUserActivity);
      });
    };
  }, [handleUserActivity]);

  // Main Inactivity Checker Interval (checks every second)
  useEffect(() => {
    // Only monitor if a logged in user exists and email is verified
    if (!currentUser || currentUser.isEmailVerified === false) {
      setShowWarning((prev) => (prev ? false : prev));
      return;
    }

    const checkInactivity = setInterval(() => {
      const now = Date.now();
      const elapsed = now - lastActivityRef.current;

      if (elapsed >= IDLE_WARNING_AFTER_MS && !showWarning) {
        setShowWarning(true);
        setSecondsLeft(WARNING_COUNTDOWN_SECONDS);
        if (currentUser.email) {
          logActivity('session timeout warning displayed', currentUser.email, 'security');
        }
      }
    }, 1000);

    return () => clearInterval(checkInactivity);
  }, [currentUser, showWarning, logActivity]);

  // Ticking Countdown when warning modal is open
  useEffect(() => {
    if (!showWarning) return;

    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [showWarning]);

  // Handle auto logout when secondsLeft reaches 0 while showWarning is active
  useEffect(() => {
    if (showWarning && secondsLeft === 0) {
      handleAutoLogout();
    }
  }, [showWarning, secondsLeft, handleAutoLogout]);

  // Function exposed on window for quick manual testing/debugging
  useEffect(() => {
    (window as any).triggerSessionTimeoutTest = () => {
      setShowWarning(true);
      setSecondsLeft(WARNING_COUNTDOWN_SECONDS);
    };
  }, []);

  if (!showWarning) return null;

  return (
    <SessionTimeoutModal
      secondsRemaining={secondsLeft}
      onExtendSession={handleExtendSession}
      onLogout={handleManualLogout}
    />
  );
};
