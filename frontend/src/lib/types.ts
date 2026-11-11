// Mirrors backend/models/riba.py — keep in sync.
export interface AuthStatus {
  authenticated: boolean;
}

export interface PinChange {
  current_pin: string;
  new_pin: string;
}

export interface RibaInput {
  cliente: string;
  cliente_id: string | null;
  importo: number;
  data_scadenza: string;
  data_caricamento: string;
  mese_fattura: string; // YYYY-MM
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

// Mirrors backend/models/cliente.py
export interface ClienteInput {
  nome: string;
  partita_iva: string;
  email: string;
  note: string;
}

export interface Cliente extends ClienteInput {
  id: string;
  created_at: string;
}
