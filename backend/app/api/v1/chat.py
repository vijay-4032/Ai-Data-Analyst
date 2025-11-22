"""
AI Chat Endpoints
"""

from typing import Optional, List
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from loguru import logger
import uuid
from datetime import datetime
import json
import asyncio

from app.config import settings
from app.services.ai_service import AIService
from app.api.v1.upload import uploads_db
from app.api.v1.analysis import analyses_db

router = APIRouter()

# ===========================================
# In-memory storage (replace with database)
# ===========================================
chat_sessions_db: dict = {}


# ===========================================
# Pydantic Models
# ===========================================

class ChatMessage(BaseModel):
    role: str  # "user" or "assistant"
    content: str
    timestamp: Optional[str] = None


class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = None
    dataset_id: Optional[str] = None
    stream: bool = False


class ChatResponse(BaseModel):
    success: bool
    data: dict


class SessionResponse(BaseModel):
    id: str
    dataset_id: Optional[str]
    messages: List[ChatMessage]
    created_at: str
    updated_at: str


# ===========================================
# Helper Functions
# ===========================================

def get_data_context(dataset_id: Optional[str]) -> str:
    """
    Get context about the dataset for the AI
    """
    if not dataset_id or dataset_id not in uploads_db:
        return "No dataset is currently loaded."
    
    dataset = uploads_db[dataset_id]
    
    # Build context string
    context = f"""
Dataset Information:
- Name: {dataset['name']}
- Rows: {dataset['row_count']:,}
- Columns: {dataset['column_count']}

Columns:
"""
    
    for col in dataset['columns'][:20]:  # Limit to 20 columns
        context += f"- {col['name']} ({col['type']}): {col['unique']} unique values, {col['missing']} missing\n"
    
    # Add analysis insights if available
    for analysis in analyses_db.values():
        if analysis.get('dataset_id') == dataset_id and analysis.get('status') == 'completed':
            context += "\nAnalysis Insights:\n"
            for insight in analysis.get('insights', [])[:5]:
                context += f"- {insight['title']}: {insight['description']}\n"
            break
    
    return context


def create_system_prompt(data_context: str) -> str:
    """
    Create the system prompt for the AI
    """
    return f"""You are an AI data analyst assistant. You help users understand and analyze their data.

{data_context}

Guidelines:
1. Provide clear, concise answers about the data
2. When discussing numbers, format them appropriately (use commas, percentages, etc.)
3. Highlight important insights and patterns
4. Suggest visualizations when appropriate
5. If asked about something not in the data, politely explain that
6. Use bullet points for lists of insights
7. Be proactive in suggesting additional analyses

Format your responses with:
- **Bold** for important values and findings
- Bullet points for lists
- Clear paragraph structure"""


# ===========================================
# Endpoints
# ===========================================

@router.post("")
async def chat(request: ChatRequest):
    """
    Send a chat message and get AI response
    
    - Maintains conversation history
    - Provides context about the loaded dataset
    - Supports streaming responses
    """
    
    try:
        # Get or create session
        session_id = request.session_id
        
        if session_id and session_id in chat_sessions_db:
            session = chat_sessions_db[session_id]
        else:
            # Create new session
            session_id = str(uuid.uuid4())
            session = {
                "id": session_id,
                "dataset_id": request.dataset_id,
                "messages": [],
                "created_at": datetime.utcnow().isoformat(),
                "updated_at": datetime.utcnow().isoformat(),
            }
            chat_sessions_db[session_id] = session
        
        # Add user message
        user_message = ChatMessage(
            role="user",
            content=request.message,
            timestamp=datetime.utcnow().isoformat(),
        )
        session["messages"].append(user_message.model_dump())
        
        # Get data context
        data_context = get_data_context(request.dataset_id or session.get("dataset_id"))
        system_prompt = create_system_prompt(data_context)
        
        # Prepare messages for AI
        ai_messages = [
            {"role": "system", "content": system_prompt},
        ]
        
        # Add conversation history (last 10 messages)
        for msg in session["messages"][-10:]:
            ai_messages.append({
                "role": msg["role"],
                "content": msg["content"],
            })
        
        # Get AI response
        ai_service = AIService()
        
        if request.stream:
            # Streaming response
            async def generate():
                full_response = ""
                async for chunk in ai_service.chat_stream(ai_messages):
                    full_response += chunk
                    yield f"data: {json.dumps({'chunk': chunk})}\n\n"
                
                # Save assistant message
                assistant_message = ChatMessage(
                    role="assistant",
                    content=full_response,
                    timestamp=datetime.utcnow().isoformat(),
                )
                session["messages"].append(assistant_message.model_dump())
                session["updated_at"] = datetime.utcnow().isoformat()
                
                yield f"data: {json.dumps({'done': True, 'session_id': session_id})}\n\n"
            
            return StreamingResponse(
                generate(),
                media_type="text/event-stream",
            )
        else:
            # Regular response
            response = await ai_service.chat(ai_messages)
            
            # Save assistant message
            assistant_message = ChatMessage(
                role="assistant",
                content=response,
                timestamp=datetime.utcnow().isoformat(),
            )
            session["messages"].append(assistant_message.model_dump())
            session["updated_at"] = datetime.utcnow().isoformat()
            
            return {
                "success": True,
                "data": {
                    "session_id": session_id,
                    "message": assistant_message.model_dump(),
                },
            }
        
    except Exception as e:
        logger.exception(f"Chat error: {e}")
        raise HTTPException(status_code=500, detail=f"Chat failed: {str(e)}")


@router.get("/sessions")
async def list_sessions(limit: int = 10):
    """
    List recent chat sessions
    """
    
    sessions = sorted(
        chat_sessions_db.values(),
        key=lambda x: x["updated_at"],
        reverse=True,
    )[:limit]
    
    return {
        "success": True,
        "data": sessions,
    }


@router.get("/sessions/{session_id}")
async def get_session(session_id: str):
    """
    Get a specific chat session
    """
    
    if session_id not in chat_sessions_db:
        raise HTTPException(status_code=404, detail="Session not found")
    
    return {
        "success": True,
        "data": chat_sessions_db[session_id],
    }


@router.delete("/sessions/{session_id}")
async def delete_session(session_id: str):
    """
    Delete a chat session
    """
    
    if session_id not in chat_sessions_db:
        raise HTTPException(status_code=404, detail="Session not found")
    
    del chat_sessions_db[session_id]
    
    return {
        "success": True,
        "message": "Session deleted successfully",
    }


@router.post("/sessions/{session_id}/clear")
async def clear_session(session_id: str):
    """
    Clear messages in a session but keep the session
    """
    
    if session_id not in chat_sessions_db:
        raise HTTPException(status_code=404, detail="Session not found")
    
    chat_sessions_db[session_id]["messages"] = []
    chat_sessions_db[session_id]["updated_at"] = datetime.utcnow().isoformat()
    
    return {
        "success": True,
        "message": "Session cleared successfully",
    }