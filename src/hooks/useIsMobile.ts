import { useMediaQuery } from './useMediaQuery';

/**
 * Custom React hook to detect mobile viewport width
 * @param breakpoint pixel width threshold (defaults to 768px for md breakpoint)
 * @returns boolean 'isMobile' state
 */
export function useIsMobile(breakpoint: number = 768): boolean {
  return useMediaQuery(`(max-width: ${breakpoint - 1}px)`);
}

export default useIsMobile;
