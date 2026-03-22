// Tracks which source accordions the user has opened, so they survive workflow re-renders.
const _srcAccOpen = {};

function toggleSrcAcc(id) {
  _srcAccOpen[id] = !_srcAccOpen[id];
  const el = document.getElementById(id);
  if (el) {
    el.classList.toggle('open', !!_srcAccOpen[id]);
    const btn = el.previousElementSibling;
    if (btn) { const arrow = btn.querySelector('.acc-arrow'); if (arrow) arrow.style.transform = _srcAccOpen[id] ? 'rotate(90deg)' : ''; }
  }
}

// ── INLINE LINK CHIPS ─────────────────────────────────────────────────────────
// Always-visible chips linking to official government / institutional websites.
// These are curated URLs — never AI-generated.
function renderLinkChips(t) {
  const sources = getTaskSources(t, A.state);
  if (!sources.length) return '';
  const chips = sources.map(s =>
    `<a href="${s.url}" target="_blank" rel="noopener noreferrer" class="src-chip">↗ ${s.label}</a>`
  ).join('');
  return `<div class="src-chips">${chips}</div>`;
}

// ── LEGAL CITATIONS ACCORDION ─────────────────────────────────────────────────
// Collapsible section showing statutory authority. Separated from the link chips
// so the links are always visible while the statute text stays opt-in.
function renderLegalAcc(t) {
  const basis = t.legalBasis || getLegalBasis(t);
  const aiEnriched = t.aiEnriched;
  if (!basis.length && !aiEnriched) return '';

  const accId = 'src-acc-' + String(t.id).replace(/[^a-z0-9]/gi, '');
  const isOpen = !!_srcAccOpen[accId];

  const aiNote = aiEnriched
    ? `<div style="display:flex;align-items:flex-start;gap:6px;font-size:11px;color:var(--amber);margin-bottom:6px">
        <span style="flex-shrink:0">⚠</span>
        <span>Some guidance was tailored for ${A.state || 'your state'} by AI. Please verify court names, form numbers, and deadlines against the official sources before acting.</span>
       </div>`
    : '';

  const legalRows = basis.map(b =>
    `<div style="font-size:11px;margin-bottom:6px;display:flex;gap:6px;align-items:flex-start">
      <span style="color:var(--blue);flex-shrink:0;margin-top:1px">§</span>
      <span><strong style="color:var(--text);font-size:11px">${b.cite}</strong><br/><span style="color:var(--text2)">${b.note}</span></span>
     </div>`
  ).join('');

  return `<div style="border:1px solid rgba(90,159,212,0.12);border-radius:6px;overflow:hidden;margin-top:4px">
    <button class="acc-toggle" onclick="toggleSrcAcc('${accId}')">
      <span style="font-weight:600;letter-spacing:0.05em;text-transform:uppercase;font-size:10px">Legal authority</span>
      <span class="acc-arrow" style="${isOpen ? 'transform:rotate(90deg)' : ''}">›</span>
    </button>
    <div id="${accId}" class="acc-body${isOpen ? ' open' : ''}">
      ${aiNote}${legalRows}
    </div>
  </div>`;
}

// ── OPTIONS SECTION ───────────────────────────────────────────────────────────
// Renders channel options (call / letter / online / in-person / lawyer) so the
// executor can choose how they want to approach each task.

function renderOptionsSection(t, wf) {
  const options = getTaskOptions(t, A.state);
  if (!options || options.length === 0) return '';

  const sel = wf.selectedOption;
  const btns = options.map(opt => {
    const isSel = sel === opt.id;
    return `<button class="opt-btn${isSel ? ' sel' : ''}" data-opt-tid="${t.id}" data-opt-id="${opt.id}" onclick="selectOption('${String(t.id)}','${opt.id}')">
      <span class="opt-icon">${opt.icon}</span>
      <div style="min-width:0">
        <div class="opt-lbl">${opt.label}</div>
        <div class="opt-desc">${opt.desc}</div>
      </div>
      ${isSel ? '<span class="opt-check">✓</span>' : ''}
    </button>`;
  }).join('');

  const contentHtml = sel ? renderOptionContent(t, options.find(o => o.id === sel), wf) : '';

  return `<div style="margin-top:2px">
    <div class="slbl" style="margin-bottom:7px">Options — how would you like to handle this?</div>
    <div style="display:flex;flex-direction:column;gap:5px">${btns}</div>
    <div id="opt-content-${t.id}" style="margin-top:10px">${contentHtml}</div>
  </div>`;
}

