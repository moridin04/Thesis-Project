# AGOS / Thesis-Project — Architecture & Structure Reference

> Generated from repository inspection for documentation only.  
> Product branding in the web app is **AGOS** (Analytics and Geospatial Overview for Safety).  
> ML/thesis materials still refer to Metro Manila flood-risk prioritization and older names in places.

---

## 0. Existing documentation cross-reference

| Document | Status | What it contributes |
|---|---|---|
| `docs/methodology_and_validation.md` | **Substantial** (~185 lines) | Authoritative pipeline design: CSI/DPI formula, features, RF/GB/MLP, CV protocol, limitations |
| `docs/RBAC-reviewer-note.md` | **Substantial** | 3-tier access: public / `staff` / `admin`; route map; enforcement model |
| `docs/thesis/Chapter_3_Methodology.md` | **Stub only** (“Draft chapter scaffold…”) | **Not usable** as authoritative methodology despite the brief’s intent |
| `docs/data_dictionary.md` | **Stub** | Placeholder one-liner; no field inventory |
| `docs/model_card.md` | **Stub** | Placeholder; no model file names, metrics, or I/O specs |
| `docs/experiment_log.md` | **Stub** | Empty template |
| `docs/git_lfs.md` | **Stub** | Generic guidance; no tracked-path list |

**Practical authority for methodology:** use `docs/methodology_and_validation.md` + implementation in `src/barangay_flood_risk_modeling.py`.  
**Practical authority for RBAC:** `docs/RBAC-reviewer-note.md` largely matches `backend/app/security.py`, `permissions.py`, and frontend route guards.

---

## 1. Tech stack

### Frontend (`frontend/`)

| Area | Choice | Evidence |
|---|---|---|
| Framework | **React 19.2.x** | `frontend/package.json` |
| Language | **JavaScript (JSX)** — not TypeScript app code | `.jsx` pages; TS types only as `@types/*` for eslint |
| Build tool | **Vite 8.2.x** + `@vitejs/plugin-react` | `vite.config.js`, scripts `dev`/`build` |
| Styling | **Tailwind CSS v4** via `@tailwindcss/vite` + large `src/index.css` token layer | `package.json`, `vite.config.js` |
| Routing | **react-router-dom 7.x** | `App.jsx` |
| HTTP | **axios** | `src/services/api.js` |
| Icons | **lucide-react** | widespread imports |
| Maps | **Leaflet + react-leaflet** | dependencies; used on risk-map UI |
| Charts | **recharts** | chart components under `components/charts/` |
| State | **React Context only** (`AuthContext`, `UploadDataContext`) — no Redux/Zustand | `auth/`, `context/` |
| UI kits | None (custom components + Tailwind) | — |
| E2E tooling | **playwright** listed as devDependency | unclear if suites exist |

### Backend (`backend/`)

| Area | Choice | Evidence |
|---|---|---|
| Framework | **FastAPI** | `backend/app/main.py`, `requirements.txt` |
| Language | **Python 3** (venv uses system; conda env pins **3.11**) | `environment/environment.yml` |
| Server | **uvicorn** | `uvicorn[standard]` |
| DB | **SQLite** via SQLAlchemy 2.x (`sqlite:///./agos.db` default) | `config.py`, `database.py` |
| Auth | **JWT access tokens** + **HTTP-only refresh cookie**; passwords via **pwdlib/argon2** | `security.py`, `auth` router |
| Roles | `staff`, `admin` only (`VALID_ROLES`) — matches RBAC note | `security.py` |
| API style | **REST** under `/api/*` | routers |
| Settings | **pydantic-settings** + `.env` | `config.py` |

### ML / data pipeline (`src/`, root `requirements.txt`)

