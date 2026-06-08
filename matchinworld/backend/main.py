from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

load_dotenv()

from routers import match, rooms

app = FastAPI(title="MatchInWorld API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://matchinworld.vercel.app",
        "https://matchinworld.com",
        "https://www.matchinworld.com",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(match.router, prefix="/api/match", tags=["match"])
app.include_router(rooms.router, prefix="/api/rooms", tags=["rooms"])

@app.get("/")
def root():
    return {"status": "MatchInWorld API running"}