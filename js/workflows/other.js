// ── STREAMING WORKFLOW ──
function streamingWorkflow(t, wf) {
  const digital = A.digital || [];
  const svcs = digital.filter(d => d.includes('Netflix') || d.includes('streaming') || d.includes('Hulu') || d.includes('Amazon') || d.includes('Spotify') || d.includes('LinkedIn'));
  const all = [...svcs];
  if (!all.length) all.push('Streaming / subscriptions');
  return `<div style="margin-top:2px">
    <div class="slbl" style="margin-bottom:8px">Click a service to see how to cancel it</div>
    <div style="display:flex;flex-direction:column;gap:6px">
      ${all.map(svc => {
        const info = matchStreaming(svc);
        const key = svc.replace(/\s\/\s.*/, '').trim();
        const isDone = !!(wf.data['done_' + key]);
        return `<div style="border:1px solid ${isDone ? 'var(--green)' : 'var(--border2)'};border-radius:8px;overflow:hidden;background:var(--bg3)">
          <div style="display:flex;align-items:center;gap:9px;padding:10px 13px;cursor:pointer" onclick="toggleStreamSvc('${t.id}','${key}')">
            <div style="width:15px;height:15px;border:1.5px solid ${isDone ? 'var(--green)' : 'var(--border2)'};border-radius:3px;display:flex;align-items:center;justify-content:center;font-size:9px;flex-shrink:0;background:${isDone ? 'var(--green)' : 'transparent'};color:${isDone ? '#fff' : 'transparent'};cursor:pointer" onclick="event.stopPropagation();toggleStreamDone('${t.id}','${key}')">✓</div>
            <span style="font-size:16px">${info.icon}</span>
            <span style="font-size:13px;font-weight:500;color:var(--text);flex:1">${key}</span>
            <span style="font-size:11px;color:var(--text3);transition:transform .2s" id="sarr-${t.id}-${key}">›</span>
          </div>
          <div id="sbody-${t.id}-${key}" style="display:none;padding:10px 13px;border-top:1px solid var(--border);font-size:12px;color:var(--text2);line-height:1.75">
            <p><strong style="color:var(--text)">How to cancel:</strong> ${info.how}</p>
            <p style="margin-top:7px;background:rgba(212,137,58,0.07);border:1px solid rgba(212,137,58,0.16);border-radius:5px;padding:7px 10px;color:var(--amber)"><strong>For bereavement:</strong> ${info.bere}</p>
            <div style="display:flex;gap:6px;margin-top:8px;flex-wrap:wrap">
              <button class="sa-btn primary" onclick="draftStreamCancel('${t.id}','${key}')">Prepare cancellation message</button>
              <button class="sa-btn" style="border-color:var(--green);color:var(--green)" onclick="toggleStreamDone('${t.id}','${key}');event.stopPropagation()">Mark done</button>
            </div>
          </div>
        </div>`;
      }).join('')}
    </div>
    <div id="stream-draft-area-${t.id}"></div>
  </div>`;
}

function toggleStreamSvc(tid, key) { const b = document.getElementById(`sbody-${tid}-${key}`), a = document.getElementById(`sarr-${tid}-${key}`); if (!b) return; const open = b.style.display !== 'none'; b.style.display = open ? 'none' : 'block'; if (a) a.style.transform = open ? 'rotate(0deg)' : 'rotate(90deg)'; }
function toggleStreamDone(tid, key) { const wf = getWF(tid); wf.data['done_' + key] = !wf.data['done_' + key]; addTrace(tid, 'verify', 'Service cancelled', key + (wf.data['done_' + key] ? ' — marked done' : ' — reopened')); renderWorkflow(selTask); }

async function draftStreamCancel(tid, svcName) {
  const taskName = (tasks.find(t => String(t.id) === String(tid)) || {}).name || 'Subscription cancellation';
  if (!generalAssistantStart(tid, taskName, 'Communication agent → Verify agent')) return;
  const area = document.getElementById('stream-draft-area-' + tid);
  if (area) area.innerHTML = `<div class="slbl" style="margin:8px 0 5px">Cancellation message for ${svcName}</div><div class="draft-box streaming" id="sc-draft-${tid}-${svcName}"></div>`;
  addTrace(tid, 'step', 'Preparing message', 'Writing a cancellation message for ' + svcName + '.');
  const today = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  try {
    const r = await anthropicFetch({ model: 'claude-sonnet-4-20250514', max_tokens: 300, system: 'Draft a short, warm bereavement account cancellation message. 3 to 5 sentences. Suitable for email or chat support. No em dashes.', messages: [{ role: 'user', content: `Service: ${svcName}\nDeceased: ${A.name}\nExecutor: ${A.rel}\nDate: ${today}` }] });
    const d = await r.json(); const txt = d.content[0].text;
    const el = document.getElementById(`sc-draft-${tid}-${svcName}`);
    if (el) { el.textContent = txt; el.classList.remove('streaming'); }
    addTrace(tid, 'verify', 'Message ready', 'Your cancellation message is ready. Copy it and contact the service.');
  } catch (e) { const el = document.getElementById(`sc-draft-${tid}-${svcName}`); if (el) { el.textContent = 'Something went wrong. Please try again.'; el.classList.remove('streaming'); } }
}

