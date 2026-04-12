import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const PORTAL_SITE_MAP: Record<string, string> = {
  zap: "site:zapimoveis.com.br",
  vivareal: "site:vivareal.com.br",
  olx: "site:olx.com.br/imoveis",
  imovelweb: "site:imovelweb.com.br",
  chavesnamao: "site:chavesnamao.com.br",
  kenlo: "site:portal.kenlo.com.br",
};

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
  if (filters?.preferSameCondominium && property.condominium) {
    parts.push(`"${property.condominium}"`);
  }
  if (property.property_type) parts.push(property.property_type);
  if (property.bedrooms) parts.push(`${property.bedrooms} quartos`);
  if (property.area_total || property.area_built) parts.push(`${property.area_total || property.area_built}m²`);
  if (property.neighborhood) parts.push(property.neighborhood);
  if (property.city) parts.push(property.city);
  const purpose = property.property_purpose?.toLowerCase();
  parts.push(purpose === "aluguel" || purpose === "rent" ? "aluguel" : "venda");
  const siteFilter = PORTAL_SITE_MAP[portal.code];
  if (siteFilter) parts.push(siteFilter);
  return parts.join(" ");
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

    const searchablePortals = portals.filter((p) => PORTAL_SITE_MAP[p.code]);
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

    // Limit portals to avoid timeout
    const limitedPortals = searchablePortals.slice(0, 3);
    if (searchablePortals.length > 3) {
      limitations.push(`Limitado a 3 de ${searchablePortals.length} portais para respeitar timeout`);
    }

    const maxResults = Math.min(Number(filters.maxComparables) || 15, 20);
    const resultsPerPortal = Math.min(Math.ceil(maxResults / limitedPortals.length), 8);

    // ==========================================
    // FASE 1: Busca ampla por portal (Firecrawl Search)
    // ==========================================
    console.log(`[FASE 1] Buscando em ${limitedPortals.length} portais...`);
    
    const allUrls: Array<{ url: string; title: string; portal: PortalInfo; snippet: string }> = [];

    for (const portal of limitedPortals) {
      const query = buildSearchQuery(property, portal, filters);
      console.log(`[FASE 1] ${portal.name}: "${query}"`);

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
          const errText = await searchRes.text();
          console.error(`[FASE 1] ${portal.name} error: ${searchRes.status}`);
          if (searchRes.status === 402) {
            limitations.push(`Firecrawl: créditos insuficientes`);
          } else {
            limitations.push(`${portal.name}: erro na busca (${searchRes.status})`);
          }
          portalResults.push(portalResult);
          continue;
        }

        const searchData = await searchRes.json();
        const results = searchData.data || [];
        portalResult.urls_found = results.length;
        console.log(`[FASE 1] ${portal.name}: ${results.length} URLs encontradas`);

        for (const r of results) {
          if (r.url) {
            allUrls.push({
              url: r.url,
              title: r.title || "",
              portal,
              snippet: r.description || "",
            });
          }
        }
      } catch (err) {
        console.error(`[FASE 1] ${portal.name} exception:`, err);
        limitations.push(`${portal.name}: falha na conexão`);
      }

      portalResults.push(portalResult);
    }

    console.log(`[FASE 1] Total: ${allUrls.length} URLs coletadas`);

    if (allUrls.length === 0) {
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
    console.log(`[FASE 2] Abrindo ${allUrls.length} URLs individualmente...`);

    // Limit URLs to avoid timeout (each scrape ~2-3s)
    const maxUrlsToScrape = Math.min(allUrls.length, 15);
    if (allUrls.length > maxUrlsToScrape) {
      limitations.push(`Limitado a ${maxUrlsToScrape} de ${allUrls.length} URLs para respeitar timeout`);
    }
    const urlsToProcess = allUrls.slice(0, maxUrlsToScrape);

    const scrapedPages: Array<{
      url: string;
      portal: PortalInfo;
      markdown: string;
      status: "ok" | "failed";
    }> = [];

    let listingsOpened = 0;

    for (const item of urlsToProcess) {
      try {
        console.log(`[FASE 2] Scraping: ${item.url.substring(0, 80)}...`);
        listingsOpened++;

        // Update portal stats
        const pr = portalResults.find(p => p.portal_code === item.portal.code);
        if (pr) pr.urls_opened++;

        const scrapeRes = await fetch("https://api.firecrawl.dev/v1/scrape", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${FIRECRAWL_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            url: item.url,
            formats: ["markdown"],
            onlyMainContent: true,
            waitFor: 2000,
          }),
        });

        if (!scrapeRes.ok) {
          const status = scrapeRes.status;
          await scrapeRes.text(); // consume body
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
            total_listings_found: allUrls.length,
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

    const combinedContent = scrapedPages
      .map(
        (p, i) =>
          `--- Anúncio ${i + 1} (Portal: ${p.portal.name}, URL: ${p.url}) ---\n${p.markdown}`
      )
      .join("\n\n");

    const systemPrompt = `Você é um perito avaliador imobiliário brasileiro. Analise CADA anúncio individualmente e extraia dados estruturados.

REGRAS CRÍTICAS:
- Cada bloco "--- Anúncio X ---" é UM anúncio individual já validado (página aberta e verificada).
- Extraia EXATAMENTE os dados que estão no anúncio. NÃO invente dados.
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
- Preço esperado: ${property.owner_expected_price ? `R$ ${Number(property.owner_expected_price).toLocaleString("pt-BR")}` : "Não informado"}

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
            total_listings_found: allUrls.length,
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
          portals_checked: portalResults, total_listings_found: allUrls.length,
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

      // City match + profile bonus
      if (c.city && property.city &&
        c.city.toLowerCase().includes(property.city.toLowerCase()) && score >= 30) score += 5;

      const similarity = Math.min(100, Math.round(score));

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
      total_listings_found: allUrls.length,
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
