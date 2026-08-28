# AI Trading Platform — Architecture Decisions

This file records decisions that future agents must not silently reverse.

## ADR-001 — Repository as Persistent AI Memory

Status: ACCEPTED

Decision:
Use repository control-plane files as the persistent memory shared by all AI agents.

Reason:
Agents can change between sessions and may have different context/token limits.

Consequence:
Every agent must read and update project-state files.

## ADR-002 — Modular Platform

Status: ACCEPTED

Decision:
Build independent modules/services with stable interfaces rather than one giant tightly coupled application.

Reason:
The product will contain trading, market data, AI/ML, backtesting, broker integrations, security, subscriptions, and future modules.

Consequence:
External providers must be accessed through adapters/interfaces where practical.

## ADR-003 — Risk Engine Is Authoritative

Status: ACCEPTED

Decision:
Automated AI strategies cannot bypass deterministic server-side risk controls.

Reason:
Financial execution requires enforceable limits independent of AI output.

## ADR-004 — Paper Trading Before Live Trading

Status: ACCEPTED

Decision:
Paper trading must be independently testable and remain isolated from live trading.

Reason:
The platform must validate strategies and execution behavior before real-money capability.

## ADR-005 — Controlled Autonomous Repair

Status: ACCEPTED

Decision:
The future health/repair agent may detect, diagnose, propose/implement fixes in controlled environments, test them, and deploy through controlled mechanisms with rollback. It must not have unrestricted production modification privileges.

Reason:
The platform may contain financial execution infrastructure.

## ADR-006 — TypeScript Monorepo Baseline

Status: ACCEPTED

Date: 2026-08-27

Decision:
Use TypeScript (strict) with npm workspaces, ESM modules, TypeScript project references, and Node.js built-in test runner (`node:test`) invoked via `tsx`/`npx` for the application baseline.

Reason:
- Strong typing for financial domain types (Money, OrderId, etc.).
- Monorepo supports modular services/packages as defined in ARCHITECTURE.md.
- Node built-in test runner avoids heavy test framework installs on low-resource agent environments while remaining standard.
- `npx` keeps the baseline runnable without requiring a permanent `node_modules` tree.

Alternatives considered:
- pnpm + Turborepo + Vitest (preferred for larger scale; deferred until resources/CI allow).
- JavaScript only (rejected — financial code benefits from types).

Consequences:
- Future agents should preserve strict TypeScript and the packages/services/apps layout.
- When adding local `devDependencies`, prefer keeping the existing `npm run test` / `npm run typecheck` contracts.
- Do not introduce a different package manager without updating this ADR and the baseline scripts.

## ADR-007 — Live Trading Off by Default in Code

Status: ACCEPTED

Date: 2026-08-27

Decision:
`LIVE_TRADING_ENABLED` and `AUTOMATED_LIVE_TRADING_ENABLED` default to false. Paper requests never resolve to the live execution path. Live requests are blocked unless the mode is live, the live flag is on, and the kill switch is off.

Reason:
Architecture and trading-safety rules require paper/live isolation and a kill switch before any broker work.

Consequence:
T011+ must keep using `resolveExecutionPath` / `assertExecutionAllowed` rather than calling a broker from a strategy or API handler.

## ADR-008 — Bearer Sessions and RBAC

Status: ACCEPTED

Date: 2026-08-28

Decision:
Use opaque server-side session tokens (`Authorization: Bearer`) plus role-based permissions (`anonymous`, `user`, `admin`). Missing Authorization is anonymous. A present invalid token is 401. Passwords are stored as `scrypt` hashes only.

Reason:
T011 needs a testable auth gate before user profiles (T012) and before any order routes exist.

Consequence:
Do not put broker credentials or live-trading rights on a principal. Admin permission is operational, not a live-trading bypass. JWT libraries are deferred until a signed-token design is required.

## ADR-009 — Profile Separate From Auth; Settings Cannot Enable Live Trading

Status: ACCEPTED

Date: 2026-08-28

Decision:
Keep profile/settings in `packages/users` behind a `UserDirectory` interface. The authenticated principal id is the only ownership key. A trading-mode preference never sets platform live-trading flags.

Reason:
Identity secrets stay in auth. Persistence can change later without rewriting the API. User preferences must not bypass risk or compliance.

Consequence:
Do not add `liveTradingEnabled` to settings. Do not accept client `userId` for resource selection on `/v1/profile` or `/v1/settings`.

