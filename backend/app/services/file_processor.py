import io
from typing import List, Optional, Tuple

import pandas as pd

from ..models.schemas import ERPItem

COLUMN_ALIASES = {
    "sku": ["sku", "código", "codigo", "cod", "referencia", "reference", "ref", "product_code", "codigoproduto", "ean", "gtin"],
    "description": ["descrição", "descricao", "description", "nome", "name", "produto", "product", "nomeproduto"],
    "qty": ["quantidade", "qty", "qtd", "estoque", "stock", "saldo", "disponivel", "available", "qtdestoque", "saldoestoque"],
    "price": ["preço", "preco", "price", "valor", "custo", "cost", "vlr", "valorunitario", "precounitario"],
}


def _find_column(columns: List[str], aliases: List[str]) -> Optional[str]:
    normalized = {c.lower().strip().replace(" ", "").replace("_", ""): c for c in columns}
    for alias in aliases:
        key = alias.lower().replace(" ", "").replace("_", "")
        if key in normalized:
            return normalized[key]
    return None


def process_erp_file(file_content: bytes, filename: str) -> Tuple[List[ERPItem], List[str]]:
    warnings: List[str] = []
    df: pd.DataFrame

    lower_name = filename.lower()
    if lower_name.endswith(".csv"):
        for encoding in ("utf-8-sig", "utf-8", "latin-1", "cp1252"):
            try:
                df = pd.read_csv(io.BytesIO(file_content), encoding=encoding, sep=None, engine="python", dtype=str)
                break
            except Exception:
                continue
        else:
            raise ValueError("Não foi possível decodificar o CSV. Tente salvar como UTF-8.")
    elif lower_name.endswith((".xlsx", ".xls")):
        df = pd.read_excel(io.BytesIO(file_content), dtype=str)
    else:
        raise ValueError("Formato não suportado. Envie um arquivo CSV ou Excel (.xlsx/.xls).")

    df.columns = df.columns.str.strip()
    cols = df.columns.tolist()

    sku_col = _find_column(cols, COLUMN_ALIASES["sku"])
    desc_col = _find_column(cols, COLUMN_ALIASES["description"])
    qty_col = _find_column(cols, COLUMN_ALIASES["qty"])
    price_col = _find_column(cols, COLUMN_ALIASES["price"])

    if not sku_col:
        raise ValueError(
            f"Coluna de SKU não encontrada. Esperado um dos nomes: {', '.join(COLUMN_ALIASES['sku'])}. "
            f"Colunas encontradas: {', '.join(cols)}"
        )
    if not qty_col:
        raise ValueError(
            f"Coluna de quantidade não encontrada. Esperado: {', '.join(COLUMN_ALIASES['qty'])}. "
            f"Colunas encontradas: {', '.join(cols)}"
        )
    if not desc_col:
        warnings.append("Coluna de descrição não encontrada — usando SKU como descrição.")
    if not price_col:
        warnings.append("Coluna de preço não encontrada — preço ignorado.")

    items: List[ERPItem] = []
    seen_skus: set = set()

    for _, row in df.iterrows():
        raw_sku = str(row[sku_col]).strip()
        if not raw_sku or raw_sku.lower() == "nan":
            continue

        if raw_sku in seen_skus:
            warnings.append(f"SKU duplicado ignorado: {raw_sku}")
            continue
        seen_skus.add(raw_sku)

        raw_qty = str(row[qty_col]).strip().replace(",", ".")
        try:
            qty = float(raw_qty)
        except ValueError:
            warnings.append(f"Quantidade inválida para SKU {raw_sku} ('{raw_qty}') — usando 0.")
            qty = 0.0

        price: Optional[float] = None
        if price_col:
            raw_price = str(row[price_col]).strip().replace(",", ".").replace("R$", "").strip()
            try:
                price = float(raw_price)
            except ValueError:
                pass

        items.append(
            ERPItem(
                sku=raw_sku,
                description=str(row[desc_col]).strip() if desc_col else raw_sku,
                erp_qty=qty,
                price=price,
            )
        )

    if not items:
        raise ValueError("Nenhum item válido encontrado no arquivo.")

    return items, warnings
