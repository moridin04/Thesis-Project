# CODEBASE_AUDIT.md — AGOS / Thesis-Project

> **Read-only discovery report.** Generated from repository inspection.  
> Does not modify application behavior. Ambiguous items marked *needs verification*.

---

## 1. PROJECT STRUCTURE OVERVIEW

### 1.1 Top-level tree (2–3 levels)

```
Thesis-Project/
├── backend/                 FastAPI API (AGOS auth, uploads, public mock data)
│   ├── app/
│   │   ├── dependencies/    Auth dependency gates
│   │   ├── models/          SQLAlchemy ORM
│   │   ├── routers/         HTTP route modules
│   │   ├── schemas/         Pydantic I/O models
│   │   └── services/        Auth, uploads, audit, public_data
│   ├── scripts/             create_admin.py
│   ├── tests/               pytest
│   ├── uploads/             Created at runtime for dataset files
│   ├── .env / .env.example
│   └── requirements.txt
├── frontend/                React + Vite AGOS UI
│   ├── public/              Favicons
│   ├── src/
│   │   ├── auth/            Session, guards, brand config
│   │   ├── components/      UI by area (public/admin/charts/…)
│   │   ├── config/          Permissions + nav roles
│   │   ├── context/         UploadDataContext
│   │   ├── data/            Mock barangay/overview datasets
│   │   ├── hooks/
│   │   ├── layouts/         Public / Auth / Dashboard / Admin
│   │   ├── pages/           Active + legacy page modules
│   │   ├── services/        axios API clients
│   │   └── theme/           Color tokens
│   ├── package.json
│   └── vite.config.js
├── data/                    raw / interim / processed / external
├── docs/                    Methodology, RBAC, stubs, PROJECT_OVERVIEW.md
├── environment/             Conda env specs
├── models/                  classification|clustering|regression (.gitkeep only)
├── notebooks/               Pipeline notebook shells
├── reports/figures/         Chart PNG outputs
├── src/                     ML thesis pipelines (ML-thesis, ML-thesis-updated)
├── requirements.txt         Root ML/data-science deps
└── Makefile
```

### 1.2 Tech stack

| Layer | Stack |
|-------|--------|
| **Frontend** | React 19, JSX, Vite 8, React Router 7, Tailwind CSS v4 (`@tailwindcss/vite`), axios, Leaflet/react-leaflet, recharts, lucide-react |
| **Backend** | FastAPI, uvicorn, SQLAlchemy 2, SQLite (`agos.db`), pydantic-settings, PyJWT, pwdlib/argon2 |
| **ML (offline)** | pandas, scikit-learn, joblib, geopandas (scripts/notebooks under `src/`); **not wired into FastAPI** |
| **Dev servers** | FE: `npm run dev` (Vite, typically `:5173`); BE: `uvicorn app.main:app --reload --port 8000` |

### 1.3 FE ↔ BE communication

- **REST** over HTTP; axios client with `baseURL = import.meta.env.VITE_API_BASE_URL ?? http://localhost:8000/api`.
- Config: `frontend/.env` / `.env.example` → `VITE_API_BASE_URL`.
- CORS: backend `FRONTEND_ORIGINS` (default `http://localhost:5173`), credentials enabled.
- Auth: Bearer access JWT + HTTP-only refresh cookie; axios refresh interceptor on 401.

---

## 2. FRONTEND AUDIT

### 2.1 Pages / routes (from `App.jsx`)

