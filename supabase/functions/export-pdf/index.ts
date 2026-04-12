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

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get("authorization");
    let userId: string | null = null;
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data: { user } } = await supabase.auth.getUser(token);
      userId = user?.id || null;
    }

    const { data: pres } = await supabase.from("presentations").select("*").eq("id", presentation_id).single();
    if (!pres) throw new Error("Presentation not found");

    const { data: sections } = await supabase
      .from("presentation_sections")
      .select("*")
      .eq("presentation_id", presentation_id)
      .eq("is_visible", true)
      .order("sort_order");

    const { data: branding } = await supabase
      .from("agency_profiles")
      .select("*")
      .eq("tenant_id", pres.tenant_id)
      .single();

    const pc = branding?.primary_color || "#1e3a5f";
    const sc = branding?.secondary_color || "#c9a84c";
    const companyName = branding?.company_name || "Listing Studio AI";
    const logoUrl = branding?.logo_url || "";
    const dateStr = new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
    const locationParts = [pres.neighborhood, pres.city].filter(Boolean).join(", ");

    const renderSection = (s: any, idx: number) => {
      const content = s.content || {};
      const title = s.title || s.section_key;

      if (s.section_key === "pricing_scenarios" && content.scenarios) {
        const colors = ["#dc2626", pc, "#16a34a"];
        const labels = ["Venda Acelerada", "Preço de Mercado", "Aspiracional"];
        const scenarioCards = (content.scenarios || []).map((sc: any, i: number) => `
          <div style="flex:1;padding:24px 16px;text-align:center;border-radius:12px;border:2px solid ${colors[i]}22;background:${colors[i]}06;">
            <div style="font-size:10px;text-transform:uppercase;letter-spacing:2px;color:#888;margin-bottom:8px;">${sc.label || labels[i] || ''}</div>
            <div style="font-size:24px;font-weight:800;color:${colors[i]};font-family:Georgia,serif;">${sc.value ? `R$ ${Number(sc.value).toLocaleString("pt-BR")}` : "—"}</div>
          </div>
        `).join('');
        
        return `
          <div style="page-break-inside:avoid;margin-bottom:32px;">
            <h2 style="color:${pc};font-size:20px;margin:0 0 8px 0;font-family:Georgia,serif;">${title}</h2>
            <div style="width:48px;height:2px;background:${sc};border-radius:1px;margin-bottom:16px;"></div>
            ${content.owner_expected_price ? `<p style="color:#666;font-size:13px;margin-bottom:16px;">Valor pretendido: <strong style="font-size:16px;">R$ ${Number(content.owner_expected_price).toLocaleString("pt-BR")}</strong></p>` : ''}
            <div style="display:flex;gap:16px;">${scenarioCards}</div>
          </div>
        `;
      }

      if (s.section_key === "property_summary") {
        const stats = [
          { label: "Tipo", value: content.property_type },
          { label: "Área Total", value: content.area_total ? `${content.area_total} m²` : null },
          { label: "Dormitórios", value: content.bedrooms },
          { label: "Suítes", value: content.suites },
          { label: "Vagas", value: content.parking_spots },
          { label: "Padrão", value: content.property_standard },
        ].filter(i => i.value);
        
        const statsHtml = stats.map(st => `
          <div style="padding:12px;border-radius:8px;border:1px solid #f0f0f0;background:${pc}04;text-align:center;">
            <div style="font-size:10px;color:#999;text-transform:uppercase;letter-spacing:1px;">${st.label}</div>
            <div style="font-size:15px;font-weight:700;color:${pc};margin-top:4px;">${st.value}</div>
          </div>
        `).join('');

        return `
          <div style="page-break-inside:avoid;margin-bottom:32px;">
            <h2 style="color:${pc};font-size:20px;margin:0 0 8px 0;font-family:Georgia,serif;">${title}</h2>
            <div style="width:48px;height:2px;background:${sc};border-radius:1px;margin-bottom:16px;"></div>
            <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:16px;">${statsHtml}</div>
            ${content.highlights ? `<p style="color:#555;font-size:13px;line-height:1.7;border-left:3px solid ${sc};padding-left:16px;">${content.highlights}</p>` : ''}
          </div>
        `;
      }

      // Generic section
      let body = "";
      if (typeof content === "object") {
        for (const [_key, val] of Object.entries(content)) {
          if (typeof val === "string" && val.length > 0 && !_key.includes("url") && !_key.includes("image")) {
            body += `<p style="margin:6px 0;font-size:13px;line-height:1.8;color:#444;">${val}</p>`;
          }
        }
      }
      if (!body) body = `<p style="color:#bbb;font-size:13px;font-style:italic;">Conteúdo não disponível</p>`;

      return `
        <div style="page-break-inside:avoid;margin-bottom:32px;">
          <h2 style="color:${pc};font-size:20px;margin:0 0 8px 0;font-family:Georgia,serif;letter-spacing:0.3px;">${title}</h2>
          <div style="width:48px;height:2px;background:${sc};border-radius:1px;margin-bottom:16px;"></div>
          ${body}
        </div>
        ${idx > 0 && (idx + 1) % 3 === 0 ? '<div style="page-break-after:always;"></div>' : ''}
      `;
    };

    const sectionHtml = (sections || []).map((s: any, idx: number) => renderSection(s, idx)).join("");

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    @page { margin: 0; size: A4; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #1a1a1a; background: #fff; }
    
    .cover {
      height: 100vh; display: flex; flex-direction: column; justify-content: center; align-items: center;
      background: linear-gradient(135deg, ${pc} 0%, ${pc}dd 60%, ${sc}22 100%);
      color: #fff; page-break-after: always; text-align: center; padding: 60px; position: relative;
    }
    .cover::before {
      content: ''; position: absolute; top: 0; right: 0; width: 40%; height: 100%;
      background: radial-gradient(ellipse at center, ${sc}15 0%, transparent 70%);
    }
    .cover h1 { font-size: 38px; font-family: Georgia, serif; font-weight: 400; letter-spacing: 1px; line-height: 1.2; position: relative; }
    .cover .divider { width: 80px; height: 3px; background: ${sc}; margin: 28px auto; border-radius: 2px; }
    .cover .subtitle { font-size: 15px; opacity: 0.8; letter-spacing: 3px; text-transform: uppercase; }
    .cover .company { font-size: 12px; opacity: 0.5; margin-top: 48px; letter-spacing: 1px; }

    .page-header {
      display: flex; justify-content: space-between; align-items: center;
      padding: 20px 48px; border-bottom: 2px solid ${pc};
    }
    .content { padding: 32px 48px; }
    .page-footer {
      text-align: center; padding: 24px 48px; border-top: 1px solid #eee; color: #bbb; font-size: 10px;
      margin-top: 48px; letter-spacing: 0.5px;
    }
    .page-footer .brand { color: ${pc}; font-weight: 600; }
  </style>
</head>
<body>
  <div class="cover">
    ${logoUrl ? `<img src="${logoUrl}" style="max-height:56px;margin-bottom:36px;filter:brightness(0) invert(1);position:relative;" />` : ''}
    <h1>${pres.title || "Apresentação de Captação"}</h1>
    <div class="divider"></div>
    <div class="subtitle">${locationParts}</div>
    <div class="company">${companyName} — ${dateStr}</div>
  </div>

  <div class="page-header">
    ${logoUrl
      ? `<img src="${logoUrl}" style="max-height:36px;max-width:160px;object-fit:contain;" />`
      : `<div style="font-size:18px;font-weight:700;color:${pc};font-family:Georgia,serif;">${companyName}</div>`
    }
    <div style="font-size:10px;color:#999;letter-spacing:1px;">${dateStr}</div>
  </div>

  <div class="content">
    ${sectionHtml}
  </div>

  <div class="page-footer">
    <p>Documento gerado por <span class="brand">${companyName}</span> via Listing Studio AI</p>
    <p style="margin-top:4px;">${dateStr}</p>
  </div>
</body>
</html>`;

    const fileName = `exports/${presentation_id}/${Date.now()}.html`;
    const { error: uploadError } = await supabase.storage
      .from("uploads")
      .upload(fileName, new Blob([html], { type: "text/html" }), { contentType: "text/html", upsert: true });

    if (uploadError) throw uploadError;

    const { data: publicUrl } = supabase.storage.from("uploads").getPublicUrl(fileName);

    await supabase.from("export_history").insert({
      presentation_id,
      export_type: "pdf",
      file_url: publicUrl.publicUrl,
      created_by: userId,
    });

    return new Response(JSON.stringify({ success: true, url: publicUrl.publicUrl }), {
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
