import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  Download,
  GitCompare,
  RefreshCw,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { fetchMarketplaces, reconcile, reportDownloadUrl } from "./api/client";
import FileUpload from "./components/FileUpload";
import LoadingOverlay from "./components/LoadingOverlay";
import Logo from "./components/Logo";
import MarketplaceConfig from "./components/MarketplaceConfig";
import Particles from "./components/Particles";
import ResultsTable from "./components/ResultsTable";
import SummaryCards from "./components/SummaryCards";
import type { MarketplaceCredentials, MarketplaceOption, ReconciliationResult } from "./types";

/* ── Typewriter hook ────────────────────────────────────────────────────────── */
function useTypewriter(text: string, charDelay = 38, startDelay = 500) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const pre = setTimeout(() => {
      const iv = setInterval(() => {
        setCount((c) => {
          if (c >= text.length) { clearInterval(iv); return c; }
          return c + 1;
        });
      }, charDelay);
      return () => clearInterval(iv);
    }, startDelay);
    return () => clearTimeout(pre);
  }, [text, charDelay, startDelay]);
  return { out: text.slice(0, count), done: count >= text.length };
}

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

type Step = "upload" | "marketplace" | "results";
type Dir  = "forward" | "back";

const STEPS: { id: Step; label: string; short: string }[] = [
  { id: "upload",      label: "Arquivo ERP",   short: "ERP" },
  { id: "marketplace", label: "Marketplaces",  short: "MP" },
  { id: "results",     label: "Resultados",    short: "Resultado" },
];

