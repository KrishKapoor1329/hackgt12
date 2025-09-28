// PrizePicks-inspired theme with clean, modern design

export const lightTheme = {
  // Background colors - Clean whites and subtle grays (shadcn style)
  background: '#ffffff',
  backgroundSecondary: '#f8f9fa',
  surface: '#ffffff',
  surfaceSecondary: '#f1f3f4',
  surfaceElevated: '#ffffff',
  
  // Text colors - High contrast for readability
  textPrimary: '#0a0a0a',
  textSecondary: '#6b7280',
  textTertiary: '#9ca3af',
  textInverse: '#ffffff',
  textAccent: '#0a0a0a',
  
  // Brand colors - Black and white theme
  primary: '#0a0a0a',
  primaryLight: '#374151',
  primaryDark: '#000000',
  primaryText: '#ffffff', // White text for black buttons
  secondary: '#6b7280',
  
  // Status colors
  success: '#16a34a',
  successLight: '#22c55e',
  error: '#dc2626',
  errorLight: '#ef4444',
  warning: '#ea580c',
  info: '#0a0a0a',
  
  // Border and divider colors
  border: '#e5e7eb',
  borderLight: '#f3f4f6',
  divider: '#d1d5db',
  
  // Shadow and overlay
  shadow: 'rgba(0, 0, 0, 0.04)',
  shadowMedium: 'rgba(0, 0, 0, 0.08)',
  overlay: 'rgba(0, 0, 0, 0.5)',
  
  // Accent colors
  accent: '#0a0a0a',
  accentLight: '#374151',
};

export const darkTheme = {
  // Background colors - Deep blacks with subtle variations (shadcn style)
  background: '#0a0a0a',
  backgroundSecondary: '#111111',
  surface: '#0a0a0a',
  surfaceSecondary: '#1a1a1a',
  surfaceElevated: '#111111',
  
  // Text colors - High contrast whites
  textPrimary: '#ffffff',
  textSecondary: '#a1a1aa',
  textTertiary: '#71717a',
  textInverse: '#0a0a0a',
  textAccent: '#ffffff',
  
  // Brand colors - White background with black text for buttons
  primary: '#ffffff',
  primaryLight: '#f4f4f5',
  primaryDark: '#e4e4e7',
  primaryText: '#0a0a0a', // Black text for white buttons
  secondary: '#a1a1aa',
  
  // Status colors
  success: '#22c55e',
  successLight: '#4ade80',
  error: '#ef4444',
  errorLight: '#f87171',
  warning: '#f59e0b',
  info: '#ffffff',
  
  // Border and divider colors
  border: '#27272a',
  borderLight: '#3f3f46',
  divider: '#52525b',
  
  // Shadow and overlay
  shadow: 'rgba(0, 0, 0, 0.3)',
  shadowMedium: 'rgba(0, 0, 0, 0.4)',
  overlay: 'rgba(0, 0, 0, 0.7)',
  
  // Accent colors
  accent: '#ffffff',
  accentLight: '#f4f4f5',
};

// Helper function to get theme based on isDarkMode boolean
export const getTheme = (isDarkMode) => {
  return isDarkMode ? darkTheme : lightTheme;
};

// Color constants
export const colors = {
  white: '#ffffff',
  black: '#000000',
  transparent: 'transparent',
  
  // Brand colors - Black and white theme
  brandPrimary: '#0a0a0a',
  brandSecondary: '#6b7280',
  
  // Social media colors
  twitter: '#1da1f2',
  discord: '#5865f2',
  
  // Sports league colors
  nfl: '#013369',
  nba: '#c8102e',
};

// Modern Typography scale
export const typography = {
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
  },
  
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
  },
  
  lineHeight: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
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
  full: 9999,
};

export default {
  lightTheme,
  darkTheme,
  getTheme,
  colors,
  typography,
  spacing,
  borderRadius,
};