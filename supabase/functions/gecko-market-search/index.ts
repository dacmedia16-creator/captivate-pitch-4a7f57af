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
  property_type?: string; // "Apartamento" | "Casa" | etc.
}

/* =================== Text helpers =================== */
function normalize(s: string | null | undefined): string {
  return (s || "").toString().normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

function parseBRNumber(raw: string): number | null {
  if (!raw) return null;
  // Brazilian: 1.234.567,89 -> 1234567.89
  let s = raw.replace(/[^\d.,]/g, "");
  if (s.includes(",")) {
    s = s.replace(/\./g, "").replace(",", ".");
  } else if ((s.match(/\./g) || []).length > 1) {
    s = s.replace(/\./g, "");
  }
  const n = Number(s);
  return isFinite(n) && n > 0 ? n : null;
}

function extractBedrooms(text: string): number | null {
  const m = text.match(/(\d+)\s*(quartos?|dorm|dormit[óo]rios?)/i);
  if (m) return Number(m[1]);
  return null;
}
function extractBathrooms(text: string): number | null {
  const m = text.match(/(\d+)\s*banheiros?/i);
  return m ? Number(m[1]) : null;
}
function extractSuites(text: string): number | null {
  const m = text.match(/(\d+)\s*su[íi]tes?/i);
  return m ? Number(m[1]) : null;
}
function extractParking(text: string): number | null {
  const m = text.match(/(\d+)\s*(vagas?|garagens?)/i);
  return m ? Number(m[1]) : null;
}
function extractArea(text: string): number | null {
  // first occurrence of NN m²
  const m = text.match(/(\d+(?:[.,]\d+)?)\s*m[²2]\b/i);
  if (!m) return null;
  const n = parseBRNumber(m[1]);
  return n && n >= 15 && n <= 5000 ? n : null;
}
function extractPrice(text: string): number | null {
  // Try R$ patterns
  const matches = text.match(/R\$\s*([\d.,]+)/gi);
  if (matches) {
    for (const raw of matches) {
      const num = parseBRNumber(raw.replace(/R\$\s*/i, ""));
      if (num && num >= 50000 && num <= 100_000_000) return num;
    }
  }
  return null;
}

function parseFormattedAddress(addr: string | null): { address: string | null; neighborhood: string | null; city: string | null; state: string | null } {
  if (!addr) return { address: null, neighborhood: null, city: null, state: null };
  // "Rua X, 50 - Bairro, Cidade - UF"
  const m = addr.match(/^(.+?)\s*-\s*(.+?),\s*(.+?)\s*-\s*([A-Z]{2})\s*$/);
  if (m) {
    return { address: addr, neighborhood: m[2].trim(), city: m[3].trim(), state: m[4].trim() };
  }
  return { address: addr, neighborhood: null, city: null, state: null };
}

function detectPropertyType(title: string | null): string | null {
  const t = normalize(title);
  if (!t) return null;
  if (t.startsWith("apartamento") || t.startsWith("apartamentos")) return "Apartamento";
  if (t.includes("cobertura")) return "Cobertura";
  if (t.startsWith("casa de condom") || t.startsWith("casas de condom")) return "Casa de Condomínio";
  if (t.startsWith("casa") || t.startsWith("casas")) return "Casa";
  if (t.includes("terreno") || t.includes("lote")) return "Terreno";
  if (t.includes("studio") || t.includes("kitnet")) return "Studio";
  if (t.includes("sobrado")) return "Sobrado";
  return null;
}

function typeMatches(subjectType: string | null | undefined, candidateType: string | null): boolean {
  if (!subjectType) return true;
  const s = normalize(subjectType);
  const c = normalize(candidateType);
  if (!c) return false;
  if (s.startsWith("apart")) return c.startsWith("apart") || c.includes("cobertura") || c.includes("studio");
  if (s.startsWith("casa")) return c.startsWith("casa") || c.includes("sobrado");
  return s === c;
}

/* =================== Mapper =================== */
function mapGeckoPdpToComparable(payload: any, fallbackUrl: string) {
  const d = payload?.data ?? payload?.result ?? payload ?? {};
  const title: string | null = typeof d.title === "string" ? d.title : null;
  const description: string | null = typeof d.description === "string" ? d.description : null;
  const formattedAddress: string | null = typeof d.formattedAddress === "string" ? d.formattedAddress : null;
  const url: string = (typeof d.url === "string" && d.url) || fallbackUrl;

  const blob = [title, description, formattedAddress, url].filter(Boolean).join("\n");

  // Try structured price first
  let price: number | null = null;
  const pricesObj = d.prices;
  if (pricesObj && typeof pricesObj === "object") {
    const candidates = [pricesObj.price, pricesObj.main, pricesObj.salePrice, pricesObj.rentPrice];
    for (const c of candidates) {
      const n = typeof c === "number" ? c : parseBRNumber(String(c ?? ""));
      if (n && n >= 50000) { price = n; break; }
    }
  }
  if (!price) price = extractPrice(blob);

  const area = extractArea(title || "") || extractArea(blob);
  const bedrooms = extractBedrooms(blob);
  const bathrooms = extractBathrooms(blob);
  const suites = extractSuites(blob);
  const parking = extractParking(blob);
  const addr = parseFormattedAddress(formattedAddress);
  const propertyType = detectPropertyType(title);

  const images = Array.isArray(d.images) ? d.images : [];
  const image_url =
    (typeof images[0] === "string" && images[0]) ||
    (images[0]?.url) ||
    null;

  return {
    title,
    price,
    area,
    bedrooms,
    bathrooms,
    suites,
    parking_spots: parking,
    condominium_fee: null as number | null,
    iptu: null as number | null,
    neighborhood: addr.neighborhood,
    city: addr.city,
    state: addr.state,
    address: addr.address,
    property_type: propertyType,
    image_url,
    external_id: (typeof d.listingId === "string" && d.listingId) || (typeof d.listingExternalId === "string" && d.listingExternalId) || null,
    source_url: url,
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

/* =================== Stats =================== */
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

/* =================== Pipeline =================== */
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

  const rejections: string[] = [];

  try {
    await updatePhase("Buscando anúncios no Zap Imóveis (página 1)", "processing");

    const keyword =
      subject.keyword ||
      [subject.bedrooms ? `${subject.property_type || "apartamento"} ${subject.bedrooms} quartos` : (subject.property_type || "apartamento")].join(" ");

    const buildPlpBody = (page: number) => {
      const b: Record<string, any> = {
        target: "zapimoveis.com.br",
        type: "plp",
        page,
        keyword,
        city: subject.city,
        state: subject.state,
        businessType: subject.business_type || "sale",
      };
      if (subject.bedrooms) b.bedrooms = String(subject.bedrooms);
      if (subject.bathrooms) b.bathrooms = String(subject.bathrooms);
      if (subject.parking_spots) b.parkingSpots = String(subject.parking_spots);
      if (subject.min_price) b.minPrice = subject.min_price;
      if (subject.max_price) b.maxPrice = subject.max_price;
      if (subject.min_area) b.minArea = subject.min_area;
      if (subject.max_area) b.maxArea = subject.max_area;
      return b;
    };

    // PLP page 1
    const plp1 = await callGecko(token, buildPlpBody(1));
    if (plp1.status >= 400) {
      const msg = plp1.status === 401 || plp1.status === 403
        ? "Token GeckoAPI inválido. Avise o administrador."
        : plp1.status === 402
          ? "Sem créditos na GeckoAPI."
          : `GeckoAPI PLP retornou ${plp1.status}: ${JSON.stringify(plp1.json).slice(0, 200)}`;
      await updatePhase(`Erro: ${msg}`, "failed");
      return;
    }
    let urls = extractListingUrls(plp1.json);

    // PLP page 2 (best effort)
    if (urls.length < maxComparables * 2) {
      await updatePhase("Buscando anúncios no Zap Imóveis (página 2)");
      try {
        const plp2 = await callGecko(token, buildPlpBody(2));
        if (plp2.status < 400) {
          const more = extractListingUrls(plp2.json);
          urls = Array.from(new Set([...urls, ...more]));
        }
      } catch (e) {
        console.warn("PLP page 2 failed", e);
      }
    }

    urls = urls.slice(0, 30);
    if (urls.length === 0) {
      await updatePhase("Nenhum anúncio encontrado na busca", "failed");
      return;
    }

    const approvedComps: { price: number | null; area: number | null }[] = [];
    let approvedCount = 0;
    let i = 0;
    const cityNorm = normalize(subject.city);

    for (const url of urls) {
      if (approvedCount >= maxComparables) break;
      i++;
      await updatePhase(`Avaliando anúncio ${i}/${urls.length} (${approvedCount} aprovados)`);

      try {
        const pdp = await callGecko(token, { target: "zapimoveis.com.br", type: "pdp", url });
        if (pdp.status >= 400) {
          rejections.push(`#${i} PDP status ${pdp.status}`);
          continue;
        }
        const mapped = mapGeckoPdpToComparable(pdp.json, url);

        // Filters
        if (!mapped.price || !mapped.area) {
          rejections.push(`#${i} sem preço/área`);
          continue;
        }
        if (!typeMatches(subject.property_type, mapped.property_type)) {
          rejections.push(`#${i} tipo ${mapped.property_type} != ${subject.property_type}`);
          continue;
        }
        if (subject.bedrooms && mapped.bedrooms) {
          if (Math.abs(mapped.bedrooms - subject.bedrooms) > 1) {
            rejections.push(`#${i} quartos ${mapped.bedrooms} != ${subject.bedrooms}`);
            continue;
          }
        }
        if (mapped.city && cityNorm && normalize(mapped.city) !== cityNorm) {
          rejections.push(`#${i} cidade ${mapped.city} != ${subject.city}`);
          continue;
        }

        const pricePerSqm = Math.round(mapped.price / mapped.area);

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

        approvedComps.push({ price: mapped.price, area: mapped.area });
        approvedCount++;
      } catch (e: any) {
        rejections.push(`#${i} erro: ${e?.message || e}`);
        console.error(`PDP ${i} error`, e);
      }
    }

    console.log("Rejections:", rejections);

    await updatePhase("Calculando análise");

    const r = computeResults(approvedComps, subjectArea);
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
      research_metadata: {
        source: "gecko",
        target: "zapimoveis.com.br",
        listings_seen: urls.length,
        used: r.used,
        rejections: rejections.slice(0, 20),
      },
    });

    const finalPhase = r.used < 3
      ? `Concluído com poucos resultados (${r.used} anúncios válidos)`
      : null;
    await updatePhase(finalPhase, "completed");
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

    // Clear previous auto_gecko comparables for re-runs
    await supabase
      .from("market_study_comparables")
      .delete()
      .eq("market_study_id", market_study_id)
      .eq("origin", "auto_gecko");

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
