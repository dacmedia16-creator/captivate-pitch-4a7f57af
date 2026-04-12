import { BarChart, Bar, XAxis, YAxis, Tooltip, ReferenceLine, ResponsiveContainer, Cell } from "recharts";

interface PricePerSqmChartProps {
  comparables: Array<{
    title?: string | null;
    address?: string | null;
    price_per_sqm?: number | null;
    is_approved?: boolean;
  }>;
  avgPricePerSqm?: number | null;
}

const fmt = (v: number) =>
  `R$ ${v.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}`;

export function PricePerSqmChart({ comparables, avgPricePerSqm }: PricePerSqmChartProps) {
  const data = comparables
    .filter((c) => c.price_per_sqm != null && c.is_approved !== false)
    .map((c) => ({
      name: (c.title || c.address || "").slice(0, 20) || "Comp.",
      value: Number(c.price_per_sqm),
    }))
    .sort((a, b) => a.value - b.value);

  if (data.length === 0) return null;

  const avg = avgPricePerSqm || data.reduce((s, d) => s + d.value, 0) / data.length;

  return (
    <ResponsiveContainer width="100%" height={Math.max(200, data.length * 40 + 40)}>
      <BarChart data={data} layout="vertical" margin={{ left: 10, right: 40, top: 10, bottom: 10 }}>
        <XAxis type="number" tickFormatter={(v) => fmt(v)} tick={{ fontSize: 11 }} />
        <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 11 }} />
        <Tooltip formatter={(v: number) => fmt(v)} labelFormatter={(l) => l} />
        <ReferenceLine x={avg} stroke="hsl(var(--primary))" strokeDasharray="4 4" label={{ value: `Média: ${fmt(avg)}`, position: "top", fontSize: 11 }} />
        <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={24}>
          {data.map((entry, i) => (
            <Cell
              key={i}
              fill={entry.value > avg * 1.1 ? "hsl(var(--destructive) / 0.7)" : entry.value < avg * 0.9 ? "hsl(142 76% 36% / 0.7)" : "hsl(var(--primary) / 0.7)"}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
