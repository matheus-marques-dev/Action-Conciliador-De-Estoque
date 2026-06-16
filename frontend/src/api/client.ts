import axios from "axios";
import type { MarketplaceCredentials, MarketplaceOption, ReconciliationResult } from "../types";

const http = axios.create({ baseURL: "/api" });

export async function fetchMarketplaces(): Promise<MarketplaceOption[]> {
  const { data } = await http.get("/marketplaces");
  return data;
}

export async function reconcile(
  file: File,
  marketplaces: MarketplaceCredentials[]
): Promise<ReconciliationResult> {
  const form = new FormData();
  form.append("file", file);
  form.append("marketplaces", JSON.stringify(marketplaces));
  const { data } = await http.post<ReconciliationResult>("/reconcile", form);
  return data;
}

export function reportDownloadUrl(reportId: string): string {
  return `/api/report/${reportId}`;
}
