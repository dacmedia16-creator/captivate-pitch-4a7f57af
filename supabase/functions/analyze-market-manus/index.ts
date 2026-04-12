import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const MANUS_API = "https://api.manus.ai/v2";
const POLL_INTERVAL = 5000;
const MAX_POLL_TIME = 300_000; // 5 minutes

interface PropertyInput {
  title?: string;
  property_type?: string;
  property_purpose?: string;
  address?: string;
  city?: string;
  neighborhood?: string;
  area_total?: string;
  area_built?: string;
  bedrooms?: string;
  suites?: string;
  bathrooms?: string;
  parking_spots?: string;
  property_standard?: string;
  owner_expected_price?: string;
}

interface PortalInfo {
  name: string;
  code?: string;
  base_url?: string;
}

const PORTAL_URLS: Record<string, string> = {
  zap: "https://www.zapimoveis.com.br",
  vivareal: "https://www.vivareal.com.br",
  olx: "https://www.olx.com.br/imoveis",
  imovelweb: "https://www.imovelweb.com.br",
  chaves_na_mao: "https://www.chavesnamao.com.br",
  quintoandar: "https://www.quintoandar.com.br",
};

function getPortalUrl(portal: PortalInfo): string {
  if (portal.base_url) return portal.base_url;
  const code = (portal.code || portal.name).toLowerCase().replace(/\s+/g, "").replace("imóveis", "");
  for (const [key, url] of Object.entries(PORTAL_URLS)) {
    if (code.includes(key) || portal.name.toLowerCase().includes(key)) return url;
  }
  return "";
}

