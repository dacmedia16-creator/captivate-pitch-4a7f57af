import { BarChart, Bar, XAxis, YAxis, Tooltip, ReferenceLine, ResponsiveContainer, ScatterChart, Scatter, ZAxis, Cell, PieChart, Pie } from "recharts";

const formatBRL = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(value);

const formatCompact = (value: number) => {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}k`;
  return String(value);
};

export interface ComparableChartData {
  title: string;
  price: number;
  area: number;
  price_per_sqm: number;
}

interface MarketChartsProps {
  comparables: ComparableChartData[];
  ownerExpectedPrice?: number | null;
  compact?: boolean;
  primaryColor?: string;
  accentColor?: string;
}

export function MarketPriceBarChart({ comparables, ownerExpectedPrice, compact, primaryColor = "#1e3a5f", accentColor = "#c9a84c" }: MarketChartsProps) {
  const data = comparables.map((c, i) => ({
    name: compact ? `#${i + 1}` : (c.title?.length > 20 ? c.title.slice(0, 18) + "…" : c.title),
    price: c.price,
  }));

  const height = compact ? 180 : 300;

  return (
    <div style={{ width: "100%", height }}>
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 8, right: 8, left: compact ? 0 : 8, bottom: compact ? 4 : 36 }}>
          <XAxis
            dataKey="name"
            tick={{ fontSize: compact ? 9 : 10, fill: "#9ca3af", fontFamily: "Inter" }}
            angle={compact ? 0 : -25}
            textAnchor={compact ? "middle" : "end"}
            interval={0}
            axisLine={{ stroke: "#e5e7eb", strokeWidth: 0.5 }}
            tickLine={false}
          />
          <YAxis
            tickFormatter={formatCompact}
            tick={{ fontSize: compact ? 9 : 10, fill: "#9ca3af", fontFamily: "Inter" }}
            width={compact ? 38 : 50}
            axisLine={false}
            tickLine={false}
          />
          {!compact && (
            <Tooltip
              formatter={(value: number) => [formatBRL(value), "Preço"]}
              contentStyle={{ borderRadius: 4, border: "none", boxShadow: "0 4px 20px -4px rgba(0,0,0,0.12)", fontSize: 11, fontFamily: "Inter" }}
            />
          )}
          <Bar dataKey="price" fill={primaryColor} radius={[2, 2, 0, 0]} />
          {ownerExpectedPrice && (
            <ReferenceLine
              y={ownerExpectedPrice}
              stroke={accentColor}
              strokeWidth={1.5}
              strokeDasharray="6 4"
              label={compact ? undefined : { value: `Pretendido: ${formatCompact(ownerExpectedPrice)}`, position: "top", fill: accentColor, fontSize: 10, fontFamily: "Inter" }}
            />
          )}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function MarketScatterChart({ comparables, compact, primaryColor = "#1e3a5f", accentColor = "#c9a84c" }: MarketChartsProps) {
  const data = comparables.map(c => ({
    area: c.area,
    pricePerSqm: c.price_per_sqm,
    price: c.price,
    name: c.title,
  }));

  const height = compact ? 180 : 300;

  return (
    <div style={{ width: "100%", height }}>
      <ResponsiveContainer>
        <ScatterChart margin={{ top: 8, right: 8, left: compact ? 0 : 8, bottom: 8 }}>
          <XAxis
            dataKey="area"
            name="Área"
            unit=" m²"
            tick={{ fontSize: compact ? 9 : 10, fill: "#9ca3af", fontFamily: "Inter" }}
            axisLine={{ stroke: "#e5e7eb", strokeWidth: 0.5 }}
            tickLine={false}
          />
          <YAxis
            dataKey="pricePerSqm"
            name="R$/m²"
            tickFormatter={formatCompact}
            tick={{ fontSize: compact ? 9 : 10, fill: "#9ca3af", fontFamily: "Inter" }}
            width={compact ? 38 : 50}
            axisLine={false}
            tickLine={false}
          />
          <ZAxis dataKey="price" range={[50, 180]} name="Preço" />
          {!compact && (
            <Tooltip
              formatter={(value: number, name: string) => {
                if (name === "Preço") return [formatBRL(value), name];
                if (name === "R$/m²") return [formatBRL(value), name];
                return [value, name];
              }}
              contentStyle={{ borderRadius: 4, border: "none", boxShadow: "0 4px 20px -4px rgba(0,0,0,0.12)", fontSize: 11, fontFamily: "Inter" }}
            />
          )}
          <Scatter data={data} fill={primaryColor}>
            {data.map((_, i) => (
              <Cell key={i} fill={i % 2 === 0 ? primaryColor : accentColor} />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ═══════ PIE CHART — Distribuição por faixa de preço ═══════ */

interface MarketPieChartProps {
  comparables: ComparableChartData[];
  compact?: boolean;
  primaryColor?: string;
  accentColor?: string;
}

export function MarketPricePieChart({ comparables, compact, primaryColor = "#1e3a5f", accentColor = "#c9a84c" }: MarketPieChartProps) {
  if (!comparables.length) return null;

  const avg = comparables.reduce((s, c) => s + c.price, 0) / comparables.length;
  const belowCount = comparables.filter(c => c.price < avg * 0.9).length;
  const onCount = comparables.filter(c => c.price >= avg * 0.9 && c.price <= avg * 1.1).length;
  const aboveCount = comparables.filter(c => c.price > avg * 1.1).length;

  const data = [
    { name: "Abaixo da média", value: belowCount, color: "#22c55e" },
    { name: "Na média", value: onCount, color: primaryColor },
    { name: "Acima da média", value: aboveCount, color: accentColor },
  ].filter(d => d.value > 0);

  const height = compact ? 180 : 260;

  const renderLabel = ({ name, percent }: any) => `${name} (${(percent * 100).toFixed(0)}%)`;

  return (
    <div style={{ width: "100%", height }}>
      <ResponsiveContainer>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            outerRadius={compact ? 60 : 90}
            innerRadius={compact ? 30 : 45}
            dataKey="value"
            label={compact ? undefined : renderLabel}
            labelLine={!compact}
            stroke="none"
            style={{ fontSize: 12, fontFamily: "Inter" }}
          >
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.color} />
            ))}
          </Pie>
          {!compact && (
            <Tooltip
              formatter={(value: number, name: string) => [`${value} imóveis`, name]}
              contentStyle={{ borderRadius: 4, border: "none", boxShadow: "0 4px 20px -4px rgba(0,0,0,0.12)", fontSize: 11, fontFamily: "Inter" }}
            />
          )}
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ═══════ STATS CARDS ═══════ */

interface MarketStatsProps {
  avgPrice?: number | null;
  medianPrice?: number | null;
  avgPricePerSqm?: number | null;
  totalComparables?: number;
  compact?: boolean;
  primaryColor?: string;
  accentColor?: string;
}

export function MarketStats({ avgPrice, medianPrice, avgPricePerSqm, totalComparables, compact, primaryColor = "#1e3a5f", accentColor = "#9ca3af" }: MarketStatsProps) {
  const stats = [
    { label: "Preço Médio", value: avgPrice ? formatBRL(avgPrice) : "—" },
    { label: "Mediano", value: medianPrice ? formatBRL(medianPrice) : "—" },
    { label: "R$/m²", value: avgPricePerSqm ? formatBRL(avgPricePerSqm) : "—" },
    { label: "Comparáveis", value: totalComparables ?? "—" },
  ];

  return (
    <div className={`grid grid-cols-2 ${compact ? "gap-3" : "gap-4"}`}>
      {stats.map((s, i) => (
        <div key={i} className="rounded-lg p-4" style={{ border: `1px solid ${primaryColor}15`, backgroundColor: `${primaryColor}06` }}>
          <p className="slide-label" style={{ color: accentColor, fontSize: compact ? "11px" : "13px" }}>{s.label}</p>
          <p className={`slide-metric mt-1 font-bold`} style={{ color: primaryColor, fontSize: compact ? "18px" : "24px" }}>{s.value}</p>
        </div>
      ))}
    </div>
  );
}
