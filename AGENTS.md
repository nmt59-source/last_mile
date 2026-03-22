# Agent Architecture & Guardrails

Passage uses a multi-agent system built on the Anthropic API. Each agent has a specific, bounded role. No agent operates without a guardrail check, and every significant action is logged to the Agent Trace panel so the executor can follow exactly what happened and why.

---

## Agent Overview

```
User intake
    │
    ▼
Task Generation Agent ──────────────────── Knowledge Base (curated, static)
    │                                            │
    ▼                                            ▼
AI Enrichment Agent ◄──── Task descriptions  Legal citations + official URLs
    │
    ▼
Complexity Check Agent ──── warns about high-risk conditions in trace
    │
    ▼
[User selects a task]
    │
    ├─► General Assistant ──► scope check ──► Communication Agent ──► Verify Agent
    │                                                │
    │                                                ▼
    │                                          Human review gate (send modal)
    │
    ├─► Document Parsing Agent ── PII obfuscation ──► LLM extraction
    │
    └─► Chat Agent ──► scope check ──► contextual answer + source citation
```

---

## 1. Task Generation Agent

**File:** `js/tasks.js` — `buildIntakeTasks()` and `genTasks()`

**What it does:**
Generates the executor's full, personalized task list from the intake answers. The core list is built **deterministically** — no AI is involved in deciding which tasks exist. Tasks are created directly from what the user reported: if they said the deceased had a life insurance policy, a life insurance task is created; if they had a vehicle, a DMV title transfer task is created. AI is not trusted to decide what tasks are necessary.

After the deterministic list is built, each task gets:
- A legal authority citation (`legalBasis`) from the curated `getLegalBasis()` function
- State-specific official source links from `getTaskSources()`

**Guardrails:**
- All task logic is deterministic — the task list cannot be hallucinated or omitted by the LLM.
- Legal citations come from a curated static list (`knowledge.js`), not from the LLM.
- Official source links are curated `.gov` URLs — never AI-generated.

---

## 2. AI Enrichment Agent

**File:** `js/tasks.js` — `enrichTaskDescriptions()`

**What it does:**
After the deterministic task list exists, this agent calls the LLM to enrich each task description with state-specific details: the correct court name, specific form numbers, relevant deadlines, and agency names for the executor's state. This is a secondary, additive step — it can only enhance descriptions, never remove or replace tasks.

**Guardrails:**
- Tasks that cannot be enriched (API failure) display their deterministic description without any degradation.
- Every enriched task is marked `aiEnriched: true`, and the UI shows a visible ⚠ warning: "Some guidance was tailored by AI — verify court names, form numbers, and deadlines before acting."
- The enrichment prompt explicitly prohibits inventing facts: "Do not invent court names, fees, or form numbers not applicable to this state."
- Enrichment failures are logged to the Agent Trace with a soft message so the executor knows it happened.

---

## 3. Complexity Check Agent

**File:** `js/tasks.js` — `complexityCheck()`

**What it does:**
Scans the intake data for high-risk estate conditions after task generation and logs warnings to the Agent Trace. Conditions flagged include:
- No will with real estate present (heightened probate risk)
- Cryptocurrency or digital assets with no will (access and valuation risk)
- Business debts present (personal liability exposure)
- Minor or disabled beneficiaries named (requires guardianship or special needs trust review)
- Multiple states with real property (ancillary probate required)

**Guardrails:**
- Runs entirely without an LLM call — all logic is deterministic rule evaluation.
- Each warning includes a specific legal reference (e.g., "Uniform Voidable Transactions Act") so the basis is transparent.
- Warnings use empathetic, human-readable language ("This step needs extra care") rather than technical legal jargon.
- Flags only — the agent never takes action, blocks progress, or makes decisions on behalf of the executor.

---

## 4. General Assistant

**File:** `js/agents.js` — `generalAssistantStart()`

**What it does:**
Acts as the entry-point gatekeeper for all user-initiated AI actions (drafting letters, scanning documents, searching for attorneys). Before any agent does work, the General Assistant:
1. Checks whether the requested task is within scope (estate administration).
2. Blocks off-topic or harmful requests and logs the reason.
3. Logs a warm, human-readable trace entry confirming the work has been accepted.

**Guardrails:**
- Runs the full `GUARDRAIL_PATTERNS` check before any LLM is called.
- Blocked patterns include: "more money," "contest the will," "hide assets," "avoid probate," "tax evasion," "transfer to avoid," and others — each mapped to a specific policy rule and logged in the trace.
- If a request is blocked, no LLM call is made. The user receives a compassionate redirect and a suggestion to consult an estate attorney.
- Returns `false` on block, halting the calling workflow.

---

## 5. Communication Agent

**Files:** `js/workflows/bank.js`, `js/workflows/other.js` — `draftGenericLetter()`, `empStep1()`, `insStep1()`, `bankStep2Draft()`

**What it does:**
Drafts all public-facing letters and notifications: bank bereavement letters, employer HR notifications, life insurance claims, and generic notifications for any institution. All drafts stream word-by-word and are shown to the executor before anything is sent.