| Path | Component | Access | Purpose |
|------|-----------|--------|---------|
| `/` | `pages/public/Landing.jsx` | Public | Marketing landing |
| `/overview` | `pages/public/PublicDashboard.jsx` | Public | Overview stats / charts (mock) |
| `/risk-map` | `pages/public/RiskMap.jsx` | Public | Risk map UI; map canvas is placeholder |
| `/rankings` | `pages/public/Rankings.jsx` | Public | Priority barangay rankings list |
| `/barangays/:id` | `pages/public/BarangayProfile.jsx` | Public | Barangay detail profile |
| `/compare` | `pages/public/CompareBarangays.jsx` | Public | Compare barangays |
| `/indicators` | `pages/public/Indicators.jsx` | Public | Indicator catalog (mock) |
| `/methodology` | `pages/public/Methodology.jsx` | Public | Methodology sections (mock) |
| `/recommendations` | `pages/public/Recommendations.jsx` | Public | Recommendations by category (mock) |
| `/login` | `pages/auth/Login.jsx` | Public (auth layout) | Staff/admin login |
| `/unauthorized` | `pages/auth/Unauthorized.jsx` | Public | Access denied |
| `/dashboard` → `/dashboard/overview` | `DashboardOverview` → re-exports PublicDashboard | `staff`/`admin` | Staff overview |
| `/dashboard/compare` | `DashboardCompare` | `staff`/`admin` | Staff compare |
| `/dashboard/indicators` | `DashboardIndicators` | `staff`/`admin` | Staff indicators |
| `/dashboard/recommendations` | `DashboardRecommendations` | `staff`/`admin` | Staff recommendations |
| `/dashboard/upload` | `DashboardUpload` | `staff`/`admin` | Dataset upload |
| `/admin/review-uploads` | `ReviewUploads` | `admin` | Approve/reject uploads |
| `/admin/manage-users` | `ManageUsers` | `admin` | Account CRUD / roles |
| `/admin/audit-log` | `AdminAuditLog` | `admin` | Audit log viewer |
| `/staff/*` | redirect | — | → `/dashboard/overview` |
| `*` | redirect | — | → `/` |

**Legacy / unused page modules** (not in `App.jsx`; many are `PagePlaceholder` stubs):  
`pages/Overview.jsx`, `Login.jsx`, `RiskMap.jsx`, `Rankings.jsx`, `Indicators.jsx`, `Methodology.jsx`, `Recommendations.jsx`, `BarangayDetail.jsx`, `Dashboard.jsx`, `Scenarios.jsx`, `ModelPerformance.jsx`, and all of `pages/user/*`.

### 2.2 Components (by folder)

| Folder | Notable components | Purpose |
|--------|-------------------|---------|
| `components/public/` | PublicHeader, PublicFooter, UserMenu, HeroCarousel, FloodMosaic, ScrollProgress | Public chrome / landing visuals |
| `components/shared/` | BrandLogo, LoadingScreen, ErrorBoundary, PageHeader, EmptyState, RiskBadge, StatCard (re-export), ScrollToTop | Shared UI |
| `components/charts/` | TopBarangaysChart, RiskDistributionChart | Recharts widgets |
| `components/tables/` | PriorityBarangaysTable | Rankings table |
| `components/ui/` | StatCard | Metric card |
| `components/admin/` | AdminSidebar, AdminTopbar | Admin shell |
| `components/dashboard/` | DashboardSidebar | Staff shell |
| `components/user/` | UserSidebar, UserTopbar | Legacy user shell |
| `components/layout/` | Layout, Sidebar, Topbar | Legacy layout copies |
| Root `components/` | Layout, Sidebar, Topbar, AdminLayout, AuthLayout, UserLayout, PagePlaceholder | **Mostly legacy duplicates** of `layouts/` |

**Possibly unused / low-import** (*needs verification*):  
`AuthLoadingScreen.jsx`, `UserLayout.jsx`, `FloodRiskOverviewPanel.jsx`, `HeroMapPreview.jsx`, `PublicSidebar.jsx`, `hooks/useInViewOnce.js`, `data/appMeta.js`.

**Duplication:** multiple Layout/Sidebar/Topbar implementations (`components/` vs `layouts/` vs `components/layout/`); two StatCard entry points (`ui/` + `shared/` re-export).

### 2.3 State management

