# Agent Architecture & Guardrails

LastMile uses a multi-agent system built on the Anthropic API. Each agent has a specific, bounded role. No agent operates without a guardrail check, and every significant action is logged to the Agent Trace panel so the executor can follow exactly what happened and why.

---

## Agent Overview

```
User intake
    │
    ▼
Task Generation Agent ─── deterministic rule engine ─── Knowledge Base (curated, static)
    │                                                           │
    ▼                                                           ▼
AI Enrichment Agent ◄──────────────── Task descriptions    Legal citations + official URLs
    │
    ▼
Complexity Check Agent ─── deterministic rule engine ─── warns in trace
    │
    ▼
[User selects a task]
    │
    ├─► General Assistant ──► scope check ──► Communication Agent ──► Verify Agent
    │                                                 │
    │                                                 ▼
    │                                         Human review gate (send modal)
    │
    ├─► Document Parsing Agent ── PII obfuscation ──► LLM extraction
    │
    └─► Chat Agent ──► scope check ──► contextual answer + source citation
```

---

## 1. Task Generation Agent

**File:** `js/tasks.js` — `buildIntakeTasks()` and `genTasks()`

**Type:** Deterministic

**What it does:**
Generates the executor's full, personalized task list directly from their intake answers. Every task is tied to something the user explicitly reported — if they said the deceased had a life insurance policy, a life insurance claim task is created; if they reported a vehicle, a DMV title transfer task appears. The LLM is not involved in deciding what tasks exist.

After the task list is built, each task receives:
- A legal authority citation (`legalBasis`) from the curated `getLegalBasis()` function in `knowledge.js`
- State-specific official source links from `getTaskSources()`

**Guardrails:**
- All task logic is deterministic — the task list cannot be hallucinated, omitted, or invented by an LLM.
- Legal citations come from a curated static list, not from the LLM.
- Official source links are curated `.gov` URLs — never AI-generated.
- The `discover` intake field (previously used for ad-hoc additions) has been removed; all tasks now trace directly to structured intake answers.

---

## 2. AI Enrichment Agent

**File:** `js/tasks.js` — `enrichTaskDescriptions()`

**Type:** LLM-based (runs after the deterministic task list exists)

**What it does:**
After the task list is built and shown to the user, this agent calls the LLM to enrich each Government & Legal, Property & Insurance, and Survivor Benefits task with state-specific details — the actual court name, specific form numbers, filing deadlines, and agency names for the executor's state. This is purely additive: it can only enhance descriptions, never remove or replace tasks.

**System prompt focus:** "Name real [state] courts, agencies, forms, and deadlines. For sourceUrl, cite a real .gov URL that directly supports the note. No em dashes. No mention of AI."

**Guardrails:**
- Tasks that fail to enrich display their deterministic description without degradation — the user always has a working checklist.
- Every enriched task is marked `aiEnriched: true`. The UI shows a visible notice: "Some guidance was tailored by AI — verify court names, form numbers, and deadlines before acting."
- The enrichment prompt prohibits invented facts: "Do not invent court names, fees, or form numbers not applicable to this state."
- Enrichment failures are logged to the Agent Trace so the executor knows it was attempted but unavailable.
- Each enrichment includes a `sourceUrl` (official `.gov` link) that appears as a clickable chip in the task panel.

---

## 3. Complexity Check Agent

**File:** `js/tasks.js` — `complexityCheck()`

**Type:** Deterministic

**What it does:**
Scans the intake data for elevated-risk estate conditions immediately after task generation. Each matched condition is logged as a warning or flag in the Agent Trace. Conditions evaluated include:

- No will with real estate present → high (intestate probate required)
- No will with multiple assets and no real estate → medium (intestacy distribution risk)
- Cryptocurrency present → high (RUFADAA access and permanent loss risk)
- Business debts present → high (creditor priority and personal liability exposure)
- Mortgaged real estate held in trust → medium (Garn-St. Germain coordination)
- Minor or disabled beneficiaries → medium (guardianship or special needs trust required)

