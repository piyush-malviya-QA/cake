import { createClient } from "@/lib/supabase/client";
import { dequeue, removeEntry } from "./queue";

export async function flushSyncQueue(): Promise<{
  synced: number;
  failed: number;
}> {
  const supabase = createClient();
  const entries = await dequeue();
  let synced = 0;
  let failed = 0;

  for (const entry of entries) {
    try {
      let error = null;

      switch (entry.operation) {
        case "insert": {
          const result = await supabase
            .from(entry.table)
            .insert(entry.payload);
          error = result.error;
          break;
        }
        case "update": {
          const { id, ...rest } = entry.payload;
          const result = await supabase
            .from(entry.table)
            .update(rest)
            .eq("id", id);
          error = result.error;
          break;
        }
        case "delete": {
          const result = await supabase
            .from(entry.table)
            .delete()
            .eq("id", entry.payload.id);
          error = result.error;
          break;
        }
        case "rpc": {
          const { functionName, args } = entry.payload as {
            functionName: string;
            args: Record<string, unknown>;
          };
          const result = await supabase.rpc(functionName, args);
          error = result.error;
          break;
        }
      }

      if (error) {
        console.error(`Sync failed for entry ${entry.id}:`, error);
        failed++;
      } else {
        if (entry.id) await removeEntry(entry.id);
        synced++;
      }
    } catch (err) {
      console.error(`Sync exception for entry ${entry.id}:`, err);
      failed++;
    }
  }

  return { synced, failed };
}
