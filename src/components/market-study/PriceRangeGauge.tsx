interface PriceRangeGaugeProps {
  min: number;
  max: number;
  fastSale: number;
  market: number;
  adPrice: number;
  ownerExpected?: number | null;
}

const fmt = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

export function PriceRangeGauge({ min, max, fastSale, market, adPrice, ownerExpected }: PriceRangeGaugeProps) {
  const range = max - min || 1;
  const pct = (v: number) => Math.max(0, Math.min(100, ((v - min) / range) * 100));

  const markers = [
    { label: "Venda Rápida", value: fastSale, color: "bg-orange-500", textColor: "text-orange-600" },
    { label: "Mercado", value: market, color: "bg-primary", textColor: "text-primary" },
    { label: "Anúncio", value: adPrice, color: "bg-emerald-500", textColor: "text-emerald-600" },
  ];

  return (
    <div className="space-y-6">
      <div className="relative h-4 rounded-full bg-muted overflow-hidden">
        {/* Gradient fill */}
        <div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{
            width: `${pct(adPrice)}%`,
            background: "linear-gradient(90deg, hsl(var(--destructive) / 0.3), hsl(var(--primary) / 0.4), hsl(142 76% 36% / 0.4))",
          }}
        />
        {/* Markers */}
        {markers.map((m) => (
          <div
            key={m.label}
            className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full ${m.color} border-2 border-background shadow-md`}
            style={{ left: `${pct(m.value)}%`, transform: "translate(-50%, -50%)" }}
          />
        ))}
        {/* Owner expected */}
        {ownerExpected != null && ownerExpected > 0 && (
          <div
            className="absolute top-1/2 -translate-y-1/2 w-0 h-0 border-l-[6px] border-r-[6px] border-b-[10px] border-l-transparent border-r-transparent border-b-destructive"
            style={{ left: `${pct(ownerExpected)}%`, transform: "translate(-50%, -120%)" }}
          />
        )}
      </div>

      {/* Labels */}
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{fmt(min)}</span>
        <span>{fmt(max)}</span>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 justify-center">
        {markers.map((m) => (
          <div key={m.label} className="flex items-center gap-2 text-sm">
            <div className={`w-3 h-3 rounded-full ${m.color}`} />
            <span className="text-muted-foreground">{m.label}:</span>
            <span className={`font-semibold ${m.textColor}`}>{fmt(m.value)}</span>
          </div>
        ))}
        {ownerExpected != null && ownerExpected > 0 && (
          <div className="flex items-center gap-2 text-sm">
            <div className="w-0 h-0 border-l-[5px] border-r-[5px] border-b-[8px] border-l-transparent border-r-transparent border-b-destructive" />
            <span className="text-muted-foreground">Esperado:</span>
            <span className="font-semibold text-destructive">{fmt(ownerExpected)}</span>
          </div>
        )}
      </div>
    </div>
  );
}
