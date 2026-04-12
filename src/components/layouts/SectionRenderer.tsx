import { LayoutExecutivo } from "./LayoutExecutivo";
import { LayoutPremium } from "./LayoutPremium";
import { LayoutImpactoComercial } from "./LayoutImpactoComercial";

export interface SectionData {
  id: string;
  section_key: string;
  title: string | null;
  content: any;
  sort_order: number;
  is_visible: boolean;
}

interface SectionRendererProps {
  section: SectionData;
  layout: string;
  branding?: { primary_color?: string | null; secondary_color?: string | null; logo_url?: string | null };
}

export function SectionRenderer({ section, layout, branding }: SectionRendererProps) {
  switch (layout) {
    case "premium":
      return <LayoutPremium section={section} branding={branding} />;
    case "impacto":
      return <LayoutImpactoComercial section={section} branding={branding} />;
    default:
      return <LayoutExecutivo section={section} branding={branding} />;
  }
}
