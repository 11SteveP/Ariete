import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { apiGet, apiPost, apiPut } from "@/lib/api";
import type { Cliente, Riba, RibaInput } from "@/lib/types";
import { monthName, monthOptions } from "@/lib/format";
import { errorDetail } from "@/components/ClienteDialog";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectSeparator, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const NEW = "__new__";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  riba: Riba | null; // null = create
  today: string;
}

function RibaForm({ riba, today, onDone }: { riba: Riba | null; today: string; onDone: () => void }) {
  const qc = useQueryClient();
  const clientiQ = useQuery({ queryKey: ["clienti"], queryFn: () => apiGet<Cliente[]>("/clienti") });
  const clienti = clientiQ.isError ? [] : clientiQ.data ?? [];

  const [clienteId, setClienteId] = useState<string>(riba?.cliente_id ?? "");
  const [newNome, setNewNome] = useState("");
  const [importo, setImporto] = useState(riba ? String(riba.importo).replace(".", ",") : "");
  const [scadenza, setScadenza] = useState(riba?.data_scadenza ?? "");
  const [caricamento, setCaricamento] = useState(riba?.data_caricamento ?? today);
  const [meseFattura, setMeseFattura] = useState(riba?.mese_fattura ?? today.slice(0, 7));
  const [note, setNote] = useState(riba?.note ?? "");
  const [error, setError] = useState("");

  const months = monthOptions(today);
  if (!months.includes(meseFattura)) months.unshift(meseFattura);
  // Legacy RiBa without a linked client keep their free-text name as an option.
  const legacyName = riba && !riba.cliente_id ? riba.cliente : null;

  const save = useMutation({
    mutationFn: async (body: Omit<RibaInput, "cliente" | "cliente_id">) => {
      let cliente_id: string | null = clienteId && clienteId !== NEW ? clienteId : null;
      let cliente = clienti.find((c) => c.id === cliente_id)?.nome ?? legacyName ?? "";
      if (clienteId === NEW) {
        const created = await apiPost<Cliente>("/clienti", { nome: newNome.trim(), partita_iva: "", email: "", note: "" });
        cliente_id = created.id;
        cliente = created.nome;
        setClienteId(created.id); // a retry after a failed RiBa save must not re-create the client
      }
      const full: RibaInput = { ...body, cliente, cliente_id };
      return riba ? apiPut<Riba>(`/riba/${riba.id}`, full) : apiPost<Riba>("/riba", full);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["riba"] });
      qc.invalidateQueries({ queryKey: ["clienti"] });
      toast.success(riba ? "RiBa aggiornata" : "RiBa registrata");
      onDone();
    },
    onError: (e) => {
      qc.invalidateQueries({ queryKey: ["clienti"] });
      setError(errorDetail(e, "Salvataggio non riuscito"));
    },
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(importo.replace(/\./g, "").replace(",", "."));
    if (!clienteId && !legacyName) return setError("Scegli un cliente dal menù o creane uno nuovo.");
    if (clienteId === NEW && !newNome.trim()) return setError("Inserisci il nome del nuovo cliente.");
    if (!amount || amount <= 0) return setError("Inserisci un importo valido.");
    if (!scadenza) return setError("Inserisci la data di scadenza.");
    if (!caricamento) return setError("Inserisci la data di caricamento.");
    if (!meseFattura) return setError("Indica il mese in cui fare la fattura.");
    setError("");
    save.mutate({ importo: amount, data_scadenza: scadenza, data_caricamento: caricamento, mese_fattura: meseFattura, note });
  };

  const clienteLabel = (v: unknown) => {
    if (v === NEW) return "+ Nuovo cliente";
    const found = clienti.find((c) => c.id === v);
    if (found) return found.nome;
    return legacyName ?? "Seleziona un cliente…";
  };

  return (
    <form onSubmit={submit} className="space-y-4" data-testid="riba-form">
      <div className="space-y-1.5">
        <Label>Cliente</Label>
        <Select value={clienteId} onValueChange={(v: string) => setClienteId(v)}>
          <SelectTrigger className="w-full" data-testid="riba-cliente-select">
            <SelectValue>{clienteLabel}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {clienti.map((c) => (
              <SelectItem key={c.id} value={c.id} data-testid={`riba-cliente-option-${c.id}`}>
                {c.nome}
              </SelectItem>
            ))}
            {clienti.length > 0 && <SelectSeparator />}
            <SelectItem value={NEW} data-testid="riba-cliente-option-new">
              <Plus className="size-4" /> Nuovo cliente
            </SelectItem>
          </SelectContent>
        </Select>
        {clienteId === NEW && (
          <Input
            data-testid="riba-new-cliente-input"
            value={newNome}
            onChange={(e) => setNewNome(e.target.value)}
            placeholder="Nome del nuovo cliente (verrà salvato in elenco)"
            autoFocus
            className="animate-rise-in"
          />
        )}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="importo">Importo (€)</Label>
          <Input id="importo" data-testid="riba-importo-input" inputMode="decimal" value={importo} onChange={(e) => setImporto(e.target.value)} placeholder="1.250,00" className="font-mono" />
        </div>
        <div className="space-y-1.5">
          <Label>Fattura da fare a</Label>
          <Select value={meseFattura} onValueChange={(v: string) => setMeseFattura(v)}>
            <SelectTrigger className="w-full" data-testid="riba-mese-fattura-select">
              <SelectValue>{(v) => (v ? monthName(v as string) : "Mese…")}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {months.map((m) => (
                <SelectItem key={m} value={m} data-testid={`riba-mese-option-${m}`}>
                  {monthName(m)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="caricamento">Caricata in banca il</Label>
          <Input id="caricamento" type="date" data-testid="riba-caricamento-input" value={caricamento} onChange={(e) => setCaricamento(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="scadenza">Scadenza</Label>
          <Input id="scadenza" type="date" data-testid="riba-scadenza-input" value={scadenza} onChange={(e) => setScadenza(e.target.value)} />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="note">Note</Label>
        <Textarea id="note" data-testid="riba-note-input" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Facoltative" rows={2} />
      </div>
      <p className="min-h-5 text-sm text-rose-700" data-testid="riba-form-error">{error}</p>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onDone} data-testid="riba-cancel-button">Annulla</Button>
        <Button type="submit" disabled={save.isPending} data-testid="riba-save-button">
          {save.isPending ? "Salvataggio…" : riba ? "Salva modifiche" : "Registra RiBa"}
        </Button>
      </DialogFooter>
    </form>
  );
}

export function RibaDialog({ open, onOpenChange, riba, today }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-testid="riba-dialog" className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading">{riba ? "Modifica RiBa" : "Nuova RiBa"}</DialogTitle>
          <DialogDescription>Registra la RiBa appena la carichi in banca e indica quando fare la fattura.</DialogDescription>
        </DialogHeader>
        {open && <RibaForm key={riba?.id ?? "new"} riba={riba} today={today} onDone={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  );
}
