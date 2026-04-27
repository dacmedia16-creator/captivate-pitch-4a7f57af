import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { validateListingUrl } from "@/lib/validateListingUrl";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  initialUrl: string;
  onSave: (newUrl: string) => void | Promise<void>;
}

export function EditComparableUrlDialog({ open, onOpenChange, initialUrl, onSave }: Props) {
  const [value, setValue] = useState(initialUrl);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setValue(initialUrl);
  }, [open, initialUrl]);

  const handleSubmit = async () => {
    const result = validateListingUrl(value);
    if (result.valid === false) {
      toast.error(result.reason);
      return;
    }
    setSaving(true);
    try {
      await onSave(result.url);
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Editar link do comparável</DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          <Label>URL do anúncio</Label>
          <Input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="https://www.vivareal.com.br/imovel/..."
            onKeyDown={(e) => { if (e.key === "Enter") handleSubmit(); }}
            autoFocus
          />
          <p className="text-xs text-muted-foreground">
            Se mudar o portal, ele será redetectado automaticamente.
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving ? "Salvando..." : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
