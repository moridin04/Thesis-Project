# AGOS Local Setup Guide

Download the ZIP from GitHub (**Code > Download ZIP** on `main`). The data files are in the repo and the database is created automatically, so you only need to set up two terminals.

## 1. Install the prerequisites

- **Python 3.9 or newer**
- **Node.js 20 or newer** (includes npm)

Unzip the download and open a terminal inside the `Thesis-Project` folder.

## 2. Backend (terminal 1)

**macOS / Linux:**

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
```

**Windows (PowerShell):**

```powershell
cd backend
py -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env
```

Next, open `backend/.env` and fill in a few values:

- `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET`: two different long random strings. Running `python -c "import secrets; print(secrets.token_urlsafe(48))"` twice gives you both.
- `DEV_SEED_STAFF_PASSWORD` and `DEV_SEED_ADMIN_PASSWORD`: passwords you choose, at least 12 characters each. These are only needed to test the staff and admin pages.

Then create the test accounts and start the API:

```bash
python scripts/seed_dev_users.py
uvicorn app.main:app --reload --port 8000
```

The API runs at http://localhost:8000. The SQLite database (`agos.db`) is created on first start.

## 3. Frontend (terminal 2)

```bash
cd frontend
npm install
cp .env.example .env        # Windows: copy .env.example .env
npm run dev
```

Then open **http://localhost:5173** in a browser.

`VITE_CARTO_API_KEY` in `frontend/.env` is optional. Without it the map still shows barangay boundaries and a warning appears in place of the street basemap. If the team shares the key with you, it will be sent privately; never put it in the repo or the group chat.

## 4. What to test

- **Public site:** the Important Notice modal appears on the first visit. Tick the box, press **I understand**, and you can then use the Home, Priority Map and Rankings pages.
- **Staff and admin pages:** log in at http://localhost:5173/login with username `lgu_staff` (staff) or `admin` (admin), using the passwords you set in `.env`.

## 5. Common problems

- **"Required JWT secret" error on start:** the two JWT secrets in `backend/.env` are blank or identical.
- **Pages load but show no data:** the backend in terminal 1 isn't running.
- **Port already in use:** close whatever else is using port 8000 or 5173. Changing the ports also means updating `VITE_API_BASE_URL` and `FRONTEND_ORIGINS` in the two `.env` files.
- **Windows: "running scripts is disabled":** run `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` once, then activate the virtual environment again.

Both terminals have to stay open while testing. Stop each server with Ctrl+C.
