interface PropertyInput {
  property_type?: string;
  neighborhood?: string;
  city?: string;
  bedrooms?: string;
  suites?: string;
  parking_spots?: string;
  area_total?: string;
  owner_expected_price?: string;
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

const STREET_NAMES = [
  "Rua das Palmeiras", "Av. Brasil", "Rua São Paulo", "Rua XV de Novembro",
  "Av. Atlântica", "Rua dos Pinheiros", "Av. Paulista", "Rua Bela Vista",
  "Rua das Flores", "Av. Independência", "Rua Santo Antônio", "Rua da Paz",
];

export function generateSimulatedComparables(
  jobId: string,
  property: PropertyInput,
  portals: PortalInfo[],
): SimulatedComparable[] {
  const count = rand(6, 10);
  const basePrice = property.owner_expected_price ? Number(property.owner_expected_price) : 500000;
  const baseArea = property.area_total ? Number(property.area_total) : 80;
  const baseBedrooms = property.bedrooms ? Number(property.bedrooms) : 3;
  const baseSuites = property.suites ? Number(property.suites) : 1;
  const baseParking = property.parking_spots ? Number(property.parking_spots) : 1;
  const neighborhood = property.neighborhood || "Centro";
  const propType = property.property_type || "Apartamento";

  const comparables: SimulatedComparable[] = [];

  for (let i = 0; i < count; i++) {
    const price = Math.round(basePrice * randFloat(0.8, 1.2));
    const area = Math.round(baseArea * randFloat(0.7, 1.3));
    const pricePerSqm = Math.round(price / area);
    const bedrooms = Math.max(1, baseBedrooms + rand(-1, 1));
    const suites = Math.max(0, Math.min(bedrooms, baseSuites + rand(-1, 1)));
    const parking = Math.max(0, baseParking + rand(-1, 1));
    const similarity = Math.round(randFloat(60, 95));
    const portal = portals[i % portals.length];
    const street = STREET_NAMES[i % STREET_NAMES.length];

    comparables.push({
      market_analysis_job_id: jobId,
      title: `${propType} ${bedrooms} quartos - ${neighborhood}`,
      address: `${street}, ${rand(10, 2000)}`,
      neighborhood,
      price,
      area,
      price_per_sqm: pricePerSqm,
      bedrooms,
      suites,
      parking_spots: parking,
      similarity_score: similarity,
      source_name: portal.name,
      source_url: `https://${portal.name.toLowerCase().replace(/\s/g, '')}.com.br/imovel/${rand(100000, 999999)}`,
      is_approved: true,
    });
  }

  return comparables;
}
