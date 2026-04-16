import { Button } from "@/components/ui/button";
import { Copy, Save, Monitor, FileDown, Share2, BookTemplate, Sparkles, Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";

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
  onResyncMarket?: () => void;
  resyncingMarket?: boolean;
  hasMarketStudy?: boolean;
}

export function EditorToolbar({
  presentationId, shareToken, onSaveAsTemplate, onDuplicate, onPresent, onSave, saving,
  onGenerateAI, generatingAI, onExportPDF, exportingPDF,
  onResyncMarket, resyncingMarket, hasMarketStudy,
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
    <div className="h-12 border-b border-border/40 bg-card/80 backdrop-blur-sm flex items-center justify-between px-4">
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="sm" onClick={onDuplicate} className="text-xs h-8">
          <Copy className="h-3.5 w-3.5 mr-1.5" /> Duplicar
        </Button>
        <Button variant="ghost" size="sm" onClick={onSaveAsTemplate} className="text-xs h-8">
          <BookTemplate className="h-3.5 w-3.5 mr-1.5" /> Modelo
        </Button>
        <Separator orientation="vertical" className="h-5 mx-1" />
        <Button variant="ghost" size="sm" onClick={onGenerateAI} disabled={generatingAI} className="text-xs h-8 text-accent hover:text-accent">
          {generatingAI ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5 mr-1.5" />}
          {generatingAI ? "Gerando..." : "Gerar IA"}
        </Button>
        {hasMarketStudy && onResyncMarket && (
          <Button variant="ghost" size="sm" onClick={onResyncMarket} disabled={resyncingMarket} className="text-xs h-8">
            {resyncingMarket ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5 mr-1.5" />}
            {resyncingMarket ? "Atualizando..." : "Atualizar mercado"}
          </Button>
        )}
      </div>
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="sm" onClick={copyShareLink} className="text-xs h-8">
          <Share2 className="h-3.5 w-3.5 mr-1.5" /> Link
        </Button>
        <Button variant="ghost" size="sm" onClick={onExportPDF} disabled={exportingPDF} className="text-xs h-8">
          {exportingPDF ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <FileDown className="h-3.5 w-3.5 mr-1.5" />}
          PDF
        </Button>
        <Separator orientation="vertical" className="h-5 mx-1" />
        <Button variant="outline" size="sm" onClick={onPresent} className="text-xs h-8">
          <Monitor className="h-3.5 w-3.5 mr-1.5" /> Apresentar
        </Button>
        <Button size="sm" onClick={onSave} disabled={saving} className="text-xs h-8 gold-gradient text-primary-foreground shadow-sm">
          <Save className="h-3.5 w-3.5 mr-1.5" /> {saving ? "Salvando..." : "Salvar"}
        </Button>
      </div>
    </div>
  );
}
