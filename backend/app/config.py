from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    api_title: str = "Personal Finance Dashboard API"
    debug: bool = False
    openai_api_key: str = ""  # Set OPENAI_API_KEY in .env
    demo_mode: bool = False  # Set DEMO_MODE=true on Railway to disable live AI calls

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
