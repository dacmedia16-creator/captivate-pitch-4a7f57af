import { SlideTheme } from "./theme.types";

export const themePremium: SlideTheme = {
  id: "premium",
  name: "Premium",
  font: "'Gotham', 'Montserrat', sans-serif",
  colors: {
    primary: "#003DA5",
    accent: "#DC1431",
    deep: "#001F5C",
    neutral: "#F5F6F8",
    textMuted: "#6B7280",
    textLight: "#9CA3AF",
  },
  cover: {
    overlay: (primary, deep) => `linear-gradient(135deg, ${deep}ee 0%, ${primary}cc 50%, ${primary}88 100%)`,
    titleSize: "72px",
    locationStyle: "dash",
    barType: "gradient",
    logoPosition: "top-left",
  },
  heading: {
    textTransform: "none",
    titleSize: "48px",
  },
  divider: {
    width: "100%",
    height: "3px",
    style: "full-width",
  },
  card: {
    borderRadius: "12px",
    border: true,
    shadow: false,
  },
  metric: {
    size: "64px",
    labelSize: "16px",
    labelTracking: "0.20em",
  },
  closing: {
    background: (primary, deep) => `linear-gradient(135deg, ${deep}, ${primary}dd)`,
    ctaStyle: "ornament",
    headline: "Obrigado pela confiança",
    subline: "Estou à disposição para transformar este imóvel em um excelente negócio.",
  },
};
