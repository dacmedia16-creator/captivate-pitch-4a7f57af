import { Button } from "@/components/ui/button";
import { Copy, Save, Monitor, FileDown, Share2, BookTemplate, Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface EditorToolbarProps {
  presentationId: string;
  shareToken: string | null;
  onSaveAsTemplate: () => void;
  onDuplicate: () => void;
  onPresent: () => void;
  onSave: () => void;
  saving: boolean;
  onGenerateAI: () => void;
  generatingAI: boolean;
  onExportPDF: () => void;
  exportingPDF: boolean;
}

export function EditorToolbar({
  presentationId, shareToken, onSaveAsTemplate, onDuplicate, onPresent, onSave, saving,
  onGenerateAI, generatingAI, onExportPDF, exportingPDF,
}: EditorToolbarProps) {
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
        <Button variant="ghost" size="sm" onClick={onGenerateAI} disabled={generatingAI}>
          {generatingAI ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Sparkles className="h-4 w-4 mr-1" />}
          {generatingAI ? "Gerando..." : "Gerar com IA"}
        </Button>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={copyShareLink}><Share2 className="h-4 w-4 mr-1" /> Compartilhar</Button>
        <Button variant="ghost" size="sm" onClick={onExportPDF} disabled={exportingPDF}>
          {exportingPDF ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <FileDown className="h-4 w-4 mr-1" />}
          {exportingPDF ? "Exportando..." : "PDF"}
        </Button>
        <Button variant="outline" size="sm" onClick={onPresent}><Monitor className="h-4 w-4 mr-1" /> Apresentar</Button>
        <Button size="sm" onClick={onSave} disabled={saving}><Save className="h-4 w-4 mr-1" /> {saving ? "Salvando..." : "Salvar"}</Button>
      </div>
    </div>
  );
}
