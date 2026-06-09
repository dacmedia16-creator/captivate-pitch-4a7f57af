import { assertEquals, assert } from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  parseBRNumber,
  extractBedrooms,
  extractBathrooms,
  extractSuites,
  extractParking,
  extractArea,
  extractPrice,
  parseFormattedAddress,
  detectPropertyType,
  typeMatches,
  mapGeckoPdpToComparable,
} from "./index.ts";

/* ============= parseBRNumber ============= */
Deno.test("parseBRNumber: BR decimal", () => {
  assertEquals(parseBRNumber("1.250.000,00"), 1250000);
});
Deno.test("parseBRNumber: plain int", () => {
  assertEquals(parseBRNumber("850000"), 850000);
});
Deno.test("parseBRNumber: empty/garbage", () => {
  assertEquals(parseBRNumber(""), null);
  assertEquals(parseBRNumber("abc"), null);
});

/* ============= extractors ============= */
Deno.test("extractBedrooms", () => {
  assertEquals(extractBedrooms("3 quartos com varanda"), 3);
  assertEquals(extractBedrooms("2 dormitórios"), 2);
  assertEquals(extractBedrooms("4 dorm"), 4);
  assertEquals(extractBedrooms("sem info"), null);
});
Deno.test("extractBathrooms", () => {
  assertEquals(extractBathrooms("2 banheiros sociais"), 2);
  assertEquals(extractBathrooms("1 banheiro"), 1);
  assertEquals(extractBathrooms("sem"), null);
});
Deno.test("extractSuites", () => {
  assertEquals(extractSuites("1 suíte"), 1);
  assertEquals(extractSuites("2 suites"), 2);
});
Deno.test("extractParking", () => {
  assertEquals(extractParking("2 vagas de garagem"), 2);
  assertEquals(extractParking("1 garagem"), 1);
});
Deno.test("extractArea", () => {
  assertEquals(extractArea("138 m²"), 138);
  assertEquals(extractArea("69 m2"), 69);
  assertEquals(extractArea("apartamento de 5 m no centro"), null);
});
Deno.test("extractPrice", () => {
  assertEquals(extractPrice("Valor: R$ 850.000 negociáveis"), 850000);
  assertEquals(extractPrice("R$ 1.250.000,00"), 1250000);
  assertEquals(extractPrice("sem preço"), null);
});

/* ============= parseFormattedAddress ============= */
Deno.test("parseFormattedAddress: full", () => {
  const r = parseFormattedAddress("Rua Santi Pegoretti, 50 - Jardim Santa Rosalia, Sorocaba - SP");
  assertEquals(r.neighborhood, "Jardim Santa Rosalia");
  assertEquals(r.city, "Sorocaba");
  assertEquals(r.state, "SP");
});
Deno.test("parseFormattedAddress: null", () => {
  const r = parseFormattedAddress(null);
  assertEquals(r.city, null);
});

/* ============= detectPropertyType ============= */
Deno.test("detectPropertyType: apartamento", () => {
  assertEquals(detectPropertyType("Apartamentos para venda com Piscina e 3 quartos, 69 m²"), "Apartamento");
});
Deno.test("detectPropertyType: casa de condomínio", () => {
  assertEquals(detectPropertyType("Casas de Condomínio para venda com 3 quartos, 138 m²"), "Casa de Condomínio");
});
Deno.test("detectPropertyType: casa", () => {
  assertEquals(detectPropertyType("Casas para venda com 3 quartos"), "Casa");
});

/* ============= typeMatches ============= */
Deno.test("typeMatches: apartamento aceita cobertura", () => {
  assert(typeMatches("Apartamento", "Cobertura"));
});
Deno.test("typeMatches: apartamento rejeita casa", () => {
  assertEquals(typeMatches("Apartamento", "Casa"), false);
});
Deno.test("typeMatches: casa aceita casa de condomínio", () => {
  assert(typeMatches("Casa", "Casa de Condomínio"));
});

