import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import { apiDelete, apiGet, ApiError } from "@/lib/api";
import { formatCurrency } from "@/lib/format";
import type { AuthStatus, Cliente, Reminder, Riba } from "@/lib/types";
import { AppHeader } from "@/components/AppHeader";
import { ClienteDialog } from "@/components/ClienteDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function Clienti() {
  const qc = useQueryClient();
  const me = useQuery({ queryKey: ["auth", "me"], queryFn: () => apiGet<AuthStatus>("/auth/me"), retry: false });
  const authed = me.isSuccess;
  const clientiQ = useQuery({ queryKey: ["clienti"], queryFn: () => apiGet<Cliente[]>("/clienti"), enabled: authed });
  const ribaQ = useQuery({ queryKey: ["riba", "list"], queryFn: () => apiGet<Riba[]>("/riba"), enabled: authed });
  const reminderQ = useQuery({ queryKey: ["riba", "reminder"], queryFn: () => apiGet<Reminder>("/riba/reminder"), enabled: authed });

  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Cliente | null>(null);
  const [deleting, setDeleting] = useState<Cliente | null>(null);

  const remove = useMutation({
    mutationFn: (c: Cliente) => apiDelete<void>(`/clienti/${c.id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["clienti"] });
      toast.success("Cliente eliminato");
      setDeleting(null);
    },
    onError: () => toast.error("Eliminazione non riuscita"),
  });

  if (me.error instanceof ApiError && me.error.status === 401) return <Navigate to="/login" replace />;

  const today = (reminderQ.isError ? undefined : reminderQ.data?.today) ?? new Date().toISOString().slice(0, 10);
  const clienti = clientiQ.isError ? [] : clientiQ.data ?? [];
  const ribas = ribaQ.isError ? [] : ribaQ.data ?? [];
  const visible = clienti.filter((c) => c.nome.toLowerCase().includes(search.trim().toLowerCase()));
  const statsFor = (c: Cliente) => {
    const own = ribas.filter((r) => r.cliente_id === c.id);
    const pending = own.filter((r) => !r.fatturata);
    return { count: own.length, pending: pending.length, pendingTotal: pending.reduce((s, r) => s + r.importo, 0) };
  };
  const openNew = () => {
    setEditing(null);
    setOpen(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader today={today}>
        <Button data-testid="add-cliente-button" onClick={openNew}>
          <Plus className="size-4" /> Nuovo cliente
        </Button>
      </AppHeader>

      <main className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-6">
          <h1 className="font-heading text-3xl font-semibold tracking-tight text-slate-900">Clienti</h1>
          <p className="mt-1 text-sm text-slate-600">Compila l'elenco una volta sola: quando registri una RiBa sceglierai il cliente dal menù.</p>
        </div>

        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between gap-3 border-b border-slate-200 p-4">
            <p className="text-sm text-slate-600" data-testid="clienti-count">{clienti.length} clienti</p>
            <div className="relative w-full md:w-72">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <Input data-testid="clienti-search-input" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cerca cliente…" className="pl-9" />
            </div>
          </div>

          {clientiQ.isLoading || me.isLoading ? (
            <div className="space-y-2 p-5">
              {[0, 1, 2].map((i) => <div key={i} className="h-10 animate-pulse rounded-md bg-slate-100" />)}
            </div>
          ) : visible.length === 0 ? (
            <div className="flex flex-col items-start gap-3 p-10" data-testid="clienti-empty-state">
              <p className="font-heading text-lg font-semibold text-slate-900">{clienti.length === 0 ? "Nessun cliente in elenco" : "Nessun cliente trovato"}</p>
              {clienti.length === 0 && (
                <Button data-testid="empty-add-cliente-button" onClick={openNew}>
                  <Plus className="size-4" /> Aggiungi il primo cliente
                </Button>
              )}
            </div>
          ) : (
            <Table data-testid="clienti-table">
              <TableHeader>
                <TableRow className="bg-slate-50 hover:bg-slate-50">
                  <TableHead className="pl-5">Cliente</TableHead>
                  <TableHead>P. IVA</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead className="text-right">RiBa</TableHead>
                  <TableHead className="text-right">Da fatturare</TableHead>
                  <TableHead className="pr-5 text-right">Azioni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visible.map((c) => {
                  const s = statsFor(c);
                  return (
                    <TableRow key={c.id} data-testid={`cliente-row-${c.id}`}>
                      <TableCell className="pl-5">
                        <p className="font-semibold text-slate-900" data-testid={`cliente-nome-${c.id}`}>{c.nome}</p>
                        {c.note && <p className="max-w-xs truncate text-xs text-slate-500">{c.note}</p>}
                      </TableCell>
                      <TableCell className="font-mono text-sm text-slate-600">{c.partita_iva || "—"}</TableCell>
                      <TableCell className="text-slate-600">{c.email || "—"}</TableCell>
                      <TableCell className="text-right font-mono">{s.count}</TableCell>
                      <TableCell className="text-right font-mono" data-testid={`cliente-pending-${c.id}`}>
                        {s.pending > 0 ? <span className="text-amber-800">{s.pending} · {formatCurrency(s.pendingTotal)}</span> : "—"}
                      </TableCell>
                      <TableCell className="pr-5 text-right">
                        <div className="flex justify-end gap-1">
                          <Button size="icon-sm" variant="ghost" aria-label="Modifica" data-testid={`cliente-edit-button-${c.id}`} onClick={() => { setEditing(c); setOpen(true); }}>
                            <Pencil className="size-4" />
                          </Button>
                          <Button size="icon-sm" variant="ghost" aria-label="Elimina" className="text-rose-700" data-testid={`cliente-delete-button-${c.id}`} onClick={() => setDeleting(c)}>
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </div>
      </main>

      <ClienteDialog open={open} onOpenChange={setOpen} cliente={editing} />

      <Dialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <DialogContent data-testid="cliente-delete-dialog" className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-heading">Eliminare il cliente?</DialogTitle>
            <DialogDescription>
              <strong>{deleting?.nome}</strong> verrà rimosso dall'elenco. Le RiBa già registrate restano invariate.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleting(null)} data-testid="cliente-delete-cancel-button">Annulla</Button>
            <Button variant="destructive" disabled={remove.isPending} onClick={() => deleting && remove.mutate(deleting)} data-testid="cliente-delete-confirm-button">
              Elimina
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
