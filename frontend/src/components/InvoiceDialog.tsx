import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiPatch } from "@/lib/api";
import type { InvoiceUpdate, Riba } from "@/lib/types";
import { formatCurrency } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Props {
  riba: Riba | null;
  today: string;
  onClose: () => void;
}

function InvoiceForm({ riba, today, onClose }: { riba: Riba; today: string; onClose: () => void }) {
  const qc = useQueryClient();
  const [numero, setNumero] = useState("");
  const [data, setData] = useState(today);

  const save = useMutation({
    mutationFn: (body: InvoiceUpdate) => apiPatch<Riba>(`/riba/${riba.id}/fattura`, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["riba"] });
      toast.success(`Fattura registrata per ${riba.cliente}`);
      onClose();
    },
    onError: () => toast.error("Operazione non riuscita"),
  });

  return (
    <form
      data-testid="invoice-form"
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        save.mutate({ fatturata: true, numero_fattura: numero.trim() || null, data_fattura: data || null });
      }}
    >
      <div className="rounded-lg bg-muted px-4 py-3 text-sm">
        <p className="font-semibold text-slate-900">{riba.cliente}</p>
        <p className="font-mono text-slate-600">{formatCurrency(riba.importo)}</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="numero-fattura">Numero fattura</Label>
          <Input id="numero-fattura" data-testid="invoice-number-input" value={numero} onChange={(e) => setNumero(e.target.value)} placeholder="Facoltativo" autoFocus />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="data-fattura">Data fattura</Label>
          <Input id="data-fattura" type="date" data-testid="invoice-date-input" value={data} onChange={(e) => setData(e.target.value)} />
        </div>
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose} data-testid="invoice-cancel-button">Annulla</Button>
        <Button type="submit" disabled={save.isPending} data-testid="invoice-save-button">
          {save.isPending ? "Salvataggio…" : "Conferma fattura"}
        </Button>
      </DialogFooter>
    </form>
  );
}

export function InvoiceDialog({ riba, today, onClose }: Props) {
  return (
    <Dialog open={!!riba} onOpenChange={(o) => !o && onClose()}>
      <DialogContent data-testid="invoice-dialog" className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading">Segna fattura emessa</DialogTitle>
          <DialogDescription>Conferma di aver emesso la fattura per questa RiBa.</DialogDescription>
        </DialogHeader>
        {riba && <InvoiceForm key={riba.id} riba={riba} today={today} onClose={onClose} />}
      </DialogContent>
    </Dialog>
  );
}
