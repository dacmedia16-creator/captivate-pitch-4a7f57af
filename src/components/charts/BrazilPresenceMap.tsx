interface Props {
  states?: string[];
  primaryColor?: string;
  accentColor?: string;
}

const STATE_PATHS: Record<string, string> = {
  AC: "M48,280 L58,278 L62,285 L55,292 L45,290 Z",
  AM: "M55,220 L120,210 L140,230 L130,260 L100,270 L60,265 L50,245 Z",
  AP: "M185,175 L200,168 L210,178 L205,192 L190,195 Z",
  BA: "M280,280 L310,270 L325,290 L320,330 L300,340 L275,320 L270,295 Z",
  CE: "M310,225 L325,218 L335,230 L328,245 L315,242 Z",
  DF: "M240,305 L250,300 L255,308 L248,312 Z",
  ES: "M305,330 L318,325 L322,340 L312,348 Z",
  GO: "M220,290 L255,285 L265,310 L250,330 L225,325 L215,305 Z",
  MA: "M240,210 L275,200 L285,220 L270,240 L245,235 Z",
  MG: "M250,310 L290,300 L310,320 L300,350 L265,355 L245,340 Z",
  MS: "M175,330 L210,320 L220,345 L205,370 L180,365 Z",
  MT: "M140,265 L200,255 L215,285 L200,315 L160,320 L135,300 Z",
  PA: "M120,195 L185,185 L200,210 L190,240 L150,250 L115,240 Z",
  PB: "M320,240 L338,235 L342,242 L330,248 Z",
  PE: "M300,250 L335,243 L340,255 L315,262 Z",
  PI: "M270,230 L295,220 L305,245 L290,265 L275,260 Z",
  PR: "M195,370 L230,360 L240,378 L225,392 L200,388 Z",
  RJ: "M285,350 L310,345 L315,358 L298,365 Z",
  RN: "M318,228 L335,222 L340,232 L325,236 Z",
  RO: "M95,275 L130,268 L138,290 L120,305 L100,300 Z",
  RR: "M90,185 L115,178 L120,195 L105,205 L88,200 Z",
  RS: "M195,400 L225,395 L230,420 L210,435 L190,425 Z",
  SC: "M210,392 L235,385 L240,400 L222,405 Z",
  SE: "M310,268 L322,264 L325,275 L315,278 Z",
  SP: "M225,348 L265,340 L275,360 L255,375 L230,370 Z",
  TO: "M220,245 L250,238 L258,270 L245,288 L225,282 Z",
};

export function BrazilPresenceMap({ states = [], primaryColor = "#003DA5", accentColor = "#DC1431" }: Props) {
  const activeSet = new Set(states.map(s => s.toUpperCase()));

  return (
    <svg viewBox="30 160 330 290" className="w-full h-full max-h-[280px]" style={{ shapeRendering: "geometricPrecision" }}>
      {Object.entries(STATE_PATHS).map(([code, d]) => {
        const isActive = activeSet.has(code);
        return (
          <g key={code}>
            <path
              d={d}
              fill={isActive ? accentColor : "#E5E7EB"}
              stroke="white"
              strokeWidth="1.5"
              opacity={isActive ? 1 : 0.6}
            />
            {isActive && (
              <text
                x={getCenter(d).x}
                y={getCenter(d).y}
                textAnchor="middle"
                dominantBaseline="central"
                fill="white"
                fontSize="7"
                fontWeight="bold"
                fontFamily="sans-serif"
              >
                {code}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

function getCenter(d: string): { x: number; y: number } {
  const nums = d.match(/[\d.]+/g)?.map(Number) || [];
  let sumX = 0, sumY = 0, count = 0;
  for (let i = 0; i < nums.length - 1; i += 2) {
    sumX += nums[i]; sumY += nums[i + 1]; count++;
  }
  return { x: sumX / (count || 1), y: sumY / (count || 1) };
}
