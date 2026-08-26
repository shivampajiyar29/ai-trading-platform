# AI Trading Platform — Multi-Agent Handoff Protocol

## 1. PURPOSE

This repository is the single source of truth for a large, multi-stage AI-powered global trading platform.

Multiple AI coding agents may work on the project at different times because of token limits, context limits, rate limits, model limits, tool limits, session interruptions, or agent changes.

A new agent MUST be able to continue from the exact verified checkpoint left by the previous agent without relying on memory from another conversation.

The repository itself is the persistent project memory.

---

## 2. ABSOLUTE RULE

Every AI agent must follow:

READ → INSPECT → VERIFY → PLAN → IMPLEMENT → TEST → REVIEW → UPDATE STATE → COMMIT → HANDOFF

Never do:

IMPLEMENT → ASSUME IT WORKS → STOP

Do not claim work is complete unless it was actually verified.

---

## 3. REQUIRED FILES

The following files are the control plane for all agents:

- `AI_AGENT_HANDOFF.md` — this operating protocol.
- `PROJECT_STATE.md` — current verified architecture and status.
- `TASK_QUEUE.md` — ordered project work queue.
- `WORK_LOG.md` — chronological agent activity and checkpoints.
- `DECISIONS.md` — important architectural and product decisions.
- `KNOWN_ISSUES.md` — open bugs, limitations, and blockers.
- `DEVELOPMENT_RULES.md` — engineering, security, trading, and quality rules.

If any of these files do not exist, the first agent must create them before substantial implementation.

---

## 4. START-OF-SESSION PROTOCOL

Before changing code, every agent MUST:

### A. Inspect repository

Check:

- current branch
- latest commit
- working tree status
- existing files
- package/configuration files
- tests
- environment configuration
- CI/CD configuration
- currently running architecture

### B. Read project memory

Read in this order:

1. `AI_AGENT_HANDOFF.md`
2. `PROJECT_STATE.md`
3. `TASK_QUEUE.md`
4. latest entries in `WORK_LOG.md`
5. `KNOWN_ISSUES.md`
6. relevant section of `DECISIONS.md`
7. `DEVELOPMENT_RULES.md`

### C. Determine task

Use the first incomplete task in `TASK_QUEUE.md` unless the human explicitly assigned a different task.

### D. Establish a baseline

Run relevant existing tests/checks before modifications.

If baseline tests are already failing, record the exact failures first.

Never accidentally attribute an existing failure to your own change.

---

## 5. CONTINUATION AFTER AN AI STOPS

If an AI agent stops for ANY reason:

- token limit
- rate limit
- context limit
- timeout
- tool failure
- model change
- session interruption
- crash
- manual stop

then the next agent MUST NOT restart the project from zero.

The next agent must:

1. Read this file.
2. Read `PROJECT_STATE.md`.
3. Read the newest `WORK_LOG.md` checkpoint.
4. Read the current `TASK_QUEUE.md` status.
5. Inspect git status/diff.
6. Identify files changed by the previous agent.
7. Re-run the relevant baseline tests.
8. Continue from the recorded `RESUME_POINT`.

The previous agent's checkpoint is authoritative unless code/tests prove it is incorrect.

---

## 6. MANDATORY CHECKPOINT FORMAT

Every agent MUST leave a clear checkpoint in `WORK_LOG.md` before stopping.

Use this structure:

```text
AGENT_ID:
DATE_TIME:
TASK_ID:
TASK_TITLE:
STATUS: DONE | IN_PROGRESS | BLOCKED | PARTIAL

OBJECTIVE:

WHAT I INSPECTED:

WHAT I CHANGED:

FILES_CHANGED:

TESTS_RUN:

TEST_RESULTS:

KNOWN_FAILURES:

KNOWN_LIMITATIONS:

IMPORTANT_DECISIONS:

DO_NOT_REPEAT:

RESUME_POINT:

NEXT_TASK:

LAST_KNOWN_COMMIT:
```

`RESUME_POINT` is mandatory for incomplete work.

Example:

```text
RESUME_POINT:
The API adapter is implemented but the integration test for reconnect-after-timeout still fails. Continue in backend/brokers/binance_adapter.ts and run tests/brokers/reconnect.test.ts before modifying unrelated files.
```

