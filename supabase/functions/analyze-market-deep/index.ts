import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
  // Include condominium name in search query when available (Bug 3 fix)
  if (property.condominium) parts.push(property.condominium);
  if (property.neighborhood) parts.push(property.neighborhood);
  if (property.city) parts.push(property.city);
  const purpose = property.property_purpose?.toLowerCase();
  parts.push(purpose === "aluguel" || purpose === "rent" ? "aluguel" : "venda");
  const siteFilter = getPortalSiteFilter(portal.code, purpose);
  if (siteFilter) parts.push(siteFilter);
  return parts.join(" ");
}

// Check if URL is an individual listing (not a search/listing page)
function isIndividualListingUrl(url: string): boolean {
  return /\/imovel\//i.test(url) || /\/propriedades\//i.test(url);
}

// Remove accents and normalize for URL slugs
function slugify(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

// Map property types to portal-specific slugs
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

// Build native search URL for each portal
function buildPortalNativeUrl(property: PropertyData, portal: PortalInfo): string | null {
  const city = slugify(property.city || "");
  const neighborhood = slugify(property.neighborhood || "");
  const purpose = property.property_purpose?.toLowerCase();
  const isRental = purpose === "aluguel" || purpose === "rent";
  const purposeSlug = isRental ? "aluguel" : "venda";
  const typeSlug = getPropertyTypeSlug(property.property_type, portal.code);
  const bedrooms = property.bedrooms || "";

  if (!city || !neighborhood) return null;

  // State code — default to "sp" if not available
  const state = slugify(property.state || "sp");

  switch (portal.code) {
    case "zap":
      // zapimoveis.com.br/venda/apartamentos/sp+sorocaba+parque-campolim/
      return `https://www.zapimoveis.com.br/${purposeSlug}/${typeSlug}/${state}+${city}+${neighborhood}/`;

    case "vivareal": {
      // vivareal.com.br/venda/sp/sorocaba/parque-campolim/apartamento_residencial/
      const baseVivaUrl = `https://www.vivareal.com.br/${purposeSlug}/${state}/${city}/${neighborhood}/apartamento_residencial/`;
      // When condominium is specified, add it as a filter parameter
      if (property.condominium) {
        const condoSlug = slugify(property.condominium);
        return `${baseVivaUrl}?filtro=condominium:${condoSlug}`;
      }
      return baseVivaUrl;
    }

    case "kenlo":
      // portal.kenlo.com.br/imoveis/a-venda/apartamento/sorocaba/parque-campolim?quartos=3+
      const kenloAction = isRental ? "para-alugar" : "a-venda";
      let kenloUrl = `https://portal.kenlo.com.br/imoveis/${kenloAction}/${typeSlug}/${city}/${neighborhood}`;
      if (bedrooms) kenloUrl += `?quartos=${bedrooms}+`;
      return kenloUrl;

    case "olx":
      // olx.com.br/imoveis/venda/apartamentos/estado-sp/sorocaba-e-regiao/parque-campolim
      return `https://www.olx.com.br/imoveis/${purposeSlug}/${typeSlug}/estado-${state}/${city}-e-regiao/${neighborhood}`;

    case "imovelweb":
      // imovelweb.com.br/apartamentos-venda-parque-campolim-sorocaba.html
      return `https://www.imovelweb.com.br/${typeSlug}-${purposeSlug}-${neighborhood}-${city}.html`;

    default:
      return null;
  }
}

// Detect multi-listing pages (condominium, search results, etc.)
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

// Check if markdown content looks like multiple listings
function looksLikeMultiListing(markdown: string): boolean {
  const priceMatches = markdown.match(/R\$\s*[\d.,]+/g) || [];
  const areaMatches = markdown.match(/\d+\s*m²/g) || [];
  return priceMatches.length >= 3 && areaMatches.length >= 3 && markdown.length > 2000;
}

// Extract individual listing URLs from a list of links for a given portal
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

// Generate pagination URLs from a multi-listing URL
// e.g. ?pagina=2 → also fetch pagina=1, pagina=3 (up to MAX_PAGES)
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
    // No pagination param yet — add pagina=1..maxPages
    const separator = url.includes("?") ? "&" : "?";
    for (let p = 1; p <= Math.min(maxPages, 3); p++) {
      urls.push(`${url}${separator}pagina=${p}`);
    }
  }

  // Deduplicate and exclude the original URL
  const normalized = url.replace(/\/$/, "").toLowerCase();
  return [...new Set(urls)]
    .filter(u => u.replace(/\/$/, "").toLowerCase() !== normalized);
}

