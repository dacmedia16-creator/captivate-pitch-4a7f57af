import { SlideTheme } from "./theme.types";

export const themeExecutivo: SlideTheme = {
  id: "executivo",
  name: "Executivo",
  font: "'Gotham', 'Montserrat', sans-serif",
  colors: {
    primary: "#003DA5",
    accent: "#DC1431",
    deep: "#003DA5",
    neutral: "#F5F6F8",
    textMuted: "#6B7280",
    textLight: "#9CA3AF",
  },
  cover: {
    overlay: (primary) => `linear-gradient(to top, ${primary} 0%, ${primary}dd 35%, ${primary}66 65%, ${primary}22 100%)`,
    titleSize: "48px",
    locationStyle: "dash",
    barType: "vertical",
    logoPosition: "top-left",
  },
  heading: {
    textTransform: "none",
    titleSize: "28px",
  },
  divider: {
    width: "40px",
    height: "2px",
    style: "solid",
  },
  card: {
    borderRadius: "8px",
    border: false,
    shadow: false,
  },
  metric: {
    size: "30px",
    labelSize: "10px",
    labelTracking: "0.20em",
  },
  closing: {
    background: (primary) => primary,
    ctaStyle: "ornament",
    headline: "Obrigado pela confiança",
    subline: "Estou à disposição para transformar este imóvel em um excelente negócio.",
  },
};
