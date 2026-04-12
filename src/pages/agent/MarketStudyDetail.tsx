import { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Loader2, Check, X, Plus, TrendingUp, TrendingDown, Minus, Calculator } from "lucide-react";
import { toast } from "sonner";
import { calculateMarketPrices, useSaveMarketReport, type MarketCalcResult } from "@/hooks/useMarketCalculations";
import { logAudit } from "@/hooks/useAuditLog";

function formatBRL(value: number | null) {
  if (!value) return "—";
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(value);
}

export default function MarketStudyDetail() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);

  const { data: job, isLoading: loadingJob } = useQuery({
    queryKey: ["market-job", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("market_analysis_jobs")
        .select("*, presentations(*)")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: comparables, isLoading: loadingComps } = useQuery({
    queryKey: ["market-comparables", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("market_comparables")
        .select("*")
        .eq("market_analysis_job_id", id!)
        .order("similarity_score", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!id,
  });

  const { data: report } = useQuery({
    queryKey: ["market-report", id],
    queryFn: async () => {
      const { data } = await supabase
        .from("market_reports")
        .select("*")
        .eq("market_analysis_job_id", id!)
        .single();
      return data;
    },
    enabled: !!id,
  });

  const saveReport = useSaveMarketReport(id!);

  const toggleApproval = useMutation({
    mutationFn: async ({ compId, approved }: { compId: string; approved: boolean }) => {
      const { error } = await supabase.from("market_comparables").update({ is_approved: approved }).eq("id", compId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["market-comparables", id] }),
  });

  const deleteComparable = useMutation({
    mutationFn: async (compId: string) => {
      const { error } = await supabase.from("market_comparables").delete().eq("id", compId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["market-comparables", id] });
      toast.success("Comparável removido");
    },
  });

  const addComparable = useMutation({
    mutationFn: async (comp: any) => {
      const { error } = await supabase.from("market_comparables").insert({
        market_analysis_job_id: id!,
        ...comp,
        is_approved: true,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["market-comparables", id] });
      setAddOpen(false);
      toast.success("Comparável adicionado");
    },
  });

  const handleCalculate = async () => {
    if (!comparables) return;
    const result = calculateMarketPrices(comparables);
    await saveReport.mutateAsync(result);
    await logAudit("market_report_generated", "market_analysis_job", id!);
    toast.success("Cálculos realizados com sucesso!");
  };

  if (loadingJob || loadingComps) {
    return <div className="flex items-center justify-center min-h-[40vh]"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  const pres = job?.presentations as any;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-display">Estudo de Mercado</h1>
        <p className="text-muted-foreground">{pres?.title || "Sem título"} — {[pres?.neighborhood, pres?.city].filter(Boolean).join(", ")}</p>
      </div>

      {/* Property summary */}
      <Card className="glass-card">
        <CardHeader><CardTitle className="text-lg">Resumo do Imóvel</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div><span className="text-muted-foreground">Tipo:</span> <span className="font-medium">{pres?.property_type || "—"}</span></div>
            <div><span className="text-muted-foreground">Área:</span> <span className="font-medium">{pres?.area_total ? `${pres.area_total} m²` : "—"}</span></div>
            <div><span className="text-muted-foreground">Quartos:</span> <span className="font-medium">{pres?.bedrooms || "—"}</span></div>
            <div><span className="text-muted-foreground">Vagas:</span> <span className="font-medium">{pres?.parking_spots || "—"}</span></div>
            <div><span className="text-muted-foreground">Valor pretendido:</span> <span className="font-medium">{formatBRL(pres?.owner_expected_price)}</span></div>
            <div><span className="text-muted-foreground">Bairro:</span> <span className="font-medium">{pres?.neighborhood || "—"}</span></div>
            <div><span className="text-muted-foreground">Padrão:</span> <span className="font-medium">{pres?.property_standard || "—"}</span></div>
            <div><span className="text-muted-foreground">Status:</span> <Badge variant="secondary">{job?.status}</Badge></div>
          </div>
        </CardContent>
      </Card>

      {/* Filters and portals */}
      <FiltersAndPortalsCard job={job} />

      {/* Pricing scenarios */}
      {report && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="glass-card border-green-500/30">
            <CardContent className="p-6 text-center">
              <TrendingUp className="h-8 w-8 text-green-500 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Preço Aspiracional</p>
              <p className="text-2xl font-bold text-green-500">{formatBRL(report.suggested_aspirational_price)}</p>
              <p className="text-xs text-muted-foreground mt-1">+15% sobre a mediana</p>
            </CardContent>
          </Card>
          <Card className="glass-card border-primary/30">
            <CardContent className="p-6 text-center">
              <Minus className="h-8 w-8 text-primary mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Preço de Mercado</p>
              <p className="text-2xl font-bold text-primary">{formatBRL(report.suggested_market_price)}</p>
              <p className="text-xs text-muted-foreground mt-1">Mediana dos comparáveis</p>
            </CardContent>
          </Card>
          <Card className="glass-card border-orange-500/30">
            <CardContent className="p-6 text-center">
              <TrendingDown className="h-8 w-8 text-orange-500 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Venda Acelerada</p>
              <p className="text-2xl font-bold text-orange-500">{formatBRL(report.suggested_fast_sale_price)}</p>
              <p className="text-xs text-muted-foreground mt-1">-15% sobre a mediana</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Actions bar */}
      <div className="flex items-center gap-3">
        <Button onClick={handleCalculate} disabled={saveReport.isPending}>
          <Calculator className="h-4 w-4 mr-2" />
          {saveReport.isPending ? "Calculando..." : "Calcular Cenários"}
        </Button>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button variant="outline"><Plus className="h-4 w-4 mr-2" /> Adicionar Comparável</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Adicionar Comparável</DialogTitle></DialogHeader>
            <AddComparableForm onSubmit={(comp) => addComparable.mutate(comp)} loading={addComparable.isPending} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Comparables table */}
      <Card className="glass-card">
        <CardHeader><CardTitle className="text-lg">Comparáveis ({comparables?.length || 0})</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Imóvel</TableHead>
                <TableHead>Preço</TableHead>
                <TableHead>R$/m²</TableHead>
                <TableHead>Área</TableHead>
                <TableHead>Quartos</TableHead>
                <TableHead>Vagas</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Fonte</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {comparables?.map((comp) => (
                <TableRow key={comp.id} className={!comp.is_approved ? "opacity-50" : ""}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {comp.image_url && <img src={comp.image_url} className="h-10 w-10 rounded object-cover" />}
                      <div>
                        <p className="font-medium text-sm truncate max-w-[200px]">{comp.title || "—"}</p>
                        <p className="text-xs text-muted-foreground">{comp.neighborhood || comp.address || "—"}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{formatBRL(comp.price)}</TableCell>
                  <TableCell>{formatBRL(comp.price_per_sqm)}</TableCell>
                  <TableCell>{comp.area ? `${comp.area} m²` : "—"}</TableCell>
                  <TableCell>{comp.bedrooms ?? "—"}</TableCell>
                  <TableCell>{comp.parking_spots ?? "—"}</TableCell>
                  <TableCell>
                    {comp.similarity_score != null && (
                      <Badge variant="secondary">{Number(comp.similarity_score).toFixed(0)}%</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {comp.source_url ? (
                      <a href={comp.source_url} target="_blank" rel="noopener" className="text-xs text-primary hover:underline">{comp.source_name || "Link"}</a>
                    ) : (
                      <span className="text-xs text-muted-foreground">{comp.source_name || "—"}</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button size="icon" variant="ghost" onClick={() => toggleApproval.mutate({ compId: comp.id, approved: !comp.is_approved })}>
                        {comp.is_approved ? <Check className="h-4 w-4 text-green-500" /> : <Check className="h-4 w-4 text-muted-foreground" />}
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => deleteComparable.mutate(comp.id)}>
                        <X className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {(!comparables || comparables.length === 0) && (
                <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">Nenhum comparável encontrado</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function FiltersAndPortalsCard({ job }: { job: any }) {
  const filters = (job?.filters as Record<string, any>) || {};
  const selectedPortals = (job?.selected_portals as string[]) || [];

  const { data: portalSources } = useQuery({
    queryKey: ["portal-sources"],
    queryFn: async () => {
      const { data } = await supabase.from("portal_sources").select("id, name, code");
      return data || [];
    },
    enabled: selectedPortals.length > 0,
  });

  const portalNames = selectedPortals.map((pId: string) => {
    const found = portalSources?.find((p: any) => p.id === pId);
    return found?.name || pId;
  });

  const hasFilters = Object.keys(filters).length > 0;
  const hasPortals = selectedPortals.length > 0;

  if (!hasFilters && !hasPortals) return null;

  return (
    <Card className="glass-card">
      <CardHeader><CardTitle className="text-lg">Parâmetros da Pesquisa</CardTitle></CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {hasFilters && (
            <div>
              <p className="text-sm font-medium mb-2 text-muted-foreground">Filtros Aplicados</p>
              <div className="flex flex-wrap gap-2">
                {filters.radius && <Badge variant="outline">Raio: {filters.radius} km</Badge>}
                {filters.priceMin && <Badge variant="outline">Preço mín: {formatBRL(filters.priceMin)}</Badge>}
                {filters.priceMax && <Badge variant="outline">Preço máx: {formatBRL(filters.priceMax)}</Badge>}
                {filters.areaMin && <Badge variant="outline">Área mín: {filters.areaMin} m²</Badge>}
                {filters.areaMax && <Badge variant="outline">Área máx: {filters.areaMax} m²</Badge>}
                {filters.maxComparables && <Badge variant="outline">Máx comparáveis: {filters.maxComparables}</Badge>}
              </div>
            </div>
          )}
          {hasPortals && (
            <div>
              <p className="text-sm font-medium mb-2 text-muted-foreground">Portais Selecionados</p>
              <div className="flex flex-wrap gap-2">
                {portalNames.map((name: string, i: number) => (
                  <Badge key={i} variant="secondary">{name}</Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function AddComparableForm({ onSubmit, loading }: { onSubmit: (data: any) => void; loading: boolean }) {
  const [form, setForm] = useState({ title: "", address: "", neighborhood: "", price: "", area: "", bedrooms: "", parking_spots: "", source_name: "", source_url: "" });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const price = parseFloat(form.price) || null;
    const area = parseFloat(form.area) || null;
    onSubmit({
      title: form.title,
      address: form.address,
      neighborhood: form.neighborhood,
      price,
      area,
      price_per_sqm: price && area ? Math.round(price / area) : null,
      bedrooms: parseInt(form.bedrooms) || null,
      parking_spots: parseInt(form.parking_spots) || null,
      source_name: form.source_name || null,
      source_url: form.source_url || null,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div><Label>Título</Label><Input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} required /></div>
        <div><Label>Bairro</Label><Input value={form.neighborhood} onChange={e => setForm(p => ({ ...p, neighborhood: e.target.value }))} /></div>
        <div><Label>Preço (R$)</Label><Input type="number" value={form.price} onChange={e => setForm(p => ({ ...p, price: e.target.value }))} required /></div>
        <div><Label>Área (m²)</Label><Input type="number" value={form.area} onChange={e => setForm(p => ({ ...p, area: e.target.value }))} /></div>
        <div><Label>Quartos</Label><Input type="number" value={form.bedrooms} onChange={e => setForm(p => ({ ...p, bedrooms: e.target.value }))} /></div>
        <div><Label>Vagas</Label><Input type="number" value={form.parking_spots} onChange={e => setForm(p => ({ ...p, parking_spots: e.target.value }))} /></div>
        <div><Label>Fonte</Label><Input value={form.source_name} onChange={e => setForm(p => ({ ...p, source_name: e.target.value }))} /></div>
        <div><Label>URL</Label><Input value={form.source_url} onChange={e => setForm(p => ({ ...p, source_url: e.target.value }))} /></div>
      </div>
      <Button type="submit" disabled={loading} className="w-full">{loading ? "Salvando..." : "Adicionar"}</Button>
    </form>
  );
}
