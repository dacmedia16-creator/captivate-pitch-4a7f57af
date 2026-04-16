import { Inngest } from "https://esm.sh/inngest@4.2.2";
import { serve } from "https://esm.sh/inngest@4.2.2/edge";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

// ============================================================
// Types
// ============================================================
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

interface UrlItem {
  url: string;
  title: string;
  portal: PortalInfo;
  snippet: string;
}

interface ScrapedPage {
  url: string;
  portal: PortalInfo;
  markdown: string;
  status: "ok" | "failed";
  isMultiListing?: boolean;
  isCondoTarget?: boolean;
  extractedData?: {
    title?: string;
    price?: number;
    area?: number;
    bedrooms?: number;
    suites?: number;
    parking_spots?: number;
    bathrooms?: number;
    address?: string;
    neighborhood?: string;
    city?: string;
    condominium?: string;
    external_id?: string;
    description?: string;
  };
}

// ============================================================
// Utility functions
// ============================================================
async function fetchWithRetry(
  url: string,
  options: RequestInit,
  maxRetries = 3,
  baseDelayMs = 2000,
): Promise<Response> {
  let lastError: Error | null = null;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const res = await fetch(url, options);
      if (res.ok || (res.status >= 400 && res.status < 500 && res.status !== 429)) return res;
      if (attempt < maxRetries) {
        const delay = baseDelayMs * Math.pow(2, attempt);
        console.log(`[RETRY] Attempt ${attempt + 1}/${maxRetries}, waiting ${delay}ms (status: ${res.status})`);
        await new Promise(r => setTimeout(r, delay));
      } else return res;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      if (attempt < maxRetries) {
        const delay = baseDelayMs * Math.pow(2, attempt);
        console.log(`[RETRY] Attempt ${attempt + 1}/${maxRetries}, waiting ${delay}ms (error: ${lastError.message})`);
        await new Promise(r => setTimeout(r, delay));
      }
    }
  }
  throw lastError || new Error("fetchWithRetry: all attempts failed");
}

const PORTAL_SITE_MAP: Record<string, string> = {
  zap: "site:zapimoveis.com.br",
  vivareal: "site:vivareal.com.br",
  olx_venda: "site:olx.com.br/imoveis/venda",
  olx_aluguel: "site:olx.com.br/imoveis/aluguel",
  imovelweb: "site:imovelweb.com.br",
  chavesnamao: "site:chavesnamao.com.br",
};

function getPortalSiteFilter(portalCode: string, purpose?: string): string | undefined {
  if (portalCode === "olx") {
    const isRental = purpose === "aluguel" || purpose === "rent";
    return isRental ? PORTAL_SITE_MAP.olx_aluguel : PORTAL_SITE_MAP.olx_venda;
  }
  return PORTAL_SITE_MAP[portalCode];
}

function buildSearchQuery(property: PropertyData, portal: PortalInfo, _filters?: Filters): string {
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
  return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "").replace(/^-+|-+$/g, "");
}

function getPropertyTypeSlug(type: string | undefined, portal: string): string {
  const t = (type || "apartamento").toLowerCase();
  if (portal === "zap" || portal === "vivareal") {
    if (t.includes("casa")) return "casas";
    if (t.includes("cobertura")) return "coberturas";
    if (t.includes("terreno")) return "terrenos";
    return "apartamentos";
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
      return null; // ZAP não aceita o formato de URL com +, retorna showcase de RJ
    case "vivareal":
      return `https://www.vivareal.com.br/${purposeSlug}/${state}/${city}/${neighborhood}/${typeSlug}_residencial/`;
    case "olx":
      return null; // OLX não suporta filtro por cidade via URL — usar apenas Google Search
    case "imovelweb":
      return `https://www.imovelweb.com.br/${typeSlug}-${purposeSlug}-${neighborhood}-${city}.html`;
    default:
      return null;
  }
}

function isMultiListingUrl(url: string): boolean {
  return [/\/condominio\//i, /\/busca\//i, /\/resultado\//i, /[?&]pagina=/i, /[?&]page=/i].some(p => p.test(url));
}

function looksLikeMultiListing(markdown: string): boolean {
  const priceMatches = markdown.match(/R\$\s*[\d.,]+/g) || [];
  const areaMatches = markdown.match(/\d+\s*m²/g) || [];
  return priceMatches.length >= 3 && areaMatches.length >= 3 && markdown.length > 2000;
}

function extractIndividualListingUrls(links: string[], portalCode: string, markdown?: string): string[] {
  const listingPatterns: Record<string, RegExp> = {
    zap: /zapimoveis\.com\.br\/imovel\//, vivareal: /vivareal\.com\.br\/imovel\//,
    olx: /olx\.com\.br\/d\/anuncio\//,
    imovelweb: /imovelweb\.com\.br\/propriedades\//,
  };
  const pattern = listingPatterns[portalCode];
  if (!pattern) return [];
  let allLinks = [...links];
  if (markdown) {
    const mdRegex = /\]\((https?:\/\/[^\s)]+)\)/g;
    let m;
    while ((m = mdRegex.exec(markdown)) !== null) allLinks.push(m[1]);
  }
  return [...new Set(allLinks.filter(l => pattern.test(l)))];
}

function generatePaginationUrls(url: string, maxPages = 5): string[] {
  const urls: string[] = [];
  const paginaMatch = url.match(/([?&])pagina=(\d+)/i);
  const pageMatch = url.match(/([?&])page=(\d+)/i);
  if (paginaMatch) {
    const cp = parseInt(paginaMatch[2], 10);
    const sp = Math.max(1, cp - 1), ep = Math.min(cp + Math.max(2, maxPages - 2), sp + maxPages - 1);
    for (let p = sp; p <= ep; p++) urls.push(url.replace(/([?&])pagina=\d+/i, `$1pagina=${p}`));
  } else if (pageMatch) {
    const cp = parseInt(pageMatch[2], 10);
    const sp = Math.max(1, cp - 1), ep = Math.min(cp + Math.max(2, maxPages - 2), sp + maxPages - 1);
    for (let p = sp; p <= ep; p++) urls.push(url.replace(/([?&])page=\d+/i, `$1page=${p}`));
  } else if (/\/condominio\//i.test(url) || /\/busca\//i.test(url)) {
    const sep = url.includes("?") ? "&" : "?";
    for (let p = 1; p <= Math.min(maxPages, 3); p++) urls.push(`${url}${sep}pagina=${p}`);
  }
  const normalized = url.replace(/\/$/, "").toLowerCase();
  return [...new Set(urls)].filter(u => u.replace(/\/$/, "").toLowerCase() !== normalized);
}

function isDuplicate(comp: any, existing: any[]): boolean {
  for (const e of existing) {
    const samePrice = e.price && comp.price && Math.abs(e.price - comp.price) / Math.max(e.price, 1) < 0.03;
    const sameArea = e.area && comp.area && Math.abs(e.area - comp.area) / Math.max(e.area, 1) < 0.05;
    if (samePrice && sameArea) return true;
  }
  return false;
}

