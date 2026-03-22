// ── AGENT TRACE ──
const traceEvents = {};

// ruleRef (optional): the specific statute/regulation/guardrail that drove this event.
function addTrace(tid, type, label, text, href, ruleRef) {
  if (!traceEvents[tid]) traceEvents[tid] = [];
  traceEvents[tid].push({
    type, label, text, href, ruleRef,
    ts: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
  });
  renderTrace(tid);
}

function renderTrace(tid) {
  _renderInlineStrip(tid);
  _renderTraceTab();
}

// Compact pill strip rendered inside the task's workflow panel.
// Shows only step labels — no detail text, no hrefs, no rule refs.
function _renderInlineStrip(tid) {
  const el = document.getElementById('task-trace-' + tid);
  if (!el) return;
  const events = (traceEvents[tid] || []);
  if (!events.length) { el.innerHTML = ''; return; }
  el.innerHTML = events.map(e => {
    const icon = e.type === 'verify' ? '✓' : e.type === 'warn' ? '⚠' : '›';
    return `<span class="trace-pill ${e.type}">${icon} ${e.label}</span>`;
  }).join('');
}

// Full grouped view in the Agent Trace tab — all fields, citation chips, rule refs.
function _renderTraceTab() {
  const container = document.getElementById('tab-trace-content');
  if (!container) return;

  const allTids = Object.keys(traceEvents).filter(id => id !== 'global' && traceEvents[id].length);
  const globalEvents = traceEvents['global'] || [];

  if (!allTids.length && !globalEvents.length) {
    container.innerHTML = '<div class="atrace-empty">Agent trace will appear here as you work through tasks.<br/>Each step the AI takes — including sources and legal references — is recorded here.</div>';
    return;
  }

  const uid = () => Math.random().toString(36).slice(2, 8);

  function renderEventList(events) {
    return events.map(e => {
      const citeHtml = e.href
        ? `<div class="atrace-cite"><a href="${e.href.startsWith('http') ? e.href : 'https://' + e.href}" target="_blank" rel="noopener" class="src-chip" style="font-size:10px">↗ ${e.href.replace(/^https?:\/\//, '').split('/')[0]}</a></div>`
        : '';
      const ruleId = uid();
      const ruleHtml = e.ruleRef
        ? `<div style="margin-top:3px">
             <button class="acc-toggle" style="padding:2px 0;font-size:9px" onclick="var b=document.getElementById('arule-${ruleId}');b.classList.toggle('open');this.querySelector('.acc-arrow').style.transform=b.classList.contains('open')?'rotate(90deg)':''">
               <span>Legal reference</span><span class="acc-arrow">›</span>
             </button>
             <div id="arule-${ruleId}" class="acc-body" style="font-size:9px;color:var(--text3);font-style:italic;line-height:1.5">${e.ruleRef}</div>
           </div>`
        : '';
      const typeColor = e.type === 'verify' ? 'var(--green)' : e.type === 'warn' ? 'var(--amber)' : 'var(--text3)';
      return `<div class="atrace-event">
        <div class="atrace-event-hdr">
          <span class="atrace-label" style="color:${typeColor}">${e.type === 'verify' ? '✓ ' : e.type === 'warn' ? '⚠ ' : '› '}${e.label}</span>
          <span class="atrace-ts">${e.ts}</span>
        </div>
        <div class="atrace-detail">${e.text}</div>
        ${citeHtml}${ruleHtml}
      </div>`;
    }).join('');
  }

  let html = '';

  // Global events (startup, task generation) shown first
  if (globalEvents.length) {
    html += `<div class="atrace-task">
      <div class="atrace-task-hdr">System <span class="atrace-count">${globalEvents.length} event${globalEvents.length !== 1 ? 's' : ''}</span></div>
      <div class="atrace-events">${renderEventList(globalEvents)}</div>
    </div>`;
  }

  // Per-task groups
  allTids.forEach(tid => {
    const events = traceEvents[tid];
    const task = (typeof tasks !== 'undefined' ? tasks : []).find(t => String(t.id) === String(tid));
    const taskName = task ? task.name : 'Task ' + tid;
    html += `<div class="atrace-task">
      <div class="atrace-task-hdr">${taskName} <span class="atrace-count">${events.length} event${events.length !== 1 ? 's' : ''}</span></div>
      <div class="atrace-events">${renderEventList(events)}</div>
    </div>`;
  });

  container.innerHTML = html;
}

// ── TAB SWITCHING ──
function switchDashTab(name) {
  ['checklist', 'trace'].forEach(n => {
    const btn = document.getElementById('dtab-' + n);
    const pane = document.getElementById('tab-' + n);
    const active = n === name;
    if (btn) btn.classList.toggle('active', active);
    if (pane) pane.classList.toggle('active', active);
  });
  // Refresh trace tab content when opened so it always shows the latest events
  if (name === 'trace') _renderTraceTab();
}

