import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface Step {
  label: string;
  description?: string;
}

interface WizardStepperProps {
  steps: Step[];
  currentStep: number;
}

export function WizardStepper({ steps, currentStep }: WizardStepperProps) {
  return (
    <div className="flex items-center justify-between w-full max-w-2xl mx-auto mb-10">
      {steps.map((step, index) => (
        <div key={index} className="flex items-center flex-1">
          <div className="flex flex-col items-center">
            <div
              className={cn(
                "w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300",
                index < currentStep
                  ? "gold-gradient text-primary-foreground shadow-md"
                  : index === currentStep
                  ? "bg-primary text-primary-foreground ring-4 ring-primary/20 shadow-lg animate-pulse-soft"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {index < currentStep ? <Check className="h-5 w-5" /> : index + 1}
            </div>
            <span
              className={cn(
                "text-xs mt-2 text-center max-w-[90px] leading-tight",
                index <= currentStep ? "text-foreground font-semibold" : "text-muted-foreground"
              )}
            >
              {step.label}
            </span>
            {step.description && (
              <span className="text-[10px] text-muted-foreground mt-0.5 text-center max-w-[90px]">
                {step.description}
              </span>
            )}
          </div>
          {index < steps.length - 1 && (
            <div className="flex-1 mx-3 mt-[-1.5rem]">
              <div className={cn(
                "h-0.5 rounded-full transition-all duration-500",
                index < currentStep ? "bg-accent" : "bg-border"
              )} />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
