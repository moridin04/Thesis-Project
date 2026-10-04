from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.exception_handlers import request_validation_exception_handler
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.middleware.trustedhost import TrustedHostMiddleware

from app.config import get_settings
from app.database import init_db
from app.routers import admin, auth, ml_results, operations, public, public_exports, reports, staff
from app.security import GENERIC_AUTH_ERROR
from app.services.barangay_data import load_barangays

LOGIN_PATH = "/api/auth/login"

settings = get_settings()


@asynccontextmanager
async def lifespan(_app: FastAPI):
    init_db()
    load_barangays()
    yield


app = FastAPI(
    title=settings.app_name,
    version="0.1.0",
    lifespan=lifespan,
    docs_url=None if settings.is_production else "/docs",
    redoc_url=None if settings.is_production else "/redoc",
    openapi_url=None if settings.is_production else "/openapi.json",
)

if settings.is_production:
    app.add_middleware(
        TrustedHostMiddleware,
        allowed_hosts=["*"],
    )

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.frontend_origins_list,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)

@app.exception_handler(RequestValidationError)
async def validation_error_handler(request: Request, exc: RequestValidationError):
    # Login must not echo input or describe field rules; other routes keep the default detail.
    if request.url.path == LOGIN_PATH:
        return JSONResponse(status_code=422, content={"detail": GENERIC_AUTH_ERROR})
    return await request_validation_exception_handler(request, exc)


app.include_router(public.router, prefix="/api")
app.include_router(public_exports.public_router, prefix="/api")
app.include_router(public_exports.admin_router, prefix="/api")
app.include_router(reports.staff_router, prefix="/api")
app.include_router(reports.admin_router, prefix="/api")
app.include_router(ml_results.router, prefix="/api")
app.include_router(staff.router, prefix="/api")
app.include_router(auth.router, prefix="/api")
app.include_router(operations.router, prefix="/api")
app.include_router(admin.router, prefix="/api")


@app.get("/api/health")
def health_check() -> dict[str, str]:
    return {"status": "ok", "service": "AGOS Manila API"}
