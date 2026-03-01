# Family Finance Tracker

A warm, self-hosted finance tracker for households that want to stay on top of spending — without the spreadsheet headaches.

Built for couples and families who share expenses, this app makes daily tracking quick and painless, and turns end-of-month credit card reconciliation from a chore into a few clicks.

No cloud accounts. No subscriptions. Your data stays on your hardware.

## What it does

- **Quick daily entry** — Add an expense in seconds from your phone. Pick a category, tap who paid, done.
- **Monthly CSV import** — Upload credit card statements and match them against your manual entries. The app auto-matches what it can and flags the rest for a quick review.
- **Dashboard that feels like "our month"** — See how you spent together, category breakdowns, your biggest expenses, and how this month stacks up against your average.
- **Recurring expenses** — Set up rent, subscriptions, and utilities once. Generate them each month with one tap.
- **Voice entry** *(optional)* — Say "Groceries at Trader Joe's forty-two dollars" and the form fills itself in. Runs locally via Whisper.
- **Receipt scanning** *(optional)* — Snap a photo of a receipt and let a local LLM pull out the amount, merchant, and date.

## Philosophy

This is a finance app for people building a life together, not roommates splitting rent. The language is warm ("Together you spent $3,200 this month"), the math is transparent, and nothing leaves your network.

AI features (receipt scanning, voice entry, smart categorization) are **fully optional** and run locally via [Ollama](https://ollama.com) and [Whisper.cpp](https://github.com/ggerganov/whisper.cpp). The app works perfectly without them.

## Tech stack

- **Next.js 15** (App Router, Server Components, Server Actions)
- **SQLite** via better-sqlite3 (single file, no database server)
- **Tailwind CSS** + **shadcn/ui**
- **Ollama** + Llama 3.2 Vision (optional, for receipt scanning and CSV categorization)
- **Whisper.cpp** (optional, for voice-to-text entry)

## Getting started

### Prerequisites

- Node.js 20+
- npm

### Quick start

```bash
# Clone the repo
git clone https://github.com/your-username/family-finance-tracker.git
cd family-finance-tracker

# Install dependencies
npm install

# Set up environment
cp .env.example .env

# Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and follow the setup wizard to create your household.

### Docker (recommended for always-on servers)

```bash
docker compose up -d
```

This runs the app on port 3000 with a persistent SQLite volume. Ideal for a Mac Mini, Raspberry Pi, NAS, or any always-on home server.

To access from outside your network, pair with [Tailscale](https://tailscale.com) or [Cloudflare Tunnel](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/).

## Configuration

Copy `.env.example` to `.env` and adjust as needed:

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_PATH` | `./data/finance.db` | Path to the SQLite database file |
| `OLLAMA_URL` | `http://localhost:11434` | Ollama server URL (optional) |
| `OLLAMA_MODEL` | `llama3.2` | Model for text tasks (optional) |
| `OLLAMA_VISION_MODEL` | `llama3.2-vision` | Model for receipt scanning (optional) |
| `WHISPER_PATH` | — | Path to whisper-cpp binary (optional) |
| `WHISPER_MODEL` | `small` | Whisper model size (optional) |

## Optional: local AI setup

### Receipt scanning & smart categorization

```bash
# Install Ollama
curl -fsSL https://ollama.com/install.sh | sh

# Pull the vision model (~8GB)
ollama pull llama3.2-vision
```

### Voice entry

Install [whisper.cpp](https://github.com/ggerganov/whisper.cpp) and download the `small` model (~500MB). Set `WHISPER_PATH` in your `.env` to the binary location.

## Project structure

```
src/
  app/              # Next.js App Router pages and API routes
  components/       # React components (dashboard, expenses, import, etc.)
  lib/
    dal/            # Data Access Layer (all database queries)
    services/       # Business logic (settlement, reconciliation, CSV parsing)
    ai/             # Optional AI integrations (Ollama, Whisper)
    db/             # Schema, migrations, seeding
    auth/           # Cookie-based session management
    utils/          # Currency formatting, date helpers
```

## License

MIT
