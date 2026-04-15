import { Badge } from "@/components/ui/badge";
import { TenantUsage } from "@/hooks/useTenantUsage";
import { AlertTriangle } from "lucide-react";

interface UsageBadgeProps {
  usage: TenantUsage | undefined;
  type: "market_studies" | "presentations";
}

export function UsageBadge({ usage, type }: UsageBadgeProps) {
  if (!usage || usage.max_per_month === null) return null;

  const count = type === "market_studies" ? usage.market_studies_count : usage.presentations_count;
  const max = usage.max_per_month;
  const pct = max > 0 ? (count / max) * 100 : 0;
  const atLimit = count >= max;

  return (
    <Badge
      variant="outline"
      className={
        atLimit
          ? "bg-destructive/10 text-destructive border-destructive/30"
          : pct >= 80
          ? "bg-amber-100 text-amber-700 border-amber-200"
          : "bg-muted text-muted-foreground"
      }
    >
      {atLimit && <AlertTriangle className="h-3 w-3 mr-1" />}
      {count}/{max} {type === "market_studies" ? "estudos" : "apresentações"} este mês
    </Badge>
  );
}
