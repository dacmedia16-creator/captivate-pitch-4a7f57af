import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft, Loader2, Clock, CheckCircle, XCircle, AlertTriangle,
  Globe, Search, FileText,
} from "lucide-react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

const statusIcons: Record<string, React.ReactNode> = {
  pending: <Clock className="h-4 w-4 text-muted-foreground" />,
  processing: <Loader2 className="h-4 w-4 animate-spin text-primary" />,
  completed: <CheckCircle className="h-4 w-4 text-emerald-500" />,
  failed: <XCircle className="h-4 w-4 text-destructive" />,
};

const statusLabels: Record<string, string> = {
  pending: "Pendente",
  processing: "Processando",
  completed: "Concluído",
  failed: "Erro",
};

export default function MarketStudyExecutions() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: study } = useQuery({
    queryKey: ["market-study-header", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("market_studies")
        .select("id, title, status")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: executions, isLoading } = useQuery({
    queryKey: ["market-study-executions", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("market_study_executions")
        .select("*, portal_sources:portal_source_id(name, code)")
        .eq("market_study_id", id!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!id,
    refetchInterval: (query) => {
      const data = query.state.data;
      const hasProcessing = data?.some((e: any) => e.status === "processing" || e.status === "pending");
      return hasProcessing ? 5000 : false;
    },
  });

  const { data: rawListings } = useQuery({
    queryKey: ["market-study-raw-listings-count", id],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("market_study_raw_listings")
        .select("id", { count: "exact", head: true })
        .eq("market_study_id", id!);
      if (error) throw error;
      return count ?? 0;
    },
    enabled: !!id,
  });

  function formatDuration(start: string | null, end: string | null) {
    if (!start) return "—";
    const s = new Date(start).getTime();
    const e = end ? new Date(end).getTime() : Date.now();
    const sec = Math.round((e - s) / 1000);
    if (sec < 60) return `${sec}s`;
    return `${Math.floor(sec / 60)}m ${sec % 60}s`;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(`/market-studies/${id}`)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold font-display">Execuções</h1>
          <p className="text-sm text-muted-foreground">
            {study?.title || "Estudo de mercado"} — detalhes de cada coleta
          </p>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="glass-card">
          <CardContent className="p-4 text-center">
            <Globe className="h-5 w-5 mx-auto mb-1 text-primary" />
            <p className="text-2xl font-bold">{executions?.length ?? 0}</p>
            <p className="text-xs text-muted-foreground">Execuções</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4 text-center">
            <Search className="h-5 w-5 mx-auto mb-1 text-primary" />
            <p className="text-2xl font-bold">
              {executions?.reduce((sum: number, e: any) => sum + (e.listings_found ?? 0), 0) ?? 0}
            </p>
            <p className="text-xs text-muted-foreground">Anúncios encontrados</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4 text-center">
            <CheckCircle className="h-5 w-5 mx-auto mb-1 text-emerald-500" />
            <p className="text-2xl font-bold">
              {executions?.reduce((sum: number, e: any) => sum + (e.listings_matched ?? 0), 0) ?? 0}
            </p>
            <p className="text-xs text-muted-foreground">Comparáveis selecionados</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4 text-center">
            <FileText className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
            <p className="text-2xl font-bold">{rawListings ?? 0}</p>
            <p className="text-xs text-muted-foreground">Listings brutos</p>
          </CardContent>
        </Card>
      </div>

      {/* Executions table */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-lg">Histórico de execuções</CardTitle>
        </CardHeader>
        <CardContent>
          {!executions || executions.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              Nenhuma execução registrada
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Portal</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-center">Encontrados</TableHead>
                  <TableHead className="text-center">Selecionados</TableHead>
                  <TableHead>Duração</TableHead>
                  <TableHead>Erro</TableHead>
                  <TableHead>Data</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {executions.map((exec: any) => (
                  <TableRow key={exec.id}>
                    <TableCell className="font-medium">
                      {(exec.portal_sources as any)?.name || "Geral"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        {statusIcons[exec.status] ?? <AlertTriangle className="h-4 w-4" />}
                        <span className="text-sm">{statusLabels[exec.status] ?? exec.status}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">{exec.listings_found ?? 0}</TableCell>
                    <TableCell className="text-center">{exec.listings_matched ?? 0}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDuration(exec.started_at, exec.finished_at)}
                    </TableCell>
                    <TableCell>
                      {exec.error_message ? (
                        <span className="text-xs text-destructive line-clamp-1" title={exec.error_message}>
                          {exec.error_message}
                        </span>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(exec.created_at).toLocaleString("pt-BR")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
