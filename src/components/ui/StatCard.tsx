interface StatCardProps {
  label: string;
  value: string | number;
  color: string;
}

export default function StatCard({ label, value, color }: StatCardProps) {
  return (
    <div className="bg-white rounded-[10px] px-4 py-3.5 border border-slate-200">
      <div className="text-[11px] text-slate-400 font-semibold uppercase tracking-wide">
        {label}
      </div>
      <div className="text-[22px] font-extrabold mt-0.5" style={{ color }}>
        {value}
      </div>
    </div>
  );
}
