# Passage API server

Proxies Anthropic `/v1/messages` so the API key stays on the server, and exposes `/api/orchestrate/bank-draft` for the multi-agent bank letter flow (General → Search/knowledge → Communication → Verify).

## Setup

```bash
cd server
cp .env.example .env
# Edit .env and set ANTHROPIC_API_KEY
npm install
npm start
```

Default port: **8787**.

## Endpoints

- `GET /health` — liveness
- `POST /v1/messages` — body matches [Anthropic Messages API](https://docs.anthropic.com/en/api/messages); streams SSE when `stream: true`
- `POST /api/orchestrate/bank-draft` — JSON body with `bankName`, `acctType`, `acctNum`, `context`, `notes`, `taxContext`, `formContext`, `information: { deceasedName, executorRelationship, state }`; responds with `text/event-stream` (`trace`, `draft_delta`, `done`)

## Frontend

Open `passage-v2.html` via a local static server (or file) and set the API base if not using `http://localhost:8787`:

```html
<script>window.PASSAGE_API_BASE='https://your-host.example.com';</script>
```

Or rely on the default `http://localhost:8787` in the page script.
