import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SectionRenderer, SectionData } from "@/components/layouts/SectionRenderer";
import { Loader2 } from "lucide-react";

export default function SharedPresentation() {
  const { token } = useParams<{ token: string }>();

  const { data: presentation, isLoading: loadingPres } = useQuery({
    queryKey: ["shared-presentation", token],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("presentations")
        .select("*")
        .eq("share_token", token!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!token,
  });

  const { data: sections, isLoading: loadingSections } = useQuery({
    queryKey: ["shared-sections", presentation?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("presentation_sections")
        .select("*")
        .eq("presentation_id", presentation!.id)
        .eq("is_visible", true)
        .order("sort_order");
      if (error) throw error;
      return (data || []).map(s => ({ ...s, content: s.content as any })) as SectionData[];
    },
    enabled: !!presentation?.id,
  });

  const { data: branding } = useQuery({
    queryKey: ["shared-branding", presentation?.tenant_id],
    queryFn: async () => {
      const { data } = await supabase
        .from("agency_profiles")
        .select("primary_color, secondary_color, logo_url, company_name")
        .eq("tenant_id", presentation!.tenant_id)
        .single();
      return data;
    },
    enabled: !!presentation?.tenant_id,
  });

  if (loadingPres || loadingSections) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!presentation || !sections) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold">Apresentação não encontrada</h1>
          <p className="text-muted-foreground">O link pode estar incorreto ou expirado.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <div className="bg-card border-b border-border py-4 px-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            {branding?.logo_url && <img src={branding.logo_url} className="h-8" alt="" />}
            <div>
              <p className="font-semibold">{presentation.title || "Apresentação"}</p>
              <p className="text-xs text-muted-foreground">{branding?.company_name || ""}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Sections */}
      <div className="max-w-4xl mx-auto py-8 px-4 space-y-8">
        {sections.map(section => (
          <SectionRenderer
            key={section.id}
            section={section}
            layout={presentation.selected_layout || "executivo"}
            branding={branding || undefined}
          />
        ))}
      </div>

      {/* Footer */}
      <div className="bg-card border-t border-border py-4 px-6 text-center">
        <p className="text-xs text-muted-foreground">
          Apresentação gerada por {branding?.company_name || "Listing Studio AI"}
        </p>
      </div>
    </div>
  );
}
