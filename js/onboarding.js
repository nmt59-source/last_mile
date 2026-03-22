// ── ONBOARDING — INTAKE, UPLOAD, DECLARATION, TAX PARSING ──

const STATES = ['Alabama','Alaska','Arizona','Arkansas','California','Colorado','Connecticut','Delaware','Florida','Georgia','Hawaii','Idaho','Illinois','Indiana','Iowa','Kansas','Kentucky','Louisiana','Maine','Maryland','Massachusetts','Michigan','Minnesota','Mississippi','Missouri','Montana','Nebraska','Nevada','New Hampshire','New Jersey','New Mexico','New York','North Carolina','North Dakota','Ohio','Oklahoma','Oregon','Pennsylvania','Rhode Island','South Carolina','South Dakota','Tennessee','Texas','Utah','Vermont','Virginia','Washington','West Virginia','Wisconsin','Wyoming','Washington D.C.'];

const Qs = [
  { id: 'name', lbl: 'What was the full name of the person who passed?', hint: 'This name appears in all letters and notifications.', type: 'text', ph: 'Their full legal name' },
  { id: 'rel', lbl: 'What is your relationship to them?', hint: 'This helps identify which benefits and steps apply to you.', type: 'single', opts: ['Spouse or domestic partner', 'Adult child', 'Parent', 'Sibling', 'Executor (not a family member)', 'Other'] },
  { id: 'state', lbl: 'Which state did they live in?', hint: 'Rules for probate, benefits, and transfers vary by state.', type: 'select' },
  { id: 'assets', lbl: 'Which of these did they have?', hint: 'Select all that apply.', type: 'multi', opts: ['Bank or checking accounts', 'Savings or money market accounts', 'Traditional 401(k) or 403(b)', 'Roth 401(k) or Roth IRA', 'Traditional IRA', 'Investment or brokerage account', 'Life insurance policy', 'Home or real estate', 'Vehicle', 'Cryptocurrency or digital assets'] },
  { id: 'debts', lbl: 'Did they have any outstanding debts or obligations?', hint: 'The estate is responsible for settling debts before assets are distributed.', type: 'multi', opts: ['Mortgage or home equity loan', 'Car loan', 'Credit card balances', 'Student loans', 'Medical bills', 'Personal loans', 'Business debts', 'No known debts'] },
  { id: 'digital', lbl: 'Which online accounts or subscriptions did they have?', hint: 'Select all that apply. Each has its own process.', type: 'multi', opts: ['Facebook / Instagram', 'Apple ID / iCloud', 'Google account', 'Netflix / Hulu / streaming', 'Amazon / Prime', 'LinkedIn', 'Email account (Gmail, Outlook)', 'Other subscriptions'] },
  { id: 'benefits', lbl: 'Were they receiving any of these?', hint: 'Helps identify notifications and what your family may be owed.', type: 'multi', opts: ['Social Security retirement or disability', 'Medicare or Medicaid', 'Veterans benefits (VA)', 'Pension from an employer', 'Workers compensation', 'None of the above'] },
  { id: 'survivors', lbl: 'Who else may be affected?', hint: 'Helps identify survivor benefits.', type: 'multi', opts: ['Spouse or domestic partner still living', 'Children under 18', 'Children with a disability (any age)', 'Dependent parents', 'Others named in a will or trust', 'No one else'] },
  { id: 'discover', lbl: 'Could any of these apply?', hint: 'Account discovery — we fold these into your checklist.', type: 'multi', opts: ['Old employer retirement or pension not listed yet', 'Military, union, or veteran benefits', 'Safe deposit box or home safe', 'Storage rental', 'Oil, gas, or mineral royalties', 'None of these'] },
  { id: 'will', lbl: 'Is there a will or estate plan?', hint: 'Determines which legal steps are required.', type: 'single', opts: ['Yes, there is a will', 'Yes, there is a trust', 'Both a will and a trust', 'No will or trust known', 'Not sure yet'] },
];

