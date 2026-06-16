# Action — Conciliador de Estoque ERP × Marketplace

Aplicação fullstack para conciliar estoques do ERP com marketplaces em tempo real. Detecta divergências, gera relatórios e sugere ações corretivas.

---

## Funcionalidades

- Upload de planilha ERP (CSV ou Excel) com detecção automática de colunas
- Conexão com múltiplos marketplaces simultâneos
- Classificação de divergências: OK, Estoque Baixo, Estoque Zero, Excesso, Não Encontrado
- Relatório Excel com 3 abas: Resumo, Divergências e Comparação Completa
- Adapter Mock para testes sem credenciais reais

## Stack

| Camada | Tecnologia |
|---|---|
| Backend | FastAPI · Python 3.10 · pandas · openpyxl · httpx |
| Frontend | React 18 · TypeScript · Vite · Tailwind CSS |
| Marketplaces | Mercado Livre (OAuth2) · Shopee (HMAC-SHA256) · Mock |

---

## Como rodar

### Pré-requisitos

- Python 3.10+
- Node.js 18+

### Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate        # Windows
pip install -r requirements.txt
cp .env.example .env          # configure suas credenciais
python run.py
```

Roda em `http://localhost:8000`

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Roda em `http://localhost:5173`

---

## Variáveis de ambiente

Copie `backend/.env.example` para `backend/.env` e preencha:

```env
# Mercado Livre
ML_CLIENT_ID=
ML_CLIENT_SECRET=
ML_SELLER_ID=

# Shopee
SHOPEE_PARTNER_ID=
SHOPEE_PARTNER_KEY=
SHOPEE_SHOP_ID=
```

Para testar sem credenciais, selecione o marketplace **Mock** na interface.

---

## Formato do arquivo ERP

O sistema detecta automaticamente as colunas. Colunas aceitas:

| Campo | Variações aceitas |
|---|---|
| SKU | `sku`, `código`, `codigo`, `ref`, `referencia` |
| Descrição | `descrição`, `descricao`, `produto`, `nome` |
| Quantidade | `quantidade`, `qtd`, `estoque`, `qty`, `stock` |
| Preço | `preço`, `preco`, `price`, `valor` |

Formatos suportados: `.csv`, `.xlsx`, `.xls`

---

## Endpoints da API

| Método | Rota | Descrição |
|---|---|---|
| `POST` | `/api/reconcile` | Envia arquivo ERP + marketplaces, retorna relatório |
| `GET` | `/api/report/{id}` | Baixa o relatório Excel gerado |
| `GET` | `/api/marketplaces` | Lista marketplaces disponíveis |

---

## Estrutura do projeto

```
controlador-estoque/
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── models/schemas.py
│   │   ├── routers/reconciliation.py
│   │   └── services/
│   │       ├── file_processor.py
│   │       ├── comparator.py
│   │       ├── report_generator.py
│   │       └── marketplaces/
│   │           ├── mock.py
│   │           ├── mercado_livre.py
│   │           └── shopee.py
│   ├── requirements.txt
│   └── run.py
└── frontend/
    ├── src/
    │   ├── App.tsx
    │   ├── components/
    │   └── api/client.ts
    ├── public/favicon.svg
    └── vite.config.ts
```
