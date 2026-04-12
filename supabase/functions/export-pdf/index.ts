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

    // Get auth user from request
    const authHeader = req.headers.get("authorization");
    let userId: string | null = null;
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data: { user } } = await supabase.auth.getUser(token);
      userId = user?.id || null;
    }

    // Fetch presentation data
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

    // Build simple HTML for PDF
    const primaryColor = branding?.primary_color || "#1e3a5f";
    const companyName = branding?.company_name || "Listing Studio AI";

    const sectionHtml = (sections || []).map((s: any) => {
      const content = s.content || {};
      const title = s.title || s.section_key;
      let body = "";

      if (typeof content === "object") {
        for (const [key, val] of Object.entries(content)) {
          if (typeof val === "string" && val.length > 0) {
            body += `<p style="margin:4px 0;font-size:14px;line-height:1.6;">${val}</p>`;
          }
        }
      }
      if (!body) body = `<p style="color:#888;font-size:14px;">Conteúdo não disponível</p>`;

      return `
        <div style="page-break-inside:avoid;margin-bottom:32px;padding:24px;border:1px solid #e5e7eb;border-radius:12px;">
          <h2 style="color:${primaryColor};font-size:20px;margin-bottom:12px;font-family:serif;">${title}</h2>
          ${body}
        </div>
      `;
    }).join("");

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Helvetica Neue', Arial, sans-serif; margin:0; padding:40px; color:#1a1a1a; }
    .header { text-align:center; margin-bottom:40px; padding-bottom:20px; border-bottom:3px solid ${primaryColor}; }
    .header h1 { color:${primaryColor}; font-size:28px; margin:0; font-family:Georgia,serif; }
    .header p { color:#666; font-size:14px; margin-top:8px; }
    .footer { text-align:center; margin-top:40px; padding-top:20px; border-top:1px solid #e5e7eb; color:#999; font-size:11px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>${pres.title || "Apresentação de Captação"}</h1>
    <p>${companyName} — ${pres.neighborhood || ""} ${pres.city ? ", " + pres.city : ""}</p>
  </div>
  ${sectionHtml}
  <div class="footer">
    <p>Documento gerado por ${companyName} via Listing Studio AI</p>
    <p>${new Date().toLocaleDateString("pt-BR")}</p>
  </div>
</body>
</html>`;

    // Store HTML as a file (PDF rendering would require a headless browser; store as HTML for now)
    const fileName = `exports/${presentation_id}/${Date.now()}.html`;
    const { error: uploadError } = await supabase.storage
      .from("uploads")
      .upload(fileName, new Blob([html], { type: "text/html" }), { contentType: "text/html", upsert: true });

    if (uploadError) throw uploadError;

    const { data: publicUrl } = supabase.storage.from("uploads").getPublicUrl(fileName);

    // Record export
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