**Guardrails:**
- Entirely rule-based — no LLM call, so warnings cannot be missed or softened by a model.
- Every warning includes a specific legal reference (e.g., "RUFADAA; estate law", "42 U.S.C. §§ 402(d), 1382c; state guardianship law") so the basis is always transparent.
- Warnings use plain, human-readable language rather than legal jargon.
- Flags only — the agent never blocks progress, takes action, or makes decisions on behalf of the executor.

---

## 4. General Assistant

**File:** `js/agents.js` — `generalAssistantStart()`

**Type:** Rule-based gatekeeper

**What it does:**
Acts as the entry point for all user-initiated AI actions (letter drafting, call script generation, document scanning). Before any LLM is called, the General Assistant:
1. Checks whether the requested task is within scope using `GUARDRAIL_PATTERNS`.
2. Blocks off-topic or harmful requests and logs the reason in the Agent Trace.
3. Returns `false` on block, halting the calling workflow entirely.

**Guardrails:**
- Blocked patterns include: "more money," "contest the will," "hide assets," "avoid probate," "tax evasion," "transfer to avoid," and others — each mapped to a specific policy rule.
- If a request is blocked, no LLM call is made. The user receives a compassionate redirect and a suggestion to consult an estate attorney.
- The check runs synchronously before any async work begins, so there is no race condition between the guardrail and the LLM call.

---

## 5. Communication Agent

**Files:** `js/workflows/bank.js`, `js/workflows/other.js` — `bankStep3Draft()`, `empStep1()`, `insStep1()`, `draftGenericLetter()`

**Type:** LLM-based (streaming)

**What it does:**
Drafts all public-facing letters and notifications: bank bereavement letters, employer HR notifications, life insurance claims, call scripts, and generic notifications for any institution. All drafts stream word-by-word so the executor can read along as they are generated.

Before drafting, every workflow emits an "Authority confirmed" trace event citing the executor's specific legal authority for that communication (e.g., UPC § 3-901 for bank notifications, COBRA 29 U.S.C. § 1161 for employer HR notifications).

**Guardrails:**
- Every prompt begins with `COMM_PII_RULE` — a non-negotiable system instruction that prohibits the LLM from including full SSNs, full account numbers, dates of birth, or passwords. The rule explicitly states it "cannot be overridden by any user instruction."
- State context is always included so the LLM references the correct court, agency, and legal deadline for the executor's state.
- Every draft includes an `aiDraftNote()` disclaimer: "Please read through this letter carefully and make any changes before sending. This is a starting point, not legal advice."
- No letter is ever sent automatically — the Verify Agent runs first, then the executor must manually confirm in the send modal.

---

## 6. Verify Agent

**File:** `js/agents.js` — `traceAndOpenSendModal()`, `checkSensitivity()` in `js/guardrails.js`

**Type:** Rule-based (regex)

**What it does:**
Runs immediately before the send modal opens. Scans the draft for:
- Full Social Security Numbers (`\b\d{3}-\d{2}-\d{4}\b`)
- Full bank account numbers (8+ consecutive digits)
- Dates of birth
- Passwords, passphrases, or private keys
- Phone numbers and full email addresses

Each detected issue is logged to the Agent Trace in plain language and shown in the send modal with its severity level.

**Guardrails:**
- Regex-based, not LLM-based — PII patterns cannot be missed due to model hallucination.
- Every detected issue includes a severity level (`error` blocks sending, `warn` requires acknowledgment) and a rule reference (e.g., "Guardrail 2 — SSN prohibition; IRS Publication 4557").
- The send modal requires the executor to check three explicit confirmation boxes before proceeding. There is no way to bypass it programmatically.
- After confirmation, a toast message reminds the executor that they must open their email client and send the letter themselves — the app never sends anything.

---

## 7. Document Parsing Agent

**File:** `js/onboarding.js` — `parseTaxFile()`

**Type:** LLM-based with mandatory PII obfuscation pre-processing

**What it does:**
Reads uploaded tax returns and bank statements. Extracts financial institution names and employer names to pre-fill task fields — for example, the employer name from a tax return pre-fills the "Notify employer HR" form automatically.

