# AI Trading Platform — Project State

## Current Status
STATUS: BASELINE_PARTIAL

Repository: `shivampajiyar29/ai-trading-platform`
Default branch: `main`
Working branch: `agent/chatgpt/T005`

The repository has completed its control-plane and architecture setup. T005 has been partially implemented with repository tooling, environment template, initial test configuration, workspace layout, and CI quality checks.

## Verified Work
- Multi-agent handoff protocol exists.
- Persistent project-state/task/work-log controls exist.
- Architecture and dependency order documented.
- Task queue aligned with architecture.
- `.gitignore` protects common local secrets/artifacts.
- `.env.example` documents safe development configuration with live trading disabled.
- Python tooling baseline exists in `pyproject.toml`.
- Node workspace baseline exists in `package.json` and `pnpm-workspace.yaml`.
- Initial Python baseline test exists in `tests/test_baseline.py`.
- GitHub Actions quality workflow exists at `.github/workflows/quality.yml`.
- Web application boundary reserved at `apps/web/`.
- Backend service boundary reserved at `services/`.

## NOT YET VERIFIED
- Local dependency installation.
- Local pytest execution.
- GitHub Actions execution.
- Node package installation.
- Frontend build/typecheck.
- Backend runtime.
- Database connectivity.
- External integrations.

## Current Checkpoint
CHECKPOINT_ID: BASELINE-001
STATUS: PARTIAL

## Resume Point
Run the new baseline locally/through CI and fix any tooling failures. After the baseline is green, continue with T010: application architecture implementation.

## Important Safety State
Live trading is OFF by default. Automated live trading is OFF by default. No broker, exchange, market-data, AI, payment, or news integration is verified yet.

## Product Direction
Planned capabilities include multiple AI models/agents, user model training, strategy/Pine tooling, global market data and charts, strategy building, backtesting, broker/exchange adapters, paper trading, controlled live trading, low-latency execution, 2D/3D visualization, AI market explanations, automated trading, web/mobile UI, security, personal AI agents, learning, competitions, subscriptions, globalization, and future extensible modules.

These are requirements, not completed features.

## Architecture Source of Truth
See `docs/ARCHITECTURE.md`.

## Development Principle
Build small independently testable milestones. Every milestone must leave a reproducible checkpoint for the next AI agent. No agent should need the previous conversation to continue correctly.