// ── EMPLOYER WORKFLOW ──
function employerWorkflow(t, wf) {
  const step = wf.step || 0;
  const steps = [{ label: 'Company details', status: step > 0 ? 'done' : step === 0 ? 'active' : 'pending' }, { label: 'Draft letter', status: step > 1 ? 'done' : step === 1 ? 'active' : 'pending' }, { label: 'Review & send', status: step > 2 ? 'done' : step === 2 ? 'active' : 'pending' }];
  let body = renderStepTrack(steps);
  if (step === 0) {
    // Pre-fill employer name from W2 or tax return if available and not already set
    const prefillEmployers = getPreFilledEmployers();
    const prefillCo = wf.data.co || (prefillEmployers.length === 1 ? prefillEmployers[0] : '');
    const prefillNote = prefillEmployers.length > 0 && !wf.data.co
      ? `<div style="font-size:11px;color:var(--green);margin-top:4px;display:flex;align-items:center;gap:4px">✓ Pre-filled from your uploaded W-2 or tax document</div>`
      : '';
    const suggestDropdown = prefillEmployers.length > 1
      ? `<div style="display:flex;flex-direction:column;gap:4px;margin-bottom:8px">${prefillEmployers.map(e => `<button class="sa-btn" style="text-align:left;font-size:12px" onclick="document.getElementById('emp-co-${t.id}').value='${e.replace(/'/g,"\\'")}';getWF('${t.id}').data.co='${e.replace(/'/g,"\\'")}'">${e}</button>`).join('')}</div>`
      : '';
    const hrContact = wf.data.hrContact || '';
    body += `<div class="step-card active-step">
      <div class="step-card-hdr"><div class="step-num">1</div><div class="step-card-title">Company and role details</div><span class="step-card-status">Fill in</span></div>
      <div class="step-card-body">
        ${suggestDropdown}
        <div class="field-row"><label class="field-lbl">Company name <span>*</span></label><input class="field-inp" id="emp-co-${t.id}" placeholder="Where they worked" value="${prefillCo}" oninput="document.getElementById('emp-co-err-${t.id}').textContent='';this.style.borderColor='';getWF('${t.id}').data.co=this.value"/>${prefillNote}<div id="emp-co-err-${t.id}" style="color:var(--red);font-size:11px;min-height:14px;margin-top:3px"></div></div>
        <div class="field-row"><label class="field-lbl">Their job title (optional)</label><input class="field-inp" id="emp-title-${t.id}" placeholder="e.g. Manager, Teacher, Engineer" value="${wf.data.title || ''}"/></div>
        <div class="field-row">
          <label class="field-lbl">HR contact — phone or email (optional)</label>
          <input class="field-inp" id="emp-hr-${t.id}" placeholder="e.g. hr@company.com or 1-800-555-0100" value="${hrContact}" oninput="getWF('${t.id}').data.hrContact=this.value"/>
          <div style="display:flex;align-items:center;gap:8px;margin-top:5px">
            <button class="sa-btn" style="font-size:11px;padding:4px 10px" onclick="lookupHrContact('${t.id}')">Look up HR contact</button>
            <div id="emp-hr-status-${t.id}" style="font-size:11px;color:var(--text3)"></div>
          </div>
          <div id="emp-hr-results-${t.id}" style="margin-top:8px"></div>
        </div>
        <div class="step-actions"><button class="sa-btn primary" onclick="empStep1('${t.id}')">Draft HR notification</button></div>
      </div>
    </div>`;
  }
  if (step >= 1) {
    const draft = getDraft(t.id) || wf.draft || '';
    body += `<div class="step-card ${step === 1 ? 'active-step' : 'done-step'}">
      <div class="step-card-hdr"><div class="step-num">${step > 1 ? '✓' : '2'}</div><div class="step-card-title">Review the draft letter / form</div><span class="step-card-status">${step > 1 ? 'Done' : 'Review'}</span></div>
      <div class="step-card-body">
        ${wf.draftStreaming ? `<div class="draft-box streaming" id="draft-stream-${t.id}"></div><div style="font-size:11px;color:var(--text3);margin-top:6px">Drafting…</div>` : ''}
        ${draft && !wf.draftStreaming ? `<div class="draft-box" id="draft-box-${t.id}">${draft}</div>${aiDraftNote()}` : ''}
        ${step === 1 ? `<div class="step-actions" id="emp-actions-${t.id}">
          ${draft && !wf.draftStreaming ? `<button class="sa-btn primary" onclick="empStep2('${t.id}')">This looks good — continue</button>
          <button class="sa-btn" onclick="empRedraft('${t.id}')">Redraft</button>
          <button class="sa-btn" data-copy-tid="${t.id}" onclick="copyDraftFor('${t.id}')">Copy</button>` : ''}
        </div>` : ''}
      </div>
    </div>`;
  }
  if (step >= 2) {
    body += `<div class="step-card active-step">
      <div class="step-card-hdr"><div class="step-num">3</div><div class="step-card-title">Send via your email</div><span class="step-card-status">Ready</span></div>
      <div class="step-card-body">
        <div class="email-prompt">
          <div class="email-prompt-hint">Copy and send from your personal email to HR at ${wf.data.co || '[Company]'}.</div>
          <div class="copy-box">Subject: Estate Notification — ${A.name || '[Name]'} — Employee Deceased</div>
          <div class="step-actions"><button class="sa-btn primary" data-copy-tid="${t.id}" onclick="copyDraftFor('${t.id}')">Copy letter</button><button class="sa-btn" onclick="togDone('${t.id}')">Mark complete</button></div>
        </div>
      </div>
    </div>`;
  }
  return body;
}

