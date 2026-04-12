import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Briefcase, Crown, Zap, FileText, Award, Sparkles, Wand2, Settings, Layers } from "lucide-react";

export interface LayoutStyleData {
  layout: string;
  tone: string;
  mode: string;
}

interface StepLayoutStyleProps {
  data: LayoutStyleData;
  onChange: (data: LayoutStyleData) => void;
}

const layouts = [
  { value: "executivo", label: "Executivo", description: "Clean, corporativo, racional. Ideal para reuniões formais.", icon: Briefcase, color: "from-blue-600 to-blue-800" },
  { value: "premium", label: "Premium", description: "Elegante, visual forte, grandes imagens. Para alto padrão.", icon: Crown, color: "from-amber-500 to-yellow-600" },
  { value: "impacto", label: "Impacto Comercial", description: "Energia comercial, foco em diferenciais e prova social.", icon: Zap, color: "from-emerald-500 to-teal-600" },
];

const tones = [
  { value: "tecnico", label: "Técnico", icon: FileText },
  { value: "executivo", label: "Executivo", icon: Briefcase },
  { value: "premium", label: "Premium", icon: Award },
  { value: "comercial", label: "Comercial", icon: Sparkles },
];

const modes = [
  { value: "automatico", label: "Automático", description: "IA gera tudo automaticamente", icon: Wand2 },
  { value: "guiado", label: "Guiado", description: "IA sugere, você aprova", icon: Layers },
  { value: "avancado", label: "Avançado", description: "Controle total sobre cada seção", icon: Settings },
];

export function StepLayoutStyle({ data, onChange }: StepLayoutStyleProps) {
  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <Label className="text-lg font-semibold mb-4 block">Layout da apresentação</Label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {layouts.map(l => (
            <Card
              key={l.value}
              className={cn("cursor-pointer transition-all hover:scale-[1.02]", data.layout === l.value ? "ring-2 ring-primary shadow-lg" : "glass-card")}
              onClick={() => onChange({ ...data, layout: l.value })}
            >
              <CardContent className="p-6 text-center space-y-3">
                <div className={cn("w-16 h-16 mx-auto rounded-xl bg-gradient-to-br flex items-center justify-center", l.color)}>
                  <l.icon className="h-8 w-8 text-white" />
                </div>
                <h3 className="font-semibold">{l.label}</h3>
                <p className="text-sm text-muted-foreground">{l.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div>
        <Label className="text-lg font-semibold mb-4 block">Tom de comunicação</Label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {tones.map(t => (
            <Card
              key={t.value}
              className={cn("cursor-pointer transition-all hover:scale-[1.02]", data.tone === t.value ? "ring-2 ring-primary shadow-lg" : "glass-card")}
              onClick={() => onChange({ ...data, tone: t.value })}
            >
              <CardContent className="p-4 text-center space-y-2">
                <t.icon className="h-6 w-6 mx-auto text-accent" />
                <span className="text-sm font-medium">{t.label}</span>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div>
        <Label className="text-lg font-semibold mb-4 block">Modo de criação</Label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {modes.map(m => (
            <Card
              key={m.value}
              className={cn("cursor-pointer transition-all hover:scale-[1.02]", data.mode === m.value ? "ring-2 ring-primary shadow-lg" : "glass-card")}
              onClick={() => onChange({ ...data, mode: m.value })}
            >
              <CardContent className="p-5 flex items-start gap-3">
                <m.icon className="h-5 w-5 text-accent mt-0.5 shrink-0" />
                <div>
                  <h4 className="font-medium">{m.label}</h4>
                  <p className="text-xs text-muted-foreground">{m.description}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