| Area | Choice | Evidence |
|---|---|---|
| Core | pandas, numpy, scikit-learn, scipy, matplotlib, seaborn, joblib | root `requirements.txt` / `environment.yml` |
| Geospatial | **geopandas** listed; QGIS-prepared CSVs also used | `requirements.txt`; `src/ML-thesis-updated/README` |
| Raster | GeoTIFF present (`DTM_ManilaCity_*.tif`) — unclear if loaded by current packaged pipeline | file in `src/ML-thesis-updated/` |
| Models documented | RF, Gradient Boosting, MLP (+ baselines, K-Means) | `methodology_and_validation.md`, `barangay_flood_risk_modeling.py` |
| Notebooks | Jupyter `.ipynb` under `notebooks/` and legacy under `src/ML-thesis*` | — |
| Report PDF | **fpdf2** | `requirements.txt`, modeling module |

### DevOps / environment

| Area | Status |
|---|---|
| Env mgmt | **conda** (`environment/environment.yml`) and/or **venv** + pip (`requirements.txt`, `backend/requirements.txt`) |
| Makefile | `test`, `run-pipeline`, `train-all`, `generate-figures`, `export-results` |
| Git LFS | **No `.gitattributes`**; `docs/git_lfs.md` is stub — large binaries (tif, joblib, pdf) live in-tree without confirmed LFS |
| CI/CD | **None** (no `.github/workflows`) |
| Deployment target | **Not specified** in repo |

---

## 2. Folder structure map

```
Thesis-Project/
├── backend/                 FastAPI web API (AGOS auth, uploads, mock public data)
│   ├── app/
│   │   ├── dependencies/    FastAPI auth dependencies (role gates)
│   │   ├── models/          SQLAlchemy ORM (Account, Upload, AuditLog, …)
│   │   ├── routers/         HTTP route modules (public, auth, operations, admin, …)
│   │   ├── schemas/         Pydantic request/response models
│   │   └── services/        Business logic (auth, uploads, audit, public_data)
│   ├── scripts/             Admin bootstrap helpers (e.g. create_admin.py)
│   └── tests/               Backend pytest suite
├── data/
│   ├── raw/                 Placeholders for flood/geospatial/population inputs (.gitkeep)
│   ├── interim/             Combined Metro Manila flood+population CSV (active input)
│   ├── processed/           Intended clean/feature/model-ready CSVs (currently headers only)
│   └── external/            Reference boundaries placeholder
├── docs/                    Project docs (RBAC note + methodology; several stubs)
│   └── thesis/              Manuscript scaffolds (Chapter 3 is stub)
├── environment/             Conda env + setup instructions
├── frontend/                React+Vite AGOS web UI
│   ├── public/              Favicons / static icons
│   └── src/
│       ├── assets/          Logos and imagery
│       ├── auth/            JWT session, guards, brand config
│       ├── components/      UI by area (public/admin/dashboard/charts/…)
│       ├── config/          Permissions + nav role mapping
│       ├── context/         Upload data context
│       ├── data/            Mock overview/barangay datasets
│       ├── hooks/           e.g. useApprovedBarangays
│       ├── layouts/         Public / Auth / Dashboard / Admin shells
│       ├── pages/           Route pages (public, auth, dashboard, admin; legacy copies)
│       ├── services/        axios API clients
│       ├── theme/           Color tokens
│       └── utils/           Helpers
├── models/                  Intended serialized model store (classification/clustering/regression) — empty (.gitkeep only)
├── notebooks/               Numbered pipeline notebooks (mostly empty shells)
├── reports/
│   ├── figures/             PNG charts from pipeline runs (classification/clustering/…)
│   ├── tables/              Metric CSV templates (headers only currently)
│   └── final_report/        Placeholder for final PDF/report
├── scripts/                 Thin CLI wrappers → `src.main` / stubs
├── src/                     Thesis ML Python package + legacy pipelines
│   ├── features/            Thin wrappers to DPI/feature engineering
│   ├── models/              Thin wrappers (train/evaluate stubs)
│   ├── utils/               Path helpers
│   ├── visualization/       Plotting stubs
│   ├── ML-thesis/           Older Manila pipeline + shp-to-csv + notebooks
│   ├── ML-thesis-updated/   Newer notebook pipeline + Input/Output artifacts + joblib
│   ├── barangay_flood_risk_modeling.py   Main Metro Manila DPI+ML implementation
│   └── main.py              Pipeline entry orchestrator
└── tests/                   Root pytest for DPI/preprocessing/model stubs
```

