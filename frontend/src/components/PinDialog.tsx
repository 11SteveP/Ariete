import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { KeyRound } from "lucide-react";
import { apiPost } from "@/lib/api";
import type { AuthStatus, PinChange } from "@/lib/types";
import { errorDetail } from "@/components/ClienteDialog";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const digits = (v: string) => v.replace(/\D/g, "").slice(0, 6);

function PinForm({ onDone }: { onDone: () => void }) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");

  const save = useMutation({
    mutationFn: (body: PinChange) => apiPost<AuthStatus>("/auth/pin", body),
    onSuccess: () => {
      toast.success("PIN aggiornato");
      onDone();
    },
    onError: (e) => setError(errorDetail(e, "Modifica non riuscita")),
  });

  const fields = [
    { id: "current", label: "PIN attuale", value: current, set: setCurrent },
    { id: "new", label: "Nuovo PIN", value: next, set: setNext },
    { id: "confirm", label: "Conferma nuovo PIN", value: confirm, set: setConfirm },
  ];

  return (
    <form
      data-testid="pin-change-form"
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (current.length < 4) return setError("Inserisci il PIN attuale.");
        if (next.length < 4) return setError("Il nuovo PIN deve avere da 4 a 6 cifre.");
        if (next !== confirm) return setError("I due nuovi PIN non coincidono.");
        setError("");
        save.mutate({ current_pin: current, new_pin: next });
      }}
    >
      {fields.map((f, i) => (
        <div key={f.id} className="space-y-1.5">
          <Label htmlFor={`pin-${f.id}`}>{f.label}</Label>
          <Input
            id={`pin-${f.id}`}
            data-testid={`pin-${f.id}-input`}
            type="password"
            inputMode="numeric"
            autoComplete={f.id === "current" ? "current-password" : "new-password"}
            autoFocus={i === 0}
            value={f.value}
            onChange={(e) => f.set(digits(e.target.value))}
            placeholder="••••"
            className="font-mono tracking-[0.4em]"
          />
        </div>
      ))}
      <p className="min-h-5 text-sm text-rose-700" data-testid="pin-change-error" aria-live="polite">{error}</p>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onDone} data-testid="pin-change-cancel-button">Annulla</Button>
        <Button type="submit" disabled={save.isPending} data-testid="pin-change-save-button">
          {save.isPending ? "Salvataggio…" : "Salva nuovo PIN"}
        </Button>
      </DialogFooter>
    </form>
  );
}

export function PinDialog() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="ghost" size="icon" aria-label="Modifica PIN" title="Modifica PIN" data-testid="change-pin-button" onClick={() => setOpen(true)}>
        <KeyRound className="size-4" />
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent data-testid="pin-change-dialog" className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-heading">Modifica PIN</DialogTitle>
            <DialogDescription>Scegli un nuovo PIN di 4–6 cifre. Gli altri dispositivi collegati verranno disconnessi.</DialogDescription>
          </DialogHeader>
          {open && <PinForm onDone={() => setOpen(false)} />}
        </DialogContent>
      </Dialog>
    </>
  );
}