function renderOptionContent(t, opt, wf) {
  if (!opt) return '';

  if (opt.type === 'call') {
    const phoneDisplay = opt.phone && opt.phone.length < 30
      ? `<div class="call-phone">${opt.phone}</div>` : '';
    const hoursHtml = opt.hours
      ? `<div class="call-hours">${opt.hours}</div>` : '';

    // Show a cached script if one was already generated for this option
    const scriptKey = 'callScript_' + String(t.id) + '_' + opt.id;
    const cached = wf[scriptKey];
    const scriptArea = cached
      ? `<div>
          <div class="slbl" style="margin-bottom:5px">Your call script</div>
          <div class="call-script" id="call-script-${t.id}-${opt.id}" style="white-space:pre-wrap">${cached}</div>
          <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:8px">
            <button class="sa-btn" onclick="copyCallScript('${t.id}','${opt.id}')">Copy script</button>
            <button class="sa-btn" onclick="generateCallScript('${t.id}','${opt.id}')">Regenerate</button>
          </div>
         </div>`
      : `<div>
          <div style="font-size:12px;color:var(--text2);margin-bottom:8px">Get a personalized script based on your situation — what to say, what documents to have ready, and what to ask for.</div>
          <button class="sa-btn primary" onclick="generateCallScript('${t.id}','${opt.id}')">✦ Generate my call script</button>
          <div id="call-script-area-${t.id}-${opt.id}" style="margin-top:10px"></div>
         </div>`;

    return `<div class="call-card">
      ${phoneDisplay}${hoursHtml}
      <div style="margin:10px 0">${scriptArea}</div>
      <div style="margin-top:8px;padding-top:8px;border-top:1px solid var(--border)">
        <button class="btn-gold" style="font-size:12px;padding:8px 18px" onclick="togDone('${t.id}')">Mark as done after the call</button>
      </div>
    </div>`;
  }

  if (opt.type === 'link') {
    return `<div class="call-card">
      <a href="${opt.url}" target="_blank" rel="noopener noreferrer" class="btn-gold" style="font-size:13px;padding:9px 20px;text-decoration:none;display:inline-block">${opt.linkLabel || 'Open official page →'}</a>
      <div style="font-size:11px;color:var(--text3);margin-top:8px">Opens in a new tab. Come back here when you are done.</div>
      <div style="margin-top:8px"><button class="btn-gold" style="font-size:12px;padding:7px 16px" onclick="togDone('${t.id}')">Mark as done</button></div>
    </div>`;
  }

  if (opt.type === 'info') {
    const stepsHtml = (opt.steps || []).map((s, i) =>
      `<div style="display:flex;gap:8px;margin-bottom:6px">
        <span style="color:var(--gold);flex-shrink:0;font-weight:600;min-width:16px">${i + 1}.</span>
        <span style="font-size:12px;color:var(--text2)">${s}</span>
       </div>`
    ).join('');
    return `<div class="call-card">
      ${stepsHtml}
      <div style="margin-top:10px"><button class="btn-gold" style="font-size:12px;padding:8px 18px" onclick="togDone('${t.id}')">Mark as done</button></div>
    </div>`;
  }

  if (opt.type === 'letter') {
    // The existing letter workflow is rendered below the options section by renderWorkflow.
    // This content area just provides a gentle cue.
    return `<div style="font-size:12px;color:var(--text3);padding:8px 0">
      The letter drafting steps are shown below.
    </div>`;
  }

  if (opt.type === 'lawyer') {
    return renderLawyerCard(t);
  }

  return '';
}

