import { useState, useEffect } from 'react';

/**
 * Custom React hook to monitor viewport media queries
 * @param query CSS media query string, e.g. '(max-width: 767px)'
 * @returns boolean indicating if query matches
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia(query).matches;
    }
    return false;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia(query);
    const updateMatches = () => {
      setMatches(mediaQuery.matches);
    };

    updateMatches();

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', updateMatches);
    } else {
      // Fallback for older browsers
      mediaQuery.addListener(updateMatches);
    }

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', updateMatches);
      } else {
        mediaQuery.removeListener(updateMatches);
      }
    };
  }, [query]);

  return matches;
}