export default function App() {
  const [step, setStep]           = useState<Step>("upload");
  const [dir, setDir]             = useState<Dir>("forward");
  const [erpFile, setErpFile]     = useState<File | null>(null);
  const [mpOptions, setMpOptions] = useState<MarketplaceOption[]>([]);
  const [mpConfigs, setMpConfigs] = useState<MarketplaceCredentials[]>([{ marketplace: "mock" }]);
  const [loadStep, setLoadStep]   = useState(0);   // 0=hidden, 1-4=steps
  const [error, setError]         = useState<string | null>(null);
  const [result, setResult]       = useState<ReconciliationResult | null>(null);

  const loading = loadStep > 0;

  useEffect(() => { fetchMarketplaces().then(setMpOptions).catch(() => {}); }, []);

  const go = (to: Step, direction: Dir) => { setDir(direction); setStep(to); };

  const runReconcile = async () => {
    if (!erpFile) return;
    setError(null);
    setLoadStep(1);

    await sleep(480);
    setLoadStep(2);

    try {
      const data = await reconcile(erpFile, mpConfigs);
      setLoadStep(3);
      await sleep(420);
      setLoadStep(4);
      await sleep(360);
      setResult(data);
      setDir("forward");
      setStep("results");
    } catch (err: any) {
      setError(err?.response?.data?.detail ?? err?.message ?? "Erro desconhecido.");
    } finally {
      setLoadStep(0);
    }
  };

  const reset = () => {
    setStep("upload"); setDir("back");
    setErpFile(null);
    setMpConfigs([{ marketplace: "mock" }]);
    setResult(null);
    setError(null);
  };

  const stepIdx = STEPS.findIndex((s) => s.id === step);
  const canNext = step === "upload" ? !!erpFile : step === "marketplace" ? mpConfigs.length > 0 : false;

  const animClass = dir === "forward" ? "animate-slide-right" : "animate-slide-left";

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Loading overlay */}
      <LoadingOverlay currentStep={loadStep} skuCount={erpFile ? undefined : 0} />

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/85 backdrop-blur-lg shadow-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Logo size={36} id="header" className="flex-shrink-0 hover:scale-105 transition-transform duration-200" />
            <div className="leading-tight">
              <p className="text-[15px] font-extrabold tracking-tight text-slate-900">Action</p>
              <p className="text-[10px] font-semibold tracking-widest text-indigo-500 uppercase">
                Conciliador de Estoque
              </p>
            </div>
          </div>

          {/* Step indicator pill (steps 2+) */}
          {step !== "upload" && (
            <div className="flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 p-1 animate-fade-in">
              {STEPS.map((s, i) => {
                const done   = i < stepIdx;
                const active = s.id === step;
                return (
                  <div
                    key={s.id}
                    className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all duration-300 ${
                      active ? "bg-indigo-600 text-white shadow-sm" :
                      done   ? "text-indigo-600" : "text-slate-400"
                    }`}
                  >
                    <span className={`flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold ${
                      active ? "bg-white/25 text-white" :
                      done   ? "bg-indigo-100 text-indigo-600" : "bg-slate-200 text-slate-400"
                    }`}>
                      {done ? "✓" : i + 1}
                    </span>
                    <span className="hidden sm:inline">{s.short}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Progress bar under header */}
        <div className="h-0.5 bg-slate-100">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-700 ease-out"
            style={{ width: `${((stepIdx) / (STEPS.length - 1)) * 100}%` }}
          />
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8 pb-16">
        {/* ── Error ───────────────────────────────────────────────────────── */}
        {error && (
          <div className="mb-6 animate-bounce-in flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 shadow-sm">
            <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-500 mt-0.5" />
            <div>
              <p className="font-semibold text-red-800">Erro na reconciliação</p>
              <p className="text-sm text-red-700">{error}</p>
            </div>
            <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-600">✕</button>
          </div>
        )}

        {/* ── Step content ─────────────────────────────────────────────────── */}
        <div key={step} className={animClass}>

          {/* ══ STEP 1 — Upload ══════════════════════════════════════════════ */}
          {step === "upload" && <HeroUpload file={erpFile} onFile={setErpFile} />}

          {/* ══ STEP 2 — Marketplace ═════════════════════════════════════════ */}
          {step === "marketplace" && (
            <div className="card p-6">
              <h2 className="mb-1 text-xl font-bold text-slate-800">Configurar Marketplaces</h2>
              <p className="mb-6 text-sm text-slate-500">
                Selecione um ou mais marketplaces. Use o <strong>Mock</strong> para testar sem credenciais reais.
              </p>
              {mpOptions.length > 0 ? (
                <MarketplaceConfig options={mpOptions} selected={mpConfigs} onChange={setMpConfigs} />
              ) : (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="shimmer h-16 rounded-2xl" />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ══ STEP 3 — Results ═════════════════════════════════════════════ */}
          {step === "results" && result && (
            <div className="space-y-5">
              {/* Results header card */}
              <div className="card overflow-hidden animate-fade-in">
                <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-indigo-950 to-violet-950 px-6 py-6">
                  <Particles />
                  <div className="relative z-10 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Logo size={42} id="results" className="animate-logo-glow" />
                      <div>
                        <p className="font-extrabold text-white text-lg">Relatório Gerado</p>
                        <p className="text-xs text-indigo-300 mt-0.5">
                          ID <span className="font-mono">{result.report_id}</span> ·{" "}
                          {result.total_erp_skus} SKUs analisados
                        </p>
                      </div>
                    </div>
                    <a
                      href={reportDownloadUrl(result.report_id)}
                      download
                      className="btn-primary bg-white/10 border border-white/20 hover:bg-white/20 backdrop-blur-sm"
                    >
                      <Download className="h-4 w-4" />
                      <span className="hidden sm:inline">Baixar Excel</span>
                    </a>
                  </div>
                </div>
                <div className="p-6">
                  <SummaryCards result={result} />
                </div>
              </div>

              {/* Table card */}
              <div className="card p-6 animate-fade-in-up delay-200">
                <h3 className="mb-4 font-semibold text-slate-800">Detalhamento por SKU</h3>
                <ResultsTable items={result.items} />
              </div>
            </div>
          )}
        </div>

        {/* ── Navigation ──────────────────────────────────────────────────── */}
        <div className="mt-8 flex items-center justify-between">
          {step !== "upload" ? (
            <button className="btn-outline" onClick={step === "results" ? reset : () => go("upload", "back")}>
              {step === "results" ? <><RefreshCw className="h-4 w-4" /> Nova Conciliação</> : <><ArrowLeft className="h-4 w-4" /> Voltar</>}
            </button>
          ) : <div />}

          {step !== "results" && (
            <button
              className="btn-primary text-base px-6 py-3 shadow-lg shadow-indigo-200"
              disabled={!canNext || loading}
              onClick={step === "marketplace" ? runReconcile : () => go("marketplace", "forward")}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25"/>
                    <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
                  </svg>
                  Processando…
                </span>
              ) : step === "marketplace" ? (
                <><GitCompare className="h-4 w-4" /> Conciliar Agora</>
              ) : (
                <>Próximo <ArrowRight className="h-4 w-4" /></>
              )}
            </button>
          )}
        </div>
      </main>
    </div>
  );
}

/* ── Hero + Upload (Step 1) ────────────────────────────────────────────────── */
function HeroUpload({ file, onFile }: { file: File | null; onFile: (f: File) => void }) {
  const { out: tagline, done } = useTypewriter(
    "Chega de cancelamentos por falta de estoque.",
    40, 600
  );

  return (
    <div className="card overflow-hidden">
      {/* Hero section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-indigo-950 to-violet-950 px-8 py-16 text-center hero-grid">
        <Particles />

        {/* Decorative orbs */}
        <div className="glow-orb w-72 h-72 bg-indigo-600 opacity-30 -top-20 -left-20" />
        <div className="glow-orb w-56 h-56 bg-violet-600 opacity-25 -bottom-16 -right-16" />
        <div className="glow-orb w-40 h-40 bg-fuchsia-500 opacity-20 top-10 right-1/4" />

        {/* Floating logo */}
        <div className="relative z-10 flex justify-center mb-8">
          <div className="relative">
            <div className="absolute inset-0 rounded-3xl bg-indigo-500/30 blur-2xl scale-125 animate-pulse" />
            <Logo size={88} id="hero" className="relative animate-float animate-logo-glow" />
          </div>
        </div>

        {/* App name */}
        <p className="relative z-10 text-sm font-bold uppercase tracking-[0.3em] text-indigo-400 mb-3 animate-fade-in delay-75">
          Action
</p>

        {/* Typewriter tagline */}
        <h1 className="relative z-10 mb-4 min-h-[5rem] text-3xl sm:text-4xl font-extrabold leading-tight tracking-tight">
          <span className="gradient-text">{tagline}</span>
          {!done && (
            <span className="cursor-blink ml-0.5 inline-block h-8 w-0.5 bg-indigo-400 align-middle" />
          )}
        </h1>

        {/* Subtitle */}
        <p className="relative z-10 mx-auto mb-8 max-w-lg text-base text-slate-400 animate-fade-in-up delay-150">
          Faça o upload da sua planilha do ERP, conecte os marketplaces e veja em segundos
          onde seus estoques estão desalinhados.
        </p>

        {/* Feature badges */}
        <div className="relative z-10 flex flex-wrap justify-center gap-3 animate-fade-in-up delay-225">
          {[
            { icon: <Zap className="h-3.5 w-3.5" />,         label: "Análise em segundos" },
            { icon: <ShieldCheck className="h-3.5 w-3.5" />, label: "CSV e Excel" },
            { icon: <CheckCircle className="h-3.5 w-3.5" />, label: "Múltiplos marketplaces" },
            { icon: <Download className="h-3.5 w-3.5" />,    label: "Relatório Excel" },
          ].map((b) => (
            <span
              key={b.label}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/8 px-3.5 py-1.5 text-xs font-medium text-slate-200 backdrop-blur-sm hover:bg-white/15 transition-colors cursor-default"
            >
              {b.icon}{b.label}
            </span>
          ))}
        </div>
      </div>

      {/* Upload area */}
      <div className="p-6 animate-fade-in delay-400">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <p className="font-semibold text-slate-800">Arquivo do ERP</p>
            <p className="text-sm text-slate-500">Colunas obrigatórias: SKU e Quantidade</p>
          </div>
          {file && (
            <span className="animate-bounce-in rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
              ✓ Pronto
            </span>
          )}
        </div>

        <FileUpload onFileSelected={onFile} selectedFile={file} onClear={() => onFile(null as any)} />

        {/* Format hint */}
        <details className="mt-4 group">
          <summary className="cursor-pointer list-none flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-slate-600 transition-colors select-none">
            <svg className="h-3.5 w-3.5 transition-transform group-open:rotate-90" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M9 18l6-6-6-6"/>
            </svg>
            Ver exemplo de formato aceito
          </summary>
          <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-4 animate-fade-in">
            <table className="text-xs text-slate-600 w-full">
              <thead>
                <tr className="text-slate-400 font-semibold border-b border-slate-200">
                  <td className="pb-2 pr-8">SKU</td>
                  <td className="pb-2 pr-8">Descrição</td>
                  <td className="pb-2 pr-8">Quantidade</td>
                  <td className="pb-2">Preço</td>
                </tr>
              </thead>
              <tbody>
                {[
                  ["CAM-001", "Câmera Full HD", "50", "R$ 299,90"],
                  ["MIC-002", "Microfone USB",  "30", "R$ 149,00"],
                  ["LED-003", "Lâmpada LED",    "200","R$ 18,50"],
                ].map(([sku, desc, qty, price]) => (
                  <tr key={sku}>
                    <td className="py-1 pr-8 font-mono">{sku}</td>
                    <td className="py-1 pr-8">{desc}</td>
                    <td className="py-1 pr-8">{qty}</td>
                    <td className="py-1 text-slate-400">{price}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      </div>
    </div>
  );
}