function selectOption(tid, optId) {
  const wf = getWF(tid);
  wf.selectedOption = optId;
  scheduleSave();

  // Update button appearance without full re-render
  document.querySelectorAll(`[data-opt-tid="${tid}"]`).forEach(btn => {
    const isThis = btn.dataset.optId === optId;
    btn.classList.toggle('sel', isThis);
    const check = btn.querySelector('.opt-check');
    if (isThis && !check) {
      btn.insertAdjacentHTML('beforeend', '<span class="opt-check">✓</span>');
    } else if (!isThis && check) {
      check.remove();
    }
  });

  // Update the option content panel
  const contentEl = document.getElementById('opt-content-' + tid);
  if (contentEl) {
    const t = tasks.find(x => String(x.id) === String(tid));
    if (t) {
      const opts = getTaskOptions(t, A.state);
      contentEl.innerHTML = renderOptionContent(t, opts.find(o => o.id === optId), wf);
    }
  }

  // Toggle the workflow body based on selected option.
  // data-show-when is a comma-separated list of option IDs that should reveal the body.
  const bodyEl = document.getElementById('wf-body-' + tid);
  if (bodyEl) {
    const showWhen = (bodyEl.dataset.showWhen || 'letter,draft').split(',');
    bodyEl.style.display = showWhen.includes(optId) ? '' : 'none';
  }
}

// ── CALL SCRIPT GENERATION ──────────────────────────────────────────────────
async function generateCallScript(tid, optId) {
  const t = tasks.find(x => String(x.id) === String(tid));
  if (!t) return;
  const opts = getTaskOptions(t, A.state);
  const opt  = opts.find(o => o.id === optId);
  if (!opt || !generalAssistantStart(tid, t.name, 'Communication agent')) return;

  // Show streaming area
  const areaId  = `call-script-area-${tid}-${optId}`;
  const scriptId = `call-script-${tid}-${optId}`;
  const area = document.getElementById(areaId);
  const existing = document.getElementById(scriptId);
  const target = area || existing;
  if (!target) return;

  target.innerHTML = `<div class="slbl" style="margin-bottom:5px">Your call script</div>
    <div class="call-script streaming" id="cscript-stream-${tid}-${optId}"></div>`;

  addTrace(tid, 'step', 'Writing your call script',
    `Preparing a personalized script for calling ${opt.label.replace('Call ', '') || t.institution || t.name}.`);

  const today = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  try {
    const r = await anthropicFetch({
      model: 'claude-sonnet-4-20250514', max_tokens: 600, stream: true,
      system: `You are a compassionate estate specialist. Write a warm, practical phone call script for an executor handling estate administration. The script should:
- Open with a clear, polite self-introduction
- State the purpose of the call directly
- List exactly what documents/information to have ready before calling
- Include specific questions to ask the agent
- End with a follow-up note (ask for a reference number, confirmation in writing, etc.)
Keep it conversational, not robotic. Plain language. No em dashes. Do not mention artificial intelligence.`,
      messages: [{
        role: 'user',
        content: `Write a call script for this situation:

Task: ${t.name}
Institution or agency: ${opt.phone || t.institution || 'the institution'}
Deceased: ${A.name || '[Name]'}
Executor relationship: ${A.rel || 'executor'}
State: ${A.state || 'unknown'}
Date: ${today}
Task description: ${t.description || ''}
${taskNotes[tid] ? 'Notes: ' + taskNotes[tid] : ''}

The script should be written in first person as if the executor is speaking.`
      }],
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
            const el = document.getElementById(`cscript-stream-${tid}-${optId}`);
            if (el) el.textContent = txt;
          }
        } catch (_) {}
      }
    }

    // Cache the script in wfState so it survives re-renders
    const wf = getWF(tid);
    wf['callScript_' + String(tid) + '_' + optId] = txt;
    scheduleSave();

    // Replace streaming box with final formatted script + copy button
    const streamEl = document.getElementById(`cscript-stream-${tid}-${optId}`);
    if (streamEl) {
      streamEl.classList.remove('streaming');
      streamEl.style.whiteSpace = 'pre-wrap';
      streamEl.id = scriptId;
    }
    if (target) {
      target.insertAdjacentHTML('beforeend',
        `<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:8px">
          <button class="sa-btn" onclick="copyCallScript('${tid}','${optId}')">Copy script</button>
          <button class="sa-btn" onclick="generateCallScript('${tid}','${optId}')">Regenerate</button>
         </div>`);
    }

    addTrace(tid, 'verify', 'Call script ready',
      'Your personalized call script is ready. Read through it once before you dial — having it in front of you makes the call much easier.');
  } catch (e) {
    const el = document.getElementById(`cscript-stream-${tid}-${optId}`);
    if (el) { el.textContent = 'Something went wrong. Please try again.'; el.classList.remove('streaming'); }
    console.error('generateCallScript error:', e);
  }
}

