export const theme = {
  colors: {
    background: "#f4f6fb",
    surface: "#fbfcff",
    surfaceMuted: "#f3f6ff",
    card: "#ffffff",
    border: "#d8e0f2",
    divider: "#e6ebf5",
    indigo: "#4f46e5",
    blue: "#3b82f6",
    purple: "#9333ea",
    text: "#111827",
    muted: "#6b7280",
    subtle: "#9ca3af",
    tertiary: "#94a3b8",
    success: "#16a34a",
    warning: "#ea580c",
    danger: "#dc2626"
  },
  spacing: {
    xs: 6,
    sm: 10,
    md: 16,
    lg: 24
  },
  radius: {
    xl: 24,
    lg: 20,
    md: 16,
    sm: 12,
    pill: 999
  },
  shadow: {
    shadowColor: "#111827",
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2
  }
};

export const difficultyColor = (difficulty?: string) => {
  switch (difficulty) {
  case "easy":
    return theme.colors.success;
  case "medium":
    return theme.colors.warning;
  case "hard":
    return theme.colors.danger;
  default:
    return theme.colors.indigo;
  }
};