function buildManusPrompt(property: PropertyInput, portals: PortalInfo[], filters: any): string {
  const portalList = portals.length > 0 ? portals : [
    { name: "ZAP Imóveis", base_url: "https://www.zapimoveis.com.br" },
    { name: "Viva Real", base_url: "https://www.vivareal.com.br" },
    { name: "OLX Imóveis", base_url: "https://www.olx.com.br/imoveis" },
  ];

  const portalInstructions = portalList.map((p, i) => {
    const url = getPortalUrl(p);
    return `${i + 1}. **${p.name}** — Acesse ${url || "o site do portal"}, busque imóveis similares ao de referência aplicando os filtros abaixo, e colete os dados de cada anúncio encontrado incluindo o LINK DIRETO do anúncio.`;
  }).join("\n");

  const propDesc: string[] = [];
  if (property.property_type) propDesc.push(`Tipo: ${property.property_type}`);
  if (property.property_purpose) propDesc.push(`Finalidade: ${property.property_purpose}`);
  if (property.address) propDesc.push(`Endereço: ${property.address}`);
  if (property.city) propDesc.push(`Cidade: ${property.city}`);
  if (property.neighborhood) propDesc.push(`Bairro: ${property.neighborhood}`);
  if (property.area_total) propDesc.push(`Área total: ${property.area_total} m²`);
  if (property.area_built) propDesc.push(`Área construída: ${property.area_built} m²`);
  if (property.bedrooms) propDesc.push(`Quartos: ${property.bedrooms}`);
  if (property.suites) propDesc.push(`Suítes: ${property.suites}`);
  if (property.bathrooms) propDesc.push(`Banheiros: ${property.bathrooms}`);
  if (property.parking_spots) propDesc.push(`Vagas: ${property.parking_spots}`);
  if (property.property_standard) propDesc.push(`Padrão: ${property.property_standard}`);
  if (property.owner_expected_price) {
    propDesc.push(`Preço esperado pelo proprietário: R$ ${Number(property.owner_expected_price).toLocaleString("pt-BR")}`);
  }

  const filterLines: string[] = [];
  if (filters.searchRadius) filterLines.push(`- Raio de busca: ${filters.searchRadius}`);
  if (filters.minArea) filterLines.push(`- Área mínima: ${filters.minArea} m²`);
  if (filters.maxArea) filterLines.push(`- Área máxima: ${filters.maxArea} m²`);
  if (filters.minPrice) filterLines.push(`- Preço mínimo: R$ ${Number(filters.minPrice).toLocaleString("pt-BR")}`);
  if (filters.maxPrice) filterLines.push(`- Preço máximo: R$ ${Number(filters.maxPrice).toLocaleString("pt-BR")}`);
  const maxComp = filters.maxComparables || 10;
  filterLines.push(`- Máximo de comparáveis por portal: ${maxComp}`);

  return `Você é um pesquisador imobiliário profissional. Sua tarefa é navegar nos portais imobiliários listados abaixo, encontrar imóveis comparáveis ao imóvel de referência e coletar dados estruturados de cada anúncio.

## INSTRUÇÕES IMPORTANTES
1. Acesse CADA portal listado abaixo usando o navegador
2. Em cada portal, use a busca do site para encontrar imóveis na mesma região e com características similares
3. Aplique os filtros indicados (tipo de imóvel, localização, faixa de preço, área, quartos)
4. Para CADA imóvel encontrado, abra a página do anúncio e colete TODOS os dados solicitados
5. O campo source_url DEVE ser a URL real e completa da página do anúncio no portal (ex: https://www.zapimoveis.com.br/imovel/venda-apartamento-3-quartos-...)
6. Colete no máximo ${maxComp} imóveis por portal

## IMÓVEL DE REFERÊNCIA
${propDesc.join("\n")}

## PORTAIS PARA PESQUISAR (navegue em cada um)
${portalInstructions}

## FILTROS DE BUSCA
${filterLines.join("\n")}

## FORMATO DE SAÍDA
Após coletar todos os dados, retorne APENAS um bloco JSON válido (sem texto antes ou depois) com esta estrutura exata:

\`\`\`json
{
  "comparables": [
    {
      "title": "Título do anúncio como aparece no portal",
      "price": 850000,
      "area": 120,
      "bedrooms": 3,
      "suites": 1,
      "parking_spots": 2,
      "address": "Endereço completo do imóvel",
      "neighborhood": "Bairro",
      "price_per_sqm": 7083,
      "source_url": "https://www.zapimoveis.com.br/imovel/venda-apartamento-...",
      "source_name": "ZAP Imóveis",
      "image_url": "https://url-da-primeira-imagem-do-anuncio"
    }
  ]
}
\`\`\`

IMPORTANTE:
- price_per_sqm = price / area (calcule se não estiver disponível)
- source_url DEVE ser o link real e funcional do anúncio no portal
- source_name DEVE ser o nome do portal onde o anúncio foi encontrado
- Se não encontrar imóveis em um portal, ignore e passe ao próximo
- Retorne APENAS o JSON, sem nenhum texto adicional`;
}

