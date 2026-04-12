export interface SlideTheme {
  id: string;
  name: string;
  font: string;
  colors: {
    primary: string;
    accent: string;
    deep: string;
    neutral: string;
    textMuted: string;
    textLight: string;
  };
  cover: {
    overlay: (primary: string, deep: string) => string;
    titleSize: string;
    locationStyle: "dash" | "dot" | "pipe";
    barType: "vertical" | "horizontal" | "gradient" | "none";
    logoPosition: "top-left" | "top-right";
  };
  heading: {
    textTransform: "none" | "uppercase";
    titleSize: string;
  };
  divider: {
    width: string;
    height: string;
    style: "solid" | "full-width" | "gradient";
  };
  card: {
    borderRadius: string;
    border: boolean;
    shadow: boolean;
  };
  metric: {
    size: string;
    labelSize: string;
    labelTracking: string;
  };
  closing: {
    background: (primary: string, deep: string) => string;
    ctaStyle: "ornament" | "block" | "minimal";
    headline: string;
    subline: string;
  };
}

export interface ResolvedColors {
  primary: string;
  accent: string;
  deep: string;
  neutral: string;
  textMuted: string;
  textLight: string;
}

export function resolveColors(
  theme: SlideTheme,
  branding?: { primary_color?: string | null; secondary_color?: string | null }
): ResolvedColors {
  return {
    primary: branding?.primary_color || theme.colors.primary,
    accent: branding?.secondary_color || theme.colors.accent,
    deep: theme.colors.deep,
    neutral: theme.colors.neutral,
    textMuted: theme.colors.textMuted,
    textLight: theme.colors.textLight,
  };
}
