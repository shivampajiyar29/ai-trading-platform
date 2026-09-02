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
- [ ] T015 — Security foundation (IN_PROGRESS — implementation persisted; verification pending)

## Phase 2 — Market Data
- [ ] T020 — Market-data provider interface
- [ ] T021 — Historical data pipeline
- [ ] T022 — Real-time/WebSocket pipeline
- [ ] T023 — Data normalization and validation
- [ ] T024 — Market/session/timezone support

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
