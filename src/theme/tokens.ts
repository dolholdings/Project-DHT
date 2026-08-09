export const theme = {
  primary: "#00AEA9",
  primaryDark: "#008F8A",
  background: "#F8FAFC",
  surface: "#FFFFFF",
  border: "#E2E8F0",
  text: "#0F172A",
  textSecondary: "#64748B"
} as const;

export type ThemeTokens = typeof theme;
