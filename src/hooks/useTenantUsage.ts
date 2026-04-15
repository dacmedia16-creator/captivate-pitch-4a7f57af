import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface TenantUsage {
  market_studies_count: number;
  presentations_count: number;
  max_per_month: number | null; // null = unlimited
  month: string;
}

export function useTenantUsage() {
  const { profile } = useAuth();
  const tenantId = profile?.tenant_id;

  return useQuery({
    queryKey: ["tenant-usage", tenantId],
    queryFn: async (): Promise<TenantUsage> => {
      const month = new Date().toISOString().slice(0, 7); // '2026-04'

      // Get current usage
      const { data: usage } = await supabase
        .from("tenant_usage")
        .select("market_studies_count, presentations_count")
        .eq("tenant_id", tenantId!)
        .eq("month", month)
        .maybeSingle();

      // Get plan limit via tenant → plan
      const { data: tenant } = await supabase
        .from("tenants")
        .select("plan_id")
        .eq("id", tenantId!)
        .single();

      let maxPerMonth: number | null = null;
      if (tenant?.plan_id) {
        const { data: plan } = await supabase
          .from("subscription_plans")
          .select("max_presentations_per_month")
          .eq("id", tenant.plan_id)
          .single();
        maxPerMonth = plan?.max_presentations_per_month ?? null;
      }

      return {
        market_studies_count: usage?.market_studies_count ?? 0,
        presentations_count: usage?.presentations_count ?? 0,
        max_per_month: maxPerMonth,
        month,
      };
    },
    enabled: !!tenantId,
  });
}
