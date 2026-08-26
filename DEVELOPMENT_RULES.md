# AI Trading Platform — Development Rules

## Code Quality

- Prefer simple, explicit, testable code.
- Keep modules focused.
- Avoid unnecessary rewrites.
- Do not duplicate business logic.
- Validate external input.
- Use typed contracts where the chosen stack supports them.
- Keep financial calculations deterministic and covered by tests.

## Security

- Never commit secrets.
- Never put broker credentials in frontend code.
- Use secure secret management.
- Validate authentication and authorization server-side.
- Log security events without leaking sensitive values.
- Apply least privilege.

## Trading Safety

- Live trading is OFF by default until verified.
- AI cannot bypass the risk engine.
- Every live order must be auditable.
- Protect against duplicate order submission.
- Handle broker disconnects safely.
- Provide an emergency trading stop.
- Backtests must prevent look-ahead/data leakage.
- Never guarantee future returns.

## Testing

For each meaningful change:

1. Run focused tests.
2. Run integration tests where applicable.
3. Run security checks where applicable.
4. Run regression tests for affected existing features.
5. Inspect logs/errors.
6. Record actual results.

## UI/UX

- Responsive from mobile to desktop.
- Accessible controls.
- Do not sacrifice usability for visual effects.
- Charts must remain usable without 3D mode.
- Advanced features should not overwhelm beginner users.

## External Providers

Use provider adapters/interfaces.

Never hard-code assumptions that every country, broker, exchange, or market uses the same API, rules, currency, timezone, or trading session.

## AI Agent Behavior

AI agents must:

- read repository state first
- preserve previous work
- verify claims
- leave checkpoints
- record blockers
- avoid guessing through dangerous ambiguity

## Autonomous Repair

The future health agent follows:

DETECT → DIAGNOSE → PATCH → TEST → SECURITY CHECK → CONTROLLED DEPLOY → MONITOR → ROLLBACK

It must not directly and silently rewrite production financial infrastructure.
