import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiPost, apiPut } from "@/lib/api";
import type { Riba, RibaInput } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  riba: Riba | null; // null = create
  today: string;
}

function RibaForm({ riba, today, onDone }: { riba: Riba | null; today: string; onDone: () => void }) {
  const qc = useQueryClient();
  const [cliente, setCliente] = useState(riba?.cliente ?? "");
  const [importo, setImporto] = useState(riba ? String(riba.importo).replace(".", ",") : "");
  const [scadenza, setScadenza] = useState(riba?.data_scadenza ?? "");
  const [caricamento, setCaricamento] = useState(riba?.data_caricamento ?? today);
  const [note, setNote] = useState(riba?.note ?? "");
  const [error, setError] = useState("");

  const save = useMutation({
    mutationFn: (body: RibaInput) => (riba ? apiPut<Riba>(`/riba/${riba.id}`, body) : apiPost<Riba>("/riba", body)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["riba"] });
      toast.success(riba ? "RiBa aggiornata" : "RiBa registrata");
      onDone();
    },
    onError: () => toast.error("Salvataggio non riuscito"),
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(importo.replace(/\./g, "").replace(",", "."));
    if (!cliente.trim()) return setError("Inserisci il cliente.");
    if (!amount || amount <= 0) return setError("Inserisci un importo valido.");
    if (!scadenza) return setError("Inserisci la data di scadenza.");
    if (!caricamento) return setError("Inserisci la data di caricamento.");
    setError("");
    save.mutate({ cliente: cliente.trim(), importo: amount, data_scadenza: scadenza, data_caricamento: caricamento, note });
  };

  return (
    <form onSubmit={submit} className="space-y-4" data-testid="riba-form">
      <div className="space-y-1.5">
        <Label htmlFor="cliente">Cliente</Label>
        <Input id="cliente" data-testid="riba-cliente-input" value={cliente} onChange={(e) => setCliente(e.target.value)} placeholder="Es. Rossi S.r.l." autoFocus />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="importo">Importo (€)</Label>
        <Input id="importo" data-testid="riba-importo-input" inputMode="decimal" value={importo} onChange={(e) => setImporto(e.target.value)} placeholder="1.250,00" className="font-mono" />
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
          <DialogDescription>Registra la RiBa appena la carichi in banca.</DialogDescription>
        </DialogHeader>
        {open && <RibaForm key={riba?.id ?? "new"} riba={riba} today={today} onDone={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  );
}
