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
passage-v2.html         # App shell — HTML + CSS only, no inline JS
js/
  state.js              # Global state and localStorage persistence
  guardrails.js         # Client-side PII detection and scope guardrails
  knowledge.js          # Curated legal citations, official URLs, task options
  utils.js              # Shared helpers (AI draft disclaimer, delay, etc.)
  agents.js             # Agent trace rendering, send modal, toast notifications
  tasks.js              # Deterministic task generation + AI enrichment
  onboarding.js         # Intake flow, document upload, PII obfuscation
  chat.js               # Context-aware chat panel with source citation parsing
  render.js             # Workflow dispatcher, options panel, link chips
  main.js               # App entry point
  workflows/
    bank.js             # Multi-step bank notification workflow
    other.js            # Employer, SSA, VA, life insurance, streaming, generic workflows
server/
  index.js              # Express API: Anthropic proxy + bank orchestration
  knowledge/banks.json  # Institution contact knowledge base
  lib/knowledge.js      # findBankContact() helper
  lib/guardrails.js     # Server-side blocked-phrase list
  package.json
  .env.example
  README.md             # Server-specific setup notes
```

---

## Running locally

You need two terminals running at the same time.

**Terminal 1 — Backend (API proxy, port 8787):**

```bash
cd server
cp .env.example .env          # first time only
# open .env and set ANTHROPIC_API_KEY=sk-ant-...
npm install                   # first time only
npm run dev
```

**Terminal 2 — Frontend (static file server):**

```bash
cd /path/to/yel               # the project root (where passage-v2.html lives)
npx serve .
```

Then open `http://localhost:3000/passage-v2.html` in your browser.

**To reset and start fresh from onboarding**, run this in the browser console:

```javascript
localStorage.clear(); location.reload();
```

To point the frontend at a different API URL without editing source files, add this before the script tags load:

```html
<script>window.PASSAGE_API_BASE = 'https://your-api.example.com';</script>
```

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
