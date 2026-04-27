from pathlib import Path

from pydantic_settings import BaseSettings

BASE_DIR = Path(__file__).resolve().parents[2]


class Settings(BaseSettings):
    DATABASE_URL: str
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    FRONTEND_URL: str = "http://localhost:5173"
    FRONTEND_URLS: str = "http://localhost:5173,http://127.0.0.1:5173"

    class Config:
        env_file = BASE_DIR / ".env"

    @property
    def frontend_origins(self) -> list[str]:
        values = []
        for value in self.FRONTEND_URLS.split(","):
            origin = value.strip().strip('"').strip("'")
            if origin:
                values.append(origin)
        if self.FRONTEND_URL and self.FRONTEND_URL not in values:
            values.append(self.FRONTEND_URL)
        return values


settings = Settings()

