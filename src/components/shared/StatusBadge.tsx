import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const statusConfig: Record<string, { label: string; className: string }> = {
  active: { label: "Ativo", className: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  blocked: { label: "Bloqueado", className: "bg-red-100 text-red-700 border-red-200" },
  inactive: { label: "Inativo", className: "bg-gray-100 text-gray-600 border-gray-200" },
  pending: { label: "Pendente", className: "bg-amber-100 text-amber-700 border-amber-200" },
  draft: { label: "Rascunho", className: "bg-blue-100 text-blue-700 border-blue-200" },
  published: { label: "Publicado", className: "bg-emerald-100 text-emerald-700 border-emerald-200" },
};

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status] || { label: status, className: "bg-muted text-muted-foreground" };
  return (
    <Badge variant="outline" className={cn("font-medium text-xs", config.className, className)}>
      {config.label}
    </Badge>
  );
}
