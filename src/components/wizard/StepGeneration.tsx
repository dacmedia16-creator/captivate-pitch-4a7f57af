import { useEffect, useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";

const stages = [
  { label: "Preparando dados do imóvel", duration: 1500 },
  { label: "Organizando branding da imobiliária", duration: 1200 },
  { label: "Gerando narrativa da apresentação", duration: 2000 },
  { label: "Montando apresentação final", duration: 1500 },
];

interface StepGenerationProps {
  isGenerating: boolean;
  isComplete: boolean;
  onAnimationDone: () => void;
}

export function StepGeneration({ isGenerating, isComplete, onAnimationDone }: StepGenerationProps) {
  const [currentStage, setCurrentStage] = useState(-1);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!isGenerating) return;
    let stageIndex = 0;
    setCurrentStage(0);

    const advance = () => {
      stageIndex++;
      if (stageIndex < stages.length) {
        setCurrentStage(stageIndex);
        setProgress(Math.round((stageIndex / stages.length) * 100));
        setTimeout(advance, stages[stageIndex].duration);
      } else {
        setProgress(100);
        onAnimationDone();
      }
    };

    setTimeout(advance, stages[0].duration);
  }, [isGenerating]);

  return (
    <div className="max-w-lg mx-auto py-12 space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-semibold font-serif">
          {isComplete ? "Apresentação criada!" : "Criando sua apresentação..."}
        </h2>
        <p className="text-muted-foreground">
          {isComplete ? "Tudo pronto. Você será redirecionado ao editor." : "Aguarde enquanto montamos tudo para você."}
        </p>
      </div>

      <Progress value={progress} className="h-2" />

      <div className="space-y-4">
        {stages.map((stage, i) => (
          <div key={i} className={cn("flex items-center gap-3 p-3 rounded-lg transition-all", i <= currentStage ? "bg-card" : "opacity-40")}>
            {i < currentStage || isComplete ? (
              <div className="h-8 w-8 rounded-full gold-gradient flex items-center justify-center">
                <Check className="h-4 w-4 text-primary-foreground" />
              </div>
            ) : i === currentStage && !isComplete ? (
              <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
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
