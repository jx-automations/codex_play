interface MetricCardProps {
  label: string;
  value: string | number;
  sublabel?: string;
}

export function MetricCard({ label, value, sublabel }: MetricCardProps) {
  return (
    <div className="rounded-xl border border-neutral-100 bg-white p-4 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">{label}</p>
      <p className="mt-1 font-display text-2xl font-semibold text-neutral-900">{value}</p>
      {sublabel && <p className="mt-0.5 text-xs text-neutral-400">{sublabel}</p>}
    </div>
  );
}