---

## 7. DEFINITION OF DONE

A task is `DONE` only when all applicable checks have passed:

- implementation complete
- unit tests pass
- integration tests pass
- API tests pass
- type/static checks pass
- lint/format checks pass where configured
- database checks/migrations pass where applicable
- security checks pass where applicable
- UI functionality verified where applicable
- responsive/mobile checks verified where applicable
- error states checked
- regression checks pass
- no critical or high-severity known issue caused by the change
- documentation updated
- project state updated
- work log updated
- commit created

If any essential verification is missing, use `PARTIAL` or `BLOCKED`, not `DONE`.

---

## 8. SMALL, REVERSIBLE WORK

Prefer small changes.

Each task should have a clear boundary.

Do not combine unrelated changes merely because they are convenient.

Avoid giant rewrites unless architecture review explicitly calls for one.

Before changing shared code, inspect its dependencies and callers.

---

## 9. NO BLIND OVERWRITES

Never:

- delete working code without investigation
- replace a module because it looks old
- overwrite another agent's work without reading it
- regenerate large files unnecessarily
- change public API contracts silently
- silently modify strategy behavior

When uncertain, inspect first.

---

## 10. TRUTH HIERARCHY

When documentation, memory, and code disagree, use this order:

1. executable code and reproducible tests
2. newest verified commit
3. explicit architectural decisions
4. project state documentation
5. older work logs
6. assumptions

If a fact is not verified, label it `UNVERIFIED`.

---

## 11. MULTI-AGENT ROLE MODEL

Agents may specialize, but all agents use the same repository memory.

### ARCHITECT AGENT
Owns:
- architecture
- service boundaries
- contracts
- data flow
- technology decisions

### FRONTEND AGENT
Owns:
- UI
- UX
- responsive design
- accessibility
- chart presentation

### BACKEND AGENT
Owns:
- APIs
- services
- authentication
- business logic
- persistence

### QUANT/TRADING AGENT
Owns:
- strategy engine
- order logic
- portfolio calculations
- backtesting
- execution rules
- risk calculations

### AI/ML AGENT
Owns:
- model training
- inference
- evaluation
- model registry
- AI agents

### DATA AGENT
Owns:
- market data
- normalization
- historical datasets
- data quality
- time-series infrastructure

### SECURITY AGENT
Owns:
- authentication security
- authorization
- secrets
- dependency security
- auditability
- threat modeling

### QA AGENT
Owns:
- unit tests
- integration tests
- regression testing
- end-to-end verification
- bug reproduction

### DEVOPS AGENT
Owns:
- CI/CD
- containers
- deployment
- monitoring
- observability
- backups
- rollback

### REVIEW AGENT
Independently checks whether completed claims are supported by evidence.

---

## 12. HANDOFF OWNERSHIP

An agent owns its assigned task until one of these states is recorded:

- DONE
- PARTIAL
- BLOCKED

A task marked DONE must include evidence.

A task marked PARTIAL or BLOCKED must include a precise resume point.

Never leave a task in an ambiguous state.

---

## 13. GIT SAFETY

Before modification:

- inspect current branch
- inspect status
- inspect latest commit

After modification:

- inspect diff
- run tests
- create a focused commit
- record commit hash

Use descriptive commit messages:

- `feat: add market data service`
- `feat: add paper trading engine`
- `fix: prevent duplicate order execution`
- `test: add backtest regression coverage`
- `security: harden broker credential storage`
- `docs: update multi-agent checkpoint`

Avoid:

- `update`
- `changes`
- `fix`
- `stuff`

---

## 14. CONCURRENCY RULE

If multiple agents may work on the project simultaneously, avoid editing the same files at the same time.

Prefer:

- separate task branches
- focused directories
- focused commits
- pull-request review

Never assume two agents' changes are compatible just because they compile separately.

Run integration/regression tests after merging related work.

---

## 15. ARCHITECTURE CHANGE RULE

Any change affecting these must be recorded in `DECISIONS.md`:

- database schema
- API contracts
- authentication model
- broker interface
- market-data interface
- model interface
- strategy DSL
- backtesting semantics
- risk engine behavior
- deployment architecture
- security model
- subscription entitlements

