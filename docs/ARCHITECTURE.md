# AI Trading Platform — System Architecture

## 1. Architecture Goal

Build a modular global AI trading platform that can grow from a safe MVP into a large multi-market ecosystem without rewriting the core system.

The architecture must support:

- multiple AI providers/models
- user-created AI/ML models
- model training and evaluation
- global market data
- country-specific markets
- 2D and optional 3D charts
- Pine Script tooling
- visual strategy builder
- backtesting
- paper trading
- broker/exchange adapters
- controlled live trading
- automated trading
- personal AI agents
- system health/repair agents
- learning and quizzes
- paper-trading competitions
- subscriptions
- localization
- jurisdiction-aware feature availability
- future modules such as platform token/reward systems

Requirements are not implementation claims. A module becomes implemented only after tests and verification are recorded.

---

## 2. High-Level Architecture

```text
                           WEB / MOBILE CLIENTS
                                  |
                           API / BFF GATEWAY
                                  |
              +-------------------+-------------------+
              |                   |                   |
          AUTH SERVICE       USER SERVICE        ENTITLEMENTS
              |                   |                   |
              +-------------------+-------------------+
                                  |
                         CORE PLATFORM SERVICES
                                  |
       +------------+-------------+-------------+-------------+
       |            |             |             |             |
    MARKET       STRATEGY      PORTFOLIO      AI/ML        NOTIFY
    DATA         SERVICE       SERVICE        PLATFORM      SERVICE
       |            |             |             |
       |            |             |             +---- AI provider adapters
       |            |             |             +---- model training
       |            |             |             +---- model registry
       |            |             |             +---- evaluation
       |            |             |
       |            +-------------+-------------+
       |                          |
       |                    RISK ENGINE
       |                          |
       |                   EXECUTION GATE
       |                          |
       |                +---------+---------+
       |                |                   |
       |            PAPER TRADING       LIVE TRADING
       |                                    |
       |                             BROKER GATEWAY
       |                                    |
       |                        +-----------+-----------+
       |                        |           |           |
       |                     Broker A   Broker B   Exchange C
       |
       +---- provider adapters / historical data / WebSockets

                    DATA + INFRASTRUCTURE LAYER
       +------------+------------+------------+------------+
       |            |            |            |            |
   PostgreSQL   Time-series    Redis      Object Store   Event Bus
                 storage

                    OBSERVABILITY + SECURITY
       logs | metrics | traces | audit | alerts | secrets
```

---

## 3. Architectural Principles

### 3.1 Modular boundaries

Each major capability must have a clear interface and dependency boundary.

### 3.2 Adapter pattern for external systems

Never couple the core system directly to one broker, exchange, market-data provider, AI provider, or payment provider.

Use interfaces/adapters so additional providers can be added without rewriting business logic.

### 3.3 Risk before execution

All live trading requests must pass through deterministic server-side risk controls before reaching a broker.

AI may propose a trade, but AI must not bypass risk controls.

### 3.4 Paper/live separation

Paper trading and live trading must have separate execution paths and explicit mode checks.

### 3.5 Event-driven where useful

Use events for market updates, order lifecycle changes, model jobs, notifications, and asynchronous workflows.

### 3.6 Evidence-based completion

Every feature must have tests and a recorded verification result.

### 3.7 Safe autonomous operation

AI health/repair agents may diagnose and propose fixes. Production changes must pass controlled testing, security checks, deployment gates, monitoring, and rollback mechanisms.

---

## 4. Logical Services

### 4.1 API Gateway / BFF

Responsibilities:

- request routing
- authentication context
- authorization checks
- rate limiting
- request validation
- API versioning
- correlation IDs

Do not put trading calculations or ML training logic directly into the gateway.

### 4.2 Identity/Auth Service

Responsibilities:

- registration
- login
- session/token management
- MFA
- email verification
- password recovery
- account security
- role/permission resolution

### 4.3 User Service

Responsibilities:

- profile
- preferences
- watchlists
- saved charts
- saved strategies
- model ownership
- account settings

### 4.4 Entitlement/Subscription Service

Centralize feature access.

Examples:

```text
FREE
PRO
AI
ADVANCED
ENTERPRISE
```

Do not scatter subscription checks across unrelated modules.

### 4.5 Market Data Service

Responsibilities:

- provider connections
- normalization
- validation
- historical data
- real-time data
- WebSockets
- market sessions
- timezones
- instrument metadata

Core domain objects should be provider-neutral.

### 4.6 Chart Service / Frontend Visualization Layer

Responsibilities:

- 2D charts
- indicators
- drawings
- annotations
- events
- trade markers
- AI explanations
- optional 3D visualization

3D is an optional visualization mode and must not degrade normal 2D chart performance.

### 4.7 Strategy Service

Responsibilities:

- strategy definition
- strategy versioning
- strategy validation
- visual strategy builder
- rule engine
- Pine Script integration/conversion boundary

