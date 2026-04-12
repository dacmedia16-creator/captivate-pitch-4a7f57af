import { RefreshCw, X } from "lucide-react";
import { useVersionCheck } from "@/hooks/useVersionCheck";
import { Button } from "@/components/ui/button";

export function VersionUpdateBanner() {
  const { updateAvailable, doUpdate, dismiss } = useVersionCheck();

  if (!updateAvailable) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[9999] animate-fade-in">
      <div className="mx-auto max-w-2xl p-4">
        <div className="flex items-center gap-4 rounded-xl bg-primary px-5 py-4 text-primary-foreground shadow-2xl backdrop-blur-md">
          <RefreshCw className="h-5 w-5 shrink-0 animate-spin" style={{ animationDuration: "3s" }} />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm">Nova versão disponível</p>
            <p className="text-xs opacity-80 mt-0.5">
              Uma atualização do sistema foi publicada. Clique para carregar a versão mais recente.
            </p>
          </div>
          <Button
            size="sm"
            onClick={doUpdate}
            className="shrink-0 bg-accent hover:bg-accent/90 text-accent-foreground font-semibold"
          >
            Atualizar sistema
          </Button>
          <button
            onClick={dismiss}
            className="shrink-0 rounded-md p-1 opacity-70 hover:opacity-100 transition-opacity"
            aria-label="Fechar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
