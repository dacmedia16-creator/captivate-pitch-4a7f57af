import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // 1. Create tenant
    const { data: tenant, error: tenantErr } = await supabaseAdmin
      .from("tenants")
      .insert({ name: "Imobiliária Premium Demo", slug: "premium-demo", status: "active" })
      .select()
      .single();
    if (tenantErr) throw tenantErr;

    // 2. Create agency profile
    await supabaseAdmin.from("agency_profiles").insert({
      tenant_id: tenant.id,
      company_name: "Imobiliária Premium Demo",
      primary_color: "#1e3a5f",
      secondary_color: "#c9a84c",
      about_global: "Líder global em soluções imobiliárias premium com presença em mais de 50 países.",
      about_national: "Referência nacional em captação e venda de imóveis de alto padrão.",
      about_regional: "Atuação consolidada nas principais regiões metropolitanas do país.",
      regional_numbers: "500+ imóveis vendidos | R$ 2bi em VGV | 15 anos de mercado",
    });

    // 3. Create users via admin API
    const users = [
      { email: "admin@demo.com", fullName: "Ana Souza", role: "agency_admin" as const },
      { email: "corretor1@demo.com", fullName: "Carlos Lima", role: "broker" as const },
      { email: "corretor2@demo.com", fullName: "Marina Costa", role: "broker" as const },
    ];

    const createdUsers: { id: string; role: string; email: string }[] = [];

    for (const u of users) {
      const { data: authUser, error: authErr } = await supabaseAdmin.auth.admin.createUser({
        email: u.email,
        password: "12345678",
        email_confirm: true,
        user_metadata: { full_name: u.fullName },
      });
      if (authErr) throw authErr;

      await supabaseAdmin
        .from("profiles")
        .update({ tenant_id: tenant.id, full_name: u.fullName, role: u.role })
        .eq("id", authUser.user.id);

      await supabaseAdmin.from("user_roles").insert({ user_id: authUser.user.id, role: u.role });

      createdUsers.push({ id: authUser.user.id, role: u.role, email: u.email });
    }

    // 4. Create broker profiles
    const brokers = createdUsers.filter((u) => u.role === "broker");

    const brokerData = [
      {
        user_id: brokers[0].id,
        creci: "CRECI-SP 123456",
        short_bio: "Especialista em imóveis de alto padrão na região dos Jardins e Itaim Bibi.",
        years_in_market: 8,
        education: "MBA em Gestão Imobiliária - FGV",
        specialties: "Alto padrão, Coberturas, Imóveis comerciais",
        service_regions: "Jardins, Itaim Bibi, Vila Nova Conceição",
        vgv_summary: "R$ 180M em vendas nos últimos 3 anos",
        preferred_tone: "formal",
        preferred_layout: "executivo",
      },
      {
        user_id: brokers[1].id,
        creci: "CRECI-SP 654321",
        short_bio: "Corretora com foco em residenciais de médio e alto padrão na zona sul de SP.",
        years_in_market: 5,
        education: "Arquitetura e Urbanismo - USP",
        specialties: "Residenciais, Apartamentos, Lançamentos",
        service_regions: "Moema, Campo Belo, Brooklin",
        vgv_summary: "R$ 95M em vendas nos últimos 3 anos",
        preferred_tone: "amigavel",
        preferred_layout: "premium",
      },
    ];

    for (const bp of brokerData) {
      await supabaseAdmin.from("broker_profiles").insert(bp);
    }

    // 5. Seed marketing actions
    await supabaseAdmin.from("marketing_actions").insert([
      { tenant_id: tenant.id, title: "Tour Virtual 360°", description: "Experiência imersiva com tour virtual profissional", sort_order: 1 },
      { tenant_id: tenant.id, title: "Fotografia Profissional", description: "Ensaio fotográfico com equipamento profissional", sort_order: 2 },
      { tenant_id: tenant.id, title: "Anúncios Premium", description: "Destaque nos principais portais imobiliários", sort_order: 3 },
      { tenant_id: tenant.id, title: "Base de Clientes", description: "Divulgação para base qualificada de compradores", sort_order: 4 },
      { tenant_id: tenant.id, title: "Open House", description: "Evento exclusivo de visitação para compradores selecionados", sort_order: 5 },
    ]);

    // 6. Seed competitive differentials
    await supabaseAdmin.from("competitive_differentials").insert([
      { tenant_id: tenant.id, title: "IA para Precificação", description: "Análise de mercado inteligente com dados reais", sort_order: 1 },
      { tenant_id: tenant.id, title: "Marketing 360°", description: "Estratégia completa de divulgação multicanal", sort_order: 2 },
      { tenant_id: tenant.id, title: "Atendimento Premium", description: "Acompanhamento personalizado em todas as etapas", sort_order: 3 },
    ]);

    // 7. Seed sales results
    await supabaseAdmin.from("sales_results").insert([
      { tenant_id: tenant.id, title: "Imóveis Vendidos", metric_value: "500+", description: "Nos últimos 5 anos", sort_order: 1 },
      { tenant_id: tenant.id, title: "VGV Total", metric_value: "R$ 2 bi", description: "Volume geral de vendas", sort_order: 2 },
      { tenant_id: tenant.id, title: "Tempo Médio de Venda", metric_value: "45 dias", description: "Média de captação até fechamento", sort_order: 3 },
    ]);

    // 8. Create demo presentation for corretor1
    const broker1 = brokers[0];
    const { data: presentation, error: presErr } = await supabaseAdmin
      .from("presentations")
      .insert({
        tenant_id: tenant.id,
        broker_id: broker1.id,
        title: "Apartamento Jardins — 220m²",
        status: "ready",
        property_type: "Apartamento",
        property_purpose: "Venda",
        address: "Rua Oscar Freire, 1200",
        city: "São Paulo",
        neighborhood: "Jardins",
        condominium: "Edifício Premiere",
        cep: "01426-001",
        area_total: 220,
        area_built: 200,
        bedrooms: 4,
        suites: 2,
        bathrooms: 3,
        parking_spots: 3,
        property_standard: "Alto Padrão",
        property_age: "5-10 anos",
        highlights: "Varanda gourmet, piscina privativa, vista panorâmica, acabamento premium",
        owner_expected_price: 3200000,
        owner_name: "Roberto Mendes",
        selected_layout: "executivo",
        selected_tone: "formal",
        creation_mode: "automatico",
        share_token: "demo-share-token-2025",
      })
      .select()
      .single();
    if (presErr) throw presErr;

    // 9. Create 12 presentation sections
    const sectionData = [
      { section_key: "capa", title: "Capa", sort_order: 0, content: { titulo: "Apartamento Jardins — 220m²", subtitulo: "Apresentação exclusiva de captação", localizacao: "Jardins, São Paulo" } },
      { section_key: "corretor", title: "Seu Corretor", sort_order: 1, content: { nome: "Carlos Lima", creci: "CRECI-SP 123456", bio: "Especialista em imóveis de alto padrão na região dos Jardins e Itaim Bibi. 8 anos de experiência com MBA em Gestão Imobiliária pela FGV.", especialidades: "Alto padrão, Coberturas, Imóveis comerciais", vgv: "R$ 180M em vendas nos últimos 3 anos" } },
      { section_key: "global", title: "Presença Global", sort_order: 2, content: { texto: "Líder global em soluções imobiliárias premium com presença em mais de 50 países, conectando compradores e vendedores ao redor do mundo com excelência e confiança." } },
      { section_key: "nacional", title: "Atuação Nacional", sort_order: 3, content: { texto: "Referência nacional em captação e venda de imóveis de alto padrão, com escritórios nas principais capitais e uma rede de mais de 2.000 corretores certificados." } },
      { section_key: "regional", title: "Presença Regional", sort_order: 4, content: { texto: "Atuação consolidada nas principais regiões metropolitanas do país.", numeros: "500+ imóveis vendidos | R$ 2bi em VGV | 15 anos de mercado" } },
      { section_key: "imovel", title: "O Imóvel", sort_order: 5, content: { descricao: "Apartamento de alto padrão com 220m² no coração dos Jardins. Acabamento premium com varanda gourmet, 4 dormitórios (2 suítes), 3 banheiros e 3 vagas de garagem. Vista panorâmica e piscina privativa no terraço.", tipo: "Apartamento", area: "220 m²", quartos: "4", vagas: "3", padrao: "Alto Padrão" } },
      { section_key: "marketing", title: "Plano de Marketing", sort_order: 6, content: { intro: "Estratégia completa de divulgação para maximizar a exposição do seu imóvel:", acoes: "Tour Virtual 360° • Fotografia Profissional • Anúncios Premium nos principais portais • Divulgação para base qualificada de compradores • Open House exclusivo" } },
      { section_key: "diferenciais", title: "Diferenciais Competitivos", sort_order: 7, content: { intro: "Por que escolher a Imobiliária Premium Demo:", lista: "IA para Precificação — análise inteligente com dados reais • Marketing 360° — estratégia completa multicanal • Atendimento Premium — acompanhamento personalizado em todas as etapas" } },
      { section_key: "resultados", title: "Resultados Comprovados", sort_order: 8, content: { vendas: "500+ imóveis vendidos nos últimos 5 anos", vgv: "R$ 2 bilhões em volume geral de vendas", tempo: "Tempo médio de venda: 45 dias da captação ao fechamento" } },
      { section_key: "estudo_mercado", title: "Estudo de Mercado", sort_order: 9, content: { resumo: "Análise comparativa de mercado baseada em imóveis similares na região dos Jardins, São Paulo. Dados coletados de portais como Viva Real, ZAP e OLX.", comparaveis: "6 imóveis comparáveis analisados na região" } },
      { section_key: "cenarios_preco", title: "Cenários de Preço", sort_order: 10, content: { aspiracional: "R$ 3.450.000 — Preço aspiracional (+15%)", mercado: "R$ 3.000.000 — Preço de mercado (mediana)", venda_rapida: "R$ 2.550.000 — Venda acelerada (-15%)" } },
      { section_key: "fechamento", title: "Próximos Passos", sort_order: 11, content: { texto: "Estamos prontos para iniciar a comercialização do seu imóvel com a estratégia mais completa do mercado. Entre em contato para agendar uma reunião e definir os próximos passos.", contato: "Carlos Lima — CRECI-SP 123456 — corretor1@demo.com" } },
    ];

    for (const sec of sectionData) {
      await supabaseAdmin.from("presentation_sections").insert({
        presentation_id: presentation.id,
        ...sec,
      });
    }

    // 10. Create market analysis job
    const { data: job, error: jobErr } = await supabaseAdmin
      .from("market_analysis_jobs")
      .insert({
        tenant_id: tenant.id,
        presentation_id: presentation.id,
        status: "completed",
        started_at: new Date(Date.now() - 3600000).toISOString(),
        finished_at: new Date().toISOString(),
        filters: { radius: 2, priceMin: 2000000, priceMax: 4500000, areaMin: 150, areaMax: 300, maxComparables: 10 },
        selected_portals: [],
      })
      .select()
      .single();
    if (jobErr) throw jobErr;

    // 11. Insert comparables
    const comparables = [
      { title: "Apto Alameda Santos 180m²", neighborhood: "Jardins", price: 2800000, area: 180, price_per_sqm: 15556, bedrooms: 3, parking_spots: 2, similarity_score: 92, source_name: "Viva Real", is_approved: true },
      { title: "Cobertura Rua Haddock Lobo 250m²", neighborhood: "Jardins", price: 3500000, area: 250, price_per_sqm: 14000, bedrooms: 4, parking_spots: 3, similarity_score: 88, source_name: "ZAP", is_approved: true },
      { title: "Apto Rua Augusta 200m²", neighborhood: "Consolação", price: 2600000, area: 200, price_per_sqm: 13000, bedrooms: 3, parking_spots: 2, similarity_score: 85, source_name: "OLX", is_approved: true },
      { title: "Apto Al. Franca 230m²", neighborhood: "Jardins", price: 3200000, area: 230, price_per_sqm: 13913, bedrooms: 4, parking_spots: 3, similarity_score: 95, source_name: "Viva Real", is_approved: true },
      { title: "Apto Rua Oscar Freire 190m²", neighborhood: "Jardins", price: 3100000, area: 190, price_per_sqm: 16316, bedrooms: 3, parking_spots: 2, similarity_score: 90, source_name: "ZAP", is_approved: true },
      { title: "Apto Rua Bela Cintra 210m²", neighborhood: "Consolação", price: 2900000, area: 210, price_per_sqm: 13810, bedrooms: 4, parking_spots: 2, similarity_score: 82, source_name: "Imovelweb", is_approved: true },
    ];

    for (const comp of comparables) {
      await supabaseAdmin.from("market_comparables").insert({
        market_analysis_job_id: job.id,
        ...comp,
      });
    }

    // 12. Create market report
    const prices = comparables.map(c => c.price).sort((a, b) => a - b);
    const medianPrice = (prices[2] + prices[3]) / 2;
    await supabaseAdmin.from("market_reports").insert({
      market_analysis_job_id: job.id,
      avg_price: Math.round(prices.reduce((a, b) => a + b, 0) / prices.length),
      median_price: Math.round(medianPrice),
      avg_price_per_sqm: Math.round(comparables.reduce((a, c) => a + c.price_per_sqm, 0) / comparables.length),
      suggested_market_price: Math.round(medianPrice),
      suggested_aspirational_price: Math.round(medianPrice * 1.15),
      suggested_fast_sale_price: Math.round(medianPrice * 0.85),
      confidence_level: "high",
      summary: "Análise baseada em 6 comparáveis aprovados na região dos Jardins, São Paulo.",
    });

    return new Response(
      JSON.stringify({
        success: true,
        tenant: { id: tenant.id, name: tenant.name },
        users: createdUsers.map((u) => ({ email: u.email, role: u.role })),
        presentation: { id: presentation.id, title: presentation.title },
        market_job: { id: job.id },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