| Mechanism | Location | Holds |
|-----------|----------|--------|
| React Context — Auth | `auth/AuthProvider.jsx` + `AuthContext` | account, loading, login/logout/restoreSession |
| React Context — Uploads | `context/UploadDataContext.jsx` | uploads list, submit/approve/reject, accounts/audit for admin |
| In-memory token | `auth/tokenStore.js` | access JWT (not localStorage) |
| Local component state | pages/hooks | forms, UI toggles |
| **No** Redux / Zustand / React Query | — | — |

### 2.4 API integration layer

| Module | Functions → endpoints |
|--------|----------------------|
| `services/api.js` | axios instance + refresh interceptor |
| `services/authService.js` | `POST /auth/login`, `/refresh`, `/logout`; `GET /auth/me` |
| `services/uploadService.js` | `POST/GET /operations/uploads`; `GET/POST /admin/uploads…`; `GET /public/approved-barangays` |
| `services/adminService.js` | `GET /admin/dashboard`, `/accounts`, `/audit-logs`; account create/patch; dataset publish |
| `services/publicService.js` | `GET /public/overview|barangays|rankings…` |

**Note:** `publicService.js` appears **defined but unused** by routed pages; public UIs import `data/mockData.js` / `mockOverview.js` instead. Backend public endpoints still exist and return in-memory mock payloads from `services/public_data.py`.

Hardcoded / mock FE data: `data/mockData.js`, `mockOverview.js`, `barangayData.js` (baseline mock + merges approved uploads).

### 2.5 Styling system

- **Tailwind CSS v4** via Vite plugin; large token layer in `src/index.css` (`@theme`: foundation, ocean, action, pale, risk colors, etc.).
- Supplemental: `theme/colors.js` (risk legend).
- No CSS Modules / styled-components / UI kit library.

### 2.6 Authentication flow (frontend)

1. Login → `POST /auth/login` → access token in memory; refresh cookie set by API.
2. `AuthProvider` restores session via refresh + `/auth/me`.
3. `ProtectedRoute` requires authenticated session.
4. `RoleRoute` gates `staff`/`admin` vs `admin`-only trees.
5. Logout clears token + `POST /auth/logout`.
6. Axios retries once on 401 after refresh.

---

## 3. BACKEND AUDIT

### 3.1 API endpoints (mounted in `main.py`)

**Health**

| Method + path | Auth | Purpose |
|---------------|------|---------|
| `GET /api/health` | No | Liveness |

**Public** (`/api/public`) — no auth

| Method + path | Purpose |
|---------------|---------|
| `GET /approved-barangays` | Approved upload-derived barangay rows |
| `GET /overview` | Mock citywide overview stats |
| `GET /barangays` | Mock barangay list |
| `GET /barangays/{id}` | Mock barangay detail |
| `GET /rankings` | Mock rankings |
| `GET /indicators` | Mock indicator catalog |
| `GET /methodology` | Mock methodology sections |
| `GET /recommendations` | Mock recommendations |

**Auth** (`/api/auth`)

| Method + path | Auth | Purpose |
|---------------|------|---------|
| `POST /login` | No | Username/password → tokens |
| `POST /refresh` | Cookie | New access token |
| `POST /logout` | Optional session | Clear refresh cookie |
| `GET /me` | Bearer | Current account |

**Operations** (`/api/operations`) — `staff` or `admin`

| Method + path | Purpose |
|---------------|---------|
| `GET /dashboard` | Staff dashboard summary (stub-ish) |
| `GET /barangays` | Internal barangay list |
| `GET|POST /uploads` | List / multipart upload |
| `GET /datasets` | Dataset listing stub |
| `POST /dataset-submissions`, `/dataset-uploads` | Submit/upload stubs |
| `GET /model-results`, `POST /model-submissions` | Model stubs |
| `GET /reports`, `POST /report-drafts` | Report stubs |
| `GET /content`, `POST /content-drafts` | Content stubs |

**Admin** (`/api/admin`) — `admin` only

