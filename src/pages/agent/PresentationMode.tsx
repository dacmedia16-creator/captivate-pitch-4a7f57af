import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { SectionRenderer, SectionData } from "@/components/layouts/SectionRenderer";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ChevronLeft, ChevronRight, Maximize, Minimize, X } from "lucide-react";

export default function PresentationMode() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const { data: presentation } = useQuery({
    queryKey: ["presentation", id],
    queryFn: async () => {
      const { data } = await supabase.from("presentations").select("*").eq("id", id!).single();
      return data;
    },
    enabled: !!id,
  });

  const { data: branding } = useQuery({
    queryKey: ["agency-branding", profile?.tenant_id],
    queryFn: async () => {
      const { data } = await supabase.from("agency_profiles").select("primary_color, secondary_color, logo_url").eq("tenant_id", profile!.tenant_id!).single();
      return data;
    },
    enabled: !!profile?.tenant_id,
  });

  const { data: sections = [] } = useQuery({
    queryKey: ["presentation-sections-visible", id],
    queryFn: async () => {
      const { data } = await supabase.from("presentation_sections").select("*").eq("presentation_id", id!).eq("is_visible", true).order("sort_order");
      return (data || []).map(s => ({ ...s, content: s.content as any })) as SectionData[];
    },
    enabled: !!id,
  });

  const goNext = useCallback(() => setCurrentIndex(i => Math.min(i + 1, sections.length - 1)), [sections.length]);
  const goPrev = useCallback(() => setCurrentIndex(i => Math.max(i - 1, 0)), []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") goNext();
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "Escape") navigate(`/presentations/${id}/edit`);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [goNext, goPrev, navigate, id]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const progress = sections.length > 0 ? ((currentIndex + 1) / sections.length) * 100 : 0;
  const current = sections[currentIndex];

  return (
    <div className="fixed inset-0 bg-background z-50 flex flex-col">
      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-3 opacity-0 hover:opacity-100 transition-opacity">
        <Button variant="ghost" size="icon" onClick={() => navigate(`/presentations/${id}/edit`)}><X className="h-5 w-5" /></Button>
        <span className="text-sm text-muted-foreground">{currentIndex + 1} / {sections.length}</span>
        <Button variant="ghost" size="icon" onClick={toggleFullscreen}>
          {isFullscreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center p-8 overflow-hidden">
        <div className="w-full max-w-4xl">
          {current ? (
            <SectionRenderer section={current} layout={presentation?.selected_layout || "executivo"} branding={branding || undefined} />
          ) : (
            <p className="text-center text-muted-foreground">Nenhum slide visível</p>
          )}
        </div>
      </div>

      {/* Navigation */}
      <div className="absolute bottom-0 left-0 right-0 z-10">
        <Progress value={progress} className="h-1 rounded-none" />
        <div className="flex items-center justify-between p-3 opacity-0 hover:opacity-100 transition-opacity">
          <Button variant="ghost" size="sm" onClick={goPrev} disabled={currentIndex === 0}><ChevronLeft className="h-4 w-4 mr-1" /> Anterior</Button>
          <Button variant="ghost" size="sm" onClick={goNext} disabled={currentIndex === sections.length - 1}>Próximo <ChevronRight className="h-4 w-4 ml-1" /></Button>
        </div>
      </div>
    </div>
  );
}
