import { supabase } from "@/integrations/supabase/client";

export async function logAudit(
  action: string,
  entityType: string,
  entityId: string,
  metadata?: Record<string, any>,
  userId?: string,
  tenantId?: string | null
) {
  // If userId/tenantId provided, skip the extra queries
  if (userId) {
    await supabase.from("audit_logs").insert({
      user_id: userId,
      tenant_id: tenantId || null,
      action,
      entity_type: entityType,
      entity_id: entityId,
      metadata: metadata || null,
    });
    return;
  }

  // Fallback: fetch from auth (legacy callers)
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const profile = await supabase.from("profiles").select("tenant_id").eq("id", user.id).single();

  await supabase.from("audit_logs").insert({
    user_id: user.id,
    tenant_id: profile.data?.tenant_id || null,
    action,
    entity_type: entityType,
    entity_id: entityId,
    metadata: metadata || null,
  });
}