async function empStep1(tid) {
  const co = (document.getElementById('emp-co-' + tid)?.value || '').trim();
  if (!co) {
    const inp = document.getElementById('emp-co-' + tid);
    if (inp) inp.style.borderColor = 'var(--red)';
    const err = document.getElementById('emp-co-err-' + tid);
    if (err) err.textContent = 'Please enter the company name.';
    return;
  }
  const inp = document.getElementById('emp-co-' + tid);
  if (inp) inp.style.borderColor = '';
  const err = document.getElementById('emp-co-err-' + tid);
  if (err) err.textContent = '';
  const taskName = (tasks.find(t => String(t.id) === String(tid)) || {}).name || 'HR notification';
  if (!generalAssistantStart(tid, taskName, 'Communication agent → Verify agent')) return;
  const title = document.getElementById('emp-title-' + tid)?.value || '';
  const hrContact = document.getElementById('emp-hr-' + tid)?.value || getWF(tid).data.hrContact || '';
  getWF(tid).data.co = co; getWF(tid).data.title = title; getWF(tid).data.hrContact = hrContact;
  addTrace(tid, 'step', 'Drafting your letter', 'Preparing the HR notification for ' + co + '.');
  getWF(tid).draftStreaming = true; setWFStep(tid, 1);
  await delay(60);
  const today = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  try {
    const r = await anthropicFetch({ model: 'claude-sonnet-4-20250514', max_tokens: 700, stream: true, system: COMM_PII_RULE + 'You are a compassionate estate specialist with state-specific knowledge. Draft a professional HR bereavement email. Include a subject line. Cover: stop payroll, final paycheck, group life insurance, 401k or pension details, COBRA for dependents (federal 60-day deadline). If an HR email or contact name is provided, address the letter to that contact directly. Reference any state-specific final paycheck timing laws or continuation-of-pay rules for the executor\'s state. No em dashes.', messages: [{ role: 'user', content: `Company: ${co}\nJob title: ${title || 'not specified'}\nHR contact: ${hrContact || 'not specified'}\nDeceased: ${A.name}\nState: ${A.state}\nExecutor: ${A.rel}\nDate: ${today}` }] });
    const reader = r.body.getReader(), dec = new TextDecoder(); let txt = '';
    const el = document.getElementById('draft-stream-' + tid);
    while (true) { const { done: d, value } = await reader.read(); if (d) break; for (const line of dec.decode(value).split('\n')) { if (!line.startsWith('data: ')) continue; const raw = line.slice(6); if (raw === '[DONE]') continue; try { const j = JSON.parse(raw); if (j.type === 'content_block_delta' && j.delta?.text) { txt += j.delta.text; if (el) el.textContent = txt; } } catch (e) { } } }
    getWF(tid).draft = txt; setDraft(tid, txt); getWF(tid).draftStreaming = false;
    addTrace(tid, 'step', 'Letter drafted', 'Your HR letter is ready. Please read through it before sending.');
    const streamEl = document.getElementById('draft-stream-' + tid);
    if (streamEl) { streamEl.classList.remove('streaming'); streamEl.id = 'draft-box-' + tid; }
    const actEl = document.getElementById('emp-actions-' + tid);
    if (actEl) { actEl.innerHTML = `<button class="sa-btn primary" onclick="empStep2('${tid}')">This looks good — continue</button><button class="sa-btn" onclick="empRedraft('${tid}')">Redraft</button><button class="sa-btn" data-copy-tid="${tid}" onclick="copyDraftFor('${tid}')">Copy</button>`; }
    else { setWFStep(tid, 1); }
  } catch (e) { getWF(tid).draftStreaming = false; setWFStep(tid, 1); }
}

async function empRedraft(tid) { getWF(tid).draft = ''; setDraft(tid, ''); await empStep1(tid); }

async function lookupHrContact(tid) {
  const co = (document.getElementById('emp-co-' + tid)?.value || getWF(tid).data.co || '').trim();
  const statusEl = document.getElementById('emp-hr-status-' + tid);
  const resultsEl = document.getElementById('emp-hr-results-' + tid);
  if (!co) { if (statusEl) statusEl.textContent = 'Enter the company name first.'; return; }
  if (statusEl) statusEl.textContent = 'Looking up HR contact…';
  if (resultsEl) resultsEl.innerHTML = '';
  try {
    const r = await anthropicFetch({
      model: 'claude-sonnet-4-20250514', max_tokens: 300,
      system: 'You are a helpful estate administration assistant. Provide HR department contact information for companies when asked. Only provide information you are confident is accurate. If unsure, provide the best general guidance. No em dashes.',
      messages: [{ role: 'user', content: `Company: ${co}\nState: ${A.state || 'unknown'}\n\nProvide the HR department contact for estate/bereavement notifications. Include:\n- HR phone number (main or benefits line)\n- HR email address if known\n- Mailing address for HR/benefits department if available\n- Any specific department to contact for deceased employee matters\n\nIf you are not certain of the exact contact details, say so and suggest how to find them (e.g. company website, LinkedIn). Format as JSON: {"phone":"...","email":"...","address":"...","department":"...","note":"...","confidence":"high|medium|low"}` }]
    });
    const d = await r.json();
    const txt = (d.content?.[0]?.text || '').replace(/```json|```/g, '').trim();
    let info; try { info = JSON.parse(txt); } catch (e) { info = null; }
    if (statusEl) statusEl.textContent = '';
    if (!info) {
      if (resultsEl) resultsEl.innerHTML = `<div style="font-size:12px;color:var(--text2)">Could not retrieve contact details. Try searching "${co} HR department" or "${co} benefits contact" on their official website.</div>`;
      return;
    }
    const confidence = info.confidence === 'high' ? '' : `<div style="font-size:10px;color:var(--amber);margin-bottom:6px">Verify these details before sending — confidence: ${info.confidence || 'unknown'}</div>`;
    let html = `<div style="background:var(--bg3);border:1px solid var(--border2);border-radius:6px;padding:10px 12px">${confidence}`;
    if (info.phone) html += `<div style="font-size:12px;margin-bottom:4px"><span style="color:var(--text3);font-size:10px;text-transform:uppercase;letter-spacing:.05em;margin-right:6px">Phone</span><a href="tel:${info.phone}" style="color:var(--gold)">${info.phone}</a></div>`;
    if (info.email) html += `<div style="font-size:12px;margin-bottom:4px"><span style="color:var(--text3);font-size:10px;text-transform:uppercase;letter-spacing:.05em;margin-right:6px">Email</span><a href="mailto:${info.email}" style="color:var(--gold)">${info.email}</a> <button style="font-size:10px;padding:1px 6px;background:none;border:1px solid var(--border2);border-radius:3px;color:var(--text3);cursor:pointer;font-family:inherit" onclick="document.getElementById('emp-hr-${tid}').value='${info.email}';getWF('${tid}').data.hrContact='${info.email}'">Use</button></div>`;
    if (info.department) html += `<div style="font-size:12px;margin-bottom:4px"><span style="color:var(--text3);font-size:10px;text-transform:uppercase;letter-spacing:.05em;margin-right:6px">Dept</span>${info.department}</div>`;
    if (info.note) html += `<div style="font-size:11px;color:var(--text3);margin-top:6px;line-height:1.5">${info.note}</div>`;
    html += '</div>';
    if (resultsEl) resultsEl.innerHTML = html;
    addTrace(tid, 'step', 'HR contact looked up', `Found contact information for ${co}. Verify before sending.`);
  } catch (e) {
    if (statusEl) statusEl.textContent = '';
    if (resultsEl) resultsEl.innerHTML = `<div style="font-size:12px;color:var(--text2)">Could not look up contact details. Search "${co} HR contact" on their website.</div>`;
  }
}

