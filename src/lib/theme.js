/**
 * Enhanced Theme System
 * Binance dark theme with gold accents and comprehensive color palette
 */

export const themes = {
  light: {
    name: 'Light',
    colors: {
      // Background colors
      background: '#FFFFFF',
      surface: '#F8F9FA',
      surfaceHover: '#E9ECEF',
      
      // Text colors
      textPrimary: '#212529',
      textSecondary: '#6C757D',
      textTertiary: '#ADB5BD',
      
      // Border colors
      border: '#DEE2E6',
      borderHover: '#CED4DA',
      
      // Accent colors
      primary: '#F0B90B',
      primaryHover: '#FCD535',
      success: '#0ECB81',
      successHover: '#0ECB81',
      danger: '#F6465D',
      dangerHover: '#F6465D',
      warning: '#F59E0B',
      warningHover: '#F59E0B',
      
      // Chart colors
      chartGreen: '#0ECB81',
      chartRed: '#F6465D',
      chartBlue: '#3B82F6',
      chartYellow: '#F0B90B',
      
      // Status colors
      online: '#0ECB81',
      offline: '#F6465D',
      pending: '#F59E0B',
      
      // Overlay colors
      overlay: 'rgba(0, 0, 0, 0.5)',
      modal: 'rgba(0, 0, 0, 0.8)',
    }
  },
  
  dark: {
    name: 'Dark',
    colors: {
      // Background colors (Binance dark theme)
      background: '#0B0E11',
      surface: '#181A20',
      surfaceHover: '#1E2329',
      surfaceSecondary: '#2B3139',
      
      // Text colors
      textPrimary: '#EAECEF',
      textSecondary: '#B7BDC6',
      textTertiary: '#848E9C',
      
      // Border colors
      border: '#2B3139',
      borderHover: '#3C4043',
      borderLight: '#3C4043',
      
      // Accent colors (Binance gold theme)
      primary: '#F0B90B',
      primaryHover: '#FCD535',
      primaryLight: '#FCD535',
      primaryDark: '#D4AF37',
      
      // Success/Error colors
      success: '#0ECB81',
      successHover: '#0ECB81',
      successLight: '#0ECB81',
      successDark: '#0ECB81',
      
      danger: '#F6465D',
      dangerHover: '#F6465D',
      dangerLight: '#F6465D',
      dangerDark: '#F6465D',
      
      warning: '#F59E0B',
      warningHover: '#F59E0B',
      warningLight: '#F59E0B',
      warningDark: '#F59E0B',
      
      // Chart colors
      chartGreen: '#0ECB81',
      chartRed: '#F6465D',
      chartBlue: '#3B82F6',
      chartYellow: '#F0B90B',
      chartPurple: '#8B5CF6',
      chartOrange: '#F59E0B',
      
      // Status colors
      online: '#0ECB81',
      offline: '#F6465D',
      pending: '#F59E0B',
      loading: '#F0B90B',
      
      // Overlay colors
      overlay: 'rgba(0, 0, 0, 0.5)',
      modal: 'rgba(0, 0, 0, 0.8)',
      backdrop: 'rgba(0, 0, 0, 0.3)',
      
      // Special Binance colors
      binance: {
        primary: '#F0B90B',
        background: '#0B0E11',
        surface: '#181A20',
        surfaceHover: '#1E2329',
        textPrimary: '#EAECEF',
        textSecondary: '#B7BDC6',
        textTertiary: '#848E9C',
        green: '#0ECB81',
        red: '#F6465D',
        border: '#2B3139',
        borderHover: '#3C4043',
      }
    }
  }
};

export const defaultTheme = 'dark';

export const getTheme = (themeName = defaultTheme) => {
  return themes[themeName] || themes[defaultTheme];
};

export const getThemeColors = (themeName = defaultTheme) => {
  const theme = getTheme(themeName);
  return theme.colors;
};

export const getThemeColor = (colorName, themeName = defaultTheme) => {
  const colors = getThemeColors(themeName);
  return colors[colorName] || colors.textPrimary;
};

// CSS Variables for dynamic theming
export const generateCSSVariables = (themeName = defaultTheme) => {
  const colors = getThemeColors(themeName);
  const cssVars = {};
  
  Object.entries(colors).forEach(([key, value]) => {
    if (typeof value === 'object') {
      // Handle nested objects like binance
      Object.entries(value).forEach(([nestedKey, nestedValue]) => {
        cssVars[`--color-${key}-${nestedKey}`] = nestedValue;
      });
    } else {
      cssVars[`--color-${key}`] = value;
    }
  });
  
  return cssVars;
};