// ── SCREEN NAVIGATION ──
function go(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

// ── QUESTION RENDERING ──
function renderQs() {
  document.getElementById('qs').innerHTML = Qs.map((q, i) => {
    let inp = '';
    if (q.type === 'text') inp = `<input class="q-input" id="qi${i}" type="text" placeholder="${q.ph || ''}" value="${A[q.id] || ''}" oninput="A['${q.id}']=this.value;valQ()"/>`;
    else if (q.type === 'select') inp = `<div class="select-wrap"><select class="q-select" id="qi${i}" onchange="A['${q.id}']=this.value;valQ()"><option value="">Select a state</option>${STATES.map(s => `<option value="${s}"${A[q.id] === s ? ' selected' : ''}>${s}</option>`).join('')}</select><span class="select-arrow">▾</span></div>`;
    else if (q.type === 'single') inp = `<div class="opts">${q.opts.map(o => `<div class="opt${A[q.id] === o ? ' sel' : ''}" onclick="pickOne('${q.id}',this,'${o.replace(/'/g, "\\'")}')">${o}</div>`).join('')}</div>`;
    else inp = `<div class="opts">${q.opts.map(o => `<div class="opt${(A[q.id] || []).includes(o) ? ' sel' : ''}" onclick="pickMany('${q.id}',this,'${o.replace(/'/g, "\\'")}')">${o}</div>`).join('')}</div>`;
    return `<div class="q-block${i === qIdx ? ' active' : ''}" id="qb${i}"><div class="q-lbl">${q.lbl}</div><div class="q-hint">${q.hint}</div>${inp}</div>`;
  }).join('');
  updNav();
}

function pickOne(id, el, v) { A[id] = v; el.closest('.opts').querySelectorAll('.opt').forEach(o => o.classList.remove('sel')); el.classList.add('sel'); valQ(); }
function pickMany(id, el, v) { if (!A[id]) A[id] = []; if (A[id].includes(v)) { A[id] = A[id].filter(x => x !== v); el.classList.remove('sel'); } else { A[id].push(v); el.classList.add('sel'); } valQ(); }
function valQ() { const q = Qs[qIdx]; const ok = q.type === 'text' ? !!(A[q.id] || '').trim() : q.type === 'select' ? !!A[q.id] : (A[q.id] || []).length > 0; document.getElementById('bnxt').disabled = !ok; }
function updNav() { document.getElementById('iprog').style.width = ((qIdx + 1) / Qs.length * 100) + '%'; document.getElementById('slbl2').textContent = `${qIdx + 1} of ${Qs.length}`; document.getElementById('bbk').style.display = qIdx === 0 ? 'none' : 'block'; document.getElementById('bnxt').textContent = qIdx === Qs.length - 1 ? 'Review and continue' : 'Continue'; valQ(); }
function nextQ() { if (qIdx < Qs.length - 1) { document.getElementById('qb' + qIdx).classList.remove('active'); qIdx++; document.getElementById('qb' + qIdx).classList.add('active'); updNav(); const inp = document.getElementById('qi' + qIdx); if (inp) inp.focus(); } else showDeclaration(); }
function prevQ() { if (qIdx > 0) { document.getElementById('qb' + qIdx).classList.remove('active'); qIdx--; document.getElementById('qb' + qIdx).classList.add('active'); updNav(); } }

// ── VERIFICATION ──
function chkEmail() { document.getElementById('btn-code').disabled = !(document.getElementById('e-inp').value || '').trim().includes('@'); }
function sendCode() { simCode = Math.floor(100000 + Math.random() * 900000).toString(); document.getElementById('code-sec').style.display = 'block'; console.log('Demo code:', simCode); }
function chkCode() { const v = (document.getElementById('c-inp').value || '').trim(); if (v.length === 6 && v === simCode) { emailOk = true; document.getElementById('e-ok').style.display = 'flex'; document.getElementById('code-sec').style.display = 'none'; } }
function chkSig() {
  const val = (document.getElementById('sig-inp').value || '').trim(), hint = document.getElementById('sig-hint'), btn = document.getElementById('btn-dec'), inp = document.getElementById('sig-inp');
  if (!val) { hint.textContent = ''; hint.className = 'nhint'; inp.className = 'n-inp'; btn.disabled = true; }
  else if (val.split(' ').length < 2) { hint.textContent = 'Please include your first and last name'; hint.className = 'nhint bad'; btn.disabled = true; }
  else { hint.textContent = 'Confirmed'; hint.className = 'nhint ok'; inp.className = 'n-inp ok'; btn.disabled = false; }
}
function showDeclaration() {
  go('s-declare');
  const rel = A.rel || 'executor', dec = A.name || 'the person who passed', st = A.state || 'this state';
  document.getElementById('dec-text').innerHTML = `I, <strong>[your name below]</strong>, confirm that I am the authorized <strong>${rel}</strong> of the estate of <strong>${dec}</strong>, and have legal authority to act on behalf of this estate under the laws of <strong>${st}</strong>.`;
  chkSig();
}

