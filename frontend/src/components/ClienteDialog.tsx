import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiPost, apiPut, ApiError } from "@/lib/api";
import type { Cliente, ClienteInput } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function errorDetail(e: unknown, fallback: string): string {
  if (e instanceof ApiError && e.body && typeof e.body === "object" && "detail" in e.body && typeof e.body.detail === "string") {
    return e.body.detail;
  }
  return fallback;
}

function ClienteForm({ cliente, onDone }: { cliente: Cliente | null; onDone: () => void }) {
  const qc = useQueryClient();
  const [nome, setNome] = useState(cliente?.nome ?? "");
  const [piva, setPiva] = useState(cliente?.partita_iva ?? "");
  const [email, setEmail] = useState(cliente?.email ?? "");
  const [note, setNote] = useState(cliente?.note ?? "");
  const [error, setError] = useState("");

  const save = useMutation({
    mutationFn: (body: ClienteInput) => (cliente ? apiPut<Cliente>(`/clienti/${cliente.id}`, body) : apiPost<Cliente>("/clienti", body)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["clienti"] });
      qc.invalidateQueries({ queryKey: ["riba"] });
      toast.success(cliente ? "Cliente aggiornato" : "Cliente aggiunto");
      onDone();
    },
    onError: (e) => setError(errorDetail(e, "Salvataggio non riuscito")),
  });

  return (
    <form
      data-testid="cliente-form"
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (!nome.trim()) return setError("Inserisci il nome del cliente.");
        setError("");
        save.mutate({ nome: nome.trim(), partita_iva: piva.trim(), email: email.trim(), note });
      }}
    >
      <div className="space-y-1.5">
        <Label htmlFor="cli-nome">Ragione sociale / Nome</Label>
        <Input id="cli-nome" data-testid="cliente-nome-input" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Es. Rossi S.r.l." autoFocus />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="cli-piva">P. IVA</Label>
          <Input id="cli-piva" data-testid="cliente-piva-input" value={piva} onChange={(e) => setPiva(e.target.value)} placeholder="Facoltativa" className="font-mono" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="cli-email">Email</Label>
          <Input id="cli-email" type="email" data-testid="cliente-email-input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Facoltativa" />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="cli-note">Note</Label>
        <Textarea id="cli-note" data-testid="cliente-note-input" rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Facoltative" />
      </div>
      <p className="min-h-5 text-sm text-rose-700" data-testid="cliente-form-error">{error}</p>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onDone} data-testid="cliente-cancel-button">Annulla</Button>
        <Button type="submit" disabled={save.isPending} data-testid="cliente-save-button">
          {save.isPending ? "Salvataggio…" : cliente ? "Salva modifiche" : "Aggiungi cliente"}
        </Button>
      </DialogFooter>
    </form>
  );
}

export function ClienteDialog({ open, onOpenChange, cliente }: { open: boolean; onOpenChange: (o: boolean) => void; cliente: Cliente | null }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-testid="cliente-dialog" className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading">{cliente ? "Modifica cliente" : "Nuovo cliente"}</DialogTitle>
          <DialogDescription>I clienti salvati compaiono nel menù quando registri una RiBa.</DialogDescription>
        </DialogHeader>
        {open && <ClienteForm key={cliente?.id ?? "new"} cliente={cliente} onDone={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  );
}