function empStep2(tid) {
  traceAndOpenSendModal(tid, () => {
    addTrace(tid, 'verify', 'Ready to send', 'You confirmed the letter is accurate.');
    setWFStep(tid, 2);
  });
}

// ── SSA WORKFLOW ──
function ssaWorkflow(t, wf) {
  const hasSurvivorSpouse = (A.survivors || []).some(s => s.includes('Spouse'));
  const hasSurvivorChild = (A.survivors || []).some(s => s.includes('Children under 18'));
  return `<div style="display:flex;flex-direction:column;gap:8px;margin-top:2px">
    <div class="slbl" style="margin-bottom:4px">Call 1-800-772-1213, Monday to Friday, 8am to 7pm local time</div>
    ${makeSubCard(t.id, 'ssa_report', '📞', 'Report the death', `<p>Tell the representative you are calling to report a death and stop benefit payments. Have the Social Security number of the deceased ready.</p><p style="margin-top:6px;color:var(--amber);font-size:11px">Any benefit payment received after the date of death must be returned.</p>`)}
    ${makeSubCard(t.id, 'ssa_lump', '💲', 'Request the $255 lump-sum death payment', `<p>A one-time payment of $255 may be available to a surviving spouse or dependent child in the household. This is not automatic — ask for it specifically during the call.</p>`)}
    ${hasSurvivorSpouse ? makeSubCard(t.id, 'ssa_spouse', '📋', 'Apply for monthly spouse survivor benefits', `<p>A surviving spouse may be entitled to monthly payments based on the deceased's earnings record. Ask the representative to open a survivor benefit application during this call.</p>`) : ''}
    ${hasSurvivorChild ? makeSubCard(t.id, 'ssa_child', '📋', 'Apply for monthly child survivor benefits', `<p>Children under 18 (or under 19 if still in high school) may qualify for monthly payments. Bring birth certificates to your SSA appointment.</p>`) : ''}
  </div>`;
}

// ── VA WORKFLOW ──
function vaWorkflow(t, wf) {
  return `<div style="display:flex;flex-direction:column;gap:8px;margin-top:2px">
    <div class="slbl" style="margin-bottom:4px">Call 1-800-827-1000, Monday to Friday, 8am to 9pm Eastern</div>
    ${makeSubCard(t.id, 'va_dic', '💛', 'Dependency and Indemnity Compensation (DIC)', `<p>Monthly benefit for surviving spouses and dependent children if the veteran died from a service-related condition or had a 100% disability rating.</p>`)}
    ${makeSubCard(t.id, 'va_burial', '🪦', 'Burial and funeral allowance', `<p>Up to $2,000 burial allowance, a grave marker, and an American flag may be available. Apply within 2 years using VA Form 21P-530EZ.</p><div style="margin-top:8px"><a href="https://www.va.gov/burials-memorials/" target="_blank"><button class="sa-btn primary">Apply at VA.gov</button></a></div>`)}
    ${makeSubCard(t.id, 'va_edu', '🎓', 'Education benefits for dependents (Chapter 35)', `<p>Surviving spouses and children may qualify for the Survivors and Dependents Educational Assistance program. Apply at va.gov.</p>`)}
  </div>`;
}

// ── LIFE INSURANCE WORKFLOW ──
function lifeInsWorkflow(t, wf) {
  const step = wf.step || 0;
  const steps = [{ label: 'Policy details', status: step > 0 ? 'done' : step === 0 ? 'active' : 'pending' }, { label: 'Draft claim', status: step > 1 ? 'done' : step === 1 ? 'active' : 'pending' }, { label: 'Send', status: step > 2 ? 'done' : step === 2 ? 'active' : 'pending' }];
  let body = renderStepTrack(steps);
  if (step === 0) {
    body += `<div class="step-card active-step">
      <div class="step-card-hdr"><div class="step-num">1</div><div class="step-card-title">Policy details</div><span class="step-card-status">Fill in</span></div>
      <div class="step-card-body">
        <div class="field-row"><label class="field-lbl">Insurance company <span>*</span></label><input class="field-inp" id="ins-co-${t.id}" placeholder="e.g. MetLife, Prudential, New York Life" value="${wf.data.co || ''}" oninput="this.style.borderColor=''"/></div>
        <div class="field-row"><label class="field-lbl">Policy number (if you have it)</label><input class="field-inp" id="ins-pol-${t.id}" placeholder="e.g. ML-123456789" value="${wf.data.pol || ''}"/></div>
        ${window._bankUploaded ? '<div class="guard-banner" style="margin-bottom:8px">Tip: Monthly premium payments in the bank statement may show the insurance company name if you are unsure.</div>' : ''}
        <div class="step-actions"><button class="sa-btn primary" onclick="insStep1('${t.id}')">Draft claim letter</button></div>
      </div>
    </div>`;
  }
  if (step >= 1) {
    body += `<div class="step-card ${step === 1 ? 'active-step' : 'done-step'}">
      <div class="step-card-hdr"><div class="step-num">${step > 1 ? '✓' : '2'}</div><div class="step-card-title">Review claim letter</div><span class="step-card-status">${step > 1 ? 'Done' : 'Review'}</span></div>
      <div class="step-card-body">
        ${wf.draftStreaming ? `<div class="draft-box streaming" id="draft-stream-${t.id}"></div>` : ''}
        ${wf.draft && !wf.draftStreaming ? `<div class="draft-box">${wf.draft}</div>${aiDraftNote()}` : ''}
        ${step === 1 && wf.draft ? `<div class="step-actions"><button class="sa-btn primary" onclick="insStep2('${t.id}')">Looks good</button><button class="sa-btn" data-copy-tid="${t.id}" onclick="copyDraftFor('${t.id}')">Copy</button></div>` : ''}
      </div>
    </div>`;
  }
  if (step >= 2) {
    body += `<div class="step-card active-step">
      <div class="step-card-hdr"><div class="step-num">3</div><div class="step-card-title">Send the claim</div><span class="step-card-status">Ready</span></div>
      <div class="step-card-body">
        <p class="step-desc">Send by email or certified mail. Include a certified copy of the death certificate with the letter.</p>
        <div class="step-actions"><button class="sa-btn primary" data-copy-tid="${t.id}" onclick="copyDraftFor('${t.id}')">Copy letter</button><button class="sa-btn" onclick="togDone('${t.id}')">Mark complete</button></div>
      </div>
    </div>`;
  }
  return body;
}

async function insStep1(tid) {
  const co = (document.getElementById('ins-co-' + tid)?.value || '').trim();
  if (!co) {
    const inp = document.getElementById('ins-co-' + tid);
    if (inp) inp.style.borderColor = 'var(--red)';
    return;
  }
  const inp = document.getElementById('ins-co-' + tid);
  if (inp) inp.style.borderColor = '';
  const taskName = (tasks.find(t => String(t.id) === String(tid)) || {}).name || 'Life insurance claim';
  if (!generalAssistantStart(tid, taskName, 'Communication agent → Verify agent')) return;
  const pol = document.getElementById('ins-pol-' + tid)?.value || '';
  getWF(tid).data.co = co; getWF(tid).data.pol = pol;
  addTrace(tid, 'step', 'Drafting claim letter', 'Preparing the life insurance claim for ' + co + '.');
  getWF(tid).draftStreaming = true; getWF(tid).draft = '';
  setWFStep(tid, 1);
  await delay(60);
  const today = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  try {
    const r = await anthropicFetch({ model: 'claude-sonnet-4-20250514', max_tokens: 700, stream: true, system: COMM_PII_RULE + 'Draft a professional life insurance death benefit claim letter. Reference the executor\'s legal authority under their state\'s estate administration laws. Mention that a certified death certificate and Letters Testamentary (or the state-equivalent executor credential) will accompany the claim. Formal but warm. No em dashes. Do not mention artificial intelligence.', messages: [{ role: 'user', content: `Insurer: ${co}\nPolicy: ${pol || 'unknown'}\nDeceased: ${A.name}\nBeneficiary or executor: ${A.rel}\nState: ${A.state}\nDate: ${today}` }] });
    const reader = r.body.getReader(), dec = new TextDecoder(); let txt = '';
    while (true) { const { done: d, value } = await reader.read(); if (d) break; for (const line of dec.decode(value).split('\n')) { if (!line.startsWith('data: ')) continue; const raw = line.slice(6); if (raw === '[DONE]') continue; try { const j = JSON.parse(raw); if (j.type === 'content_block_delta' && j.delta?.text) { txt += j.delta.text; const el = document.getElementById('draft-stream-' + tid); if (el) el.textContent = txt; } } catch (e) { } } }
    getWF(tid).draft = txt; setDraft(tid, txt); getWF(tid).draftStreaming = false;
    addTrace(tid, 'verify', 'Claim letter ready', 'Your letter is ready. Please read through it carefully.'); setWFStep(tid, 1);
  } catch (e) { getWF(tid).draftStreaming = false; setWFStep(tid, 1); }
}

function insStep2(tid) {
  traceAndOpenSendModal(tid, () => {
    addTrace(tid, 'verify', 'Ready to send', 'You confirmed the claim letter looks correct.');
    setWFStep(tid, 2);
  });
}

// Tasks where a written letter is not the right action — phone call or in-person visit instead.
const NO_LETTER_TASKS = [
  'death certificate', 'vital records',
  'credit bureau', 'deceased alert',
  'vehicle title', 'dmv',
  'safe deposit box',
  'cryptocurrency', 'digital assets',
  'close or archive email', 'close email',
  'handle storage unit',
];

// ── GENERIC WORKFLOW ──
function genericWorkflow(t, wf) {
  const n = (t.name || '').toLowerCase();
  const needsLawyer = n.includes('probate') || n.includes('out of state') || n.includes('estate attorney');
  const skipLetter  = NO_LETTER_TASKS.some(kw => n.includes(kw));

  let draftBtn = '';
  if (!skipLetter) {
    const hasExistingDraft = getDraft(t.id) || (wf.draft && !wf.draftStreaming);
    draftBtn = `<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:8px">
      <button class="sa-btn primary" onclick="draftGenericLetter('${t.id}','${(t.institution || '').replace(/'/g, "\\'")}','${(t.name || '').replace(/'/g, "\\'")}')">
        ${hasExistingDraft ? 'Redraft letter' : '✦ Draft notification letter'}
      </button>
    </div>`;
  }

  let body = `<div style="margin-top:2px">${draftBtn}<div id="darea-${t.id}"></div></div>`;
  if (needsLawyer) body += renderLawyerCard(t);
  return body;
}

async function draftGenericLetter(tid, institution, taskName) {
  const t = tasks.find(x => String(x.id) === String(tid)); if (!t) return;
  if (!generalAssistantStart(tid, taskName || t.name, 'Communication agent → Verify agent')) return;
  const today = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  const el = document.getElementById('darea-' + tid);
  if (!el) return;
  el.innerHTML = `<div class="slbl" style="margin:4px 0 5px">Your letter</div><div class="draft-box streaming" id="gen-draft-${tid}"></div><div id="gen-actions-${tid}"></div>`;
  addTrace(tid, 'step', 'Drafting your letter', 'Preparing the notification letter for ' + (institution || taskName) + '.');
  const taxCtx = window._taxParsed ? `\nFinancial context from uploaded documents: ${window._taxParsed}` : '';
  try {
    const r = await anthropicFetch({ model: 'claude-sonnet-4-20250514', max_tokens: 800, stream: true, system: COMM_PII_RULE + 'You are a compassionate estate specialist with state-specific estate law knowledge. Draft a warm, professional notification letter. Incorporate any relevant state-specific legal requirements, court procedures, agency names, deadlines, or filing rules for the executor\'s state. Use the actual names of state courts or agencies (e.g. the specific probate court system, state revenue department). Plain language. Formal but kind. Sign from executor perspective. Do not use em dashes. Do not mention artificial intelligence.', messages: [{ role: 'user', content: `Task: ${taskName}\nInstitution: ${institution || taskName}\nDeceased: ${A.name}\nState: ${A.state}\nExecutor relationship: ${A.rel}\nDate: ${today}\nNotes: ${taskNotes[tid] || 'none'}${taxCtx}` }] });
    const reader = r.body.getReader(), dec = new TextDecoder(); let txt = '';
    while (true) {
      const { done: d, value } = await reader.read(); if (d) break;
      for (const line of dec.decode(value).split('\n')) {
        if (!line.startsWith('data: ')) continue;
        const raw = line.slice(6); if (raw === '[DONE]') continue;
        try { const j = JSON.parse(raw); if (j.type === 'content_block_delta' && j.delta?.text) { txt += j.delta.text; const de = document.getElementById('gen-draft-' + tid); if (de) de.textContent = txt; } } catch (e) { }
      }
    }
    const de = document.getElementById('gen-draft-' + tid); if (de) de.classList.remove('streaming');
    setDraft(tid, txt);
    const act = document.getElementById('gen-actions-' + tid);
    if (act) act.innerHTML = aiDraftNote() + `<div style="display:flex;gap:6px;margin-top:8px;flex-wrap:wrap">
      <button class="sa-btn primary" onclick="traceAndOpenSendModal('${tid}',()=>copyDraftFor('${tid}'))">Review &amp; copy letter</button>
      <button class="sa-btn" onclick="downloadDraftTxt('${tid}')">Download .txt</button>
      <button class="sa-btn" onclick="draftGenericLetter('${tid}','${(institution || '').replace(/'/g, "\\'")}','${(taskName || '').replace(/'/g, "\\'")}')">Redraft</button>
      <button class="sa-btn" onclick="togDone('${tid}')">Mark complete</button>
    </div>`;
    addTrace(tid, 'verify', 'Letter ready for review', 'Take a moment to read through it, then copy and send when you are ready.');
  } catch (e) {
    console.error('draftGenericLetter error:', e);
  }
}

// ── LAWYER ESCALATION ──
function renderLawyerCard(t) {
  const n = (t.name || '').toLowerCase();
  const isOutOfState = n.includes('out of state') || ((A.assets || []).includes('Home or real estate') && A.state);
  const state = A.state || 'your state';
  const wf = getWF(t.id);
  setTimeout(() => loadLawyerRecs(t.id, state, isOutOfState), 100);
  const draftSection = wf.lawyerDraft
    ? `<div style="margin-top:14px;border-top:1px solid var(--border);padding-top:12px">
        <div style="font-size:10px;font-weight:500;letter-spacing:.06em;text-transform:uppercase;color:var(--text3);margin-bottom:6px">Draft outreach email</div>
        <div class="draft-box" id="lawyer-draft-${t.id}">${wf.lawyerDraft}</div>
        <div style="display:flex;gap:8px;margin-top:6px">
          <button class="sa-btn" data-copy-tid="${t.id}" onclick="navigator.clipboard.writeText(document.getElementById('lawyer-draft-${t.id}').textContent)">Copy email</button>
          <button class="sa-btn" onclick="draftLawyerEmail('${t.id}','${state}')">Redraft</button>
        </div>
      </div>`
    : `<div style="margin-top:12px">
        <button class="sa-btn primary" onclick="draftLawyerEmail('${t.id}','${state}')">Draft outreach email to an attorney</button>
      </div>`;
  return `<div class="lawyer-card" id="lawyer-card-${t.id}">
    <div class="lawyer-title">${isOutOfState ? 'This may require attorneys in multiple states' : 'Professional help is recommended for this step'}</div>
    <div id="lawyer-recs-${t.id}">
      <div style="font-size:12px;color:var(--text3);display:flex;align-items:center;gap:6px;padding:4px 0">
        <div style="width:10px;height:10px;border:1.5px solid var(--text3);border-top-color:var(--blue);border-radius:50%;animation:spin 1s linear infinite;flex-shrink:0"></div>
        Finding verified attorneys and CPAs in ${state}…
      </div>
    </div>
    <div id="lawyer-draft-wrap-${t.id}">${draftSection}</div>
  </div>`;
}

// Curated, always-verified referral links shown regardless of AI response quality.
const LAWYER_VERIFIED_LINKS = [
  { label: 'ABA — Find a Lawyer',          url: 'https://www.americanbar.org/groups/legal_services/flh-home/' },
  { label: 'ACTEC — Estate Attorneys',     url: 'https://www.actec.org/resources/find-a-fellow/' },
  { label: 'CPAverify — Licensed CPAs',    url: 'https://www.cpaverify.org' },
  { label: 'LawHelp.org — Free Legal Aid', url: 'https://www.lawhelp.org' },
  { label: 'USA.gov — Estate Planning',    url: 'https://www.usa.gov/wills-estates' },
];

async function loadLawyerRecs(tid, state, isOutOfState) {
  const el = document.getElementById('lawyer-recs-' + tid);
  if (!el) return;
  addTrace(tid, 'step', 'Finding local help', 'Looking for estate attorneys and CPAs in ' + state + '.');

  const statePortal = STATE_GOV[state] || 'https://usa.gov';
  const verifiedChips = [
    ...LAWYER_VERIFIED_LINKS,
    { label: `${state} official portal`, url: statePortal },
  ].map(l =>
    `<a href="${l.url}" target="_blank" rel="noopener noreferrer" class="src-chip" style="font-size:11px">↗ ${l.label}</a>`
  ).join('');

  const verifiedBlock = `<div style="margin-bottom:12px">
    <div style="font-size:10px;font-weight:500;letter-spacing:.06em;text-transform:uppercase;color:var(--text3);margin-bottom:6px">Verified referral resources</div>
    <div class="src-chips">${verifiedChips}</div>
  </div>`;

  el.innerHTML = verifiedBlock + `<div style="font-size:12px;color:var(--text3);display:flex;align-items:center;gap:6px;padding:4px 0"><div style="width:10px;height:10px;border:1.5px solid var(--text3);border-top-color:var(--blue);border-radius:50%;animation:spin 1s linear infinite;flex-shrink:0"></div>Finding state-specific resources for ${state}…</div>`;

  try {
    const r = await anthropicFetch({
      model: 'claude-sonnet-4-20250514', max_tokens: 900,
      system: 'You are an estate planning specialist. Provide accurate referral resources for estate attorneys and CPAs. Be factual and practical. No em dashes. Do not mention artificial intelligence. Only cite URLs you are confident exist — use top-level domains (e.g. https://www.ctbar.org) rather than guessing deep page URLs.',
      messages: [{ role: 'user', content: `State: ${state}\nSituation: Estate administration after a death. ${isOutOfState ? 'May involve out-of-state real property (ancillary probate).' : ''}\n\nProvide 5 ways to find a qualified estate attorney or CPA in ${state}. Include:\n1. The official state bar attorney referral service for ${state} (name, URL, phone if known)\n2. The state CPA society for ${state} (name, URL)\n3. ACTEC fellow finder (always: https://www.actec.org/resources/find-a-fellow/)\n4. One free legal aid resource for ${state} (name, URL, phone if known)\n5. A practical tip specific to ${state} (e.g. local probate court self-help center, county bar association)\n\nAlso provide 3 questions to ask any estate attorney on a first call.\n\nFormat as JSON: {"options":[{"type":"State Bar","name":"...","url":"...","phone":"...","note":"..."},{"type":"CPA Society","name":"...","url":"...","phone":"...","note":"..."},{"type":"ACTEC","name":"ACTEC Fellow Finder","url":"https://www.actec.org/resources/find-a-fellow/","note":"..."},{"type":"Legal Aid","name":"...","url":"...","phone":"...","note":"..."},{"type":"Local Tip","name":"...","url":"...","note":"..."}],"questions":["...","...","..."]}` }]
    });
    const d = await r.json();
    let txt = (d.content?.[0]?.text || '').replace(/```json|```/g, '').trim();
    let rec; try { rec = JSON.parse(txt); } catch (e) { rec = null; }

    addTrace(tid, 'verify', 'Local resources found', `Referral resources found for ${state}. Verified baseline links are always shown above.`);

    const aiDisclaimer = `<div style="font-size:10px;color:var(--text3);margin-bottom:8px;display:flex;align-items:flex-start;gap:5px"><span style="color:var(--amber);flex-shrink:0">⚠</span> Resources suggested by AI — verify links before relying on them.</div>`;

    if (!rec || !rec.options?.length) {
      el.innerHTML = verifiedBlock + `<div style="font-size:12px;color:var(--text2);line-height:1.7">
        <div class="lawyer-row"><span class="ltype">Attorney</span><div>Search for a probate or estate attorney in ${state}. The ABA and ACTEC referral services above can connect you with a local attorney. Many offer a free first consultation.</div></div>
        ${isOutOfState ? `<div class="lawyer-row"><span class="ltype">Out of state</span><div>Real property in another state may require ancillary probate. Your primary estate attorney in ${state} can refer you to counsel in that state.</div></div>` : ''}
        <div class="lawyer-row"><span class="ltype">CPA</span><div>A CPA with estate tax experience can handle the final return and Form 1041. Use CPAverify.org above to find one in ${state}.</div></div>
      </div>`;
      return;
    }

    const optRows = rec.options.map((o, i) => {
      const phoneHtml = o.phone ? `<div style="font-size:11px;color:var(--text2);margin-top:2px">📞 <a href="tel:${o.phone}" style="color:var(--text2)">${o.phone}</a></div>` : '';
      const urlHtml = o.url ? `<a href="${o.url}" target="_blank" rel="noopener noreferrer" style="color:var(--gold);font-size:11px">${o.url.replace('https://','')}</a>` : '';
      return `<div class="lawyer-row">
        <span class="ltype" style="font-size:10px;min-width:70px">${o.type || 'Option ' + (i+1)}</span>
        <div>
          <div style="font-weight:500;color:var(--text);margin-bottom:2px">${o.name || ''}</div>
          ${o.note ? `<div style="font-size:11px;color:var(--text2);line-height:1.55;margin-bottom:3px">${o.note}</div>` : ''}
          ${urlHtml}${phoneHtml}
        </div>
      </div>`;
    }).join('');

    const questionsHtml = rec.questions?.length
      ? `<div style="background:rgba(201,168,76,0.06);border:1px solid rgba(201,168,76,0.15);border-radius:6px;padding:10px 12px;margin-top:8px">
          <div style="font-size:10px;font-weight:500;letter-spacing:.06em;text-transform:uppercase;color:var(--gold);margin-bottom:7px">Questions to ask on your first call</div>
          ${rec.questions.map(q => `<div style="font-size:12px;color:var(--text2);line-height:1.6;display:flex;gap:6px;margin-bottom:5px"><span style="color:var(--gold);flex-shrink:0">›</span>${q}</div>`).join('')}
         </div>`
      : '';

    el.innerHTML = verifiedBlock + `<div style="display:flex;flex-direction:column;gap:8px">
      ${aiDisclaimer}
      ${isOutOfState ? `<div class="lawyer-row"><span class="ltype">Out of state</span><div style="font-size:12px;color:var(--text2);line-height:1.55">Real property in another state requires ancillary probate. Your primary estate attorney in ${state} can refer you to counsel there.</div></div>` : ''}
      ${optRows}
      ${questionsHtml}
    </div>`;
  } catch (e) {
    el.innerHTML = verifiedBlock + `<div style="font-size:12px;color:var(--text2)">
      <div class="lawyer-row"><span class="ltype">Attorney</span><div>Search for a probate attorney in ${state} via the ABA or ACTEC referral services linked above.</div></div>
      <div class="lawyer-row"><span class="ltype">CPA</span><div>Find a licensed CPA in ${state} using CPAverify.org linked above.</div></div>
    </div>`;
    console.error('loadLawyerRecs error:', e);
  }
}

