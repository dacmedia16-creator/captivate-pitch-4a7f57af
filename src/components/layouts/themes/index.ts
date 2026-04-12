import { SlideTheme } from "./theme.types";
import { themeExecutivo } from "./theme-executivo";
import { themePremium } from "./theme-premium";
import { themeImpacto } from "./theme-impacto";

export { themeExecutivo, themePremium, themeImpacto };
export type { SlideTheme };
export { resolveColors } from "./theme.types";
export type { ResolvedColors } from "./theme.types";

const themeMap: Record<string, SlideTheme> = {
  executivo: themeExecutivo,
  premium: themePremium,
  impacto: themeImpacto,
};

export function getTheme(layout: string): SlideTheme {
  return themeMap[layout] || themeExecutivo;
}
