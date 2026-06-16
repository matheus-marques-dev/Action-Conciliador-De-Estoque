import asyncio
import json
from typing import Dict, List

from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from fastapi.responses import Response

from ..models.schemas import (
    MarketplaceCredentials,
    MarketplaceType,
    ReconciliationResult,
)
from ..services.comparator import build_summary, compare
from ..services.file_processor import process_erp_file
from ..services.marketplaces.mercado_livre import MercadoLivreAdapter
from ..services.marketplaces.mock import MockMarketplaceAdapter
from ..services.marketplaces.shopee import ShopeeAdapter
from ..services.report_generator import generate_report

router = APIRouter(prefix="/api", tags=["reconciliation"])

# In-memory store: report_id → Excel bytes
_report_store: Dict[str, bytes] = {}

_ADAPTER_MAP = {
    MarketplaceType.MOCK: MockMarketplaceAdapter,
    MarketplaceType.MERCADO_LIVRE: MercadoLivreAdapter,
    MarketplaceType.SHOPEE: ShopeeAdapter,
}


@router.get("/marketplaces")
async def list_marketplaces():
    return [
        {"id": "mock",          "name": "Mock (Demonstração)", "requires_credentials": False},
        {"id": "mercado_livre", "name": "Mercado Livre",       "requires_credentials": True},
        {"id": "shopee",        "name": "Shopee",               "requires_credentials": True},
    ]


@router.post("/reconcile", response_model=ReconciliationResult)
async def reconcile(
    file: UploadFile = File(...),
    marketplaces: str = Form(...),
):
    # Parse marketplace configs
    try:
        mp_configs_raw = json.loads(marketplaces)
        mp_configs: List[MarketplaceCredentials] = [
            MarketplaceCredentials(**cfg) for cfg in mp_configs_raw
        ]
    except Exception as exc:
        raise HTTPException(status_code=422, detail=f"Configuração de marketplace inválida: {exc}")

    if not mp_configs:
        raise HTTPException(status_code=422, detail="Selecione ao menos um marketplace.")

    # Process uploaded ERP file
    file_content = await file.read()
    try:
        erp_items, warnings = process_erp_file(file_content, file.filename or "upload")
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    skus = [item.sku for item in erp_items]

    # Fetch stocks from all selected marketplaces concurrently
    async def fetch(creds: MarketplaceCredentials):
        adapter_cls = _ADAPTER_MAP.get(creds.marketplace)
        if not adapter_cls:
            return {}
        adapter = adapter_cls(creds)
        try:
            return adapter.name, await adapter.get_stock(skus)
        except Exception as exc:
            warnings.append(f"Erro ao consultar {creds.marketplace}: {exc}")
            return adapter.name, {}

    fetch_results = await asyncio.gather(*[fetch(cfg) for cfg in mp_configs])

    # Compare and collect results
    all_items = []
    summaries = []

    for mp_name, mp_stocks in fetch_results:
        items = compare(erp_items, mp_stocks, mp_name)
        all_items.extend(items)
        summaries.append(build_summary(mp_name, items))

    # Generate Excel report
    report_id, report_bytes = generate_report(all_items)
    _report_store[report_id] = report_bytes

    return ReconciliationResult(
        report_id=report_id,
        total_erp_skus=len(erp_items),
        marketplaces=summaries,
        items=all_items,
        warnings=warnings,
    )


@router.get("/report/{report_id}")
async def download_report(report_id: str):
    data = _report_store.get(report_id.upper())
    if not data:
        raise HTTPException(status_code=404, detail="Relatório não encontrado ou expirado.")
    return Response(
        content=data,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f'attachment; filename="conciliacao_{report_id}.xlsx"'},
    )
