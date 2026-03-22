// ── CHAT — context-aware general assistant interface ──
let chatHistory = [], chatOpen = false, chatStreaming = false, chatTaskCtx = null;

// Parse markdown links and bare URLs from an AI response.
// Returns { body, links } where body is the text without the Sources line
// and links is an array of { label, url }.
function parseChatSources(text) {
  const links = [];

  // Extract "Sources: [Label](URL), [Label](URL)" line anywhere in the text
  const srcLine = text.match(/Sources?:\s*(.+)/i);
  let body = text;
  if (srcLine) {
    body = text.replace(srcLine[0], '').trim();
    const mdLinks = srcLine[1].matchAll(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g);
    for (const m of mdLinks) links.push({ label: m[1], url: m[2] });
  }

  // Also pull out any bare https:// URLs remaining in the body
  const urlRe = /https?:\/\/[^\s"'<>)]+/g;
  const bare = body.match(urlRe) || [];
  bare.forEach(url => {
    if (!links.some(l => l.url === url)) {
      try { links.push({ label: new URL(url).hostname.replace('www.', ''), url }); } catch (_) {}
    }
  });

  // Strip bare URLs from body text
  body = body.replace(urlRe, '').replace(/\s{2,}/g, ' ').trim();

  return { body, links };
}

// Render a finished chat response: body text + source chips if present.
function renderChatResponse(el, raw) {
  const { body, links } = parseChatSources(raw);

  // Convert line breaks to <br> for readability
  const safeBody = body.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\n/g,'<br>');

  const chipsHtml = links.length
    ? `<div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:7px">
        ${links.map(l => `<a href="${l.url}" target="_blank" rel="noopener noreferrer" class="src-chip" style="font-size:10px">↗ ${l.label}</a>`).join('')}
       </div>`
    : '';

  el.innerHTML = safeBody + chipsHtml;
}

function updateChatContext(t) {
  chatTaskCtx = t;
  const bar = document.getElementById('chat-ctx-bar');
  if (t) { bar.textContent = 'Focused on: ' + t.name; bar.classList.add('show'); } else { bar.classList.remove('show'); }
  const starters = document.getElementById('chat-starters');
  if (t && starters) {
    const n = (t.name || '').toLowerCase();
    const isBank = n.includes('bank') || n.includes('financial');
    const isSSA = n.includes('social security');
    const isVA = n.includes('veteran') || n.includes('va');
    starters.innerHTML = '';
    if (isBank) {
      ['What documents do I need to bring to the bank?', 'Can the bank freeze accounts before probate?', 'What happens to a joint bank account?'].forEach(q => { const b = document.createElement('button'); b.className = 'chat-starter'; b.textContent = q; b.onclick = () => chatAsk(q); starters.appendChild(b); });
    } else if (isSSA) {
      ['How long does it take to receive SSA survivor benefits?', 'Can I collect both my own SSA and a survivor benefit?', 'What if benefits were already paid after the date of death?'].forEach(q => { const b = document.createElement('button'); b.className = 'chat-starter'; b.textContent = q; b.onclick = () => chatAsk(q); starters.appendChild(b); });
    } else if (isVA) {
      ['What is DIC and who qualifies?', 'How long does a VA burial claim take?', 'Can children receive VA education benefits?'].forEach(q => { const b = document.createElement('button'); b.className = 'chat-starter'; b.textContent = q; b.onclick = () => chatAsk(q); starters.appendChild(b); });
    } else {
      ['What do I need to include in this letter?', 'How long does this typically take?', 'What if they do not respond?'].forEach(q => { const b = document.createElement('button'); b.className = 'chat-starter'; b.textContent = q; b.onclick = () => chatAsk(q); starters.appendChild(b); });
    }
  }
}

function toggleChat() {
  chatOpen = !chatOpen;
  document.getElementById('chat-panel').classList.toggle('open', chatOpen);
  document.getElementById('chat-fab').classList.toggle('open', chatOpen);
  document.getElementById('chat-fab').textContent = chatOpen ? '✕' : '💬';
  if (chatOpen) setTimeout(() => document.getElementById('chat-input').focus(), 200);
}

function chatAsk(q) {
  document.getElementById('chat-starters').style.display = 'none';
  document.getElementById('chat-input').value = q;
  sendChat();
}

