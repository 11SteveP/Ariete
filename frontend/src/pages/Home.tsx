import { useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Search } from "lucide-react";
import { apiDelete, apiGet, apiPatch, ApiError } from "@/lib/api";
import { AppHeader } from "@/components/AppHeader";
import type { AuthStatus, Reminder, Riba } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ReminderBanner } from "@/components/ReminderBanner";
import { StatsCards } from "@/components/StatsCards";
import { RibaTable } from "@/components/RibaTable";
import { RibaDialog } from "@/components/RibaDialog";
import { InvoiceDialog } from "@/components/InvoiceDialog";

type Filter = "all" | "pending" | "invoiced";

export default function Home() {
  const qc = useQueryClient();
  const me = useQuery({ queryKey: ["auth", "me"], queryFn: () => apiGet<AuthStatus>("/auth/me"), retry: false });
  const authed = me.isSuccess;
  const ribaQ = useQuery({ queryKey: ["riba", "list"], queryFn: () => apiGet<Riba[]>("/riba"), enabled: authed });
  const reminderQ = useQuery({ queryKey: ["riba", "reminder"], queryFn: () => apiGet<Reminder>("/riba/reminder"), enabled: authed });

  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<Riba | null>(null);
  const [invoicing, setInvoicing] = useState<Riba | null>(null);
  const [deleting, setDeleting] = useState<Riba | null>(null);

  const ribas = useMemo(() => (ribaQ.isError ? [] : ribaQ.data ?? []), [ribaQ.data, ribaQ.isError]);
  const reminder = reminderQ.isError ? undefined : reminderQ.data;
  const today = reminder?.today ?? new Date().toISOString().slice(0, 10);
  const flagged = useMemo(() => new Set(reminder?.items.map((r) => r.id) ?? []), [reminder]);

  const visible = ribas.filter((r) => {
    if (filter === "pending" && r.fatturata) return false;
    if (filter === "invoiced" && !r.fatturata) return false;
    return r.cliente.toLowerCase().includes(search.trim().toLowerCase());
  });

  const uninvoice = useMutation({
    mutationFn: (r: Riba) => apiPatch<Riba>(`/riba/${r.id}/fattura`, { fatturata: false }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["riba"] });
      toast.success("Fattura annullata: la RiBa torna da fatturare");
    },
    onError: () => toast.error("Operazione non riuscita"),
  });

  const remove = useMutation({
    mutationFn: (r: Riba) => apiDelete<void>(`/riba/${r.id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["riba"] });
      toast.success("RiBa eliminata");
      setDeleting(null);
    },
    onError: () => toast.error("Eliminazione non riuscita"),
  });

  if (me.error instanceof ApiError && me.error.status === 401) return <Navigate to="/login" replace />;

  const openNew = () => {
    setEditing(null);
    setEditOpen(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader today={today}>
        <Button data-testid="add-riba-button" onClick={openNew}>
          <Plus className="size-4" /> Nuova RiBa
        </Button>
      </AppHeader>

      <main className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-6">
          <h1 className="font-heading text-3xl font-semibold tracking-tight text-slate-900">Registro RiBa</h1>
          <p className="mt-1 text-sm text-slate-600">
            Inserisci ogni RiBa appena la carichi in banca. L'ultimo giorno del mese ti ricordiamo le fatture da emettere.
          </p>
        </div>

        {reminder && (
          <ReminderBanner
            reminder={reminder}
            onShowPending={() => setFilter("pending")}
            onInvoice={(id) => setInvoicing(reminder.items.find((r) => r.id === id) ?? null)}
          />
        )}

        <StatsCards ribas={ribas} month={today.slice(0, 7)} />

        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-200 p-4 md:flex-row md:items-center md:justify-between">
            <Tabs value={filter} onValueChange={(v) => setFilter(v as Filter)}>
              <TabsList>
                <TabsTrigger value="all" data-testid="tab-all">Tutte</TabsTrigger>
                <TabsTrigger value="pending" data-testid="tab-pending">Da fatturare</TabsTrigger>
                <TabsTrigger value="invoiced" data-testid="tab-invoiced">Fatturate</TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="relative md:w-72">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <Input data-testid="search-input" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cerca cliente…" className="pl-9" />
            </div>
          </div>

          {ribaQ.isLoading || me.isLoading ? (
            <div className="space-y-2 p-5" data-testid="riba-loading">
              {[0, 1, 2].map((i) => <div key={i} className="h-10 animate-pulse rounded-md bg-slate-100" />)}
            </div>
          ) : visible.length === 0 ? (
            <div className="flex flex-col items-start gap-3 p-10" data-testid="riba-empty-state">
              <p className="font-heading text-lg font-semibold text-slate-900">
                {ribas.length === 0 ? "Nessuna RiBa registrata" : "Nessuna RiBa corrisponde ai filtri"}
              </p>
              <p className="text-sm text-slate-600">
                {ribas.length === 0 ? "Aggiungi la prima RiBa che hai caricato in banca." : "Prova a cambiare filtro o ricerca."}
              </p>
              {ribas.length === 0 && (
                <Button data-testid="empty-add-riba-button" onClick={openNew}>
                  <Plus className="size-4" /> Aggiungi RiBa
                </Button>
              )}
            </div>
          ) : (
            <RibaTable
              ribas={visible}
              flagged={flagged}
              onInvoice={setInvoicing}
              onUninvoice={(r) => uninvoice.mutate(r)}
              onEdit={(r) => {
                setEditing(r);
                setEditOpen(true);
              }}
              onDelete={setDeleting}
            />
          )}
        </div>
      </main>

      <RibaDialog open={editOpen} onOpenChange={setEditOpen} riba={editing} today={today} />
      <InvoiceDialog riba={invoicing} today={today} onClose={() => setInvoicing(null)} />

      <Dialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <DialogContent data-testid="delete-dialog" className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-heading">Eliminare la RiBa?</DialogTitle>
            <DialogDescription>
              La RiBa di <strong>{deleting?.cliente}</strong> verrà eliminata definitivamente.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleting(null)} data-testid="delete-cancel-button">Annulla</Button>
            <Button variant="destructive" disabled={remove.isPending} onClick={() => deleting && remove.mutate(deleting)} data-testid="delete-confirm-button">
              Elimina
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
