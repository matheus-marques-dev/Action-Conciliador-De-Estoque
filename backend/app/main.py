from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .routers.reconciliation import router

app = FastAPI(
    title="Conciliador de Estoque ERP × Marketplace",
    version="1.0.0",
    description="Compara estoques do ERP com marketplaces e gera relatório de divergências.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)


@app.get("/health")
async def health():
    return {"status": "ok"}
