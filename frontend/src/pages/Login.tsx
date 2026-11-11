import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { BellRing, FileCheck2, Landmark, LockKeyhole } from "lucide-react";
import { apiPost, ApiError } from "@/lib/api";
import { beginSession } from "@/lib/session";
import type { AuthStatus } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const FEATURES = [
  { icon: Landmark, title: "Registra subito", text: "Inserisci la RiBa appena la carichi in banca: cliente, importo e scadenza." },
  { icon: BellRing, title: "Promemoria a fine mese", text: "L'ultimo giorno del mese ti ricordiamo quali fatture devi ancora emettere." },
  { icon: FileCheck2, title: "Niente dimenticanze", text: "Le RiBa dei mesi passati senza fattura restano evidenziate finché non le chiudi." },
];

export default function Login() {
  const navigate = useNavigate();
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");

  const login = useMutation({
    mutationFn: (p: string) => apiPost<AuthStatus>("/auth/login", { pin: p }),
    onSuccess: () => {
      beginSession();
      navigate("/", { replace: true });
    },
    onError: (e) => {
      setError(e instanceof ApiError && e.status === 401 ? "PIN errato, riprova." : "Impossibile accedere. Riprova tra poco.");
      setPin("");
    },
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length < 4) {
      setError("Il PIN deve avere almeno 4 cifre.");
      return;
    }
    setError("");
    login.mutate(pin);
  };

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto grid min-h-screen max-w-6xl grid-cols-1 items-center gap-12 px-6 py-12 lg:grid-cols-12">
        <section className="animate-rise-in lg:col-span-7">
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-primary">RiBa &amp; Fatture</p>
          <h1 className="mt-4 font-heading text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
            Ogni RiBa caricata,
            <br />
            <span className="text-primary">ogni fattura emessa.</span>
          </h1>
          <p className="mt-5 max-w-lg text-base leading-relaxed text-slate-600">
            Il tuo registro personale delle ricevute bancarie, con un promemoria che a fine mese ti dice esattamente quali fatture mancano.
          </p>
          <ul className="mt-10 space-y-5">
            {FEATURES.map(({ icon: Icon, title, text }) => (
              <li key={title} className="flex gap-4">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-accent text-primary">
                  <Icon className="size-5" />
                </span>
                <div>
                  <p className="font-heading font-semibold text-slate-900">{title}</p>
                  <p className="text-sm text-slate-600">{text}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="animate-rise-in lg:col-span-5" style={{ animationDelay: "120ms" }}>
          <form
            onSubmit={submit}
            data-testid="pin-login-form"
            className="rounded-2xl border border-slate-200 bg-white p-8 shadow-[0_20px_60px_-30px_rgba(15,23,42,0.35)]"
          >
            <span className="flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <LockKeyhole className="size-6" />
            </span>
            <h2 className="mt-6 font-heading text-2xl font-semibold tracking-tight text-slate-900">Accedi con il PIN</h2>
            <p className="mt-1 text-sm text-slate-500">Inserisci il PIN di 4–6 cifre per aprire il registro.</p>
            <div className="mt-6 space-y-2">
              <Label htmlFor="pin">PIN</Label>
              <Input
                id="pin"
                data-testid="pin-input"
                type="password"
                inputMode="numeric"
                autoComplete="current-password"
                autoFocus
                maxLength={6}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                placeholder="••••"
                className="h-14 text-center font-mono text-2xl tracking-[0.6em]"
                aria-describedby="pin-error"
              />
              <p id="pin-error" data-testid="pin-error" className="min-h-5 text-sm text-rose-700" aria-live="polite">
                {error}
              </p>
            </div>
            <Button type="submit" data-testid="pin-submit-button" disabled={login.isPending} className="mt-2 h-11 w-full text-base">
              {login.isPending ? "Verifica…" : "Sblocca"}
            </Button>
          </form>
        </section>
      </div>
    </main>
  );
}
