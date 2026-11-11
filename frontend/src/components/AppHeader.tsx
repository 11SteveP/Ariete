import { NavLink } from "react-router-dom";
import { LogOut, Receipt } from "lucide-react";
import { endSession } from "@/lib/session";
import { monthLabel } from "@/lib/format";
import { Button } from "@/components/ui/button";

const NAV = [
  { to: "/", label: "Registro RiBa", testid: "nav-riba" },
  { to: "/clienti", label: "Clienti", testid: "nav-clienti" },
];

export function AppHeader({ today, children }: { today: string; children?: React.ReactNode }) {
  return (
    <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Receipt className="size-5" />
            </span>
            <div>
              <p className="font-heading text-lg font-semibold leading-tight text-slate-900">RiBa &amp; Fatture</p>
              <p className="text-xs text-slate-500" data-testid="current-month-label">{monthLabel(today)}</p>
            </div>
          </div>
          <nav className="flex gap-1">
            {NAV.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                end
                data-testid={n.testid}
                className={({ isActive }) =>
                  `rounded-md px-3 py-1.5 text-sm font-medium transition-colors duration-150 ${
                    isActive ? "bg-accent text-accent-foreground" : "text-slate-600 hover:bg-slate-100"
                  }`
                }
              >
                {n.label}
              </NavLink>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-2">
          {children}
          <Button variant="ghost" size="icon" data-testid="logout-button" aria-label="Esci" onClick={() => endSession("/login")}>
            <LogOut className="size-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}
