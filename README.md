# LastMile — Estate Guide

LastMile is a compassionate, AI-powered estate administration guide that walks executors and family members through every step of settling a loved one's estate. It generates a personalized, prioritized task list, drafts letters and notifications, and tracks progress — all in a private, session-based interface.

Built at **EmpireHacks 2026** (Cornell Tech × Columbia × Gona Semiconductors) using the Anthropic API.

---

## What it does

After a brief intake (relationship, state, assets, digital accounts, benefits), Passage:

- **Generates a tailored checklist** — 18–26 tasks across Government & Legal, Financial Accounts, Property, Digital, Notifications, and Survivor Benefits.
- **Guides each task step-by-step** — bank notifications, employer HR letters, life insurance claims, SSA/VA workflows, streaming service cancellations, and more.
- **Drafts public-facing letters** — streaming, word-by-word, ready to copy or download.
- **Checks every draft** — privacy check (SSN/account number detection), ground-truth verification against your intake, and an Agent trace showing each AI step.
- **Escalates appropriately** — flags probate, out-of-state real estate, estate tax, and refers to bar associations and CPAs by state.
- **Tracks progress** — death certificate copy counts, institution response log, deadline reminders, and print-to-PDF export.
- **Saves and resumes** — all state lives in `localStorage`; close the tab and come back where you left off.

---

## Repository structure

```
passage-v2.html         # Full browser app (one file, no build step)
server/
  index.js              # Express API: Anthropic proxy + bank orchestration
  knowledge/banks.json  # Institution contact knowledge base
  lib/knowledge.js      # findBankContact() helper
  lib/guardrails.js     # Server-side blocked-phrase list
  package.json
  .env.example
  README.md             # Server-specific setup notes
IMPLEMENTATION_GUIDE.md # Full architecture, flow, and functionality reference
V2_BACKLOG.md           # Deferred V2 features
```

---

## Quick start

### Frontend only (no backend)

Open `passage-v2.html` in a browser. The app will call `http://localhost:8787` by default for AI features — run the server (below) before generating tasks or drafting letters.

To point the frontend at a different URL without editing the HTML, add this before the page loads:

```html
<script>window.PASSAGE_API_BASE = 'https://your-api.example.com';</script>
```

### Backend (recommended)

```bash
cd server
cp .env.example .env
# Set ANTHROPIC_API_KEY in .env
npm install
npm start
# Server runs on http://localhost:8787
```

Then open `passage-v2.html` — all model calls route through the server. The API key is never sent to the browser.

---

## API endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/health` | Liveness check |
| `POST` | `/v1/messages` | Anthropic proxy (supports streaming) |
| `POST` | `/api/orchestrate/bank-draft` | Multi-agent bank letter pipeline (SSE) |

### Multi-agent pipeline (`/api/orchestrate/bank-draft`)

Streams Server-Sent Events: each event has a `type` of `trace`, `draft_delta`, or `done`.

```
General assistant → Search agent (knowledge repo) → Communication agent (streaming draft) → Verify agent (checks)
```

Each step emits a trace event that feeds the **Agent trace** column in the UI.

---

## Environment variables

| Variable | Description |
|----------|-------------|
| `ANTHROPIC_API_KEY` | Required. Your Anthropic API key. |
| `PORT` | Optional. Defaults to `8787`. |

---

## How to host

**Frontend** — any static host:
- [Netlify](https://netlify.com), [Vercel](https://vercel.com), or [Cloudflare Pages](https://pages.cloudflare.com): connect the repo, set publish directory to `/`, set the default page to `passage-v2.html` (or rename it `index.html`).
- [GitHub Pages](https://pages.github.com): enable Pages on `main` or `/docs`.

**Backend** — any Node-capable platform:
- [Railway](https://railway.app), [Render](https://render.com), [Fly.io](https://fly.io), or [Google Cloud Run](https://cloud.google.com/run): deploy the `server/` directory, set `ANTHROPIC_API_KEY` as a secret.
- [Cloudflare Workers](https://workers.cloudflare.com): good for a thin proxy; the full orchestration pipeline is easier on Node/FastAPI.

Set `window.PASSAGE_API_BASE` in the frontend to your deployed API URL, and tighten the `Access-Control-Allow-Origin` on the server to your static site's origin.

---

## Design principles

- **Privacy first** — nothing is stored on a server in this prototype; all sensitive data lives in the browser session and localStorage only.
- **Placeholders over invention** — AI drafts use `[brackets]` for any unknown field rather than generating plausible-sounding but unverified information.
- **Human in the loop** — every letter requires the user to review and manually send; no automated submissions.
- **Guardrails** — inappropriate or off-topic requests (e.g. "how do I get more from the will") are redirected with a fixed, compassionate response.
- **Escalation** — complex legal situations (probate, out-of-state property, estate tax) surface lawyer and CPA referrals automatically.

---

## Tech stack

| Piece | Technology |
|-------|-----------|
| UI | Vanilla HTML/CSS/JavaScript |
| Fonts | Playfair Display + DM Sans (Google Fonts) |
| AI | Anthropic `claude-sonnet-4-20250514` |
| Server | Node.js + Express |
| Persistence | Browser localStorage |
