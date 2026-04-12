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

    const primaryColor = branding?.primary_color || "#1e3a5f";
    const secondaryColor = branding?.secondary_color || "#c9a84c";
    const companyName = branding?.company_name || "Listing Studio AI";
    const logoUrl = branding?.logo_url || "";

    const sectionHtml = (sections || []).map((s: any, idx: number) => {
      const content = s.content || {};
      const title = s.title || s.section_key;
      let body = "";

      if (typeof content === "object") {
        for (const [_key, val] of Object.entries(content)) {
          if (typeof val === "string" && val.length > 0) {
            body += `<p style="margin:6px 0;font-size:13px;line-height:1.7;color:#333;">${val}</p>`;
          }
        }
      }
      if (!body) body = `<p style="color:#999;font-size:13px;font-style:italic;">Conteúdo não disponível</p>`;

      return `
        <div style="page-break-inside:avoid;margin-bottom:28px;padding:28px 32px;background:#fff;border-left:4px solid ${primaryColor};border-radius:4px;box-shadow:0 1px 4px rgba(0,0,0,0.06);">
          <h2 style="color:${primaryColor};font-size:18px;margin:0 0 14px 0;font-family:Georgia,'Times New Roman',serif;letter-spacing:0.3px;">${title}</h2>
          ${body}
        </div>
        ${idx < (sections?.length || 0) - 1 && (idx + 1) % 3 === 0 ? '<div style="page-break-after:always;"></div>' : ''}
      `;
    }).join("");

    const logoBlock = logoUrl
      ? `<img src="${logoUrl}" style="max-height:48px;max-width:180px;object-fit:contain;" />`
      : `<div style="font-size:22px;font-weight:700;color:${primaryColor};font-family:Georgia,serif;">${companyName}</div>`;

    const dateStr = new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
    const locationParts = [pres.neighborhood, pres.city].filter(Boolean).join(", ");

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    @page { margin: 0; size: A4; }
    * { box-sizing: border-box; }
    body { font-family: 'Helvetica Neue', Arial, sans-serif; margin: 0; padding: 0; color: #1a1a1a; background: #f8f9fa; }
    .cover { height: 100vh; display: flex; flex-direction: column; justify-content: center; align-items: center; background: linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}dd 60%, ${secondaryColor}44 100%); color: #fff; page-break-after: always; text-align: center; padding: 60px; }
    .cover h1 { font-size: 36px; font-family: Georgia, serif; margin: 0 0 16px 0; font-weight: 400; letter-spacing: 1px; }
    .cover .subtitle { font-size: 16px; opacity: 0.85; margin-bottom: 8px; }
    .cover .divider { width: 80px; height: 3px; background: ${secondaryColor}; margin: 24px auto; border-radius: 2px; }
    .cover .company { font-size: 14px; opacity: 0.7; margin-top: 40px; }
    .content { padding: 40px 48px; }
    .page-header { display: flex; justify-content: space-between; align-items: center; padding: 16px 48px; border-bottom: 2px solid ${primaryColor}; margin-bottom: 32px; }
    .page-footer { text-align: center; padding: 20px 48px; border-top: 1px solid #e5e7eb; color: #999; font-size: 10px; margin-top: 40px; }
    .page-footer .brand { color: ${primaryColor}; font-weight: 600; }
  </style>
</head>
<body>
  <div class="cover">
    ${logoUrl ? `<img src="${logoUrl}" style="max-height:60px;margin-bottom:32px;filter:brightness(0) invert(1);" />` : ''}
    <h1>${pres.title || "Apresentação de Captação"}</h1>
    <div class="divider"></div>
    <div class="subtitle">${locationParts}</div>
    <div class="company">${companyName} — ${dateStr}</div>
  </div>

  <div class="page-header">
    ${logoBlock}
    <div style="font-size:11px;color:#666;">${dateStr}</div>
  </div>

  <div class="content">
    ${sectionHtml}
  </div>

  <div class="page-footer">
    <p>Documento gerado por <span class="brand">${companyName}</span> via Listing Studio AI</p>
    <p>${dateStr}</p>
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
