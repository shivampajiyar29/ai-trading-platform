# AI Trading Platform

Modular AI-powered global trading platform.

## Status

Control-plane through T013 (entitlements) is in place. No live trading or broker integration.

See:

- `AI_AGENT_HANDOFF.md` — multi-agent operating protocol
- `PROJECT_STATE.md` — current verified state
- `TASK_QUEUE.md` — ordered work queue
- `docs/ARCHITECTURE.md` — system architecture

## Quick start (development baseline)

Requires Node.js >= 20.

```bash
# Typecheck (uses npx; no local node_modules required for baseline)
npm run typecheck

# Unit tests (Node built-in test runner via tsx)
npm test

# Both
npm run validate
```

## Repository layout (current)

```
ai-trading-platform/
├── packages/
│   ├── domain/          # Money, OrderId, InstrumentId
│   ├── contracts/       # TradingMode, feature flags, execution policy
│   ├── config/          # Env loader (live trading OFF by default)
│   ├── api-kernel/      # HTTP request kernel (health/ready + auth gates)
│   ├── auth/            # RBAC, sessions, credential verification
│   ├── users/           # Profile and settings (self-only)
│   ├── entitlements/    # Plans and product capabilities
│   └── testing/         # Shared test helpers
├── services/
│   └── api-gateway/     # Skeleton pointer to api-kernel
├── apps/                # (placeholder)
├── docs/
│   └── ARCHITECTURE.md
├── AI_AGENT_HANDOFF.md
├── PROJECT_STATE.md
├── TASK_QUEUE.md
├── WORK_LOG.md
├── DECISIONS.md
├── KNOWN_ISSUES.md
└── DEVELOPMENT_RULES.md
```

## Technology baseline (T005)

- Language: TypeScript (strict)
- Runtime: Node.js >= 20
- Module system: ESM (`"type": "module"`)
- Tests: Node.js built-in `node:test` + `tsx` (via npx)
- Build: TypeScript project references + `tsc --build`
- Workspaces: npm workspaces (packages/*, services/*, apps/*)

External tooling is invoked via `npx` for the baseline so a full `node_modules` install is not required on constrained environments. A future task may pin local devDependencies when CI/resources allow.

## Safety

Live trading, broker credentials, and regulated features are intentionally disabled / unimplemented until the dependency order and risk controls are verified.
