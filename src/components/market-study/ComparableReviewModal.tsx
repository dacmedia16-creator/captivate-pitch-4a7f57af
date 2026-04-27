import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ExternalLink } from "lucide-react";

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

export function ComparableReviewModal({ open, onOpenChange, initial, onSave }: Props) {
  const [data, setData] = useState<ComparableFormData>(initial);

  useEffect(() => {
    if (open) setData(initial);
  }, [open, initial]);

  const set = <K extends keyof ComparableFormData>(k: K, v: ComparableFormData[K]) =>
    setData((d) => ({ ...d, [k]: v }));

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

          <div className="space-y-2">
            <Label>Título do anúncio</Label>
            <Input value={data.title ?? ""} onChange={(e) => set("title", e.target.value)} placeholder="Ex: Apartamento 3 quartos no Jardins" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select value={data.property_type ?? ""} onValueChange={(v) => set("property_type", v)}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
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
              <Label>Bairro</Label>
              <Input value={data.neighborhood ?? ""} onChange={(e) => set("neighborhood", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Cidade</Label>
              <Input value={data.city ?? ""} onChange={(e) => set("city", e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div className="space-y-2">
              <Label>Metragem (m²)</Label>
              <Input {...numField("area")} />
            </div>
            <div className="space-y-2">
              <Label>Quartos</Label>
              <Input {...numField("bedrooms")} min={0} />
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
