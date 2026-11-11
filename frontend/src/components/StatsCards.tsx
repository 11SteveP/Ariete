import type { Riba } from "@/lib/types";
import { formatCurrency } from "@/lib/format";

interface Props {
  ribas: Riba[];
  month: string; // YYYY-MM
}

export function StatsCards({ ribas, month }: Props) {
  const pending = ribas.filter((r) => !r.fatturata);
  const invoiced = ribas.filter((r) => r.fatturata);
  const thisMonth = ribas.filter((r) => r.data_caricamento.startsWith(month));
  const sum = (list: Riba[]) => list.reduce((s, r) => s + r.importo, 0);

  const cards = [
    { id: "pending", label: "Da fatturare", value: pending.length, sub: formatCurrency(sum(pending)), cls: "border-amber-200 bg-amber-50/60", accent: "text-amber-800" },
    { id: "month", label: "Caricate questo mese", value: thisMonth.length, sub: formatCurrency(sum(thisMonth)), cls: "border-slate-200 bg-white", accent: "text-slate-900" },
    { id: "invoiced", label: "Fatturate", value: invoiced.length, sub: formatCurrency(sum(invoiced)), cls: "border-emerald-200 bg-emerald-50/60", accent: "text-emerald-800" },
    { id: "total", label: "Totale RiBa", value: ribas.length, sub: formatCurrency(sum(ribas)), cls: "border-slate-200 bg-white", accent: "text-slate-900" },
  ];

  return (
    <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
      {cards.map((c, i) => (
        <div
          key={c.id}
          data-testid={`stat-${c.id}`}
          className={`animate-rise-in rounded-xl border p-4 transition-[box-shadow,transform] duration-150 hover:-translate-y-0.5 hover:shadow-md ${c.cls}`}
          style={{ animationDelay: `${i * 60}ms` }}
        >
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">{c.label}</p>
          <p className={`mt-2 font-heading text-3xl font-semibold ${c.accent}`} data-testid={`stat-${c.id}-count`}>{c.value}</p>
          <p className="font-mono text-sm text-slate-600" data-testid={`stat-${c.id}-amount`}>{c.sub}</p>
        </div>
      ))}
    </div>
  );
}
