// ── UTILS ──
function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

// Compact disclaimer rendered below every AI-generated letter draft.
function aiDraftNote() {
  return `<div style="font-size:11px;color:var(--text3);margin-top:4px;padding:5px 8px;border-left:2px solid var(--amber);background:rgba(255,186,0,0.04)">
    Please read through this letter carefully and make any changes before sending. This is a starting point, not legal advice.
  </div>`;
}

// ── DRAFT STORE (shared across all workflows) ──
const draftStore = {};
function setDraft(tid, txt) { draftStore[tid] = txt; }
function getDraft(tid) { return draftStore[tid] || ''; }

// ── COPY / DOWNLOAD ──
function copyText(txt) {
  navigator.clipboard.writeText(txt).then(() => {
    const el = event?.target;
    if (el) { const orig = el.textContent; el.textContent = 'Copied'; setTimeout(() => el.textContent = orig, 2000); }
  });
}

function copyDraftFor(tid) {
  let txt = getDraft(tid) || getWF(tid).draft || '';
  if (!txt) return;
  const em = document.getElementById('email-mode-' + tid);
  const wf = getWF(tid);
  if (em && em.checked && wf.data && wf.data.bankName) {
    const info = findBankContact(wf.data.bankName);
    txt = `To: ${info.dept} — ${info.name}\nSubject: Estate Notification — ${A.name || '[Name]'} — Account Holder Deceased\n\n${txt}`;
  }
  navigator.clipboard.writeText(txt).then(() => {
    const btns = document.querySelectorAll(`[data-copy-tid="${tid}"]`);
    btns.forEach(b => { const orig = b.textContent; b.textContent = 'Copied'; setTimeout(() => b.textContent = orig, 2000); });
  });
}

function downloadDraftTxt(tid) {
  let txt = getDraft(tid) || getWF(tid).draft || '';
  if (!txt) return;
  const em = document.getElementById('email-mode-' + tid);
  const wf = getWF(tid);
  if (em && em.checked && wf.data && wf.data.bankName) {
    const info = findBankContact(wf.data.bankName);
    txt = `To: ${info.dept} — ${info.name}\nSubject: Estate Notification — ${A.name || '[Name]'} — Account Holder Deceased\n\n${txt}`;
  }
  const blob = new Blob([txt], { type: 'text/plain' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'passage-letter.txt';
  a.click();
  URL.revokeObjectURL(a.href);
}

// ── STEP TRACK + SUB-CARDS (shared UI components) ──
function renderStepTrack(steps) {
  const bubbles = steps.map((s, i) =>
    `<div class="step-bubble ${s.status}">${s.status === 'done' ? '✓' : i + 1}</div>${i < steps.length - 1 ? `<div class="step-line ${s.status === 'done' ? 'done' : ''}"></div>` : ''}`
  ).join('');
  const labels = steps.map(s => `<div class="step-lbl-item ${s.status}">${s.label}</div>`).join('');
  return `<div class="step-track">${bubbles}</div><div class="step-labels">${labels}</div>`;
}

function makeSubCard(tid, key, icon, name, bodyHtml) {
  const done = !!(getWF(tid).data['done_' + key]);
  return `<div style="border:1px solid ${done ? 'var(--green)' : 'var(--border2)'};border-radius:8px;overflow:hidden;background:var(--bg3)">
    <div style="display:flex;align-items:center;gap:9px;padding:10px 13px;cursor:pointer" onclick="toggleSubCard('${tid}','${key}')">
      <div style="width:15px;height:15px;border:1.5px solid ${done ? 'var(--green)' : 'var(--border2)'};border-radius:3px;display:flex;align-items:center;justify-content:center;font-size:9px;flex-shrink:0;background:${done ? 'var(--green)' : 'transparent'};color:${done ? '#fff' : 'transparent'};cursor:pointer" onclick="event.stopPropagation();markSubDone('${tid}','${key}')">✓</div>
      <span style="font-size:15px">${icon}</span>
      <span style="font-size:13px;font-weight:500;color:var(--text);flex:1">${name}</span>
      <span style="font-size:11px;color:var(--text3)" id="subarr-${tid}-${key}">›</span>
    </div>
    <div id="subbody-${tid}-${key}" style="display:none;padding:10px 13px;border-top:1px solid var(--border);font-size:12px;color:var(--text2);line-height:1.75">${bodyHtml}</div>
  </div>`;
}

function toggleSubCard(tid, key) {
  const b = document.getElementById(`subbody-${tid}-${key}`), a = document.getElementById(`subarr-${tid}-${key}`);
  if (!b) return;
  const open = b.style.display !== 'none';
  b.style.display = open ? 'none' : 'block';
  if (a) a.style.transform = open ? 'rotate(0)' : 'rotate(90deg)';
}

function markSubDone(tid, key) {
  const wf = getWF(tid);
  wf.data['done_' + key] = !wf.data['done_' + key];
  addTrace(tid, 'verify', 'Sub-task', (wf.data['done_' + key] ? 'Completed: ' : 'Reopened: ') + key.replace(/_/g, ' '));
  renderWorkflow(selTask);
}

function depHintFor(t) {
  const n = (t.name || '').toLowerCase();
  const certTask = tasks.find(x => (x.name || '').toLowerCase().includes('death cert'));
  const certOk = !certTask || taskDone[certTask.id];
  if (!certOk && (n.includes('bank') || n.includes('financial') || n.includes('freeze'))) return 'Tip: death certificates first';
  return '';
}
