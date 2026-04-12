import { ResolvedColors } from "../themes/theme.types";

interface Scenario {
  label: string;
  value: number | string | null;
}

interface SlideScenariosProps {
  scenarios: Scenario[];
  colors: ResolvedColors;
  metricSize?: string;
}

export function SlideScenarios({ scenarios, colors, metricSize = "42px" }: SlideScenariosProps) {
  if (!scenarios?.length) return null;

  const palette = [colors.accent, colors.primary, "#16a34a"];

  return (
    <div className="flex">
      {scenarios.map((s, i) => (
        <div key={i} className="flex-1 py-10 text-center relative">
          {i > 0 && (
            <div
              className="absolute left-0 top-6 bottom-6 w-px"
              style={{ backgroundColor: colors.accent + "22" }}
            />
          )}
          <p
            className="slide-label mb-4"
            style={{ color: colors.textLight }}
          >
            {s.label}
          </p>
          <p
            className="slide-metric"
            style={{ fontSize: metricSize, color: palette[i] }}
          >
            {s.value
              ? `R$ ${Number(s.value).toLocaleString("pt-BR")}`
              : "—"}
          </p>
        </div>
      ))}
    </div>
  );
}