// Deduplicate by address+area+price similarity
function isDuplicate(
  comp: any,
  existing: any[]
): boolean {
  for (const e of existing) {
    const samePrice = e.price && comp.price && Math.abs(e.price - comp.price) / Math.max(e.price, 1) < 0.03;
    const sameArea = e.area && comp.area && Math.abs(e.area - comp.area) / Math.max(e.area, 1) < 0.05;
    if (samePrice && sameArea) return true;
  }
  return false;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { property, portals, filters } = (await req.json()) as {
      property: PropertyData;
      portals: PortalInfo[];
      filters: Filters;
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

    const searchablePortals = portals.filter((p) => PORTAL_SITE_MAP[p.code] || p.code === "olx");
    const portalResults: PortalResult[] = [];
    const discardReasons: DiscardReason[] = [];
    const limitations: string[] = [];

    if (searchablePortals.length === 0) {
      limitations.push("Nenhum portal com mapeamento de busca configurado");
      return new Response(
        JSON.stringify({
          success: true,
          comparables: [],
          research_metadata: {
            portals_checked: portalResults,
            total_listings_found: 0,
            listings_opened: 0,
            listings_discarded: 0,
            discard_reasons: discardReasons,
            filters_used: filters,
            collected_at: new Date().toISOString(),
            limitations,
          },
          pricing_analysis: null,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Usar todos os portais configurados — sem limite
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

        // Filter links that look like individual property listings
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

        // Fallback: use AI to extract URLs from markdown
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
    // FASE 1B: Busca via Google (Firecrawl Search) — em paralelo
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

    // Merge native + Google URLs, deduplicating by URL
    const seenUrls = new Set<string>();
    const mergedUrls: Array<{ url: string; title: string; portal: PortalInfo; snippet: string }> = [];
    for (const item of [...nativeUrls, ...googleUrls]) {
      const normalized = item.url.replace(/\/$/, "").toLowerCase();
      if (!seenUrls.has(normalized)) {
        seenUrls.add(normalized);
        mergedUrls.push(item);
      }
    }

    console.log(`[FASE 1] Total merged: ${mergedUrls.length} URLs únicas (${nativeUrls.length} nativo + ${googleUrls.length} Google)`);

    // Update portal results with native counts
    for (const pr of portalResults) {
      const nativeCount = nativeUrls.filter(u => u.portal.code === pr.portal_code).length;
      pr.urls_found += nativeCount;
    }

    if (mergedUrls.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          comparables: [],
          research_metadata: {
            portals_checked: portalResults,
            total_listings_found: 0,
            listings_opened: 0,
            listings_discarded: 0,
            discard_reasons: discardReasons,
            filters_used: filters,
            collected_at: new Date().toISOString(),
            limitations: [...limitations, "Nenhum resultado encontrado nos portais"],
          },
          pricing_analysis: null,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ==========================================
    // FASE 2: Validação individual (Firecrawl Scrape + AI extraction)
    // ==========================================
    console.log(`[FASE 2] Abrindo ${mergedUrls.length} URLs individualmente...`);

    const maxUrlsToScrape = Math.min(mergedUrls.length, 25);
    if (mergedUrls.length > maxUrlsToScrape) {
      limitations.push(`Limitado a ${maxUrlsToScrape} de ${mergedUrls.length} URLs para respeitar timeout`);
    }
    const urlsToProcess = mergedUrls.slice(0, maxUrlsToScrape);

    const scrapedPages: Array<{
      url: string;
      portal: PortalInfo;
      markdown: string;
      status: "ok" | "failed";
    }> = [];

    let listingsOpened = 0;

    // Track URLs already seen to avoid re-scraping expanded URLs
    const scrapedUrlSet = new Set<string>();

    for (const item of urlsToProcess) {
      try {
        const isMultiListing = isMultiListingUrl(item.url);
        console.log(`[FASE 2] Scraping${isMultiListing ? " (multi-listing)" : ""}: ${item.url.substring(0, 80)}...`);
        listingsOpened++;

        // Update portal stats
        const pr = portalResults.find(p => p.portal_code === item.portal.code);
        if (pr) pr.urls_opened++;

        // For multi-listing pages, also request links to extract individual URLs
        const formats = isMultiListing ? ["markdown", "links"] : ["markdown"];

        const scrapeRes = await fetch("https://api.firecrawl.dev/v1/scrape", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${FIRECRAWL_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            url: item.url,
            formats,
            onlyMainContent: true,
            waitFor: isMultiListing ? 5000 : 2000,
          }),
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
        const markdown = scrapeData.data?.markdown || scrapeData.markdown || "";
        const links: string[] = scrapeData.data?.links || scrapeData.links || [];

        if (!markdown || markdown.length < 100) {
          discardReasons.push({
            url: item.url,
            portal: item.portal.name,
            reason: "Conteúdo insuficiente ou página vazia",
          });
          continue;
        }

        // Check for expired/unavailable markers
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

        // Multi-listing handling: try to expand into individual URLs
        if (!isIndividualListingUrl(item.url) && (isMultiListing || looksLikeMultiListing(markdown))) {
          // Collect individual URLs from this page
          let allIndividualUrls = extractIndividualListingUrls(links, item.portal.code);
          
          // Auto-pagination: scrape adjacent pages to find more listings
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
                
                // If no individual URLs but has content, save as multi-listing for AI
                if (pageListingUrls.length === 0 && pageMd.length > 500 && looksLikeMultiListing(pageMd)) {
                  scrapedPages.push({
                    url: pageUrl,
                    portal: item.portal,
                    markdown: pageMd.substring(0, 12000),
                    status: "ok",
                    isMultiListing: true,
                  } as any);
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
            // Found individual listing URLs — scrape each one
            const MAX_EXPANDED = 20;
            const newUrls = allIndividualUrls
              .filter(u => !scrapedUrlSet.has(u.replace(/\/$/, "").toLowerCase()))
              .slice(0, MAX_EXPANDED);
            
            console.log(`[FASE 2] Multi-listing expandido: ${allIndividualUrls.length} URLs totais (com paginação), ${newUrls.length} novas para scrape`);
            
            for (const expandedUrl of newUrls) {
              const normalized = expandedUrl.replace(/\/$/, "").toLowerCase();
              if (scrapedUrlSet.has(normalized)) continue;
              scrapedUrlSet.add(normalized);
              
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
                  });
                }
              } catch (expandErr) {
                console.warn(`[FASE 2] Expanded scrape failed: ${expandedUrl}`, expandErr);
              }
            }
            
            continue;
          }
          
          // No individual URLs found — treat the whole page as multi-listing for AI extraction
          console.log(`[FASE 2] Multi-listing sem URLs individuais — enviando para IA como listagem múltipla`);
          scrapedPages.push({
            url: item.url,
            portal: item.portal,
            markdown: markdown.substring(0, 12000), // More content for multi-listing
            status: "ok",
            isMultiListing: true,
          } as any);
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
      return new Response(
        JSON.stringify({
          success: true,
          comparables: [],
          research_metadata: {
            portals_checked: portalResults,
            total_listings_found: mergedUrls.length,
            listings_opened: listingsOpened,
            listings_discarded: discardReasons.length,
            discard_reasons: discardReasons,
            filters_used: filters,
            collected_at: new Date().toISOString(),
            limitations: [...limitations, "Nenhuma página válida após validação individual"],
          },
          pricing_analysis: null,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ==========================================
    // FASE 3: Scoring e análise (Lovable AI)
    // ==========================================
    console.log(`[FASE 3] Extraindo dados de ${scrapedPages.length} páginas com IA...`);

    const hasMultiListingPages = scrapedPages.some((p: any) => p.isMultiListing);

    const combinedContent = scrapedPages
      .map(
        (p: any, i: number) => {
          const label = p.isMultiListing
            ? `--- LISTAGEM MÚLTIPLA ${i + 1} (Portal: ${p.portal.name}, URL: ${p.url}) ---`
            : `--- Anúncio ${i + 1} (Portal: ${p.portal.name}, URL: ${p.url}) ---`;
          return `${label}\n${p.markdown}`;
        }
      )
      .join("\n\n");

    const multiListingInstructions = hasMultiListingPages
      ? `\n\nATENÇÃO - LISTAGENS MÚLTIPLAS:
- Blocos marcados "--- LISTAGEM MÚLTIPLA ---" contêm VÁRIOS imóveis numa mesma página (ex: página de condomínio).
- Extraia CADA imóvel individualmente como um comparável separado.
- Use a URL da página como source_url para todos os imóveis extraídos da mesma listagem.
- NÃO trate a página inteira como um único imóvel.`
      : "";

    const systemPrompt = `Você é um perito avaliador imobiliário brasileiro. Analise CADA anúncio individualmente e extraia dados estruturados.

REGRAS CRÍTICAS:
- Cada bloco "--- Anúncio X ---" é UM anúncio individual já validado (página aberta e verificada).${multiListingInstructions}
- Extraia EXATAMENTE os dados que estão no anúncio. NÃO invente dados.
- Se um dado não está claro, use null/0.
- Preços no formato "R$ 1.200.000" → converta para número 1200000.
- Áreas "120 m²" → número 120.
- Inclua o URL EXATO do anúncio no campo source_url.
- Inclua o nome do portal no campo source_name.
- Se um dado não está claro, use null/0.
- Preços no formato "R$ 1.200.000" → converta para número 1200000.
- Áreas "120 m²" → número 120.
- Inclua o URL EXATO do anúncio no campo source_url.
- Inclua o nome do portal no campo source_name.

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
Extraia com atenção TODOS os diferenciais e comodidades do imóvel e do condomínio. Exemplos:
Piscina, Academia, Churrasqueira, Sauna, Salão de Festas, Playground, Portaria 24h, Elevador, 
Varanda/Sacada, Área Gourmet, Mobiliado, Planejados, Vista Privilegiada, Energia Solar, Automação,
Quadra, Brinquedoteca, Jardim, Lavabo, Closet, Ar Condicionado, Lareira, Coworking, Pet Place, Spa.
Inclua no campo "differentials" como array de strings. Se não houver diferenciais mencionados, retorne array vazio.

IMPORTANTE: Extraia também a data do anúncio (listing_date) quando disponível. Procure por textos como "Anúncio criado em", "Publicado em", "Atualizado em", "Atualizado há X dias/meses", datas no formato DD/MM/YYYY ou similar. Se encontrar "Atualizado há 3 meses", calcule a data aproximada. Retorne no formato YYYY-MM-DD.

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
                        title: { type: "string", description: "Título do anúncio" },
                        price: { type: "number", description: "Preço em reais (número inteiro)" },
                        area: { type: "number", description: "Área em m²" },
                        bedrooms: { type: "number", description: "Quartos" },
                        suites: { type: "number", description: "Suítes" },
                        parking_spots: { type: "number", description: "Vagas" },
                        address: { type: "string", description: "Endereço" },
                        neighborhood: { type: "string", description: "Bairro" },
                        city: { type: "string", description: "Cidade" },
                        condominium: { type: "string", description: "Nome do condomínio" },
                        construction_standard: { type: "string", description: "Padrão construtivo" },
                        property_type: { type: "string", description: "Tipo do imóvel" },
                        source_url: { type: "string", description: "URL exata do anúncio" },
                        source_name: { type: "string", description: "Nome do portal" },
                        advertiser: { type: "string", description: "Imobiliária ou anunciante" },
                        differentials: { type: "array", items: { type: "string" }, description: "Diferenciais do imóvel" },
                        description_summary: { type: "string", description: "Resumo curto da descrição" },
                        listing_date: { type: "string", description: "Data do anúncio no formato YYYY-MM-DD, se disponível" },
                      },
                      required: ["title", "price", "area", "source_url", "source_name"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["comparables"],
                additionalProperties: false,
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
      const status = aiRes.status;
      return new Response(
        JSON.stringify({
          success: false,
          error: status === 429 ? "Rate limit exceeded" : status === 402 ? "AI credits exhausted" : "AI extraction failed",
        }),
        { status: status === 429 || status === 402 ? status : 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiData = await aiRes.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      console.error("[FASE 3] No tool call in AI response");
      return new Response(
        JSON.stringify({
          success: true,
          comparables: [],
          research_metadata: {
            portals_checked: portalResults,
            total_listings_found: mergedUrls.length,
            listings_opened: listingsOpened,
            listings_discarded: discardReasons.length,
            discard_reasons: discardReasons,
            filters_used: filters,
            collected_at: new Date().toISOString(),
            limitations: [...limitations, "IA não conseguiu extrair dados estruturados"],
          },
          pricing_analysis: null,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let extracted: { comparables: any[] };
    try {
      extracted = JSON.parse(toolCall.function.arguments);
      console.log(`[FASE 3] AI extraiu ${extracted.comparables?.length || 0} comparáveis`);
    } catch {
      console.error("[FASE 3] Failed to parse AI response");
      return new Response(
        JSON.stringify({ success: true, comparables: [], research_metadata: {
          portals_checked: portalResults, total_listings_found: mergedUrls.length,
          listings_opened: listingsOpened, listings_discarded: discardReasons.length,
          discard_reasons: discardReasons, filters_used: filters,
          collected_at: new Date().toISOString(), limitations: [...limitations, "Erro ao processar resposta da IA"],
        }, pricing_analysis: null }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Filter valid, compute similarity, deduplicate
    const baseArea = Number(property.area_total || property.area_built || property.area_land) || 100;
    const baseBedrooms = Number(property.bedrooms) || 3;
    const baseSuites = Number(property.suites) || 0;
    const baseParking = Number(property.parking_spots) || 0;
    const basePriceSqm = property.owner_expected_price ? Number(property.owner_expected_price) / baseArea : 0;

    const validComparables: any[] = [];

    const maxAgeMonths = Number(filters.maxListingAgeMonths) || 0;
    const cutoffDate = maxAgeMonths > 0
      ? new Date(Date.now() - maxAgeMonths * 30 * 24 * 60 * 60 * 1000)
      : null;

    for (const c of (extracted.comparables || [])) {
      if (!c.price || c.price <= 0 || !c.area || c.area <= 0) {
        discardReasons.push({
          url: c.source_url || "unknown",
          portal: c.source_name || "unknown",
          reason: "Preço ou área não disponível",
        });
        continue;
      }

      // Filter by listing age
      if (cutoffDate && c.listing_date) {
        const listingDate = new Date(c.listing_date);
        if (!isNaN(listingDate.getTime()) && listingDate < cutoffDate) {
          const ageMonths = Math.round((Date.now() - listingDate.getTime()) / (30 * 24 * 60 * 60 * 1000));
          discardReasons.push({
            url: c.source_url || "unknown",
            portal: c.source_name || "unknown",
            reason: `Anúncio muito antigo (criado há ${ageMonths} meses)`,
          });
          continue;
        }
      }

      if (isDuplicate(c, validComparables)) {
        discardReasons.push({
          url: c.source_url || "unknown",
          portal: c.source_name || "unknown",
          reason: "Duplicata (mesmo imóvel em outro portal)",
        });
        continue;
      }

      const priceSqm = Math.round(c.price / c.area);
      const isSameCondo = property.condominium && c.condominium &&
        c.condominium.toLowerCase().includes(property.condominium.toLowerCase());

      // Similarity scoring
      let score = 0;
      if (isSameCondo) score += 25;
      if (c.neighborhood && property.neighborhood &&
        c.neighborhood.toLowerCase().includes(property.neighborhood.toLowerCase())) score += 20;
      if (c.property_type && property.property_type &&
        c.property_type.toLowerCase().includes(property.property_type.toLowerCase())) score += 15;
      
      // Area score
      const areaDiff = Math.abs(c.area - baseArea) / baseArea;
      if (areaDiff <= 0.05) score += 15;
      else if (areaDiff <= 0.10) score += 12;
      else if (areaDiff <= 0.20) score += 8;
      else if (areaDiff <= 0.30) score += 3;

      // Rooms score
      const bedroomDiff = Math.abs((c.bedrooms || 0) - baseBedrooms);
      const suiteDiff = Math.abs((c.suites || 0) - baseSuites);
      const parkingDiff = Math.abs((c.parking_spots || 0) - baseParking);
      const roomsAvg = [bedroomDiff, suiteDiff, parkingDiff].filter(d => d >= 0);
      const avgDiff = roomsAvg.reduce((a, b) => a + b, 0) / roomsAvg.length;
      if (avgDiff === 0) score += 10;
      else if (avgDiff <= 1) score += 6;
      else if (avgDiff <= 2) score += 2;

      // Standard
      if (c.construction_standard && property.property_standard &&
        c.construction_standard.toLowerCase().includes(property.property_standard.toLowerCase())) score += 10;

      // Differentials overlap
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

      // City match + profile bonus
      if (c.city && property.city &&
        c.city.toLowerCase().includes(property.city.toLowerCase()) && score >= 30) score += 5;

      const similarity = Math.min(100, Math.round(score));

      // Minimum similarity filter — lower threshold when focusing on same condominium
      const minSimilarity = (filters?.preferSameCondominium && property.condominium) ? 25 : 40;
      if (similarity < minSimilarity) {
        discardReasons.push({
          url: c.source_url || "unknown",
          portal: c.source_name || "unknown",
          reason: `Similaridade muito baixa (${similarity}/100)`,
        });
        continue;
      }

      // Update portal valid count
      const pr = portalResults.find(p => p.portal_name === c.source_name || p.portal_code === c.source_name?.toLowerCase());
      if (pr) pr.urls_valid++;

      validComparables.push({
        title: c.title,
        price: c.price,
        area: c.area,
        price_per_sqm: priceSqm,
        bedrooms: c.bedrooms || 0,
        suites: c.suites || 0,
        parking_spots: c.parking_spots || 0,
        address: c.address || "",
        neighborhood: c.neighborhood || "",
        city: c.city || property.city || "",
        condominium: c.condominium || "",
        construction_standard: c.construction_standard || "",
        property_type: c.property_type || "",
        source_url: c.source_url || "",
        source_name: c.source_name || "",
        similarity_score: similarity,
        is_approved: true,
        raw_data: {
          advertiser: c.advertiser || null,
          differentials: c.differentials || [],
          description_summary: c.description_summary || "",
          validated_individually: true,
        },
      });
    }

    // Sort by similarity and limit
    validComparables.sort((a, b) => b.similarity_score - a.similarity_score);
    const finalComparables = validComparables.slice(0, maxResults);

    console.log(`[FASE 3] ${finalComparables.length} comparáveis válidos finais`);

    // Pricing analysis
    let pricingAnalysis = null;
    if (finalComparables.length > 0) {
      const prices = finalComparables.map(c => c.price);
      const pricesSqm = finalComparables.map(c => c.price_per_sqm);
      const sorted = [...prices].sort((a, b) => a - b);
      const avg = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length);
      const median = sorted.length % 2 === 0
        ? Math.round((sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2)
        : sorted[Math.floor(sorted.length / 2)];
      const avgSqm = Math.round(pricesSqm.reduce((a, b) => a + b, 0) / pricesSqm.length);
      
      const suggestedMarket = Math.round(median * 1.0);
      const suggestedAd = Math.round(median * 1.10);
      const suggestedFast = Math.round(median * 0.90);

      pricingAnalysis = {
        avg_price: avg,
        median_price: median,
        avg_price_per_sqm: avgSqm,
        price_range_min: sorted[0],
        price_range_max: sorted[sorted.length - 1],
        suggested_ad_price: suggestedAd,
        suggested_market_price: suggestedMarket,
        suggested_fast_sale_price: suggestedFast,
      };
    }

    // Build research metadata
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

    return new Response(
      JSON.stringify({
        success: true,
        comparables: finalComparables,
        research_metadata: researchMetadata,
        pricing_analysis: pricingAnalysis,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("analyze-market-deep error:", err);
    return new Response(
      JSON.stringify({ success: false, error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