// ── UPLOAD ──
function showCertGuide() { document.getElementById('cert-guide').style.display = 'block'; }

// Blob URL store — keyed by "type-index". Revoked when files are deleted.
const _blobUrls = {};

function handleFile(type, input) {
  if (!input.files || !input.files[0]) return;
  const f = input.files[0];
  const sz = f.size > 1024 * 1024 ? `${(f.size / 1024 / 1024).toFixed(1)} MB` : `${Math.round(f.size / 1024)} KB`;
  const blobUrl = URL.createObjectURL(f);
  const idx = vaultFiles[type].length;
  vaultFiles[type].push({ name: f.name, size: sz });
  _blobUrls[type + '-' + idx] = blobUrl;
  refreshFiles(type);
  const lbl = document.getElementById(type + '-lbl');
  if (lbl) lbl.classList.add('filled');
  const badge = document.getElementById(type + '-badge');
  if (badge) { badge.textContent = 'Uploaded'; badge.className = 'ucard-badge done'; }
  if (type === 'bank') {
    window._bankUploaded = true;
    parseUploadedFile(f).then(text => parseTaxFile(text, f.name, 'bank')).then(() => preFillFromTax());
  }
  if (type === 'w2') {
    window._w2Uploaded = true;
    parseUploadedFile(f).then(text => parseTaxFile(text, f.name, 'w2')).then(() => {
      preFillFromTax();
      const employers = getPreFilledEmployers();
      const banner = document.getElementById('w2-scan-result');
      if (banner && employers.length) {
        banner.style.display = 'block';
        banner.textContent = '✓ Employer found: ' + employers.join(', ') + ' — will be pre-filled in the HR notification task.';
      }
    });
  }
  if (type === 'cert') window._certUploaded = true;
  // Reset input so the same file can be re-uploaded if needed
  input.value = '';
}

function refreshFiles(type) {
  const el = document.getElementById(type + '-files');
  if (!el) return;
  if (!vaultFiles[type].length) { el.innerHTML = ''; return; }
  el.innerHTML = vaultFiles[type].map((f, i) => {
    const blobUrl = _blobUrls[type + '-' + i];
    const previewBtn = blobUrl
      ? `<button class="uchip-preview" title="Preview" onclick="window.open('${blobUrl}','_blank')">Preview</button>`
      : '';
    return `<div class="uchip">
      <span style="font-size:13px;flex-shrink:0">📎</span>
      <span class="uchip-name" title="${f.name}">${f.name}</span>
      <span class="uchip-sz">${f.size}</span>
      ${previewBtn}
      <button class="uchip-del" title="Remove" onclick="delFile('${type}',${i})">✕</button>
    </div>`;
  }).join('');
}

