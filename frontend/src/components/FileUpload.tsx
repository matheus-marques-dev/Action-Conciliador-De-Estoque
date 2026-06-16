import { FileSpreadsheet, UploadCloud, X } from "lucide-react";
import React, { useCallback, useRef, useState } from "react";

interface Props {
  onFileSelected: (file: File) => void;
  selectedFile: File | null;
  onClear: () => void;
}

const ACCEPTED = ".csv,.xlsx,.xls";

const EXT_COLOR: Record<string, string> = {
  csv:  "bg-emerald-100 text-emerald-700 border-emerald-200",
  xlsx: "bg-blue-100   text-blue-700   border-blue-200",
  xls:  "bg-blue-100   text-blue-700   border-blue-200",
};

function ext(name: string) {
  return name.split(".").pop()?.toLowerCase() ?? "";
}
function fmt(bytes: number) {
  return bytes < 1_048_576
    ? `${(bytes / 1024).toFixed(1)} KB`
    : `${(bytes / 1_048_576).toFixed(1)} MB`;
}

export default function FileUpload({ onFileSelected, selectedFile, onClear }: Props) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const f = e.dataTransfer.files[0];
      if (f) onFileSelected(f);
    },
    [onFileSelected]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) onFileSelected(f);
  };

  /* ── Selected state ── */
  if (selectedFile) {
    const fileExt = ext(selectedFile.name);
    const colorCls = EXT_COLOR[fileExt] ?? "bg-slate-100 text-slate-700 border-slate-200";

    return (
      <div className="animate-bounce-in flex items-center gap-4 rounded-2xl border-2 border-emerald-300 bg-gradient-to-r from-emerald-50 to-teal-50 p-5 shadow-sm">
        {/* Animated success SVG */}
        <div className="relative flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-emerald-500 shadow-lg">
          <svg viewBox="0 0 32 32" className="h-8 w-8" fill="none">
            <polyline
              points="6,17 13,24 26,10"
              stroke="white"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="check-draw"
            />
          </svg>
          {/* Glow ring */}
          <div className="absolute inset-0 rounded-2xl ring-4 ring-emerald-200 animate-ping opacity-30" />
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-slate-800">{selectedFile.name}</p>
          <div className="mt-1 flex items-center gap-2">
            <span className={`rounded-md border px-2 py-0.5 text-xs font-bold uppercase ${colorCls}`}>
              {fileExt}
            </span>
            <span className="text-xs text-slate-500">{fmt(selectedFile.size)}</span>
          </div>
          {/* Fake progress bar (visual feedback) */}
          <div className="mt-2 h-1 overflow-hidden rounded-full bg-emerald-100">
            <div className="h-full rounded-full bg-emerald-500 progress-fill" style={{ width: "100%" }} />
          </div>
        </div>

        <button
          onClick={onClear}
          className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl text-slate-400 transition-all hover:bg-white hover:text-red-500 hover:shadow-sm"
          title="Remover arquivo"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  /* ── Drop zone ── */
  return (
    <div
      className={`group relative flex cursor-pointer flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed p-12 text-center transition-all duration-300 ${
        dragging
          ? "drag-active bg-indigo-50/60"
          : "border-slate-300 bg-white hover:border-indigo-400 hover:bg-indigo-50/30"
      }`}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
    >
      {/* Background glow when dragging */}
      {dragging && (
        <div className="absolute inset-0 rounded-2xl bg-indigo-400/5 animate-fade-in" />
      )}

      {/* Icon */}
      <div className={`relative z-10 flex h-16 w-16 items-center justify-center rounded-2xl transition-all duration-300 ${
        dragging ? "bg-indigo-600 scale-110 shadow-lg shadow-indigo-200" : "bg-indigo-100 group-hover:bg-indigo-600 group-hover:scale-105 group-hover:shadow-lg group-hover:shadow-indigo-200"
      }`}>
        <UploadCloud className={`h-8 w-8 transition-colors duration-300 ${
          dragging ? "text-white icon-bounce" : "text-indigo-600 group-hover:text-white"
        }`} />
      </div>

      {/* Text */}
      <div className="relative z-10">
        <p className="text-base font-semibold text-slate-700">
          {dragging ? (
            <span className="text-indigo-600">Solte o arquivo aqui</span>
          ) : (
            <>
              Arraste o arquivo ou{" "}
              <span className="text-indigo-600 underline underline-offset-2 decoration-dashed">
                clique para selecionar
              </span>
            </>
          )}
        </p>
        <p className="mt-1 text-sm text-slate-400">CSV, XLSX ou XLS — sem limite de linhas</p>
      </div>

      {/* Format chips */}
      <div className="relative z-10 flex gap-2">
        {["CSV", "XLSX", "XLS"].map((f) => (
          <span
            key={f}
            className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-500 group-hover:border-indigo-200 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors"
          >
            {f}
          </span>
        ))}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED}
        className="hidden"
        onChange={handleChange}
      />
    </div>
  );
}
