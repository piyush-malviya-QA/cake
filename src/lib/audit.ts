import { SupabaseClient } from "@supabase/supabase-js";

interface AuditEntry {
  action: string;
  entity: string;
  entityId?: string;
  details?: Record<string, unknown>;
}

export async function logAudit(
  supabase: SupabaseClient,
  userId: string,
  userName: string,
  shopId: string,
  entry: AuditEntry
) {
  await supabase.from("audit_log").insert({
    shop_id: shopId,
    user_id: userId,
    user_name: userName,
    action: entry.action,
    entity: entry.entity,
    entity_id: entry.entityId,
    details: entry.details ?? null,
  });
}
