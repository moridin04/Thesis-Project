from __future__ import annotations

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_env: str = "development"
    app_name: str = "SAGIP Manila API"
    database_url: str = "sqlite:///./sagip.db"
    jwt_access_secret: str
    jwt_refresh_secret: str
    access_token_expire_minutes: int = 15
    refresh_token_expire_days: int = 7
    frontend_origins: str = "http://localhost:5173"
    cookie_secure: bool = False
    cookie_samesite: str = "lax"
    cookie_domain: str = ""
    admin_bootstrap_username: str = ""
    admin_bootstrap_name: str = ""
    admin_bootstrap_password: str = ""

    @property
    def is_production(self) -> bool:
        return self.app_env.lower() == "production"

    @property
    def frontend_origins_list(self) -> list[str]:
        return [
            origin.strip()
            for origin in self.frontend_origins.split(",")
            if origin.strip()
        ]


@lru_cache
def get_settings() -> Settings:
    return Settings()
