// Mirrors backend/models/riba.py — keep in sync.
export interface AuthStatus {
  authenticated: boolean;
}

export interface RibaInput {
  cliente: string;
  importo: number;
  data_scadenza: string;
  data_caricamento: string;
  note: string;
}

export interface Riba extends RibaInput {
  id: string;
  fatturata: boolean;
  numero_fattura: string | null;
  data_fattura: string | null;
  created_at: string;
}

export interface InvoiceUpdate {
  fatturata: boolean;
  numero_fattura?: string | null;
  data_fattura?: string | null;
}

export interface Reminder {
  today: string;
  is_last_day: boolean;
  active: boolean;
  pending_count: number;
  pending_total: number;
  overdue_count: number;
  items: Riba[];
}