// Tailwind CSS color configuration
export const tailwindColors = {
  // Background colors
  background: {
    DEFAULT: 'var(--color-background)',
    surface: 'var(--color-surface)',
    'surface-hover': 'var(--color-surfaceHover)',
    'surface-secondary': 'var(--color-surfaceSecondary)',
  },
  
  // Text colors
  text: {
    primary: 'var(--color-textPrimary)',
    secondary: 'var(--color-textSecondary)',
    tertiary: 'var(--color-textTertiary)',
  },
  
  // Border colors
  border: {
    DEFAULT: 'var(--color-border)',
    hover: 'var(--color-borderHover)',
    light: 'var(--color-borderLight)',
  },
  
  // Accent colors
  primary: {
    DEFAULT: 'var(--color-primary)',
    hover: 'var(--color-primaryHover)',
    light: 'var(--color-primaryLight)',
    dark: 'var(--color-primaryDark)',
  },
  
  success: {
    DEFAULT: 'var(--color-success)',
    hover: 'var(--color-successHover)',
    light: 'var(--color-successLight)',
    dark: 'var(--color-successDark)',
  },
  
  danger: {
    DEFAULT: 'var(--color-danger)',
    hover: 'var(--color-dangerHover)',
    light: 'var(--color-dangerLight)',
    dark: 'var(--color-dangerDark)',
  },
  
  warning: {
    DEFAULT: 'var(--color-warning)',
    hover: 'var(--color-warningHover)',
    light: 'var(--color-warningLight)',
    dark: 'var(--color-warningDark)',
  },
  
  // Chart colors
  chart: {
    green: 'var(--color-chartGreen)',
    red: 'var(--color-chartRed)',
    blue: 'var(--color-chartBlue)',
    yellow: 'var(--color-chartYellow)',
    purple: 'var(--color-chartPurple)',
    orange: 'var(--color-chartOrange)',
  },
  
  // Status colors
  status: {
    online: 'var(--color-online)',
    offline: 'var(--color-offline)',
    pending: 'var(--color-pending)',
    loading: 'var(--color-loading)',
  },
  
  // Binance specific colors
  binance: {
    primary: 'var(--color-binance-primary)',
    background: 'var(--color-binance-background)',
    surface: 'var(--color-binance-surface)',
    'surface-hover': 'var(--color-binance-surfaceHover)',
    'text-primary': 'var(--color-binance-textPrimary)',
    'text-secondary': 'var(--color-binance-textSecondary)',
    'text-tertiary': 'var(--color-binance-textTertiary)',
    green: 'var(--color-binance-green)',
    red: 'var(--color-binance-red)',
    border: 'var(--color-binance-border)',
    'border-hover': 'var(--color-binance-borderHover)',
  }
};

// Typography configuration
export const typography = {
  fontFamily: {
    sans: ['var(--font-geist-sans)', 'system-ui', 'sans-serif'],
    mono: ['var(--font-geist-mono)', 'monospace'],
  },
  
  fontSize: {
    xs: ['0.75rem', { lineHeight: '1rem' }],
    sm: ['0.875rem', { lineHeight: '1.25rem' }],
    base: ['1rem', { lineHeight: '1.5rem' }],
    lg: ['1.125rem', { lineHeight: '1.75rem' }],
    xl: ['1.25rem', { lineHeight: '1.75rem' }],
    '2xl': ['1.5rem', { lineHeight: '2rem' }],
    '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
    '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
    '5xl': ['3rem', { lineHeight: '1' }],
    '6xl': ['3.75rem', { lineHeight: '1' }],
  },
  
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
  }
};

// Spacing configuration
export const spacing = {
  '0': '0',
  '1': '0.25rem',
  '2': '0.5rem',
  '3': '0.75rem',
  '4': '1rem',
  '5': '1.25rem',
  '6': '1.5rem',
  '8': '2rem',
  '10': '2.5rem',
  '12': '3rem',
  '16': '4rem',
  '20': '5rem',
  '24': '6rem',
  '32': '8rem',
  '40': '10rem',
  '48': '12rem',
  '56': '14rem',
  '64': '16rem',
};

// Animation configuration
export const animations = {
  duration: {
    fast: '150ms',
    normal: '300ms',
    slow: '500ms',
  },
  
  easing: {
    linear: 'linear',
    ease: 'ease',
    easeIn: 'ease-in',
    easeOut: 'ease-out',
    easeInOut: 'ease-in-out',
  }
};

export default {
  themes,
  defaultTheme,
  getTheme,
  getThemeColors,
  getThemeColor,
  generateCSSVariables,
  tailwindColors,
  typography,
  spacing,
  animations
};