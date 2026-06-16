import { CheckCircle, ChevronDown, ChevronUp, ShoppingBag } from "lucide-react";
import { useState } from "react";
import type { MarketplaceCredentials, MarketplaceOption, MarketplaceType } from "../types";

interface Props {
  options: MarketplaceOption[];
  selected: MarketplaceCredentials[];
  onChange: (configs: MarketplaceCredentials[]) => void;
}

const MARKETPLACE_ICONS: Record<string, string> = {
  mock: "🤖",
  mercado_livre: "🛒",
  shopee: "🛍️",
};

export default function MarketplaceConfig({ options, selected, onChange }: Props) {
  const [expanded, setExpanded] = useState<Set<MarketplaceType>>(new Set(["mock"]));

  const isSelected = (id: MarketplaceType) => selected.some((s) => s.marketplace === id);

  const getConfig = (id: MarketplaceType) =>
    selected.find((s) => s.marketplace === id) ?? { marketplace: id };

  const toggle = (opt: MarketplaceOption) => {
    if (isSelected(opt.id)) {
      onChange(selected.filter((s) => s.marketplace !== opt.id));
    } else {
      onChange([...selected, { marketplace: opt.id }]);
      if (opt.requires_credentials) {
        setExpanded((prev) => new Set([...prev, opt.id]));
      }
    }
  };

  const updateCreds = (id: MarketplaceType, field: string, value: string) => {
    onChange(
      selected.map((s) =>
        s.marketplace === id ? { ...s, [field]: value } : s
      )
    );
  };

  const toggleExpanded = (id: MarketplaceType) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  return (
    <div className="space-y-3">
      {options.map((opt) => {
        const active = isSelected(opt.id);
        const open = expanded.has(opt.id);
        const config = getConfig(opt.id);

        return (
          <div
            key={opt.id}
            className={`card overflow-hidden transition-all ${active ? "ring-2 ring-indigo-500" : ""}`}
          >
            {/* Header row */}
            <div className="flex items-center gap-3 p-4">
              <button
                onClick={() => toggle(opt)}
                className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                  active
                    ? "border-indigo-600 bg-indigo-600 text-white"
                    : "border-slate-300 bg-white"
                }`}
              >
                {active && <CheckCircle className="h-4 w-4" />}
              </button>

              <span className="text-xl">{MARKETPLACE_ICONS[opt.id] ?? "🏪"}</span>

              <div className="flex-1">
                <p className="font-semibold text-slate-800">{opt.name}</p>
                {!opt.requires_credentials && (
                  <p className="text-xs text-slate-500">Sem credenciais — ideal para testes</p>
                )}
              </div>

              {opt.requires_credentials && active && (
                <button
                  onClick={() => toggleExpanded(opt.id)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  {open ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                </button>
              )}
            </div>

            {/* Credentials form */}
            {active && opt.requires_credentials && open && (
              <div className="border-t border-slate-100 bg-slate-50 p-4">
                {opt.id === "mercado_livre" && (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <label className="label">Seller ID</label>
                      <input
                        className="input"
                        placeholder="Ex: 123456789"
                        value={(config as any).seller_id ?? ""}
                        onChange={(e) => updateCreds(opt.id, "seller_id", e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="label">Access Token</label>
                      <input
                        className="input"
                        type="password"
                        placeholder="APP_USR-..."
                        value={(config as any).access_token ?? ""}
                        onChange={(e) => updateCreds(opt.id, "access_token", e.target.value)}
                      />
                    </div>
                  </div>
                )}

                {opt.id === "shopee" && (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <label className="label">Partner ID</label>
                      <input
                        className="input"
                        placeholder="Ex: 123456"
                        value={(config as any).partner_id ?? ""}
                        onChange={(e) => updateCreds(opt.id, "partner_id", e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="label">Shop ID</label>
                      <input
                        className="input"
                        placeholder="Ex: 654321"
                        value={(config as any).shop_id ?? ""}
                        onChange={(e) => updateCreds(opt.id, "shop_id", e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="label">API Key (Secret)</label>
                      <input
                        className="input"
                        type="password"
                        placeholder="Sua chave secreta"
                        value={(config as any).api_key ?? ""}
                        onChange={(e) => updateCreds(opt.id, "api_key", e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="label">Access Token</label>
                      <input
                        className="input"
                        type="password"
                        placeholder="Token de acesso"
                        value={(config as any).access_token ?? ""}
                        onChange={(e) => updateCreds(opt.id, "access_token", e.target.value)}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
