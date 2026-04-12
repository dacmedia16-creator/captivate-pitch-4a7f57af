import { ResolvedColors } from "../themes/theme.types";

interface MetricItem {
  label: string;
  value: string | number | null | undefined;
}

interface SlideMetricRowProps {
  items: MetricItem[];
  colors: ResolvedColors;
  metricSize?: string;
  labelSize?: string;
  labelTracking?: string;
}

export function SlideMetricRow({
  items,
  colors,
  metricSize = "64px",
  labelSize = "16px",
  labelTracking = "0.20em",
}: SlideMetricRowProps) {
  const filtered = items.filter((i) => i.value != null && i.value !== "");

  if (filtered.length === 0) return null;

  return (
    <div className="flex gap-12 py-3">
      {filtered.map((item, i) => (
        <div key={i}>
          <p
            className="slide-metric"
            style={{ fontSize: metricSize, color: colors.primary }}
          >
            {item.value}
          </p>
          <p
            className="mt-2"
            style={{
              fontSize: labelSize,
              letterSpacing: labelTracking,
              textTransform: "uppercase",
              fontWeight: 600,
              color: colors.textLight,
            }}
          >
            {item.label}
          </p>
        </div>
      ))}
    </div>
  );
}