// ── GENERAL ASSISTANT ──
// Called at the start of every task action. Applies Guardrail 1, logs delegation decision.
// Returns false if the task is blocked; true if safe to proceed.
function generalAssistantStart(tid, taskName, agentTarget) {
  const taskLower = (taskName || '').toLowerCase();
  const matchedPattern = GUARDRAIL_PATTERNS.find(p => taskLower.includes(p.pattern || p));
  if (matchedPattern) {
    const rule = matchedPattern.rule || 'Outside supported scope';
    addTrace(tid, 'warn', 'We cannot help with that',
      `This particular request is outside what we can assist with here. If you have questions about asset distribution or legal disputes, an estate attorney would be the right person to speak with.`,
      null, rule);
    return false;
  }
  addTrace(tid, 'step', 'Getting started',
    `Preparing to help with "${taskName}".`,
    null, null);
  return true;
}

// ── TOAST NOTIFICATION ──
function showToast(message, duration = 4500) {
  const el = document.getElementById('toast');
  if (!el) return;
  el.textContent = message;
  el.classList.add('show');
  clearTimeout(window._toastTimer);
  window._toastTimer = setTimeout(() => el.classList.remove('show'), duration);
}

// ── SEND CONFIRMATION MODAL (human review before sending) ──
function traceAndOpenSendModal(tid, onConfirmCallback) {
  const draft = getDraft(tid) || (getWF(tid) && getWF(tid).draft) || '';
  const issues = checkSensitivity(draft);
  if (issues.length) {
    issues.forEach(i => {
      addTrace(tid,
        i.sev === 'error' ? 'warn' : 'step',
        i.sev === 'error' ? 'Please fix before sending' : 'Something to check',
        i.msg,
        null,
        i.rule || null
      );
    });
  } else {
    addTrace(tid, 'verify', 'Letter looks good',
      'We checked for sensitive personal information and did not find anything that needs to be removed. Please read through the letter one more time before sending.',
      null, null);
  }
  openSendModal(tid, onConfirmCallback);
}

// ── SEND CONFIRMATION MODAL (Guardrail 4 — human oversight) ──
// Opens the review-before-sending gate for any public-facing communication.
function openSendModal(tid, onConfirmCallback) {
  const draft = getDraft(tid) || (getWF(tid) && getWF(tid).draft) || '';
  const issues = checkSensitivity(draft);
  const errors = issues.filter(i => i.sev === 'error');
  const warns = issues.filter(i => i.sev === 'warn');
  const blocked = errors.length > 0;

  let issueHtml = '';
  if (errors.length) issueHtml += errors.map(i =>
    `<div style="display:flex;gap:6px;align-items:flex-start;margin-bottom:4px"><span style="color:var(--red);flex-shrink:0">✕</span><span style="color:var(--red)">${i.msg}</span></div>`
  ).join('');
  if (warns.length) issueHtml += warns.map(i =>
    `<div style="display:flex;gap:6px;align-items:flex-start;margin-bottom:4px"><span style="color:var(--amber);flex-shrink:0">⚠</span><span style="color:var(--text2)">${i.msg}</span></div>`
  ).join('');
  document.getElementById('send-modal-issues').innerHTML =
    issueHtml || '<div style="color:var(--green)">✓ No sensitive information detected in this communication.</div>';

  document.getElementById('send-modal-intake').innerHTML =
    `<div><strong>Deceased:</strong> ${A.name || '—'}</div><div><strong>State:</strong> ${A.state || '—'}</div><div><strong>Your role:</strong> ${A.rel || '—'}</div>`;

  document.getElementById('send-modal-checks').innerHTML = [
    'I have read this communication in full and confirm it is accurate and free of misrepresentations.',
    'No sensitive personal information (such as a full SSN or account number) is included.',
    'I am acting as executor for this estate and take responsibility for this communication.',
  ].map((lbl, i) =>
    `<label class="send-check"><input type="checkbox" class="send-chk" id="schk-${i}" onchange="evalSendChecks()" ${blocked ? 'disabled' : ''}>${lbl}</label>`
  ).join('');

  document.getElementById('send-modal-confirm').disabled = true;
  document.getElementById('send-modal-blocked-msg').style.display = blocked ? 'block' : 'none';

  window._sendModalCallback = onConfirmCallback;
  window._sendModalBlocked = blocked;
  document.getElementById('send-modal').style.display = 'flex';
}

function evalSendChecks() {
  if (window._sendModalBlocked) return;
  const allChecked = Array.from(document.querySelectorAll('.send-chk')).every(c => c.checked);
  document.getElementById('send-modal-confirm').disabled = !allChecked;
}

function closeSendModal() {
  document.getElementById('send-modal').style.display = 'none';
  window._sendModalCallback = null;
}

function confirmSend() {
  const cb = window._sendModalCallback;
  const institution = selTask ? (selTask.institution || selTask.name || 'the institution') : 'the institution';
  closeSendModal();
  if (cb) cb();
  addTrace(selTask ? selTask.id : 'global', 'verify', 'Ready to send',
    `You confirmed the letter is accurate. Copy it and send it to ${institution}.`, null, null);
  showToast(`✓ Letter copied to clipboard. Open your email and send it to ${institution}.`);
}
