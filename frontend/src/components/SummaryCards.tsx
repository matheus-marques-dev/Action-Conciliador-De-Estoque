import { AlertTriangle, CheckCircle, Package, Search, TrendingDown } from "lucide-react";
import { useEffect, useState } from "react";
import type { MarketplaceSummary, ReconciliationResult } from "../types";

/* ── Count-up hook ─────────────────────────────────────────────────────────── */
function useCountUp(target: number, duration = 900) {
  const [v, setV] = useState(0);
  useEffect(() => {
    if (target === 0) { setV(0); return; }
    const start = performance.now();
    const tick  = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      const e = 1 - Math.pow(1 - t, 3); // ease-out cubic
      setV(Math.round(e * target));
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [target, duration]);
  return v;
}

/* ── Segmented bar ─────────────────────────────────────────────────────────── */
interface Seg { value: number; color: string; label: string; textColor: string; }

function SegmentedBar({ total, segments }: { total: number; segments: Seg[] }) {
  const [ready, setReady] = useState(false);
  useEffect(() => { const t = setTimeout(() => setReady(true), 120); return () => clearTimeout(t); }, []);

  if (total === 0) return null;

  return (
    <div className="mt-4 animate-fade-in delay-400">
      {/* Legend */}
      <div className="mb-2 flex flex-wrap gap-x-4 gap-y-1">
        {segments.map((s) => s.value > 0 && (
          <span key={s.label} className="inline-flex items-center gap-1.5 text-xs text-slate-500">
            <span className={`h-2.5 w-2.5 rounded-sm ${s.color}`} />
            {s.label}
            <span className="font-semibold text-slate-700">
              {((s.value / total) * 100).toFixed(0)}%
            </span>
          </span>
        ))}
      </div>

      {/* Bar */}
      <div className="flex h-3 overflow-hidden rounded-full bg-slate-100">
        {segments.map((s) => {
          const pct = ready ? `${(s.value / total) * 100}%` : "0%";
          return s.value > 0 ? (
            <div
              key={s.label}
              className={`${s.color} first:rounded-l-full last:rounded-r-full transition-all duration-1000 ease-out`}
              style={{ width: pct }}
              title={`${s.label}: ${s.value}`}
            />
          ) : null;
        })}
      </div>
    </div>
  );
}

/* ── Stat card ─────────────────────────────────────────────────────────────── */
interface CardProps {
  label: string; value: number;
  icon: React.ReactNode;
  bg: string; text: string; border: string;
  delay: string; pulse?: boolean;
}

function StatCard({ label, value, icon, bg, text, border, delay, pulse }: CardProps) {
  const displayed = useCountUp(value);
  return (
    <div className={`card border ${border} ${bg} p-4 animate-scale-in ${delay} ${pulse && value > 0 ? "pulse-critical" : ""} hover:shadow-md transition-shadow duration-200`}>
      <div className={`mb-2 ${text}`}>{icon}</div>
      <p className="text-2xl font-extrabold tabular-nums text-slate-800">{displayed.toLocaleString("pt-BR")}</p>
      <p className="mt-0.5 text-xs leading-tight text-slate-500">{label}</p>
    </div>
  );
}

/* ── Main component ────────────────────────────────────────────────────────── */
export default function SummaryCards({ result }: { result: ReconciliationResult }) {
  const totalOk          = result.marketplaces.reduce((s, m) => s + m.ok, 0);
  const totalDivergences = result.marketplaces.reduce((s, m) => s + m.divergences, 0);
  const totalCritical    = result.marketplaces.reduce((s, m) => s + m.critical, 0);
  const totalNotFound    = result.marketplaces.reduce((s, m) => s + m.not_found, 0);
  const totalOverstock   = totalDivergences - totalCritical - (result.marketplaces.reduce((s, m) => s + m.ok, 0) - totalOk);

  const cards: CardProps[] = [
    { label: "SKUs no ERP",          value: result.total_erp_skus, icon: <Package      className="h-6 w-6" />, bg: "bg-blue-50",    text: "text-blue-600",    border: "border-blue-200",    delay: "delay-75"  },
    { label: "OK — Alinhados",       value: totalOk,               icon: <CheckCircle  className="h-6 w-6" />, bg: "bg-emerald-50", text: "text-emerald-600", border: "border-emerald-200", delay: "delay-150" },
    { label: "Divergências",         value: totalDivergences,      icon: <TrendingDown className="h-6 w-6" />, bg: "bg-orange-50",  text: "text-orange-600",  border: "border-orange-200",  delay: "delay-225" },
    { label: "Críticos (Est. Zero)", value: totalCritical,         icon: <AlertTriangle className="h-6 w-6" />, bg: "bg-red-50",   text: "text-red-600",     border: "border-red-200",     delay: "delay-300", pulse: true },
    { label: "Não Encontrados",      value: totalNotFound,         icon: <Search       className="h-6 w-6" />, bg: "bg-rose-50",   text: "text-rose-500",    border: "border-rose-200",    delay: "delay-375" },
  ];

  const segs: Seg[] = [
    { value: totalOk,          color: "bg-emerald-500", label: "OK",          textColor: "text-emerald-600" },
    { value: totalDivergences, color: "bg-orange-400",  label: "Divergência", textColor: "text-orange-600"  },
    { value: totalCritical,    color: "bg-red-500",     label: "Crítico",     textColor: "text-red-600"     },
    { value: totalNotFound,    color: "bg-rose-400",    label: "Ausente",     textColor: "text-rose-600"    },
  ];
  // Deduplicate (critical is a subset of divergences for display — show separately)
  const barSegs: Seg[] = [
    { value: totalOk,               color: "bg-emerald-500", label: "OK",          textColor: "text-emerald-600" },
    { value: totalDivergences - totalCritical, color: "bg-orange-400", label: "Divergência", textColor: "text-orange-600" },
    { value: totalCritical,         color: "bg-red-500",     label: "Crítico",     textColor: "text-red-600"     },
    { value: totalNotFound,         color: "bg-rose-400",    label: "Ausente",     textColor: "text-rose-600"    },
  ];

  return (
    <div className="space-y-4">
      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {cards.map((c) => <StatCard key={c.label} {...c} />)}
      </div>

      {/* Segmented bar */}
      <SegmentedBar total={result.total_erp_skus} segments={barSegs} />

      {/* Per-marketplace breakdown (if multiple) */}
      {result.marketplaces.length > 1 && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 animate-fade-in-up delay-450">
          {result.marketplaces.map((m) => (
            <MarketplaceCard key={m.name} summary={m} />
          ))}
        </div>
      )}

      {/* Warnings */}
      {result.warnings.length > 0 && (
        <div className="animate-fade-in delay-500 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <p className="mb-1 font-semibold text-amber-800">Avisos durante o processamento:</p>
          <ul className="list-disc pl-4 text-sm text-amber-700 space-y-0.5">
            {result.warnings.map((w, i) => <li key={i}>{w}</li>)}
          </ul>
        </div>
      )}
    </div>
  );
}

