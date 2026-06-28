#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

# Načti env
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
fi

echo "🚀 Spouštím support bot..."

# Aktivuj venv pokud existuje
if [ -d ".venv" ]; then
  source .venv/bin/activate
elif [ -d "venv" ]; then
  source venv/bin/activate
fi

# Spusť server na pozadí
python3 -m uvicorn main:app --host 0.0.0.0 --port 8000 > server.log 2>&1 &
SERVER_PID=$!
echo "✅ Server běží (PID $SERVER_PID)"

# Počkej než server nastartuje
sleep 2

# Spusť ngrok na pozadí
ngrok http 8000 --log=stdout > ngrok.log 2>&1 &
NGROK_PID=$!
echo "🔗 ngrok se spouští..."

# Počkej na ngrok URL
sleep 3
NGROK_URL=$(curl -s http://localhost:4040/api/tunnels 2>/dev/null | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['tunnels'][0]['public_url'])" 2>/dev/null)

if [ -z "$NGROK_URL" ]; then
  echo "⚠️  ngrok URL se nepodařilo získat, zkus ručně: http://localhost:4040"
else
  echo "🌐 ngrok URL: $NGROK_URL"

  # Zaregistruj webhook automaticky
  WEBHOOK_URL="$NGROK_URL/telegram/webhook"
  RESULT=$(curl -s "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook?url=${WEBHOOK_URL}")
  echo "📡 Telegram webhook: $WEBHOOK_URL"
fi

echo ""
echo "✅ Vše běží! Logs:"
echo "   Server: $SCRIPT_DIR/server.log"
echo "   ngrok:  $SCRIPT_DIR/ngrok.log"
echo ""
echo "Pro zastavení: kill $SERVER_PID $NGROK_PID"
echo "Nebo zavři tento terminál a spusť: ./stop.sh"

# Ulož PID pro stop skript
echo "$SERVER_PID $NGROK_PID" > .pids

# Drž terminál živý a zobrazuj logy serveru
tail -f server.log
