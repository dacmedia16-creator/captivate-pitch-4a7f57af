import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Sparkles, Loader2, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export interface ComparableFormData {
  id?: string;
  source_url: string;
  source_name?: string | null;
  title?: string | null;
  property_type?: string | null;
  purpose?: string | null;
  neighborhood?: string | null;
  city?: string | null;
  area?: number | null;
  bedrooms?: number | null;
  suites?: number | null;
  bathrooms?: number | null;
  parking_spots?: number | null;
  price?: number | null;
  condominium_fee?: number | null;
  iptu?: number | null;
  conservation_state?: string | null;
  notes?: string | null;
}

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  initial: ComparableFormData;
  onSave: (data: ComparableFormData) => void | Promise<void>;
}

const SUGGESTABLE_FIELDS = ["title", "property_type", "neighborhood", "city", "bedrooms"] as const;
type SuggestableField = (typeof SUGGESTABLE_FIELDS)[number];

export function ComparableReviewModal({ open, onOpenChange, initial, onSave }: Props) {
  const [data, setData] = useState<ComparableFormData>(initial);
  const [suggesting, setSuggesting] = useState(false);
  const [suggestedFields, setSuggestedFields] = useState<Set<SuggestableField>>(new Set());
  const [hasSuggested, setHasSuggested] = useState(false);

  useEffect(() => {
    if (open) {
      setData(initial);
      setSuggestedFields(new Set());
      setHasSuggested(false);
    }
  }, [open, initial]);

  const set = <K extends keyof ComparableFormData>(k: K, v: ComparableFormData[K]) => {
    setData((d) => ({ ...d, [k]: v }));
    // editar manualmente um campo remove a marca de "sugerido"
    if (SUGGESTABLE_FIELDS.includes(k as SuggestableField)) {
      setSuggestedFields((prev) => {
        if (!prev.has(k as SuggestableField)) return prev;
        const next = new Set(prev);
        next.delete(k as SuggestableField);
        return next;
      });
    }
  };

  const handleSuggest = async () => {
    if (!data.source_url) {
      toast.error("Sem URL para analisar");
      return;
    }
    setSuggesting(true);
    try {
      const { data: resp, error } = await supabase.functions.invoke(
        "suggest-comparable-from-url",
        { body: { url: data.source_url } },
      );
      if (error) throw error;
      if (resp?.error) throw new Error(resp.error);

      const suggestions = (resp?.suggestions ?? {}) as Partial<ComparableFormData>;
      const fields = (resp?.suggested_fields ?? []) as SuggestableField[];

      if (fields.length === 0) {
        toast.info("A IA não encontrou pistas claras na URL");
        setHasSuggested(true);
        return;
      }

      setData((d) => {
        const next = { ...d };
        for (const f of fields) {
          // só preenche se o campo estiver vazio (não sobrescreve o que você já digitou)
          const current = (d as any)[f];
          if (current === null || current === undefined || current === "") {
            (next as any)[f] = (suggestions as any)[f];
          }
        }
        return next;
      });
      // só marca como sugerido o que de fato foi aplicado (campo estava vazio)
      setSuggestedFields((prev) => {
        const next = new Set(prev);
        for (const f of fields) {
          const current = (data as any)[f];
          if (current === null || current === undefined || current === "") {
            next.add(f);
          }
        }
        return next;
      });
      setHasSuggested(true);
      toast.success(`${fields.length} sugest${fields.length > 1 ? "ões aplicadas" : "ão aplicada"}`);
    } catch (err: any) {
      toast.error("Erro ao sugerir: " + (err.message || "erro"));
    } finally {
      setSuggesting(false);
    }
  };

  const clearSuggestions = () => {
    setData((d) => {
      const next = { ...d };
      for (const f of suggestedFields) {
        (next as any)[f] = null;
      }
      return next;
    });
    setSuggestedFields(new Set());
    toast.info("Sugestões removidas");
  };

  const isSuggested = (f: SuggestableField) => suggestedFields.has(f);
  const suggestedClass = (f: SuggestableField) =>
    isSuggested(f) ? "border-amber-500/60 bg-amber-500/5" : "";

  const SuggestedBadge = ({ field }: { field: SuggestableField }) =>
    isSuggested(field) ? (
      <Badge variant="outline" className="ml-2 border-amber-500 text-amber-600 text-[10px] py-0 px-1.5 h-4">
        <Sparkles className="h-2.5 w-2.5 mr-0.5" /> sugerido
      </Badge>
    ) : null;

  const numField = (k: keyof ComparableFormData) => ({
    type: "number" as const,
    value: (data[k] as any) ?? "",
    onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
      set(k, e.target.value ? Number(e.target.value) : (null as any)),
  });

  const pricePerSqm =
    data.price && data.area && Number(data.area) > 0
      ? Math.round(Number(data.price) / Number(data.area))
      : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Revisar dados do comparável</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/40">
            <Badge variant="secondary">{data.source_name || "Portal"}</Badge>
            <a
              href={data.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary hover:underline truncate flex-1 flex items-center gap-1"
            >
              {data.source_url} <ExternalLink className="h-3 w-3 shrink-0" />
            </a>
          </div>

          {/* AI suggest bar */}
          <div className="flex items-center justify-between gap-2 rounded-lg border border-dashed border-amber-500/40 bg-amber-500/5 px-3 py-2">
            <div className="flex items-center gap-2 text-sm">
              <Sparkles className="h-4 w-4 text-amber-600" />
              <span className="text-muted-foreground">
                A IA pode sugerir bairro, cidade, tipo, quartos e título a partir da URL. Preço/área ficam manuais.
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {suggestedFields.size > 0 && (
                <Button size="sm" variant="ghost" onClick={clearSuggestions} type="button">
                  <X className="h-3 w-3 mr-1" /> Limpar
                </Button>
              )}
              <Button size="sm" variant="outline" onClick={handleSuggest} disabled={suggesting} type="button">
                {suggesting ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Sparkles className="h-3 w-3 mr-1" />}
                {hasSuggested ? "Sugerir novamente" : "Sugerir com IA"}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center">
              Título do anúncio <SuggestedBadge field="title" />
            </Label>
            <Input
              className={cn(suggestedClass("title"))}
              value={data.title ?? ""}
              onChange={(e) => set("title", e.target.value)}
              placeholder="Ex: Apartamento 3 quartos no Jardins"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label className="flex items-center">Tipo <SuggestedBadge field="property_type" /></Label>
              <Select value={data.property_type ?? ""} onValueChange={(v) => set("property_type", v)}>
                <SelectTrigger className={cn(suggestedClass("property_type"))}>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="apartamento">Apartamento</SelectItem>
                  <SelectItem value="casa">Casa</SelectItem>
                  <SelectItem value="cobertura">Cobertura</SelectItem>
                  <SelectItem value="sobrado">Sobrado</SelectItem>
                  <SelectItem value="terreno">Terreno</SelectItem>
                  <SelectItem value="comercial">Comercial</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Finalidade</Label>
              <Select value={data.purpose ?? ""} onValueChange={(v) => set("purpose", v)}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="venda">Venda</SelectItem>
                  <SelectItem value="locacao">Locação</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Conservação</Label>
              <Select value={data.conservation_state ?? ""} onValueChange={(v) => set("conservation_state", v)}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ruim">Ruim</SelectItem>
                  <SelectItem value="regular">Regular</SelectItem>
                  <SelectItem value="bom">Bom</SelectItem>
                  <SelectItem value="excelente">Excelente</SelectItem>
                  <SelectItem value="reformado">Reformado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="flex items-center">Bairro <SuggestedBadge field="neighborhood" /></Label>
              <Input
                className={cn(suggestedClass("neighborhood"))}
                value={data.neighborhood ?? ""}
                onChange={(e) => set("neighborhood", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center">Cidade <SuggestedBadge field="city" /></Label>
              <Input
                className={cn(suggestedClass("city"))}
                value={data.city ?? ""}
                onChange={(e) => set("city", e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div className="space-y-2">
              <Label>Metragem (m²)</Label>
              <Input {...numField("area")} />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center">Quartos <SuggestedBadge field="bedrooms" /></Label>
              <Input className={cn(suggestedClass("bedrooms"))} {...numField("bedrooms")} min={0} />
            </div>
            <div className="space-y-2">
              <Label>Suítes</Label>
              <Input {...numField("suites")} min={0} />
            </div>
            <div className="space-y-2">
              <Label>Banheiros</Label>
              <Input {...numField("bathrooms")} min={0} />
            </div>
            <div className="space-y-2">
              <Label>Vagas</Label>
              <Input {...numField("parking_spots")} min={0} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label>Preço anunciado (R$)</Label>
              <Input {...numField("price")} />
            </div>
            <div className="space-y-2">
              <Label>Condomínio (R$)</Label>
              <Input {...numField("condominium_fee")} />
            </div>
            <div className="space-y-2">
              <Label>IPTU (R$)</Label>
              <Input {...numField("iptu")} />
            </div>
          </div>

          {pricePerSqm != null && (
            <div className="rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 text-sm">
              <span className="text-muted-foreground">Preço por m² calculado: </span>
              <span className="font-semibold">R$ {pricePerSqm.toLocaleString("pt-BR")}</span>
            </div>
          )}

          <div className="space-y-2">
            <Label>Observações</Label>
            <Textarea value={data.notes ?? ""} onChange={(e) => set("notes", e.target.value)} rows={2} placeholder="Notas adicionais..." />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={async () => { await onSave(data); onOpenChange(false); }}>Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
