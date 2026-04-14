import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const PORTAL_SITE_MAP: Record<string, string> = {
  zap: "site:zapimoveis.com.br",
  vivareal: "site:vivareal.com.br",
  olx_venda: "site:olx.com.br/imoveis/venda",
  olx_aluguel: "site:olx.com.br/imoveis/aluguel",
  imovelweb: "site:imovelweb.com.br",
  chavesnamao: "site:chavesnamao.com.br",
  kenlo: "site:portal.kenlo.com.br",
};

function getPortalSiteFilter(portalCode: string, purpose?: string): string | undefined {
  if (portalCode === "olx") {
    const isRental = purpose === "aluguel" || purpose === "rent";
    return isRental ? PORTAL_SITE_MAP.olx_aluguel : PORTAL_SITE_MAP.olx_venda;
  }
  return PORTAL_SITE_MAP[portalCode];
}

interface PropertyData {
  property_type?: string;
  neighborhood?: string;
  city?: string;
  condominium?: string;
  bedrooms?: string;
  suites?: string;
  area_total?: string;
  area_built?: string;
  area_land?: string;
  owner_expected_price?: string;
  property_standard?: string;
  property_purpose?: string;
  differentials?: string[];
  state?: string;
  parking_spots?: string;
  [key: string]: any;
}

interface PortalInfo {
  id: string;
  name: string;
  code: string;
}

interface Filters {
  searchRadius?: string;
  minArea?: string;
  maxArea?: string;
  minPrice?: string;
  maxPrice?: string;
  maxComparables?: string;
  minComparables?: string;
  preferSameCondominium?: boolean;
  maxListingAgeMonths?: string;
}

interface DiscardReason {
  url: string;
  portal: string;
  reason: string;
}

interface PortalResult {
  portal_name: string;
  portal_code: string;
  urls_found: number;
  urls_opened: number;
  urls_valid: number;
}

function buildSearchQuery(property: PropertyData, portal: PortalInfo, filters?: Filters): string {
  const parts: string[] = [];
  if (property.property_type) parts.push(property.property_type);
  if (property.bedrooms) parts.push(`${property.bedrooms} quartos`);
  if (property.condominium) parts.push(property.condominium);
  if (property.neighborhood) parts.push(property.neighborhood);
  if (property.city) parts.push(property.city);
  const purpose = property.property_purpose?.toLowerCase();
  parts.push(purpose === "aluguel" || purpose === "rent" ? "aluguel" : "venda");
  const siteFilter = getPortalSiteFilter(portal.code, purpose);
  if (siteFilter) parts.push(siteFilter);
  return parts.join(" ");
}

function isIndividualListingUrl(url: string): boolean {
  return /\/imovel\//i.test(url) || /\/propriedades\//i.test(url);
}

