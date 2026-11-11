import { AlertTriangle, CalendarClock } from "lucide-react";
import type { Reminder } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/format";
import { Button } from "@/components/ui/button";

interface Props {
  reminder: Reminder;
  onShowPending: () => void;
  onInvoice: (id: string) => void;
}

export function ReminderBanner({ reminder, onShowPending, onInvoice }: Props) {
  if (!reminder.active) return null;
  const overdueOnly = !reminder.is_last_day;
  const total = reminder.items.reduce((s, r) => s + r.importo, 0);
  const tone = overdueOnly
    ? "border-rose-200 bg-rose-50 text-rose-900"
    : "border-amber-200 bg-amber-50 text-amber-900 animate-reminder-glow";
  const Icon = overdueOnly ? AlertTriangle : CalendarClock;

  return (
    <section data-testid="reminder-banner" aria-live="polite" className={`animate-rise-in mb-6 rounded-xl border p-5 ${tone}`}>
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex gap-4">
          <span className={`flex size-11 shrink-0 items-center justify-center rounded-lg ${overdueOnly ? "bg-rose-600" : "bg-amber-600"} text-white`}>
            <Icon className="size-5" />
          </span>
          <div>
            <p className="font-heading text-lg font-semibold" data-testid="reminder-title">
              {overdueOnly
                ? `${reminder.items.length} RiBa dei mesi scorsi ancora senza fattura`
                : `Oggi è l'ultimo giorno del mese: emetti le fatture!`}
            </p>
            <p className="text-sm opacity-90" data-testid="reminder-summary">
              {reminder.items.length} RiBa da fatturare per un totale di{" "}
              <span className="font-mono font-semibold">{formatCurrency(total)}</span>
            </p>
          </div>
        </div>
        <Button data-testid="reminder-show-pending-button" variant="outline" className="bg-white/70" onClick={onShowPending}>
          Vedi da fatturare
        </Button>
      </div>
      <ul className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {reminder.items.slice(0, 6).map((r) => (
          <li key={r.id} data-testid={`reminder-item-${r.id}`} className="flex items-center justify-between gap-3 rounded-lg bg-white/70 px-3 py-2 text-sm">
            <div className="min-w-0">
              <p className="truncate font-semibold">{r.cliente}</p>
              <p className="text-xs opacity-80">
                Caricata {formatDate(r.data_caricamento)} · <span className="font-mono">{formatCurrency(r.importo)}</span>
              </p>
            </div>
            <Button size="xs" data-testid={`reminder-invoice-button-${r.id}`} onClick={() => onInvoice(r.id)}>
              Segna fattura
            </Button>
          </li>
        ))}
      </ul>
      {reminder.items.length > 6 && <p className="mt-2 text-xs opacity-80">…e altre {reminder.items.length - 6}</p>}
    </section>
  );
}
