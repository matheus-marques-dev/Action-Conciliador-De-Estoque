import hashlib
import hmac
import time
from typing import Dict, List

import httpx

from ...models.schemas import MarketplaceCredentials, MarketplaceItem
from .base import MarketplaceAdapter

SHOPEE_API = "https://partner.shopeemobile.com/api/v2"


class ShopeeAdapter(MarketplaceAdapter):
    @property
    def name(self) -> str:
        return "Shopee"

    def _sign(self, path: str, timestamp: int) -> str:
        base = (
            f"{self.credentials.partner_id}{path}{timestamp}"
            f"{self.credentials.access_token}{self.credentials.shop_id}"
        )
        return hmac.new(
            self.credentials.api_key.encode(),
            base.encode(),
            hashlib.sha256,
        ).hexdigest()

    def _common_params(self, path: str) -> dict:
        ts = int(time.time())
        return {
            "partner_id": int(self.credentials.partner_id),
            "shop_id": int(self.credentials.shop_id),
            "access_token": self.credentials.access_token,
            "timestamp": ts,
            "sign": self._sign(path, ts),
        }

    async def get_stock(self, skus: List[str]) -> Dict[str, MarketplaceItem]:
        result: Dict[str, MarketplaceItem] = {}
        sku_set = set(skus)

        async with httpx.AsyncClient(timeout=30.0) as client:
            # Step 1: Page through item list to find IDs
            item_ids: List[int] = []
            offset = 0
            page_size = 100

            while True:
                path = "/item/list"
                params = {**self._common_params(path), "offset": offset, "page_size": page_size, "item_status": "NORMAL"}
                try:
                    resp = await client.get(f"{SHOPEE_API}{path}", params=params)
                    resp.raise_for_status()
                    data = resp.json().get("response", {})
                    for item in data.get("item", []):
                        item_ids.append(item["item_id"])
                    if not data.get("has_next_page", False):
                        break
                    offset += page_size
                except Exception:
                    break

            # Step 2: Batch-fetch item details (max 50 per request)
            for i in range(0, len(item_ids), 50):
                batch = item_ids[i : i + 50]
                path = "/item/get"
                params = {
                    **self._common_params(path),
                    "item_id_list": ",".join(map(str, batch)),
                }
                try:
                    resp = await client.get(f"{SHOPEE_API}{path}", params=params)
                    resp.raise_for_status()
                    for item in resp.json().get("response", {}).get("item_list", []):
                        for model in item.get("model", []):
                            sku = model.get("model_sku", "")
                            if sku not in sku_set:
                                continue
                            stock_info = model.get("stock_info_v2", {})
                            qty = stock_info.get("total_available_stock", 0)
                            if sku in result:
                                result[sku].marketplace_qty += qty
                            else:
                                result[sku] = MarketplaceItem(
                                    sku=sku,
                                    marketplace_qty=qty,
                                    listing_id=str(item.get("item_id", "")),
                                    marketplace_name=self.name,
                                )
                except Exception:
                    continue

        return result