async function draftLawyerEmail(tid, state) {
  const wf = getWF(tid);
  const wrapEl = document.getElementById('lawyer-draft-wrap-' + tid);
  if (wrapEl) wrapEl.innerHTML = `<div style="font-size:12px;color:var(--text3);margin-top:12px;display:flex;align-items:center;gap:6px;border-top:1px solid var(--border);padding-top:12px"><div style="width:10px;height:10px;border:1.5px solid var(--text3);border-top-color:var(--blue);border-radius:50%;animation:spin 1s linear infinite;flex-shrink:0"></div>Drafting outreach email…</div>`;
  addTrace(tid, 'step', 'Drafting attorney email', 'Preparing an outreach email to an estate attorney.');
  try {
    const r = await anthropicFetch({
      model: 'claude-sonnet-4-20250514', max_tokens: 500,
      system: COMM_PII_RULE + 'You are a compassionate estate administration specialist. Draft a brief, professional first-contact email to an estate attorney. No em dashes. No artificial intelligence mentions.',
      messages: [{ role: 'user', content: `State: ${state}\nExecutor: ${A.rel}\nDeceased: ${A.name}\nAssets flagged: ${(A.assets||[]).join(', ') || 'unknown'}\n\nDraft a short introductory email (8 to 12 sentences) requesting an initial consultation with an estate attorney. Include: executor role, nature of estate (general), request for a free or low-cost initial consultation, availability note. Mention any state-specific probate requirements if relevant. Do not invent specific details. Include a subject line.` }]
    });
    const d = await r.json();
    const txt = (d.content?.[0]?.text || '').trim();
    wf.lawyerDraft = txt;
    scheduleSave();
    if (wrapEl) wrapEl.innerHTML = `<div style="margin-top:14px;border-top:1px solid var(--border);padding-top:12px">
      <div style="font-size:10px;font-weight:500;letter-spacing:.06em;text-transform:uppercase;color:var(--text3);margin-bottom:6px">Draft outreach email</div>
      <div class="draft-box" id="lawyer-draft-${tid}">${txt}</div>
      <div style="display:flex;gap:8px;margin-top:6px">
        <button class="sa-btn" onclick="navigator.clipboard.writeText(document.getElementById('lawyer-draft-${tid}').textContent).then(()=>{this.textContent='Copied';setTimeout(()=>this.textContent='Copy email',1500)})">Copy email</button>
        <button class="sa-btn" onclick="draftLawyerEmail('${tid}','${state}')">Redraft</button>
      </div>
    </div>`;
    addTrace(tid, 'verify', 'Outreach email ready', 'Review the email before sending. Customize the attorney name and firm.');
  } catch (e) {
    if (wrapEl) wrapEl.innerHTML = `<div style="margin-top:12px"><button class="sa-btn primary" onclick="draftLawyerEmail('${tid}','${state}')">Draft outreach email to an attorney</button></div>`;
    console.error('draftLawyerEmail error:', e);
  }
}