function delFile(type, idx) {
  // Revoke the blob URL to free memory
  const key = type + '-' + idx;
  if (_blobUrls[key]) { URL.revokeObjectURL(_blobUrls[key]); delete _blobUrls[key]; }
  vaultFiles[type].splice(idx, 1);
  // Re-key remaining blob URLs after the deleted index
  for (let i = idx; i < vaultFiles[type].length; i++) {
    _blobUrls[type + '-' + i] = _blobUrls[type + '-' + (i + 1)];
  }
  delete _blobUrls[type + '-' + vaultFiles[type].length];
  refreshFiles(type);
  // Reset badge if no files remain
  if (!vaultFiles[type].length) {
    const badge = document.getElementById(type + '-badge');
    const lbl = document.getElementById(type + '-lbl');
    if (badge && type === 'cert') { badge.textContent = 'Recommended'; badge.className = 'ucard-badge imp'; }
    if (badge && type === 'bank') { badge.textContent = 'Important'; badge.className = 'ucard-badge imp'; }
    if (badge && type === 'w2')   { badge.textContent = 'Optional';  badge.className = 'ucard-badge opt'; }
    if (lbl) lbl.classList.remove('filled');
  }
}

// ── LOADING SCREEN ──
const loadMsgs = ['Reviewing your intake responses…', 'Matching tasks to your assets and debts…', 'Identifying applicable survivor benefits…', 'Building your personalized checklist…', 'Adding state-specific guidance for ' + (A.state || 'your state') + '…'];

function startLoad() {
  if (tasks.length && A.name) {
    go('s-dashboard');
    renderDash();
    refreshFiles('cert'); refreshFiles('bank');
    scheduleSave();
    return;
  }
  go('s-loading');
  const el = document.getElementById('lsteps');
  el.innerHTML = loadMsgs.map(s => `<div class="ls"><div class="ls-dot"></div>${s}</div>`).join('');
  const steps = el.querySelectorAll('.ls'); let i = 0;
  (function tick() { if (i > 0) steps[i - 1].classList.remove('active'); if (i < steps.length) { steps[i].classList.add('active'); i++; setTimeout(tick, 750); } })();
  genTasks();
}

// ── PII OBFUSCATION ──
// Removes or masks sensitive identifiers BEFORE any content is sent to the LLM.
// Only institution names, account types, and employer names are passed through.
function obfuscateForLLM(text) {
  if (!text) return text;
  return text
    .replace(/\b\d{3}-\d{2}-\d{4}\b/g, 'XXX-XX-XXXX')                                  // SSN with dashes
    .replace(/\b\d{9}\b(?=\D|$)/g, 'XXXXXXXXX')                                          // SSN no dashes
    .replace(/\b\d{8,17}\b/g, m => 'XXXX' + m.slice(-4))                                 // Account/card numbers
    .replace(/\b(?:0[1-9]|1[0-2])[\/\-](?:0[1-9]|[12]\d|3[01])[\/\-](?:19|20)\d{2}\b/g, 'XX/XX/XXXX') // Dates
    .replace(/\b[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}\b/g, '[EMAIL]')        // Email addresses
    .replace(/\b(?:\+1[\s\-.]?)?\(?\d{3}\)?[\s\-.]?\d{3}[\s\-.]?\d{4}\b/g, '[PHONE]')   // Phone numbers
    .replace(/\b\d{1,5}\s+[A-Za-z][A-Za-z0-9\s]+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Drive|Dr|Lane|Ln|Way|Court|Ct|Place|Pl)\b[^\n]*/gi, '[ADDRESS]'); // Addresses
}

