# SmartDesk AI — Capstone Demo (Joe's Barbershop)

A React chat widget powered by the Anthropic Claude API, embedded on a demo
business website. The widget acts as the AI front desk for Joe's Barbershop
in Mountain Top, PA.

## Architecture

- `src/App.jsx` — Demo site + chat widget (React + Vite)
- `api/chat.js` — Vercel serverless function. Holds the Anthropic API key
  server-side and the business "agent configuration" (system prompt).
  The browser never sees your key.

## Run locally

```bash
npm install
npm install -g vercel        # Vercel CLI (runs the api/ function locally too)
vercel dev
```

Create a `.env` file (or use `vercel env`) with:

```
ANTHROPIC_API_KEY=sk-ant-...
```

## Deploy to Vercel (public URL)

1. Get an API key at https://console.anthropic.com (Settings → API Keys).
   Add a few dollars of credit — a demo costs pennies.
2. Push this folder to a GitHub repo.
3. Go to https://vercel.com → Add New → Project → import the repo.
   Vercel auto-detects Vite; the `api/` folder becomes serverless functions
   automatically. No config needed.
4. Before deploying, open Environment Variables and add:
   `ANTHROPIC_API_KEY` = your key.
5. Click Deploy. You'll get a URL like `https://smartdesk-ai-demo.vercel.app`.

Alternative without GitHub: `npm i -g vercel`, then `vercel` in this folder,
then `vercel env add ANTHROPIC_API_KEY production`, then `vercel --prod`.

## Customizing the agent

Edit `SYSTEM_PROMPT` in `api/chat.js` — this is the "agent configuration"
that your SaaS dashboard would eventually generate per business.

## Demo tips

- Test the live URL on the presentation room's wifi beforehand.
- Good script: ask hours → ask price → ask "can I book a haircut Saturday?"
  → give a time → show that it collects the request without fake-confirming.
- Keep a phone hotspot as backup internet.
