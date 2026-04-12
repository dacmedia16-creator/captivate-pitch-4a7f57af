import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer, ScatterChart, Scatter, ZAxis, Cell } from "recharts";

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

  const height = compact ? 200 : 320;

  return (
    <div style={{ width: "100%", height }}>
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 10, right: 10, left: compact ? 0 : 10, bottom: compact ? 5 : 40 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="name"
            tick={{ fontSize: compact ? 9 : 11, fill: "#6b7280" }}
            angle={compact ? 0 : -25}
            textAnchor={compact ? "middle" : "end"}
            interval={0}
          />
          <YAxis
            tickFormatter={formatCompact}
            tick={{ fontSize: compact ? 9 : 11, fill: "#6b7280" }}
            width={compact ? 40 : 55}
          />
          {!compact && (
            <Tooltip
              formatter={(value: number) => [formatBRL(value), "Preço"]}
              contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 12 }}
            />
          )}
          <Bar dataKey="price" fill={primaryColor} radius={[4, 4, 0, 0]} />
          {ownerExpectedPrice && (
            <ReferenceLine
              y={ownerExpectedPrice}
              stroke={accentColor}
              strokeWidth={2}
              strokeDasharray="6 3"
              label={compact ? undefined : { value: `Pretendido: ${formatCompact(ownerExpectedPrice)}`, position: "top", fill: accentColor, fontSize: 11 }}
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

  const height = compact ? 200 : 320;

  return (
    <div style={{ width: "100%", height }}>
      <ResponsiveContainer>
        <ScatterChart margin={{ top: 10, right: 10, left: compact ? 0 : 10, bottom: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="area"
            name="Área"
            unit=" m²"
            tick={{ fontSize: compact ? 9 : 11, fill: "#6b7280" }}
          />
          <YAxis
            dataKey="pricePerSqm"
            name="R$/m²"
            tickFormatter={formatCompact}
            tick={{ fontSize: compact ? 9 : 11, fill: "#6b7280" }}
            width={compact ? 40 : 55}
          />
          <ZAxis dataKey="price" range={[60, 200]} name="Preço" />
          {!compact && (
            <Tooltip
              formatter={(value: number, name: string) => {
                if (name === "Preço") return [formatBRL(value), name];
                if (name === "R$/m²") return [formatBRL(value), name];
                return [value, name];
              }}
              contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 12 }}
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

interface MarketStatsProps {
  avgPrice?: number | null;
  medianPrice?: number | null;
  avgPricePerSqm?: number | null;
  totalComparables?: number;
  compact?: boolean;
}

export function MarketStats({ avgPrice, medianPrice, avgPricePerSqm, totalComparables, compact }: MarketStatsProps) {
  const stats = [
    { label: "Preço Médio", value: avgPrice ? formatBRL(avgPrice) : "—" },
    { label: "Preço Mediano", value: medianPrice ? formatBRL(medianPrice) : "—" },
    { label: "R$/m² Médio", value: avgPricePerSqm ? formatBRL(avgPricePerSqm) : "—" },
    { label: "Comparáveis", value: totalComparables ?? "—" },
  ];

  return (
    <div className={`grid ${compact ? "grid-cols-4 gap-2" : "grid-cols-2 md:grid-cols-4 gap-3"}`}>
      {stats.map((s, i) => (
        <div key={i} className={`text-center ${compact ? "p-2" : "p-3"} rounded-lg border border-gray-200 bg-gray-50`}>
          <p className={`${compact ? "text-[9px]" : "text-xs"} text-gray-500 uppercase tracking-wider`}>{s.label}</p>
          <p className={`${compact ? "text-xs" : "text-sm"} font-bold text-gray-800 mt-0.5`}>{s.value}</p>
        </div>
      ))}
    </div>
  );
}