---

## 3. Key files inventory

### ML / DPI / pipeline (Python)

| File | Role |
|---|---|
| `src/barangay_flood_risk_modeling.py` | **Primary implementation**: load data, engineer features, CSI/DPI, clustering, RF/GB/MLP class+reg, sensitivity, PDF export (~1137 lines). Aligns closely with `methodology_and_validation.md`. |
| `src/main.py` | Entry: load interim CSV → indices → ML → sensitivity → validation → export → PDF |
| `src/features/calculate_dpi.py` | Re-exports `calculate_indices` |
| `src/features/build_features.py` | Re-exports `engineer_features` |
| `src/models/*.py` | Thin stubs / wrappers (not full training logic) |
| `scripts/run_pipeline.py` | Calls `src.main.main` |
| `scripts/train_all_models.py`, `generate_figures.py`, `export_results.py` | Extremely thin stubs (~66 bytes each) — unclear if functional beyond import |
| `src/ML-thesis/manila_flood_risk_pipeline.py` | **Alternate** Manila-focused pipeline: PSA **2024**, **excludes 100-yr from CSI/DPI/ML**, entropy-weighted DPI / qcut classes — **differs** from methodology doc |
| `src/ML-thesis-updated/flood_risk_pipeline_manila.ipynb` | Updated notebook pipeline (QGIS tabular inputs) |
| `src/ML-thesis-updated/Output/best_flood_risk_model_pipeline.joblib` | Trained sklearn pipeline artifact (~439 KB) — **not** under `models/` |

**DPI formula in primary code** (`calculate_indices`) matches methodology:

- Flood score tiers: ≤5%→0, >5%→2.5, ≥20%→5, ≥50%→7.5, ≥80%→10  
- CSI = 0.5·5yr + 0.3·25yr + 0.2·100yr scores  
- DPI = 0.6·CSI + 0.4·Vulnerability_Score  
- Classes: tertile split of `DPI_Scaled` (0–100) via `pd.qcut`: Low (bottom third) / Medium (middle third) / High (top third), 299 each. Relative within Metro Manila, not absolute risk.  

### Datasets

| Path | Contents (inspected) |
|---|---|
| `data/interim/MetroManila_Combined_Flood_Population-new.csv` | **922 rows**, cols: `district, City, Barangay, brgy_area_sqm, flood5/25/100_sqm_final, Population_2020`. Cities span NCR (Manila=206, Caloocan=181, …). Encoding not pure UTF-8 (ñ). |
| `data/processed/barangay_flood_risk_*.csv` | **Header-only** (no data rows): clean / features / model_ready |
| `data/raw/**` | Empty placeholders (`.gitkeep`) |
| `src/ML-thesis-updated/Input/*` | Flood validated CSV, elevation, base admin, PSA 2020 xlsx, PSA 2024 csv |
| `src/ML-thesis-updated/Output/*` | Predictions CSV, enriched datasets, importance CSVs, charts, **joblib** |

### Trained models

| Expected (docs / `models/`) | Actual |
|---|---|
| `models/classification|clustering|regression/*` | **Empty** (`.gitkeep` only) |
| `model_card.md` describes RF/GB/MLP | No `.pkl`/`.joblib` under `models/` matching that layout |
| Serialized model found | `src/ML-thesis-updated/Output/best_flood_risk_model_pipeline.joblib` |

### Notebooks (`notebooks/`)

| Notebook | Status |
|---|---|
| `01_data_exploration.ipynb` | **Empty** (0 cells) |
| `02_data_preprocessing.ipynb` | **Empty** |
| `03_archetype_clustering.ipynb` | **Empty** |
| `04_classification_modeling.ipynb` | **Populated** (~50 cells; branded “AlertaBayan” in preview) |
| `05_regression_modeling.ipynb` | **Empty** |
| `06_results_visualization.ipynb` | **Empty** |

