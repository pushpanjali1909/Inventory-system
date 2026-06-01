# 📦 Inventory & Order Management System

A full-stack web application for managing products, customers, orders, and inventory tracking.

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Backend** | Python + FastAPI |
| **Frontend** | React + Vite + Tailwind CSS |
| **Database** | PostgreSQL |
| **ORM** | SQLAlchemy |
| **Container** | Docker + Docker Compose |

## Features

- ✅ **Products** — CRUD with unique SKU enforcement
- ✅ **Customers** — CRUD with unique email enforcement
- ✅ **Orders** — Create orders with automatic stock deduction; cancellation restores stock
- ✅ **Inventory Tracking** — Full audit log of all stock movements
- ✅ **Business Rules** — Prevents orders when stock is insufficient
- ✅ **Low Stock Alerts** — Dashboard highlights items below threshold
- ✅ **Responsive UI** — Works on desktop and mobile

## Project Structure

```
inventory-system/
├── backend/
│   ├── app/
│   │   ├── core/          # Config, DB connection
│   │   ├── models/        # SQLAlchemy models
│   │   ├── routers/       # API route handlers
│   │   ├── schemas/       # Pydantic schemas
│   │   └── main.py        # FastAPI app entry
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── api/           # Axios API client
│   │   ├── pages/         # React pages
│   │   └── components/    # Layout components
│   ├── Dockerfile
│   └── package.json
├── docker-compose.yml
└── .env.example
```

## Quick Start

### 1. Clone & Setup Environment
```bash
git clone <your-repo-url>
cd inventory-system
cp .env.example .env
# Edit .env with your credentials
```

### 2. Run with Docker Compose
```bash
docker-compose up --build
```

### 3. Access the App
| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8000 |
| API Docs (Swagger) | http://localhost:8000/docs |
| API Docs (ReDoc) | http://localhost:8000/redoc |

## API Endpoints

### Products
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/products/` | List all products |
| POST | `/api/products/` | Create product (unique SKU enforced) |
| GET | `/api/products/{id}` | Get product |
| PUT | `/api/products/{id}` | Update product |
| DELETE | `/api/products/{id}` | Delete product |
| POST | `/api/products/{id}/restock` | Add stock |

### Customers
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/customers/` | List all customers |
| POST | `/api/customers/` | Create customer (unique email enforced) |
| GET | `/api/customers/{id}` | Get customer |
| PUT | `/api/customers/{id}` | Update customer |
| DELETE | `/api/customers/{id}` | Delete customer |

### Orders
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/orders/` | List orders (filterable by status) |
| POST | `/api/orders/` | Create order (validates + deducts stock) |
| GET | `/api/orders/{id}` | Get order with items |
| PUT | `/api/orders/{id}` | Update order status |
| DELETE | `/api/orders/{id}` | Delete order |
| GET | `/api/orders/stats/summary` | Order statistics |

### Inventory
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/inventory/logs` | Full audit log |
| POST | `/api/inventory/adjust/{id}` | Manual stock adjustment |
| GET | `/api/inventory/summary` | Inventory overview |

## Business Rules Implemented

1. **Unique SKUs** — Cannot create two products with the same SKU
2. **Unique Customer Emails** — Duplicate emails are rejected
3. **Inventory Validation** — Orders fail if insufficient stock
4. **Automatic Stock Reduction** — Confirmed orders deduct from inventory
5. **Stock Restoration on Cancel** — Cancelling an order returns stock
6. **Low Stock Alerts** — Dashboard highlights items below threshold
7. **Out-of-Stock Prevention** — Cannot order products with 0 stock

## Local Development (without Docker)

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
# Set DATABASE_URL in .env pointing to local Postgres
uvicorn app.main:app --reload
```

### Frontend
```bash
cd frontend
npm install
# Set VITE_API_URL=http://localhost:8000 in .env
npm run dev
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `POSTGRES_USER` | DB username | postgres |
| `POSTGRES_PASSWORD` | DB password | postgres |
| `POSTGRES_DB` | DB name | inventory_db |
| `SECRET_KEY` | JWT secret (backend) | — |
| `VITE_API_URL` | Backend URL (frontend) | '' (proxy) |
