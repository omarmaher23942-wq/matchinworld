from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import Dict, List
import json

router = APIRouter()

# rooms: {room_id: [websocket1, websocket2]}
rooms: Dict[str, List[WebSocket]] = {}

@router.websocket("/ws/{room_id}/{user_id}")
async def websocket_endpoint(websocket: WebSocket, room_id: str, user_id: str):
    await websocket.accept()
    
    if room_id not in rooms:
        rooms[room_id] = []
    
    rooms[room_id].append(websocket)
    
    try:
        # أخبر الباقيين إن حد جديد دخل
        await broadcast(room_id, websocket, {
            "type": "user-joined",
            "user_id": user_id
        })
        
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            message["from"] = user_id
            
            # بعت للباقيين بس مش للمرسل
            await broadcast(room_id, websocket, message)
            
    except WebSocketDisconnect:
        rooms[room_id].remove(websocket)
        if not rooms[room_id]:
            del rooms[room_id]
        else:
            await broadcast(room_id, websocket, {
                "type": "user-left",
                "user_id": user_id
            })

async def broadcast(room_id: str, sender: WebSocket, message: dict):
    if room_id not in rooms:
        return
    for ws in rooms[room_id]:
        if ws != sender:
            try:
                await ws.send_text(json.dumps(message))
            except:
                pass