from starlette.middleware.base import BaseHTTPMiddleware
from fastapi import Request
from .database import SessionLocal
from .models.audit_log import AuditLog
from .utils.jwt_handler import jwt_handler
from datetime import datetime

class ActivityLoggerMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # 1. Bypass FOR STREAMING, WEBSOCKETS, AND PREFLIGHT to prevent blocking
        if request.url.path == "/video_feed" or "/ws/" in request.url.path or request.method == "OPTIONS":
            return await call_next(request)

        # 2. Continue request for others
        response = await call_next(request)
        
        # Refined Logging logic using central AuditService
        if request.method != "GET" or request.url.path.startswith("/auth"):
            try:
                user_id = None
                auth_header = request.headers.get("Authorization")
                if auth_header and auth_header.startswith("Bearer "):
                    token = auth_header.split(" ")[1]
                    payload = jwt_handler.decode_token(token)
                    if payload:
                        user_id = payload.get("id")

                from .services.audit_service import audit_service
                audit_service.log_action(
                    user_id=user_id,
                    action=f"{request.method} {request.url.path}",
                    ip_address=request.client.host,
                    details=f"Status: {response.status_code}"
                )
            except Exception as e:
                print(f"Middleware Log Error: {e}")
        
        return response
