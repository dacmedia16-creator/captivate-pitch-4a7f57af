import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, FileText, Building2 } from "lucide-react";

export default function MarketStudyResult() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: study, isLoading } = useQuery({
    queryKey: ["market-study", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("market_studies")
        .select("*, market_study_subject_properties(*), market_study_results(*), market_study_comparables(*)")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!study) {
    return (
      <div className="text-center py-20">
        <p className="text-lg text-muted-foreground">Estudo não encontrado</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate("/market-studies")}>
          Voltar
        </Button>
      </div>
    );
  }

  const subject = (study as any).market_study_subject_properties?.[0];
  const result = (study as any).market_study_results?.[0];
  const comparables = (study as any).market_study_comparables ?? [];

  const fmt = (v?: number | null) =>
    v != null
      ? v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 })
      : "—";

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/market-studies")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold font-display">{study.title || "Estudo de Mercado"}</h1>
          <p className="text-sm text-muted-foreground">
            {[subject?.neighborhood, subject?.city].filter(Boolean).join(", ")}
          </p>
        </div>
        <Badge className="ml-auto" variant={study.status === "completed" ? "default" : "secondary"}>
          {study.status === "completed" ? "Concluído" : study.status === "draft" ? "Rascunho" : study.status}
        </Badge>
      </div>

      {/* Subject Property Summary */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Imóvel Avaliado
          </CardTitle>
        </CardHeader>
        <CardContent>
          {subject ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div><span className="text-muted-foreground">Tipo:</span> <span className="font-medium">{subject.property_category || "—"}</span></div>
              <div><span className="text-muted-foreground">Área:</span> <span className="font-medium">{subject.area_useful || subject.area_built || "—"} m²</span></div>
              <div><span className="text-muted-foreground">Quartos:</span> <span className="font-medium">{subject.bedrooms ?? "—"}</span></div>
              <div><span className="text-muted-foreground">Suítes:</span> <span className="font-medium">{subject.suites ?? "—"}</span></div>
              <div><span className="text-muted-foreground">Vagas:</span> <span className="font-medium">{subject.parking_spots ?? "—"}</span></div>
              <div><span className="text-muted-foreground">Padrão:</span> <span className="font-medium">{subject.construction_standard || "—"}</span></div>
              <div><span className="text-muted-foreground">Conservação:</span> <span className="font-medium">{subject.conservation_state || "—"}</span></div>
              <div><span className="text-muted-foreground">Preço esperado:</span> <span className="font-medium">{fmt(subject.owner_expected_price)}</span></div>
            </div>
          ) : (
            <p className="text-muted-foreground">Dados do imóvel não disponíveis</p>
          )}
        </CardContent>
      </Card>

      {/* Results */}
      {result ? (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Preço Médio", value: fmt(result.avg_price) },
              { label: "R$/m² Médio", value: fmt(result.avg_price_per_sqm) },
              { label: "Sugestão Anúncio", value: fmt(result.suggested_ad_price) },
              { label: "Venda Rápida", value: fmt(result.suggested_fast_sale_price) },
            ].map((m) => (
              <Card key={m.label} className="glass-card">
                <CardContent className="p-4 text-center">
                  <p className="text-xs text-muted-foreground">{m.label}</p>
                  <p className="text-xl font-bold text-primary mt-1">{m.value}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {result.executive_summary && (
            <Card className="glass-card">
              <CardHeader><CardTitle className="text-lg">Resumo Executivo</CardTitle></CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed whitespace-pre-line">{result.executive_summary}</p>
              </CardContent>
            </Card>
          )}
        </>
      ) : (
        <Card className="glass-card">
          <CardContent className="py-12 text-center">
            <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">
              {study.status === "draft"
                ? "Este estudo ainda não foi processado. Os resultados aparecerão aqui após a análise."
                : "Resultados ainda não disponíveis."}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Comparables */}
      {comparables.length > 0 && (
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-lg">
              Comparáveis ({comparables.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-muted-foreground">
                    <th className="text-left py-2 pr-4">Imóvel</th>
                    <th className="text-right py-2 px-2">Preço</th>
                    <th className="text-right py-2 px-2">R$/m²</th>
                    <th className="text-right py-2 px-2">Área</th>
                    <th className="text-center py-2 px-2">Score</th>
                    <th className="text-center py-2 pl-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {comparables.map((c: any) => (
                    <tr key={c.id} className="border-b border-border/50">
                      <td className="py-2 pr-4">
                        <p className="font-medium">{c.title || c.address || "Sem título"}</p>
                        <p className="text-xs text-muted-foreground">{c.neighborhood}</p>
                      </td>
                      <td className="text-right py-2 px-2">{fmt(c.price)}</td>
                      <td className="text-right py-2 px-2">{fmt(c.price_per_sqm)}</td>
                      <td className="text-right py-2 px-2">{c.area ? `${c.area} m²` : "—"}</td>
                      <td className="text-center py-2 px-2">
                        <Badge variant={Number(c.similarity_score) >= 70 ? "default" : "secondary"}>
                          {Number(c.similarity_score).toFixed(0)}
                        </Badge>
                      </td>
                      <td className="text-center py-2 pl-2">
                        <Badge variant={c.listing_status === "active" ? "default" : "secondary"}>
                          {c.listing_status === "active" ? "Ativo" : c.listing_status === "sold" ? "Vendido" : c.listing_status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