`experiment_log.md` does not record runs; figures under `reports/figures/` suggest prior successful runs of the primary pipeline.

### Web entry points

| Layer | Entry |
|---|---|
| Frontend | `frontend/index.html` → `src/main.jsx` → `App.jsx` |
| Backend | `backend/app/main.py` (`uvicorn app.main:app`) |

### Reports artifacts

PNG figures exist under `reports/figures/{classification,clustering,feature_analysis,regression,validation}/`.  
Metric CSVs under `reports/tables/` currently contain **headers only**.

---

## 4. Current frontend pages / routes

Active router: `frontend/src/App.jsx`.

| Route | Page component | What it shows | Data source |
|---|---|---|---|
| `/` | `Landing` | Marketing/hero, story sections, team, feedback CTAs | Static + brand config |
| `/overview` | `PublicDashboard` | City-wide overview cards/charts | Mostly **`mockData` / `mockOverview`**; barangay list via `useApprovedBarangays` |
| `/risk-map` | `RiskMap` | Interactive map | Approved+baseline barangays (mock + uploads API) |
| `/rankings` | `Rankings` | Ordered priority list | Same hook |
| `/barangays/:id` | `BarangayProfile` | Single profile | Same hook |
| `/compare` | `CompareBarangays` | Side-by-side compare | Same hook |
| `/indicators` | `Indicators` | Indicator catalog | **`mockData` static** |
| `/methodology` | `Methodology` | Methods narrative | **`mockData` static** + brand disclaimer |
| `/recommendations` | `Recommendations` | Guidance by category | **`mockData` static** |
| `/login` | `Login` | Staff/admin login | Live **`/api/auth/login`** |
| `/unauthorized` | `Unauthorized` | Access denied | Static |
| `/dashboard/*` | Dashboard* | LGU workspace (overview/compare/indicators/recommendations/upload) | Mix of mock UI + real **upload** APIs for staff/admin |
| `/admin/review-uploads` | `ReviewUploads` | Approve/reject uploads | Live admin upload APIs |
| `/admin/manage-users` | `ManageUsers` | Account management | Live admin account APIs |
| `/admin/audit-log` | `AdminAuditLog` | Audit trail | Live admin audit API |
| Legacy `pages/*.jsx`, `pages/user/*` | Not wired in `App.jsx` | Older/unused copies | — |

`frontend/src/services/publicService.js` defines clients for `/public/*`, but public pages primarily use **local mocks** + `uploadService.fetchApprovedBarangays` — `publicService` appears **unused** by pages.

---

## 5. Current backend API endpoints

Base prefix: `/api`. Health: `GET /api/health`.

### Public (no auth) — `routers/public.py`

| Method | Path | Input | Output | Notes |
|---|---|---|---|---|
| GET | `/api/public/approved-barangays` | — | list of approved upload barangay records | DB-backed |
| GET | `/api/public/overview` | — | overview dict + risk_distribution + top 5 | **Hardcoded mock** in `public_data.py` (`dataset_version: 2026.1-mock`) |
| GET | `/api/public/barangays` | — | list | Mock (~3 barangays) |
| GET | `/api/public/barangays/{id}` | path id | one barangay or 404 | Mock |
| GET | `/api/public/rankings` | — | sorted mock list | Mock |
| GET | `/api/public/indicators` | — | indicator catalog | Mock |
| GET | `/api/public/methodology` | — | methodology payload | Mock |
| GET | `/api/public/recommendations` | — | recommendations | Mock |

### Auth — `routers/auth.py` (mounted)

| Method | Path | Roles | Notes |
|---|---|---|---|
| POST | `/api/auth/login` | public | username/password → access JWT + refresh cookie |
| POST | `/api/auth/refresh` | cookie | new access token |
| POST | `/api/auth/logout` | — | clears refresh cookie |
| GET | `/api/auth/me` | authenticated | current account |

