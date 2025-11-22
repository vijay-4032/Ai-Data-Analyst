"""
API V1 Router
Combines all API endpoints
"""

from fastapi import APIRouter

from app.api.v1 import upload, analysis, chat

# ===========================================
# Create Main Router
# ===========================================
api_router = APIRouter()

# ===========================================
# Include Sub-Routers
# ===========================================

# Upload endpoints
api_router.include_router(
    upload.router,
    prefix="/upload",
    tags=["Upload"],
)

# Analysis endpoints
api_router.include_router(
    analysis.router,
    prefix="/analysis",
    tags=["Analysis"],
)

# Chat endpoints
api_router.include_router(
    chat.router,
    prefix="/chat",
    tags=["Chat"],
)


# ===========================================
# API Info Endpoint
# ===========================================

@api_router.get("/", tags=["Info"])
async def api_info():
    """
    API information and available endpoints
    """
    return {
        "name": "AI Analyst API",
        "version": "1.0.0",
        "endpoints": {
            "upload": {
                "POST /upload": "Upload a CSV or Excel file",
                "GET /upload/{id}": "Get upload status",
                "DELETE /upload/{id}": "Delete uploaded file",
            },
            "analysis": {
                "POST /analysis/{dataset_id}": "Start analysis",
                "GET /analysis/{id}": "Get analysis results",
                "GET /analysis/{id}/charts": "Get chart configurations",
                "GET /analysis/{id}/insights": "Get AI insights",
            },
            "chat": {
                "POST /chat": "Send a chat message",
                "GET /chat/sessions": "Get chat sessions",
                "GET /chat/sessions/{id}": "Get session history",
                "DELETE /chat/sessions/{id}": "Delete session",
            },
        },
    }