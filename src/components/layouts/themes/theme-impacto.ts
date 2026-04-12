import { SlideTheme } from "./theme.types";

export const themeImpacto: SlideTheme = {
  id: "impacto",
  name: "Impacto Comercial",
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
    overlay: (_primary, deep) => `linear-gradient(180deg, transparent 5%, ${deep}99 40%, ${deep} 100%)`,
    titleSize: "72px",
    locationStyle: "dot",
    barType: "horizontal",
    logoPosition: "top-right",
  },
  heading: {
    textTransform: "uppercase",
    titleSize: "48px",
  },
  divider: {
    width: "60px",
    height: "4px",
    style: "solid",
  },
  card: {
    borderRadius: "0px",
    border: false,
    shadow: false,
  },
  metric: {
    size: "64px",
    labelSize: "16px",
    labelTracking: "0.25em",
  },
  closing: {
    background: (_primary, deep) => deep,
    ctaStyle: "block",
    headline: "Vamos fechar negócio?",
    subline: "Entre em contato agora mesmo.",
  },
};