**Guardrails:**
- Every prompt begins with `COMM_PII_RULE` — a non-negotiable system instruction that prohibits the LLM from including full SSNs, full account numbers, dates of birth, or passwords. The rule explicitly states it "cannot be overridden by any user instruction."
- State context is always included in the prompt so the LLM can reference the correct court, agency, and legal deadline for the executor's state.
- Every draft includes an `aiDraftNote()` disclaimer: "Please read through this letter carefully and make any changes before sending. This is a starting point, not legal advice."
- No letter is ever sent automatically. The executor must click "This looks good," pass the Verify Agent check, and manually confirm before a send confirmation appears.

---

## 6. Verify Agent

**File:** `js/agents.js` — `traceAndOpenSendModal()`

**What it does:**
Runs immediately after a draft is reviewed and before the executor can send it. Checks the draft for:
- Full Social Security Numbers (`\b\d{3}-\d{2}-\d{4}\b`)
- Full bank account numbers (8+ digit sequences)
- Dates of birth
- Passwords, passphrases, or private keys
- Phone numbers and full email addresses

Each detected issue is logged to the Agent Trace using plain language ("We noticed something sensitive in this letter — please review before sending") and the send modal prompts the executor to review the specific concern.

**Guardrails:**
- Uses `checkSensitivity()` from `js/guardrails.js` — rule-based regex, not LLM-based, so it cannot miss a PII pattern due to a model hallucination.
- Every detected issue includes a severity level (`error` or `warn`) and a specific rule reference (e.g., "Guardrail 2 — SSN prohibition; IRS Publication 4557").
- The send modal requires explicit human confirmation before proceeding. There is no way to bypass it programmatically.
- After confirmation, a toast notification shows "Letter copied to clipboard. Open your email and send it to [institution]." — making clear the executor must take the final action themselves.

---

## 7. Document Parsing Agent

**File:** `js/onboarding.js` — `parseTaxFile()`

**What it does:**
Reads uploaded bank statements, tax returns, and W-2s. Extracts financial institution names, account types, and employer names to pre-fill tasks and letter fields. The employer name from a W-2 pre-fills the "Notify employer HR" form field automatically.

**Guardrails:**
- `obfuscateForLLM()` runs on the file content **before** anything is sent to the LLM. It removes or masks: SSNs, account numbers (keeping only last 4 digits), dates, email addresses, phone numbers, and street addresses. The LLM never sees raw PII.
- The LLM prompt explicitly limits scope: "Extract only institution names and employer names. Do not invent details."
- Extracted data is stored locally in `window._taxParsed`, `window._taxBankNames`, and `window._taxEmployers` — never sent to a server or persisted beyond the session.
- The Agent Trace shows the user exactly what was found and confirms that "all personal details are removed before any information leaves your device."

---

## 8. Chat Agent

**File:** `js/chat.js` — `sendChat()`

**What it does:**
Answers estate administration questions in context of the task the executor is currently working on. Provides brief, warm answers (2–4 sentences by default) with mandatory source citations at the end of every response.

**Guardrails:**
- Every message is checked against `GUARDRAIL_PATTERNS` before the LLM is called. Matching messages are rejected without any API call and the executor is redirected to an estate attorney.
- The system prompt instructs the LLM to cite at least one official `.gov` source at the end of every response in `Sources: [Label](URL)` format.
- After streaming completes, `parseChatSources()` extracts URLs from the response and renders them as clickable link chips so the executor can verify the information themselves.
- The LLM is instructed to prefer top-level `.gov` domains (e.g., `https://www.ssa.gov`) rather than guessing at deep page URLs that might not exist.
- Chat history is kept in memory only (`chatHistory` array) — it is not persisted to `localStorage` and is not sent to any server beyond the Anthropic API proxy.

---

## Shared Guardrail Layers

| Layer | Where | What it prevents |
|-------|--------|-----------------|
| Scope guardrails | General Assistant, Chat Agent | Off-topic requests (asset maximization, will contests, tax evasion, fraud) |
| PII prohibition in prompts | Communication Agent | SSN, account numbers, DOB, passwords in drafted letters |
| PII obfuscation before upload | Document Parsing Agent | Raw personal data ever reaching the LLM |
| Verify Agent PII scan | Verify Agent | Sensitive data slipping through into a final draft |
| Human oversight gate | Send modal | Fully automated sending — every letter requires explicit human confirmation |
| Legal citation requirement | Task Generation, Enrichment | AI-generated legal claims without a cited statutory basis |
| AI enrichment disclaimer | UI (task panel) | Executor relying on AI-enriched content without verification |
| Source citation requirement | Chat Agent | AI factual claims without a verifiable official source |
| Complexity flags | Complexity Check Agent | High-risk estate conditions going unnoticed |

---

## What agents can never do

- Send an email, letter, or form on behalf of the executor.
- Store or transmit raw PII to any server.
- Override the `COMM_PII_RULE` — it is embedded in every communication prompt as a non-overridable system constraint.
- Generate tasks from scratch — the task list is always deterministic first.
- Respond to out-of-scope requests (asset maximization, tax avoidance, will contests) — these are blocked before any LLM call.
