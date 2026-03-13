"""Application configuration loaded from environment variables."""

from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    # Supabase
    supabase_url: str = ""
    supabase_key: str = ""
    supabase_service_key: str = ""

    # News APIs
    gnews_api_key: str = ""
    reddit_client_id: str = ""
    reddit_client_secret: str = ""
    reddit_user_agent: str = "NewsLens/1.0"

    # AI
    ollama_base_url: str = "http://localhost:11434"
    anthropic_api_key: str = ""

    # Fact Checking
    google_fact_check_api_key: str = ""
    claimbuster_api_key: str = ""

    # Email
    resend_api_key: str = ""

    # Cache
    upstash_redis_url: Optional[str] = None
    upstash_redis_token: Optional[str] = None

    # App
    api_base_url: str = "http://localhost:8000"
    frontend_url: str = "http://localhost:3000"

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "case_sensitive": False,
    }


settings = Settings()
