import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const MANUS_API = "https://api.manus.im/v1";
const POLL_INTERVAL = 5000;
const MAX_POLL_TIME = 180_000; // 3 minutes

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

function buildManusPrompt(property: PropertyInput, portals: any[], filters: any): string {
  const parts: string[] = [];
  parts.push("Você é um pesquisador imobiliário. Pesquise imóveis comparáveis ao descrito abaixo nos portais indicados.");
  parts.push("");
  parts.push("## Imóvel de referência");
  if (property.property_type) parts.push(`- Tipo: ${property.property_type}`);
  if (property.property_purpose) parts.push(`- Finalidade: ${property.property_purpose}`);
  if (property.address) parts.push(`- Endereço: ${property.address}`);
  if (property.city) parts.push(`- Cidade: ${property.city}`);
  if (property.neighborhood) parts.push(`- Bairro: ${property.neighborhood}`);
  if (property.area_total) parts.push(`- Área total: ${property.area_total} m²`);
  if (property.area_built) parts.push(`- Área construída: ${property.area_built} m²`);
  if (property.bedrooms) parts.push(`- Quartos: ${property.bedrooms}`);
  if (property.suites) parts.push(`- Suítes: ${property.suites}`);
  if (property.bathrooms) parts.push(`- Banheiros: ${property.bathrooms}`);
  if (property.parking_spots) parts.push(`- Vagas: ${property.parking_spots}`);
  if (property.property_standard) parts.push(`- Padrão: ${property.property_standard}`);
  if (property.owner_expected_price) parts.push(`- Preço esperado: R$ ${Number(property.owner_expected_price).toLocaleString("pt-BR")}`);

  parts.push("");
  parts.push("## Portais para pesquisar");
  if (portals.length > 0) {
    portals.forEach((p: any) => parts.push(`- ${p.name}`));
  } else {
    parts.push("- ZAP Imóveis, Viva Real, OLX Imóveis");
  }

  parts.push("");
  parts.push("## Filtros");
  if (filters.searchRadius) parts.push(`- Raio de busca: ${filters.searchRadius}`);
  if (filters.minArea) parts.push(`- Área mínima: ${filters.minArea} m²`);
  if (filters.maxArea) parts.push(`- Área máxima: ${filters.maxArea} m²`);
  if (filters.minPrice) parts.push(`- Preço mínimo: R$ ${filters.minPrice}`);
  if (filters.maxPrice) parts.push(`- Preço máximo: R$ ${filters.maxPrice}`);
  const maxComp = filters.maxComparables || "10";
  parts.push(`- Máximo de comparáveis: ${maxComp}`);

  parts.push("");
  parts.push("## Formato de saída");
  parts.push("Retorne APENAS um bloco JSON (sem markdown, sem texto antes ou depois) com a seguinte estrutura:");
  parts.push("```");
  parts.push(JSON.stringify({
    comparables: [{
      title: "Título do anúncio",
      price: 850000,
      area: 120,
      bedrooms: 3,
      suites: 1,
      parking_spots: 2,
      address: "Endereço",
      neighborhood: "Bairro",
      price_per_sqm: 7083,
      source_url: "https://link-do-anuncio",
      source_name: "Nome do portal",
      image_url: "https://url-da-imagem (se disponível)",
    }],
  }, null, 2));
  parts.push("```");

  return parts.join("\n");
}

async function createManusTask(prompt: string, apiKey: string): Promise<string> {
  const res = await fetch(`${MANUS_API}/tasks`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ prompt }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Manus task creation failed (${res.status}): ${text}`);
  }

  const data = await res.json();
  return data.task_id || data.id;
}

async function pollManusTask(taskId: string, apiKey: string): Promise<string> {
  const start = Date.now();

  while (Date.now() - start < MAX_POLL_TIME) {
    const res = await fetch(`${MANUS_API}/tasks/${taskId}`, {
      headers: { "Authorization": `Bearer ${apiKey}` },
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("Manus poll error:", res.status, text);
      await new Promise(r => setTimeout(r, POLL_INTERVAL));
      continue;
    }

    const data = await res.json();
    console.log("Manus task status:", data.status);

    if (data.status === "completed" || data.status === "done") {
      // Extract the final output
      if (data.output?.text) return data.output.text;
      if (data.output) return typeof data.output === "string" ? data.output : JSON.stringify(data.output);
      
      // Try to get from messages
      if (data.messages && data.messages.length > 0) {
        const lastMsg = data.messages[data.messages.length - 1];
        return lastMsg.content || lastMsg.text || JSON.stringify(lastMsg);
      }

      return JSON.stringify(data);
    }

    if (data.status === "failed" || data.status === "error") {
      throw new Error(`Manus task failed: ${data.error || data.message || "Unknown error"}`);
    }

    await new Promise(r => setTimeout(r, POLL_INTERVAL));
  }

  throw new Error("Manus task timed out after 3 minutes");
}

function extractJsonFromText(text: string): any {
  // Try direct parse
  try {
    return JSON.parse(text);
  } catch {}

  // Try to find JSON block in text
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[1].trim());
    } catch {}
  }

  // Try to find { ... } block
  const braceMatch = text.match(/\{[\s\S]*"comparables"[\s\S]*\}/);
  if (braceMatch) {
    try {
      return JSON.parse(braceMatch[0]);
    } catch {}
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
          content: `Extract real estate comparables from the text. Return ONLY valid JSON: {"comparables": [{"title":"...","price":number,"area":number,"bedrooms":number,"suites":number,"parking_spots":number,"address":"...","neighborhood":"...","price_per_sqm":number,"source_url":"...","source_name":"...","image_url":"..."}]}. If no data found, return {"comparables": []}.`,
        },
        { role: "user", content: rawText },
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

    // Build prompt and create Manus task
    const prompt = buildManusPrompt(property, portals || [], filters || {});
    console.log("Creating Manus task...");

    const taskId = await createManusTask(prompt, MANUS_API_KEY);
    console.log("Manus task created:", taskId);

    // Poll for completion
    const rawResult = await pollManusTask(taskId, MANUS_API_KEY);
    console.log("Manus task completed, raw result length:", rawResult.length);

    // Parse the result
    let comparables: any[] = [];
    const parsed = extractJsonFromText(rawResult);
    if (parsed?.comparables?.length) {
      comparables = parsed.comparables;
    } else {
      // Fallback to AI parsing
      console.log("Direct parse failed, using AI to extract comparables...");
      comparables = await parseWithAI(rawResult);
    }

    // Normalize comparables
    comparables = comparables.map((c: any) => ({
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
