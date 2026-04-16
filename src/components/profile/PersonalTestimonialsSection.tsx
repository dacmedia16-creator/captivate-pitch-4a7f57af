import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { MessageSquareQuote, Plus, Trash2 } from "lucide-react";

interface PersonalTestimonial {
  author_name: string;
  content: string;
}

interface PersonalTestimonialsSectionProps {
  testimonials: PersonalTestimonial[];
  onChange: (testimonials: PersonalTestimonial[]) => void;
}

export function PersonalTestimonialsSection({ testimonials, onChange }: PersonalTestimonialsSectionProps) {
  const addTestimonial = () => {
    if (testimonials.length >= 4) return;
    onChange([...testimonials, { author_name: "", content: "" }]);
  };

  const removeTestimonial = (index: number) => {
    onChange(testimonials.filter((_, i) => i !== index));
  };

  const updateTestimonial = (index: number, field: keyof PersonalTestimonial, value: string) => {
    onChange(testimonials.map((t, i) => (i === index ? { ...t, [field]: value } : t)));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <MessageSquareQuote className="h-5 w-5 text-primary" /> Depoimentos de Clientes
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">Depoimentos pessoais que aparecerão no slide de resultados.</p>
        {testimonials.map((t, i) => (
          <div key={i} className="flex items-start gap-3 p-3 border border-border rounded-lg">
            <div className="flex-1 space-y-2">
              <Input
                value={t.author_name}
                onChange={(e) => updateTestimonial(i, "author_name", e.target.value)}
                placeholder="Nome do cliente"
              />
              <Textarea
                value={t.content}
                onChange={(e) => updateTestimonial(i, "content", e.target.value)}
                placeholder="Depoimento..."
                rows={2}
              />
            </div>
            <Button variant="ghost" size="icon" onClick={() => removeTestimonial(i)} className="shrink-0 text-destructive">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
        {testimonials.length < 4 && (
          <Button variant="outline" size="sm" onClick={addTestimonial}>
            <Plus className="h-4 w-4 mr-1" /> Adicionar depoimento
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
