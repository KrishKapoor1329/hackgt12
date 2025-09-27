// Provides light and dark mode color schemes

export const lightTheme = {
  // Background colors
  background: '#ffffff',
  backgroundSecondary: '#faf7ff',
  surface: '#f5f3ff',
  surfaceSecondary: '#ede9fe',
  
  // Text colors
  textPrimary: '#1e1b4b',
  textSecondary: '#6b21a8',
  textTertiary: '#a855f7',
  textInverse: '#ffffff',
  
  // Brand colors - PrizePicks Purple
  primary: '#8b5cf6',
  secondary: '#a855f7',
  
  // Status colors
  success: '#10b981',
  error: '#ef4444',
  warning: '#f59e0b',
  info: '#06b6d4',
  
  // Border and divider colors
  border: '#ddd6fe',
  divider: '#c4b5fd',
  
  // Shadow and overlay
  shadow: 'rgba(0, 0, 0, 0.1)',
  overlay: 'rgba(0, 0, 0, 0.5)',
};

export const darkTheme = {
  // Background colors
  background: '#1e1b4b',
  backgroundSecondary: '#312e81',
  surface: '#312e81',
  surfaceSecondary: '#4c1d95',
  
  // Text colors
  textPrimary: '#f8fafc',
  textSecondary: '#e9d5ff',
  textTertiary: '#c4b5fd',
  textInverse: '#1e1b4b',
  
  // Brand colors - PrizePicks Purple
  primary: '#8b5cf6',
  secondary: '#a855f7',
  
  // Status colors
  success: '#10b981',
  error: '#ef4444',
  warning: '#f59e0b',
  info: '#06b6d4',
  
  // Border and divider colors
  border: '#6b21a8',
  divider: '#7c3aed',
  
  // Shadow and overlay
  shadow: 'rgba(0, 0, 0, 0.3)',
  overlay: 'rgba(0, 0, 0, 0.7)',
};

// Helper function to get theme based on isDarkMode boolean
export const getTheme = (isDarkMode) => {
  return isDarkMode ? darkTheme : lightTheme;
};

// Color constants that don't change between themes
export const colors = {
  white: '#ffffff',
  black: '#000000',
  transparent: 'transparent',
  
  // Brand colors that remain consistent - PrizePicks Purple
  brandPrimary: '#8b5cf6',
  brandSecondary: '#a855f7',
  
  // Social media brand colors
  twitter: '#1da1f2',
  discord: '#5865f2',
  
  // Sports league colors
  nfl: '#013369',
  nba: '#c8102e',
};

// Typography scale
export const typography = {
  // Font sizes
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
    '5xl': 48,
    '6xl': 60,
    '7xl': 72,
  },
  
  // Font weights
  fontWeight: {
    light: '300',
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
  },
  
  // Line heights
  lineHeight: {
    tight: 1.25,
    snug: 1.375,
    normal: 1.5,
    relaxed: 1.625,
    loose: 2,
  },
};

// Spacing scale
export const spacing = {
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
  20: 80,
  24: 96,
  32: 128,
};

// Border radius scale
export const borderRadius = {
  none: 0,
  sm: 4,
  base: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  full: 9999,
};

// Shadow presets
export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  base: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 16,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 24,
  },
};

export default {
  lightTheme,
  darkTheme,
  getTheme,
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
};
