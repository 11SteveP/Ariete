const eur = new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" });

export const formatCurrency = (n: number) => eur.format(n);

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const [y, m, d] = iso.slice(0, 10).split("-");
  return `${d}/${m}/${y}`;
}

const MONTHS = [
  "gennaio", "febbraio", "marzo", "aprile", "maggio", "giugno",
  "luglio", "agosto", "settembre", "ottobre", "novembre", "dicembre",
];

export function monthLabel(iso: string): string {
  const [y, m] = iso.split("-");
  return `${MONTHS[Number(m) - 1]} ${y}`;
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export const monthName = (ym: string) => cap(monthLabel(ym));

/** YYYY-MM options from `back` months before to `ahead` months after the month of `todayIso`. */
export function monthOptions(todayIso: string, back = 3, ahead = 12): string[] {
  const [y, m] = todayIso.split("-").map(Number);
  const out: string[] = [];
  for (let i = -back; i <= ahead; i++) {
    const idx = y * 12 + (m - 1) + i;
    out.push(`${Math.floor(idx / 12)}-${String((idx % 12) + 1).padStart(2, "0")}`);
  }
  return out;
}
