export const colors = {
  // Primary colors
  primary: {
    50: '#e3f2fd',
    100: '#bbdefb',
    200: '#90caf9',
    300: '#64b5f6',
    400: '#42a5f5',
    500: '#2196f3',
    600: '#1e88e5',
    700: '#1976d2',
    800: '#1565c0',
    900: '#0d47a1',
  },

  // Secondary colors
  secondary: {
    50: '#f3e5f5',
    100: '#e1bee7',
    200: '#ce93d8',
    300: '#ba68c8',
    400: '#ab47bc',
    500: '#9c27b0',
    600: '#8e24aa',
    700: '#7b1fa2',
    800: '#6a1b9a',
    900: '#4a148c',
  },

  // Neutral colors
  gray: {
    50: '#fafafa',
    100: '#f5f5f5',
    200: '#eeeeee',
    300: '#e0e0e0',
    400: '#bdbdbd',
    500: '#9e9e9e',
    600: '#757575',
    700: '#616161',
    800: '#424242',
    900: '#212121',
  },

  // Status colors
  success: {
    light: '#81c784',
    main: '#4caf50',
    dark: '#388e3c',
  },

  warning: {
    light: '#ffb74d',
    main: '#ff9800',
    dark: '#f57c00',
  },

  error: {
    light: '#e57373',
    main: '#f44336',
    dark: '#d32f2f',
  },

  info: {
    light: '#64b5f6',
    main: '#2196f3',
    dark: '#1976d2',
  },
}

export const lightTheme = {
  name: 'light',
  colors: {
    // Background
    background: {
      default: '#ffffff',
      paper: '#f5f5f5',
      elevated: '#ffffff',
    },

    // Text
    text: {
      primary: '#212121',
      secondary: '#757575',
      disabled: '#bdbdbd',
    },

    // Borders
    border: {
      light: '#e0e0e0',
      main: '#bdbdbd',
      dark: '#9e9e9e',
    },

    // Primary
    primary: colors.primary,

    // Status
    success: colors.success,
    warning: colors.warning,
    error: colors.error,
    info: colors.info,
  },

  // Shadows
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
  },
}

export const darkTheme = {
  name: 'dark',
  colors: {
    // Background
    background: {
      default: '#0a0a0a',
      paper: '#1a1a1a',
      elevated: '#262626',
    },

    // Text
    text: {
      primary: '#ffffff',
      secondary: '#a3a3a3',
      disabled: '#525252',
    },

    // Borders
    border: {
      light: '#262626',
      main: '#404040',
      dark: '#525252',
    },

    // Primary
    primary: colors.primary,

    // Status
    success: colors.success,
    warning: colors.warning,
    error: colors.error,
    info: colors.info,
  },

  // Shadows
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.3)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.4)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.5)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.6)',
  },
}

export type Theme = typeof lightTheme
export type ThemeName = 'light' | 'dark'