A strategy must have a stable versioned representation.

### 4.8 Backtesting Service

Responsibilities:

- historical simulation
- event-driven execution
- fees
- slippage
- spread assumptions
- position sizing
- risk rules
- metrics
- reports

Must explicitly protect against look-ahead bias and data leakage.

### 4.9 Portfolio Service

Responsibilities:

- balances
- positions
- P&L
- allocations
- exposure
- trade history

Financial calculations must be deterministic, testable, and precision-aware.

### 4.10 Risk Engine

Responsibilities:

- max position size
- max daily loss
- max exposure
- leverage limits
- trade limits
- asset restrictions
- strategy restrictions
- emergency stop
- account-level controls

The risk engine is authoritative for live order approval.

### 4.11 Execution Service

Responsibilities:

- order validation
- idempotency
- order submission
- lifecycle tracking
- retry policy
- broker responses
- execution latency measurement

Never blindly retry a financial order without an idempotency/reconciliation strategy.

### 4.12 Broker Gateway

Use a stable interface:

```text
BrokerAdapter
  connect()
  disconnect()
  getAccount()
  getBalances()
  getPositions()
  placeOrder()
  cancelOrder()
  getOrder()
  getOrders()
```

Specific adapters implement the interface.

### 4.13 AI/ML Platform

Responsibilities:

- AI provider abstraction
- prompts/tools
- model selection
- inference
- training jobs
- evaluation
- model registry
- model versions
- deployment states

A user-created model must have a reproducible training record.

### 4.14 Personal AI Agent Service

Subscription-controlled personal agent with permission-scoped access to:

- market analysis
- portfolio analysis
- strategy analysis
- model assistance
- alerts
- research

The personal agent must not receive unrestricted broker credentials or unrestricted fund movement permissions.

### 4.15 System Health Agent

Target cadence: approximately every 18 minutes.

Checks:

- application health
- API errors
- database health
- queue failures
- WebSocket failures
- broker connectivity
- latency
- resource pressure
- test failures
- security alerts

Repair flow:

```text
DETECT
  -> DIAGNOSE
  -> PROPOSE PATCH
  -> ISOLATED TEST
  -> SECURITY CHECK
  -> CONTROLLED DEPLOY
  -> MONITOR
  -> ROLLBACK IF NEEDED
```

Never allow unrestricted autonomous production mutation.

---

## 5. Data Architecture

### Relational data

Use PostgreSQL or an equivalent relational database for:

- users
- accounts
- subscriptions
- permissions
- strategies
- strategy versions
- model metadata
- portfolios
- orders
- trades
- audit records

### Time-series data

Use a time-series optimized storage layer for:

- OHLCV
- market ticks where appropriate
- funding rates
- open interest
- other time-indexed market data

### Redis/cache

Use for:

- hot market data
- sessions where appropriate
- rate limits
- short-lived state
- distributed locks where justified

### Object storage

Use for:

- model artifacts
- datasets
- training outputs
- reports
- exported files

### Event bus

Use for asynchronous events such as:

- market tick/update
- order submitted
- order filled
- order rejected
- backtest completed
- training completed
- alert triggered
- health incident detected

---

## 6. Core Trading Flow

### Paper trading

```text
Signal
  -> Strategy Validation
  -> Risk Simulation
  -> Paper Execution
  -> Portfolio Update
  -> Event
  -> Audit
```

### Live trading

```text
Signal
  -> Strategy Validation
  -> Deterministic Risk Engine
  -> Compliance/Jurisdiction Gate
  -> Order Validation
  -> Idempotency Check
  -> Broker Adapter
  -> Execution Confirmation
  -> Portfolio Update
  -> Audit Event
```

Any failed gate blocks execution.

---

## 7. AI Trading Flow

```text
Market Data
    |
    +----> AI Market Analyst
    |
    +----> AI Chart Explanation
    |
    +----> AI Strategy Assistant
    |
    +----> User Model
    |
    +----> Strategy Engine
              |
              v
         Backtesting
              |
              v
         Paper Trading
              |
              v
       Risk/Compliance Gate
              |
              v
         Live Execution
```

AI output must distinguish:

- observed facts
- calculations
- interpretation
- prediction
- uncertainty

---

## 8. User Model Training Flow

```text
Dataset
  -> Validation
  -> Feature Engineering
  -> Train/Validation/Test Split
  -> Training Job
  -> Evaluation
  -> Model Version
  -> Backtest Integration
  -> Paper Trading
  -> Deployment Approval
```

Training must be reproducible.

Record:

- dataset version
- features
- parameters
- code version
- model type
- metrics
- training timestamp
- model artifact

---

## 9. Global Market Architecture

The platform should support a country-neutral instrument model.

```text
Country
  -> Exchange/Market
  -> Instrument
  -> Provider Symbol
  -> Currency
  -> Trading Session
  -> Data Source
```

