// Suggest comparable fields from a listing URL.
// Reads ONLY the URL (no scraping). Asks Lovable AI to extract pistas
// presentes no slug (bairro, cidade, tipo, quartos, título sugerido).
// Nunca devolve preço/área/IPTU — esses ficam manuais.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const PROPERTY_TYPES = [
  "apartamento",
  "casa",
  "cobertura",
  "sobrado",
  "terreno",
  "comercial",
] as const;

const tool = {
  type: "function",
  function: {
    name: "suggest_comparable_fields",
    description:
      "Sugere campos de um anúncio imobiliário a partir SOMENTE do slug/URL. Deixe nulo qualquer campo que não esteja claramente expresso na URL.",
    parameters: {
      type: "object",
      properties: {
        title: {
          type: ["string", "null"],
          description:
            "Título curto do anúncio reconstruído a partir do slug, em português. Ex.: 'Apartamento 3 quartos no Jardins'. Nulo se não for possível inferir.",
        },
        property_type: {
          type: ["string", "null"],
          enum: [...PROPERTY_TYPES, null],
          description: "Tipo do imóvel se aparecer na URL.",
        },
        neighborhood: {
          type: ["string", "null"],
          description: "Bairro inferido do slug.",
        },
        city: {
          type: ["string", "null"],
          description: "Cidade inferida do slug.",
        },
        bedrooms: {
          type: ["integer", "null"],
          description:
            "Número de quartos se aparecer no slug (ex.: '3-quartos').",
        },
      },
      required: [
        "title",
        "property_type",
        "neighborhood",
        "city",
        "bedrooms",
      ],
      additionalProperties: false,
    },
  },
} as const;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "LOVABLE_API_KEY não configurada" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const body = await req.json().catch(() => ({}));
    const url: string | undefined = body?.url;
    if (!url || typeof url !== "string") {
      return new Response(
        JSON.stringify({ error: "url obrigatória" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch {
      return new Response(
        JSON.stringify({ error: "URL inválida" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const systemPrompt =
      "Você analisa URLs de anúncios imobiliários brasileiros (VivaReal, ZAP, OLX, QuintoAndar, etc.) e extrai pistas que estão CLARAMENTE presentes no slug/URL. " +
      "NUNCA invente preço, área, IPTU ou condomínio. NUNCA acesse o site. " +
      "Se um campo não estiver claramente no slug, retorne null. " +
      "Use letras minúsculas com acentuação correta para bairro/cidade (ex.: 'Jardins', 'São Paulo').";

    const userPrompt =
      `Analise apenas esta URL de anúncio e extraia o que conseguir do slug:\n` +
      `Domínio: ${parsed.hostname}\n` +
      `Caminho: ${parsed.pathname}\n` +
      `URL completa: ${parsed.toString()}`;

    const aiResp = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          tools: [tool],
          tool_choice: {
            type: "function",
            function: { name: "suggest_comparable_fields" },
          },
        }),
      },
    );

    if (aiResp.status === 429) {
      return new Response(
        JSON.stringify({ error: "Muitas requisições. Tente novamente em alguns segundos." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    if (aiResp.status === 402) {
      return new Response(
        JSON.stringify({ error: "Créditos da IA esgotados. Adicione créditos em Settings → Workspace → Usage." }),
        { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    if (!aiResp.ok) {
      const t = await aiResp.text();
      console.error("AI gateway error:", aiResp.status, t);
      return new Response(
        JSON.stringify({ error: "Erro ao consultar a IA" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const data = await aiResp.json();
    const toolCall = data?.choices?.[0]?.message?.tool_calls?.[0];
    const argsRaw = toolCall?.function?.arguments;
    if (!argsRaw) {
      return new Response(
        JSON.stringify({ suggestions: {}, suggested_fields: [] }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    let args: Record<string, unknown> = {};
    try {
      args = typeof argsRaw === "string" ? JSON.parse(argsRaw) : argsRaw;
    } catch {
      args = {};
    }

    const suggestions: Record<string, unknown> = {};
    const suggested_fields: string[] = [];
    for (const k of ["title", "property_type", "neighborhood", "city", "bedrooms"]) {
      const v = args[k];
      if (v !== null && v !== undefined && v !== "") {
        suggestions[k] = v;
        suggested_fields.push(k);
      }
    }

    return new Response(
      JSON.stringify({ suggestions, suggested_fields }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("suggest-comparable-from-url error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
