import hashlib
import random
from typing import Dict, List

from ...models.schemas import MarketplaceCredentials, MarketplaceItem
from .base import MarketplaceAdapter


class MockMarketplaceAdapter(MarketplaceAdapter):
    """Simulates a marketplace API for demo/testing without real credentials."""

    def __init__(self, credentials: MarketplaceCredentials):
        super().__init__(credentials)
        # Scenario weights: (status, qty_factor)
        self._scenarios = [
            ("ok", 1.0),        # 25% — stock matches ERP
            ("low", 0.4),       # 20% — marketplace below ERP
            ("zero", 0.0),      # 15% — marketplace zeroed (critical)
            ("over", 1.8),      # 15% — marketplace above ERP
            ("ok2", 1.0),       # 10% — another ok match
            ("low2", 0.7),      # 10% — mild low stock
        ]
        # 15% of SKUs won't be found (NOT_FOUND)
        self._not_found_rate = 0.15

    @property
    def name(self) -> str:
        return "Mock Marketplace"

    async def get_stock(self, skus: List[str]) -> Dict[str, MarketplaceItem]:
        result: Dict[str, MarketplaceItem] = {}

        for sku in skus:
            # Deterministic seed so repeated calls return identical results
            seed = int(hashlib.md5(sku.encode()).hexdigest()[:8], 16)
            rng = random.Random(seed)

            if rng.random() < self._not_found_rate:
                continue  # SKU not listed in this marketplace

            scenario_label, factor = rng.choice(self._scenarios)
            base_qty = rng.randint(1, 200)

            if factor == 0.0:
                qty = 0
            else:
                qty = max(0, int(base_qty * factor))

            result[sku] = MarketplaceItem(
                sku=sku,
                marketplace_qty=qty,
                listing_id=f"MOCK-{sku[:6].upper()}-{seed % 10000:04d}",
                marketplace_name=self.name,
            )

        return result