function slugify(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

function getPropertyTypeSlug(type: string | undefined, portal: string): string {
  const t = (type || "apartamento").toLowerCase();
  if (portal === "zap" || portal === "vivareal") {
    if (t.includes("casa")) return "casas";
    if (t.includes("cobertura")) return "coberturas";
    if (t.includes("terreno")) return "terrenos";
    return "apartamentos";
  }
  if (portal === "kenlo") {
    if (t.includes("casa")) return "casa";
    if (t.includes("cobertura")) return "cobertura";
    if (t.includes("terreno")) return "terreno";
    return "apartamento";
  }
  if (t.includes("casa")) return "casas";
  return "apartamentos";
}

function buildPortalNativeUrl(property: PropertyData, portal: PortalInfo): string | null {
  const city = slugify(property.city || "");
  const neighborhood = slugify(property.neighborhood || "");
  const purpose = property.property_purpose?.toLowerCase();
  const isRental = purpose === "aluguel" || purpose === "rent";
  const purposeSlug = isRental ? "aluguel" : "venda";
  const typeSlug = getPropertyTypeSlug(property.property_type, portal.code);
  const bedrooms = property.bedrooms || "";

  if (!city || !neighborhood) return null;

  const state = slugify(property.state || "sp");

  switch (portal.code) {
    case "zap":
      return `https://www.zapimoveis.com.br/${purposeSlug}/${typeSlug}/${state}+${city}+${neighborhood}/`;

    case "vivareal": {
      const baseVivaUrl = `https://www.vivareal.com.br/${purposeSlug}/${state}/${city}/${neighborhood}/apartamento_residencial/`;
      if (property.condominium) {
        const condoSlug = slugify(property.condominium);
        return `${baseVivaUrl}?filtro=condominium:${condoSlug}`;
      }
      return baseVivaUrl;
    }

    case "kenlo": {
      const kenloAction = isRental ? "para-alugar" : "a-venda";
      let kenloUrl = `https://portal.kenlo.com.br/imoveis/${kenloAction}/${typeSlug}/${city}/${neighborhood}`;
      if (bedrooms) kenloUrl += `?quartos=${bedrooms}+`;
      return kenloUrl;
    }

    case "olx":
      return `https://www.olx.com.br/imoveis/${purposeSlug}/${typeSlug}/estado-${state}/${city}-e-regiao/${neighborhood}`;

    case "imovelweb":
      return `https://www.imovelweb.com.br/${typeSlug}-${purposeSlug}-${neighborhood}-${city}.html`;

    default:
      return null;
  }
}

function isMultiListingUrl(url: string): boolean {
  const patterns = [
    /\/condominio\//i,
    /\/busca\//i,
    /\/resultado\//i,
    /[?&]pagina=/i,
    /[?&]page=/i,
  ];
  return patterns.some(p => p.test(url));
}

function looksLikeMultiListing(markdown: string): boolean {
  const priceMatches = markdown.match(/R\$\s*[\d.,]+/g) || [];
  const areaMatches = markdown.match(/\d+\s*m²/g) || [];
  return priceMatches.length >= 3 && areaMatches.length >= 3 && markdown.length > 2000;
}

function extractIndividualListingUrls(links: string[], portalCode: string): string[] {
  const listingPatterns: Record<string, RegExp> = {
    zap: /zapimoveis\.com\.br\/imovel\//,
    vivareal: /vivareal\.com\.br\/imovel\//,
    kenlo: /portal\.kenlo\.com\.br\/imovel\//,
    olx: /olx\.com\.br\/.*\/imoveis\//,
    imovelweb: /imovelweb\.com\.br\/propriedades\//,
  };
  const pattern = listingPatterns[portalCode];
  if (!pattern) return [];
  return [...new Set(links.filter(l => pattern.test(l)))];
}

function generatePaginationUrls(url: string, maxPages = 5): string[] {
  const urls: string[] = [];
  const paginaMatch = url.match(/([?&])pagina=(\d+)/i);
  const pageMatch = url.match(/([?&])page=(\d+)/i);

  if (paginaMatch) {
    const currentPage = parseInt(paginaMatch[2], 10);
    const startPage = Math.max(1, currentPage - 1);
    const endPage = Math.min(currentPage + Math.max(2, maxPages - 2), startPage + maxPages - 1);
    for (let p = startPage; p <= endPage; p++) {
      urls.push(url.replace(/([?&])pagina=\d+/i, `$1pagina=${p}`));
    }
  } else if (pageMatch) {
    const currentPage = parseInt(pageMatch[2], 10);
    const startPage = Math.max(1, currentPage - 1);
    const endPage = Math.min(currentPage + Math.max(2, maxPages - 2), startPage + maxPages - 1);
    for (let p = startPage; p <= endPage; p++) {
      urls.push(url.replace(/([?&])page=\d+/i, `$1page=${p}`));
    }
  } else if (/\/condominio\//i.test(url) || /\/busca\//i.test(url)) {
    const separator = url.includes("?") ? "&" : "?";
    for (let p = 1; p <= Math.min(maxPages, 3); p++) {
      urls.push(`${url}${separator}pagina=${p}`);
    }
  }

  const normalized = url.replace(/\/$/, "").toLowerCase();
  return [...new Set(urls)]
    .filter(u => u.replace(/\/$/, "").toLowerCase() !== normalized);
}

function isDuplicate(comp: any, existing: any[]): boolean {
  for (const e of existing) {
    const samePrice = e.price && comp.price && Math.abs(e.price - comp.price) / Math.max(e.price, 1) < 0.03;
    const sameArea = e.area && comp.area && Math.abs(e.area - comp.area) / Math.max(e.area, 1) < 0.05;
    if (samePrice && sameArea) return true;
  }
  return false;
}

// ============================================================
// City pre-filter: discard URLs that clearly belong to wrong city
// Uses POSITIVE matching: if URL contains a known city that is NOT the target, discard it.
// ============================================================
function isWrongCityUrl(url: string, targetCity: string | undefined): boolean {
  if (!targetCity) return false;
  const targetSlug = slugify(targetCity);
  if (!targetSlug) return false;

  const urlLower = url.toLowerCase();

  // If URL contains the target city slug anywhere, it's OK
  if (urlLower.includes(targetSlug)) return false;

  // Known Brazilian city slugs that commonly appear in portal URLs
  const knownCities = [
    "rio-de-janeiro", "sao-paulo", "belo-horizonte", "curitiba",
    "porto-alegre", "salvador", "brasilia", "fortaleza", "recife",
    "manaus", "goiania", "campinas", "santos", "guarulhos", "niteroi",
    "sorocaba", "jundiai", "piracicaba", "bauru", "ribeirao-preto",
    "uberlandia", "joinville", "florianopolis", "londrina", "maringa",
    "osasco", "santo-andre", "sao-bernardo", "sao-jose-dos-campos",
    "mogi-das-cruzes", "diadema", "carapicuiba", "maua", "suzano",
    "taubate", "limeira", "franca", "praia-grande", "sao-vicente",
    "americana", "itu", "indaiatuba", "tatui", "votorantim",
  ];

  for (const city of knownCities) {
    if (city === targetSlug) continue; // same city as target, skip
    // Check with various URL delimiters (/, -, +, etc.)
    if (
      urlLower.includes(`/${city}/`) ||
      urlLower.includes(`/${city}?`) ||
      urlLower.includes(`/${city}-e-regiao`) ||
      urlLower.includes(`+${city}+`) ||
      urlLower.includes(`+${city}/`) ||
      urlLower.includes(`-${city}-`)
    ) {
      return true;
    }
  }
  return false;
}

// ============================================================
// Main processing logic (runs in background)
// ============================================================
async function processMarketAnalysis(
  property: PropertyData,
  portals: PortalInfo[],
  filters: Filters,
  marketStudyId: string | null,
  FIRECRAWL_API_KEY: string,
  LOVABLE_API_KEY: string,
) {
  // Create Supabase admin client for status updates
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const updateStudyStatus = async (status: string) => {
    if (!marketStudyId) return;
    await supabase.from("market_studies").update({ status }).eq("id", marketStudyId).throwOnError();
  };

  try {
    if (marketStudyId) await updateStudyStatus("processing");

    const searchablePortals = portals.filter((p) => PORTAL_SITE_MAP[p.code] || p.code === "olx");
    const portalResults: PortalResult[] = [];
    const discardReasons: DiscardReason[] = [];
    const limitations: string[] = [];

    if (searchablePortals.length === 0) {
      limitations.push("Nenhum portal com mapeamento de busca configurado");
      if (marketStudyId) await updateStudyStatus("completed");
      return {
        success: true, comparables: [],
        research_metadata: {
          portals_checked: portalResults, total_listings_found: 0,
          listings_opened: 0, listings_discarded: 0,
          discard_reasons: discardReasons, filters_used: filters,
          collected_at: new Date().toISOString(), limitations,
        },
        pricing_analysis: null,
      };
    }

    const limitedPortals = searchablePortals;
    const maxResults = Math.min(Number(filters.maxComparables) || 15, 20);
    const resultsPerPortal = Math.max(5, Math.min(Math.ceil((maxResults * 2) / limitedPortals.length), 10));

    // ==========================================
    // FASE 1A: Scrape direto das páginas de busca nativa dos portais
    // ==========================================
    console.log(`[FASE 1A] Scraping nativo em ${limitedPortals.length} portais...`);

    const nativeUrls: Array<{ url: string; title: string; portal: PortalInfo; snippet: string }> = [];

    const nativeScrapeResults = await Promise.allSettled(limitedPortals.map(async (portal) => {
      const nativeUrl = buildPortalNativeUrl(property, portal);
      if (!nativeUrl) {
        console.log(`[FASE 1A] ${portal.name}: sem URL nativa (dados insuficientes)`);
        return { urls: [] as any[], limitation: null as string | null };
      }

      console.log(`[FASE 1A] ${portal.name}: ${nativeUrl}`);

      try {
        const scrapeRes = await fetch("https://api.firecrawl.dev/v1/scrape", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${FIRECRAWL_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            url: nativeUrl,
            formats: ["markdown", "links"],
            onlyMainContent: true,
            waitFor: 5000,
          }),
        });

        if (!scrapeRes.ok) {
          const errStatus = scrapeRes.status;
          await scrapeRes.text();
          console.warn(`[FASE 1A] ${portal.name}: scrape failed (${errStatus})`);
          return { urls: [] as any[], limitation: `${portal.name}: scrape nativo falhou (${errStatus})` };
        }

        const scrapeData = await scrapeRes.json();
        const links: string[] = scrapeData.data?.links || scrapeData.links || [];
        const markdown: string = scrapeData.data?.markdown || scrapeData.markdown || "";

        const listingPatterns: Record<string, RegExp> = {
          zap: /zapimoveis\.com\.br\/imovel\//,
          vivareal: /vivareal\.com\.br\/imovel\//,
          kenlo: /portal\.kenlo\.com\.br\/imovel\//,
          olx: /olx\.com\.br\/.*\/imoveis\//,
          imovelweb: /imovelweb\.com\.br\/propriedades\//,
        };

        const pattern = listingPatterns[portal.code];
        const listingUrls = pattern ? links.filter(l => pattern.test(l)) : [];

        console.log(`[FASE 1A] ${portal.name}: ${links.length} links total, ${listingUrls.length} parecem anúncios individuais`);

        if (listingUrls.length > 0) {
          const dedupedUrls = [...new Set(listingUrls)].slice(0, 20);
          return {
            urls: dedupedUrls.map(url => ({ url, title: "", portal, snippet: "native-scrape" })),
            limitation: null,
          };
        }

        if (markdown.length > 200) {
          console.log(`[FASE 1A] ${portal.name}: usando markdown (${markdown.length} chars) para extrair URLs via IA...`);
          try {
            const extractRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
              method: "POST",
              headers: {
                Authorization: `Bearer ${LOVABLE_API_KEY}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                model: "google/gemini-2.5-flash",
                messages: [
                  { role: "system", content: `Extraia todas as URLs de anúncios individuais de imóveis desta página de resultados do portal ${portal.name}. Retorne APENAS URLs que apontam para páginas de anúncios individuais (não páginas de busca/listagem). Se não encontrar URLs individuais, retorne array vazio.` },
                  { role: "user", content: markdown.substring(0, 8000) },
                ],
                tools: [{
                  type: "function",
                  function: {
                    name: "extract_urls",
                    description: "Extrair URLs de anúncios individuais",
                    parameters: {
                      type: "object",
                      properties: { urls: { type: "array", items: { type: "string" } } },
                      required: ["urls"],
                    },
                  },
                }],
                tool_choice: { type: "function", function: { name: "extract_urls" } },
              }),
            });

            if (extractRes.ok) {
              const extractData = await extractRes.json();
              const tc = extractData.choices?.[0]?.message?.tool_calls?.[0];
              if (tc) {
                const parsed = JSON.parse(tc.function.arguments);
                const extractedUrls: string[] = parsed.urls || [];
                console.log(`[FASE 1A] ${portal.name}: IA extraiu ${extractedUrls.length} URLs do markdown`);
                const dedupedUrls = [...new Set(extractedUrls)].slice(0, 20);
                return {
                  urls: dedupedUrls.map(url => ({ url, title: "", portal, snippet: "native-ai-extract" })),
                  limitation: null,
                };
              }
            } else {
              await extractRes.text();
            }
          } catch (aiErr) {
            console.warn(`[FASE 1A] ${portal.name}: AI extraction failed`, aiErr);
          }
        }

        return { urls: [] as any[], limitation: `${portal.name}: nenhum anúncio individual no scrape nativo` };
      } catch (err) {
        console.error(`[FASE 1A] ${portal.name} exception:`, err);
        return { urls: [] as any[], limitation: `${portal.name}: erro no scrape nativo` };
      }
    }));

    for (const result of nativeScrapeResults) {
      if (result.status === "fulfilled") {
        const { urls, limitation } = result.value;
        nativeUrls.push(...urls);
        if (limitation) limitations.push(limitation);
      }
    }

    console.log(`[FASE 1A] Total: ${nativeUrls.length} URLs de scrape nativo`);

    // ==========================================
    // FASE 1B: Busca via Google (Firecrawl Search)
    // ==========================================
    console.log(`[FASE 1B] Buscando em ${limitedPortals.length} portais via Google...`);
    
    const googleUrls: Array<{ url: string; title: string; portal: PortalInfo; snippet: string }> = [];

    const portalSearchResults = await Promise.allSettled(limitedPortals.map(async (portal) => {
      const query = buildSearchQuery(property, portal, filters);
      console.log(`[FASE 1B] ${portal.name}: "${query}"`);

      const portalResult: PortalResult = {
        portal_name: portal.name,
        portal_code: portal.code,
        urls_found: 0,
        urls_opened: 0,
        urls_valid: 0,
      };

      try {
        const searchRes = await fetch("https://api.firecrawl.dev/v1/search", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${FIRECRAWL_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            query,
            limit: resultsPerPortal,
            lang: "pt-br",
            country: "br",
          }),
        });

        if (!searchRes.ok) {
          await searchRes.text();
          console.error(`[FASE 1B] ${portal.name} error: ${searchRes.status}`);
          const limitation = searchRes.status === 402
            ? `Firecrawl: créditos insuficientes`
            : `${portal.name}: erro na busca Google (${searchRes.status})`;
          return { portalResult, urls: [] as any[], limitation };
        }

        const searchData = await searchRes.json();
        const results = searchData.data || [];
        portalResult.urls_found = results.length;
        console.log(`[FASE 1B] ${portal.name}: ${results.length} URLs do Google`);

        const urls = results.filter((r: any) => r.url).map((r: any) => ({
          url: r.url,
          title: r.title || "",
          portal,
          snippet: r.description || "",
        }));
        return { portalResult, urls, limitation: null as string | null };
      } catch (err) {
        console.error(`[FASE 1B] ${portal.name} exception:`, err);
        return { portalResult, urls: [] as any[], limitation: `${portal.name}: falha na conexão Google` };
      }
    }));

    for (const result of portalSearchResults) {
      if (result.status === "fulfilled") {
        const { portalResult, urls, limitation } = result.value;
        portalResults.push(portalResult);
        googleUrls.push(...urls);
        if (limitation) limitations.push(limitation);
      }
    }

    // Merge native + Google URLs, dedup, and CITY PRE-FILTER
    const seenUrls = new Set<string>();
    const mergedUrlsRaw: Array<{ url: string; title: string; portal: PortalInfo; snippet: string }> = [];
    let cityFilteredCount = 0;
    const cityFilteredExamples: string[] = [];
    for (const item of [...nativeUrls, ...googleUrls]) {
      const normalized = item.url.replace(/\/$/, "").toLowerCase();
      if (seenUrls.has(normalized)) continue;
      seenUrls.add(normalized);

      // Purpose pre-filter: discard rental URLs when purpose is sale (and vice-versa)
      const studyPurpose = (property.property_purpose || "venda").toLowerCase();
      const urlLower = item.url.toLowerCase();
      const isRentalUrl = /\/(aluguel|alugar|para-alugar)\//i.test(urlLower);
      const isSaleUrl = /\/(venda|comprar|a-venda)\//i.test(urlLower);
      if (studyPurpose !== "aluguel" && studyPurpose !== "rent" && isRentalUrl && !isSaleUrl) {
        cityFilteredCount++;
        if (cityFilteredExamples.length < 5) cityFilteredExamples.push(item.url.substring(0, 100));
        discardReasons.push({ url: item.url, portal: item.portal.name, reason: "URL de aluguel descartada (estudo é venda)" });
        continue;
      }
      if ((studyPurpose === "aluguel" || studyPurpose === "rent") && isSaleUrl && !isRentalUrl) {
        cityFilteredCount++;
        if (cityFilteredExamples.length < 5) cityFilteredExamples.push(item.url.substring(0, 100));
        discardReasons.push({ url: item.url, portal: item.portal.name, reason: "URL de venda descartada (estudo é aluguel)" });
        continue;
      }

      // City pre-filter: discard URLs from obviously wrong cities
      if (isWrongCityUrl(item.url, property.city)) {
        cityFilteredCount++;
        if (cityFilteredExamples.length < 5) {
          cityFilteredExamples.push(item.url.substring(0, 100));
        }
        discardReasons.push({
          url: item.url,
          portal: item.portal.name,
          reason: "URL pertence a outra cidade (pré-filtro)",
        });
        continue;
      }

      mergedUrlsRaw.push(item);
    }

    if (cityFilteredCount > 0) {
      console.log(`[FASE 1] Pré-filtro de cidade removeu ${cityFilteredCount} URLs de cidades erradas`);
      console.log(`[FASE 1] Exemplos filtrados: ${cityFilteredExamples.join(" | ")}`);
    }

    // Sort by relevance: condo-target > city-match > rest
    const condoSlug = property.condominium ? slugify(property.condominium) : null;
    const citySlug = property.city ? slugify(property.city) : null;

    const mergedUrls = mergedUrlsRaw.sort((a, b) => {
      const aLower = a.url.toLowerCase();
      const bLower = b.url.toLowerCase();
      const aCondoMatch = condoSlug && aLower.includes(condoSlug) ? 1 : 0;
      const bCondoMatch = condoSlug && bLower.includes(condoSlug) ? 1 : 0;
      if (aCondoMatch !== bCondoMatch) return bCondoMatch - aCondoMatch; // condo first
      const aCityMatch = citySlug && aLower.includes(citySlug) ? 1 : 0;
      const bCityMatch = citySlug && bLower.includes(citySlug) ? 1 : 0;
      return bCityMatch - aCityMatch; // city match second
    });

    console.log(`[FASE 1] Total merged: ${mergedUrls.length} URLs únicas (${nativeUrls.length} nativo + ${googleUrls.length} Google)`);
    if (mergedUrls.length > 0) {
      console.log(`[FASE 1] Top 3 URLs após priorização: ${mergedUrls.slice(0, 3).map(u => u.url.substring(0, 80)).join(" | ")}`);
    }

    for (const pr of portalResults) {
      const nativeCount = nativeUrls.filter(u => u.portal.code === pr.portal_code).length;
      pr.urls_found += nativeCount;
    }

    if (mergedUrls.length === 0) {
      if (marketStudyId) await updateStudyStatus("completed");
      return {
        success: true, comparables: [],
        research_metadata: {
          portals_checked: portalResults, total_listings_found: 0,
          listings_opened: 0, listings_discarded: discardReasons.length,
          discard_reasons: discardReasons, filters_used: filters,
          collected_at: new Date().toISOString(),
          limitations: [...limitations, "Nenhum resultado encontrado nos portais"],
        },
        pricing_analysis: null,
      };
    }

    // ==========================================
    // FASE 2: Validação individual
    // ==========================================
    console.log(`[FASE 2] Abrindo ${mergedUrls.length} URLs individualmente...`);

    // Round-robin: garantir diversidade de portais
    const MAX_URLS = 25;
    const MIN_PER_PORTAL = 3;
    const byPortal = new Map<string, typeof mergedUrls>();
    for (const item of mergedUrls) {
      const key = item.portal.code;
      if (!byPortal.has(key)) byPortal.set(key, []);
      byPortal.get(key)!.push(item);
    }

    const selectedUrls = new Set<string>();
    const urlsToProcess: typeof mergedUrls = [];

    // Round 1: até MIN_PER_PORTAL por portal
    for (const [_code, items] of byPortal) {
      for (const item of items.slice(0, MIN_PER_PORTAL)) {
        if (urlsToProcess.length >= MAX_URLS) break;
        urlsToProcess.push(item);
        selectedUrls.add(item.url);
      }
    }

    // Round 2: preencher com restantes por relevância (mergedUrls já está ordenado)
    for (const item of mergedUrls) {
      if (urlsToProcess.length >= MAX_URLS) break;
      if (!selectedUrls.has(item.url)) {
        urlsToProcess.push(item);
      }
    }

    if (mergedUrls.length > MAX_URLS) {
      limitations.push(`Limitado a ${MAX_URLS} de ${mergedUrls.length} URLs para respeitar timeout`);
    }

    // Log distribuição por portal
    const distLog = [...byPortal.entries()].map(([c, items]) =>
      `${c}: ${urlsToProcess.filter(u => u.portal.code === c).length}/${items.length}`
    ).join(", ");
    console.log(`[FASE 2] Distribuição por portal: ${distLog}`);

    const scrapedPages: Array<{
      url: string;
      portal: PortalInfo;
      markdown: string;
      status: "ok" | "failed";
      isMultiListing?: boolean;
      isCondoTarget?: boolean;
    }> = [];

    let listingsOpened = 0;
    const scrapedUrlSet = new Set<string>();

    for (const item of urlsToProcess) {
      try {
        const isMultiListing = isMultiListingUrl(item.url);
        console.log(`[FASE 2] Scraping${isMultiListing ? " (multi-listing)" : ""}: ${item.url.substring(0, 80)}...`);
        listingsOpened++;

        const pr = portalResults.find(p => p.portal_code === item.portal.code);
        if (pr) pr.urls_opened++;

        const formats = isMultiListing ? ["markdown", "links"] : ["markdown"];

        // Kenlo is a SPA — needs longer wait + scroll actions for JS rendering
        const isKenlo = /kenlo\.com\.br/i.test(item.url);
        const scrapeBody: any = {
          url: item.url,
          formats,
          onlyMainContent: true,
          waitFor: isKenlo ? 10000 : (isMultiListing ? 5000 : 2000),
        };
        if (isKenlo) {
          scrapeBody.actions = [
            { type: "wait", milliseconds: 8000 },
            { type: "scroll", direction: "down", amount: 3 },
            { type: "wait", milliseconds: 2000 },
          ];
        }

        // Use Firecrawl v2 for Kenlo (better JS rendering for SPAs)
        const firecrawlUrl = isKenlo ? "https://api.firecrawl.dev/v2/scrape" : "https://api.firecrawl.dev/v1/scrape";
        const scrapeRes = await fetch(firecrawlUrl, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${FIRECRAWL_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(scrapeBody),
        });

        if (!scrapeRes.ok) {
          const status = scrapeRes.status;
          await scrapeRes.text();
          console.warn(`[FASE 2] Scrape failed: ${status} for ${item.url}`);
          discardReasons.push({
            url: item.url,
            portal: item.portal.name,
            reason: status === 404 ? "Página não encontrada (404)" : `Erro HTTP ${status}`,
          });
          continue;
        }

        const scrapeData = await scrapeRes.json();
        let markdown = scrapeData.data?.markdown || scrapeData.markdown || "";
        const links: string[] = scrapeData.data?.links || scrapeData.links || [];

        // Diagnostic: log markdown size per portal
        console.log(`[FASE 2] ${item.portal.name} markdown: ${markdown.length} chars for ${item.url.substring(0, 60)}...`);

        // Google Cache fallback for Kenlo SPA pages with insufficient content (threshold: 1000 chars)
        if (isKenlo && markdown.length < 1000) {
          console.log(`[FASE 2] Kenlo page too short (${markdown.length} chars), trying Google Cache fallback...`);
          try {
            const cacheUrl = `https://webcache.googleusercontent.com/search?q=cache:${encodeURIComponent(item.url)}`;
            const cacheRes = await fetch("https://api.firecrawl.dev/v2/scrape", {
              method: "POST",
              headers: { Authorization: `Bearer ${FIRECRAWL_API_KEY}`, "Content-Type": "application/json" },
              body: JSON.stringify({ url: cacheUrl, formats: ["markdown"], onlyMainContent: true, waitFor: 3000 }),
            });
            if (cacheRes.ok) {
              const cacheData = await cacheRes.json();
              const cacheMd = cacheData.data?.markdown || cacheData.markdown || "";
              if (cacheMd.length > markdown.length) {
                console.log(`[FASE 2] Google Cache returned ${cacheMd.length} chars (better than ${markdown.length})`);
                markdown = cacheMd;
              }
            }
          } catch (cacheErr) {
            console.warn(`[FASE 2] Google Cache fallback failed for ${item.url}`, cacheErr);
          }

          // Synthetic markdown from Kenlo URL slug as last resort
          if (markdown.length < 1000 && /\/imovel\//i.test(item.url)) {
            const slugMatch = item.url.match(/\/imovel\/([^/]+)\/([^/?#]+)/i);
            if (slugMatch) {
              const slugParts = slugMatch[1].split("-");
              const externalId = slugMatch[2];
              // Extract: type, city, rooms, area from slug like "apartamento-sorocaba-3-quartos-104-m"
              const typeMatch = slugParts[0] || "";
              const cityMatch = slugParts.find((_, i) => i === 1) || "";
              const roomsMatch = slugMatch[1].match(/(\d+)-quartos/);
              const areaMatch = slugMatch[1].match(/(\d+)-m/);
              const syntheticMd = [
                `# ${typeMatch} em ${cityMatch}`,
                roomsMatch ? `- Quartos: ${roomsMatch[1]}` : "",
                areaMatch ? `- Área: ${areaMatch[1]}m²` : "",
                `- Código: ${externalId}`,
                `- Fonte: Kenlo`,
                `- URL: ${item.url}`,
              ].filter(Boolean).join("\n");
              console.log(`[FASE 2] Kenlo synthetic markdown from slug: ${syntheticMd.length} chars for ${externalId}`);
              markdown = markdown + "\n\n" + syntheticMd;
            }
          }
        }

        if (!markdown || markdown.length < 100) {
          discardReasons.push({
            url: item.url,
            portal: item.portal.name,
            reason: `Conteúdo insuficiente (${markdown.length} chars)${isKenlo ? ' — SPA não renderizou' : ''}`,
          });
          continue;
        }

        const lowerMd = markdown.toLowerCase();
        if (
          lowerMd.includes("anúncio indisponível") ||
          lowerMd.includes("anúncio expirado") ||
          lowerMd.includes("imóvel vendido") ||
          lowerMd.includes("este anúncio não está mais") ||
          lowerMd.includes("página não encontrada")
        ) {
          discardReasons.push({
            url: item.url,
            portal: item.portal.name,
            reason: "Anúncio indisponível ou expirado",
          });
          continue;
        }

        // Multi-listing handling
        if (!isIndividualListingUrl(item.url) && (isMultiListing || looksLikeMultiListing(markdown))) {
          let allIndividualUrls = extractIndividualListingUrls(links, item.portal.code);
          
          const paginationUrls = generatePaginationUrls(item.url, 4);
          if (paginationUrls.length > 0) {
            console.log(`[FASE 2] Paginação automática: ${paginationUrls.length} páginas adjacentes para ${item.url.substring(0, 60)}...`);
            
            const paginationResults = await Promise.allSettled(paginationUrls.map(async (pageUrl) => {
              const normalizedPage = pageUrl.replace(/\/$/, "").toLowerCase();
              if (scrapedUrlSet.has(normalizedPage)) return [];
              scrapedUrlSet.add(normalizedPage);
              
              try {
                listingsOpened++;
                const pageRes = await fetch("https://api.firecrawl.dev/v1/scrape", {
                  method: "POST",
                  headers: {
                    Authorization: `Bearer ${FIRECRAWL_API_KEY}`,
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    url: pageUrl,
                    formats: ["markdown", "links"],
                    onlyMainContent: true,
                    waitFor: 5000,
                  }),
                });

                if (!pageRes.ok) {
                  await pageRes.text();
                  return [];
                }

                const pageData = await pageRes.json();
                const pageLinks: string[] = pageData.data?.links || pageData.links || [];
                const pageMd: string = pageData.data?.markdown || pageData.markdown || "";
                
                const pageListingUrls = extractIndividualListingUrls(pageLinks, item.portal.code);
                console.log(`[FASE 2] Página ${pageUrl.match(/pagina=(\d+)/)?.[1] || '?'}: ${pageListingUrls.length} anúncios individuais`);
                
                if (pageListingUrls.length === 0 && pageMd.length > 500 && looksLikeMultiListing(pageMd)) {
                  scrapedPages.push({
                    url: pageUrl,
                    portal: item.portal,
                    markdown: pageMd.substring(0, 12000),
                    status: "ok",
                    isMultiListing: true,
                  });
                }
                
                return pageListingUrls;
              } catch (err) {
                console.warn(`[FASE 2] Pagination scrape failed: ${pageUrl}`, err);
                return [];
              }
            }));

            for (const result of paginationResults) {
              if (result.status === "fulfilled") {
                allIndividualUrls.push(...result.value);
              }
            }
            allIndividualUrls = [...new Set(allIndividualUrls)];
          }
          
          if (allIndividualUrls.length > 0) {
            const MAX_EXPANDED = 20;
            const newUrls = allIndividualUrls
              .filter(u => !scrapedUrlSet.has(u.replace(/\/$/, "").toLowerCase()))
              .slice(0, MAX_EXPANDED);
            
            console.log(`[FASE 2] Multi-listing expandido: ${allIndividualUrls.length} URLs totais (com paginação), ${newUrls.length} novas para scrape`);
            
            // Check if this is a condominium-target URL
            const isCondoUrl = property.condominium && item.url.toLowerCase().includes(slugify(property.condominium));
            
            for (const expandedUrl of newUrls) {
              const normalized = expandedUrl.replace(/\/$/, "").toLowerCase();
              if (scrapedUrlSet.has(normalized)) continue;
              scrapedUrlSet.add(normalized);
              
              // City pre-filter on expanded URLs too
              if (isWrongCityUrl(expandedUrl, property.city)) {
                discardReasons.push({ url: expandedUrl, portal: item.portal.name, reason: "URL pertence a outra cidade" });
                continue;
              }
              
              try {
                listingsOpened++;
                if (pr) pr.urls_opened++;
                
                const expandedRes = await fetch("https://api.firecrawl.dev/v1/scrape", {
                  method: "POST",
                  headers: {
                    Authorization: `Bearer ${FIRECRAWL_API_KEY}`,
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    url: expandedUrl,
                    formats: ["markdown"],
                    onlyMainContent: true,
                    waitFor: 2000,
                  }),
                });

                if (!expandedRes.ok) {
                  await expandedRes.text();
                  continue;
                }

                const expandedData = await expandedRes.json();
                const expandedMd = expandedData.data?.markdown || expandedData.markdown || "";
                
                if (expandedMd && expandedMd.length >= 100) {
                  scrapedPages.push({
                    url: expandedUrl,
                    portal: item.portal,
                    markdown: expandedMd.substring(0, 4000),
                    status: "ok",
                    isCondoTarget: !!isCondoUrl,
                  });
                }
              } catch (expandErr) {
                console.warn(`[FASE 2] Expanded scrape failed: ${expandedUrl}`, expandErr);
              }
            }
            
            continue;
          }
          
          console.log(`[FASE 2] Multi-listing sem URLs individuais — enviando para IA como listagem múltipla`);
          scrapedPages.push({
            url: item.url,
            portal: item.portal,
            markdown: markdown.substring(0, 12000),
            status: "ok",
            isMultiListing: true,
          });
          continue;
        }

        scrapedUrlSet.add(item.url.replace(/\/$/, "").toLowerCase());
        scrapedPages.push({
          url: item.url,
          portal: item.portal,
          markdown: markdown.substring(0, 4000),
          status: "ok",
        });
      } catch (err) {
        console.error(`[FASE 2] Scrape exception for ${item.url}:`, err);
        discardReasons.push({
          url: item.url,
          portal: item.portal.name,
          reason: "Erro ao acessar a página",
        });
      }
    }

    console.log(`[FASE 2] ${scrapedPages.length} páginas válidas de ${listingsOpened} abertas`);

    if (scrapedPages.length === 0) {
      if (marketStudyId) await updateStudyStatus("completed");
      return {
        success: true, comparables: [],
        research_metadata: {
          portals_checked: portalResults, total_listings_found: mergedUrls.length,
          listings_opened: listingsOpened, listings_discarded: discardReasons.length,
          discard_reasons: discardReasons, filters_used: filters,
          collected_at: new Date().toISOString(),
          limitations: [...limitations, "Nenhuma página válida após validação individual"],
        },
        pricing_analysis: null,
      };
    }

    // ==========================================
    // FASE 3: AI extraction — CAP at 20 pages, prioritize condo targets
    // ==========================================
    const MAX_AI_PAGES = 20;
    let pagesToAI = scrapedPages;
    if (scrapedPages.length > MAX_AI_PAGES) {
      // Prioritize: condo-target pages first, then individual listings, then multi-listing generic
      pagesToAI = [
        ...scrapedPages.filter(p => p.isCondoTarget),
        ...scrapedPages.filter(p => !p.isCondoTarget && !p.isMultiListing),
        ...scrapedPages.filter(p => !p.isCondoTarget && p.isMultiListing),
      ].slice(0, MAX_AI_PAGES);
      limitations.push(`Limitado a ${MAX_AI_PAGES} de ${scrapedPages.length} páginas para extração por IA`);
      console.log(`[FASE 3] Limitando de ${scrapedPages.length} para ${pagesToAI.length} páginas (prioridade: condomínio > individual > multi-listing)`);
    }

    console.log(`[FASE 3] Extraindo dados de ${pagesToAI.length} páginas com IA...`);

    const hasMultiListingPages = pagesToAI.some((p) => p.isMultiListing);

    const combinedContent = pagesToAI
      .map((p, i) => {
        const label = p.isMultiListing
          ? `--- LISTAGEM MÚLTIPLA ${i + 1} (Portal: ${p.portal.name}, URL: ${p.url}) ---`
          : `--- Anúncio ${i + 1} (Portal: ${p.portal.name}, URL: ${p.url}) ---`;
        return `${label}\n${p.markdown}`;
      })
      .join("\n\n");

    const multiListingInstructions = hasMultiListingPages
      ? `\n\nATENÇÃO - LISTAGENS MÚLTIPLAS:
- Blocos marcados "--- LISTAGEM MÚLTIPLA ---" contêm VÁRIOS imóveis numa mesma página (ex: página de condomínio).
- Extraia CADA imóvel individualmente como um comparável separado.
- Para cada imóvel, extraia o URL INDIVIDUAL do anúncio (o link do card que leva à ficha do imóvel). NÃO use a URL da página de busca para todos.
- Extraia o external_id (código do anúncio no portal, ex: "id-2446277614", "AP2337-A") de cada card.
- Se não conseguir encontrar o URL individual, use a URL da página MAS inclua o external_id obrigatoriamente.
- NÃO trate a página inteira como um único imóvel.`
      : "";

    const systemPrompt = `Você é um perito avaliador imobiliário brasileiro. Analise CADA anúncio individualmente e extraia dados estruturados.

REGRAS CRÍTICAS:
- Cada bloco "--- Anúncio X ---" é UM anúncio individual já validado (página aberta e verificada).${multiListingInstructions}
- Extraia EXATAMENTE os dados que estão no anúncio. NÃO invente dados.
- Se um dado não está claro, use null/0.
- Preços no formato "R$ 1.200.000" → converta para número 1200000.
- Áreas "120 m²" → número 120.
- Inclua o URL INDIVIDUAL do anúncio no campo source_url (o link direto para a ficha do imóvel, não a página de busca).
- Inclua o nome do portal no campo source_name.
- Inclua o código/ID do anúncio no portal no campo external_id (ex: "id-2446277614", "AP2337-A", etc).

IMÓVEL DE REFERÊNCIA:
- Tipo: ${property.property_type || "Não informado"}
- Bairro: ${property.neighborhood || "Não informado"}  
- Cidade: ${property.city || "Não informado"}
- Condomínio: ${property.condominium || "Não informado"}
- Área: ${property.area_total || property.area_built || "Não informada"} m²
- Quartos: ${property.bedrooms || "Não informado"}
- Suítes: ${property.suites || "Não informado"}
- Vagas: ${property.parking_spots || "Não informado"}
- Padrão: ${property.property_standard || "Não informado"}
- Preço esperado: ${property.owner_expected_price ? "R$ " + Number(property.owner_expected_price).toLocaleString("pt-BR") : "Não informado"}

IMPORTANTE - DIFERENCIAIS:
Extraia com atenção TODOS os diferenciais e comodidades do imóvel e do condomínio.
Inclua no campo "differentials" como array de strings. Se não houver diferenciais mencionados, retorne array vazio.

IMPORTANTE: Extraia também a data do anúncio (listing_date) quando disponível. Retorne no formato YYYY-MM-DD.

Extraia todos os imóveis relevantes. Descarte apenas se claramente incompatível (tipo diferente, cidade diferente).`;

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Extraia os dados de cada anúncio:\n\n${combinedContent}` },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extract_comparables",
              description: "Extrair dados estruturados de cada anúncio validado individualmente",
              parameters: {
                type: "object",
                properties: {
                  comparables: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        title: { type: "string" },
                        price: { type: "number" },
                        area: { type: "number" },
                        bedrooms: { type: "number" },
                        suites: { type: "number" },
                        parking_spots: { type: "number" },
                        address: { type: "string" },
                        neighborhood: { type: "string" },
                        city: { type: "string" },
                        condominium: { type: "string" },
                        construction_standard: { type: "string" },
                        property_type: { type: "string" },
                        source_url: { type: "string" },
                        source_name: { type: "string" },
                        advertiser: { type: "string" },
                        differentials: { type: "array", items: { type: "string" } },
                        description_summary: { type: "string" },
                        listing_date: { type: "string" },
                        external_id: { type: "string", description: "Código/ID do anúncio no portal (ex: id-2446277614, AP2337-A)" },
                      },
                      required: ["title", "price", "area", "source_url", "source_name"],
                    },
                  },
                },
                required: ["comparables"],
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "extract_comparables" } },
      }),
    });

    if (!aiRes.ok) {
      const aiErr = await aiRes.text();
      console.error(`[FASE 3] AI error: ${aiRes.status} ${aiErr}`);
      if (marketStudyId) await updateStudyStatus("failed");
      return {
        success: false,
        error: aiRes.status === 429 ? "Rate limit exceeded" : aiRes.status === 402 ? "AI credits exhausted" : "AI extraction failed",
      };
    }

    const aiData = await aiRes.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      console.error("[FASE 3] No tool call in AI response");
      if (marketStudyId) await updateStudyStatus("completed");
      return {
        success: true, comparables: [],
        research_metadata: {
          portals_checked: portalResults, total_listings_found: mergedUrls.length,
          listings_opened: listingsOpened, listings_discarded: discardReasons.length,
          discard_reasons: discardReasons, filters_used: filters,
          collected_at: new Date().toISOString(),
          limitations: [...limitations, "IA não conseguiu extrair dados estruturados"],
        },
        pricing_analysis: null,
      };
    }

    let extracted: { comparables: any[] };
    try {
      extracted = JSON.parse(toolCall.function.arguments);
      console.log(`[FASE 3] AI extraiu ${extracted.comparables?.length || 0} comparáveis`);
    } catch {
      console.error("[FASE 3] Failed to parse AI response");
      if (marketStudyId) await updateStudyStatus("completed");
      return {
        success: true, comparables: [],
        research_metadata: {
          portals_checked: portalResults, total_listings_found: mergedUrls.length,
          listings_opened: listingsOpened, listings_discarded: discardReasons.length,
          discard_reasons: discardReasons, filters_used: filters,
          collected_at: new Date().toISOString(), limitations: [...limitations, "Erro ao processar resposta da IA"],
        },
        pricing_analysis: null,
      };
    }

    // === URL Fallback: fix generic search URLs ===
    const searchUrlPatterns = [
      /vivareal\.com\.br\/venda\//,
      /vivareal\.com\.br\/aluguel\//,
      /vivareal\.com\.br\/condominio\//,
      /zapimoveis\.com\.br\/venda\//,
      /zapimoveis\.com\.br\/aluguel\//,
      /zapimoveis\.com\.br\/condominio\//,
      /imovelweb\.com\.br\/(apartamentos|casas|imoveis)-/,
      /olx\.com\.br\/imoveis\//,
    ];
    const individualUrlPatterns = [
      /vivareal\.com\.br\/imovel\//,
      /zapimoveis\.com\.br\/imovel\//,
      /imovelweb\.com\.br\/propriedades\//,
      /olx\.com\.br\/d\/anuncio\//,
      /kenlo\.com\.br\/imovel\//,
    ];

    for (const c of (extracted.comparables || [])) {
      const url = c.source_url || "";
      const isGenericUrl = searchUrlPatterns.some(p => p.test(url)) && !individualUrlPatterns.some(p => p.test(url));
      
      if (isGenericUrl && c.external_id) {
        const eid = c.external_id.replace(/^id-/, "");
        const portalName = (c.source_name || "").toLowerCase();
        if (portalName.includes("viva") || portalName.includes("vivareal")) {
          c.source_url = `https://www.vivareal.com.br/imovel/${c.external_id}`;
        } else if (portalName.includes("zap")) {
          c.source_url = `https://www.zapimoveis.com.br/imovel/${c.external_id}`;
        } else if (portalName.includes("imóvel web") || portalName.includes("imovelweb") || portalName.includes("imoveweb")) {
          c.source_url = `https://www.imovelweb.com.br/propriedades/${eid}`;
        }
        console.log(`[URL FIX] ${url.substring(0, 60)}... → ${c.source_url}`);
      }
    }

    // === Forced portal attribution by URL domain ===
    for (const c of (extracted.comparables || [])) {
      const srcUrl = (c.source_url || "").toLowerCase();
      if (/kenlo\.com\.br/i.test(srcUrl)) c.source_name = "Kenlo";
      else if (/vivareal\.com\.br/i.test(srcUrl)) c.source_name = "Viva Real";
      else if (/zapimoveis\.com\.br/i.test(srcUrl)) c.source_name = "ZAP Imóveis";
      else if (/imovelweb\.com\.br/i.test(srcUrl)) c.source_name = "Imóvel Web";
      else if (/olx\.com\.br/i.test(srcUrl)) c.source_name = "OLX";
      else if (/chavesnamao\.com\.br/i.test(srcUrl)) c.source_name = "Chaves na Mão";
    }

    // Filter, score, deduplicate
    const baseArea = Number(property.area_total || property.area_built || property.area_land) || 100;
    const baseBedrooms = Number(property.bedrooms) || 3;
    const baseSuites = Number(property.suites) || 0;
    const baseParking = Number(property.parking_spots) || 0;

    const validComparables: any[] = [];

    const maxAgeMonths = Number(filters.maxListingAgeMonths) || 0;
    const cutoffDate = maxAgeMonths > 0
      ? new Date(Date.now() - maxAgeMonths * 30 * 24 * 60 * 60 * 1000)
      : null;

    const studyPurposeFinal = (property.property_purpose || "venda").toLowerCase();
    const isStudySale = studyPurposeFinal !== "aluguel" && studyPurposeFinal !== "rent";

    for (const c of (extracted.comparables || [])) {
      if (!c.price || c.price <= 0 || !c.area || c.area <= 0) {
        discardReasons.push({ url: c.source_url || "unknown", portal: c.source_name || "unknown", reason: "Preço ou área não disponível" });
        continue;
      }

      // Purpose filter by title keywords
      const titleLower = (c.title || "").toLowerCase();
      const isRentalTitle = /alugu[e]?[lr]|para alugar|locação/i.test(titleLower);
      const isSaleTitle = /venda|comprar|à venda|a venda/i.test(titleLower);
      if (isStudySale && isRentalTitle && !isSaleTitle) {
        discardReasons.push({ url: c.source_url || "unknown", portal: c.source_name || "unknown", reason: "Comparável é aluguel (título), estudo é venda" });
        continue;
      }
      if (!isStudySale && isSaleTitle && !isRentalTitle) {
        discardReasons.push({ url: c.source_url || "unknown", portal: c.source_name || "unknown", reason: "Comparável é venda (título), estudo é aluguel" });
        continue;
      }

      // Price heuristic: sales < R$10k are likely rentals, rentals > R$100k are likely sales
      if (isStudySale && c.price < 10000) {
        discardReasons.push({ url: c.source_url || "unknown", portal: c.source_name || "unknown", reason: `Preço R$ ${c.price.toLocaleString("pt-BR")} muito baixo para venda (provável aluguel)` });
        continue;
      }
      if (!isStudySale && c.price > 100000) {
        discardReasons.push({ url: c.source_url || "unknown", portal: c.source_name || "unknown", reason: `Preço R$ ${c.price.toLocaleString("pt-BR")} muito alto para aluguel (provável venda)` });
        continue;
      }

      if (cutoffDate && c.listing_date) {
        const listingDate = new Date(c.listing_date);
        if (!isNaN(listingDate.getTime()) && listingDate < cutoffDate) {
          const ageMonths = Math.round((Date.now() - listingDate.getTime()) / (30 * 24 * 60 * 60 * 1000));
          discardReasons.push({ url: c.source_url || "unknown", portal: c.source_name || "unknown", reason: `Anúncio muito antigo (criado há ${ageMonths} meses)` });
          continue;
        }
      }

      if (isDuplicate(c, validComparables)) {
        discardReasons.push({ url: c.source_url || "unknown", portal: c.source_name || "unknown", reason: "Duplicata (mesmo imóvel em outro portal)" });
        continue;
      }

      const priceSqm = Math.round(c.price / c.area);
      const compCondo = (c.condominium || "").toLowerCase();
      const subjCondo = (property.condominium || "").toLowerCase();
      const isSameCondo = subjCondo && compCondo &&
        (compCondo.includes(subjCondo) || subjCondo.includes(compCondo));

      let score = 0;
      if (isSameCondo) score += 25;
      if (c.neighborhood && property.neighborhood) {
        const compNeigh = c.neighborhood.toLowerCase();
        const subjNeigh = property.neighborhood.toLowerCase();
        if (compNeigh.includes(subjNeigh) || subjNeigh.includes(compNeigh)) score += 20;
      }
      if (c.property_type && property.property_type &&
        c.property_type.toLowerCase().includes(property.property_type.toLowerCase())) score += 15;
      
      const areaDiff = Math.abs(c.area - baseArea) / baseArea;
      if (areaDiff <= 0.05) score += 15;
      else if (areaDiff <= 0.10) score += 12;
      else if (areaDiff <= 0.20) score += 8;
      else if (areaDiff <= 0.30) score += 3;

      const bedroomDiff = Math.abs((c.bedrooms || 0) - baseBedrooms);
      const suiteDiff = Math.abs((c.suites || 0) - baseSuites);
      const parkingDiff = Math.abs((c.parking_spots || 0) - baseParking);
      const roomsAvg = [bedroomDiff, suiteDiff, parkingDiff].filter(d => d >= 0);
      const avgDiff = roomsAvg.reduce((a, b) => a + b, 0) / roomsAvg.length;
      if (avgDiff === 0) score += 10;
      else if (avgDiff <= 1) score += 6;
      else if (avgDiff <= 2) score += 2;

      const subjStandard = ((property as any).construction_standard || (property as any).property_standard || "").toLowerCase();
      if (c.construction_standard && subjStandard &&
        (c.construction_standard.toLowerCase().includes(subjStandard) || subjStandard.includes(c.construction_standard.toLowerCase()))) score += 10;

      const subjectDiffs: string[] = (property as any).differentials || [];
      const compDiffs: string[] = c.differentials || [];
      if (subjectDiffs.length > 0 && compDiffs.length > 0) {
        const subNorm = subjectDiffs.map((d: string) => d.toLowerCase());
        const compNorm = compDiffs.map((d: string) => d.toLowerCase());
        const overlap = subNorm.filter((d: string) => compNorm.some((cd: string) => cd.includes(d) || d.includes(cd)));
        const ratio = overlap.length / subNorm.length;
        if (ratio >= 0.5) score += 5;
        else if (ratio >= 0.25) score += 3;
      }

      if (c.city && property.city) {
        const compCity = c.city.toLowerCase();
        const subjCity = property.city.toLowerCase();
        if (compCity.includes(subjCity) || subjCity.includes(compCity)) score += 5;
      }

      const similarity = Math.min(100, Math.round(score));

      const minSimilarity = (filters?.preferSameCondominium && property.condominium) ? 25 : 40;
      if (similarity < minSimilarity) {
        discardReasons.push({ url: c.source_url || "unknown", portal: c.source_name || "unknown", reason: `Similaridade muito baixa (${similarity}/100)` });
        continue;
      }

      const pr2 = portalResults.find(p => p.portal_name === c.source_name || p.portal_code === c.source_name?.toLowerCase());
      if (pr2) pr2.urls_valid++;

      validComparables.push({
        title: c.title, price: c.price, area: c.area, price_per_sqm: priceSqm,
        bedrooms: c.bedrooms || 0, suites: c.suites || 0, parking_spots: c.parking_spots || 0,
        address: c.address || "", neighborhood: c.neighborhood || "",
        city: c.city || property.city || "", condominium: c.condominium || "",
        construction_standard: c.construction_standard || "", property_type: c.property_type || "",
        source_url: c.source_url || "", source_name: c.source_name || "",
        similarity_score: similarity, is_approved: true,
        raw_data: {
          advertiser: c.advertiser || null, differentials: c.differentials || [],
          description_summary: c.description_summary || "", validated_individually: true,
        },
      });
    }

    validComparables.sort((a, b) => b.similarity_score - a.similarity_score);
    const finalComparables = validComparables.slice(0, maxResults);

    console.log(`[FASE 3] ${finalComparables.length} comparáveis válidos finais`);
    
    // Log top 5 discarded by similarity for debugging
    const discardedBySimilarity = discardReasons
      .filter(d => d.reason.startsWith("Similaridade"))
      .slice(0, 5);
    if (discardedBySimilarity.length > 0) {
      console.log(`[FASE 3] Top ${discardedBySimilarity.length} descartados por similaridade:`,
        JSON.stringify(discardedBySimilarity));
    }

    // Pricing analysis
    let pricingAnalysis = null;
    if (finalComparables.length > 0) {
      const prices = finalComparables.map((c: any) => c.price);
      const pricesSqm = finalComparables.map((c: any) => c.price_per_sqm);
      const sorted = [...prices].sort((a: number, b: number) => a - b);
      const avg = Math.round(prices.reduce((a: number, b: number) => a + b, 0) / prices.length);
      const median = sorted.length % 2 === 0
        ? Math.round((sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2)
        : sorted[Math.floor(sorted.length / 2)];
      const avgSqm = Math.round(pricesSqm.reduce((a: number, b: number) => a + b, 0) / pricesSqm.length);
      
      pricingAnalysis = {
        avg_price: avg, median_price: median, avg_price_per_sqm: avgSqm,
        price_range_min: sorted[0], price_range_max: sorted[sorted.length - 1],
        suggested_ad_price: Math.round(median * 1.10),
        suggested_market_price: Math.round(median * 1.0),
        suggested_fast_sale_price: Math.round(median * 0.90),
      };
    }

    const researchMetadata = {
      portals_checked: portalResults,
      total_listings_found: mergedUrls.length,
      listings_opened: listingsOpened,
      listings_discarded: discardReasons.length,
      discard_reasons: discardReasons,
      filters_used: filters,
      collected_at: new Date().toISOString(),
      limitations,
    };

    console.log(`[RESULTADO] ${finalComparables.length} comparáveis, ${listingsOpened} links abertos, ${discardReasons.length} descartados`);

    // === Save comparables, adjustments and results directly to DB ===
    if (marketStudyId && finalComparables.length > 0) {
      console.log(`[DB] Inserindo ${finalComparables.length} comparáveis no banco...`);

      // Fetch subject property for adjustments
      const { data: subjectProps } = await supabase
        .from("market_study_subject_properties")
        .select("*")
        .eq("market_study_id", marketStudyId)
        .limit(1);
      const subjectProp = subjectProps?.[0] || null;

      const studyComparables = finalComparables.map((c: any) => ({
        market_study_id: marketStudyId,
        title: c.title || null,
        address: c.address || null,
        neighborhood: c.neighborhood || null,
        city: c.city || null,
        condominium: c.condominium || null,
        property_type: c.property_type || null,
        price: c.price || null,
        area: c.area || null,
        price_per_sqm: c.price_per_sqm || null,
        bedrooms: c.bedrooms || null,
        suites: c.suites || null,
        parking_spots: c.parking_spots || null,
        construction_standard: c.construction_standard || null,
        similarity_score: c.similarity_score || 0,
        source_name: c.source_name || null,
        source_url: c.source_url || null,
        is_approved: true,
        origin: "auto_firecrawl",
        raw_data: c.raw_data || null,
      }));

      const { data: insertedComps, error: insertErr } = await supabase
        .from("market_study_comparables")
        .insert(studyComparables)
        .select();

      if (insertErr) {
        console.error("[DB] Erro ao inserir comparáveis:", insertErr.message);
      } else {
        console.log(`[DB] ${insertedComps?.length || 0} comparáveis inseridos`);
      }

      // Calculate and insert adjustments if we have subject data
      if (insertedComps && insertedComps.length > 0 && subjectProp) {
        const allAdjustments: any[] = [];
        const adjustedPrices: { id: string; adjusted_price: number }[] = [];

        for (const comp of insertedComps) {
          const price = comp.price ?? 0;
          if (price <= 0) continue;

          const adjustments: any[] = [];

          // Suites difference
          const subSuites = subjectProp.suites ?? 0;
          const compSuites = comp.suites ?? 0;
          if (subSuites !== compSuites) {
            const diff = compSuites - subSuites;
            const pct = 2 * Math.abs(diff);
            adjustments.push({
              comparable_id: comp.id, adjustment_type: "suites",
              label: `Suítes (${diff > 0 ? "+" : ""}${diff})`,
              percentage: diff > 0 ? pct : -pct,
              value: Math.round(price * (pct / 100) * (diff > 0 ? 1 : -1)),
              direction: diff > 0 ? "positive" : "negative",
            });
          }

          // Parking difference
          const subParking = subjectProp.parking_spots ?? 0;
          const compParking = comp.parking_spots ?? 0;
          if (subParking !== compParking) {
            const diff = compParking - subParking;
            const pct = 1.5 * Math.abs(diff);
            adjustments.push({
              comparable_id: comp.id, adjustment_type: "parking",
              label: `Vagas (${diff > 0 ? "+" : ""}${diff})`,
              percentage: diff > 0 ? pct : -pct,
              value: Math.round(price * (pct / 100) * (diff > 0 ? 1 : -1)),
              direction: diff > 0 ? "positive" : "negative",
            });
          }

          // Area difference
          const subArea = subjectProp.area_land ?? subjectProp.area_built ?? subjectProp.area_useful ?? 0;
          const compArea = comp.area ?? 0;
          if (subArea > 0 && compArea > 0 && subArea !== compArea) {
            const diffPct = ((compArea - subArea) / subArea) * 100;
            if (Math.abs(diffPct) > 5) {
              const adjPct = Math.min(Math.abs(diffPct) * 0.15, 9);
              adjustments.push({
                comparable_id: comp.id, adjustment_type: "area",
                label: `Área (${diffPct > 0 ? "+" : ""}${diffPct.toFixed(0)}%)`,
                percentage: diffPct > 0 ? adjPct : -adjPct,
                value: Math.round(price * (adjPct / 100) * (diffPct > 0 ? 1 : -1)),
                direction: diffPct > 0 ? "positive" : "negative",
              });
            }
          }

          const totalAdj = adjustments.reduce((sum, a) => sum + a.value, 0);
          adjustedPrices.push({ id: comp.id, adjusted_price: Math.round(price + totalAdj) });
          allAdjustments.push(...adjustments);
        }

        if (allAdjustments.length > 0) {
          await supabase.from("market_study_adjustments").insert(allAdjustments);
        }

        // Update adjusted prices
        await Promise.all(
          adjustedPrices.map(ap =>
            supabase.from("market_study_comparables").update({ adjusted_price: ap.adjusted_price }).eq("id", ap.id)
          )
        );

        // Calculate and insert results
        const adjPrices = adjustedPrices.map(ap => ap.adjusted_price).filter(p => p > 0);
        const sortedPrices = [...adjPrices].sort((a, b) => a - b);
        const mid = Math.floor(sortedPrices.length / 2);
        const medianPrice = sortedPrices.length % 2 !== 0
          ? sortedPrices[mid]
          : Math.round((sortedPrices[mid - 1] + sortedPrices[mid]) / 2);
        const avgPrice = Math.round(adjPrices.reduce((a, b) => a + b, 0) / adjPrices.length);

        await supabase.from("market_study_results").insert({
          market_study_id: marketStudyId,
          avg_price: pricingAnalysis?.avg_price ?? avgPrice,
          median_price: pricingAnalysis?.median_price ?? medianPrice,
          avg_price_per_sqm: pricingAnalysis?.avg_price_per_sqm ?? 0,
          suggested_ad_price: pricingAnalysis?.suggested_ad_price ?? Math.round(medianPrice * 1.10),
          suggested_market_price: pricingAnalysis?.suggested_market_price ?? medianPrice,
          suggested_fast_sale_price: pricingAnalysis?.suggested_fast_sale_price ?? Math.round(medianPrice * 0.90),
          price_range_min: pricingAnalysis?.price_range_min ?? sortedPrices[0],
          price_range_max: pricingAnalysis?.price_range_max ?? sortedPrices[sortedPrices.length - 1],
          confidence_level: finalComparables.length >= 5 ? "high" : "medium",
          executive_summary: `Análise baseada em ${finalComparables.length} comparáveis reais coletados automaticamente.`,
          research_metadata: researchMetadata as any,
        });

        console.log(`[DB] Results e ${allAdjustments.length} adjustments salvos`);
      } else if (insertedComps && insertedComps.length > 0) {
        // No subject prop but we have comparables - save basic results
        await supabase.from("market_study_results").insert({
          market_study_id: marketStudyId,
          avg_price: pricingAnalysis?.avg_price ?? 0,
          median_price: pricingAnalysis?.median_price ?? 0,
          avg_price_per_sqm: pricingAnalysis?.avg_price_per_sqm ?? 0,
          suggested_ad_price: pricingAnalysis?.suggested_ad_price ?? 0,
          suggested_market_price: pricingAnalysis?.suggested_market_price ?? 0,
          suggested_fast_sale_price: pricingAnalysis?.suggested_fast_sale_price ?? 0,
          price_range_min: pricingAnalysis?.price_range_min ?? 0,
          price_range_max: pricingAnalysis?.price_range_max ?? 0,
          confidence_level: "medium",
          executive_summary: `Análise baseada em ${finalComparables.length} comparáveis reais.`,
          research_metadata: researchMetadata as any,
        });
      }

      // Try AI summary (non-fatal)
      try {
        const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") || Deno.env.get("SUPABASE_PUBLISHABLE_KEY") || "";
        const summaryResp = await fetch(
          `${supabaseUrl}/functions/v1/generate-market-summary`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
              "apikey": SUPABASE_ANON_KEY,
            },
            body: JSON.stringify({
              subject: subjectProp || property,
              comparables: finalComparables.slice(0, 10),
              result: pricingAnalysis,
            }),
          }
        );
        if (summaryResp.ok) {
          const aiSummary = await summaryResp.json();
          if (aiSummary?.executive_summary) {
            await supabase.from("market_study_results").update({
              executive_summary: aiSummary.executive_summary,
              justification: aiSummary.justification,
              market_insights: aiSummary.market_insights,
            }).eq("market_study_id", marketStudyId);
          }
        }
      } catch (aiErr) {
        console.warn("[DB] AI summary failed (non-fatal):", aiErr);
      }
    } else if (marketStudyId && finalComparables.length === 0) {
      // No comparables found - still save empty results
      await supabase.from("market_study_results").insert({
        market_study_id: marketStudyId,
        avg_price: 0, median_price: 0, avg_price_per_sqm: 0,
        suggested_ad_price: 0, suggested_market_price: 0, suggested_fast_sale_price: 0,
        confidence_level: "low",
        executive_summary: `Nenhum comparável válido encontrado. ${discardReasons.length} anúncios foram descartados.`,
        research_metadata: researchMetadata as any,
      });
    }

    if (marketStudyId) await updateStudyStatus("completed");

    return {
      success: true,
      comparables: finalComparables,
      research_metadata: researchMetadata,
      pricing_analysis: pricingAnalysis,
    };
  } catch (err) {
    console.error("processMarketAnalysis error:", err);
    // Always update status to failed so it doesn't stay stuck in "processing"
    try {
      if (marketStudyId) {
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const sb = createClient(supabaseUrl, supabaseServiceKey);
        await sb.from("market_studies").update({ status: "failed" }).eq("id", marketStudyId);
      }
    } catch (statusErr) {
      console.error("Failed to update study status to failed:", statusErr);
    }
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

// ============================================================
// HTTP Handler — returns 202 immediately, processes in background
// ============================================================
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { property, portals, filters, market_study_id } = (await req.json()) as {
      property: PropertyData;
      portals: PortalInfo[];
      filters: Filters;
      market_study_id?: string;
    };

    const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");
    if (!FIRECRAWL_API_KEY) {
      return new Response(
        JSON.stringify({ success: false, error: "FIRECRAWL_API_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ success: false, error: "LOVABLE_API_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const studyId = market_study_id || null;

    // If market_study_id is provided, run in background and return 202 immediately
    if (studyId) {
      // Use EdgeRuntime.waitUntil for background processing
      const backgroundPromise = processMarketAnalysis(
        property, portals, filters, studyId, FIRECRAWL_API_KEY, LOVABLE_API_KEY
      );

      // Try EdgeRuntime.waitUntil if available (Supabase Edge Runtime)
      try {
        (EdgeRuntime as any).waitUntil(backgroundPromise);
      } catch {
        // Fallback: just fire and forget (the promise runs in background anyway in Deno)
        backgroundPromise.catch(err => console.error("Background processing failed:", err));
      }

      return new Response(
        JSON.stringify({ success: true, message: "Processing started in background", market_study_id: studyId }),
        { status: 202, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // No market_study_id — run synchronously (legacy mode)
    const result = await processMarketAnalysis(
      property, portals, filters, null, FIRECRAWL_API_KEY, LOVABLE_API_KEY
    );

    const statusCode = result.success === false ? 500 : 200;
    return new Response(
      JSON.stringify(result),
      { status: statusCode, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("analyze-market-deep error:", err);
    return new Response(
      JSON.stringify({ success: false, error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
