"""
AI Analyst Backend - FastAPI Application
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse
from loguru import logger
import time
import sys

from app.config import settings
from app.api.v1.router import api_router
from app.core.exceptions import APIException

# ===========================================
# Configure Logging
# ===========================================
logger.remove()
logger.add(
    sys.stdout,
    format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> - <level>{message}</level>",
    level=settings.LOG_LEVEL,
    colorize=True,
)

# Add file logging in production
if settings.ENVIRONMENT == "production":
    logger.add(
        "logs/app.log",
        rotation="500 MB",
        retention="10 days",
        compression="zip",
        level="INFO",
    )


# ===========================================
# Lifespan Context Manager
# ===========================================
@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Startup and shutdown events
    """
    # Startup
    logger.info(f"Starting AI Analyst API - {settings.ENVIRONMENT}")
    logger.info(f"API Version: {settings.API_VERSION}")
    
    # Initialize database connection pool (if needed)
    # await database.connect()
    
    # Initialize Redis connection (if needed)
    # await redis.connect()
    
    yield
    
    # Shutdown
    logger.info("Shutting down AI Analyst API")
    
    # Close database connections
    # await database.disconnect()
    
    # Close Redis connections
    # await redis.close()


# ===========================================
# Create FastAPI Application
# ===========================================
app = FastAPI(
    title=settings.APP_NAME,
    description="AI-powered data analytics API",
    version=settings.API_VERSION,
    docs_url="/docs" if settings.ENVIRONMENT != "production" else None,
    redoc_url="/redoc" if settings.ENVIRONMENT != "production" else None,
    openapi_url="/openapi.json" if settings.ENVIRONMENT != "production" else None,
    lifespan=lifespan,
)


# ===========================================
# Middleware
# ===========================================

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# GZip Compression
app.add_middleware(GZipMiddleware, minimum_size=1000)


# Request Logging Middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    """Log all incoming requests"""
    start_time = time.time()
    
    # Generate request ID
    request_id = request.headers.get("X-Request-ID", str(time.time()))
    
    # Log request
    logger.info(f"[{request_id}] {request.method} {request.url.path}")
    
    # Process request
    response = await call_next(request)
    
    # Calculate duration
    duration = time.time() - start_time
    
    # Log response
    logger.info(
        f"[{request_id}] {request.method} {request.url.path} "
        f"- {response.status_code} ({duration:.3f}s)"
    )
    
    # Add headers
    response.headers["X-Request-ID"] = request_id
    response.headers["X-Process-Time"] = str(duration)
    
    return response


# ===========================================
# Exception Handlers
# ===========================================

@app.exception_handler(APIException)
async def api_exception_handler(request: Request, exc: APIException):
    """Handle custom API exceptions"""
    logger.error(f"API Error: {exc.detail}")
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "error": {
                "code": exc.code,
                "message": exc.detail,
                "details": exc.details,
            },
        },
    )


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Handle unexpected exceptions"""
    logger.exception(f"Unexpected error: {exc}")
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "error": {
                "code": "INTERNAL_ERROR",
                "message": "An unexpected error occurred",
            },
        },
    )


# ===========================================
# Include Routers
# ===========================================
app.include_router(api_router, prefix=settings.API_PREFIX)


# ===========================================
# Health Check Endpoints
# ===========================================

@app.get("/health", tags=["Health"])
async def health_check():
    """Basic health check endpoint"""
    return {
        "status": "healthy",
        "environment": settings.ENVIRONMENT,
        "version": settings.API_VERSION,
    }


@app.get("/", tags=["Root"])
async def root():
    """Root endpoint"""
    return {
        "name": settings.APP_NAME,
        "version": settings.API_VERSION,
        "docs": "/docs" if settings.ENVIRONMENT != "production" else None,
    }


# ===========================================
# Run with Uvicorn (for development)
# ===========================================
if __name__ == "__main__":
    import uvicorn
    
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.ENVIRONMENT == "development",
        log_level=settings.LOG_LEVEL.lower(),
    )