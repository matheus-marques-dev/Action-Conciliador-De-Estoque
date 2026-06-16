import { useEffect, useState } from "react";
import Logo from "./Logo";

const STEPS = [
  "Processando arquivo ERP…",
  "Consultando marketplace(s)…",
  "Cruzando dados de estoque…",
  "Gerando relatório Excel…",
];

interface Props {
  currentStep: number; // 1-4, 0 = hidden
  skuCount?: number;
}

export default function LoadingOverlay({ currentStep, skuCount }: Props) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (currentStep > 0) setVisible(true);
    else {
      const t = setTimeout(() => setVisible(false), 400);
      return () => clearTimeout(t);
    }
  }, [currentStep]);

  if (!visible) return null;

  const progress = Math.min(((currentStep - 1) / (STEPS.length - 1)) * 100, 100);

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center transition-all duration-400 ${
        currentStep > 0 ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
    >
      {/* Blurred backdrop */}
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" />

      {/* Card */}
      <div className="relative z-10 w-full max-w-sm animate-bounce-in rounded-3xl bg-white p-8 shadow-2xl">
        {/* Logo with spinning ring */}
        <div className="relative mx-auto mb-6 flex h-20 w-20 items-center justify-center">
          <svg
            className="ring-spin absolute inset-0 h-full w-full"
            viewBox="0 0 100 100"
            fill="none"
          >
            <defs>
              <linearGradient id="ring-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#6366f1" />
                <stop offset="100%" stopColor="#818cf8" />
              </linearGradient>
            </defs>
            {/* Track */}
            <circle cx="50" cy="50" r="44" stroke="#e0e7ff" strokeWidth="6" />
            {/* Arc */}
            <circle
              cx="50" cy="50" r="44"
              stroke="url(#ring-grad)"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray="207 69"
            />
          </svg>
          <Logo size={48} id="loading" />
        </div>

        {/* Title */}
        <div className="mb-1 text-center text-xl font-extrabold tracking-tight text-slate-900">
          Action
        </div>
        {skuCount !== undefined && skuCount > 0 && (
          <p className="mb-5 text-center text-sm text-slate-500">
            Analisando <span className="font-semibold text-indigo-600">{skuCount} SKUs</span>
          </p>
        )}

        {/* Progress bar */}
        <div className="mb-5 h-1.5 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-700 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Steps list */}
        <ol className="space-y-3">
          {STEPS.map((label, idx) => {
            const stepNum = idx + 1;
            const done    = currentStep > stepNum;
            const active  = currentStep === stepNum;
            const pending = currentStep < stepNum;

            return (
              <li key={idx} className="flex items-center gap-3">
                {/* Indicator */}
                <span
                  className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full transition-all duration-300 ${
                    done    ? "bg-emerald-500"   :
                    active  ? "bg-indigo-600"    :
                              "bg-slate-100"
                  }`}
                >
                  {done ? (
                    <svg viewBox="0 0 12 12" className="h-3 w-3">
                      <polyline
                        points="2,6 5,9 10,3"
                        fill="none"
                        stroke="white"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="check-draw"
                      />
                    </svg>
                  ) : active ? (
                    <span className="h-2 w-2 animate-ping rounded-full bg-white" />
                  ) : (
                    <span className="h-2 w-2 rounded-full bg-slate-300" />
                  )}
                </span>

                {/* Label */}
                <span
                  className={`text-sm transition-colors duration-300 ${
                    done    ? "text-emerald-600 line-through decoration-1" :
                    active  ? "font-semibold text-slate-800"               :
                              "text-slate-400"
                  }`}
                >
                  {label}
                </span>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
