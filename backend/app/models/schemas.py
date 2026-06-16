from pydantic import BaseModel
from typing import Optional, List
from enum import Enum


class MarketplaceType(str, Enum):
    MERCADO_LIVRE = "mercado_livre"
    SHOPEE = "shopee"
    MOCK = "mock"


class DivergenceStatus(str, Enum):
    OK = "OK"
    ZERO_STOCK = "ZERO_STOCK"
    LOW_STOCK = "LOW_STOCK"
    OVERSTOCK = "OVERSTOCK"
    NOT_FOUND = "NOT_FOUND"


class MarketplaceCredentials(BaseModel):
    marketplace: MarketplaceType
    access_token: Optional[str] = None
    seller_id: Optional[str] = None
    api_key: Optional[str] = None
    partner_id: Optional[str] = None
    shop_id: Optional[str] = None


class ERPItem(BaseModel):
    sku: str
    description: str
    erp_qty: float
    price: Optional[float] = None


class MarketplaceItem(BaseModel):
    sku: str
    marketplace_qty: int
    listing_id: Optional[str] = None
    marketplace_name: str


class ReconciliationItem(BaseModel):
    sku: str
    description: str
    erp_qty: float
    marketplace_qty: Optional[int] = None
    divergence: Optional[float] = None
    status: DivergenceStatus
    marketplace: str
    listing_id: Optional[str] = None
    suggested_action: str


class MarketplaceSummary(BaseModel):
    name: str
    total_found: int
    ok: int
    divergences: int
    critical: int
    not_found: int


class ReconciliationResult(BaseModel):
    report_id: str
    total_erp_skus: int
    marketplaces: List[MarketplaceSummary]
    items: List[ReconciliationItem]
    warnings: List[str] = []


class ErrorResponse(BaseModel):
    detail: str
