import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { market_study_id } = await req.json();
    if (!market_study_id) throw new Error("market_study_id is required");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userErr } = await authClient.auth.getUser();
    if (userErr || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = user.id;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch study
    const { data: study } = await supabase.from("market_studies").select("*").eq("id", market_study_id).single();
    if (!study) throw new Error("Study not found");

    // Ownership check
    if (study.broker_id !== userId) {
      const { data: profile } = await supabase.from("profiles").select("tenant_id").eq("id", userId).single();
      const { data: role } = await supabase.from("user_roles").select("role").eq("user_id", userId).single();
      if (role?.role !== "super_admin" && profile?.tenant_id !== study.tenant_id) {
        return new Response(JSON.stringify({ error: "Forbidden" }), {
          status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Fetch related data
    const [subjectRes, comparablesRes, resultsRes, brandingRes] = await Promise.all([
      supabase.from("market_study_subject_properties").select("*").eq("market_study_id", market_study_id).limit(1),
      supabase.from("market_study_comparables").select("*").eq("market_study_id", market_study_id).eq("is_approved", true).order("similarity_score", { ascending: false }),
      supabase.from("market_study_results").select("*").eq("market_study_id", market_study_id).limit(1),
      supabase.from("agency_profiles").select("*").eq("tenant_id", study.tenant_id).limit(1),
    ]);

    const subject = subjectRes.data?.[0];
    const comparables = comparablesRes.data ?? [];
    const result = resultsRes.data?.[0];
    const branding = brandingRes.data?.[0];

    // Fetch adjustments for comparables
    const compIds = comparables.map((c: any) => c.id);
    let adjustmentsMap: Record<string, any[]> = {};
    if (compIds.length > 0) {
      const { data: adjs } = await supabase.from("market_study_adjustments").select("*").in("comparable_id", compIds);
      (adjs ?? []).forEach((a: any) => {
        if (!adjustmentsMap[a.comparable_id]) adjustmentsMap[a.comparable_id] = [];
        adjustmentsMap[a.comparable_id].push(a);
      });
    }

    const pc = branding?.primary_color || "#1e3a5f";
    const sc = branding?.secondary_color || "#c9a84c";
    const companyName = branding?.company_name || "Listing Studio AI";
    const logoUrl = branding?.logo_url || "";
    const dateStr = new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
    const locationParts = [subject?.neighborhood, subject?.city].filter(Boolean).join(", ");

    const fmtBRL = (v: number | null | undefined) =>
      v != null ? `R$ ${Number(v).toLocaleString("pt-BR", { maximumFractionDigits: 0 })}` : "—";

    // Build subject property grid
    const subjectStats = subject ? [
      { label: "Tipo", value: subject.property_type || subject.property_category },
      { label: "Área", value: subject.area_useful || subject.area_built ? `${subject.area_useful || subject.area_built} m²` : null },
      { label: "Quartos", value: subject.bedrooms },
      { label: "Suítes", value: subject.suites },
      { label: "Vagas", value: subject.parking_spots },
      { label: "Padrão", value: subject.construction_standard },
      { label: "Conservação", value: subject.conservation_state },
      { label: "Preço Esperado", value: subject.owner_expected_price ? fmtBRL(subject.owner_expected_price) : null },
    ].filter(s => s.value) : [];

    const subjectHtml = subjectStats.map(s => `
      <div style="padding:12px;border-radius:8px;border:1px solid #f0f0f0;background:${pc}06;text-align:center;">
        <div style="font-size:10px;color:#999;text-transform:uppercase;letter-spacing:1px;">${s.label}</div>
        <div style="font-size:14px;font-weight:700;color:${pc};margin-top:4px;">${s.value}</div>
      </div>
    `).join('');

    // Metrics section
    const metricsHtml = result ? [
      { label: "Preço Médio", value: fmtBRL(result.avg_price) },
      { label: "R$/m²", value: fmtBRL(result.avg_price_per_sqm) },
      { label: "Sugestão Anúncio", value: fmtBRL(result.suggested_ad_price) },
      { label: "Venda Rápida", value: fmtBRL(result.suggested_fast_sale_price) },
    ].map(m => `
      <div style="flex:1;padding:20px 16px;text-align:center;border-radius:12px;background:${pc}08;border:1px solid ${pc}15;">
        <div style="font-size:10px;text-transform:uppercase;letter-spacing:2px;color:#888;margin-bottom:6px;">${m.label}</div>
        <div style="font-size:20px;font-weight:800;color:${pc};font-family:Georgia,serif;">${m.value}</div>
      </div>
    `).join('') : '';

    // Price gauge bar
    let gaugeHtml = '';
    if (result?.price_range_min && result?.price_range_max) {
      const min = Number(result.price_range_min);
      const max = Number(result.price_range_max);
      const range = max - min || 1;
      const pos = (v: number) => Math.max(0, Math.min(100, ((v - min) / range) * 100));
      const markers = [
        { label: "Venda Rápida", value: Number(result.suggested_fast_sale_price), color: "#dc2626" },
        { label: "Mercado", value: Number(result.suggested_market_price), color: pc },
        { label: "Anúncio", value: Number(result.suggested_ad_price), color: "#16a34a" },
      ];
      const markerHtml = markers.map(m => `
        <div style="position:absolute;left:${pos(m.value)}%;transform:translateX(-50%);text-align:center;top:-8px;">
          <div style="width:3px;height:24px;background:${m.color};margin:0 auto;border-radius:2px;"></div>
          <div style="font-size:9px;color:${m.color};font-weight:700;margin-top:4px;white-space:nowrap;">${m.label}</div>
          <div style="font-size:11px;color:#333;font-weight:600;">${fmtBRL(m.value)}</div>
        </div>
      `).join('');

      gaugeHtml = `
        <div style="margin:32px 0;padding:0 20px;">
          <div style="position:relative;height:10px;background:linear-gradient(90deg,#dc262622,${pc}22,#16a34a22);border-radius:5px;margin-top:20px;margin-bottom:60px;">
            ${markerHtml}
          </div>
          <div style="display:flex;justify-content:space-between;font-size:10px;color:#aaa;">
            <span>${fmtBRL(min)}</span><span>${fmtBRL(max)}</span>
          </div>
        </div>
      `;
    }

    // Executive summary
    const summaryHtml = result?.executive_summary ? `
      <div style="page-break-inside:avoid;margin-bottom:32px;">
        <h2 style="color:${pc};font-size:18px;margin:0 0 8px;font-family:Georgia,serif;">Resumo Executivo</h2>
        <div style="width:48px;height:2px;background:${sc};border-radius:1px;margin-bottom:16px;"></div>
        <p style="font-size:13px;line-height:1.8;color:#444;white-space:pre-line;">${result.executive_summary}</p>
      </div>
    ` : '';

    const justificationHtml = result?.justification ? `
      <div style="page-break-inside:avoid;margin-bottom:32px;">
        <h2 style="color:${pc};font-size:18px;margin:0 0 8px;font-family:Georgia,serif;">Justificativa Técnica</h2>
        <div style="width:48px;height:2px;background:${sc};border-radius:1px;margin-bottom:16px;"></div>
        <p style="font-size:13px;line-height:1.8;color:#444;white-space:pre-line;">${result.justification}</p>
      </div>
    ` : '';

    // Comparables table
    const compRows = comparables.map((c: any) => {
      const adjs = adjustmentsMap[c.id] ?? [];
      const adjText = adjs.map((a: any) => `${a.direction === 'up' ? '↑' : a.direction === 'down' ? '↓' : '→'} ${a.label} (${a.percentage > 0 ? '+' : ''}${a.percentage}%)`).join(', ') || '—';
      return `
        <tr>
          <td style="padding:8px;border-bottom:1px solid #f0f0f0;font-size:12px;">
            <div style="font-weight:600;">${c.title || c.address || 'Sem título'}</div>
            <div style="color:#999;font-size:11px;">${c.neighborhood || ''}</div>
          </td>
          <td style="padding:8px;border-bottom:1px solid #f0f0f0;text-align:right;font-size:12px;">${fmtBRL(c.price)}</td>
          <td style="padding:8px;border-bottom:1px solid #f0f0f0;text-align:right;font-size:12px;font-weight:700;color:${pc};">${c.adjusted_price ? fmtBRL(c.adjusted_price) : '—'}</td>
          <td style="padding:8px;border-bottom:1px solid #f0f0f0;text-align:right;font-size:12px;">${fmtBRL(c.price_per_sqm)}</td>
          <td style="padding:8px;border-bottom:1px solid #f0f0f0;text-align:center;font-size:12px;">
            <span style="background:${Number(c.similarity_score) >= 70 ? pc + '15' : '#f0f0f0'};color:${Number(c.similarity_score) >= 70 ? pc : '#888'};padding:2px 8px;border-radius:10px;font-weight:600;">${Number(c.similarity_score).toFixed(0)}</span>
          </td>
          <td style="padding:8px;border-bottom:1px solid #f0f0f0;font-size:11px;color:#666;max-width:200px;">${adjText}</td>
        </tr>
      `;
    }).join('');

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
    .cover h1 { font-size: 36px; font-family: Georgia, serif; font-weight: 400; letter-spacing: 1px; line-height: 1.3; position: relative; }
    .cover .divider { width: 80px; height: 3px; background: ${sc}; margin: 24px auto; border-radius: 2px; }
    .cover .subtitle { font-size: 14px; opacity: 0.8; letter-spacing: 3px; text-transform: uppercase; }
    .cover .meta { font-size: 12px; opacity: 0.5; margin-top: 40px; letter-spacing: 1px; }
    .page-header {
      display: flex; justify-content: space-between; align-items: center;
      padding: 20px 48px; border-bottom: 2px solid ${pc};
    }
    .content { padding: 32px 48px; }
    .section-title { color: ${pc}; font-size: 18px; margin: 0 0 8px; font-family: Georgia, serif; }
    .section-divider { width: 48px; height: 2px; background: ${sc}; border-radius: 1px; margin-bottom: 16px; }
    .page-footer {
      text-align: center; padding: 20px 48px; border-top: 1px solid #eee; color: #bbb; font-size: 10px;
      margin-top: 40px; letter-spacing: 0.5px;
    }
  </style>
</head>
<body>
  <div class="cover">
    ${logoUrl ? `<img src="${logoUrl}" style="max-height:56px;margin-bottom:32px;filter:brightness(0) invert(1);position:relative;" />` : ''}
    <h1>Estudo de Mercado</h1>
    <div class="divider"></div>
    <div class="subtitle">${study.title || locationParts || 'Análise Comparativa'}</div>
    ${locationParts ? `<div style="font-size:13px;opacity:0.7;margin-top:8px;">${locationParts}</div>` : ''}
    <div class="meta">${companyName} — ${dateStr}</div>
  </div>

  <div class="page-header">
    ${logoUrl
      ? `<img src="${logoUrl}" style="max-height:32px;max-width:140px;object-fit:contain;" />`
      : `<div style="font-size:16px;font-weight:700;color:${pc};font-family:Georgia,serif;">${companyName}</div>`}
    <div style="font-size:10px;color:#999;letter-spacing:1px;">${dateStr}</div>
  </div>

  <div class="content">
    ${subject ? `
      <div style="page-break-inside:avoid;margin-bottom:32px;">
        <h2 class="section-title">Imóvel Avaliado</h2>
        <div class="section-divider"></div>
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;">${subjectHtml}</div>
      </div>
    ` : ''}

    ${result ? `
      <div style="page-break-inside:avoid;margin-bottom:32px;">
        <h2 class="section-title">Resultado da Avaliação</h2>
        <div class="section-divider"></div>
        <div style="display:flex;gap:12px;">${metricsHtml}</div>
        ${gaugeHtml}
      </div>
    ` : ''}

    ${summaryHtml}
    ${justificationHtml}

    <div style="page-break-before:always;"></div>

    ${comparables.length > 0 ? `
      <div style="margin-bottom:32px;">
        <h2 class="section-title">Comparáveis Selecionados (${comparables.length})</h2>
        <div class="section-divider"></div>
        <table style="width:100%;border-collapse:collapse;">
          <thead>
            <tr style="border-bottom:2px solid ${pc}22;">
              <th style="text-align:left;padding:8px;font-size:11px;color:#999;text-transform:uppercase;">Imóvel</th>
              <th style="text-align:right;padding:8px;font-size:11px;color:#999;text-transform:uppercase;">Preço</th>
              <th style="text-align:right;padding:8px;font-size:11px;color:#999;text-transform:uppercase;">Ajustado</th>
              <th style="text-align:right;padding:8px;font-size:11px;color:#999;text-transform:uppercase;">R$/m²</th>
              <th style="text-align:center;padding:8px;font-size:11px;color:#999;text-transform:uppercase;">Score</th>
              <th style="text-align:left;padding:8px;font-size:11px;color:#999;text-transform:uppercase;">Ajustes</th>
            </tr>
          </thead>
          <tbody>${compRows}</tbody>
        </table>
      </div>
    ` : ''}
  </div>

  <div class="page-footer">
    <p>Estudo de mercado gerado por <span style="color:${pc};font-weight:600;">${companyName}</span> via Listing Studio AI</p>
    <p style="margin-top:4px;">${dateStr}</p>
  </div>
</body>
</html>`;

    const fileName = `market-studies/${market_study_id}/${Date.now()}.html`;
    const { error: uploadError } = await supabase.storage
      .from("uploads")
      .upload(fileName, new Blob([html], { type: "text/html" }), { contentType: "text/html", upsert: true });
    if (uploadError) throw uploadError;

    const { data: publicUrl } = supabase.storage.from("uploads").getPublicUrl(fileName);

    return new Response(JSON.stringify({ success: true, url: publicUrl.publicUrl }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
