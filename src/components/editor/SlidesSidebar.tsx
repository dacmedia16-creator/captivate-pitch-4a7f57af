import { SectionData } from "@/components/layouts/SectionRenderer";
import { cn } from "@/lib/utils";
import { Eye, EyeOff, GripVertical, Building, User, Globe, MapPin, Home, Target, Award, TrendingUp, BarChart3, DollarSign, Phone } from "lucide-react";

const sectionIcons: Record<string, any> = {
  cover: Building, broker_intro: User, about_global: Globe, about_national: Globe,
  about_regional: MapPin, property_summary: Home, marketing_plan: Target,
  differentials: Award, results: TrendingUp, market_study_placeholder: BarChart3,
  pricing_scenarios: DollarSign, closing: Phone,
};

interface SlidesSidebarProps {
  sections: SectionData[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onToggleVisibility: (id: string) => void;
}

export function SlidesSidebar({ sections, selectedId, onSelect, onToggleVisibility }: SlidesSidebarProps) {
  return (
    <div className="w-64 border-r border-border/40 bg-card/50 overflow-y-auto">
      <div className="p-3 border-b border-border/30">
        <div className="flex items-center justify-between">
          <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Slides</h3>
          <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">{sections.length}</span>
        </div>
      </div>
      <div className="p-1.5 space-y-0.5">
        {sections.map((section, index) => {
          const Icon = sectionIcons[section.section_key] || Building;
          return (
            <div
              key={section.id}
              className={cn(
                "flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all duration-200 text-sm group",
                selectedId === section.id
                  ? "bg-primary/8 text-primary border-l-2 border-accent"
                  : "hover:bg-muted/50 border-l-2 border-transparent",
                !section.is_visible && "opacity-40"
              )}
              onClick={() => onSelect(section.id)}
            >
              <GripVertical className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0 cursor-grab opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="h-6 w-6 rounded-md bg-muted/60 flex items-center justify-center shrink-0">
                <Icon className="h-3 w-3 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate text-xs">{section.title || section.section_key}</p>
                <p className="text-[10px] text-muted-foreground">{index + 1}</p>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); onToggleVisibility(section.id); }}
                className="p-1 rounded hover:bg-muted-foreground/10 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                {section.is_visible ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
