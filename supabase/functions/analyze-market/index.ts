import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Map portal codes to site: search filters
const PORTAL_SITE_MAP: Record<string, string> = {
  zap: "site:zapimoveis.com.br",
  vivareal: "site:vivareal.com.br",
  olx: "site:olx.com.br/imoveis",
  imovelweb: "site:imovelweb.com.br",
  chavesnamao: "site:chavesnamao.com.br",
};

interface PropertyData {
  property_type?: string;
  neighborhood?: string;
  city?: string;
  bedrooms?: string;
  area_total?: string;
  owner_expected_price?: string;
  property_standard?: string;
  property_purpose?: string;
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
  preferSameCondominium?: boolean;
}

function buildSearchQuery(property: PropertyData, portal: PortalInfo, filters?: Filters): string {
  const parts: string[] = [];

  // When preferSameCondominium is on, prioritize condominium name in query
  if (filters?.preferSameCondominium && property.condominium) {
    parts.push(property.condominium);
  }

  if (property.property_type) parts.push(property.property_type);
  if (property.bedrooms) parts.push(`${property.bedrooms} quartos`);
  if (property.area_total) parts.push(`${property.area_total}m²`);
  if (property.neighborhood) parts.push(property.neighborhood);
  if (property.city) parts.push(property.city);

  const purpose = property.property_purpose?.toLowerCase();
  if (purpose === "aluguel" || purpose === "rent") {
    parts.push("aluguel");
  } else {
    parts.push("venda");
  }

  // Add "preço R$" to encourage results with price info
  parts.push("preço R$");

  const siteFilter = PORTAL_SITE_MAP[portal.code];
  if (siteFilter) parts.push(siteFilter);

  return parts.join(" ");
}

