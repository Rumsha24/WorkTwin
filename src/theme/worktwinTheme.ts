// src/theme/worktwinTheme.ts
export const lightColors = {
  background: "#F8FAFC",
  surface: "#F1F5F9",
  card: "#FFFFFF",
  primary: "#6366F1",
  primaryLight: "#818CF8",
  secondary: "#10B981",
  accent: "#F59E0B",
  text: "#0F172A",
  textSecondary: "#475569",
  textMuted: "#64748B",
  border: "#E2E8F0",
  success: "#10B981",
  warning: "#F59E0B",
  danger: "#EF4444",
  info: "#3B82F6",
};

export const darkColors = {
  background: "#0A0F1F",
  surface: "#151B2B",
  card: "#1E2639",
  primary: "#6366F1",
  primaryLight: "#818CF8",
  secondary: "#10B981",
  accent: "#F59E0B",
  text: "#FFFFFF",
  textSecondary: "#94A3B8",
  textMuted: "#64748B",
  border: "#2D3748",
  success: "#10B981",
  warning: "#F59E0B",
  danger: "#EF4444",
  info: "#3B82F6",
};

export const Colors = darkColors; // Default export for backward compatibility

export const Typography = {
  h1: {
    fontSize: 32,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  h2: {
    fontSize: 28,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  h3: {
    fontSize: 24,
    fontWeight: "600",
  },
  body: {
    fontSize: 16,
    fontWeight: "400",
    lineHeight: 22,
  },
  caption: {
    fontSize: 14,
    fontWeight: "500",
  },
  button: {
    fontSize: 16,
    fontWeight: "600",
  },
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  round: 999,
} as const;

export const Shadows = {
  small: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  medium: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 5,
  },
} as const;