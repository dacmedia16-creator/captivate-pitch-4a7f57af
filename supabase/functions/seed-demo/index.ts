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

      // Update profile with tenant
      await supabaseAdmin
        .from("profiles")
        .update({ tenant_id: tenant.id, full_name: u.fullName, role: u.role })
        .eq("id", authUser.user.id);

      // Assign role
      await supabaseAdmin.from("user_roles").insert({ user_id: authUser.user.id, role: u.role });

      createdUsers.push({ id: authUser.user.id, role: u.role, email: u.email });
    }

    // 4. Create broker profiles for the 2 brokers
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

    // 5. Seed some marketing actions
    await supabaseAdmin.from("marketing_actions").insert([
      { tenant_id: tenant.id, title: "Tour Virtual 360°", description: "Experiência imersiva com tour virtual profissional", sort_order: 1 },
      { tenant_id: tenant.id, title: "Fotografia Profissional", description: "Ensaio fotográfico com equipamento profissional", sort_order: 2 },
      { tenant_id: tenant.id, title: "Anúncios Premium", description: "Destaque nos principais portais imobiliários", sort_order: 3 },
    ]);

    // 6. Seed competitive differentials
    await supabaseAdmin.from("competitive_differentials").insert([
      { tenant_id: tenant.id, title: "IA para Precificação", description: "Análise de mercado inteligente com dados reais", sort_order: 1 },
      { tenant_id: tenant.id, title: "Marketing 360°", description: "Estratégia completa de divulgação multicanal", sort_order: 2 },
    ]);

    return new Response(
      JSON.stringify({
        success: true,
        tenant: { id: tenant.id, name: tenant.name },
        users: createdUsers.map((u) => ({ email: u.email, role: u.role })),
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