### Operations — `routers/operations.py` (`require_staff_or_admin`)

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/operations/dashboard` | Stub operational summary |
| GET | `/api/operations/barangays` | Returns same mock `BARANGAYS` |
| GET/POST | `/api/operations/uploads` | List/create staff uploads (real DB) |
| GET | `/api/operations/datasets` | Stub published/drafts |
| POST | `/api/operations/dataset-submissions`, `/dataset-uploads` | Stub audit-logged actions |
| GET/POST | `/api/operations/model-results`, `/model-submissions` | Stubs |
| GET/POST | `/api/operations/reports`, `/report-drafts` | Stubs |
| GET/POST | `/api/operations/content`, `/content-drafts` | Stubs |

### Admin — `routers/admin.py` (`require_admin`)

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/admin/uploads` | List uploads (optional status filter) |
| POST | `/api/admin/uploads/{id}/approve` | Approve → public visibility path |
| POST | `/api/admin/uploads/{id}/reject` | Reject with reason |
| GET | `/api/admin/dashboard` | Stub admin KPIs |
| POST | `/api/admin/datasets/{id}/approve\|publish\|archive` | Audit-logged stubs |
| POST | `/api/admin/barangays\|models\|reports\|content/.../publish` | Audit-logged stubs |
| GET | `/api/admin/audit-logs` | Audit log list |
| GET/POST | `/api/admin/accounts` | List / create accounts |
| PATCH | `/api/admin/accounts/{id}/role` | Role change (last-admin safeguards) |
| PATCH | `/api/admin/accounts/{id}/status` | Activate/deactivate |

### Present but **not mounted** in `main.py`

- `routers/admin_auth.py` (`/admin/auth/*`)
- `routers/user.py` (`/auth/me` UserPublic variant)

RBAC doc ↔ code: **roles and gates largely match**. Frontend maps `staff` → UI “lgu” via `navRoles.js` as documented.

---

## 6. Data flow summary

### Documented / intended (`methodology_and_validation.md` + `src/main.py`)

```
Raw geospatial hazard (NOAH 5/25/100-yr) + PSA demographics
        ↓
Integrated barangay table (interim CSV)
        ↓
Feature engineering (coverage, density, affected pop, growth)
        ↓
Deterministic CSI → DPI → Low/Medium/High classes
        ↓
K-Means archetypes (exploratory) + supervised RF/GB/MLP
        ↓
Exports: processed CSVs, metrics tables, figures, PDF
        ↓ (intended product path)
Backend serves published barangay risk products
        ↓
Frontend Risk Map / Rankings / Profiles / Compare
```

### What actually exists today

1. **Interim Metro Manila CSV (922 barangays)** is the live ML input for `src.main`.  
2. **Processed outputs are empty shells**; figures exist but metric CSVs are empty headers.  
3. **`models/` store is empty**; a joblib lives under `src/ML-thesis-updated/Output/` from a **different** Manila-focused pipeline.  
4. **Web backend does not read ML CSVs/joblib**. Public risk payloads are **hardcoded mocks** (`public_data.py`, `mockOverview.js`).  
5. **Upload workflow is real** (staff submit → admin approve → merge into frontend list via `/public/approved-barangays`), but baseline map/rankings still start from **mock priority barangays**.  
6. `Chapter_3_Methodology.md` does not describe the flow (stub). Alternate `manila_flood_risk_pipeline.py` implements a **diverging** DPI recipe (PSA 2024, no 100-yr in index, entropy weights, qcut classes).

---

## 7. Documentation vs. code gap analysis

