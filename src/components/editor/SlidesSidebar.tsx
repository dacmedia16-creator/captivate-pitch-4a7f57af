import { SectionData } from "@/components/layouts/SectionRenderer";
import { cn } from "@/lib/utils";
import { Eye, EyeOff, GripVertical } from "lucide-react";

interface SlidesSidebarProps {
  sections: SectionData[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onToggleVisibility: (id: string) => void;
}

export function SlidesSidebar({ sections, selectedId, onSelect, onToggleVisibility }: SlidesSidebarProps) {
  return (
    <div className="w-64 border-r border-border bg-card overflow-y-auto">
      <div className="p-3 border-b border-border">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Slides</h3>
      </div>
      <div className="p-2 space-y-1">
        {sections.map((section, index) => (
          <div
            key={section.id}
            className={cn(
              "flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors text-sm",
              selectedId === section.id ? "bg-primary/10 text-primary" : "hover:bg-muted",
              !section.is_visible && "opacity-50"
            )}
            onClick={() => onSelect(section.id)}
          >
            <GripVertical className="h-4 w-4 text-muted-foreground shrink-0 cursor-grab" />
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{section.title || section.section_key}</p>
              <p className="text-xs text-muted-foreground">{index + 1}</p>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); onToggleVisibility(section.id); }}
              className="p-1 rounded hover:bg-muted-foreground/10"
            >
              {section.is_visible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
