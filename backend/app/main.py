"""Fare Radar Pro — FastAPI Main Application Entry Point.

Problem Statement: PS-025 — Data Science & Predictive Analytics.
"An explainable airfare intelligence dashboard that turns historical fare data into understandable price context."
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .core.data_loader import load_dataset
from .routers import routes, analysis, forecast, validation, flight, quality


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan event handler: Preload dataset and warm caches on startup."""
    print("Initializing FARE RADAR PRO Data Engine...")
    try:
        df = load_dataset()
        print(f"Dataset preloaded successfully: {len(df)} records across {df['route'].nunique()} routes.")
    except Exception as e:
        print(f"Warning: Initial dataset preload notice: {e}")
    yield
    print("Shutting down FARE RADAR PRO Data Engine.")


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description=settings.DESCRIPTION,
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Routers under /api
app.include_router(routes.router, prefix=settings.API_PREFIX)
app.include_router(analysis.router, prefix=settings.API_PREFIX)
app.include_router(forecast.router, prefix=settings.API_PREFIX)
app.include_router(validation.router, prefix=settings.API_PREFIX)
app.include_router(flight.router, prefix=settings.API_PREFIX)
app.include_router(quality.router, prefix=settings.API_PREFIX)


@app.get("/")
def root():
    """Root info endpoint."""
    return {
        "project": "FARE RADAR PRO",
        "problem_statement": "PS-025 — Data Science & Predictive Analytics",
        "positioning": "An explainable airfare intelligence dashboard that turns historical fare data into understandable price context.",
        "secondary_positioning": "Instead of simply showing today's ticket price, FareRadar explains where that price stands compared with the route's historical behavior.",
        "docs": "/docs",
        "api_prefix": settings.API_PREFIX,
    }


@app.get("/api/health")
def health_check():
    """Health status endpoint."""
    return {
        "status": "healthy",
        "version": settings.VERSION,
        "engine": "active",
    }
