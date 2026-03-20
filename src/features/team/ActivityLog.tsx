"use client";

import { useState, useEffect, useCallback } from "react";
import { History, ChevronDown } from "lucide-react";
import Button from "@/components/ui/Button";

interface AuditEntry {
  id: number;
  user_name: string;
  action: string;
  entity: string;
  entity_id: string | null;
  details: Record<string, unknown> | null;
  created_at: string;
}

const ACTION_COLORS: Record<string, string> = {
  created: "bg-emerald-100 text-emerald-700",
  updated: "bg-blue-100 text-blue-700",
  deleted: "bg-red-100 text-red-700",
};

function formatEntity(entity: string) {
  return entity.charAt(0).toUpperCase() + entity.slice(1);
}

function formatDetails(details: Record<string, unknown> | null): string {
  if (!details) return "";
  const parts: string[] = [];
  for (const [key, value] of Object.entries(details)) {
    if (value === null || value === undefined) continue;
    if (key === "name") {
      parts.unshift(String(value));
    } else {
      const label = key.replace(/([A-Z])/g, " $1").toLowerCase();
      parts.push(`${label}: ${value}`);
    }
  }
  return parts.join(" · ");
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
}

export default function ActivityLog() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);

  const fetchEntries = useCallback(async (offset = 0) => {
    const res = await fetch(`/api/audit-log?limit=20&offset=${offset}`);
    if (!res.ok) return;
    const data: AuditEntry[] = await res.json();
    if (offset === 0) {
      setEntries(data);
    } else {
      setEntries((prev) => [...prev, ...data]);
    }
    setHasMore(data.length === 20);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  if (loading) {
    return <div className="p-6 text-center text-slate-400">Loading activity...</div>;
  }

  if (entries.length === 0) {
    return (
      <div className="p-6 text-center text-slate-400">
        <History size={24} className="mx-auto mb-2 opacity-50" />
        No activity recorded yet
      </div>
    );
  }

  return (
    <div>
      <div className="space-y-0">
        {entries.map((entry) => (
          <div
            key={entry.id}
            className="flex items-start gap-3 px-4 py-3 border-b border-slate-100 last:border-b-0"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[13px] font-semibold text-slate-800">{entry.user_name}</span>
                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${ACTION_COLORS[entry.action] || "bg-slate-100 text-slate-600"}`}>
                  {entry.action}
                </span>
                <span className="text-[13px] text-slate-600">{formatEntity(entry.entity)}</span>
              </div>
              {entry.details && (
                <div className="text-[12px] text-slate-400 mt-0.5 truncate">
                  {formatDetails(entry.details)}
                </div>
              )}
            </div>
            <div className="text-[11px] text-slate-400 whitespace-nowrap mt-0.5">
              {timeAgo(entry.created_at)}
            </div>
          </div>
        ))}
      </div>
      {hasMore && (
        <div className="px-4 py-3 text-center">
          <Button
            variant="ghost"
            onClick={() => fetchEntries(entries.length)}
          >
            <ChevronDown size={14} /> Load more
          </Button>
        </div>
      )}
    </div>
  );
}
