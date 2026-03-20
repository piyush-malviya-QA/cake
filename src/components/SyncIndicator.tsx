"use client";

interface SyncIndicatorProps {
  status: "synced" | "pending" | "offline";
  pendingCount?: number;
}

export default function SyncIndicator({
  status,
  pendingCount = 0,
}: SyncIndicatorProps) {
  const config = {
    synced: { dot: "bg-emerald-400", text: "Synced", textColor: "text-emerald-400" },
    pending: {
      dot: "bg-yellow-400",
      text: `${pendingCount} pending`,
      textColor: "text-yellow-400",
    },
    offline: { dot: "bg-red-400", text: "Offline", textColor: "text-red-400" },
  };

  const c = config[status];

  return (
    <div className="flex items-center gap-2 text-[11px]" suppressHydrationWarning>
      <span className={`w-2 h-2 rounded-full ${c.dot}`} suppressHydrationWarning />
      <span className={c.textColor} suppressHydrationWarning>{c.text}</span>
    </div>
  );
}