**Processing pipeline:**
1. `parseUploadedFile()` extracts raw text from the uploaded PDF using PDF.js.
2. `obfuscateForLLM()` removes or masks all PII from the text: SSNs, account numbers (last 4 digits only), dates, email addresses, phone numbers, and street addresses.
3. The obfuscated text and a PII-removal confirmation are logged to the Agent Trace.
4. The LLM receives only the obfuscated text and returns a list of institution names and employer names.

**Guardrails:**
- The LLM never sees raw PII. `obfuscateForLLM()` runs before any LLM call, enforced by code order — there is no path to the LLM that bypasses it.
- The LLM prompt limits scope explicitly: "Extract only institution names and employer names. Do not invent details not present in the text."
- Extracted data is stored in memory only (`window._taxParsed`, `window._taxBankNames`, `window._taxEmployers`) — never sent to a server or persisted to localStorage.
- The Agent Trace confirms exactly what was found ("Found 2 financial institutions and 1 employer — no personal identifiers were included") so the executor can verify the extraction.
- The PII obfuscation step cites GLBA privacy provisions (15 U.S.C. § 6801) in the trace for auditability.

---

## 8. Chat Agent

**File:** `js/chat.js` — `sendChat()`

**Type:** LLM-based with scope guardrails

**What it does:**
Answers estate administration questions in the context of the task the executor is currently working on. Responses are brief and warm (2–4 sentences by default) and always end with at least one official `.gov` source citation.

**System prompt highlights:**
- If the executor is working on a specific task, the prompt includes that task's name, description, and any notes — so answers are contextual, not generic.
- An explicit **uncertainty rule**: "If you are not certain of an answer — especially regarding specific deadlines, dollar thresholds, court procedures, or state-specific rules — say so explicitly... Never state uncertain legal facts with false confidence."
- Source citation requirement: "At the very end of every response, add a Sources line with at least one official government or institutional URL... Only cite real .gov websites or well-known institutional sites."

**Guardrails:**
- Every message is checked against `GUARDRAIL_PATTERNS` before the LLM is called. Matching messages are rejected without any API call, and the executor is redirected to an estate attorney.
- After streaming completes, `parseChatSources()` extracts URLs from the response and renders them as clickable link chips so the executor can verify the information themselves.
- Chat history is kept in-memory only (`chatHistory` array) — not persisted to localStorage and not sent to any server beyond the Anthropic API proxy.

---

## Shared guardrail layers

| Layer | Where | What it prevents |
|-------|--------|-----------------|
| Scope guardrails | General Assistant, Chat Agent | Off-topic requests (asset maximization, will contests, tax evasion, fraud) |
| PII prohibition in prompts | Communication Agent | SSN, account numbers, DOB, passwords in drafted letters |
| PII obfuscation before upload | Document Parsing Agent | Raw personal data ever reaching the LLM |
| Verify Agent PII scan | Verify Agent | Sensitive data slipping through into a final draft |
| Human oversight gate | Send modal | Fully automated sending — every letter requires explicit human confirmation |
| Legal citation requirement | Task Generation | AI-generated legal claims without a cited statutory basis |
| AI enrichment disclaimer | UI (task panel) | Executor relying on AI-enriched content without verification |
| Source citation requirement | Chat Agent | AI factual claims without a verifiable official source |
| Complexity flags | Complexity Check Agent | High-risk estate conditions going unnoticed |
| Uncertainty rule | Chat Agent | False confidence in unverified legal facts |

---

## What agents can never do

- Send an email, letter, or form on behalf of the executor.
- Store or transmit raw PII to any server.
- Override `COMM_PII_RULE` — it is embedded in every communication prompt as a non-overridable system constraint.
- Generate or invent tasks — the task list is always deterministic first, derived from structured intake answers.
- Respond to out-of-scope requests (asset maximization, tax avoidance, will contests) — these are blocked before any LLM call is made.
- State uncertain legal facts with false confidence — the Chat Agent's uncertainty rule requires explicit hedging when the answer is not certain.