Do not hard-code one country's market assumptions into global services.

Regional availability must be capability-driven.

---

## 10. Jurisdiction and Compliance Boundary

The platform must not assume one rule applies globally.

Create a capability layer that can determine whether a feature is available for a user based on:

- jurisdiction
- age requirements where applicable
- KYC status
- product type
- broker availability
- regulatory restrictions
- platform policy

Potentially regulated modules include:

- live trading
- leverage
- derivatives
- real-money competitions
- lottery/gambling
- token/crypto features

These must remain feature-flagged until appropriate legal/compliance requirements are satisfied.

---

## 11. Security Architecture

Security boundaries include:

```text
Client
  -> TLS
  -> Gateway
  -> Authentication
  -> Authorization
  -> Service
  -> Database/Provider
```

Requirements:

- secrets outside source code
- secure secret storage
- MFA
- RBAC
- input validation
- rate limiting
- audit logs
- encryption in transit
- encryption at rest where appropriate
- secure headers
- dependency scanning
- security tests

Broker credentials must never be exposed to the browser.

---

## 12. Observability

Every important service should expose:

- structured logs
- metrics
- traces where appropriate
- health endpoints
- correlation IDs

Trading-specific telemetry:

- signal latency
- risk-check latency
- broker latency
- order acknowledgement latency
- rejected order counts
- duplicate order prevention events
- reconciliation failures

---

## 13. Frontend Architecture

Recommended logical areas:

```text
Dashboard
Markets
Chart
Strategy Studio
Backtesting
AI Studio
Model Lab
Paper Trading
Live Trading
Portfolio
Broker Connections
AI Agent
Learning
Competitions
Settings
Admin
```

Desktop and mobile must use the same domain APIs but may have different information hierarchy.

Use beginner/advanced presentation modes where appropriate.

---

## 14. Future Modules

The architecture must allow new modules without rewriting core services.

Future examples:

- platform token/reward system
- additional broker adapters
- additional exchanges
- additional AI providers
- additional asset classes
- regulated reward/lottery evaluation
- marketplace
- social/strategy sharing

Future modules should implement defined interfaces and remain isolated from the core execution path until verified.

---

## 15. Recommended Repository Shape

As implementation grows, prefer a structure similar to:

```text
ai-trading-platform/
├── apps/
│   ├── web/
│   ├── mobile/
│   └── admin/
│
├── services/
│   ├── api-gateway/
│   ├── auth/
│   ├── users/
│   ├── entitlements/
│   ├── market-data/
│   ├── strategy/
│   ├── backtesting/
│   ├── portfolio/
│   ├── risk/
│   ├── execution/
│   ├── brokers/
│   ├── ai/
│   ├── model-training/
│   ├── personal-agent/
│   ├── health-agent/
│   ├── notifications/
│   └── admin/
│
├── packages/
│   ├── contracts/
│   ├── domain/
│   ├── ui/
│   ├── charts/
│   ├── config/
│   ├── security/
│   └── testing/
│
├── data/
│   ├── schemas/
│   └── migrations/
│
├── infrastructure/
│   ├── docker/
│   ├── deployment/
│   ├── observability/
│   └── ci/
│
├── tests/
│   ├── unit/
│   ├── integration/
│   ├── e2e/
│   ├── security/
│   └── performance/
│
├── docs/
│   └── ARCHITECTURE.md
│
├── AI_AGENT_HANDOFF.md
├── PROJECT_STATE.md
├── TASK_QUEUE.md
├── WORK_LOG.md
├── DECISIONS.md
├── KNOWN_ISSUES.md
└── DEVELOPMENT_RULES.md
```

This is a target architecture, not permission to create every directory immediately. Implement incrementally according to `TASK_QUEUE.md`.

---

## 16. Implementation Order

Use this dependency order:

```text
CONTROL PLANE
    ↓
FOUNDATION
    ↓
SECURITY + OBSERVABILITY
    ↓
MARKET DATA
    ↓
CHARTS / MARKETS
    ↓
STRATEGY DOMAIN
    ↓
BACKTESTING
    ↓
PORTFOLIO + RISK
    ↓
PAPER TRADING
    ↓
BROKER ADAPTERS
    ↓
CONTROLLED LIVE TRADING
    ↓
AI / ML
    ↓
AUTOMATION
    ↓
PERSONAL AI AGENTS
    ↓
GLOBALIZATION
    ↓
LEARNING / COMMUNITY
    ↓
FUTURE MODULES
```

Do not start with live trading or token functionality before the underlying safety and data architecture is verified.

---

## 17. Architecture Completion Rule

This document describes the intended architecture.

It does not mean the platform has been built.

Every implemented service must be marked in `PROJECT_STATE.md` and `TASK_QUEUE.md` only after evidence exists in tests, code, and verification logs.
