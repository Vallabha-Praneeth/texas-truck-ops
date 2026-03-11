// Theme configuration matching shadcn/ui from UI reference
export const theme = {
  colors: {
    // Primary brand colors
    primary: '#2563eb', // Blue
    primaryForeground: '#ffffff',

    // Secondary colors
    secondary: '#64748b',
    secondaryForeground: '#ffffff',

    // Background & surfaces
    background: '#ffffff',
    foreground: '#0f172a',

    // Muted/disabled states
    muted: '#f1f5f9',
    mutedForeground: '#64748b',

    // Accent for highlights
    accent: '#f59e0b',
    accentForeground: '#ffffff',

    // Destructive/error states
    destructive: '#ef4444',
    destructiveForeground: '#ffffff',

    // Borders & inputs
    border: '#e2e8f0',
    input: '#e2e8f0',
    ring: '#2563eb',

    // Status colors (from UI reference)
    success: '#10b981',
    warning: '#f59e0b',
    info: '#3b82f6',

    // Texas regions color palette (for map/chips)
    regions: {
      dfw: '#3b82f6',
      houston: '#8b5cf6',
      austin: '#10b981',
      sanAntonio: '#f59e0b',
      elPaso: '#ef4444',
      rgv: '#ec4899',
    },
  },

  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    '2xl': 48,
  },

  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    full: 9999,
  },

  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
  },

  fontWeight: {
    normal: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
};

// Dark mode theme (for future)
export const darkTheme = {
  ...theme,
  colors: {
    ...theme.colors,
    background: '#0f172a',
    foreground: '#f1f5f9',
    muted: '#1e293b',
    mutedForeground: '#94a3b8',
    border: '#334155',
  },
};
