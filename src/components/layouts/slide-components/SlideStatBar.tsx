import { ResolvedColors } from "../themes/theme.types";

interface StatItem {
  label: string;
  value: string | number | null | undefined;
}

interface SlideStatBarProps {
  items: StatItem[];
  colors: ResolvedColors;
  variant?: "light" | "dark" | "accent-block";
  borderRadius?: string;
}

export function SlideStatBar({
  items,
  colors,
  variant = "dark",
  borderRadius = "8px",
}: SlideStatBarProps) {
  const filtered = items.filter(
    (s) => s.value != null && s.value !== "" && s.value !== "0" && s.value !== 0
  );
  if (filtered.length === 0) return null;

  const bg =
    variant === "dark"
      ? colors.primary
      : variant === "accent-block"
      ? colors.accent
      : "rgba(255,255,255,0.08)";

  const metricColor =
    variant === "dark" || variant === "accent-block"
      ? "#ffffff"
      : colors.accent;

  const labelColor =
    variant === "dark" || variant === "accent-block"
      ? "rgba(255,255,255,0.45)"
      : "rgba(255,255,255,0.35)";

  return (
    <div
      className="flex gap-8 p-6"
      style={{ backgroundColor: bg, borderRadius }}
    >
      {filtered.map((s, i) => (
        <div key={i} className="text-center flex-1">
          <p className="slide-metric" style={{ fontSize: "32px", color: metricColor }}>
            {typeof s.value === "number"
              ? s.value.toLocaleString("pt-BR")
              : s.value}
          </p>
          <p
            className="mt-1"
            style={{
              fontSize: "10px",
              fontWeight: 600,
              letterSpacing: "0.20em",
              textTransform: "uppercase",
              color: labelColor,
            }}
          >
            {s.label}
          </p>
        </div>
      ))}
    </div>
  );
}
