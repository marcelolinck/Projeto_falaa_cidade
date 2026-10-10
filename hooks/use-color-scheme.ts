import { useColorScheme as useRNColorScheme } from 'react-native';

/**
 * React Native 0.86 can return 'unspecified'; normalize to 'light' | 'dark'.
 */
export function useColorScheme(): 'light' | 'dark' {
  return useRNColorScheme() === 'dark' ? 'dark' : 'light';
}