| Method + path | Purpose |
|---------------|---------|
| `GET|POST …/uploads`, approve/reject | Upload moderation |
| `GET /dashboard` | Admin dashboard |
| `POST /datasets/{id}/approve|publish|archive` | Dataset lifecycle stubs |
| `POST /barangays|models|reports|content/…/publish` | Publish stubs |
| `GET /audit-logs` | Audit trail |
| `GET|POST /accounts`, `PATCH …/role|status` | User management |

**Present but NOT mounted** (*orphaned*):  
`routers/admin_auth.py` (`/admin/auth/*`), `routers/user.py` (`/auth/me` for legacy `User` model). Also unused model files `user.py` / `administrator.py` vs active `Account`.

### 3.2 Database / data layer

- **SQLite** via SQLAlchemy (`DATABASE_URL=sqlite:///./agos.db`).
- `init_db()` on startup creates tables (no Alembic migrations observed).

| Model / table | Key fields |
|---------------|------------|
| `Account` / `accounts` | id, username, password_hash, full_name, role (`staff`\|`admin`), is_active, timestamps, last_login_at |
| `DatasetUpload` / `dataset_uploads` | uploader_*, barangay_name, data_type, notes, file_name/path, status, rejection_reason, barangay_record_json |
| `AuditLog` / `audit_logs` | action, actor_username, resource_*, details, created_at |

Seed/bootstrap: `scripts/create_admin.py` + optional `ADMIN_BOOTSTRAP_*` env vars.

### 3.3 Business logic / services

| Module | Role |
|--------|------|
| `services/auth_service.py` | Login, refresh, password verify, account lookup |
| `services/upload_service.py` | Store files under `backend/uploads/`, CRUD-ish upload workflow; **synthetic** `barangay_record` on approve |
| `services/audit_service.py` | Append audit log rows |
| `services/public_data.py` | In-memory mock public datasets (not thesis ML CSVs) |
| `security.py` | JWT create/decode, password hashing, cookie helpers |
| `permissions.py` | Staff vs admin permission sets |

**ML inference in API:** **Missing.** No joblib load in `backend/`. Trained artifact exists offline at `src/ML-thesis-updated/Output/best_flood_risk_model_pipeline.joblib`. Root `models/*` folders empty (`.gitkeep` only). Thesis pipeline lives in `src/ML-thesis*` notebooks/scripts, not FastAPI.

### 3.4 Auth & authorization (backend)

- **JWT access** (Bearer) + **refresh cookie** (HTTP-only).
- Roles: `staff`, `admin` (`AccountRole`).
- Dependencies: `require_active_account`, `require_staff_or_admin`, `require_admin`.
- Password hashing: argon2 via pwdlib.

### 3.5 File / data storage

| Location | Contents |
|----------|----------|
| `backend/agos.db` | SQLite app DB |
| `backend/uploads/` | Multipart upload files (runtime) |
| `frontend/public/` | Static favicons |
| `src/ML-thesis-updated/Input|Output/` | Thesis CSVs, joblib, audits |
| `data/interim|processed/` | Pipeline CSVs (processed mostly stubs) |
| `reports/figures/` | Generated chart PNGs |

No FastAPI `StaticFiles` mount for ML outputs observed.

---

## 4. FRONTEND ↔ BACKEND CONNECTION STATUS

| Frontend feature | Backend dependency | Status |
|------------------|-------------------|--------|
| Landing | None (static) | ✅ N/A |
| Public overview / rankings / indicators / methodology / recommendations | `/api/public/*` available | ⚠️ FE uses **local mock** (`mockData`); `publicService` unused |
| Risk map | Approved barangays + map | ⚠️ Partial: list via `/public/approved-barangays` + mock baseline; **map canvas placeholder** (no Leaflet polygons yet) |
| Barangay profile / compare | Mock + approved merge | ⚠️ Mostly mock |
| Login / session | `/api/auth/*` | ✅ Connected |
| Dashboard upload | `/api/operations/uploads` | ✅ Connected |
| Admin review uploads | `/api/admin/uploads/*` | ✅ Connected |
| Admin manage users | `/api/admin/accounts*` | ✅ Connected |
| Admin audit log | `/api/admin/audit-logs` | ✅ Connected |
| Operations/admin publish/model/report stubs | Various `/operations/*`, `/admin/*/publish` | ❓ UI sparse / stubs — *needs verification* which pages call them |
| Live ML prediction API | — | ❌ Not implemented |