function isWrongCityUrl(url: string, targetCity: string | undefined): boolean {
  if (!targetCity) return false;
  const targetSlug = slugify(targetCity);
  if (!targetSlug) return false;
  const urlLower = url.toLowerCase();
  if (urlLower.includes(targetSlug)) return false;
  const knownCities = [
    "rio-de-janeiro","sao-paulo","belo-horizonte","curitiba","porto-alegre","salvador","brasilia",
    "fortaleza","recife","manaus","goiania","campinas","santos","guarulhos","niteroi","sorocaba",
    "jundiai","piracicaba","bauru","ribeirao-preto","uberlandia","joinville","florianopolis",
    "londrina","maringa","osasco","santo-andre","sao-bernardo","sao-jose-dos-campos",
    "mogi-das-cruzes","diadema","carapicuiba","maua","suzano","taubate","limeira","franca",
    "praia-grande","sao-vicente","americana","itu","indaiatuba","tatui","votorantim",
  ];
  for (const city of knownCities) {
    if (city === targetSlug) continue;
    if (urlLower.includes(`/${city}/`) || urlLower.includes(`/${city}?`) || urlLower.includes(`/${city}-e-regiao`) ||
        urlLower.includes(`+${city}+`) || urlLower.includes(`+${city}/`) || urlLower.includes(`-${city}-`)) return true;
  }
  return false;
}

// ============================================================
// Step 1: collectUrls — Fase 1A (native scrape) + 1B (Google)
// ============================================================
async function collectUrls(
  property: PropertyData, portals: PortalInfo[], filters: Filters,
  FIRECRAWL_API_KEY: string, LOVABLE_API_KEY: string,
): Promise<{ urls: UrlItem[]; portalResults: PortalResult[]; discardReasons: DiscardReason[]; limitations: string[] }> {
  const searchablePortals = portals.filter((p) => PORTAL_SITE_MAP[p.code] || p.code === "olx");
  const portalResults: PortalResult[] = [];
  const discardReasons: DiscardReason[] = [];
  const limitations: string[] = [];

  if (searchablePortals.length === 0) {
    limitations.push("Nenhum portal com mapeamento de busca configurado");
    return { urls: [], portalResults, discardReasons, limitations };
  }

  const limitedPortals = searchablePortals;
  const maxResults = Math.min(Number(filters.maxComparables) || 15, 20);
  const resultsPerPortal = Math.max(5, Math.min(Math.ceil((maxResults * 2) / limitedPortals.length), 10));

  // FASE 1A: Scrape nativo
  console.log(`[INNGEST][FASE 1A] Scraping nativo em ${limitedPortals.length} portais...`);
  const nativeUrls: UrlItem[] = [];

  const nativeScrapeResults = await Promise.allSettled(limitedPortals.map(async (portal) => {
    const nativeUrl = buildPortalNativeUrl(property, portal);
    if (!nativeUrl) return { urls: [] as UrlItem[], limitation: null as string | null };
    console.log(`[INNGEST][FASE 1A] ${portal.name}: ${nativeUrl}`);
    try {
      const scrapeRes = await fetchWithRetry("https://api.firecrawl.dev/v1/scrape", {
        method: "POST", headers: { Authorization: `Bearer ${FIRECRAWL_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ url: nativeUrl, formats: ["markdown", "links"], onlyMainContent: true, waitFor: 5000 }),
      });
      if (!scrapeRes.ok) { const s = scrapeRes.status; await scrapeRes.text(); return { urls: [] as UrlItem[], limitation: `${portal.name}: scrape nativo falhou (${s})` }; }
      const scrapeData = await scrapeRes.json();
      const links: string[] = scrapeData.data?.links || scrapeData.links || [];
      const markdown: string = scrapeData.data?.markdown || scrapeData.markdown || "";
      const listingPatterns: Record<string, RegExp> = { zap: /zapimoveis\.com\.br\/imovel\//, vivareal: /vivareal\.com\.br\/imovel\//, olx: /olx\.com\.br\/d\/anuncio\//, imovelweb: /imovelweb\.com\.br\/propriedades\// };
      const pattern = listingPatterns[portal.code];
      const listingUrls = pattern ? links.filter(l => pattern.test(l)) : [];
      console.log(`[INNGEST][FASE 1A] ${portal.name}: ${links.length} links, ${listingUrls.length} anúncios`);
      if (listingUrls.length > 0) {
        return { urls: [...new Set(listingUrls)].slice(0, 20).map(url => ({ url, title: "", portal, snippet: "native-scrape" })), limitation: null };
      }
      if (markdown.length > 200) {
        try {
          const extractRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST", headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
            body: JSON.stringify({ model: "google/gemini-2.5-flash", messages: [{ role: "system", content: `Extraia URLs de anúncios individuais do portal ${portal.name}. Retorne APENAS URLs individuais.` }, { role: "user", content: markdown.substring(0, 8000) }], tools: [{ type: "function", function: { name: "extract_urls", description: "Extrair URLs", parameters: { type: "object", properties: { urls: { type: "array", items: { type: "string" } } }, required: ["urls"] } } }], tool_choice: { type: "function", function: { name: "extract_urls" } } }),
          });
          if (extractRes.ok) {
            const tc = (await extractRes.json()).choices?.[0]?.message?.tool_calls?.[0];
            if (tc) { const urls: string[] = JSON.parse(tc.function.arguments).urls || []; if (urls.length > 0) return { urls: [...new Set(urls)].slice(0, 20).map(url => ({ url, title: "", portal, snippet: "native-ai-extract" })), limitation: null }; }
          } else { await extractRes.text(); }
        } catch (aiErr) { console.warn(`[INNGEST][FASE 1A] ${portal.name}: AI failed`, aiErr); }
      }
      return { urls: [] as UrlItem[], limitation: `${portal.name}: nenhum anúncio no scrape nativo` };
    } catch (err) { console.error(`[INNGEST][FASE 1A] ${portal.name}:`, err); return { urls: [] as UrlItem[], limitation: `${portal.name}: erro` }; }
  }));
  for (const r of nativeScrapeResults) { if (r.status === "fulfilled") { nativeUrls.push(...r.value.urls); if (r.value.limitation) limitations.push(r.value.limitation); } }
  console.log(`[INNGEST][FASE 1A] Total: ${nativeUrls.length} URLs`);

  // FASE 1B: Google Search
  console.log(`[INNGEST][FASE 1B] Google search em ${limitedPortals.length} portais...`);
  const googleUrls: UrlItem[] = [];
  const portalSearchResults = await Promise.allSettled(limitedPortals.map(async (portal) => {
    const query = buildSearchQuery(property, portal, filters);
    const pr: PortalResult = { portal_name: portal.name, portal_code: portal.code, urls_found: 0, urls_opened: 0, urls_valid: 0 };
    try {
      const searchRes = await fetchWithRetry("https://api.firecrawl.dev/v1/search", {
        method: "POST", headers: { Authorization: `Bearer ${FIRECRAWL_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ query, limit: resultsPerPortal, lang: "pt-br", country: "br" }),
      });
      if (!searchRes.ok) { await searchRes.text(); return { portalResult: pr, urls: [] as UrlItem[], limitation: searchRes.status === 402 ? "Firecrawl: créditos insuficientes" : `${portal.name}: erro (${searchRes.status})` }; }
      const results = (await searchRes.json()).data || [];
      pr.urls_found = results.length;
      return { portalResult: pr, urls: results.filter((r: any) => r.url).map((r: any) => ({ url: r.url, title: r.title || "", portal, snippet: r.description || "" })), limitation: null as string | null };
    } catch (err) { return { portalResult: pr, urls: [] as UrlItem[], limitation: `${portal.name}: falha` }; }
  }));
  for (const r of portalSearchResults) { if (r.status === "fulfilled") { portalResults.push(r.value.portalResult); googleUrls.push(...r.value.urls); if (r.value.limitation) limitations.push(r.value.limitation); } }

  // Merge + dedup + filters
  const seenUrls = new Set<string>();
  const mergedUrlsRaw: UrlItem[] = [];
  let cityFilteredCount = 0;
  for (const item of [...nativeUrls, ...googleUrls]) {
    const normalized = item.url.replace(/\/$/, "").toLowerCase();
    if (seenUrls.has(normalized)) continue;
    seenUrls.add(normalized);
    const studyPurpose = (property.property_purpose || "venda").toLowerCase();
    const urlLower = item.url.toLowerCase();
    const isRentalUrl = /\/(aluguel|alugar|para-alugar)\//i.test(urlLower);
    const isSaleUrl = /\/(venda|comprar|a-venda)\//i.test(urlLower);
    if (studyPurpose !== "aluguel" && studyPurpose !== "rent" && isRentalUrl && !isSaleUrl) { cityFilteredCount++; discardReasons.push({ url: item.url, portal: item.portal.name, reason: "URL de aluguel (estudo é venda)" }); continue; }
    if ((studyPurpose === "aluguel" || studyPurpose === "rent") && isSaleUrl && !isRentalUrl) { cityFilteredCount++; discardReasons.push({ url: item.url, portal: item.portal.name, reason: "URL de venda (estudo é aluguel)" }); continue; }
    if (isWrongCityUrl(item.url, property.city)) { cityFilteredCount++; discardReasons.push({ url: item.url, portal: item.portal.name, reason: "Outra cidade" }); continue; }
    mergedUrlsRaw.push(item);
  }
  if (cityFilteredCount > 0) console.log(`[INNGEST][FASE 1] Pré-filtro removeu ${cityFilteredCount} URLs`);

  const condoSlug = property.condominium ? slugify(property.condominium) : null;
  const citySlug = property.city ? slugify(property.city) : null;
  const mergedUrls = mergedUrlsRaw.sort((a, b) => {
    const al = a.url.toLowerCase(), bl = b.url.toLowerCase();
    const ac = condoSlug && al.includes(condoSlug) ? 1 : 0, bc = condoSlug && bl.includes(condoSlug) ? 1 : 0;
    if (ac !== bc) return bc - ac;
    const aci = citySlug && al.includes(citySlug) ? 1 : 0, bci = citySlug && bl.includes(citySlug) ? 1 : 0;
    return bci - aci;
  });
  console.log(`[INNGEST][FASE 1] Total: ${mergedUrls.length} URLs únicas`);
  for (const pr of portalResults) { pr.urls_found += nativeUrls.filter(u => u.portal.code === pr.portal_code).length; }

  return { urls: mergedUrls, portalResults, discardReasons, limitations };
}