Record:

- decision
- reason
- alternatives considered
- consequences
- migration requirement

---

## 16. AI AGENT SAFETY

AI agents may analyze, propose, implement, test, and review code.

AI agents must NOT be given unrestricted permission to:

- deploy arbitrary production code
- modify live financial execution controls without review
- bypass risk checks
- bypass authentication
- expose secrets
- change compliance restrictions
- silently alter financial calculations

For autonomous repair, use:

DETECT
→ DIAGNOSE
→ PATCH
→ TEST IN ISOLATION
→ SECURITY CHECK
→ CONTROLLED DEPLOY
→ MONITOR
→ ROLLBACK IF NEEDED

---

## 17. FINANCIAL SYSTEM SAFETY

This platform may eventually execute financial trades.

Therefore:

- paper trading must remain isolated from live trading
- live orders must pass through deterministic server-side risk controls
- maximum loss limits must be enforceable
- broker credentials must never be exposed to the frontend
- automated trading must have emergency shutdown controls
- every live order must be auditable
- execution must be idempotent where applicable
- duplicate order protection is mandatory
- backtests must avoid look-ahead/data leakage
- historical performance must not be represented as guaranteed future performance

---

## 18. TESTING GATE

For each feature, use the strongest relevant sequence:

1. unit tests
2. component/service tests
3. API/integration tests
4. database tests
5. security tests
6. end-to-end tests
7. responsive/mobile checks
8. performance checks
9. regression tests

Do not skip a test because a feature is small.

Use judgment on which layers apply, but record what was run.

---

## 19. REGRESSION RULE

Before completing a task, verify that previously completed related functionality still works.

A bug fix is not complete if it creates a regression elsewhere.

When a regression occurs:

1. record it
2. reproduce it
3. identify root cause
4. fix it
5. add regression coverage
6. rerun the affected suite

---

## 20. ERROR HANDLING RULE

Never hide errors.

Use:

- structured errors
- meaningful error codes
- actionable logs
- safe user-facing messages
- correlation/request identifiers where appropriate

Do not leak secrets, credentials, internal stack traces, or sensitive data to users.

---

## 21. EXTERNAL INTEGRATION RULE

Never claim an external integration works unless it has been verified.

This applies to:

- brokers
- exchanges
- market-data APIs
- news APIs
- AI providers
- payment providers
- cloud services

If an integration is mocked, label it clearly as MOCK.

---

## 22. FEATURE FLAGS

Dangerous or incomplete functionality should use feature flags.

Examples:

- live trading
- automated live trading
- new broker adapter
- real-money competitions
- lottery/gambling features
- future cryptocurrency features

Default risky features to OFF until verified and authorized.

---

## 23. FINAL INDEPENDENT AUDIT

At the end of a major milestone, a separate review agent must audit the project as if it has never seen the project before.

Audit:

- architecture
- security
- authentication
- authorization
- database
- APIs
- market data
- charting
- AI
- ML training
- backtesting
- strategy engine
- paper trading
- live trading safeguards
- broker integrations
- risk management
- mobile UX
- performance
- observability
- deployment
- disaster recovery
- documentation

Classify findings:

CRITICAL
HIGH
MEDIUM
LOW

Do not declare a production milestone complete while CRITICAL or HIGH issues remain unless the human explicitly accepts them and they are documented.

---

## 24. STOP CONDITION

An agent must stop and write a checkpoint when:

- required context is missing
- architecture is unclear
- a dependency is broken
- a destructive migration is uncertain
- the task conflicts with a recorded decision
- security implications are unclear
- financial behavior may change unexpectedly
- a test failure cannot be explained safely

Do not guess through a dangerous ambiguity.

Record the blocker and exact information needed.

---

## 25. PROJECT MEMORY PRINCIPLE

The project must survive the replacement of every AI agent.

No agent is irreplaceable.

No conversation is authoritative.

The repository is authoritative.

The project state files are the memory layer.

The tests are the evidence layer.

Git history is the recovery layer.

---

## 26. FINAL RULE FOR EVERY AGENT

Before you stop, ask:

"Could another AI continue this task correctly by reading only the repository?"

If the answer is NO, improve the checkpoint before stopping.
