export type DivergenceStatus =
  | "OK"
  | "ZERO_STOCK"
  | "LOW_STOCK"
  | "OVERSTOCK"
  | "NOT_FOUND";

export type MarketplaceType = "mock" | "mercado_livre" | "shopee";

export interface MarketplaceCredentials {
  marketplace: MarketplaceType;
  access_token?: string;
  seller_id?: string;
  api_key?: string;
  partner_id?: string;
  shop_id?: string;
}

export interface ReconciliationItem {
  sku: string;
  description: string;
  erp_qty: number;
  marketplace_qty: number | null;
  divergence: number | null;
  status: DivergenceStatus;
  marketplace: string;
  listing_id: string | null;
  suggested_action: string;
}

export interface MarketplaceSummary {
  name: string;
  total_found: number;
  ok: number;
  divergences: number;
  critical: number;
  not_found: number;
}

export interface ReconciliationResult {
  report_id: string;
  total_erp_skus: number;
  marketplaces: MarketplaceSummary[];
  items: ReconciliationItem[];
  warnings: string[];
}

export interface MarketplaceOption {
  id: MarketplaceType;
  name: string;
  requires_credentials: boolean;
}
