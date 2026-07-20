# GitHub Actions Workflows Guide

This document specifies the continuous integration pipelines and daily scheduler workflows managed by GitHub Actions.

---

## 🤖 Daily Ingestion & Pricing Workflow (`.github/workflows/daily_scrape.yml`)

This workflow executes daily at 04:00 UTC, running the web scraper, ETL ingestion, competitor watchlist recalculation, and dynamic pricing model. The updated database is committed back to git to keep Render/Vercel states in sync.

### 1. Trigger Conditions
- **Schedule**: Cron expression `0 4 * * *` (run daily at 4:00 AM UTC).
- **Manual**: `workflow_dispatch` (enables manual execution from the GitHub actions tab).

### 2. Workflow Steps
1. **Repository Checkout**: Pulls the repository code onto the runner VM.
2. **Python Environment Setup**: Installs python 3.10 and configures cache folders.
3. **Dependency Installation**: Upgrades pip and installs python libraries from `requirements.txt`.
4. **ETL Pipeline Execution**: Runs the ETL run pipeline:
   ```bash
   python -m backend.etl.run_daily_pipeline
   ```
   *Environment Parameters*:
   - `DATABASE_PATH=database/airbnb_intelligence.db`
5. **Git Commit & Push**:
   - Checks if `database/airbnb_intelligence.db` or `config/target_settings.json` was updated.
   - Configures Git user information.
   - Commits changes and pushes to `main` branch.
   - Triggers automated cloud redeploy webhooks.
