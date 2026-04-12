import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { SectionRenderer, SectionData } from "@/components/layouts/SectionRenderer";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Maximize, Minimize, X } from "lucide-react";
import { cn } from "@/lib/utils";

export default function PresentationMode() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [direction, setDirection] = useState<"next" | "prev">("next");
  const [animating, setAnimating] = useState(false);

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

  const goTo = useCallback((next: number, dir: "next" | "prev") => {
    if (animating) return;
    setDirection(dir);
    setAnimating(true);
    setTimeout(() => {
      setCurrentIndex(next);
      setAnimating(false);
    }, 200);
  }, [animating]);

  const goNext = useCallback(() => {
    if (currentIndex < sections.length - 1) goTo(currentIndex + 1, "next");
  }, [currentIndex, sections.length, goTo]);

  const goPrev = useCallback(() => {
    if (currentIndex > 0) goTo(currentIndex - 1, "prev");
  }, [currentIndex, goTo]);

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
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4 opacity-0 hover:opacity-100 transition-opacity duration-300">
        <Button variant="ghost" size="icon" onClick={() => navigate(`/presentations/${id}/edit`)} className="bg-background/40 backdrop-blur-md rounded-full h-9 w-9">
          <X className="h-4 w-4" />
        </Button>
        <span className="text-xs text-muted-foreground bg-background/40 backdrop-blur-md px-3 py-1.5 rounded-full">
          {currentIndex + 1} / {sections.length}
        </span>
        <Button variant="ghost" size="icon" onClick={toggleFullscreen} className="bg-background/40 backdrop-blur-md rounded-full h-9 w-9">
          {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center p-8 overflow-hidden">
        <div className={cn(
          "w-full max-w-4xl transition-all duration-200",
          animating && direction === "next" && "opacity-0 translate-x-4",
          animating && direction === "prev" && "opacity-0 -translate-x-4",
          !animating && "opacity-100 translate-x-0"
        )}>
          {current ? (
            <SectionRenderer section={current} layout={presentation?.selected_layout || "executivo"} branding={branding || undefined} />
          ) : (
            <p className="text-center text-muted-foreground">Nenhum slide visível</p>
          )}
        </div>
      </div>

      {/* Navigation */}
      <div className="absolute bottom-0 left-0 right-0 z-10">
        {/* Progress dots */}
        <div className="flex justify-center gap-1.5 pb-2">
          {sections.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i, i > currentIndex ? "next" : "prev")}
              className={cn(
                "h-1.5 rounded-full transition-all duration-300",
                i === currentIndex ? "w-6 bg-accent" : "w-1.5 bg-muted-foreground/30 hover:bg-muted-foreground/50"
              )}
            />
          ))}
        </div>
        <div className="flex items-center justify-between p-3 opacity-0 hover:opacity-100 transition-opacity duration-300">
          <Button variant="ghost" size="sm" onClick={goPrev} disabled={currentIndex === 0} className="bg-background/40 backdrop-blur-md rounded-full">
            <ChevronLeft className="h-4 w-4 mr-1" /> Anterior
          </Button>
          <Button variant="ghost" size="sm" onClick={goNext} disabled={currentIndex === sections.length - 1} className="bg-background/40 backdrop-blur-md rounded-full">
            Próximo <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
}
