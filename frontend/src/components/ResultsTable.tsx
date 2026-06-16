import {
  AlertTriangle,
  ArrowUpDown,
  CheckCircle,
  ExternalLink,
  SearchX,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { useMemo, useState } from "react";
import type { DivergenceStatus, ReconciliationItem } from "../types";

/* ── Status config ──────────────────────────────────────────────────────────── */
const STATUS: Record<
  DivergenceStatus,
  { label: string; badge: string; icon: React.ReactNode; filter: string }
> = {
  OK:         { label: "OK",             badge: "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200", icon: <CheckCircle  className="h-3 w-3" />, filter: "OK" },
  ZERO_STOCK: { label: "Estoque Zero",   badge: "bg-red-100     text-red-700     ring-1 ring-red-200",     icon: <AlertTriangle className="h-3 w-3" />, filter: "Crítico" },
  LOW_STOCK:  { label: "Estoque Baixo",  badge: "bg-orange-100  text-orange-700  ring-1 ring-orange-200",  icon: <TrendingDown  className="h-3 w-3" />, filter: "Baixo" },
  OVERSTOCK:  { label: "Excesso",        badge: "bg-amber-100   text-amber-700   ring-1 ring-amber-200",   icon: <TrendingUp    className="h-3 w-3" />, filter: "Excesso" },
  NOT_FOUND:  { label: "Não Encontrado", badge: "bg-rose-100    text-rose-700    ring-1 ring-rose-200",    icon: <SearchX       className="h-3 w-3" />, filter: "Ausente" },
};

const FILTERS = ["Todos", "Crítico", "Baixo", "Excesso", "Ausente", "OK"];

const PAGE_SIZE = 25;

export default function ResultsTable({ items }: { items: ReconciliationItem[] }) {
  const [filter, setFilter]   = useState("Todos");
  const [search, setSearch]   = useState("");
  const [page, setPage]       = useState(1);
  const [sort, setSort]       = useState<{ col: string; dir: "asc" | "desc" } | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let rows = items.filter((r) => {
      const meta = STATUS[r.status];
      const matchFilter =
        filter === "Todos" ||
        meta.filter === filter ||
        (filter === "Crítico" && r.status === "ZERO_STOCK");
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        r.sku.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q) ||
        r.marketplace.toLowerCase().includes(q);
      return matchFilter && matchSearch;
    });

    if (sort) {
      rows = [...rows].sort((a, b) => {
        const val = (r: ReconciliationItem) => {
          if (sort.col === "erp_qty")         return r.erp_qty;
          if (sort.col === "marketplace_qty") return r.marketplace_qty ?? -Infinity;
          if (sort.col === "divergence")      return r.divergence ?? -Infinity;
          return 0;
        };
        return sort.dir === "asc" ? val(a) - val(b) : val(b) - val(a);
      });
    }

    return rows;
  }, [items, filter, search, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const changeFilter = (f: string) => { setFilter(f); setPage(1); };
  const changeSearch = (v: string) => { setSearch(v); setPage(1); };
  const toggleSort   = (col: string) =>
    setSort((s) =>
      s?.col === col ? { col, dir: s.dir === "asc" ? "desc" : "asc" } : { col, dir: "desc" }
    );

  const counts: Record<string, number> = useMemo(() => ({
    Todos: items.length,
    Crítico: items.filter((i) => i.status === "ZERO_STOCK").length,
    Baixo:   items.filter((i) => i.status === "LOW_STOCK").length,
    Excesso: items.filter((i) => i.status === "OVERSTOCK").length,
    Ausente: items.filter((i) => i.status === "NOT_FOUND").length,
    OK:      items.filter((i) => i.status === "OK").length,
  }), [items]);

  const FILTER_COLORS: Record<string, string> = {
    Todos:   "bg-slate-800 text-white",
    Crítico: "bg-red-600   text-white",
    Baixo:   "bg-orange-500 text-white",
    Excesso: "bg-amber-500  text-white",
    Ausente: "bg-rose-500   text-white",
    OK:      "bg-emerald-600 text-white",
  };

  return (
    <div className="space-y-4">
      {/* ── Toolbar ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        {/* Filter pills */}
        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => changeFilter(f)}
              className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all duration-200 ${
                filter === f
                  ? FILTER_COLORS[f]
                  : "bg-white text-slate-500 border border-slate-200 hover:border-slate-300 hover:text-slate-700"
              }`}
            >
              {f}
              <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold transition-colors ${
                filter === f ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"
              }`}>
                {counts[f] ?? 0}
              </span>
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative">
          <svg className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            className="input pl-9 max-w-[220px]"
            placeholder="Buscar SKU ou produto…"
            value={search}
            onChange={(e) => changeSearch(e.target.value)}
          />
        </div>
      </div>

      <p className="text-xs text-slate-400">
        {filtered.length} item{filtered.length !== 1 ? "s" : ""} exibido{filtered.length !== 1 ? "s" : ""}
      </p>

      {/* ── Table ── */}
      <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-sm">
        <table className="min-w-full divide-y divide-slate-100 text-sm">
          <thead>
            <tr className="bg-gradient-to-r from-slate-900 to-slate-800">
              {[
                { label: "SKU",          col: null },
                { label: "Produto",      col: null },
                { label: "Marketplace",  col: null },
                { label: "Qtd ERP",      col: "erp_qty" },
                { label: "Qtd MP",       col: "marketplace_qty" },
                { label: "Divergência",  col: "divergence" },
                { label: "Status",       col: null },
                { label: "Ação",         col: null },
              ].map(({ label, col }) => (
                <th
                  key={label}
                  className="whitespace-nowrap px-4 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-300 select-none"
                  onClick={col ? () => toggleSort(col) : undefined}
                  style={col ? { cursor: "pointer" } : {}}
                >
                  <span className="inline-flex items-center gap-1">
                    {label}
                    {col && (
                      <ArrowUpDown className={`h-3 w-3 transition-colors ${
                        sort?.col === col ? "text-indigo-400" : "text-slate-600"
                      }`} />
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-50 bg-white">
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-16 text-center">
                  <div className="flex flex-col items-center gap-2 text-slate-400">
                    <SearchX className="h-10 w-10 opacity-30" />
                    <p className="font-medium">Nenhum item encontrado</p>
                    <p className="text-xs">Tente ajustar os filtros ou a busca</p>
                  </div>
                </td>
              </tr>
            ) : (
              paginated.map((item, idx) => {
                const meta    = STATUS[item.status];
                const rowKey  = `${item.sku}-${item.marketplace}`;
                const isOpen  = expanded === rowKey;
                const isCrit  = item.status === "ZERO_STOCK";
                const animDelay = Math.min(idx * 30, 400);

                return (
                  <>
                    <tr
                      key={rowKey}
                      className={`group row-animated cursor-pointer transition-colors duration-150 ${
                        isCrit
                          ? "bg-red-50/40 hover:bg-red-50"
                          : isOpen
                          ? "bg-indigo-50/40"
                          : "hover:bg-slate-50/70"
                      }`}
                      style={{ animationDelay: `${animDelay}ms` }}
                      onClick={() => setExpanded(isOpen ? null : rowKey)}
                    >
                      {/* Left accent bar for critical */}
                      <td className="relative whitespace-nowrap px-4 py-3">
                        {isCrit && (
                          <span className="absolute left-0 top-0 bottom-0 w-0.5 rounded-r bg-red-500" />
                        )}
                        <span className="font-mono text-xs font-semibold text-slate-600">{item.sku}</span>
                      </td>

                      <td className="px-4 py-3 max-w-[200px]">
                        <span className="line-clamp-1 text-slate-800">{item.description}</span>
                      </td>

                      <td className="whitespace-nowrap px-4 py-3 text-slate-500 text-xs">
                        {item.marketplace}
                      </td>

                      <td className="whitespace-nowrap px-4 py-3 text-right font-mono text-slate-700">
                        {item.erp_qty}
                      </td>

                      <td className="whitespace-nowrap px-4 py-3 text-right font-mono text-slate-700">
                        {item.marketplace_qty ?? "—"}
                      </td>

                      <td className={`whitespace-nowrap px-4 py-3 text-right font-bold font-mono ${
                        item.divergence === null ? "text-slate-300" :
                        item.divergence < 0     ? "text-red-600"   :
                        item.divergence > 0     ? "text-amber-600" :
                                                  "text-emerald-600"
                      }`}>
                        {item.divergence === null ? "—" :
                         item.divergence > 0 ? `+${item.divergence}` :
                         item.divergence}
                      </td>

                      <td className="whitespace-nowrap px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${meta.badge}`}>
                          {meta.icon}
                          {meta.label}
                        </span>
                      </td>

                      <td className="px-4 py-3">
                        <button className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-all duration-200 ${
                          isOpen
                            ? "bg-indigo-600 text-white"
                            : "bg-slate-100 text-slate-600 group-hover:bg-indigo-100 group-hover:text-indigo-700"
                        }`}>
                          {isOpen ? "Fechar" : "Ver"}
                        </button>
                      </td>
                    </tr>

                    {/* Expanded row */}
                    {isOpen && (
                      <tr key={`${rowKey}-exp`} className="animate-fade-in">
                        <td colSpan={8} className="bg-indigo-50/60 px-4 py-4 border-b border-indigo-100">
                          <div className="flex flex-wrap items-start gap-6 text-sm">
                            <div>
                              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">ID do Anúncio</p>
                              <p className="font-mono text-slate-700">{item.listing_id || "—"}</p>
                            </div>
                            <div className="flex-1">
                              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">Ação Sugerida</p>
                              <p className={`font-medium ${isCrit ? "text-red-700" : "text-slate-700"}`}>
                                {item.suggested_action}
                              </p>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ── Pagination ── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm animate-fade-in">
          <span className="text-slate-400 text-xs">
            Página {page} de {totalPages} · {filtered.length} itens
          </span>
          <div className="flex items-center gap-1">
            <button
              className="btn-outline px-3 py-1.5 text-xs"
              disabled={page === 1}
              onClick={() => setPage(1)}
            >
              «
            </button>
            <button
              className="btn-outline px-3 py-1.5 text-xs"
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Anterior
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const n = Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
              return (
                <button
                  key={n}
                  className={`h-8 w-8 rounded-xl text-xs font-semibold transition-all ${
                    n === page
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "bg-white text-slate-600 border border-slate-200 hover:border-indigo-300 hover:text-indigo-600"
                  }`}
                  onClick={() => setPage(n)}
                >
                  {n}
                </button>
              );
            })}
            <button
              className="btn-outline px-3 py-1.5 text-xs"
              disabled={page === totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Próxima
            </button>
            <button
              className="btn-outline px-3 py-1.5 text-xs"
              disabled={page === totalPages}
              onClick={() => setPage(totalPages)}
            >
              »
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
