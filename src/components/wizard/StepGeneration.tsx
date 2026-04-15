import { useEffect, useState, useRef } from "react";
import { Check, Loader2, Sparkles, Globe, FileSearch, Brain, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";

const stages = [
  { label: "Preparando dados do imóvel", duration: 1500 },
  { label: "Organizando branding da imobiliária", duration: 1200 },
  { label: "Gerando narrativa da apresentação", duration: 2000 },
  { label: "Montando apresentação final", duration: 1500 },
  { label: "Finalizando...", duration: 0 },
];

const marketPhases = [
  { key: "collecting_urls", label: "Coletando URLs dos portais", icon: Globe },
  { key: "scraping", label: "Abrindo páginas dos anúncios", icon: FileSearch },
  { key: "extracting", label: "Extraindo dados com IA", icon: Brain },
  { key: "scoring", label: "Analisando e salvando resultados", icon: BarChart3 },
];

interface StepGenerationProps {
  isGenerating: boolean;
  isComplete: boolean;
  generationDone: boolean;
  onAnimationDone: () => void;
  marketPhase?: string | null;
}

export function StepGeneration({ isGenerating, isComplete, generationDone, onAnimationDone, marketPhase }: StepGenerationProps) {
  const [currentStage, setCurrentStage] = useState(-1);
  const [progress, setProgress] = useState(0);
  const animationDone = useRef(false);
  const generationDoneRef = useRef(false);

  useEffect(() => {
    generationDoneRef.current = generationDone;
  }, [generationDone]);

  useEffect(() => {
    if (!isGenerating) return;
    let stageIndex = 0;
    setCurrentStage(0);

    const advance = () => {
      stageIndex++;
      if (stageIndex < 4) {
        setCurrentStage(stageIndex);
        setProgress(Math.round((stageIndex / 4) * 90));
        setTimeout(advance, stages[stageIndex].duration);
      } else {
        setProgress(90);
        animationDone.current = true;
        if (generationDoneRef.current) {
          setProgress(100);
          onAnimationDone();
        } else {
          setCurrentStage(4);
        }
      }
    };

    setTimeout(advance, stages[0].duration);
  }, [isGenerating]);

  useEffect(() => {
    if (generationDone && animationDone.current && !isComplete) {
      setCurrentStage(4);
      setProgress(100);
      onAnimationDone();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [generationDone]);

  const visibleStages = currentStage < 4 && !generationDone ? stages.slice(0, 4) : stages;

  const currentPhaseIndex = marketPhase
    ? marketPhases.findIndex(p => p.key === marketPhase)
    : -1;
  const isMarketCompleted = marketPhase === "completed";

  return (
    <div className="max-w-lg mx-auto py-12 space-y-8">
      <div className="text-center space-y-3">
        <div className="flex justify-center mb-4">
          <div className={cn(
            "h-16 w-16 rounded-2xl flex items-center justify-center",
            isComplete ? "gold-gradient shadow-lg" : "bg-primary/10"
          )}>
            <Sparkles className={cn("h-8 w-8", isComplete ? "text-primary-foreground" : "text-primary animate-pulse")} />
          </div>
        </div>
        <h2 className="text-2xl font-semibold font-serif">
          {isComplete ? "Apresentação criada!" : "Criando sua apresentação..."}
        </h2>
        <p className="text-sm text-muted-foreground">
          {isComplete ? "Tudo pronto. Você será redirecionado ao editor." : "Aguarde enquanto montamos tudo para você."}
        </p>
      </div>

      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500 ease-out animate-shimmer-gold"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="space-y-3">
        {visibleStages.map((stage, i) => (
          <div
            key={i}
            className={cn(
              "flex items-center gap-3 p-3.5 rounded-xl transition-all duration-300",
              i <= currentStage ? "bg-card shadow-sm" : "opacity-30"
            )}
          >
            {i < currentStage || isComplete ? (
              <div className="h-8 w-8 rounded-full gold-gradient flex items-center justify-center shadow-sm">
                <Check className="h-4 w-4 text-primary-foreground" />
              </div>
            ) : i === currentStage && !isComplete ? (
              <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center shadow-sm">
                <Loader2 className="h-4 w-4 text-primary-foreground animate-spin" />
              </div>
            ) : (
              <div className="h-8 w-8 rounded-full bg-muted" />
            )}
            <span className={cn("text-sm", i <= currentStage ? "font-medium" : "text-muted-foreground")}>{stage.label}</span>
          </div>
        ))}
      </div>

      {/* Market study progress stepper */}
      {marketPhase && (
        <div className="space-y-3 pt-4 border-t border-border">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Estudo de Mercado</h3>
          <div className="space-y-2">
            {marketPhases.map((phase, i) => {
              const Icon = phase.icon;
              const isDone = isMarketCompleted || i < currentPhaseIndex;
              const isCurrent = !isMarketCompleted && i === currentPhaseIndex;
              const isPending = !isDone && !isCurrent;

              return (
                <div
                  key={phase.key}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-xl transition-all duration-300",
                    isDone || isCurrent ? "bg-card shadow-sm" : "opacity-30"
                  )}
                >
                  {isDone ? (
                    <div className="h-8 w-8 rounded-full gold-gradient flex items-center justify-center shadow-sm">
                      <Check className="h-4 w-4 text-primary-foreground" />
                    </div>
                  ) : isCurrent ? (
                    <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center shadow-sm">
                      <Loader2 className="h-4 w-4 text-primary-foreground animate-spin" />
                    </div>
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                    </div>
                  )}
                  <span className={cn("text-sm", isDone || isCurrent ? "font-medium" : "text-muted-foreground")}>
                    {phase.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