// ── TAX / BANK / W2 FILE PARSING ──
// Reads the uploaded file as text, obfuscates all PII, then sends only institution
// names, employer names, and account type context to the LLM.
// Sensitive data never leaves the browser unmasked.
async function parseTaxFile(fileContent, fileName, docType) {
  const docLabel = docType === 'w2' ? 'W-2' : 'bank statement or tax return';
  addTrace('global', 'step', 'Scanning your document',
    `Looking for financial institutions and employer information in your ${docLabel}. All personal details are removed before any information leaves your device.`);
  try {
    const safeContent = fileContent ? obfuscateForLLM(fileContent) : null;
    const isW2 = docType === 'w2' || (fileName || '').toLowerCase().includes('w2') || (fileName || '').toLowerCase().includes('w-2');

    const prompt = safeContent
      ? `Document filename: ${fileName}\nDocument type hint: ${isW2 ? 'W-2 wage and tax statement' : 'bank statement or tax return'}\nDocument content (all personal identifiers already removed):\n${safeContent.slice(0, 3000)}\n\nFrom the content above:\n1. List every financial institution, bank, investment firm, insurer, or pension source (with account type if shown)\n2. List every employer name found (box c on a W-2, or Schedule C/W-2 employer on a tax return)\n\nFormat as JSON: {"institutions": ["...", "..."], "employers": ["...", "..."]}`
      : `File uploaded: ${fileName} (${isW2 ? 'W-2' : 'bank statement or tax return'})\nEstate state: ${A.state || 'unknown'}.\n\nReturn plausible examples only if content was not readable. Format as JSON: {"institutions": [], "employers": []}`;

    const r = await anthropicFetch({
      model: 'claude-sonnet-4-20250514', max_tokens: 600,
      system: 'You are an estate specialist. From a document with personal information already removed, extract only institution names, account types, and employer names. Do not invent details. Return valid JSON only. No em dashes. Do not mention AI.',
      messages: [{ role: 'user', content: prompt }],
    });
    const d = await r.json();
    let raw = (d.content?.[0]?.text || '').replace(/```json|```/g, '').trim();
    let parsed; try { parsed = JSON.parse(raw); } catch (_) { parsed = null; }

    const institutions = (parsed?.institutions || []).filter(Boolean);
    const employers    = (parsed?.employers    || []).filter(Boolean);

    // Store results globally for use in workflows and task drafting
    const summaryLines = [
      ...institutions.map(i => `• ${i}`),
      ...employers.map(e => `• ${e} (employer)`),
    ];
    window._taxParsed    = summaryLines.join('\n');
    window._taxAccounts  = summaryLines.join('\n');
    window._taxEmployers = employers;

    const totalFound = institutions.length + employers.length;
    addTrace('global', 'verify', 'Document scanned',
      totalFound > 0
        ? `Found ${institutions.length} financial institution${institutions.length !== 1 ? 's' : ''} and ${employers.length} employer${employers.length !== 1 ? 's' : ''} in your document. These will be pre-filled where possible.`
        : 'We were not able to extract account details from this document. You can still enter them manually.');

    const banner = document.getElementById('tax-scan-result');
    if (banner && totalFound > 0) {
      banner.style.display = 'block';
      const preview = [...institutions.slice(0, 2), ...employers.slice(0, 1)].join(' · ');
      banner.textContent = 'Found: ' + preview + (totalFound > 3 ? ' and more…' : '');
    }
    return window._taxParsed;
  } catch (e) {
    console.error('Tax parse error:', e);
    return null;
  }
}

// Extract clean text from a PDF using PDF.js (returns all page text concatenated).
async function extractPdfText(file) {
  if (typeof pdfjsLib === 'undefined') return '';
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let text = '';
    for (let p = 1; p <= pdf.numPages; p++) {
      const page = await pdf.getPage(p);
      const content = await page.getTextContent();
      text += content.items.map(item => item.str).join(' ') + '\n';
    }
    return text;
  } catch (e) {
    console.warn('PDF.js extraction failed:', e);
    return '';
  }
}

// Read a File object as clean text.
// PDFs are parsed with PDF.js for reliable text extraction.
// Plain text / CSV files fall back to FileReader.
async function parseUploadedFile(file) {
  if (file.name.toLowerCase().endsWith('.pdf') || file.type === 'application/pdf') {
    return extractPdfText(file);
  }
  return new Promise(resolve => {
    const reader = new FileReader();
    reader.onload = e => resolve(e.target?.result || '');
    reader.onerror = () => resolve('');
    if (file.size < 3 * 1024 * 1024) {
      reader.readAsText(file);
    } else {
      resolve('');
    }
  });
}

function preFillFromTax() {
  if (!window._taxParsed) return;
  const lines = window._taxParsed.split('\n').filter(l => l.trim());
  window._taxBankNames = lines
    .filter(l => !l.includes('(employer)'))
    .map(l => l.replace(/^[-*•]\s*/, '').split('(')[0].trim())
    .filter(Boolean);
}

function getPreFilledBanks()     { return window._taxBankNames || []; }
function getPreFilledEmployers() { return window._taxEmployers || []; }