/* ============= mapGeckoPdpToComparable: amostras reais ============= */
const fixtureCasaCondominio = {
  data: {
    url: "https://www.zapimoveis.com.br/imovel/venda-casa-de-condominio-3-quartos-mobiliado-jardim-santa-rosalia-sorocaba-sp-138m2-id-2866585690/",
    title: "Casas de Condomínio para venda com 3 quartos, 138 m² - Jardim Santa Rosalia",
    description: "Casa em condomínio 3 quartos - suíte - varanda - piscina\n\n3 dormitórios,\n1 suíte;\n2 vagas de garagem cobertas.",
    formattedAddress: "Rua Santi Pegoretti, 50 - Jardim Santa Rosalia, Sorocaba - SP",
    listingId: "2866585690",
    images: [],
    prices: null,
  },
};
Deno.test("map: Casa de Condomínio Sorocaba", () => {
  const m = mapGeckoPdpToComparable(fixtureCasaCondominio, fixtureCasaCondominio.data.url);
  assertEquals(m.bedrooms, 3);
  assertEquals(m.area, 138);
  assertEquals(m.suites, 1);
  assertEquals(m.parking_spots, 2);
  assertEquals(m.property_type, "Casa de Condomínio");
  assertEquals(m.city, "Sorocaba");
  assertEquals(m.state, "SP");
  assertEquals(m.neighborhood, "Jardim Santa Rosalia");
  assertEquals(m.external_id, "2866585690");
});

const fixtureCasaTrujillo = {
  data: {
    url: "https://www.zapimoveis.com.br/imovel/venda-casa-3-quartos-com-lavanderia-coletiva-vila-trujillo-sorocaba-sp-120m2-id-2872995780/",
    title: "Casas para venda com Lavanderia e 3 quartos, 120 m² - Vila Trujillo",
    description: "3 Quartos\nSala 3 ambientes\nCopa e Cozinha\n2 banheiros sociais\nLavanderia\n2 Vagas de garagens sendo 1 coberta",
    formattedAddress: "Avenida General Osório - Vila Trujillo, Sorocaba - SP",
    listingId: "2872995780",
    images: [],
    prices: null,
  },
};
Deno.test("map: Casa Vila Trujillo", () => {
  const m = mapGeckoPdpToComparable(fixtureCasaTrujillo, fixtureCasaTrujillo.data.url);
  assertEquals(m.bedrooms, 3);
  assertEquals(m.bathrooms, 2);
  assertEquals(m.area, 120);
  assertEquals(m.parking_spots, 2);
  assertEquals(m.property_type, "Casa");
  assertEquals(m.city, "Sorocaba");
});

const fixtureAptWanel = {
  data: {
    url: "https://www.zapimoveis.com.br/imovel/venda-apartamento-3-quartos-com-piscina-wanel-ville-sorocaba-sp-69m2-id-2874144184/",
    title: "Apartamentos para venda com Piscina e 3 quartos, 69 m² - Wanel Ville",
    description: "Apartamento com lazer completo",
    formattedAddress: "Rua Márcio dos Santos Flores, 333 - Wanel Ville, Sorocaba - SP",
    listingId: "2874144184",
    images: [],
    prices: null,
  },
};
Deno.test("map: Apt Wanel Ville", () => {
  const m = mapGeckoPdpToComparable(fixtureAptWanel, fixtureAptWanel.data.url);
  assertEquals(m.bedrooms, 3);
  assertEquals(m.area, 69);
  assertEquals(m.property_type, "Apartamento");
  assertEquals(m.city, "Sorocaba");
});

/* ============= mapGeckoPdpToComparable: preço estruturado e em texto ============= */
Deno.test("map: preço de prices.price", () => {
  const fx = {
    data: {
      url: "https://example.com/x",
      title: "Apartamentos 2 quartos 60 m²",
      description: "ótimo apartamento",
      formattedAddress: "Rua A - Centro, Curitiba - PR",
      prices: { price: 850000 },
      images: [],
    },
  };
  const m = mapGeckoPdpToComparable(fx, fx.data.url);
  assertEquals(m.price, 850000);
});

Deno.test("map: preço de R$ na descrição", () => {
  const fx = {
    data: {
      url: "https://example.com/y",
      title: "Apartamentos 3 quartos 80 m²",
      description: "Por R$ 1.250.000,00 à vista. Condomínio baixo.",
      formattedAddress: "Rua B - Bairro, Curitiba - PR",
      prices: null,
      images: [],
    },
  };
  const m = mapGeckoPdpToComparable(fx, fx.data.url);
  assertEquals(m.price, 1250000);
  assertEquals(m.area, 80);
  assertEquals(m.bedrooms, 3);
});
