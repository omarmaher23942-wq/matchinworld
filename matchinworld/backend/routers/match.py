from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from supabase import create_client
import httpx
import os
import json

router = APIRouter()

supabase = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_SERVICE_KEY")
)

class MatchRequest(BaseModel):
    needs: str
    lang:  str = "ar"

@router.post("/")
async def match_specialists(req: MatchRequest):
    if len(req.needs.strip()) < 10:
        raise HTTPException(400, "Needs description too short")

    result = supabase.table("specialists") \
        .select("*, users(name)") \
        .eq("kyc_status", "approved") \
        .eq("is_active", True) \
        .execute()

    specialists = result.data
    if not specialists:
        return {"matches": [], "reason": ""}

    specialists_text = "\n".join([
        f"{i+1}. ID: {s['id']} | الاسم: {s['users']['name']} | "
        f"التخصصات: {', '.join(s.get('specializations', []))} | "
        f"البيو: {(s.get('bio') or '')[:100]} | التقييم: {s.get('rating', 0)}"
        for i, s in enumerate(specialists)
    ])

    prompt = f"""أنت نظام مطابقة ذكي لمنصة استشارات.

احتياج العميل: "{req.needs}"

المتخصصون المتاحون:
{specialists_text}

رد فقط بـ JSON بهذا الشكل بدون أي نص آخر:
{{
  "matches": ["id1", "id2", "id3"],
  "reason": "سبب الاختيار بجملة واحدة"
}}"""

    async with httpx.AsyncClient() as client:
        response = await client.post(
            "https://openrouter.ai/api/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {os.getenv('OPENROUTER_API_KEY')}",
                "Content-Type": "application/json",
            },
            json={
                "model": "anthropic/claude-sonnet-4",
                "messages": [{"role": "user", "content": prompt}],
                "max_tokens": 1000,
            },
            timeout=30.0
        )

    data = response.json()
    text = data["choices"][0]["message"]["content"]
    clean = text.replace("```json", "").replace("```", "").strip()
    parsed = json.loads(clean)

    matched_ids = parsed.get("matches", [])
    reason = parsed.get("reason", "")

    matched = [
        s for mid in matched_ids
        for s in specialists if s["id"] == mid
    ][:5]

    return {"matches": matched, "reason": reason}