async function createManusTask(prompt: string, apiKey: string): Promise<string> {
  const res = await fetch(`${MANUS_API}/task.create`, {
    method: "POST",
    headers: {
      "x-manus-api-key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message: {
        content: [{ type: "text", text: prompt }],
      },
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Manus task creation failed (${res.status}): ${text}`);
  }

  const data = await res.json();
  if (!data.ok && !data.task_id) {
    throw new Error(`Manus returned unexpected response: ${JSON.stringify(data)}`);
  }
  return data.task_id;
}

async function pollManusTask(taskId: string, apiKey: string): Promise<string> {
  const start = Date.now();

  while (Date.now() - start < MAX_POLL_TIME) {
    const url = `${MANUS_API}/task.listMessages?task_id=${taskId}&order=desc&limit=50`;
    const res = await fetch(url, {
      headers: { "x-manus-api-key": apiKey },
    });

    if (!res.ok) {
      console.error("Manus poll error:", res.status, await res.text());
      await new Promise(r => setTimeout(r, POLL_INTERVAL));
      continue;
    }

    const data = await res.json();
    const messages = data.messages || data.data || [];

    // Check for status updates
    for (const msg of messages) {
      if (msg.type === "status_update" || msg.event_type === "status_update") {
        const status = msg.agent_status || msg.status;
        console.log("Manus agent status:", status);

        if (status === "error" || status === "failed") {
          throw new Error(`Manus task failed: ${msg.error || msg.message || "Unknown error"}`);
        }

        if (status === "stopped" || status === "completed" || status === "done") {
          // Find assistant messages with content
          for (const m of messages) {
            if (m.type === "assistant_message" || m.role === "assistant") {
              const content = m.content;
              if (typeof content === "string") return content;
              if (Array.isArray(content)) {
                const textPart = content.find((c: any) => c.type === "text");
                if (textPart?.text) return textPart.text;
              }
            }
          }
          // If no assistant message, return full data
          return JSON.stringify(messages);
        }
      }
    }

    await new Promise(r => setTimeout(r, POLL_INTERVAL));
  }

  throw new Error("Manus task timed out after 5 minutes");
}

function extractJsonFromText(text: string): any {
  try { return JSON.parse(text); } catch {}

  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) {
    try { return JSON.parse(jsonMatch[1].trim()); } catch {}
  }

  const braceMatch = text.match(/\{[\s\S]*"comparables"[\s\S]*\}/);
  if (braceMatch) {
    try { return JSON.parse(braceMatch[0]); } catch {}
  }

  return null;
}

async function parseWithAI(rawText: string): Promise<any[]> {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) {
    console.warn("No LOVABLE_API_KEY for AI parsing");
    return [];
  }

  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        {
          role: "system",
          content: `Extract real estate comparables from the text. Return ONLY valid JSON: {"comparables": [{"title":"...","price":number,"area":number,"bedrooms":number,"suites":number,"parking_spots":number,"address":"...","neighborhood":"...","price_per_sqm":number,"source_url":"...","source_name":"...","image_url":"..."}]}. source_url MUST be the real URL of the listing. If no data found, return {"comparables": []}.`,
        },
        { role: "user", content: rawText.slice(0, 30000) },
      ],
    }),
  });

  if (!res.ok) {
    console.error("AI parse error:", res.status, await res.text());
    return [];
  }

  const aiData = await res.json();
  const content = aiData.choices?.[0]?.message?.content || "";
  const parsed = extractJsonFromText(content);
  return parsed?.comparables || [];
}

function normalizeComparables(raw: any[]): any[] {
  return raw.map((c: any) => ({
    title: c.title || "Imóvel comparável",
    price: Number(c.price) || null,
    area: Number(c.area) || null,
    bedrooms: Number(c.bedrooms) || null,
    suites: Number(c.suites) || null,
    parking_spots: Number(c.parking_spots) || null,
    address: c.address || null,
    neighborhood: c.neighborhood || null,
    price_per_sqm: Number(c.price_per_sqm) || (c.price && c.area ? Math.round(Number(c.price) / Number(c.area)) : null),
    source_url: c.source_url || c.url || "",
    source_name: c.source_name || c.portal || "",
    image_url: c.image_url || null,
    is_approved: true,
    similarity_score: c.similarity_score || null,
  }));
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const MANUS_API_KEY = Deno.env.get("MANUS_API_KEY");
    if (!MANUS_API_KEY) {
      return new Response(
        JSON.stringify({ success: false, message: "MANUS_API_KEY not configured" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { property, portals, filters } = await req.json();

    const prompt = buildManusPrompt(property, portals || [], filters || {});
    console.log("Creating Manus task with v2 API...");

    const taskId = await createManusTask(prompt, MANUS_API_KEY);
    console.log("Manus task created:", taskId);

    const rawResult = await pollManusTask(taskId, MANUS_API_KEY);
    console.log("Manus task completed, raw result length:", rawResult.length);

    let comparables: any[] = [];
    const parsed = extractJsonFromText(rawResult);
    if (parsed?.comparables?.length) {
      comparables = parsed.comparables;
    } else {
      console.log("Direct parse failed, using AI to extract comparables...");
      comparables = await parseWithAI(rawResult);
    }

    comparables = normalizeComparables(comparables);
    console.log(`Manus returned ${comparables.length} comparables`);

    return new Response(
      JSON.stringify({ success: true, comparables, source: "manus" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("analyze-market-manus error:", err);
    return new Response(
      JSON.stringify({ success: false, message: err.message || "Erro na análise via Manus" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