async function sendChat() {
  const input = document.getElementById('chat-input');
  const q = (input.value || '').trim();
  if (!q || chatStreaming) return;
  input.value = '';
  document.getElementById('chat-starters').style.display = 'none';
  const msgs = document.getElementById('chat-msgs');
  const uEl = document.createElement('div'); uEl.className = 'chat-msg user'; uEl.textContent = q; msgs.appendChild(uEl); msgs.scrollTop = msgs.scrollHeight;
  const aEl = document.createElement('div'); aEl.className = 'chat-msg ai streaming'; msgs.appendChild(aEl); msgs.scrollTop = msgs.scrollHeight;
  chatHistory.push({ role: 'user', content: q });
  chatStreaming = true; document.getElementById('chat-send').disabled = true;

  // Guardrail 1 — General Assistant scope check
  const lower = q.toLowerCase();
  const matchedPattern = GUARDRAIL_PATTERNS.find(p => lower.includes(p.pattern || p));
  if (matchedPattern) {
    await delay(600);
    const rule = matchedPattern.rule || 'Scope policy';
    const guard = "That is outside the scope of what I can help with here. My role is to help you administer the estate properly and legally. If you have concerns about asset distribution, contesting the will, or tax avoidance strategies, an estate attorney is the right person to speak with. Would you like help finding one, or shall we continue with the next task?";
    aEl.textContent = guard; aEl.classList.remove('streaming'); chatHistory.push({ role: 'assistant', content: guard });
    chatStreaming = false; document.getElementById('chat-send').disabled = false;
    const traceId = selTask ? selTask.id : 'global';
    addTrace(traceId, 'warn', 'We redirected that question',
      `That question is outside what we can help with here. An estate attorney is the right person for that.`,
      null, rule);
    return;
  }

  const taskCtx = chatTaskCtx ? `Current task: "${chatTaskCtx.name}" (${chatTaskCtx.institution || chatTaskCtx.category}).` : '';
  const ctx = `Estate: ${A.name || 'unknown'}, ${A.rel || 'unknown'}, ${A.state || 'unknown'}. Assets: ${(A.assets || []).join(', ') || 'unknown'}. Benefits: ${(A.benefits || []).join(', ') || 'unknown'}. Survivors: ${(A.survivors || []).join(', ') || 'none'}. ${taskCtx}`;
  try {
    const r = await anthropicFetch({
      model: 'claude-sonnet-4-20250514', max_tokens: 500, stream: true,
      system: `You are a compassionate estate specialist. Warm, clear, brief. 2 to 4 sentences unless more is needed. If someone is currently working on a task, answer in the context of that task specifically. Do not use em dashes. Do not mention artificial intelligence.

IMPORTANT — Source citations: At the very end of every response, add a Sources line with at least one official government or institutional URL that directly supports what you said. Format it exactly like this:
Sources: [Label](https://url)
Only cite real .gov websites or well-known institutional sites (SSA.gov, IRS.gov, VA.gov, DOL.gov, Medicare.gov, USA.gov, etc.). Never invent URLs. If you are uncertain of the exact URL, use a top-level domain like https://www.ssa.gov rather than a deep page link. ${ctx}`,
      messages: chatHistory,
    });
    const reader = r.body.getReader(), dec = new TextDecoder(); let txt = '';
    while (true) {
      const { done: d, value } = await reader.read(); if (d) break;
      for (const line of dec.decode(value).split('\n')) {
        if (!line.startsWith('data: ')) continue;
        const raw = line.slice(6); if (raw === '[DONE]') continue;
        try {
          const j = JSON.parse(raw);
          if (j.type === 'content_block_delta' && j.delta?.text) {
            txt += j.delta.text;
            aEl.textContent = txt;
            msgs.scrollTop = msgs.scrollHeight;
          }
        } catch (e) { }
      }
    }
    aEl.classList.remove('streaming');
    renderChatResponse(aEl, txt);
    chatHistory.push({ role: 'assistant', content: txt });
    msgs.scrollTop = msgs.scrollHeight;
  } catch (e) { aEl.textContent = 'Something went wrong. Please try again.'; aEl.classList.remove('streaming'); }
  chatStreaming = false; document.getElementById('chat-send').disabled = false;
}
