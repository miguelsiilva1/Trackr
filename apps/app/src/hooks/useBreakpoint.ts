import { useWindowDimensions } from 'react-native';

export const WIDE_BREAKPOINT = 768;

/** Mobile (< 768px) gets a bottom tab bar; wider screens get the dashboard sidebar. */
export function useBreakpoint() {
  const { width } = useWindowDimensions();
  return { width, wide: width >= WIDE_BREAKPOINT };
}
