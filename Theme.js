// Dark black theme with purple accents

export const lightTheme = {
  // Background colors - Clean whites and grays
  background: '#ffffff',
  backgroundSecondary: '#f8fafc',
  surface: '#ffffff',
  surfaceSecondary: '#f1f5f9',
  surfaceElevated: '#ffffff',
  
  // Text colors - High contrast for readability
  textPrimary: '#0f172a',
  textSecondary: '#64748b',
  textTertiary: '#94a3b8',
  textInverse: '#ffffff',
  textAccent: '#8b5cf6',
  
  // Brand colors - Purple accent
  primary: '#8b5cf6',
  primaryLight: '#a78bfa',
  primaryDark: '#7c3aed',
  secondary: '#a855f7',
  
  // Status colors - Vibrant and clear
  success: '#10b981',
  successLight: '#34d399',
  error: '#ef4444',
  errorLight: '#f87171',
  warning: '#f59e0b',
  warningLight: '#fbbf24',
  info: '#06b6d4',
  
  // Border and divider colors - Subtle grays
  border: '#e2e8f0',
  borderLight: '#f1f5f9',
  divider: '#cbd5e1',
  
  // Shadow and overlay
  shadow: 'rgba(0, 0, 0, 0.08)',
  shadowMedium: 'rgba(0, 0, 0, 0.12)',
  overlay: 'rgba(0, 0, 0, 0.4)',
  
  // Accent colors for highlights
  accent: '#f59e0b',
  accentLight: '#fbbf24',
};

export const darkTheme = {
  // Background colors - Deep black with purple tints
  background: '#000000',
  backgroundSecondary: '#0a0a0a',
  surface: '#1a0a1a',
  surfaceSecondary: '#2a1a2a',
  surfaceElevated: '#3a2a3a',
  
  // Text colors - High contrast whites with purple tints
  textPrimary: '#ffffff',
  textSecondary: '#e1d5e1',
  textTertiary: '#b19fb1',
  textInverse: '#000000',
  textAccent: '#c084fc',
  
  // Brand colors - More purple throughout
  primary: '#8b5cf6',
  primaryLight: '#c084fc',
  primaryDark: '#7c3aed',
  secondary: '#a855f7',
  tertiary: '#c084fc',
  
  // Status colors - Purple-tinted for consistency
  success: '#10b981',
  successLight: '#34d399',
  error: '#ef4444',
  errorLight: '#f87171',
  warning: '#f59e0b',
  warningLight: '#fbbf24',
  info: '#8b5cf6',
  
  // Border and divider colors - Purple-tinted grays
  border: '#4a3a4a',
  borderLight: '#5a4a5a',
  divider: '#6a5a6a',
  
  // Shadow and overlay - Purple-tinted
  shadow: 'rgba(139, 92, 246, 0.2)',
  shadowMedium: 'rgba(139, 92, 246, 0.3)',
  overlay: 'rgba(139, 92, 246, 0.7)',
  
  // Accent colors for highlights - More purple
  accent: '#c084fc',
  accentLight: '#ddd6fe',
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

// Modern Typography scale
export const typography = {
  // Font sizes - More refined scale
  fontSize: {
    xs: 11,
    sm: 13,
    base: 15,
    lg: 17,
    xl: 19,
    '2xl': 22,
    '3xl': 26,
    '4xl': 32,
    '5xl': 40,
    '6xl': 48,
    '7xl': 56,
  },
  
  // Font weights - Modern weight distribution
  fontWeight: {
    light: '300',
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
    black: '900',
  },
  
  // Line heights - Optimized for readability
  lineHeight: {
    tight: 1.2,
    snug: 1.3,
    normal: 1.4,
    relaxed: 1.5,
    loose: 1.6,
  },
  
  // Letter spacing for better readability
  letterSpacing: {
    tight: -0.5,
    normal: 0,
    wide: 0.5,
    wider: 1,
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

// Modern Border radius scale
export const borderRadius = {
  none: 0,
  xs: 2,
  sm: 4,
  base: 6,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 20,
  '3xl': 24,
  '4xl': 32,
  full: 9999,
};

// Modern Shadow presets - Softer, more subtle
export const shadows = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  xs: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    elevation: 1,
  },
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  base: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 8,
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
