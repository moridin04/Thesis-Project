# Settings read from backend/.env (and the process environment).
# Secrets have no default, so the API will not start without them.
# get_settings is cached so we parse the env once per process.
# Cookie flags and token lifetimes are what security.py uses.

from __future__ import annotations

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


# extra="ignore" so an unused env var does not crash startup.
class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_env: str = "development"
    app_name: str = "AGOS Manila API"
    # Local SQLite file unless DATABASE_URL overrides it.
    database_url: str = "sqlite:///./agos.db"
    jwt_access_secret: str
    jwt_refresh_secret: str
    # Access tokens are short. The refresh cookie lasts longer (see below).
    access_token_expire_minutes: int = 15
    refresh_token_expire_days: int = 7
    # Vite's default dev origin. Comma-separated if there is more than one.
    frontend_origins: str = "http://localhost:5173"
    # False so the refresh cookie works on local http. Turn on for https.
    cookie_secure: bool = False
    cookie_samesite: str = "lax"
    cookie_domain: str = ""
    # Optional inputs for scripts/create_admin.py. When one is empty,
    # that script asks for it on the terminal instead.
    admin_bootstrap_username: str = ""
    admin_bootstrap_name: str = ""
    admin_bootstrap_password: str = ""

    @property
    def is_production(self) -> bool:
        return self.app_env.lower() == "production"

    # Split "http://a, http://b" into a list and drop blanks.
    @property
    def frontend_origins_list(self) -> list[str]:
        return [
            origin.strip()
            for origin in self.frontend_origins.split(",")
            if origin.strip()
        ]


# lru_cache with no args: one Settings object for the whole process.
@lru_cache
def get_settings() -> Settings:
    return Settings()
