# AI Trading Platform — Known Issues

## KI-001 — No Application Baseline Yet

Status: RESOLVED
Severity: INFO

Resolved by T005. TypeScript monorepo baseline, domain package, and unit tests are in place.

## KI-002 — Regulatory Scope Not Yet Implemented

Status: OPEN
Severity: HIGH

Global trading, broker connectivity, live trading, competitions, lottery/gambling, subscriptions, and any future token functionality may have jurisdiction-specific legal and regulatory requirements. The platform must implement a capability/jurisdiction framework and obtain appropriate human/legal review before enabling regulated features.

## KI-003 — External Integrations Unverified

Status: OPEN
Severity: INFO

No broker, exchange, market-data, AI, payment, or news integration should be considered supported until independently verified and documented.

## KI-004 — Local node_modules Install Fragile on Constrained Agents

Status: OPEN
Severity: LOW

Full `npm install` of TypeScript toolchain can be slow or fail under low-memory agent sandboxes. Baseline scripts use `npx` so tests/typecheck work without a permanent install. Future CI or developer machines should pin local devDependencies when practical.

## KI-005 — Packages Are Not Yet Linked at Runtime

Status: OPEN
Severity: INFO

Packages compile independently. They do not import each other by workspace package name yet because a full workspace install is not part of the baseline. Cross-package composition happens by passing plain objects (structural typing) until a linked workspace install or path mapping is added.

## KI-006 — User Directory Is In-Memory Only

Status: OPEN
Severity: INFO

T012 profiles and settings persist only in `InMemoryUserDirectory`. Data is lost on process restart. Replace the directory implementation when a database is introduced; keep the `UserDirectory` interface.
