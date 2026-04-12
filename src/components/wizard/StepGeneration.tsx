import { useEffect, useState, useRef } from "react";
import { Check, Loader2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const stages = [
  { label: "Preparando dados do imóvel", duration: 1500 },
  { label: "Organizando branding da imobiliária", duration: 1200 },
  { label: "Gerando narrativa da apresentação", duration: 2000 },
  { label: "Montando apresentação final", duration: 1500 },
  { label: "Finalizando...", duration: 0 }, // waiting stage
];

interface StepGenerationProps {
  isGenerating: boolean;
  isComplete: boolean;
  generationDone: boolean;
  onAnimationDone: () => void;
}

export function StepGeneration({ isGenerating, isComplete, generationDone, onAnimationDone }: StepGenerationProps) {
  const [currentStage, setCurrentStage] = useState(-1);
  const [progress, setProgress] = useState(0);
  const animationDone = useRef(false);

  // Animate through first 4 stages on fixed timers
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
        // Animation done, show waiting stage if generation not done
        setProgress(90);
        animationDone.current = true;
        if (generationDone) {
          setProgress(100);
          onAnimationDone();
        } else {
          setCurrentStage(4); // "Finalizando..."
        }
      }
    };

    setTimeout(advance, stages[0].duration);
  }, [isGenerating]);

  // Watch generationDone — complete when both animation and generation are done
  useEffect(() => {
    if (generationDone && animationDone.current && !isComplete) {
      setCurrentStage(4);
      setProgress(100);
      onAnimationDone();
    }
  }, [generationDone, isComplete, onAnimationDone]);

  const visibleStages = currentStage < 4 && !generationDone ? stages.slice(0, 4) : stages;

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
    </div>
  );
}
