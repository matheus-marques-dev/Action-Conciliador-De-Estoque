from abc import ABC, abstractmethod
from typing import Dict, List

from ...models.schemas import MarketplaceCredentials, MarketplaceItem


class MarketplaceAdapter(ABC):
    def __init__(self, credentials: MarketplaceCredentials):
        self.credentials = credentials

    @abstractmethod
    async def get_stock(self, skus: List[str]) -> Dict[str, MarketplaceItem]:
        """Fetch stock for the given SKUs. Returns {sku: MarketplaceItem}."""

    @property
    @abstractmethod
    def name(self) -> str:
        pass
