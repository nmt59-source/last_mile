// ── STATE ──
// Shared application state — all modules read/write these globals directly.
const A = {};
let qIdx = 0, tasks = [], customTasks = [], selTask = null, draftTxt = '';
const taskDone = {}, taskNotes = {}, wfState = {}, vaultFiles = { cert: [], bank: [], w2: [] };
let emailOk = false, simCode = '';

// API configuration
// Priority: window.PASSAGE_API_BASE > direct browser key > localhost backend
const API_BASE = (typeof window !== 'undefined' && window.PASSAGE_API_BASE)
  ? window.PASSAGE_API_BASE
  : 'http://localhost:8787';

function isDemoMode() {
  return typeof window !== 'undefined' &&
    window.ANTHROPIC_API_KEY &&
    window.ANTHROPIC_API_KEY !== 'sk-ant-YOUR-KEY-HERE' &&
    !window.PASSAGE_API_BASE;
}

function apiRoot() { return (API_BASE || 'http://localhost:8787').replace(/\/$/, ''); }

function anthropicFetch(bodyObj) {
  if (isDemoMode()) {
    // Direct browser call — no backend needed.
    // Uses the anthropic-dangerous-direct-browser-iab header as required by Anthropic
    // for browser-side API calls. Suitable for demos; use the backend proxy in production.
    return fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01',
        'x-api-key': window.ANTHROPIC_API_KEY,
        'anthropic-dangerous-direct-browser-iab': 'true',
      },
      body: JSON.stringify(bodyObj),
    });
  }
  return fetch(apiRoot() + '/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'anthropic-version': '2023-06-01' },
    body: JSON.stringify(bodyObj),
  });
}

function orchestrateBankUrl() { return apiRoot() + '/api/orchestrate/bank-draft'; }

// Tracker state (persisted separately for clarity)
let trackerState = { certOrdered: 0, certOnHand: 0, certMailed: 0, certNote: '', responses: [], dateOfDeath: '' };

// ── PERSISTENCE ──
const PASSAGE_LS_KEY = 'passage_estate_v1';

function savePassageState() {
  try {
    localStorage.setItem(PASSAGE_LS_KEY, JSON.stringify({
      A, tasks, customTasks, taskDone, taskNotes, wfState, vaultFiles,
      trackerState, qIdx, customTasksId: window._customTaskSeq || 0,
    }));
  } catch (e) { console.warn('save state', e); }
}

function loadPassageState() {
  try {
    const raw = localStorage.getItem(PASSAGE_LS_KEY);
    if (!raw) return;
    const s = JSON.parse(raw);
    Object.assign(A, s.A || {});
    if (s.tasks && s.tasks.length) tasks = s.tasks;
    if (s.customTasks && s.customTasks.length) customTasks = s.customTasks;
    else customTasks = (tasks || []).filter(t => String(t.id).startsWith('custom-'));
    if (s.taskDone) Object.assign(taskDone, s.taskDone);
    if (s.taskNotes) Object.assign(taskNotes, s.taskNotes);
    if (s.wfState) Object.assign(wfState, s.wfState);
    if (s.vaultFiles) Object.assign(vaultFiles, s.vaultFiles);
    if (s.trackerState) Object.assign(trackerState, s.trackerState);
    if (typeof s.qIdx === 'number') qIdx = s.qIdx;
    if (s.customTasksId) window._customTaskSeq = s.customTasksId;
    if (s.trackerState && s.trackerState.dateOfDeath) trackerState.dateOfDeath = s.trackerState.dateOfDeath;
  } catch (e) { console.warn('load state', e); }
}

function scheduleSave() {
  clearTimeout(window._saveT);
  window._saveT = setTimeout(savePassageState, 400);
}