function computeSimilarity(
  compArea: number,
  baseArea: number,
  compPriceSqm: number,
  basePriceSqm: number,
  compBedrooms: number,
  baseBedrooms: number,
  sameCondominium?: boolean
): number {
  if (!baseArea || !basePriceSqm) return 75;
  const areaDiff = Math.abs(compArea - baseArea) / baseArea;
  const priceDiff = Math.abs(compPriceSqm - basePriceSqm) / basePriceSqm;
  const bedroomDiff = Math.abs(compBedrooms - baseBedrooms);
  let score = 100 - (areaDiff * 40 + priceDiff * 40 + bedroomDiff * 5);
  if (sameCondominium) score += 10;
  return Math.max(50, Math.min(98, Math.round(score)));
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

    // Filter to only portals we can search (have a site: mapping)
    const searchablePortals = portals.filter((p) => PORTAL_SITE_MAP[p.code]);
    if (searchablePortals.length === 0) {
      return new Response(
        JSON.stringify({ success: true, comparables: [], message: "Nenhum portal pesquisável selecionado" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Limit to 3 portals to avoid rate limits
    const limitedPortals = searchablePortals.slice(0, 3);
    const maxResults = Math.min(Number(filters.maxComparables) || 10, 20);
    const resultsPerPortal = Math.ceil(maxResults / limitedPortals.length);

    console.log(`Searching ${limitedPortals.length} portals, ${resultsPerPortal} results each`);

    // Search each portal with Firecrawl
    const allSearchResults: Array<{ portal: PortalInfo; markdown: string; url: string; title: string }> = [];

    for (const portal of limitedPortals) {
      const query = buildSearchQuery(property, portal, filters);
      console.log(`Firecrawl search: "${query}"`);

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
            scrapeOptions: { formats: ["markdown"] },
          }),
        });

        if (!searchRes.ok) {
          const errText = await searchRes.text();
          console.error(`Firecrawl error for ${portal.name}: ${searchRes.status} ${errText}`);
          if (searchRes.status === 402) {
            return new Response(
              JSON.stringify({ success: false, error: "Firecrawl credits insufficient. Please top up." }),
              { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }
          continue;
        }

        const searchData = await searchRes.json();
        const results = searchData.data || [];
        console.log(`${portal.name}: ${results.length} results`);

        for (const r of results) {
          const content = [
            r.title || "",
            r.description || "",
            r.markdown?.substring(0, 3000) || "",
          ].filter(Boolean).join("\n");
          if (content.trim()) {
            allSearchResults.push({
              portal,
              markdown: content,
              url: r.url || "",
              title: r.title || "",
            });
          }
        }
      } catch (err) {
        console.error(`Search error for ${portal.name}:`, err);
      }
    }

    if (allSearchResults.length === 0) {
      return new Response(
        JSON.stringify({ success: true, comparables: [], message: "Nenhum resultado encontrado nos portais" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Use Lovable AI to extract structured data from search results
    const combinedContent = allSearchResults
      .map(
        (r, i) =>
          `--- Resultado ${i + 1} (Portal: ${r.portal.name}, URL: ${r.url}) ---\nTítulo: ${r.title}\n${r.markdown?.substring(0, 2000) || "Sem conteúdo"}`
      )
      .join("\n\n");

    const systemPrompt = `Você é um especialista em mercado imobiliário brasileiro. Analise os resultados de busca de portais imobiliários e extraia dados estruturados de cada imóvel individual encontrado.

IMPORTANTE:
- Os resultados podem ser páginas de LISTAGEM contendo VÁRIOS imóveis. Extraia CADA imóvel individualmente.
- Preços estão geralmente no formato "R$ 1.200.000" ou "1200000". Converta para número inteiro (sem pontos ou vírgula).
- Áreas estão geralmente como "120 m²" ou "120m2". Extraia apenas o número.
- Se não conseguir determinar o preço ou área de um imóvel específico, use 0.
- Extraia o máximo de imóveis possível dos resultados.

Dados do imóvel de referência para comparação:
- Tipo: ${property.property_type || "Não informado"}
- Bairro: ${property.neighborhood || "Não informado"}
- Cidade: ${property.city || "Não informado"}
- Área: ${property.area_total || "Não informada"}m²
- Quartos: ${property.bedrooms || "Não informado"}
- Padrão: ${property.property_standard || "Não informado"}
- Preço esperado: ${property.owner_expected_price ? `R$ ${Number(property.owner_expected_price).toLocaleString("pt-BR")}` : "Não informado"}
- Condomínio: ${property.condominium || "Não informado"}
${filters.preferSameCondominium && property.condominium ? `\nPRIORIDADE: Dê preferência a imóveis do condomínio "${property.condominium}". Extraia o nome do condomínio de cada imóvel quando disponível.` : ""}

Extraia imóveis que sejam comparáveis relevantes (mesmo tipo, região similar). Ignore anúncios duplicados.`;

    console.log("Calling Lovable AI for extraction...");

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
          { role: "user", content: `Extraia os dados dos imóveis encontrados:\n\n${combinedContent}` },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extract_comparables",
              description: "Extrair dados estruturados de imóveis comparáveis dos resultados de busca",
              parameters: {
                type: "object",
                properties: {
                  comparables: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        title: { type: "string", description: "Título descritivo do imóvel" },
                        price: { type: "number", description: "Preço em reais (apenas número)" },
                        area: { type: "number", description: "Área total em m²" },
                        bedrooms: { type: "number", description: "Número de quartos" },
                        suites: { type: "number", description: "Número de suítes" },
                        parking_spots: { type: "number", description: "Número de vagas" },
                        address: { type: "string", description: "Endereço completo" },
                        neighborhood: { type: "string", description: "Bairro" },
                        source_url: { type: "string", description: "URL original do anúncio" },
                        source_name: { type: "string", description: "Nome do portal de origem" },
                        result_index: { type: "number", description: "Índice do resultado (1-based)" },
                        condominium: { type: "string", description: "Nome do condomínio/edifício, se disponível" },
                      },
                      required: ["title", "price", "area", "bedrooms", "source_url", "source_name"],
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
      console.error(`AI gateway error: ${aiRes.status} ${aiErr}`);
      if (aiRes.status === 429) {
        return new Response(
          JSON.stringify({ success: false, error: "Rate limit exceeded, please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (aiRes.status === 402) {
        return new Response(
          JSON.stringify({ success: false, error: "AI credits exhausted. Please add funds." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      return new Response(
        JSON.stringify({ success: false, error: "AI extraction failed" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiData = await aiRes.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      console.error("No tool call in AI response");
      return new Response(
        JSON.stringify({ success: true, comparables: [], message: "AI não conseguiu extrair dados" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let extracted: { comparables: any[] };
    try {
      extracted = JSON.parse(toolCall.function.arguments);
      console.log(`AI extracted ${extracted.comparables?.length || 0} raw comparables`);
      if (extracted.comparables?.length > 0) {
        console.log("Sample:", JSON.stringify(extracted.comparables[0]));
      }
    } catch (parseErr) {
      console.error("Failed to parse AI tool call arguments:", toolCall.function.arguments?.substring(0, 500));
      return new Response(
        JSON.stringify({ success: true, comparables: [], message: "Erro ao processar dados da IA" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Compute similarity scores and format
    const baseArea = Number(property.area_total) || 80;
    const baseBedrooms = Number(property.bedrooms) || 2;
    const basePriceSqm = property.owner_expected_price
      ? Number(property.owner_expected_price) / baseArea
      : 0;

    const comparables = extracted.comparables
      .filter((c: any) => {
        const valid = c.price > 0 && c.area > 0;
        if (!valid) console.log(`Filtered out: price=${c.price}, area=${c.area}, title=${c.title?.substring(0, 50)}`);
        return valid;
      })
      .map((c: any) => {
        const priceSqm = Math.round(c.price / c.area);
        const isSameCondo = filters.preferSameCondominium && property.condominium && c.condominium
          && c.condominium.toLowerCase().includes(property.condominium.toLowerCase());
        const similarity = computeSimilarity(
          c.area, baseArea, priceSqm, basePriceSqm, c.bedrooms || 0, baseBedrooms, !!isSameCondo
        );
        // Fallback: use Firecrawl's original URL/portal when AI didn't extract them
        const resultIdx = (c.result_index || 1) - 1;
        const originalResult = allSearchResults[resultIdx];
        const sourceUrl = c.source_url || originalResult?.url || "";
        const sourceName = c.source_name || originalResult?.portal.name || "";
        return {
          title: c.title,
          price: c.price,
          area: c.area,
          price_per_sqm: priceSqm,
          bedrooms: c.bedrooms || 0,
          suites: c.suites || 0,
          parking_spots: c.parking_spots || 0,
          address: c.address || "",
          neighborhood: c.neighborhood || property.neighborhood || "",
          source_url: sourceUrl,
          source_name: sourceName,
          similarity_score: similarity,
          is_approved: true,
        };
      })
      .sort((a: any, b: any) => b.similarity_score - a.similarity_score)
      .slice(0, maxResults);

    console.log(`Returning ${comparables.length} comparables`);

    return new Response(
      JSON.stringify({ success: true, comparables }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("analyze-market error:", err);
    return new Response(
      JSON.stringify({ success: false, error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
