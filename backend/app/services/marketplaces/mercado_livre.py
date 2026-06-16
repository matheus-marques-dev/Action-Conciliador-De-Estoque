import asyncio
from typing import Dict, List

import httpx

from ...models.schemas import MarketplaceCredentials, MarketplaceItem
from .base import MarketplaceAdapter

ML_API = "https://api.mercadolibre.com"
BATCH_SIZE = 20  # ML allows up to 20 IDs per items batch request


class MercadoLivreAdapter(MarketplaceAdapter):
    @property
    def name(self) -> str:
        return "Mercado Livre"

    def _headers(self) -> Dict[str, str]:
        return {"Authorization": f"Bearer {self.credentials.access_token}"}

    async def get_stock(self, skus: List[str]) -> Dict[str, MarketplaceItem]:
        result: Dict[str, MarketplaceItem] = {}
        seller_id = self.credentials.seller_id

        async with httpx.AsyncClient(timeout=30.0) as client:
            # Search each SKU for its listing IDs
            sku_to_ids: Dict[str, List[str]] = {}
            for sku in skus:
                try:
                    resp = await client.get(
                        f"{ML_API}/users/{seller_id}/items/search",
                        params={"seller_sku": sku},
                        headers=self._headers(),
                    )
                    resp.raise_for_status()
                    ids = resp.json().get("results", [])
                    if ids:
                        sku_to_ids[sku] = ids
                except httpx.HTTPStatusError:
                    continue

            # Collect all unique listing IDs
            all_ids = list({lid for ids in sku_to_ids.values() for lid in ids})

            # Batch-fetch item details
            id_to_item: Dict[str, dict] = {}
            for i in range(0, len(all_ids), BATCH_SIZE):
                batch = all_ids[i : i + BATCH_SIZE]
                try:
                    resp = await client.get(
                        f"{ML_API}/items",
                        params={"ids": ",".join(batch)},
                        headers=self._headers(),
                    )
                    resp.raise_for_status()
                    for entry in resp.json():
                        body = entry.get("body", {})
                        id_to_item[body.get("id", "")] = body
                except httpx.HTTPStatusError:
                    continue

            # Aggregate stock per SKU across active listings
            for sku, ids in sku_to_ids.items():
                total_qty = 0
                listing_ids: List[str] = []
                for lid in ids:
                    item = id_to_item.get(lid, {})
                    if item.get("status") == "active":
                        total_qty += item.get("available_quantity", 0)
                        listing_ids.append(lid)

                result[sku] = MarketplaceItem(
                    sku=sku,
                    marketplace_qty=total_qty,
                    listing_id=",".join(listing_ids) if listing_ids else None,
                    marketplace_name=self.name,
                )

        return result
