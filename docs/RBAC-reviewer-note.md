# SAGIP Role-Based Access Control (RBAC) — Reviewer Note

## Overview

SAGIP uses a **3-tier access model**:

| Product / UI tier | Backend role value | Who it is |
|---|---|---|
| **Public user** (resident / visitor) | *(no account / unauthenticated)* | Anyone browsing published flood-risk information |
| **LGU / Staff** | `staff` | Barangay / LGU operators who prepare and submit data |
| **Admin** | `admin` | System administrators who approve, publish, and manage accounts |

**Important naming note for reviewers:**  
There is **no `user` role stored in the database**. “User” in product language means the **public, unauthenticated audience**. Authenticated accounts are only `staff` or `admin` (`VALID_ROLES` in `backend/app/security.py`).

In the frontend nav layer, `staff` is mapped to UI label **`lgu`** via `navRoleFromAuth()` in `frontend/src/config/navRoles.js`.

---

## Access Tiers

### 1. Public User (unauthenticated)

**Purpose:** Explore published flood-risk information only.

**Can access**
- Home / Landing
- Risk Map, Rankings, Overview Dashboard (public)
- Barangay profiles, Compare, Indicators, Methodology, Recommendations
- Login page

**Cannot access**
- `/dashboard/*` (LGU workspace)
- `/admin/*` (admin panel)
- Upload / approval APIs

**Data visibility**
- Public pages are intended to show **approved / published** barangay data only (via the approved-uploads flow), not pending staff submissions.

**Navigation**
- Header shows: Home, Risk Map, Rankings, Methodology + Login

---

### 2. Staff / LGU (`role = "staff"`)

**Purpose:** Operational workspace for preparing and submitting flood-related datasets for review.

**Can access**
- Everything public users can access
- **LGU Dashboard** (`/dashboard/*`):
  - Overview
  - Compare
  - Indicators
  - Recommendations
  - Upload

**Cannot access**
- Admin Panel (`/admin/*`) — review uploads, manage users, audit log

**Backend gate**
- Operations APIs under `/operations/*` use `require_staff_or_admin`
- Staff can create/list their uploads; they do **not** get admin approval endpoints

**Permissions (capability model)**  
Staff get “prepare / submit” permissions, e.g.:
- `dataset:upload`, `dataset:submit`
- `barangay:prepare`, `model:submit`, `report:prepare`, `content:prepare`  
They do **not** get publish, account, or role-management permissions.

**Navigation**
- Public links + **Dashboard**

**Post-login home**
- `/dashboard/overview`

---

### 3. Admin (`role = "admin"`)

**Purpose:** Governance — approve submissions, manage accounts, audit activity, publish.

**Can access**
- Everything staff can access
- **Admin Panel** (`/admin/*`):
  - Review Uploads
  - Manage Users
  - Audit Log

**Backend gate**
- Admin APIs under `/admin/*` use `require_admin`
- Includes account create/role update/activate-deactivate and upload approval workflows
- Safeguards exist so the **last active admin cannot be demoted/deactivated**

**Permissions**
- All staff permissions, plus:
  - Publish capabilities (`*:publish`)
  - `audit:view`
  - `account:manage`
  - `role:manage`

**Navigation**
- Public links + **Dashboard** + **Admin Panel**

**Post-login home**
- `/dashboard/overview` (same as staff; Admin Panel is a separate nav entry)

---

## How Enforcement Works

### Frontend (UX + route guards)

1. **`ProtectedRoute`** — requires authentication; otherwise redirects to `/login`
2. **`RoleRoute`** — requires an allowed role list
   - Dashboard: `allowedRoles={['staff', 'admin']}`
   - Admin: `allowedRoles={['admin']}`
3. **Header filtering** — workspace links are shown only if the mapped nav role matches
4. **Permission helper** — `hasPermission(role, permission)` derives a capability set from role (`frontend/src/config/permissions.js`)

Unauthenticated users hitting protected routes → `/login`  
Authenticated but wrong role → redirected away (admin-only routes refuse staff)

### Backend (authoritative security)

Frontend guards are **not** the security boundary. APIs enforce roles via FastAPI dependencies:

| Dependency | Allows |
|---|---|
| `require_active_account` | Any valid active JWT account |
| `require_staff_or_admin` | `staff`, `admin` |
| `require_admin` | `admin` only |
| `require_permission(...)` | Capability-based check |

Unauthorized / forbidden calls return **401** or **403**.

**Key files**
- Frontend: `frontend/src/config/permissions.js`, `frontend/src/config/navRoles.js`, `frontend/src/auth/ProtectedRoute.jsx`, `frontend/src/auth/RoleRoute.jsx`, `frontend/src/App.jsx`
- Backend: `backend/app/security.py`, `backend/app/permissions.py`, `backend/app/dependencies/auth.py`, `backend/app/routers/operations.py`, `backend/app/routers/admin.py`

---

## Typical Workflow (Staff → Admin → Public)

1. **Staff** uploads barangay / dataset content from Dashboard Upload  
2. Upload enters a **pending** review state  
3. **Admin** reviews and **approves / rejects** in Admin Panel  
4. **Approved** data becomes visible on public Risk Map / Rankings / related views  
5. Public users only see the published result

This separation supports a clear prepare → approve → publish pipeline.

---

## Route Map (quick reference)

| Path | Public | Staff | Admin |
|---|---|---|---|
| `/`, `/risk-map`, `/rankings`, `/overview`, … | ✅ | ✅ | ✅ |
| `/login` | ✅ | ✅ (redirects if already logged in) | ✅ |
| `/dashboard/*` | ❌ | ✅ | ✅ |
| `/admin/*` | ❌ | ❌ | ✅ |

---

## Design Summary for Reviewers

- **Public user** = read-only consumer of published risk info (no DB role)
- **Staff** = LGU operator; prepare/submit; cannot publish or manage accounts
- **Admin** = publisher + account/role governance + audit
- Frontend maps `staff` → “LGU” for clearer product language
- Backend roles are the source of truth; UI role checks are for UX only

---

## Suggested Test Cases for Reviewers

1. Browse public pages while logged out → OK  
2. Open `/dashboard/upload` while logged out → redirect to login  
3. Login as staff → Dashboard visible; Admin Panel hidden; `/admin/...` blocked  
4. Login as admin → Dashboard + Admin Panel visible  
5. Staff upload → pending; not on public map until admin approval  
6. Admin approve → appears on public views  
7. Attempt to demote/deactivate last admin → rejected by API  
