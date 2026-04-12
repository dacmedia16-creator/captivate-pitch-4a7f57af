import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { presentation_id } = await req.json();
    if (!presentation_id) throw new Error("presentation_id is required");

    // --- AUTH: Require authenticated user ---
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claims, error: claimsErr } = await authClient.auth.getClaims(token);
    if (claimsErr || !claims?.claims?.sub) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claims.claims.sub as string;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch presentation
    const { data: pres } = await supabase.from("presentations").select("*").eq("id", presentation_id).single();
    if (!pres) throw new Error("Presentation not found");

    // --- OWNERSHIP CHECK ---
    const { data: userProfile } = await supabase.from("profiles").select("tenant_id").eq("id", userId).single();
    const { data: userRole } = await supabase.from("user_roles").select("role").eq("user_id", userId).single();
    const isSuperAdmin = userRole?.role === "super_admin";
    const isOwner = pres.broker_id === userId;
    const isSameTenant = userProfile?.tenant_id === pres.tenant_id;

    if (!isSuperAdmin && !isOwner && !isSameTenant) {
      return new Response(JSON.stringify({ error: "Forbidden: you don't have access to this presentation" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    // --- END AUTH ---

    // Fetch branding
    const { data: branding } = await supabase.from("agency_profiles").select("*").eq("tenant_id", pres.tenant_id).single();

    // Fetch broker
    const { data: broker } = await supabase.from("broker_profiles").select("*").eq("user_id", pres.broker_id).single();
    const { data: brokerProfile } = await supabase.from("profiles").select("full_name, email, phone").eq("id", pres.broker_id).single();

    // Fetch approved comparables
    const { data: jobs } = await supabase.from("market_analysis_jobs").select("id").eq("presentation_id", presentation_id);
    let comparables: any[] = [];
    let report: any = null;
    if (jobs && jobs.length > 0) {
      const jobId = jobs[0].id;
      const { data: comps } = await supabase.from("market_comparables").select("*").eq("market_analysis_job_id", jobId).eq("is_approved", true);
      comparables = comps || [];
      const { data: rep } = await supabase.from("market_reports").select("*").eq("market_analysis_job_id", jobId).single();
      report = rep;
    }

    // Build AI prompt
    const tone = pres.selected_tone || "executivo";
    const prompt = `Você é um especialista em captação imobiliária de alto padrão.

Dados do imóvel:
- Título: ${pres.title || "N/A"}
- Tipo: ${pres.property_type || "N/A"}
- Finalidade: ${pres.property_purpose || "Venda"}
- Endereço: ${pres.address || "N/A"}, ${pres.neighborhood || ""}, ${pres.city || ""}
- Área total: ${pres.area_total || "N/A"} m²
- Área construída: ${pres.area_built || "N/A"} m²
- Dormitórios: ${pres.bedrooms || "N/A"} | Suítes: ${pres.suites || "N/A"} | Banheiros: ${pres.bathrooms || "N/A"}
- Vagas: ${pres.parking_spots || "N/A"}
- Padrão: ${pres.property_standard || "N/A"}
- Diferenciais: ${pres.highlights || "N/A"}
- Valor pretendido: R$ ${pres.owner_expected_price || "N/A"}

Corretor: ${brokerProfile?.full_name || "N/A"}
${broker?.short_bio ? `Bio: ${broker.short_bio}` : ""}
${broker?.specialties ? `Especialidades: ${broker.specialties}` : ""}

Imobiliária: ${branding?.company_name || "N/A"}

${comparables.length > 0 ? `Comparáveis aprovados (${comparables.length}):
${comparables.map(c => `- ${c.title}: R$ ${c.price}, ${c.area}m², ${c.bedrooms} quartos`).join("\n")}` : ""}

${report ? `Relatório de mercado:
- Preço médio: R$ ${report.avg_price}
- Mediana: R$ ${report.median_price}
- Preço aspiracional: R$ ${report.suggested_aspirational_price}
- Preço de mercado: R$ ${report.suggested_market_price}
- Venda acelerada: R$ ${report.suggested_fast_sale_price}` : ""}

Tom desejado: ${tone}

Gere os textos para cada seção da apresentação.`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "Você é um copywriter imobiliário de alto padrão. Retorne os textos solicitados." },
          { role: "user", content: prompt },
        ],
        tools: [{
          type: "function",
          function: {
            name: "generate_sections",
            description: "Generate structured text for each presentation section",
            parameters: {
              type: "object",
              properties: {
                property_summary: { type: "object", properties: { headline: { type: "string" }, description: { type: "string" }, buyer_profile: { type: "string" } }, required: ["headline", "description"] },
                broker_intro: { type: "object", properties: { text: { type: "string" } }, required: ["text"] },
                market_analysis: { type: "object", properties: { summary: { type: "string" }, price_justification: { type: "string" } }, required: ["summary"] },
                pricing_scenarios: { type: "object", properties: { aspirational_text: { type: "string" }, market_text: { type: "string" }, fast_sale_text: { type: "string" } }, required: ["aspirational_text", "market_text", "fast_sale_text"] },
                closing: { type: "object", properties: { text: { type: "string" } }, required: ["text"] },
              },
              required: ["property_summary", "broker_intro", "pricing_scenarios", "closing"],
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "generate_sections" } },
      }),
    });

    if (!aiResponse.ok) {
      const status = aiResponse.status;
      if (status === 429) return new Response(JSON.stringify({ error: "Rate limit exceeded. Try again later." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (status === 402) return new Response(JSON.stringify({ error: "Credits exhausted. Add funds." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      throw new Error(`AI gateway error: ${status}`);
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    let generated: any = {};
    if (toolCall?.function?.arguments) {
      generated = JSON.parse(toolCall.function.arguments);
    }

    // Update presentation sections with AI-generated content
    const sectionUpdates: Record<string, any> = {
      property_summary: generated.property_summary,
      broker_intro: generated.broker_intro,
      market_study_placeholder: generated.market_analysis,
      pricing_scenarios: generated.pricing_scenarios,
      closing: generated.closing,
    };

    for (const [key, content] of Object.entries(sectionUpdates)) {
      if (!content) continue;
      const { data: existing } = await supabase
        .from("presentation_sections")
        .select("id, content")
        .eq("presentation_id", presentation_id)
        .eq("section_key", key)
        .single();

      if (existing) {
        await supabase.from("presentation_sections").update({
          content: { ...(existing.content as any || {}), ...content, ai_generated: true },
        }).eq("id", existing.id);
      }
    }

    return new Response(JSON.stringify({ success: true, generated }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
