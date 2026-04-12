import { Button } from "@/components/ui/button";
import { Copy, Save, Monitor, FileDown, Share2, BookTemplate } from "lucide-react";
import { toast } from "sonner";

interface EditorToolbarProps {
  presentationId: string;
  shareToken: string | null;
  onSaveAsTemplate: () => void;
  onDuplicate: () => void;
  onPresent: () => void;
  onSave: () => void;
  saving: boolean;
}

export function EditorToolbar({ presentationId, shareToken, onSaveAsTemplate, onDuplicate, onPresent, onSave, saving }: EditorToolbarProps) {
  const copyShareLink = () => {
    if (shareToken) {
      navigator.clipboard.writeText(`${window.location.origin}/share/${shareToken}`);
      toast.success("Link copiado!");
    } else {
      toast.info("Gere um link compartilhável primeiro.");
    }
  };

  return (
    <div className="h-14 border-b border-border bg-card flex items-center justify-between px-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={onDuplicate}><Copy className="h-4 w-4 mr-1" /> Duplicar</Button>
        <Button variant="ghost" size="sm" onClick={onSaveAsTemplate}><BookTemplate className="h-4 w-4 mr-1" /> Salvar modelo</Button>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={copyShareLink}><Share2 className="h-4 w-4 mr-1" /> Compartilhar</Button>
        <Button variant="ghost" size="sm" disabled><FileDown className="h-4 w-4 mr-1" /> PDF</Button>
        <Button variant="outline" size="sm" onClick={onPresent}><Monitor className="h-4 w-4 mr-1" /> Apresentar</Button>
        <Button size="sm" onClick={onSave} disabled={saving}><Save className="h-4 w-4 mr-1" /> {saving ? "Salvando..." : "Salvar"}</Button>
      </div>
    </div>
  );
}