| Area | Documentation says | Code / data does | Gap |
|---|---|---|---|
| Chapter 3 | Should be authoritative methodology | File is a one-line scaffold | **Major** — cannot verify thesis chapter against code |
| Data dictionary | Should define fields/units/sources | Stub only | **Major** — no authoritative field catalog |
| Model card | Should describe model I/O & metrics | Stub only | **Major** |
| Experiment log | Should record runs | Stub only | **Major** |
| Git LFS | Should track large binaries | No `.gitattributes`; large tif/joblib/pdf in repo | **Mismatch** with guidance doc |
| DPI formula | CSI 50/30/20; DPI 60/40; classes 3.5/6.5 | Matched in `barangay_flood_risk_modeling.py` | **Aligned** (primary pipeline) |
| Alternate pipeline | Same methodology assumed | `manila_flood_risk_pipeline.py` excludes 100-yr, uses PSA 2024 + entropy DPI + qcut | **Conflict** between pipelines |
| Population vintage | Methodology emphasizes PSA **2020** | Interim uses `Population_2020`; Manila pipeline insists PSA **2024** | **Conflict** |
| Model artifacts | Implied under `models/` | Only `.gitkeep` there; joblib elsewhere | **Mismatch** |
| Notebooks | Numbered stages in `experiment_log` spirit | 5/6 notebooks empty; only `04_*` populated (and titled AlertaBayan) | **Mismatch** |
| Barangay count | UI/mock/API claim **897** (Manila) | Interim has **206 Manila** / **922 NCR**; mock uses 897 | **Mismatch** |
| Risk labels | Methodology: Low / Medium / **High** | Frontend mock adds **Critical**; scores look like 0–1 not 0–10 DPI | **Mismatch** |
| Indicators | Flood coverage, density, affected pop, growth | Mock API uses flood depth, rainfall_index, poverty_index, etc. | **Mismatch** |
| Public API | Intended to serve published pipeline outputs | Serves `2026.1-mock` hardcoded objects | **Mismatch** |
| RBAC tiers | Public / staff / admin | Implemented and largely consistent | **Mostly aligned** |
| `user` role | Explicitly none in DB | Confirmed `VALID_ROLES={staff,admin}` | **Aligned** |
| Admin auth router | Implied single auth surface | Extra `admin_auth.py` / `user.py` **not mounted** | Minor / dead code |

---

## 8. Gaps / missing pieces (implementation)

Independent of docs:

1. **No wiring** from ML outputs → backend → frontend (except optional staff uploads).  
2. **`data/processed/*` empty** — pipeline export path incomplete or not re-run in this checkout.  
3. **`models/` empty** — no canonical serialized RF/GB/MLP for the methodology-aligned pipeline.  
4. **Root scripts** `train_all_models` / `generate_figures` / `export_results` appear stubbed.  
5. **`publicService.js` unused** by pages; dual mock sources (`mockOverview` vs `public_data.py`) can drift.  
6. **Raw geospatial inputs** not present under `data/raw/` (only gitkeeps); reliance on interim/legacy folders.  
7. **No CI**, no Docker, no deployment config.  
8. **Git LFS not configured** despite large assets.  
9. **Duplicate/legacy UI trees** (`pages/user/*`, top-level `pages/*.jsx`) not in router — maintenance noise.  
10. **No GeoJSON barangay boundary service** in backend for a true choropleth from pipeline outputs (map likely uses mock points / limited geometry — unclear without deeper map component audit).  
11. **Thesis Chapter 3 / data dictionary / model card / experiment log** need real content before external review.  
12. Product scope (AGOS Manila, 897 barangays) vs dataset scope (Metro Manila 922 / Manila 206) unresolved.

---

## 9. Quick “source of truth” cheat sheet

| Concern | Prefer |
|---|---|
| How DPI *should* work | `docs/methodology_and_validation.md` + `src/barangay_flood_risk_modeling.py` |
| How RBAC works | `docs/RBAC-reviewer-note.md` + `backend/app/security.py` / `permissions.py` + `frontend/src/App.jsx` |
| What the web app currently shows | `frontend/src/data/mockOverview.js` + `backend/app/services/public_data.py` |
| What data the main pipeline reads | `data/interim/MetroManila_Combined_Flood_Population-new.csv` via `src/utils/paths.py` |
| Alternate experimental pipeline | `src/ML-thesis*` / `ML-thesis-updated/` (do not assume formula parity) |

---

*End of reference map.*
