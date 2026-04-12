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
  { value: "tecnico", label: "Técnico", icon: FileText, accent: "border-blue-500" },
  { value: "executivo", label: "Executivo", icon: Briefcase, accent: "border-slate-600" },
  { value: "premium", label: "Premium", icon: Award, accent: "border-amber-500" },
  { value: "comercial", label: "Comercial", icon: Sparkles, accent: "border-emerald-500" },
];

const modes = [
  { value: "automatico", label: "Automático", description: "IA gera tudo automaticamente", icon: Wand2 },
  { value: "guiado", label: "Guiado", description: "IA sugere, você aprova", icon: Layers },
  { value: "avancado", label: "Avançado", description: "Controle total sobre cada seção", icon: Settings },
];

export function StepLayoutStyle({ data, onChange }: StepLayoutStyleProps) {
  return (
    <div className="space-y-10 max-w-4xl mx-auto">
      <div>
        <Label className="text-base font-semibold mb-1 block font-sans">Layout da apresentação</Label>
        <p className="text-xs text-muted-foreground mb-4">Escolha o estilo visual dos seus slides</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {layouts.map(l => (
            <Card
              key={l.value}
              className={cn(
                "cursor-pointer transition-all duration-300 hover:scale-[1.02]",
                data.layout === l.value
                  ? "ring-2 ring-accent shadow-lg shadow-accent/10"
                  : "glass-card hover:shadow-md"
              )}
              onClick={() => onChange({ ...data, layout: l.value })}
            >
              <CardContent className="p-6 text-center space-y-3">
                <div className={cn("w-16 h-16 mx-auto rounded-xl bg-gradient-to-br flex items-center justify-center shadow-md", l.color)}>
                  <l.icon className="h-8 w-8 text-white" />
                </div>
                <h3 className="font-semibold font-sans">{l.label}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{l.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div>
        <Label className="text-base font-semibold mb-1 block font-sans">Tom de comunicação</Label>
        <p className="text-xs text-muted-foreground mb-4">Define a linguagem usada nos textos</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {tones.map(t => (
            <Card
              key={t.value}
              className={cn(
                "cursor-pointer transition-all duration-300 hover:scale-[1.02]",
                data.tone === t.value
                  ? `ring-2 ring-accent shadow-md border-t-2 ${t.accent}`
                  : "glass-card"
              )}
              onClick={() => onChange({ ...data, tone: t.value })}
            >
              <CardContent className="p-4 text-center space-y-2">
                <t.icon className="h-5 w-5 mx-auto text-accent" />
                <span className="text-sm font-medium font-sans">{t.label}</span>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div>
        <Label className="text-base font-semibold mb-1 block font-sans">Modo de criação</Label>
        <p className="text-xs text-muted-foreground mb-4">Quanto controle você quer ter</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {modes.map(m => (
            <Card
              key={m.value}
              className={cn(
                "cursor-pointer transition-all duration-300 hover:scale-[1.02]",
                data.mode === m.value
                  ? "ring-2 ring-accent shadow-md"
                  : "glass-card"
              )}
              onClick={() => onChange({ ...data, mode: m.value })}
            >
              <CardContent className="p-5 flex items-start gap-3">
                <m.icon className="h-5 w-5 text-accent mt-0.5 shrink-0" />
                <div>
                  <h4 className="font-medium font-sans text-sm">{m.label}</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">{m.description}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
