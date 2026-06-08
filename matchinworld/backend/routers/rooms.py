from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from supabase import create_client
import httpx
import os
import time

router = APIRouter()

supabase = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_SERVICE_KEY")
)

class CreateRoomRequest(BaseModel):
    booking_id: str

@router.post("/create")
async def create_room(req: CreateRoomRequest):
    result = supabase.table("bookings") \
        .select("*") \
        .eq("id", req.booking_id) \
        .single() \
        .execute()

    booking = result.data
    if not booking:
        raise HTTPException(404, "Booking not found")

    if booking.get("daily_room_url"):
        return {"url": booking["daily_room_url"]}

    async with httpx.AsyncClient() as client:
        response = await client.post(
            "https://api.daily.co/v1/rooms",
            headers={
                "Authorization": f"Bearer {os.getenv('DAILY_API_KEY')}",
                "Content-Type": "application/json",
            },
            json={
                "name": f"session-{req.booking_id[:8]}",
                "properties": {
                    "enable_screenshare": True,
                    "enable_chat": True,
                    "start_video_off": False,
                    "start_audio_off": False,
                    "exp": int(time.time()) + 60 * 60 * 24,
                }
            },
            timeout=15.0
        )

    room = response.json()
    url = room.get("url")

    if not url:
        raise HTTPException(500, "Failed to create Daily room")

    supabase.table("bookings") \
        .update({"daily_room_url": url}) \
        .eq("id", req.booking_id) \
        .execute()

    return {"url": url}