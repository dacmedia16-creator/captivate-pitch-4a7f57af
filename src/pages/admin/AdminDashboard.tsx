import { PagePlaceholder } from "@/components/PagePlaceholder";
import { LayoutDashboard } from "lucide-react";

export default function AdminDashboard() {
  return <PagePlaceholder title="Painel Global" description="Visão geral de todas as imobiliárias, métricas do sistema e atividade recente." icon={LayoutDashboard} />;
}