// ============================================================
// Step 2: scrapeUrlBatch — Scrape a batch of URLs via Firecrawl
// ============================================================
async function scrapeUrlBatch(
  batch: UrlItem[], property: PropertyData, FIRECRAWL_API_KEY: string,
  scrapedUrlSet: Set<string>, condoSlug: string | null,
): Promise<{ pages: ScrapedPage[]; discardReasons: DiscardReason[]; listingsOpened: number }> {
  const scrapedPages: ScrapedPage[] = [];
  const discardReasons: DiscardReason[] = [];
  let listingsOpened = 0;

  for (const item of batch) {
    try {
      const isML = isMultiListingUrl(item.url);
      listingsOpened++;

      // Standard markdown scraping
      const scrapeBody: any = { url: item.url, formats: isML ? ["markdown", "links"] : ["markdown"], onlyMainContent: true, waitFor: isML ? 5000 : 2000 };
      const firecrawlUrl = "https://api.firecrawl.dev/v1/scrape";
      const scrapeRes = await fetchWithRetry(firecrawlUrl, { method: "POST", headers: { Authorization: `Bearer ${FIRECRAWL_API_KEY}`, "Content-Type": "application/json" }, body: JSON.stringify(scrapeBody) });
      if (!scrapeRes.ok) { await scrapeRes.text(); discardReasons.push({ url: item.url, portal: item.portal.name, reason: `Erro HTTP ${scrapeRes.status}` }); continue; }
      const scrapeData = await scrapeRes.json();
      let markdown = scrapeData.data?.markdown || scrapeData.markdown || "";
      const links: string[] = scrapeData.data?.links || scrapeData.links || [];




      if (!markdown || markdown.length < 100) { discardReasons.push({ url: item.url, portal: item.portal.name, reason: `Conteúdo insuficiente (${markdown.length} chars)` }); continue; }
      const lMd = markdown.toLowerCase();
      if (lMd.includes("anúncio indisponível") || lMd.includes("anúncio expirado") || lMd.includes("imóvel vendido") || lMd.includes("este anúncio não está mais") || lMd.includes("página não encontrada")) { discardReasons.push({ url: item.url, portal: item.portal.name, reason: "Indisponível/expirado" }); continue; }

      if (!isIndividualListingUrl(item.url) && (isML || looksLikeMultiListing(markdown))) {
        let allIndUrls = extractIndividualListingUrls(links, item.portal.code, markdown);
        const pagUrls = generatePaginationUrls(item.url, 4);
        if (pagUrls.length > 0) {
          const pagResults = await Promise.allSettled(pagUrls.map(async (pu) => {
            if (scrapedUrlSet.has(pu.replace(/\/$/, "").toLowerCase())) return [];
            scrapedUrlSet.add(pu.replace(/\/$/, "").toLowerCase());
            listingsOpened++;
            try { const r = await fetchWithRetry("https://api.firecrawl.dev/v1/scrape", { method: "POST", headers: { Authorization: `Bearer ${FIRECRAWL_API_KEY}`, "Content-Type": "application/json" }, body: JSON.stringify({ url: pu, formats: ["markdown", "links"], onlyMainContent: true, waitFor: 5000 }) }); if (!r.ok) { await r.text(); return []; } const pagData = (await r.json()).data; return extractIndividualListingUrls(pagData?.links || [], item.portal.code, pagData?.markdown); } catch { return []; }
          }));
          for (const r of pagResults) { if (r.status === "fulfilled") allIndUrls.push(...r.value); }
        }
        allIndUrls = [...new Set(allIndUrls)];
        if (allIndUrls.length > 0) {
          for (const iUrl of allIndUrls.slice(0, 8)) {
            if (scrapedUrlSet.has(iUrl.toLowerCase())) continue;
            scrapedUrlSet.add(iUrl.toLowerCase());
            listingsOpened++;
            try { const iRes = await fetchWithRetry("https://api.firecrawl.dev/v1/scrape", { method: "POST", headers: { Authorization: `Bearer ${FIRECRAWL_API_KEY}`, "Content-Type": "application/json" }, body: JSON.stringify({ url: iUrl, formats: ["markdown"], onlyMainContent: true, waitFor: 2000 }) }); if (!iRes.ok) { await iRes.text(); continue; } const iMd = (await iRes.json()).data?.markdown || ""; if (iMd.length >= 100) scrapedPages.push({ url: iUrl, portal: item.portal, markdown: iMd, status: "ok", isMultiListing: false, isCondoTarget: condoSlug ? iUrl.toLowerCase().includes(condoSlug) : false }); } catch {}
          }
        }
        scrapedPages.push({ url: item.url, portal: item.portal, markdown, status: "ok", isMultiListing: true, isCondoTarget: condoSlug ? item.url.toLowerCase().includes(condoSlug) : false });
      } else {
        scrapedPages.push({ url: item.url, portal: item.portal, markdown, status: "ok", isMultiListing: false, isCondoTarget: condoSlug ? item.url.toLowerCase().includes(condoSlug) : false });
      }
    } catch (err) { discardReasons.push({ url: item.url, portal: item.portal.name, reason: "Erro interno" }); }
  }

  return { pages: scrapedPages, discardReasons, listingsOpened };
}

