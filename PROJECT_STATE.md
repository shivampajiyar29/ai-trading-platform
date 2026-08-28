# AI Trading Platform — Project State

## Current Status
STATUS: FOUNDATION_USERS_READY

Repository: `shivampajiyar29/ai-trading-platform`
Default branch: `main`

T005–T012 foundation slices are in place. No production trading feature is complete. Live trading remains disabled by default.

## Verified Work
- T005 tooling baseline; T010 architecture; T011 auth/RBAC — independently re-verified (51/51) before T012.
- T012 user profile and settings:
  - `packages/users` — profile/settings models, validation, `UserDirectory` interface, in-memory store, `UserService`.
  - Ownership is the authenticated principal id. Client `userId` cannot select another user.
  - `GET/PATCH /v1/profile` and `GET/PATCH /v1/settings` require `account:read` / `account:write`.
  - Settings `defaultTradingModePreference` is UI-only; `liveTradingEnabledByPreference` is always false.
  - Mass-assignment of `userId`, `role`, `password`, `liveTradingEnabled`, tokens rejected.
- 59 unit tests passing; typecheck passing.

## Current Checkpoint
CHECKPOINT_ID: FOUNDATION-012
STATUS: READY_FOR_T013_ENTITLEMENTS

## Resume Point
Next implementation agent: **T013 — Subscription/entitlement abstraction**.
Reuse `packages/users` and `packages/auth`. Do not implement live trading, brokers, or payments. Entitlements must not bypass risk or enable live trading by themselves.
