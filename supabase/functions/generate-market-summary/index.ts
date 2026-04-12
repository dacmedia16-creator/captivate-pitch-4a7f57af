import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const { subject, comparables, result } = await req.json();

    const prompt = `Você é um avaliador imobiliário profissional brasileiro. Analise os dados abaixo e gere um parecer técnico.

IMÓVEL AVALIADO:
- Tipo: ${subject.property_category || subject.property_type || "N/I"}
- Localização: ${[subject.neighborhood, subject.city].filter(Boolean).join(", ")}
- Condomínio: ${subject.condominium || "N/I"}
- Área útil: ${subject.area_useful || subject.area_built || "N/I"} m²
- Quartos: ${subject.bedrooms || "N/I"}, Suítes: ${subject.suites || "N/I"}, Vagas: ${subject.parking_spots || "N/I"}
- Padrão: ${subject.construction_standard || "N/I"}
- Conservação: ${subject.conservation_state || "N/I"}
- Preço esperado pelo proprietário: R$ ${subject.owner_expected_price ? Number(subject.owner_expected_price).toLocaleString("pt-BR") : "N/I"}

RESULTADO DA ANÁLISE:
- Preço médio ajustado: R$ ${result.avg_price ? Number(result.avg_price).toLocaleString("pt-BR") : "N/I"}
- R$/m² médio: R$ ${result.avg_price_per_sqm ? Number(result.avg_price_per_sqm).toLocaleString("pt-BR") : "N/I"}
- Sugestão anúncio: R$ ${result.suggested_ad_price ? Number(result.suggested_ad_price).toLocaleString("pt-BR") : "N/I"}
- Sugestão mercado: R$ ${result.suggested_market_price ? Number(result.suggested_market_price).toLocaleString("pt-BR") : "N/I"}
- Sugestão venda rápida: R$ ${result.suggested_fast_sale_price ? Number(result.suggested_fast_sale_price).toLocaleString("pt-BR") : "N/I"}
- Faixa: R$ ${result.price_range_min ? Number(result.price_range_min).toLocaleString("pt-BR") : "N/I"} a R$ ${result.price_range_max ? Number(result.price_range_max).toLocaleString("pt-BR") : "N/I"}
- Confiança: ${result.confidence_level || "N/I"}
- Total de comparáveis aprovados: ${comparables.length}

COMPARÁVEIS UTILIZADOS:
${comparables.slice(0, 10).map((c: any, i: number) => `${i + 1}. ${c.title || c.address || "Sem título"} — R$ ${Number(c.price).toLocaleString("pt-BR")} (ajustado: R$ ${Number(c.adjusted_price || c.price).toLocaleString("pt-BR")}) — ${c.area}m² — Score: ${c.similarity_score}`).join("\n")}

Gere o parecer usando a função fornecida.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: "Você é um avaliador imobiliário sênior. Responda sempre em português brasileiro, com linguagem profissional e técnica, mas acessível para proprietários de imóveis.",
          },
          { role: "user", content: prompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "generate_market_report",
              description: "Gera o relatório de mercado estruturado",
              parameters: {
                type: "object",
                properties: {
                  executive_summary: {
                    type: "string",
                    description: "Resumo executivo de 3-5 parágrafos para apresentar ao proprietário. Inclua contexto do mercado, análise dos comparáveis, e conclusão com recomendação de preço.",
                  },
                  justification: {
                    type: "string",
                    description: "Justificativa técnica de 2-3 parágrafos explicando como se chegou ao valor sugerido, mencionando os ajustes aplicados e a metodologia.",
                  },
                  insights: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        type: { type: "string", enum: ["positive", "warning", "neutral", "negative"] },
                        title: { type: "string", description: "Título curto do insight (max 6 palavras)" },
                        description: { type: "string", description: "Descrição do insight em 1-2 frases" },
                      },
                      required: ["type", "title", "description"],
                    },
                    description: "3-5 insights sobre o posicionamento do imóvel no mercado",
                  },
                },
                required: ["executive_summary", "justification", "insights"],
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "generate_market_report" } },
      }),
    });

    if (!response.ok) {
      const status = response.status;
      const text = await response.text();
      console.error("AI gateway error:", status, text);

      if (status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns minutos." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "Créditos de IA insuficientes." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI error: ${status}`);
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall?.function?.arguments) {
      throw new Error("No tool call response from AI");
    }

    const report = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(report), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-market-summary error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
