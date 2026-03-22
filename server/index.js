import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { findBankContact } from './lib/knowledge.js';
import { shouldBlockUserMessage } from './lib/guardrails.js';

const PORT = Number(process.env.PORT) || 8787;
const ANTHROPIC = 'https://api.anthropic.com/v1/messages';

const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '2mb' }));

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'passage-server' });
});

/** Anthropic-compatible streaming proxy — API key stays server-side */
app.post('/v1/messages', async (req, res) => {
  if (!process.env.ANTHROPIC_API_KEY) {
    res.status(503).json({ error: 'ANTHROPIC_API_KEY not configured on server' });
    return;
  }
  try {
    const upstream = await fetch(ANTHROPIC, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': req.headers['anthropic-version'] || '2023-06-01',
      },
      body: JSON.stringify(req.body),
    });
    const ct = upstream.headers.get('content-type');
    if (ct) res.setHeader('Content-Type', ct);
    res.status(upstream.status);
    if (!upstream.body) {
      const t = await upstream.text();
      res.send(t);
      return;
    }
    const reader = upstream.body.getReader();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      res.write(Buffer.from(value));
    }
    res.end();
  } catch (e) {
    console.error('proxy error', e);
    if (!res.headersSent) res.status(500).json({ error: 'Proxy failed' });
  }
});

/**
 * Multi-agent bank draft: General → Search (knowledge) → Communication (stream) → Verify
 * Streams SSE: { type: 'trace'|'draft_delta'|'done', ... }
 */
app.post('/api/orchestrate/bank-draft', async (req, res) => {
  if (!process.env.ANTHROPIC_API_KEY) {
    res.status(503).json({ error: 'ANTHROPIC_API_KEY not configured' });
    return;
  }
  const body = req.body || {};
  const lastUserChat = body.lastUserMessage || '';
  if (shouldBlockUserMessage(lastUserChat)) {
    res.status(400).json({ error: 'blocked', message: 'Request blocked by policy' });
    return;
  }

  const {
    bankName = '',
    acctType = '',
    acctNum = '',
    context = '',
    notes = '',
    taxContext = '',
    formContext = '',
    information = {},
  } = body;

  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  const send = (obj) => {
    res.write(`data: ${JSON.stringify(obj)}\n\n`);
  };

  const info = findBankContact(bankName);
  send({
    type: 'trace',
    traceType: 'step',
    label: 'General assistant',
    text: `Coordinating bank notification for ${bankName || 'institution'}.`,
  });
  send({
    type: 'trace',
    traceType: 'action',
    label: 'Search agent',
    text: `Knowledge repository: matched ${info.name} — ${info.dept}. Reference: estate services directory (no web crawl; curated allowlist).`,
  });

  const deceased = information.deceasedName || '';
  const executor = information.executorRelationship || '';
  const state = information.state || '';
  const today = new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const userContent = `Draft a bank estate notification letter.
Bank: ${info.name}
Department: ${info.dept}
Account type: ${acctType || 'not specified'}
Account last 4 digits: ${acctNum ? `ending in ${acctNum}` : 'not specified'}
Context: ${context || 'none'}
Deceased: ${deceased || '[name]'}
State: ${state || '[state]'}
Executor: ${executor || '[relationship]'}
Date: ${today}
Additional notes: ${notes || 'none'}${taxContext}${formContext}`;

  let draft = '';
  try {
    const upstream = await fetch(ANTHROPIC, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 800,
        stream: true,
        system:
          'You are a compassionate estate specialist. Draft a professional, warm bank estate notification letter. Use plain language. Formal but kind. Use [brackets] only for genuinely unknown info. Sign from executor perspective. Do not use em dashes. Do not mention artificial intelligence.',
        messages: [{ role: 'user', content: userContent }],
      }),
    });

    if (!upstream.ok || !upstream.body) {
      send({ type: 'error', message: await upstream.text() });
      send({ type: 'done', fullDraft: '', error: true });
      res.end();
      return;
    }

    send({
      type: 'trace',
      traceType: 'action',
      label: 'Communication agent',
      text: 'Streaming public-facing letter draft…',
    });

    const reader = upstream.body.getReader();
    const dec = new TextDecoder();
    let buffer = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += dec.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';
      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const raw = line.slice(6);
        if (raw === '[DONE]') continue;
        try {
          const j = JSON.parse(raw);
          if (j.type === 'content_block_delta' && j.delta?.text) {
            draft += j.delta.text;
            send({ type: 'draft_delta', text: j.delta.text });
          }
        } catch {
          /* ignore */
        }
      }
    }
  } catch (e) {
    console.error('orchestrate draft error', e);
    send({ type: 'error', message: String(e.message || e) });
    send({ type: 'done', fullDraft: draft, error: true });
    res.end();
    return;
  }

  send({
    type: 'trace',
    traceType: 'verify',
    label: 'Verify agent',
    text: 'Checking draft against information repository (names, placeholders, sensitive patterns)…',
  });

  const issues = [];
  if (deceased && draft && !draft.toLowerCase().includes(deceased.toLowerCase().split(' ')[0])) {
    issues.push('Deceased first name may be missing or mismatched');
  }
  if (/\b\d{3}-\d{2}-\d{4}\b/.test(draft)) issues.push('Possible full SSN in draft');
  if (/\b\d{8,17}\b/.test(draft) && draft.toLowerCase().includes('account')) {
    issues.push('Possible full account number; last 4 only');
  }

  send({
    type: 'trace',
    traceType: 'verify',
    label: 'Verify agent',
    text:
      issues.length > 0
        ? `Review needed: ${issues.join('; ')}`
        : 'Passed automated checks. Human review still required before sending.',
  });

  send({ type: 'done', fullDraft: draft });
  res.end();
});

app.listen(PORT, () => {
  console.log(`Passage server http://localhost:${PORT}`);
});