**Rough connectedness (product UI):** auth + upload workflow strongly connected; public risk content largely mock; ML not exposed via API.

---

## 5. ENVIRONMENT & CONFIGURATION

### Backend (`.env.example`)

| Variable | Controls |
|----------|----------|
| `APP_ENV` | development vs production (docs/OpenAPI disabled in prod) |
| `APP_NAME` | API title |
| `DATABASE_URL` | SQLAlchemy URL |
| `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` | Token signing |
| `ACCESS_TOKEN_EXPIRE_MINUTES` / `REFRESH_TOKEN_EXPIRE_DAYS` | Token TTL |
| `FRONTEND_ORIGINS` | CORS allowlist |
| `COOKIE_SECURE` / `COOKIE_SAMESITE` / `COOKIE_DOMAIN` | Refresh cookie |
| `ADMIN_BOOTSTRAP_*` | Optional first admin seed |

### Frontend (`.env.example`)

| Variable | Controls |
|----------|----------|
| `VITE_API_BASE_URL` | axios base URL (e.g. `http://localhost:8000/api`) |

**Dev vs prod:** production disables OpenAPI; TrustedHost middleware enabled; cookie secure flags expected true in prod (*needs verification* of deploy config — none in repo).

---

## 6. KNOWN GAPS / INCOMPLETE FEATURES

- **Map:** Risk Map shows “Map canvas placeholder”; Leaflet deps installed but polygons not rendered in active page.
- **Public data:** Backend and FE both carry **mock** datasets (`dataset_version: 2026.1-mock`); not the 897-barangay ML thesis tables.
- **`publicService.js` unused** by routes — drift risk vs backend public API.
- **Legacy pages** and duplicate layouts clutter `src/pages` / `src/components`.
- **Orphan routers/models:** `admin_auth.py`, `user.py` router, `User`/`Administrator` models not in active `__init__` / `main`.
- **Upload approve** fabricates barangay metrics (`dpi: 0.72`, etc.) — not DPI/ML pipeline.
- **Landing.jsx** contains `TODO: verify with sourced data — placeholder only` on stats.
- **Root `models/` empty**; ML joblib only under thesis Output folder.
- **No CI workflows**; Git LFS not configured for large binaries.
- Processed CSVs under `data/processed/` appear header-only / stub (*needs verification*).

---

## 7. SUMMARY TABLE

| Area | Status | Notes |
|------|--------|-------|
| Frontend Pages | **~19 active routes** (+ ~17 legacy/unused modules) | Router in `App.jsx` |
| Backend Endpoints | **~40+ mounted** under `/api` | Plus orphan `admin_auth` / `user` routers |
| Database Models | **3 active** (`Account`, `DatasetUpload`, `AuditLog`) | SQLite; no Alembic |
| Auth System | **Implemented** | JWT + refresh cookie; staff/admin RBAC |
| ML Model Integration | **Missing in web app** | Offline joblib in `src/ML-thesis-updated/Output/` only |
| Frontend–Backend Connection | **~40–50% product surface** | Auth/uploads ✅; public risk UIs mostly ⚠️ mock; ML ❌ |

---

## Related docs

For deeper narrative architecture, see also `docs/PROJECT_OVERVIEW.md`, `docs/RBAC-reviewer-note.md`, and `docs/methodology_and_validation.md` (ML methodology; not the live API).
