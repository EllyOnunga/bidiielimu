# Scholara — Enterprise School Management SaaS

> A world-class, AI-powered, multi-tenant School Information System built for East & West Africa.

---

## 🏗 Architecture

```
Client (React PWA / React Native)
        ↓  HTTPS / WSS
  Nginx (Reverse Proxy + SSL)
        ↓  Tenant subdomain routing
  Django REST Framework (Daphne ASGI)
        ↓  django-tenants middleware
  PostgreSQL 16 (Schema-per-Tenant)
        ↑  Async tasks       ↑ Cache
  Celery Workers           Redis 7
```

## 📦 Stack

| Layer | Technology |
|---|---|
| Backend | Django 6, DRF, Daphne (ASGI) |
| Real-time | Django Channels, Redis |
| Database | PostgreSQL 16 (per-tenant schemas) |
| Task Queue | Celery + Redis |
| Frontend | Vite, React 19, Tailwind CSS v4 |
| Mobile | React Native (Expo) |
| DevOps | Docker, GitHub Actions, Nginx |
| Payments | M-Pesa Daraja, Stripe |
| SMS | Africa's Talking |
| AI | scikit-learn, pandas |

---

## 🚀 Quick Start

### Prerequisites
- Docker Desktop 24+
- `make` (or run commands manually)

### 1. Clone & Configure
```bash
git clone https://github.com/your-org/scholara.git
cd scholara
cp .env.example .env
# Edit .env with your credentials
```

### 2. Development (with live reload)
```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up
```
- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:8000/api/v1/
- **API Docs:** http://localhost:8000/api/v1/docs/

### 3. Production
```bash
make build   # Build all images
make up      # Start all services
make migrate # Run DB migrations
make superuser # Create admin account
```

---

## 🔑 Useful Commands

```bash
make help           # Full command reference
make logs           # Tail all logs
make shell-backend  # Django shell
make shell-db       # psql session
make test           # Run test suite
make clean          # Full teardown
```

---

## 🔒 Security

- **Cross-Tenant Isolation:** `TenantAccessMiddleware` hard-blocks users from accessing other schools' subdomains.
- **RBAC:** 7 roles — Super Admin, Admin, Principal, HOD, Teacher, Parent, Student.
- **Data Privacy:** QuerySet-level isolation ensures Parents only see their own children's records.
- **JWT:** Stateless authentication with refresh token rotation.
- **SSL:** Auto-renewed via Certbot/Let's Encrypt.

---

## 🌍 Multi-Tenancy

Each school gets its own PostgreSQL schema:

```
public (shared)        → scholara.app
pg_school_greenwood    → greenwood.scholara.app
pg_school_stmarys      → stmarys.scholara.app
```

To onboard a new school:
```bash
docker compose exec backend python manage.py create_tenant \
  --schema_name=greenwood \
  --name="Greenwood Academy" \
  --domain=greenwood.scholara.app
```

---

## 📋 Modules

| Module | Features |
|---|---|
| SIS | Admissions, CBC support, Guardians |
| Exams | CATs, End-of-term, Bulk mark entry, Rankings |
| Attendance | Daily marking, SMS alerts |
| Finance | Fee structures, M-Pesa STK Push, Ledger |
| HR | Staff directory, Payroll, Leave, P9 |
| Inventory | Stock tracking, Low-stock alerts |
| Analytics | AI grade prediction, Performance trends |
| Communication | Bulk SMS, Notice board, WebSocket notifications |
| Parent Portal | PWA, Offline support, Real-time updates |

---

## 📄 License

Proprietary — All Rights Reserved © Scholara 2024
