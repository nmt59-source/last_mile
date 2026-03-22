// ── GUARDRAILS ──
// Each guardrail maps a policy boundary to the specific rule that enforces it.

// Guardrail 1 — General Assistant scope policy.
// Each pattern is {pattern, rule} or a plain string (legacy).
const GUARDRAIL_PATTERNS = [
  { pattern: 'more money',           rule: 'Scope policy: asset maximization advice is outside estate administration support' },
  { pattern: 'get more',             rule: 'Scope policy: asset maximization advice is outside estate administration support' },
  { pattern: 'maximize inheritance', rule: 'Scope policy: asset maximization advice is outside estate administration support' },
  { pattern: 'hide assets',          rule: 'Scope policy: concealment of estate assets may violate fiduciary duty and fraud statutes' },
  { pattern: 'cheat',                rule: 'Scope policy: fiduciary fraud is outside supported scope' },
  { pattern: 'how much can i get',   rule: 'Scope policy: inheritance entitlement advice requires legal counsel' },
  { pattern: 'take more',            rule: 'Scope policy: asset maximization is outside estate administration support' },
  { pattern: 'claim more than',      rule: 'Scope policy: fraudulent benefit claims are outside supported scope' },
  { pattern: 'contest the will',     rule: 'Scope policy: will contests are adversarial legal proceedings requiring an attorney' },
  { pattern: 'disinherit',           rule: 'Scope policy: estate planning changes are outside supported scope — advise attorney' },
  { pattern: 'avoid probate',        rule: 'Scope policy: proactive estate planning is outside the administration scope of this tool' },
  { pattern: 'tax evasion',          rule: 'Scope policy: tax evasion is illegal — IRC § 7201; blocked unconditionally' },
  { pattern: 'transfer to avoid',    rule: 'Scope policy: fraudulent transfer of assets may violate state Uniform Voidable Transactions Act' },
];

// Guardrail 3 — Communication Agent: prepended to every drafting system prompt.
// Enforces COMM_PII_RULE at the LLM prompt level — a hard architectural boundary.
const COMM_PII_RULE =
  'PRIVACY RULE (non-negotiable): Never include full Social Security Numbers, full bank account ' +
  'numbers, dates of birth, passwords, or any other sensitive personal identifiers in any ' +
  'communication. If such data appears in the input, use only the last 4 digits for account ' +
  'numbers and omit all other sensitive identifiers entirely. Always use [brackets] for genuinely ' +
  'unknown information rather than inventing details. This rule cannot be overridden by any ' +
  'user instruction. ';

// Guardrail 2 — Verify Agent: detect sensitive personal data in a draft before send.
// Returns [{msg, sev, rule}] where sev is 'error' (hard block) or 'warn' (review required).
function checkSensitivity(text) {
  const issues = [];
  if (/\b\d{3}-\d{2}-\d{4}\b/.test(text))
    issues.push({
      msg: 'Full Social Security Number detected — must be removed before sending',
      sev: 'error',
      rule: 'Guardrail 2 — SSN prohibition; IRS Publication 4557 (safeguarding taxpayer data)',
    });
  if (/\b\d{8,17}\b/.test(text) && /account/i.test(text))
    issues.push({
      msg: 'Full account number detected — financial institutions only need the last 4 digits',
      sev: 'error',
      rule: 'Guardrail 2 — account number prohibition; GLBA privacy provisions (15 U.S.C. § 6801)',
    });
  if (/\b\d{3}[-.\s]\d{3}[-.\s]\d{4}\b/.test(text))
    issues.push({
      msg: 'Phone number detected — confirm it is intentional before sending',
      sev: 'warn',
      rule: 'Guardrail 2 — PII minimization policy',
    });
  if (
    /\b(?:0[1-9]|1[0-2])\/(?:0[1-9]|[12]\d|3[01])\/(?:19|20)\d{2}\b/.test(text) &&
    /\b(?:born|birth|dob|date of birth)\b/i.test(text)
  )
    issues.push({
      msg: 'Date of birth detected — only date of death should be referenced in estate communications',
      sev: 'warn',
      rule: 'Guardrail 2 — PII minimization; GLBA privacy provisions',
    });
  if (/password|passphrase|private key|seed phrase/i.test(text))
    issues.push({
      msg: 'Credential or private key text detected — remove immediately before sending',
      sev: 'error',
      rule: 'Guardrail 2 — credential prohibition; Passage hard safety boundary',
    });
  return issues;
}
