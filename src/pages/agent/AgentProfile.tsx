import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ImageUploader } from "@/components/shared/ImageUploader";
import { PortfolioSection } from "@/components/profile/PortfolioSection";
import { PersonalResultsSection } from "@/components/profile/PersonalResultsSection";
import { PersonalTestimonialsSection } from "@/components/profile/PersonalTestimonialsSection";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { UserCircle, Briefcase, Settings2, Save, Loader2 } from "lucide-react";

interface ProfileData {
  full_name: string;
  email: string;
  phone: string;
  avatar_url: string | null;
}

interface BrokerData {
  creci: string;
  short_bio: string;
  years_in_market: number | null;
  education: string;
  specialties: string;
  service_regions: string;
  vgv_summary: string;
  preferred_tone: string;
  preferred_layout: string;
  portfolio_images: any[];
  personal_results: any[];
  personal_testimonials: any[];
}

export default function AgentProfile() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [profile, setProfile] = useState<ProfileData>({
    full_name: "",
    email: "",
    phone: "",
    avatar_url: null,
  });

  const [broker, setBroker] = useState<BrokerData>({
    creci: "",
    short_bio: "",
    years_in_market: null,
    education: "",
    specialties: "",
    service_regions: "",
    vgv_summary: "",
    preferred_tone: "",
    preferred_layout: "",
    portfolio_images: [],
    personal_results: [],
    personal_testimonials: [],
  });

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      const [{ data: p }, { data: b }] = await Promise.all([
        supabase.from("profiles").select("full_name, email, phone, avatar_url").eq("id", user.id).single(),
        supabase.from("broker_profiles").select("*").eq("user_id", user.id).maybeSingle(),
      ]);
      if (p) setProfile({ full_name: p.full_name ?? "", email: p.email ?? "", phone: p.phone ?? "", avatar_url: p.avatar_url });
      if (b) {
        const bAny = b as any;
        setBroker({
          creci: b.creci ?? "",
          short_bio: b.short_bio ?? "",
          years_in_market: b.years_in_market,
          education: b.education ?? "",
          specialties: b.specialties ?? "",
          service_regions: b.service_regions ?? "",
          vgv_summary: b.vgv_summary ?? "",
          preferred_tone: b.preferred_tone ?? "",
          preferred_layout: b.preferred_layout ?? "",
          portfolio_images: Array.isArray(bAny.portfolio_images) ? bAny.portfolio_images : [],
          personal_results: Array.isArray(bAny.personal_results) ? bAny.personal_results : [],
          personal_testimonials: Array.isArray(bAny.personal_testimonials) ? bAny.personal_testimonials : [],
        });
      }
      setLoading(false);
    })();
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const { error: pErr } = await supabase.from("profiles").update({
        full_name: profile.full_name,
        phone: profile.phone,
        avatar_url: profile.avatar_url,
      }).eq("id", user.id);
      if (pErr) throw pErr;

      const { error: bErr } = await supabase.from("broker_profiles").upsert({
        user_id: user.id,
        creci: broker.creci || null,
        short_bio: broker.short_bio || null,
        years_in_market: broker.years_in_market,
        education: broker.education || null,
        specialties: broker.specialties || null,
        service_regions: broker.service_regions || null,
        vgv_summary: broker.vgv_summary || null,
        preferred_tone: broker.preferred_tone || null,
        preferred_layout: broker.preferred_layout || null,
        portfolio_images: broker.portfolio_images,
        personal_results: broker.personal_results,
        personal_testimonials: broker.personal_testimonials,
      } as any, { onConflict: "user_id" });
      if (bErr) throw bErr;

      toast.success("Perfil salvo com sucesso!");
    } catch (err: any) {
      toast.error("Erro ao salvar: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 p-6 max-w-4xl mx-auto">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Meu Perfil</h1>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
          Salvar alterações
        </Button>
      </div>

      {/* Dados Pessoais */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <UserCircle className="h-5 w-5 text-primary" /> Dados Pessoais
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Foto de perfil</Label>
            <ImageUploader
              value={profile.avatar_url}
              onChange={(url) => setProfile((p) => ({ ...p, avatar_url: url }))}
              folder="avatars"
              className="mt-2"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nome completo</Label>
              <Input value={profile.full_name} onChange={(e) => setProfile((p) => ({ ...p, full_name: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>E-mail</Label>
              <Input value={profile.email} readOnly className="opacity-60 cursor-not-allowed" />
            </div>
            <div className="space-y-2">
              <Label>Telefone</Label>
              <Input value={profile.phone} onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))} placeholder="(11) 99999-9999" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dados Profissionais */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Briefcase className="h-5 w-5 text-primary" /> Dados Profissionais
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>CRECI</Label>
              <Input value={broker.creci} onChange={(e) => setBroker((b) => ({ ...b, creci: e.target.value }))} placeholder="Ex: 12345-F" />
            </div>
            <div className="space-y-2">
              <Label>Anos de mercado</Label>
              <Input type="number" value={broker.years_in_market ?? ""} onChange={(e) => setBroker((b) => ({ ...b, years_in_market: e.target.value ? Number(e.target.value) : null }))} placeholder="Ex: 10" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Bio curta</Label>
            <Textarea value={broker.short_bio} onChange={(e) => setBroker((b) => ({ ...b, short_bio: e.target.value }))} placeholder="Uma breve descrição sobre você para as apresentações..." rows={3} />
          </div>
          <div className="space-y-2">
            <Label>Formação</Label>
            <Input value={broker.education} onChange={(e) => setBroker((b) => ({ ...b, education: e.target.value }))} placeholder="Ex: MBA em Gestão Imobiliária" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Especialidades</Label>
              <Input value={broker.specialties} onChange={(e) => setBroker((b) => ({ ...b, specialties: e.target.value }))} placeholder="Ex: Alto padrão, Lançamentos" />
            </div>
            <div className="space-y-2">
              <Label>Regiões de atuação</Label>
              <Input value={broker.service_regions} onChange={(e) => setBroker((b) => ({ ...b, service_regions: e.target.value }))} placeholder="Ex: Zona Sul SP, Alphaville" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Preferências */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Settings2 className="h-5 w-5 text-primary" /> Preferências de Apresentação
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Resumo VGV / Resultados</Label>
            <Textarea value={broker.vgv_summary} onChange={(e) => setBroker((b) => ({ ...b, vgv_summary: e.target.value }))} placeholder="Ex: +R$ 50M em vendas nos últimos 12 meses" rows={2} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tom preferido</Label>
              <Select value={broker.preferred_tone} onValueChange={(v) => setBroker((b) => ({ ...b, preferred_tone: v }))}>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="formal">Formal</SelectItem>
                  <SelectItem value="consultivo">Consultivo</SelectItem>
                  <SelectItem value="persuasivo">Persuasivo</SelectItem>
                  <SelectItem value="amigavel">Amigável</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Layout preferido</Label>
              <Select value={broker.preferred_layout} onValueChange={(v) => setBroker((b) => ({ ...b, preferred_layout: v }))}>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="executivo">Executivo</SelectItem>
                  <SelectItem value="premium">Premium</SelectItem>
                  <SelectItem value="impacto_comercial">Impacto Comercial</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Portfólio e Resultados */}
      <PortfolioSection
        images={broker.portfolio_images}
        onChange={(imgs) => setBroker((b) => ({ ...b, portfolio_images: imgs }))}
      />

      <PersonalResultsSection
        results={broker.personal_results}
        onChange={(results) => setBroker((b) => ({ ...b, personal_results: results }))}
      />

      <PersonalTestimonialsSection
        testimonials={broker.personal_testimonials}
        onChange={(testimonials) => setBroker((b) => ({ ...b, personal_testimonials: testimonials }))}
      />
    </div>
  );
}
