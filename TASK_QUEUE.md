# AI Trading Platform — Task Queue

Status values: `TODO`, `IN_PROGRESS`, `DONE`, `PARTIAL`, `BLOCKED`, `SKIPPED`

Only mark `DONE` with verification evidence.

## Phase 0 — Control Plane
- [x] T000 — Create multi-agent handoff protocol
- [x] T001 — Create persistent project state
- [x] T002 — Create task queue
- [x] T003 — Create work log, decisions, known issues, development rules
- [x] T004 — Define repository/system architecture and dependency order
- [x] T005 — Baseline test/tooling setup

## Phase 1 — Foundation
- [x] T010 — Application architecture implementation
- [x] T011 — Authentication and authorization
- [x] T012 — User/profile/settings
- [x] T013 — Subscription/entitlement abstraction
- [x] T014 — Observability foundation
- [x] T015 — Security foundation

## Phase 2 — Market Data
- [x] T020 — Market-data provider interface
- [x] T021 — Historical data pipeline
- [x] T022 — Real-time/WebSocket pipeline
- [x] T023 — Data normalization and validation
- [x] T024 — Market/session/timezone support

## Phase 3 — Charts and Markets
- [ ] T030 — Professional 2D charting
- [ ] T031 — Indicators/drawing tools
- [ ] T032 — Multi-timeframe support
- [ ] T033 — Market explorer/watchlists
- [ ] T034 — Global/country market views
- [ ] T035 — Advanced/3D visualization

## Phase 4 — Strategy and Backtesting
- [ ] T040 — Strategy domain model
- [ ] T041 — Strategy builder
- [ ] T042 — Pine Script integration/conversion layer
- [ ] T043 — Event-driven backtesting engine
- [ ] T044 — Execution simulation/slippage/fees
- [ ] T045 — Backtest analytics and reports

## Phase 5 — Trading
- [ ] T050 — Portfolio service
- [ ] T051 — Risk engine
- [ ] T052 — Paper trading
- [ ] T053 — Broker/exchange adapter interface
- [ ] T054 — First verified broker adapter
- [ ] T055 — Order lifecycle/idempotency
- [ ] T056 — Controlled live trading architecture
- [ ] T057 — Execution performance/latency instrumentation

## Phase 6 — AI/ML
- [ ] T060 — AI provider abstraction
- [ ] T061 — AI market analyst
- [ ] T062 — AI chart explanation
- [ ] T063 — AI strategy assistant
- [ ] T064 — User model training pipeline
- [ ] T065 — Model registry/versioning
- [ ] T066 — Model evaluation/backtesting integration
- [ ] T067 — AI automated-trading guardrails
- [ ] T068 — Personal AI agent

## Phase 7 — Platform Intelligence
- [ ] T070 — System health agent
- [ ] T071 — Controlled autonomous repair pipeline
- [ ] T072 — Alerting/incident management
- [ ] T073 — Admin/operations dashboard

## Phase 8 — Learning and Community
- [ ] T080 — Learning center
- [ ] T081 — Quiz system
- [ ] T082 — Paper-trading competitions
- [ ] T083 — Strategy/model sharing

## Phase 9 — Globalization
- [ ] T090 — Localization/i18n
- [ ] T091 — Multi-currency/timezone support
- [ ] T092 — Jurisdiction capability framework
- [ ] T093 — Regional broker/market availability

## Phase 10 — Future Modules
- [ ] T100 — Future platform-token abstraction
- [ ] T101 — Regulated lottery/reward module evaluation
- [ ] T102 — Additional markets/providers/brokers

## Final Quality Gates
- [ ] T900 — Full regression suite
- [ ] T901 — Independent security audit
- [ ] T902 — Independent architecture audit
- [ ] T903 — Performance/load audit
- [ ] T904 — Mobile/responsive audit
- [ ] T905 — Disaster recovery/backup verification
- [ ] T906 — Production readiness review

## Queue Rule
Agents may split a task into subtasks, but must update this file before handing off if task status changes.

## Current Execution Rule
Follow dependency order. Do not skip directly to live trading, real-money competitions, lottery/gambling, or token functionality. Live trading remains disabled by default until later verified gates.

## T015 Verification Evidence
- Final implementation state: `d50bcb9ef77d08a470475c1c3b616887fcdc2e47`
- GitHub Actions validation run: `33656835274` — PASS
- Typecheck: PASS
- Test suite: PASS
- T901 remains the independent final security-audit gate.

## T020 Verification Evidence
- Implementation branch: `agent/T020-market-data-foundation`
- Implementation head before checkpoint docs: `e2d27c4285ca811ca45afdcfc7c58d54eb2e7183`
- GitHub Actions validation run: `33664265222` — PASS
- GitHub Actions validate job: `100362004399` — PASS
- Provider interface, normalized types, validation, registry, and tests are present.
- No live trading, broker integration, exchange credentials, or execution path was added.

## T021 Verification Evidence
- Implementation branch: `agent/T020-market-data-foundation`
- Historical pipeline commits: `c63439165f09023cfa5eb5ee4c2016c58f93ba36`, `5075e8112425cc6fb693ed9803cdcda798b86a1f`, `8dbd5ecf03a05a7cc86850a7434b9d7f7709077d`, `e17c17f8023cb72d0bb549f28b9c0d706a2ca436`
- GitHub Actions validation run: `33664836940` — PASS
- GitHub Actions validate job: `100363899583` — PASS
- Pipeline provides provider-neutral historical candle loading, request chunking, provider capability checks, candle validation, instrument consistency checks, deterministic sorting/deduplication, and an optional persistence sink.
- Tests cover normalization/deduplication, unsupported historical providers, and malformed candles.
- No broker integration, exchange credentials, real-money execution, or live trading path was added.

## T022 Verification Evidence
- Implementation branch: `agent/T022-realtime-market-data`
- Realtime pipeline implementation commits: `e0fb88a3c8be2583ae457612cd4987c91345c350`, `fe96e70f2d4e826152b5a5282c067a6ba7869a2a`, `9765e771c15c764270a51490c8204d281ac342bb`, `1ad00ace42fc837237b4c08933de4dce24b38d96`, `9b399a9a8911a43241fc2cc301619330b1fe884b`
- GitHub Actions validation run: `33665207173` — PASS
- GitHub Actions validate job: `100365124861` — PASS
- Pipeline provides provider-neutral realtime subscriptions, validated quote/candle events, per-subscription instrument filtering, lifecycle close/closeAll handling, and a bounded in-memory buffer with overflow reporting.
- Tests cover realtime forwarding/filtering, unsupported providers, malformed events, and buffer behavior.
- No vendor WebSocket SDK, exchange credentials, broker integration, order execution, or live trading path was added.

## T023 Verification Evidence
- Implementation branch: `agent/T023-data-normalization`
- Implementation commits: `04761a96851a323c73c06f26a0819348bc1bad0e`, `0e97db3cd898aa8a1ad08e401213b8bae45ec199`, `b0630b23fed981c9280c3438a5de739dc59a7c03`, `583cbdd2d223be2d024c1e2d0edb521874c9e11e`, `8c52b2a619407f809bb076822a6bd6f76627272b`
- GitHub Actions validation run: `33665551997` — PASS
- GitHub Actions validate job: `100366281891` — PASS
- Added canonical quote/candle normalization helpers, deterministic candle sorting/deduplication, stronger quote validation requiring a usable price, and regression tests.
- No broker integration, exchange credentials, order execution, or live trading path was added.
