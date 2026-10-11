from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.state import app_state
from app.api.router import api_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Load datasets, compute scores & models, seed persistent store
    app_state.initialize()
    yield
    # Shutdown

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Smart Campus Analytics API: Unified Student Performance, Predictive Risk Detection & Actionable Institutional Insights.",
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API routes
app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/")
def root():
    return {
        "message": "Welcome to Smart Campus Analytics API",
        "documentation": "/docs",
        "health_check": f"{settings.API_V1_STR}/health",
        "dashboard_summary": f"{settings.API_V1_STR}/dashboard/summary"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
