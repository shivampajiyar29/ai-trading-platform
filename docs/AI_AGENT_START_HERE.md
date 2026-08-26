# AI Agent — Start Here

Use this instruction at the beginning of every AI coding session working on this repository.

## MASTER INSTRUCTION

You are a development agent working on `shivampajiyar29/ai-trading-platform`.

Before changing anything:

1. Read `AI_AGENT_HANDOFF.md` completely.
2. Read `PROJECT_STATE.md` completely.
3. Read `TASK_QUEUE.md` completely.
4. Read the latest `WORK_LOG.md` checkpoint.
5. Read `KNOWN_ISSUES.md`.
6. Read relevant entries in `DECISIONS.md`.
7. Read `DEVELOPMENT_RULES.md`.
8. Read `docs/ARCHITECTURE.md`.
9. Inspect the repository structure and current git state.
10. Identify the exact active task from `TASK_QUEUE.md`.

Do NOT start coding until these steps are complete.

## CONTINUATION RULE

You are not starting a new project unless the repository explicitly says so.

Another AI may have stopped because of token limits, rate limits, context limits, timeout, crash, or session interruption.

Your job is to continue from the latest verified checkpoint.

Find:

- `STATUS`
- `TASK_ID`
- `RESUME_POINT`
- `KNOWN_FAILURES`
- `FILES_CHANGED`
- `TEST_RESULTS`

Then inspect the actual code and git diff to verify the checkpoint.

Never trust an unverified claim blindly.

## TASK EXECUTION

For the active task:

```text
UNDERSTAND
    ↓
INSPECT DEPENDENCIES
    ↓
BASELINE TEST
    ↓
PLAN
    ↓
IMPLEMENT
    ↓
UNIT TEST
    ↓
INTEGRATION TEST
    ↓
SECURITY CHECK
    ↓
UI/MOBILE CHECK
    ↓
PERFORMANCE CHECK
    ↓
REGRESSION CHECK
    ↓
REVIEW DIFF
    ↓
UPDATE PROJECT STATE
    ↓
COMMIT
    ↓
WRITE HANDOFF
```

Only use the checks applicable to the task, but record what was actually executed.

## ARCHITECTURE ORDER

Follow this dependency order unless an explicit architecture decision changes it:

1. Control plane
2. Foundation
3. Security + observability
4. Market data
5. Charts + markets
6. Strategy domain
7. Backtesting
8. Portfolio + risk
9. Paper trading
10. Broker adapters
11. Controlled live trading
12. AI/ML
13. Automation
14. Personal AI agents
15. Globalization
16. Learning/community
17. Future modules

Do not jump to live trading because it is visually impressive.

## DO NOT BREAK EXISTING WORK

Before modifying a shared module:

- inspect callers
- inspect tests
- inspect interfaces
- inspect configuration
- inspect related database/schema code

Preserve backward compatibility where practical.

If a breaking change is required, document it in `DECISIONS.md` and add migration/test coverage.

## FINANCIAL SAFETY

Never allow:

AI signal
→ broker

The intended flow is:

AI/Strategy
→ Validation
→ Deterministic Risk Engine
→ Compliance/Jurisdiction Gate
→ Order Validation
→ Idempotency/Reconciliation
→ Broker Adapter
→ Execution
→ Audit

The risk engine must be capable of rejecting the order.

Paper trading must remain independently testable from live trading.

## AI REPAIR AGENT SAFETY

The future 18-minute health agent must use:

```text
Detect
→ Diagnose
→ Generate/propose fix
→ Isolated test
→ Security check
→ Controlled deployment
→ Monitor
→ Rollback
```

Never give it unrestricted production mutation permissions.

## EXTERNAL INTEGRATIONS

Do not call an integration supported unless it has been verified.

Clearly label mocks/stubs.

Protect all secrets.

Never place broker/API credentials in frontend code, source control, logs, screenshots, or documentation.

## HANDOFF BEFORE STOPPING

Before ending your session, update:

- `PROJECT_STATE.md`
- `TASK_QUEUE.md`
- `WORK_LOG.md`
- `KNOWN_ISSUES.md` if needed
- `DECISIONS.md` if an architectural decision was made

Record the exact next action.

For incomplete work, write:

```text
STATUS: IN_PROGRESS
RESUME_POINT: <exact file/function/test/step>
LAST_ERROR: <exact reproducible error or NONE>
NEXT_ACTION: <single concrete action>
```

Do not write vague checkpoints such as `continue later`.

## FINAL SELF-CHECK

Before claiming completion, ask:

- Did I actually run the relevant tests?
- Did I verify the result?
- Did I introduce a regression?
- Did I alter financial behavior?
- Did I expose a secret?
- Did I change an API/data contract?
- Did I update project memory?
- Can another AI continue from my checkpoint without asking me questions?

If any answer is uncertain, investigate before claiming DONE.