function copyCallScript(tid, optId) {
  const el = document.getElementById(`call-script-${tid}-${optId}`);
  if (!el) return;
  navigator.clipboard.writeText(el.textContent || '').then(() => {
    showToast('Call script copied to clipboard.');
  }).catch(() => {
    showToast('Select the script text and copy it manually.');
  });
}

// ── WORKFLOW STATE MACHINE ──
function getWF(tid) { if (!wfState[tid]) wfState[tid] = { step: 0, data: {}, draft: '' }; return wfState[tid]; }
function setWFStep(tid, step) { getWF(tid).step = step; renderWorkflow(selTask); }

// ── WORKFLOW RENDERER ──
// Dispatches to the correct workflow module based on task name.
function renderWorkflow(t) {
  if (!t) return;
  const wcol = document.getElementById('wcol');
  if (!wcol) return;
  try {
    const n = (t.name || '').toLowerCase();
    const wf = getWF(t.id);
    const isDone = taskDone[t.id];
    const urgCls = t.urgency === 'immediate' ? 'now' : t.urgency === 'soon' ? 'soon' : 'later';
    const urgLabel = t.urgency === 'immediate' ? 'Do first' : t.urgency === 'soon' ? 'Coming up' : 'Later on';

    const isBank      = n.includes('bank') || n.includes('financial account') || n.includes('freeze');
    const isStreaming = n.includes('streaming') || n.includes('subscri') || ['netflix', 'hulu', 'amazon'].some(s => n.includes(s));
    const isEmployer  = n.includes('employer') || n.includes('hr');
    const isSSA       = (n.includes('social security') || n.includes('ssa')) && (n.includes('notify') || n.includes('report'));
    const isVA        = n.includes('va ') || n.includes('veteran') || n.includes('burial allow') || n.includes('dic');
    const isLife      = n.includes('life insurance') && (n.includes('claim') || n.includes('notify'));
    const needsLawyer = n.includes('probate') || n.includes('out of state') || n.includes('estate attorney') || n.includes('letters testamentary');

    // For phone-first tasks (SSA, VA) the specialized body shows their call subcards.
    // We want those visible when 'call' is selected, hidden otherwise.
    // For letter-based tasks the body shows by default (before any option is selected)
    // and stays visible when 'letter'/'draft' is chosen; hidden for call/visit/online.
    const isPhoneFirst = isSSA || isVA;
    const selOpt = wf.selectedOption;

    let showLetterBody;
    if (isPhoneFirst) {
      // Show the phone-call subcards when 'call' is selected; hide for other options
      showLetterBody = selOpt === 'call';
    } else {
      // Show by default (no option selected) or when letter/draft option selected
      showLetterBody = !selOpt || selOpt === 'letter' || selOpt === 'draft';
    }

    let body = '';
    if (isBank)      body = bankWorkflow(t, wf);
    else if (isStreaming) body = streamingWorkflow(t, wf);
    else if (isEmployer)  body = employerWorkflow(t, wf);
    else if (isSSA)       body = ssaWorkflow(t, wf);
    else if (isVA)        body = vaWorkflow(t, wf);
    else if (isLife)      body = lifeInsWorkflow(t, wf);
    else                  body = genericWorkflow(t, wf);

    if (needsLawyer) body += renderLawyerCard(t);

    // Streaming body always visible — it IS the interface (multi-service panel).
    const showBody = isStreaming ? true : showLetterBody;
    const bodyDisplay = showBody ? '' : 'display:none';
    // Encode which option(s) should reveal the body, so selectOption() can toggle correctly.
    // VA body shows for any option (DIC/burial details are useful regardless of channel).
    const bodyShowWhen = isSSA ? 'call' : isVA ? 'call,online,visit' : isStreaming ? 'letter,call' : 'letter,draft';

    document.getElementById('wcol').innerHTML = `
      <div class="wf-header">
        <div class="slbl" style="margin-bottom:5px">Task</div>
        <div class="wf-task-name">${t.name}</div>
        <div class="wf-meta" style="margin-top:7px">
          <span class="badge urg ${urgCls}">${urgLabel}</span>
          <span class="badge" style="background:var(--bg3);color:var(--text2);border-radius:3px;padding:2px 8px;font-size:10px">${t.category}</span>
          ${t.institution ? `<span class="badge" style="background:var(--bg3);color:var(--text2);border-radius:3px;padding:2px 8px;font-size:10px">${t.institution}</span>` : ''}
          ${A.state ? `<span class="badge" style="background:rgba(90,159,212,0.08);color:var(--blue);border-radius:3px;padding:2px 8px;font-size:10px;border:1px solid rgba(90,159,212,0.2)">${A.state}</span>` : ''}
        </div>
      </div>
      <div class="d-desc" style="font-size:13px;color:var(--text2);line-height:1.75;padding:11px;background:var(--bg3);border-radius:7px;border:1px solid var(--border)">${t.description}</div>
      ${renderLinkChips(t)}
      ${renderLegalAcc(t)}
      ${renderOptionsSection(t, wf)}
      <div id="wf-body-${t.id}" data-show-when="${bodyShowWhen}" style="${bodyDisplay}">${body}</div>
      ${isDone ? `<div class="done-banner"><div class="done-banner-title">✓ Task complete</div><div class="done-banner-sub">You can always reopen this task to edit notes or redraft the letter.</div></div>` : ''}
      <div>
        <div style="display:flex;align-items:baseline;justify-content:space-between;margin-bottom:5px">
          <div class="slbl">Notes</div>
          <div style="font-size:10px;color:var(--text3)">Jot down account numbers, contact info, or anything to reference while drafting</div>
        </div>
        <div style="background:var(--bg3);border:1px solid var(--border2);border-radius:7px;overflow:hidden">
          <textarea id="notes-ta-${t.id}" style="width:100%;background:transparent;border:none;padding:10px 12px;color:var(--text);font-family:DM Sans,sans-serif;font-size:13px;outline:none;resize:vertical;min-height:80px;line-height:1.65;box-sizing:border-box" placeholder="e.g. Account ending in 4321 — Chase Bank. HR contact: Jane Smith, hr@company.com. Policy number: 00123." oninput="taskNotes['${t.id}']=this.value;scheduleSave();">${taskNotes[t.id] || ''}</textarea>
          <div style="display:flex;justify-content:flex-end;padding:4px 8px 6px;border-top:1px solid var(--border)">
            <button style="font-size:11px;padding:4px 12px;background:var(--bg2);border:1px solid var(--border2);border-radius:4px;color:var(--text2);cursor:pointer;font-family:inherit;transition:all .15s" onmouseenter="this.style.borderColor='var(--gold)';this.style.color='var(--gold)'" onmouseleave="this.style.borderColor='var(--border2)';this.style.color='var(--text2)'" onclick="taskNotes['${t.id}']=document.getElementById('notes-ta-${t.id}').value;scheduleSave();this.textContent='Saved';setTimeout(()=>this.textContent='Save note',1500)">Save note</button>
          </div>
        </div>
      </div>
      <div style="display:flex;gap:8px">
        <button class="btn-gold" style="flex:1;font-size:13px;padding:10px" onclick="togDone('${t.id}')">${isDone ? 'Mark as not done' : 'Mark as complete'}</button>
      </div>
    `;
    renderTrace(t.id);
  } catch (err) {
    document.getElementById('wcol').innerHTML = `<div style="padding:20px;font-size:13px;color:var(--red)">Error loading task: ${err.message}</div>`;
    console.error('renderWorkflow error:', err);
  }
}
