import { FileCheck2, MoreHorizontal, Pencil, Trash2, Undo2 } from "lucide-react";
import type { Riba } from "@/lib/types";
import { formatCurrency, formatDate, monthName } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface Props {
  ribas: Riba[];
  flagged: Set<string>;
  onInvoice: (r: Riba) => void;
  onUninvoice: (r: Riba) => void;
  onEdit: (r: Riba) => void;
  onDelete: (r: Riba) => void;
}

export function RibaTable({ ribas, flagged, onInvoice, onUninvoice, onEdit, onDelete }: Props) {
  return (
    <Table data-testid="riba-table">
      <TableHeader>
        <TableRow className="bg-slate-50 hover:bg-slate-50">
          <TableHead className="pl-5">Cliente</TableHead>
          <TableHead className="text-right">Importo</TableHead>
          <TableHead>Caricata il</TableHead>
          <TableHead>Scadenza</TableHead>
          <TableHead>Fattura da fare a</TableHead>
          <TableHead>Fattura</TableHead>
          <TableHead className="pr-5 text-right">Azioni</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {ribas.map((r) => (
          <TableRow
            key={r.id}
            data-testid={`riba-row-${r.id}`}
            className={`transition-colors duration-150 ${flagged.has(r.id) ? "bg-amber-50/50" : ""}`}
          >
            <TableCell className="pl-5">
              <p className="font-semibold text-slate-900" data-testid={`riba-cliente-${r.id}`}>{r.cliente}</p>
              {r.note && <p className="max-w-xs truncate text-xs text-slate-500">{r.note}</p>}
            </TableCell>
            <TableCell className="text-right font-mono font-medium text-slate-900" data-testid={`riba-importo-${r.id}`}>{formatCurrency(r.importo)}</TableCell>
            <TableCell className="text-slate-600">{formatDate(r.data_caricamento)}</TableCell>
            <TableCell className="text-slate-600">{formatDate(r.data_scadenza)}</TableCell>
            <TableCell className="font-medium text-slate-800" data-testid={`riba-mese-fattura-${r.id}`}>{monthName(r.mese_fattura)}</TableCell>
            <TableCell data-testid={`riba-status-${r.id}`}>
              {r.fatturata ? (
                <div>
                  <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">Fatturata</Badge>
                  <p className="mt-1 text-xs text-slate-500">
                    {r.numero_fattura ? `N. ${r.numero_fattura} · ` : ""}
                    {formatDate(r.data_fattura)}
                  </p>
                </div>
              ) : (
                <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">Da fatturare</Badge>
              )}
            </TableCell>
            <TableCell className="pr-5 text-right">
              <div className="flex items-center justify-end gap-2">
                {!r.fatturata && (
                  <Button size="sm" data-testid={`riba-invoice-button-${r.id}`} onClick={() => onInvoice(r)}>
                    <FileCheck2 className="size-4" /> Segna fattura
                  </Button>
                )}
                <DropdownMenu>
                  <DropdownMenuTrigger render={<Button size="icon-sm" variant="ghost" data-testid={`riba-menu-button-${r.id}`} aria-label="Altre azioni" />}>
                    <MoreHorizontal className="size-4" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem data-testid={`riba-edit-button-${r.id}`} onClick={() => onEdit(r)}>
                      <Pencil className="size-4" /> Modifica
                    </DropdownMenuItem>
                    {r.fatturata && (
                      <DropdownMenuItem data-testid={`riba-uninvoice-button-${r.id}`} onClick={() => onUninvoice(r)}>
                        <Undo2 className="size-4" /> Annulla fattura
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem variant="destructive" data-testid={`riba-delete-button-${r.id}`} onClick={() => onDelete(r)}>
                      <Trash2 className="size-4" /> Elimina
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
