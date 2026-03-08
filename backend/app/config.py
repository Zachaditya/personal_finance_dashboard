from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    api_title: str = "Personal Finance Dashboard API"
    debug: bool = False
    openai_api_key: str = ""  # Set OPENAI_API_KEY in .env

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