// ============================================================
// Step 3: extractWithAI — AI extraction via Gemini
// ============================================================
async function extractWithAI(
  scrapedPages: ScrapedPage[], property: PropertyData, LOVABLE_API_KEY: string,
): Promise<any[]> {
  // Separate pages with pre-extracted data from those needing AI
  const preExtracted: any[] = [];
  const needsAI: ScrapedPage[] = [];

  for (const page of scrapedPages) {
    if (page.extractedData && page.extractedData.price && page.extractedData.area) {
      const ed = page.extractedData;
      preExtracted.push({
        title: ed.title || "Imóvel",
        price: ed.price, area: ed.area,
        bedrooms: ed.bedrooms || null, suites: ed.suites || null,
        parking_spots: ed.parking_spots || null, bathrooms: ed.bathrooms || null,
        address: ed.address || null, neighborhood: ed.neighborhood || null,
        city: ed.city || null, condominium: ed.condominium || null,
        external_id: ed.external_id || null, source_url: page.url,
        source_name: page.portal?.name || "", property_type: null,
        construction_standard: null, differentials: [],
        description_summary: ed.description || null,
      });
    } else {
      needsAI.push(page);
    }
  }

  if (preExtracted.length > 0) {
    console.log(`[INNGEST][FASE 3] ${preExtracted.length} comparáveis pré-extraídos (JSON)`);
  }

  // If no pages need AI extraction, return pre-extracted only
  if (needsAI.length === 0) {
    console.log(`[INNGEST][FASE 3] Todas as páginas já tinham dados extraídos, pulando IA`);
    return preExtracted;
  }

  const MAX_AI_PAGES = 20;
  let pagesToAI = needsAI;
  if (needsAI.length > MAX_AI_PAGES) {
    pagesToAI = [...needsAI.filter(p => p.isCondoTarget), ...needsAI.filter(p => !p.isCondoTarget && !p.isMultiListing), ...needsAI.filter(p => !p.isCondoTarget && p.isMultiListing)].slice(0, MAX_AI_PAGES);
  }
  console.log(`[INNGEST][FASE 3] Extraindo de ${pagesToAI.length} páginas via IA...`);

  const hasML = pagesToAI.some(p => p.isMultiListing);
  const combined = pagesToAI.map((p, i) => `--- ${p.isMultiListing ? "LISTAGEM MÚLTIPLA" : "Anúncio"} ${i + 1} (Portal: ${p.portal.name}, URL: ${p.url}) ---\n${p.markdown}`).join("\n\n");
  const mlInst = hasML ? `\n\nATENÇÃO - LISTAGENS MÚLTIPLAS: Blocos "LISTAGEM MÚLTIPLA" contêm VÁRIOS imóveis. Extraia CADA um individualmente com URL e external_id únicos.` : "";

  const sysPrompt = `Você é um perito avaliador imobiliário brasileiro. Extraia dados estruturados de CADA anúncio.

REGRAS: Extraia EXATAMENTE os dados presentes. Preços "R$ 1.200.000" → 1200000. Áreas "120 m²" → 120.${mlInst}

IMPORTANTE - LOCALIZAÇÃO: Sempre extraia o bairro (neighborhood) e a cidade (city) do anúncio. Procure no título, endereço, breadcrumb, e URL do anúncio. Em sites como ImovelWeb, o bairro geralmente aparece no título e na URL (ex: "parque-campolim" na URL = bairro "Parque Campolim"). Se não encontrar explicitamente mas o anúncio for do mesmo portal/região da busca, use o bairro e cidade de referência.

IMÓVEL DE REFERÊNCIA: Tipo: ${property.property_type || "?"}, Bairro: ${property.neighborhood || "?"}, Cidade: ${property.city || "?"}, Cond: ${property.condominium || "?"}, Área: ${property.area_total || property.area_built || "?"} m², Quartos: ${property.bedrooms || "?"}, Suítes: ${property.suites || "?"}, Vagas: ${property.parking_spots || "?"}, Padrão: ${property.property_standard || "?"}, Preço: ${property.owner_expected_price ? "R$ " + Number(property.owner_expected_price).toLocaleString("pt-BR") : "?"}`;

  const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST", headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [{ role: "system", content: sysPrompt }, { role: "user", content: `Extraia:\n\n${combined}` }],
      tools: [{ type: "function", function: { name: "extract_comparables", description: "Extrair comparáveis", parameters: { type: "object", properties: { comparables: { type: "array", items: { type: "object", properties: { title: { type: "string" }, price: { type: "number" }, area: { type: "number" }, bedrooms: { type: "number" }, suites: { type: "number" }, parking_spots: { type: "number" }, address: { type: "string" }, neighborhood: { type: "string" }, city: { type: "string" }, condominium: { type: "string" }, construction_standard: { type: "string" }, property_type: { type: "string" }, source_url: { type: "string" }, source_name: { type: "string" }, advertiser: { type: "string" }, differentials: { type: "array", items: { type: "string" } }, description_summary: { type: "string" }, listing_date: { type: "string" }, external_id: { type: "string" } }, required: ["title", "price", "area", "source_url", "source_name"] } } }, required: ["comparables"] } } }],
      tool_choice: { type: "function", function: { name: "extract_comparables" } },
    }),
  });

  if (!aiRes.ok) { const e = await aiRes.text(); console.error(`[INNGEST][FASE 3] AI error: ${aiRes.status}`); throw new Error("AI extraction failed"); }

  let tc;
  try {
    const aiBody = await aiRes.text();
    if (!aiBody || aiBody.length < 10) {
      console.warn(`[INNGEST][FASE 3] AI retornou body vazio (${aiBody.length} chars)`);
      return preExtracted;
    }
    tc = JSON.parse(aiBody).choices?.[0]?.message?.tool_calls?.[0];
  } catch (parseErr) {
    console.error(`[INNGEST][FASE 3] Falha ao parsear resposta da IA:`, parseErr);
    return preExtracted;
  }
  if (!tc) return preExtracted;

  try {
    const extracted = JSON.parse(tc.function.arguments);
    console.log(`[INNGEST][FASE 3] AI extraiu ${extracted.comparables?.length || 0} comparáveis`);

    // URL fix + portal attribution
    const searchPats = [/vivareal\.com\.br\/venda\//, /vivareal\.com\.br\/aluguel\//, /vivareal\.com\.br\/condominio\//, /zapimoveis\.com\.br\/venda\//, /zapimoveis\.com\.br\/aluguel\//, /zapimoveis\.com\.br\/condominio\//, /imovelweb\.com\.br\/(apartamentos|casas|imoveis)-/, /olx\.com\.br\/imoveis\//];
    const indPats = [/vivareal\.com\.br\/imovel\//, /zapimoveis\.com\.br\/imovel\//, /imovelweb\.com\.br\/propriedades\//, /olx\.com\.br\/d\/anuncio\//];
    for (const c of (extracted.comparables || [])) {
      const u = c.source_url || "";
      if (searchPats.some(p => p.test(u)) && !indPats.some(p => p.test(u)) && c.external_id) {
        const eid = c.external_id.replace(/^id-/, "");
        const pn = (c.source_name || "").toLowerCase();
        if (pn.includes("viva")) c.source_url = `https://www.vivareal.com.br/imovel/${c.external_id}`;
        else if (pn.includes("zap")) c.source_url = `https://www.zapimoveis.com.br/imovel/${c.external_id}`;
        else if (pn.includes("imóvel web") || pn.includes("imovelweb")) c.source_url = `https://www.imovelweb.com.br/propriedades/${eid}`;
      }
      const su = (c.source_url || "").toLowerCase();
      if (/vivareal\.com\.br/i.test(su)) c.source_name = "Viva Real";
      else if (/zapimoveis\.com\.br/i.test(su)) c.source_name = "ZAP Imóveis";
      else if (/imovelweb\.com\.br/i.test(su)) c.source_name = "Imóvel Web";
      else if (/olx\.com\.br/i.test(su)) c.source_name = "OLX";
      else if (/chavesnamao\.com\.br/i.test(su)) c.source_name = "Chaves na Mão";

      // Infer city/neighborhood from search context when AI didn't extract them
      if (!c.city && property.city) c.city = property.city;
      if (!c.neighborhood && property.neighborhood) {
        // Check if neighborhood appears in the URL slug
        const neighSlug = (property.neighborhood || "").toLowerCase().replace(/\s+/g, "-");
        if (neighSlug && su.includes(neighSlug)) {
          c.neighborhood = property.neighborhood;
        }
      }
    }

    // Merge pre-extracted + AI-extracted
    return [...preExtracted, ...(extracted.comparables || [])];
  } catch {
    console.error("[INNGEST][FASE 3] Parse error");
    return preExtracted;
  }
}

// ============================================================
// Step 4: scoreAndSave — Score, filter, persist to DB
// ============================================================
async function scoreAndSave(
  rawComparables: any[], property: PropertyData, filters: Filters,
  marketStudyId: string | null,
  portalResults: PortalResult[], discardReasons: DiscardReason[],
  limitations: string[], totalUrlsFound: number, listingsOpened: number,
) {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const maxResults = Math.min(Number(filters.maxComparables) || 15, 20);

  // Score + filter
  const baseArea = Number(property.area_total || property.area_built || property.area_land) || 100;
  const baseBed = Number(property.bedrooms) || 3, baseSu = Number(property.suites) || 0, basePk = Number(property.parking_spots) || 0;
  const validComparables: any[] = [];
  const maxAge = Number(filters.maxListingAgeMonths) || 0;
  const cutoff = maxAge > 0 ? new Date(Date.now() - maxAge * 30 * 24 * 60 * 60 * 1000) : null;
  const spf = (property.property_purpose || "venda").toLowerCase();
  const isSale = spf !== "aluguel" && spf !== "rent";
  const localDiscards: DiscardReason[] = [];

  for (const c of rawComparables) {
    if (!c.price || c.price <= 0 || !c.area || c.area <= 0) { localDiscards.push({ url: c.source_url || "?", portal: c.source_name || "?", reason: "Sem preço/área" }); continue; }
    const tl = (c.title || "").toLowerCase();
    if (isSale && /alugu[e]?[lr]|para alugar|locação/i.test(tl) && !/venda|comprar/i.test(tl)) { localDiscards.push({ url: c.source_url || "?", portal: c.source_name || "?", reason: "Aluguel vs venda" }); continue; }
    if (!isSale && /venda|comprar|à venda/i.test(tl) && !/alugu/i.test(tl)) { localDiscards.push({ url: c.source_url || "?", portal: c.source_name || "?", reason: "Venda vs aluguel" }); continue; }
    if (isSale && c.price < 10000) { localDiscards.push({ url: c.source_url || "?", portal: c.source_name || "?", reason: "Preço baixo (aluguel?)" }); continue; }
    if (!isSale && c.price > 100000) { localDiscards.push({ url: c.source_url || "?", portal: c.source_name || "?", reason: "Preço alto (venda?)" }); continue; }
    if (cutoff && c.listing_date) { const ld = new Date(c.listing_date); if (!isNaN(ld.getTime()) && ld < cutoff) { localDiscards.push({ url: c.source_url || "?", portal: c.source_name || "?", reason: "Antigo" }); continue; } }
    if (isDuplicate(c, validComparables)) { localDiscards.push({ url: c.source_url || "?", portal: c.source_name || "?", reason: "Duplicata" }); continue; }

    const psqm = Math.round(c.price / c.area);
    const cc = (c.condominium || "").toLowerCase(), sc = (property.condominium || "").toLowerCase();
    const sameCondo = sc && cc && (cc.includes(sc) || sc.includes(cc));
    let score = 0;
    if (sameCondo) score += 25;
    if (c.neighborhood && property.neighborhood) { const cn = c.neighborhood.toLowerCase(), sn = property.neighborhood.toLowerCase(); if (cn.includes(sn) || sn.includes(cn)) score += 20; }
    if (c.property_type && property.property_type && c.property_type.toLowerCase().includes(property.property_type.toLowerCase())) score += 15;
    const ad = Math.abs(c.area - baseArea) / baseArea;
    if (ad <= 0.05) score += 15; else if (ad <= 0.10) score += 12; else if (ad <= 0.20) score += 8; else if (ad <= 0.30) score += 3;
    const bd = Math.abs((c.bedrooms || 0) - baseBed), sd = Math.abs((c.suites || 0) - baseSu), pd = Math.abs((c.parking_spots || 0) - basePk);
    const avg = (bd + sd + pd) / 3;
    if (avg === 0) score += 10; else if (avg <= 1) score += 6; else if (avg <= 2) score += 2;
    const ss = ((property as any).construction_standard || (property as any).property_standard || "").toLowerCase();
    if (c.construction_standard && ss && (c.construction_standard.toLowerCase().includes(ss) || ss.includes(c.construction_standard.toLowerCase()))) score += 10;
    const subD: string[] = (property as any).differentials || [], compD: string[] = c.differentials || [];
    if (subD.length > 0 && compD.length > 0) { const sn2 = subD.map((d: string) => d.toLowerCase()), cn2 = compD.map((d: string) => d.toLowerCase()); const ol = sn2.filter((d: string) => cn2.some((cd: string) => cd.includes(d) || d.includes(cd))); const r = ol.length / sn2.length; if (r >= 0.5) score += 5; else if (r >= 0.25) score += 3; }
    if (c.city && property.city) { if (c.city.toLowerCase().includes(property.city.toLowerCase()) || property.city.toLowerCase().includes(c.city.toLowerCase())) score += 5; }
    const sim = Math.min(100, Math.round(score));
    const minSim = (filters?.preferSameCondominium && property.condominium) ? 25 : 30;
    if (sim < minSim) { localDiscards.push({ url: c.source_url || "?", portal: c.source_name || "?", reason: `Similaridade ${sim}/100` }); continue; }
    const pr2 = portalResults.find(p => p.portal_name === c.source_name || p.portal_code === c.source_name?.toLowerCase());
    if (pr2) pr2.urls_valid++;
    validComparables.push({ title: c.title, price: c.price, area: c.area, price_per_sqm: psqm, bedrooms: c.bedrooms || 0, suites: c.suites || 0, parking_spots: c.parking_spots || 0, address: c.address || "", neighborhood: c.neighborhood || "", city: c.city || property.city || "", condominium: c.condominium || "", construction_standard: c.construction_standard || "", property_type: c.property_type || "", source_url: c.source_url || "", source_name: c.source_name || "", similarity_score: sim, is_approved: true, raw_data: { advertiser: c.advertiser || null, differentials: c.differentials || [], description_summary: c.description_summary || "", validated_individually: true } });
  }

  const allDiscards = [...discardReasons, ...localDiscards];
  validComparables.sort((a: any, b: any) => b.similarity_score - a.similarity_score);
  const finalComparables = validComparables.slice(0, maxResults);
  console.log(`[INNGEST][FASE 3] ${finalComparables.length} comparáveis finais`);

  // Pricing
  let pricingAnalysis: any = null;
  if (finalComparables.length > 0) {
    const prices = finalComparables.map((c: any) => c.price), psqms = finalComparables.map((c: any) => c.price_per_sqm);
    const sorted = [...prices].sort((a: number, b: number) => a - b);
    const av = Math.round(prices.reduce((a: number, b: number) => a + b, 0) / prices.length);
    const med = sorted.length % 2 === 0 ? Math.round((sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2) : sorted[Math.floor(sorted.length / 2)];
    const aSqm = Math.round(psqms.reduce((a: number, b: number) => a + b, 0) / psqms.length);
    pricingAnalysis = { avg_price: av, median_price: med, avg_price_per_sqm: aSqm, price_range_min: sorted[0], price_range_max: sorted[sorted.length - 1], suggested_ad_price: Math.round(med * 1.10), suggested_market_price: Math.round(med * 1.0), suggested_fast_sale_price: Math.round(med * 0.90) };
  }

  const resMeta = { portals_checked: portalResults, total_listings_found: totalUrlsFound, listings_opened: listingsOpened, listings_discarded: allDiscards.length, discard_reasons: allDiscards, filters_used: filters, collected_at: new Date().toISOString(), limitations };
  console.log(`[INNGEST][RESULTADO] ${finalComparables.length} comp, ${listingsOpened} abertos, ${allDiscards.length} desc`);

  // Save to DB (idempotent — clean old data from retries first)
  if (marketStudyId && finalComparables.length > 0) {
    // Delete previous auto_firecrawl comparables + their adjustments + results to avoid duplicates on retry
    const { data: oldComps } = await supabase.from("market_study_comparables").select("id").eq("market_study_id", marketStudyId).eq("origin", "auto_firecrawl");
    if (oldComps && oldComps.length > 0) {
      const oldIds = oldComps.map(c => c.id);
      await supabase.from("market_study_adjustments").delete().in("comparable_id", oldIds);
      await supabase.from("market_study_comparables").delete().eq("market_study_id", marketStudyId).eq("origin", "auto_firecrawl");
    }
    await supabase.from("market_study_results").delete().eq("market_study_id", marketStudyId);
    console.log("[INNGEST][DB] Cleaned old data for idempotency");

    const { data: subProps } = await supabase.from("market_study_subject_properties").select("*").eq("market_study_id", marketStudyId).limit(1);
    const subProp = subProps?.[0] || null;
    const studyComps = finalComparables.map((c: any) => ({ market_study_id: marketStudyId, title: c.title || null, address: c.address || null, neighborhood: c.neighborhood || null, city: c.city || null, condominium: c.condominium || null, property_type: c.property_type || null, price: c.price || null, area: c.area || null, price_per_sqm: c.price_per_sqm || null, bedrooms: c.bedrooms || null, suites: c.suites || null, parking_spots: c.parking_spots || null, construction_standard: c.construction_standard || null, similarity_score: c.similarity_score || 0, source_name: c.source_name || null, source_url: c.source_url || null, is_approved: true, origin: "auto_firecrawl", raw_data: c.raw_data || null }));
    const { data: insComps, error: insErr } = await supabase.from("market_study_comparables").insert(studyComps).select();
    if (insErr) console.error("[INNGEST][DB] Insert error:", insErr.message);
    else console.log(`[INNGEST][DB] ${insComps?.length || 0} inseridos`);

    if (insComps && insComps.length > 0 && subProp) {
      const allAdj: any[] = [], adjPrices: { id: string; adjusted_price: number }[] = [];
      for (const comp of insComps) {
        const price = comp.price ?? 0;
        if (price <= 0) continue;
        const adjs: any[] = [];
        const ss2 = subProp.suites ?? 0, cs2 = comp.suites ?? 0;
        if (ss2 !== cs2) { const d = cs2 - ss2, p = 2 * Math.abs(d); adjs.push({ comparable_id: comp.id, adjustment_type: "suites", label: `Suítes (${d > 0 ? "+" : ""}${d})`, percentage: d > 0 ? p : -p, value: Math.round(price * (p / 100) * (d > 0 ? 1 : -1)), direction: d > 0 ? "positive" : "negative" }); }
        const sp2 = subProp.parking_spots ?? 0, cp2 = comp.parking_spots ?? 0;
        if (sp2 !== cp2) { const d = cp2 - sp2, p = 1.5 * Math.abs(d); adjs.push({ comparable_id: comp.id, adjustment_type: "parking", label: `Vagas (${d > 0 ? "+" : ""}${d})`, percentage: d > 0 ? p : -p, value: Math.round(price * (p / 100) * (d > 0 ? 1 : -1)), direction: d > 0 ? "positive" : "negative" }); }
        const sa2 = subProp.area_land ?? subProp.area_built ?? subProp.area_useful ?? 0, ca2 = comp.area ?? 0;
        if (sa2 > 0 && ca2 > 0 && sa2 !== ca2) { const dp = ((ca2 - sa2) / sa2) * 100; if (Math.abs(dp) > 5) { const ap = Math.min(Math.abs(dp) * 0.15, 9); adjs.push({ comparable_id: comp.id, adjustment_type: "area", label: `Área (${dp > 0 ? "+" : ""}${dp.toFixed(0)}%)`, percentage: dp > 0 ? ap : -ap, value: Math.round(price * (ap / 100) * (dp > 0 ? 1 : -1)), direction: dp > 0 ? "positive" : "negative" }); } }
        const tot = adjs.reduce((s: number, a: any) => s + a.value, 0);
        adjPrices.push({ id: comp.id, adjusted_price: Math.round(price + tot) });
        allAdj.push(...adjs);
      }
      if (allAdj.length > 0) await supabase.from("market_study_adjustments").insert(allAdj);
      await Promise.all(adjPrices.map(ap => supabase.from("market_study_comparables").update({ adjusted_price: ap.adjusted_price }).eq("id", ap.id)));

      const aps = adjPrices.map(ap => ap.adjusted_price).filter(p => p > 0);
      const sp2 = [...aps].sort((a, b) => a - b);
      const mi = Math.floor(sp2.length / 2);
      const medP = sp2.length % 2 !== 0 ? sp2[mi] : Math.round((sp2[mi - 1] + sp2[mi]) / 2);
      const avP = Math.round(aps.reduce((a, b) => a + b, 0) / aps.length);
      await supabase.from("market_study_results").insert({ market_study_id: marketStudyId, avg_price: pricingAnalysis?.avg_price ?? avP, median_price: pricingAnalysis?.median_price ?? medP, avg_price_per_sqm: pricingAnalysis?.avg_price_per_sqm ?? 0, suggested_ad_price: pricingAnalysis?.suggested_ad_price ?? Math.round(medP * 1.10), suggested_market_price: pricingAnalysis?.suggested_market_price ?? medP, suggested_fast_sale_price: pricingAnalysis?.suggested_fast_sale_price ?? Math.round(medP * 0.90), price_range_min: pricingAnalysis?.price_range_min ?? sp2[0], price_range_max: pricingAnalysis?.price_range_max ?? sp2[sp2.length - 1], confidence_level: finalComparables.length >= 5 ? "high" : "medium", executive_summary: `Análise com ${finalComparables.length} comparáveis.`, research_metadata: resMeta as any });
      console.log(`[INNGEST][DB] Results + ${allAdj.length} adjustments`);
    } else if (insComps && insComps.length > 0) {
      await supabase.from("market_study_results").insert({ market_study_id: marketStudyId, avg_price: pricingAnalysis?.avg_price ?? 0, median_price: pricingAnalysis?.median_price ?? 0, avg_price_per_sqm: pricingAnalysis?.avg_price_per_sqm ?? 0, suggested_ad_price: pricingAnalysis?.suggested_ad_price ?? 0, suggested_market_price: pricingAnalysis?.suggested_market_price ?? 0, suggested_fast_sale_price: pricingAnalysis?.suggested_fast_sale_price ?? 0, price_range_min: pricingAnalysis?.price_range_min ?? 0, price_range_max: pricingAnalysis?.price_range_max ?? 0, confidence_level: "medium", executive_summary: `${finalComparables.length} comparáveis.`, research_metadata: resMeta as any });
    }

    // AI summary (non-fatal)
    try {
      const ANON = Deno.env.get("SUPABASE_ANON_KEY") || Deno.env.get("SUPABASE_PUBLISHABLE_KEY") || "";
      const sr = await fetch(`${supabaseUrl}/functions/v1/generate-market-summary`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${ANON}`, apikey: ANON }, body: JSON.stringify({ subject: subProps?.[0] || property, comparables: finalComparables.slice(0, 10), result: pricingAnalysis }) });
      if (sr.ok) { const as2 = await sr.json(); if (as2?.executive_summary) await supabase.from("market_study_results").update({ executive_summary: as2.executive_summary, justification: as2.justification, market_insights: as2.market_insights }).eq("market_study_id", marketStudyId); }
    } catch (e) { console.warn("[INNGEST] AI summary failed:", e); }
  } else if (marketStudyId && finalComparables.length === 0) {
    await supabase.from("market_study_results").insert({ market_study_id: marketStudyId, avg_price: 0, median_price: 0, avg_price_per_sqm: 0, suggested_ad_price: 0, suggested_market_price: 0, suggested_fast_sale_price: 0, confidence_level: "low", executive_summary: `Nenhum comparável. ${allDiscards.length} descartados.`, research_metadata: resMeta as any });
  }

  // Sync presentations
  if (marketStudyId) {
    try {
      const { data: lp } = await supabase.from("presentations").select("id, owner_expected_price").eq("market_study_id", marketStudyId);
      if (lp && lp.length > 0) {
        const { data: lr } = await supabase.from("market_study_results").select("*").eq("market_study_id", marketStudyId).single();
        const { data: ac } = await supabase.from("market_study_comparables").select("id").eq("market_study_id", marketStudyId).eq("is_approved", true);
        if (lr) {
          for (const p of lp) {
            await Promise.all([
              supabase.from("presentation_sections").update({ content: { status: "completed", avg_price: lr.avg_price, median_price: lr.median_price, avg_price_per_sqm: lr.avg_price_per_sqm, confidence_level: lr.confidence_level, executive_summary: lr.executive_summary, comparables_count: ac?.length ?? 0 } }).eq("presentation_id", p.id).eq("section_key", "market_study_placeholder"),
              supabase.from("presentation_sections").update({ content: { owner_expected_price: p.owner_expected_price, scenarios: [{ label: "Preço aspiracional", value: lr.suggested_ad_price || null }, { label: "Preço de mercado", value: lr.suggested_market_price || null }, { label: "Preço de venda rápida", value: lr.suggested_fast_sale_price || null }] } }).eq("presentation_id", p.id).eq("section_key", "pricing_scenarios"),
            ]);
          }
          console.log(`[INNGEST][SYNC] ${lp.length} presentation(s) updated`);
        }
      }
    } catch (e) { console.warn("[INNGEST][SYNC] Failed:", e); }
  }

  if (marketStudyId) {
    await supabase.from("market_studies").update({ status: "completed", current_phase: "completed" }).eq("id", marketStudyId);
  }

  return { success: true, comparables: finalComparables, research_metadata: resMeta, pricing_analysis: pricingAnalysis };
}

// ============================================================
// Inngest client + function with step.run()
// ============================================================
const inngest = new Inngest({ id: "listing-studio-ai" });

const marketStudyAnalyze = inngest.createFunction(
  { id: "market-study-analyze", retries: 2, triggers: [{ event: "market-study/analyze.requested" }] },
  async ({ event, step }) => {
    const { property, portals, filters, market_study_id } = event.data;
    const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");
    if (!FIRECRAWL_API_KEY) throw new Error("FIRECRAWL_API_KEY not configured");
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");
    console.log(`[INNGEST] Starting analysis for study ${market_study_id}`);

    // Mark as processing
    await step.run("set-processing", async () => {
      if (!market_study_id) return;
      const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
      await sb.from("market_studies").update({ status: "processing", current_phase: "collecting_urls" }).eq("id", market_study_id);
    });

    // Step 1: Collect URLs (Fase 1A + 1B) — ~3-5s
    const urlData = await step.run("collect-urls", async () => {
      return await collectUrls(property, portals, filters, FIRECRAWL_API_KEY!, LOVABLE_API_KEY!);
    });

    if (urlData.urls.length === 0) {
      await step.run("complete-empty", async () => {
        if (!market_study_id) return;
        const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
        await sb.from("market_study_results").insert({ market_study_id, avg_price: 0, median_price: 0, avg_price_per_sqm: 0, suggested_ad_price: 0, suggested_market_price: 0, suggested_fast_sale_price: 0, confidence_level: "low", executive_summary: "Nenhum resultado encontrado.", research_metadata: { portals_checked: urlData.portalResults, total_listings_found: 0, listings_opened: 0, listings_discarded: urlData.discardReasons.length, discard_reasons: urlData.discardReasons, filters_used: filters, collected_at: new Date().toISOString(), limitations: [...urlData.limitations, "Nenhum resultado encontrado"] } as any });
        await sb.from("market_studies").update({ status: "completed" }).eq("id", market_study_id);
      });
      return { comparables_count: 0, market_study_id };
    }

    // Prepare URLs for scraping — select top MAX_URLS, ensure min per portal
    const MAX_URLS = 25, MIN_PER_PORTAL_VAL = 3;
    const byPortal = new Map<string, UrlItem[]>();
    for (const item of urlData.urls) { const k = item.portal.code; if (!byPortal.has(k)) byPortal.set(k, []); byPortal.get(k)!.push(item); }
    const selectedUrlsSet = new Set<string>();
    const urlsToProcess: UrlItem[] = [];
    for (const [, items] of byPortal) { for (const item of items.slice(0, MIN_PER_PORTAL_VAL)) { if (urlsToProcess.length >= MAX_URLS) break; urlsToProcess.push(item); selectedUrlsSet.add(item.url); } }
    for (const item of urlData.urls) { if (urlsToProcess.length >= MAX_URLS) break; if (!selectedUrlsSet.has(item.url)) urlsToProcess.push(item); }
    if (urlData.urls.length > MAX_URLS) urlData.limitations.push(`Limitado a ${MAX_URLS} de ${urlData.urls.length} URLs`);

    // Step 2: Scrape in batches of 5 URLs each — ~5-8s per batch
    const BATCH_SIZE = 5;
    const condoSlug = property.condominium ? slugify(property.condominium) : null;
    const allPages: ScrapedPage[] = [];
    const allScrapeDiscards: DiscardReason[] = [];
    let totalListingsOpened = 0;
    const scrapedUrlSet = new Set<string>();

    for (let i = 0; i < urlsToProcess.length; i += BATCH_SIZE) {
      const batch = urlsToProcess.slice(i, i + BATCH_SIZE);
      // Update phase to scraping on first batch
      if (i === 0 && market_study_id) {
        await step.run("phase-scraping", async () => {
          const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
          await sb.from("market_studies").update({ current_phase: "scraping" }).eq("id", market_study_id);
        });
      }
      const batchResult = await step.run(`scrape-batch-${i}`, async () => {
        return await scrapeUrlBatch(batch, property, FIRECRAWL_API_KEY!, scrapedUrlSet, condoSlug);
      });
      allPages.push(...batchResult.pages);
      allScrapeDiscards.push(...batchResult.discardReasons);
      totalListingsOpened += batchResult.listingsOpened;
      // Update portalResults with opened counts
      for (const page of batchResult.pages) {
        const pr = urlData.portalResults.find(p => p.portal_code === page.portal.code);
        if (pr) pr.urls_opened++;
      }
    }

    console.log(`[INNGEST][FASE 2] ${allPages.length} páginas válidas de ${totalListingsOpened} abertas`);

    if (allPages.length === 0) {
      await step.run("complete-no-pages", async () => {
        if (!market_study_id) return;
        const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
        const allDiscards = [...urlData.discardReasons, ...allScrapeDiscards];
        await sb.from("market_study_results").insert({ market_study_id, avg_price: 0, median_price: 0, avg_price_per_sqm: 0, suggested_ad_price: 0, suggested_market_price: 0, suggested_fast_sale_price: 0, confidence_level: "low", executive_summary: "Nenhuma página válida encontrada.", research_metadata: { portals_checked: urlData.portalResults, total_listings_found: urlData.urls.length, listings_opened: totalListingsOpened, listings_discarded: allDiscards.length, discard_reasons: allDiscards, filters_used: filters, collected_at: new Date().toISOString(), limitations: [...urlData.limitations, "Nenhuma página válida"] } as any });
        await sb.from("market_studies").update({ status: "completed" }).eq("id", market_study_id);
      });
      return { comparables_count: 0, market_study_id };
    }

    // Step 3: AI extraction — ~5-8s
    if (market_study_id) {
      await step.run("phase-extracting", async () => {
        const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
        await sb.from("market_studies").update({ current_phase: "extracting" }).eq("id", market_study_id);
      });
    }
    const rawComparables = await step.run("ai-extraction", async () => {
      return await extractWithAI(allPages, property, LOVABLE_API_KEY!);
    });

    // Step 4: Score, filter, save to DB — ~3-5s
    if (market_study_id) {
      await step.run("phase-scoring", async () => {
        const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
        await sb.from("market_studies").update({ current_phase: "scoring" }).eq("id", market_study_id);
      });
    }
    const result = await step.run("score-and-save", async () => {
      const allDiscards = [...urlData.discardReasons, ...allScrapeDiscards];
      return await scoreAndSave(
        rawComparables, property, filters, market_study_id,
        urlData.portalResults, allDiscards, urlData.limitations,
        urlData.urls.length, totalListingsOpened,
      );
    });

    if (!result.success) throw new Error("Market analysis failed");
    return { comparables_count: result.comparables?.length ?? 0, market_study_id };
  }
);

// Serve handler
const handler = serve({
  client: inngest,
  functions: [marketStudyAnalyze],
  servePath: "/functions/v1/inngest-serve",
});

Deno.serve(handler);
