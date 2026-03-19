from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from ..services.gemini_service import gemini_service
from typing import Optional

router = APIRouter(tags=["ai"])

class ChatRequest(BaseModel):
    message: str
    user_name: Optional[str] = "Authorized Personnel"

@router.post("/chat")
async def chat_with_sentinel(req: ChatRequest):
    try:
        response = await gemini_service.get_chat_response(req.message, req.user_name)
        return {"response": response}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
