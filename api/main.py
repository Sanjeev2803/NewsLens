"""NewsLens API — FastAPI application entry point."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.config import settings

app = FastAPI(
    title="NewsLens API",
    description="AI-powered news analysis backend",
    version="0.1.0",
)

# CORS — only allow known origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        settings.frontend_url,
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", tags=["system"])
async def health_check():
    """Health check endpoint."""
    return {"status": "ok"}