function MarketplaceCard({ summary }: { summary: MarketplaceSummary }) {
  const ok   = useCountUp(summary.ok);
  const div  = useCountUp(summary.divergences);
  const crit = useCountUp(summary.critical);
  const nf   = useCountUp(summary.not_found);

  return (
    <div className="card p-4 hover:shadow-md transition-shadow">
      <p className="mb-3 font-semibold text-slate-700">{summary.name}</p>
      <div className="grid grid-cols-4 gap-2 text-center">
        <Stat label="OK"          value={ok}   color="text-emerald-600" bg="bg-emerald-50" />
        <Stat label="Divergência" value={div}  color="text-orange-500"  bg="bg-orange-50" />
        <Stat label="Críticos"    value={crit} color="text-red-600"     bg="bg-red-50" />
        <Stat label="Ausentes"    value={nf}   color="text-rose-500"    bg="bg-rose-50" />
      </div>
    </div>
  );
}

function Stat({ label, value, color, bg }: { label: string; value: number; color: string; bg: string }) {
  return (
    <div className={`rounded-xl ${bg} py-2`}>
      <p className={`text-xl font-extrabold tabular-nums ${color}`}>{value}</p>
      <p className="text-[10px] text-slate-400 leading-tight">{label}</p>
    </div>
  );
}
