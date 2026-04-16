import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Trophy, Plus, Trash2 } from "lucide-react";

interface PersonalResult {
  title: string;
  metric_value: string;
  description?: string;
}

interface PersonalResultsSectionProps {
  results: PersonalResult[];
  onChange: (results: PersonalResult[]) => void;
}

export function PersonalResultsSection({ results, onChange }: PersonalResultsSectionProps) {
  const addResult = () => {
    if (results.length >= 6) return;
    onChange([...results, { title: "", metric_value: "", description: "" }]);
  };

  const removeResult = (index: number) => {
    onChange(results.filter((_, i) => i !== index));
  };

  const updateResult = (index: number, field: keyof PersonalResult, value: string) => {
    onChange(results.map((r, i) => (i === index ? { ...r, [field]: value } : r)));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Trophy className="h-5 w-5 text-primary" /> Meus Resultados
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">Conquistas e métricas pessoais que serão exibidas no slide de resultados (ex: "120+ imóveis vendidos").</p>
        {results.map((r, i) => (
          <div key={i} className="flex items-start gap-3 p-3 border border-border rounded-lg">
            <div className="flex-1 grid grid-cols-2 gap-3">
              <Input
                value={r.title}
                onChange={(e) => updateResult(i, "title", e.target.value)}
                placeholder="Título (ex: Vendas realizadas)"
              />
              <Input
                value={r.metric_value}
                onChange={(e) => updateResult(i, "metric_value", e.target.value)}
                placeholder="Valor (ex: 120+)"
              />
            </div>
            <Button variant="ghost" size="icon" onClick={() => removeResult(i)} className="shrink-0 text-destructive">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
        {results.length < 6 && (
          <Button variant="outline" size="sm" onClick={addResult}>
            <Plus className="h-4 w-4 mr-1" /> Adicionar resultado
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
