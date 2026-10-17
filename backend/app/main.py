from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.db.init_db import init_db
from app.services.watcher_service import start_watcher, stop_watcher
from app.api.v1.api import api_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database tables on startup
    init_db()
    # Start server-side repository change watcher
    start_watcher()
    yield
    # Clean shutdown of watcher
    stop_watcher()



app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description=(
        "ProofPath API: Multi-source Developer Evidence Verification System. "
        "Compares Job Requirements, Résumé Claims, and GitHub Source Evidence with deterministic citation validation."
    ),
    lifespan=lifespan
)

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API v1 router
app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get("/health", summary="Direct health check")
def health():
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "database": "sqlite",
        "ai_provider": "gemini" if settings.GEMINI_API_KEY else "deterministic"
    }


@app.get("/", summary="Root endpoint")
def root():
    return {
        "message": "Welcome to ProofPath API",
        "tagline": "Your code tells a story. Make the evidence visible.",
        "docs_url": "/docs",
        "version": settings.VERSION,
        "health_check": f"{settings.API_V1_STR}/health"
    }
