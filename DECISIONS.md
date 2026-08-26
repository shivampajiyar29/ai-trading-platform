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
