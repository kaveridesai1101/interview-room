from fastapi import WebSocket
from typing import List, Dict
import json

class ConnectionManager:
    def __init__(self):
        # user_id -> List[WebSocket]
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, user_id: str):
        await websocket.accept()
        if user_id not in self.active_connections:
            self.active_connections[user_id] = []
        self.active_connections[user_id].append(websocket)
        print(f"TRACE: WebSocket Connected for user '{user_id}'. Active users: {list(self.active_connections.keys())}", flush=True)

    def disconnect(self, websocket: WebSocket, user_id: str):
        if user_id in self.active_connections:
            if websocket in self.active_connections[user_id]:
                self.active_connections[user_id].remove(websocket)
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]
        print(f"TRACE: WebSocket Disconnected for user '{user_id}'. Remaining: {list(self.active_connections.keys())}", flush=True)

    async def broadcast(self, message: dict, target_user_id: str = None):
        """
        Broadcasts message. If target_user_id is provided, only sends to that user AND admins.
        If None, sends to everyone (global system message).
        """
        message_str = json.dumps(message)
        
        # Determine who gets the message
        recipients = []
        if target_user_id:
            # Send to the target user
            if target_user_id in self.active_connections:
                recipients.extend(self.active_connections[target_user_id])
            # ALWAYS send to admins
            if "admin" in self.active_connections and target_user_id != "admin":
                recipients.extend(self.active_connections["admin"])
        else:
            # Global broadcast to every connected socket
            for user_sockets in self.active_connections.values():
                recipients.extend(user_sockets)
        
        if not recipients:
            # print("TRACE: No recipients for broadcast")
            return

        # Execute sends
        to_cleanup = [] # (user_id, socket)
        for user_id, sockets in self.active_connections.items():
            for ws in sockets:
                if ws in recipients:
                    try:
                        await ws.send_text(message_str)
                        # We use a more limited trace for heavy data like stats
                        if message.get('type') != 'stats':
                            print(f"TRACE: Sent '{message.get('type')}' to {user_id}", flush=True)
                    except Exception as e:
                        print(f"TRACE Error: Failed to send to {user_id}: {e}", flush=True)
                        to_cleanup.append((user_id, ws))
        
        for uid, ws in to_cleanup:
            self.disconnect(ws, uid)

manager = ConnectionManager()
