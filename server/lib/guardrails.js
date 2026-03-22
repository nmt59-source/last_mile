/**
 * Guardrail 1 — General Assistant: block out-of-scope or harmful user requests.
 * Applied before any agent pipeline is invoked.
 */
const BLOCK_PATTERNS = [
  'more money',
  'get more',
  'maximize inheritance',
  'hide assets',
  'cheat',
  'how much can i get',
  'take more',
  'claim more than',
  'get more from the will',
  'more from the will',
  'contest the will',
  'disinherit',
];

export function shouldBlockUserMessage(text) {
  if (!text || typeof text !== 'string') return false;
  const lower = text.toLowerCase();
  return BLOCK_PATTERNS.some((p) => lower.includes(p));
}

/**
 * Guardrail 2 — Verify Agent: detect sensitive personal data in a draft.
 * Returns [{msg, sev}] where sev is 'error' (must fix) or 'warn' (review).
 * Called by the Verify Agent after the Communication Agent produces a draft.
 */
export function checkDraftSensitivity(text) {
  if (!text || typeof text !== 'string') return [];
  const issues = [];
  if (/\b\d{3}-\d{2}-\d{4}\b/.test(text))
    issues.push({ msg: 'Full Social Security Number detected — must be removed before sending', sev: 'error' });
  if (/\b\d{8,17}\b/.test(text) && /account/i.test(text))
    issues.push({ msg: 'Full account number detected — banks only need the last 4 digits', sev: 'error' });
  if (/\b\d{3}[-.\s]\d{3}[-.\s]\d{4}\b/.test(text))
    issues.push({ msg: 'Phone number present — verify this is intentional', sev: 'warn' });
  if (
    /\b(?:0[1-9]|1[0-2])\/(?:0[1-9]|[12]\d|3[01])\/(?:19|20)\d{2}\b/.test(text) &&
    /\b(?:born|birth|dob|date of birth)\b/i.test(text)
  )
    issues.push({ msg: 'Date of birth may be present — only date of death should be referenced', sev: 'warn' });
  return issues;
}

/**
 * Guardrail 3 — Communication Agent: system prompt clause prohibiting PII in drafts.
 * Prepend this to every Communication Agent system prompt.
 */
export const COMM_AGENT_PII_RULE =
  'Never include full Social Security Numbers, full bank account numbers, dates of birth, or other sensitive personal identifiers in any communication. ' +
  'If such data appears in the input, use only the last 4 digits for account numbers and omit all other sensitive identifiers entirely. ' +
  'Always use [brackets] for genuinely unknown information rather than inventing details.';
