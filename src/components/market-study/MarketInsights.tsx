import { TrendingUp, TrendingDown, Shield, AlertTriangle, CheckCircle2, Info } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface Insight {
  type: "positive" | "warning" | "neutral" | "negative";
  title: string;
  description: string;
}

interface MarketInsightsProps {
  insights: Insight[];
}

const iconMap = {
  positive: CheckCircle2,
  warning: AlertTriangle,
  neutral: Info,
  negative: TrendingDown,
};

const colorMap = {
  positive: "text-emerald-500 bg-emerald-500/10",
  warning: "text-amber-500 bg-amber-500/10",
  neutral: "text-blue-500 bg-blue-500/10",
  negative: "text-destructive bg-destructive/10",
};

export function MarketInsights({ insights }: MarketInsightsProps) {
  if (!insights || insights.length === 0) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {insights.map((insight, i) => {
        const Icon = iconMap[insight.type] || Info;
        const colors = colorMap[insight.type] || colorMap.neutral;
        return (
          <Card key={i} className="glass-card">
            <CardContent className="p-4 flex gap-3">
              <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${colors}`}>
                <Icon className="h-5 w-5" />
              </div>
              <div className="space-y-0.5">
                <p className="text-sm font-semibold">{insight.title}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{insight.description}</p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

// Generate automatic insights from data when AI hasn't been run yet
export function generateAutoInsights(
  result: any,
  ownerExpected: number | null | undefined,
  comparablesCount: number
): Insight[] {
  const insights: Insight[] = [];

  if (ownerExpected && result.suggested_ad_price) {
    const diff = ((ownerExpected - result.suggested_ad_price) / result.suggested_ad_price) * 100;
    if (diff > 15) {
      insights.push({
        type: "negative",
        title: "Acima do mercado",
        description: `O preço esperado está ${diff.toFixed(0)}% acima da sugestão de anúncio. Risco de baixa liquidez.`,
      });
    } else if (diff > 5) {
      insights.push({
        type: "warning",
        title: "Ligeiramente acima",
        description: `O preço esperado está ${diff.toFixed(0)}% acima da sugestão. Pode precisar de ajuste.`,
      });
    } else if (diff > -5) {
      insights.push({
        type: "positive",
        title: "Preço competitivo",
        description: "O preço esperado está alinhado com o mercado. Boa chance de venda.",
      });
    } else {
      insights.push({
        type: "positive",
        title: "Preço agressivo",
        description: "O preço esperado está abaixo do mercado. Alta probabilidade de venda rápida.",
      });
    }
  }

  if (comparablesCount >= 8) {
    insights.push({
      type: "positive",
      title: "Boa amostra",
      description: `${comparablesCount} comparáveis encontrados. Alta confiabilidade na análise.`,
    });
  } else if (comparablesCount >= 4) {
    insights.push({
      type: "neutral",
      title: "Amostra adequada",
      description: `${comparablesCount} comparáveis. Resultado confiável, mas mais dados reforçariam.`,
    });
  } else {
    insights.push({
      type: "warning",
      title: "Poucos comparáveis",
      description: `Apenas ${comparablesCount} comparáveis. Considere ampliar a busca.`,
    });
  }

  if (result.price_range_min && result.price_range_max) {
    const spread = ((result.price_range_max - result.price_range_min) / result.avg_price) * 100;
    if (spread < 20) {
      insights.push({
        type: "positive",
        title: "Mercado uniforme",
        description: "Pequena variação de preços indica mercado estável e previsível.",
      });
    } else if (spread > 40) {
      insights.push({
        type: "warning",
        title: "Alta dispersão",
        description: "Grande variação de preços na região. Avaliação requer cautela.",
      });
    }
  }

  return insights;
}
