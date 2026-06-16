from typing import Dict, List, Optional

from ..models.schemas import (
    DivergenceStatus,
    ERPItem,
    MarketplaceItem,
    MarketplaceSummary,
    ReconciliationItem,
)

_STATUS_PRIORITY = {
    DivergenceStatus.ZERO_STOCK: 0,
    DivergenceStatus.NOT_FOUND: 1,
    DivergenceStatus.LOW_STOCK: 2,
    DivergenceStatus.OVERSTOCK: 3,
    DivergenceStatus.OK: 4,
}


def _classify(erp_qty: float, mp_qty: int) -> DivergenceStatus:
    if mp_qty == 0 and erp_qty > 0:
        return DivergenceStatus.ZERO_STOCK
    diff = mp_qty - erp_qty
    if diff == 0:
        return DivergenceStatus.OK
    if diff < 0:
        return DivergenceStatus.LOW_STOCK
    return DivergenceStatus.OVERSTOCK


def _action(status: DivergenceStatus, erp_qty: float, mp_qty: Optional[int]) -> str:
    erp = int(erp_qty)
    if status == DivergenceStatus.OK:
        return "Nenhuma ação necessária"
    if status == DivergenceStatus.ZERO_STOCK:
        return f"CRÍTICO: Reativar anúncio e atualizar estoque para {erp}"
    if status == DivergenceStatus.LOW_STOCK:
        return f"Atualizar estoque de {mp_qty} → {erp} no marketplace"
    if status == DivergenceStatus.OVERSTOCK:
        return f"Reduzir estoque de {mp_qty} → {erp} no marketplace"
    if status == DivergenceStatus.NOT_FOUND:
        return f"Criar anúncio no marketplace com estoque {erp}"
    return "Revisar manualmente"


def compare(
    erp_items: List[ERPItem],
    mp_stocks: Dict[str, MarketplaceItem],
    marketplace_name: str,
) -> List[ReconciliationItem]:
    rows: List[ReconciliationItem] = []

    for item in erp_items:
        mp = mp_stocks.get(item.sku)

        if mp is None:
            status = DivergenceStatus.NOT_FOUND
            rows.append(
                ReconciliationItem(
                    sku=item.sku,
                    description=item.description,
                    erp_qty=item.erp_qty,
                    marketplace_qty=None,
                    divergence=None,
                    status=status,
                    marketplace=marketplace_name,
                    listing_id=None,
                    suggested_action=_action(status, item.erp_qty, None),
                )
            )
        else:
            status = _classify(item.erp_qty, mp.marketplace_qty)
            divergence = mp.marketplace_qty - item.erp_qty
            rows.append(
                ReconciliationItem(
                    sku=item.sku,
                    description=item.description,
                    erp_qty=item.erp_qty,
                    marketplace_qty=mp.marketplace_qty,
                    divergence=divergence,
                    status=status,
                    marketplace=marketplace_name,
                    listing_id=mp.listing_id,
                    suggested_action=_action(status, item.erp_qty, mp.marketplace_qty),
                )
            )

    rows.sort(key=lambda r: (_STATUS_PRIORITY[r.status], -abs(r.divergence or 0)))
    return rows


def build_summary(marketplace_name: str, items: List[ReconciliationItem]) -> MarketplaceSummary:
    mp_items = [i for i in items if i.marketplace == marketplace_name]
    return MarketplaceSummary(
        name=marketplace_name,
        total_found=sum(1 for i in mp_items if i.status != DivergenceStatus.NOT_FOUND),
        ok=sum(1 for i in mp_items if i.status == DivergenceStatus.OK),
        divergences=sum(1 for i in mp_items if i.status not in (DivergenceStatus.OK, DivergenceStatus.NOT_FOUND)),
        critical=sum(1 for i in mp_items if i.status == DivergenceStatus.ZERO_STOCK),
        not_found=sum(1 for i in mp_items if i.status == DivergenceStatus.NOT_FOUND),
    )
