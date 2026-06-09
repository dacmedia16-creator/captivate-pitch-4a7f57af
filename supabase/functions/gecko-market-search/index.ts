// gecko-market-search: PLP -> PDP cascade via GeckoAPI for Zap Imóveis
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const GECKO_URL = "https://api.geckoapi.com.br/v1/extract";

interface SubjectInput {
  city: string;
  state: string;
  bedrooms?: number;
  bathrooms?: number;
  parking_spots?: number;
  business_type?: "sale" | "rent";
  min_price?: number;
  max_price?: number;
  min_area?: number;
  max_area?: number;
  keyword?: string;
}

function pickNum(obj: any, keys: string[]): number | null {
  for (const k of keys) {
    const parts = k.split(".");
    let v: any = obj;
    for (const p of parts) {
      v = v?.[p];
      if (v == null) break;
    }
    if (v == null) continue;
    const n = typeof v === "number" ? v : Number(String(v).replace(/[^\d.,-]/g, "").replace(/\.(?=\d{3}(\D|$))/g, "").replace(",", "."));
    if (!isNaN(n) && n > 0) return n;
  }
  return null;
}

function pickStr(obj: any, keys: string[]): string | null {
  for (const k of keys) {
    const parts = k.split(".");
    let v: any = obj;
    for (const p of parts) {
      v = v?.[p];
      if (v == null) break;
    }
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return null;
}

/** Best-effort mapper from Gecko PDP payload to a comparable row. */
function mapGeckoPdpToComparable(payload: any, fallbackUrl: string) {
  const d = payload?.data ?? payload?.result ?? payload ?? {};
  return {
    title: pickStr(d, ["title", "name", "headline", "listing.title"]),
    price: pickNum(d, ["price", "total_price", "sale_price", "rent_price", "listing.price", "prices.price"]),
    area: pickNum(d, ["area", "usable_area", "useful_area", "total_area", "private_area", "listing.area"]),
    bedrooms: pickNum(d, ["bedrooms", "bedroom", "rooms", "listing.bedrooms"]),
    bathrooms: pickNum(d, ["bathrooms", "bathroom", "listing.bathrooms"]),
    parking_spots: pickNum(d, ["parking", "parking_spots", "garage", "vacancies", "listing.parking"]),
    suites: pickNum(d, ["suites", "suite", "listing.suites"]),
    condominium_fee: pickNum(d, ["condominium_fee", "condo_fee", "condoFee", "monthlyCondoFee"]),
    iptu: pickNum(d, ["iptu", "yearly_iptu", "tax", "propertyTax"]),
    neighborhood: pickStr(d, ["neighborhood", "address.neighborhood", "location.neighborhood", "district"]),
    city: pickStr(d, ["city", "address.city", "location.city"]),
    address: pickStr(d, ["address.street", "address.full", "fullAddress", "location.address"]),
    property_type: pickStr(d, ["property_type", "type", "listing.type", "category"]),
    image_url: pickStr(d, ["image", "image_url", "thumbnail", "images.0", "media.0.url", "photos.0"]),
    external_id: pickStr(d, ["id", "external_id", "listing.id"]),
    source_url: pickStr(d, ["url", "source_url", "listing.url"]) || fallbackUrl,
    raw_data: d,
  };
}

/** Extract listing URLs from Gecko PLP payload. */
function extractListingUrls(payload: any): string[] {
  const d = payload?.data ?? payload?.result ?? payload ?? {};
  const candidates: any[] =
    d?.listings || d?.results || d?.items || d?.properties || d?.data || (Array.isArray(d) ? d : []);
  const urls: string[] = [];
  for (const item of candidates ?? []) {
    const u = typeof item === "string"
      ? item
      : item?.url || item?.link || item?.href || item?.listing_url || item?.detail_url;
    if (typeof u === "string" && u.startsWith("http")) urls.push(u);
  }
  return Array.from(new Set(urls));
}

async function callGecko(token: string, body: Record<string, any>) {
  const r = await fetch(GECKO_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const text = await r.text();
  let json: any;
  try { json = JSON.parse(text); } catch { json = { raw: text }; }
  return { status: r.status, json };
}

/** ============ Stats (port of useManualMarketAnalysis) ============ */
function median(vs: number[]) {
  if (!vs.length) return 0;
  const s = [...vs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}
function percentile(vs: number[], p: number) {
  if (!vs.length) return 0;
  const s = [...vs].sort((a, b) => a - b);
  const i = (s.length - 1) * p;
  const lo = Math.floor(i), hi = Math.ceil(i);
  if (lo === hi) return s[lo];
  return s[lo] + (s[hi] - s[lo]) * (i - lo);
}
function computeResults(comps: { price: number | null; area: number | null }[], subjectArea: number) {
  const valid = comps.filter((c) => c.price && c.area && c.area > 0);
  const pp = valid.map((c) => Number(c.price) / Number(c.area));
  const used = valid.length;
  if (used === 0) {
    return { used, avg_price_per_sqm: 0, median_price_per_sqm: 0, suggested_market_price: 0, suggested_fast_sale_price: 0, suggested_aspirational_price: 0, conservative_min: 0, aggressive_max: 0, confidence: "low" };
  }
  const avg = pp.reduce((a, b) => a + b, 0) / pp.length;
  const med = median(pp);
  const p25 = percentile(pp, 0.25);
  const p75 = percentile(pp, 0.75);
  const minP = Math.min(...pp);
  const maxP = Math.max(...pp);
  const area = subjectArea > 0 ? subjectArea : 0;
  const market = Math.round(med * area);
  return {
    used,
    avg_price_per_sqm: Math.round(avg),
    median_price_per_sqm: Math.round(med),
    suggested_market_price: market,
    suggested_fast_sale_price: Math.round(market * 0.92),
    suggested_aspirational_price: Math.round(market * 1.1),
    conservative_min: Math.round(minP * area),
    aggressive_max: Math.round(maxP * area),
    confidence: used >= 5 ? "high" : used >= 3 ? "medium" : "low",
  };
}

/** ============ Pipeline ============ */
async function runPipeline(opts: {
  supabase: any;
  token: string;
  studyId: string;
  subject: SubjectInput;
  subjectArea: number;
  maxComparables: number;
}) {
  const { supabase, token, studyId, subject, subjectArea, maxComparables } = opts;
  const updatePhase = (phase: string | null, status?: string) =>
    supabase.from("market_studies").update({
      current_phase: phase,
      ...(status ? { status } : {}),
      updated_at: new Date().toISOString(),
    }).eq("id", studyId);

  try {
    await updatePhase("Buscando anúncios no Zap Imóveis", "processing");

    const keyword =
      subject.keyword ||
      [subject.bedrooms ? `apartamento ${subject.bedrooms} quartos` : "apartamento"].join(" ");

    const plpBody: Record<string, any> = {
      target: "zapimoveis.com.br",
      type: "plp",
      page: 1,
      keyword,
      city: subject.city,
      state: subject.state,
      businessType: subject.business_type || "sale",
    };
    if (subject.bedrooms) plpBody.bedrooms = String(subject.bedrooms);
    if (subject.bathrooms) plpBody.bathrooms = String(subject.bathrooms);
    if (subject.parking_spots) plpBody.parkingSpots = String(subject.parking_spots);
    if (subject.min_price) plpBody.minPrice = subject.min_price;
    if (subject.max_price) plpBody.maxPrice = subject.max_price;
    if (subject.min_area) plpBody.minArea = subject.min_area;
    if (subject.max_area) plpBody.maxArea = subject.max_area;

    const plp = await callGecko(token, plpBody);
    if (plp.status >= 400) {
      const msg = plp.status === 401 || plp.status === 403
        ? "Token GeckoAPI inválido. Avise o administrador."
        : plp.status === 402
          ? "Sem créditos na GeckoAPI."
          : `GeckoAPI PLP retornou ${plp.status}: ${JSON.stringify(plp.json).slice(0, 200)}`;
      await updatePhase(`Erro: ${msg}`, "failed");
      return;
    }

    const urls = extractListingUrls(plp.json).slice(0, Math.min(maxComparables, 20));
    if (urls.length === 0) {
      await updatePhase("Nenhum anúncio encontrado na busca", "failed");
      return;
    }

    // Iterate PDPs
    const comparables: { price: number | null; area: number | null }[] = [];
    let i = 0;
    for (const url of urls) {
      i++;
      await updatePhase(`Extraindo anúncio ${i}/${urls.length}`);
      try {
        const pdp = await callGecko(token, { target: "zapimoveis.com.br", type: "pdp", url });
        if (pdp.status >= 400) {
          console.warn(`PDP ${i} failed status ${pdp.status}`);
          continue;
        }
        const mapped = mapGeckoPdpToComparable(pdp.json, url);
        const pricePerSqm =
          mapped.price && mapped.area && mapped.area > 0
            ? Math.round(mapped.price / mapped.area)
            : null;

        await supabase.from("market_study_comparables").insert({
          market_study_id: studyId,
          origin: "auto_gecko",
          source_url: mapped.source_url,
          source_name: "Zap Imóveis",
          title: mapped.title,
          price: mapped.price,
          area: mapped.area,
          price_per_sqm: pricePerSqm,
          bedrooms: mapped.bedrooms ? Math.round(mapped.bedrooms) : null,
          bathrooms: mapped.bathrooms ? Math.round(mapped.bathrooms) : null,
          parking_spots: mapped.parking_spots ? Math.round(mapped.parking_spots) : null,
          suites: mapped.suites ? Math.round(mapped.suites) : null,
          condominium_fee: mapped.condominium_fee,
          iptu: mapped.iptu,
          neighborhood: mapped.neighborhood,
          city: mapped.city,
          address: mapped.address,
          property_type: mapped.property_type,
          image_url: mapped.image_url,
          external_id: mapped.external_id,
          raw_data: mapped.raw_data,
          is_approved: true,
        });

        comparables.push({ price: mapped.price, area: mapped.area });
      } catch (e) {
        console.error(`PDP ${i} error`, e);
      }
    }

    await updatePhase("Calculando análise");

    const r = computeResults(comparables, subjectArea);
    await supabase.from("market_study_results").delete().eq("market_study_id", studyId);
    await supabase.from("market_study_results").insert({
      market_study_id: studyId,
      avg_price: r.suggested_market_price,
      median_price: Math.round(r.median_price_per_sqm * subjectArea),
      avg_price_per_sqm: r.avg_price_per_sqm,
      suggested_market_price: r.suggested_market_price,
      suggested_fast_sale_price: r.suggested_fast_sale_price,
      suggested_ad_price: r.suggested_aspirational_price,
      price_range_min: r.conservative_min,
      price_range_max: r.aggressive_max,
      confidence_level: r.confidence,
      research_metadata: { source: "gecko", target: "zapimoveis.com.br", listings_seen: urls.length, used: r.used },
    });

    await updatePhase(null, "completed");
  } catch (err: any) {
    console.error("Pipeline fatal", err);
    await updatePhase(`Erro: ${err?.message || "falha inesperada"}`, "failed");
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const token = Deno.env.get("GECKOAPI_TOKEN");
    if (!token) {
      return new Response(JSON.stringify({ error: "GECKOAPI_TOKEN não configurado" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAuth = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: claims, error: claimsErr } = await supabaseAuth.auth.getClaims(authHeader.replace("Bearer ", ""));
    if (claimsErr || !claims?.claims?.sub) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { market_study_id, subject, max_comparables, subject_area } = body || {};
    if (!market_study_id || !subject?.city || !subject?.state) {
      return new Response(JSON.stringify({ error: "market_study_id, subject.city e subject.state são obrigatórios" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Verify the study belongs to the caller (defense in depth)
    const { data: study } = await supabase
      .from("market_studies")
      .select("id, broker_id")
      .eq("id", market_study_id)
      .single();
    if (!study || study.broker_id !== claims.claims.sub) {
      return new Response(JSON.stringify({ error: "Estudo não encontrado" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fire background pipeline
    // @ts-ignore deno edge runtime
    EdgeRuntime.waitUntil(runPipeline({
      supabase,
      token,
      studyId: market_study_id,
      subject,
      subjectArea: Number(subject_area) || 0,
      maxComparables: Math.min(Number(max_comparables) || 10, 20),
    }));

    return new Response(JSON.stringify({ scheduled: true, study_id: market_study_id }), {
      status: 202, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error(err);
    return new Response(JSON.stringify({ error: err?.message || "Erro inesperado" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
