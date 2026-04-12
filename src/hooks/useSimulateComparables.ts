interface PropertyInput {
  property_type?: string;
  neighborhood?: string;
  city?: string;
  bedrooms?: string;
  suites?: string;
  parking_spots?: string;
  area_total?: string;
  owner_expected_price?: string;
  property_standard?: string;
  condominium?: string;
}

interface PortalInfo {
  id: string;
  name: string;
}

interface SimulatedComparable {
  market_analysis_job_id: string;
  title: string;
  address: string;
  neighborhood: string;
  price: number;
  area: number;
  price_per_sqm: number;
  bedrooms: number;
  suites: number;
  parking_spots: number;
  similarity_score: number;
  source_name: string;
  source_url: string;
  is_approved: boolean;
}

function rand(min: number, max: number) {
  return Math.round(min + Math.random() * (max - min));
}

function randFloat(min: number, max: number) {
  return min + Math.random() * (max - min);
}

// Price per sqm ranges by property standard
const PRICE_PER_SQM_RANGES: Record<string, [number, number]> = {
  economico: [3000, 5000],
  medio: [5000, 8000],
  alto: [8000, 12000],
  luxo: [12000, 20000],
};

// Street name prefixes that feel realistic
const STREET_PREFIXES = [
  "Rua", "Rua", "Rua", "Av.", "Travessa", "Alameda",
];

// Common Brazilian street name patterns (will be combined with neighborhood context)
const STREET_SUFFIXES_GENERIC = [
  "das Acácias", "dos Ipês", "das Palmeiras", "dos Jatobás", "das Orquídeas",
  "dos Cedros", "das Magnólias", "dos Coqueiros", "das Jabuticabeiras", "dos Flamboyants",
  "dos Manacás", "das Aroeiras", "dos Jacarandás", "das Primaveras", "dos Eucaliptos",
  "São José", "Santo Antônio", "São Pedro", "Santa Maria", "São Francisco",
  "Tiradentes", "XV de Novembro", "Sete de Setembro", "Treze de Maio", "Quinze de Novembro",
];

function generateStreetName(index: number): string {
  const prefix = STREET_PREFIXES[index % STREET_PREFIXES.length];
  const suffix = STREET_SUFFIXES_GENERIC[index % STREET_SUFFIXES_GENERIC.length];
  return `${prefix} ${suffix}`;
}

function getPricePerSqmRange(standard?: string): [number, number] {
  if (standard) {
    const key = standard.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    for (const [k, v] of Object.entries(PRICE_PER_SQM_RANGES)) {
      if (key.includes(k)) return v;
    }
  }
  return [5000, 8000]; // default to "médio"
}

function inferBedroomsFromArea(area: number): number {
  if (area <= 45) return 1;
  if (area <= 70) return 2;
  if (area <= 120) return 3;
  if (area <= 200) return 4;
  return 5;
}

function computeSimilarityScore(
  compArea: number, baseArea: number,
  compPriceSqm: number, basePriceSqm: number,
  compBedrooms: number, baseBedrooms: number,
): number {
  const areaDiff = Math.abs(compArea - baseArea) / baseArea;
  const priceDiff = Math.abs(compPriceSqm - basePriceSqm) / basePriceSqm;
  const bedroomDiff = Math.abs(compBedrooms - baseBedrooms);

  // Weight: area 40%, price 40%, bedrooms 20%
  const score = 100 - (areaDiff * 40 + priceDiff * 40 + bedroomDiff * 5);
  return Math.max(50, Math.min(98, Math.round(score)));
}

export function generateSimulatedComparables(
  jobId: string,
  property: PropertyInput,
  portals: PortalInfo[],
): SimulatedComparable[] {
  const count = rand(6, 10);
  const baseArea = property.area_total ? Number(property.area_total) : 80;
  const baseBedrooms = property.bedrooms ? Number(property.bedrooms) : inferBedroomsFromArea(baseArea);
  const baseSuites = property.suites ? Number(property.suites) : Math.max(0, baseBedrooms - 2);
  const baseParking = property.parking_spots ? Number(property.parking_spots) : Math.max(1, Math.floor(baseBedrooms / 2));
  const neighborhood = property.neighborhood || "Centro";
  const city = property.city || "";
  const propType = property.property_type || "Apartamento";
  const condominium = property.condominium || "";

  // Determine price/sqm range
  const [minPriceSqm, maxPriceSqm] = getPricePerSqmRange(property.property_standard);

  // If owner provided expected price, derive a base price/sqm from it
  let basePriceSqm: number;
  if (property.owner_expected_price && Number(property.owner_expected_price) > 0) {
    basePriceSqm = Math.round(Number(property.owner_expected_price) / baseArea);
    // Clamp to reasonable range but allow ±30% of the standard range
    const rangeMin = minPriceSqm * 0.7;
    const rangeMax = maxPriceSqm * 1.3;
    basePriceSqm = Math.max(rangeMin, Math.min(rangeMax, basePriceSqm));
  } else {
    basePriceSqm = Math.round((minPriceSqm + maxPriceSqm) / 2);
  }

  const comparables: SimulatedComparable[] = [];

  for (let i = 0; i < count; i++) {
    // Area varies ±30% from base
    const area = Math.round(baseArea * randFloat(0.7, 1.3));

    // Price/sqm varies ±15% from base, clamped to standard range
    const priceSqm = Math.round(basePriceSqm * randFloat(0.85, 1.15));
    const price = Math.round(area * priceSqm);

    // Bedrooms inferred from area with small variation
    const inferredBedrooms = inferBedroomsFromArea(area);
    const bedrooms = Math.max(1, inferredBedrooms + rand(-1, 1));
    const suites = Math.max(0, Math.min(bedrooms, baseSuites + rand(-1, 0)));
    const parking = Math.max(0, baseParking + rand(-1, 1));

    const similarity = computeSimilarityScore(area, baseArea, priceSqm, basePriceSqm, bedrooms, baseBedrooms);

    const portal = portals.length > 0 ? portals[i % portals.length] : { id: "sim", name: "Portal" };
    const street = generateStreetName(i);
    const number = rand(50, 2500);

    // Build a realistic address with neighborhood and city
    const addressParts = [`${street}, ${number}`];
    if (neighborhood) addressParts.push(neighborhood);
    if (city) addressParts.push(city);
    const address = addressParts.join(" - ");

    // Descriptive title
    const titleParts = [propType, `${bedrooms} quartos`];
    if (area) titleParts.push(`${area}m²`);
    titleParts.push(neighborhood);
    if (condominium && Math.random() > 0.5) {
      titleParts.push(`- ${condominium}`);
    }
    const title = titleParts.join(" ");

    comparables.push({
      market_analysis_job_id: jobId,
      title,
      address,
      neighborhood,
      price,
      area,
      price_per_sqm: priceSqm,
      bedrooms,
      suites,
      parking_spots: parking,
      similarity_score: similarity,
      source_name: portal.name,
      source_url: `https://${portal.name.toLowerCase().replace(/\s/g, '')}.com.br/imovel/${rand(100000, 999999)}`,
      is_approved: true,
    });
  }

  // Sort by similarity score descending
  comparables.sort((a, b) => b.similarity_score - a.similarity_score);

  return comparables;
}
