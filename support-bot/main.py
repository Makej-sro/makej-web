from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from anthropic import Anthropic
from dotenv import load_dotenv
from database import init_db, get_db
from typing import Optional
import os
import httpx

load_dotenv()

app = FastAPI(title="Makej Support Bot")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

client = Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

_prompt_path = os.path.join(os.path.dirname(__file__), "prompt.txt")
SYSTEM_PROMPT = open(_prompt_path, encoding="utf-8").read().strip()

ESCALATE_TOOL = {
    "name": "escalate_to_human",
    "description": "Předá konverzaci živému operátorovi. Použij při citlivých tématech (platba, reklamace), právních dotazech, nebo když uživatel výslovně chce mluvit s člověkem.",
    "input_schema": {
        "type": "object",
        "properties": {
            "reason": {
                "type": "string",
                "description": "Stručný důvod eskalace (pro operátora)"
            }
        },
        "required": ["reason"]
    }
}


@app.on_event("startup")
def startup():
    init_db()


class ChatRequest(BaseModel):
    conversation_id: str
    text: str


class ChatResponse(BaseModel):
    reply: str
    escalated: bool = False


def get_or_create_conversation(db, conversation_id: str):
    row = db.execute(
        "SELECT * FROM conversations WHERE id = ?", (conversation_id,)
    ).fetchone()
    if not row:
        db.execute(
            "INSERT INTO conversations (id, status) VALUES (?, 'ai_active')",
            (conversation_id,)
        )
        db.commit()
    return db.execute(
        "SELECT * FROM conversations WHERE id = ?", (conversation_id,)
    ).fetchone()


def load_history(db, conversation_id: str):
    rows = db.execute(
        "SELECT sender, text FROM messages WHERE conversation_id = ? ORDER BY created_at",
        (conversation_id,)
    ).fetchall()
    messages = []
    for row in rows:
        role = "user" if row["sender"] == "customer" else "assistant"
        messages.append({"role": role, "content": row["text"]})
    return messages


def save_message(db, conversation_id: str, sender: str, text: str):
    db.execute(
        "INSERT INTO messages (conversation_id, sender, text) VALUES (?, ?, ?)",
        (conversation_id, sender, text)
    )
    db.execute(
        "UPDATE conversations SET updated_at = datetime('now') WHERE id = ?",
        (conversation_id,)
    )
    db.commit()


async def send_telegram(text: str):
    token = os.getenv("TELEGRAM_BOT_TOKEN")
    chat_id = os.getenv("TELEGRAM_CHAT_ID")
    if not token or not chat_id:
        return
    async with httpx.AsyncClient() as c:
        await c.post(
            f"https://api.telegram.org/bot{token}/sendMessage",
            json={"chat_id": chat_id, "text": text, "parse_mode": "HTML"},
        )


async def do_escalate(db, conversation_id: str, reason: str):
    db.execute(
        "UPDATE conversations SET status = 'waiting_human', updated_at = datetime('now') WHERE id = ?",
        (conversation_id,)
    )
    db.commit()
    msg = (
        f"🚨 <b>Eskalace na člověka</b>\n"
        f"Konverzace: <code>{conversation_id}</code>\n"
        f"Důvod: {reason}\n\n"
        f"Odpověz do tohoto chatu — zpráva bude přeposlána zákazníkovi.\n"
        f"Až budeš hotov, pošli /hotovo"
    )
    await send_telegram(msg)


@app.post("/chat/message", response_model=ChatResponse)
async def chat_message(req: ChatRequest):
    if not os.getenv("ANTHROPIC_API_KEY"):
        raise HTTPException(status_code=500, detail="ANTHROPIC_API_KEY není nastaven")

    db = get_db()
    conv = get_or_create_conversation(db, req.conversation_id)

    if conv["status"] == "human_active":
        save_message(db, req.conversation_id, "customer", req.text)
        db.close()
        return ChatResponse(reply="__human_active__")

    save_message(db, req.conversation_id, "customer", req.text)

    history = load_history(db, req.conversation_id)

    response = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=1024,
        system=SYSTEM_PROMPT,
        tools=[ESCALATE_TOOL],
        messages=history,
    )

    escalated = False
    reply = ""

    for block in response.content:
        if block.type == "tool_use" and block.name == "escalate_to_human":
            escalated = True
            await do_escalate(db, req.conversation_id, block.input.get("reason", ""))
            reply = "Rozumím, předávám tě na živého operátora. Počkej chvíli, brzy se ti ozve člověk z našeho týmu. 🙏"
        elif block.type == "text":
            reply += block.text

    if not reply:
        reply = "Omlouvám se, zkus to prosím znovu."

    save_message(db, req.conversation_id, "bot", reply)
    db.close()

    return ChatResponse(reply=reply, escalated=escalated)


@app.get("/chat/messages")
async def get_messages(conversation_id: str, since: str = "2000-01-01"):
    db = get_db()
    rows = db.execute(
        "SELECT sender, text, created_at FROM messages WHERE conversation_id = ? AND created_at > ? ORDER BY created_at",
        (conversation_id, since)
    ).fetchall()
    db.close()
    return [dict(r) for r in rows]


class TelegramWebhook(BaseModel):
    message: Optional[dict] = None


@app.post("/telegram/webhook")
async def telegram_webhook(update: TelegramWebhook):
    if not update.message:
        return {"ok": True}

    text = update.message.get("text", "").strip()
    chat_id = str(update.message.get("chat", {}).get("id", ""))

    # Najdi aktivní konverzaci čekající na člověka nebo s člověkem aktivním
    db = get_db()
    conv = db.execute(
        "SELECT * FROM conversations WHERE status IN ('waiting_human', 'human_active') ORDER BY updated_at DESC LIMIT 1"
    ).fetchone()

    if not conv:
        db.close()
        return {"ok": True}

    conversation_id = conv["id"]

    if text == "/hotovo":
        db.execute(
            "UPDATE conversations SET status = 'ai_active', updated_at = datetime('now') WHERE id = ?",
            (conversation_id,)
        )
        db.commit()
        db.close()
        await send_telegram(f"✅ Konverzace <code>{conversation_id}</code> předána zpět botovi.")
        return {"ok": True}

    # Nastav status na human_active při první odpovědi
    if conv["status"] == "waiting_human":
        db.execute(
            "UPDATE conversations SET status = 'human_active', updated_at = datetime('now') WHERE id = ?",
            (conversation_id,)
        )
        db.commit()

    save_message(db, conversation_id, "human", text)
    db.close()
    return {"ok": True}


@app.get("/health")
async def health():
    return {"status": "ok", "phase": 5}
