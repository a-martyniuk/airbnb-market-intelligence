# Python Backend Technical Specification

This document provides a detailed specification of the python backend, including components, responsibilities, API routing, and architectural design patterns.

---

## 🐍 Overview

The backend is built as a modular python application centered around a **FastAPI** web server. It handles data ingestion, ML models training and prediction, competitor indexing, database migrations, and serves the REST API accessed by the Next.js frontend.

---

## 🏛️ Module Breakdown & Responsibilities

### 1. API Entry Point (`backend/api/main.py`)
- **Purpose**: Exposes the REST API endpoints and routes requests to backend services.
- **Responsibilities**:
  - Sets up CORS middleware to allow connections from the frontend.
  - Handles API requests for market listings, KPIs, historical snapshots, pricing rules, and competitorwatchlists.
  - Controls target listing connection, resolving, and manual pricing overrides.
  - Invokes background tasks for scraper pipelines.
- **Dependencies**: `fastapi`, `uvicorn`, `backend.utils.db`, `backend.scraper.scheduler`, `backend.etl.pipeline`, `backend.ml.pricing_model`, `backend.analytics.competitor`.
- **Inputs**: HTTP REST request bodies (JSON payloads), path parameters, query parameters.
- **Outputs**: HTTP JSON responses, HTTP status codes, background tasks initialization.

### 2. Competitor Engine (`backend/analytics/competitor.py`)
- **Purpose**: Implements the k-Nearest Neighbors (k-NN) classifier to find the closest competitor listings.
- **Responsibilities**:
  - Loads all listings in the target's neighborhood.
  - Applies hard constraints (same bedrooms, adjusts guest capacity bounds to $+/- 2$, checks base price range of $60\% - 180\%$).
  - Calculates geographic distances using the Haversine formula.
  - Computes weighted euclidean distance scores across normalized parameters.
  - Restricts analysis to a **1.5km limit radius** and normalizes distance scores.
- **Dependencies**: `pandas`, `numpy`, `sqlite3`, `json`, `backend.utils.db`.
- **Inputs**: `target_listing_id` (string), `db_path` (string).
- **Outputs**: Sorted list of dictionaries containing competitor listing detail dictionaries (top $K$).

### 3. ETL Pipeline (`backend/etl/pipeline.py`)
- **Purpose**: Transforms scraped JSON raw payloads and populates the SQLite database.
- **Responsibilities**:
  - Parses raw JSON file arrays.
  - Computes forward 30-day occupancy rates based on availability calendars.
  - Detects booking events (when a day changes from available to booked).
  - Updates the `listings` dimension table and logs daily snapshot metrics in the `listings_daily` fact table.
- **Dependencies**: `sqlite3`, `json`, `glob`, `datetime`, `backend.utils.db`.
- **Inputs**: Path to raw scraped JSON file.
- **Outputs**: Dictionary summarizing pipeline stats (listings loaded, calendar snapshots updated, bookings detected).

### 4. Dynamic Pricing Engine (`backend/ml/pricing_model.py`)
- **Purpose**: Trains pricing models and produces 30-day recommended pricing paths.
- **Responsibilities**:
  - Collects historical occupancy rates and competitor pricing bounds from the database.
  - Applies Argentina national holidays markups ($+20\%$).
  - Evaluates pricing override rules: resolves final values by prioritizing: 1) Manual Override flags, 2) Web scraped values, 3) YAML configuration default rules.
  - Computes daily base recommendations and applies weekend premiums ($+15\%$).
- **Dependencies**: `sqlite3`, `pandas`, `yaml`, `datetime`, `backend.utils.db`, `backend.utils.holidays`.
- **Inputs**: `listing_id` (string), configuration overrides, database path.
- **Outputs**: 30-day recommended price trajectory saved to the database.

---

## 🔄 Backend Data Flow Example

For the target property configuration update endpoint (`POST /api/settings/target/save`):

```
[Frontend Client] 
       │ (JSON payload containing target details)
       ▼
[FastAPI Route Handler]
       │
       ├───► Writes to config/target_settings.json
       │
       ├───► Opens SQLite Connection (backend.utils.db)
       │
       ├───► Runs SQL: UPSERT into 'listings' table
       │
       ├───► Runs SQL: UPSERT into 'listings_daily' table (persisting current settings)
       │
       └───► Triggers Background task: Re-runs k-NN competitor update & ML pricing
```

---

## ⚠️ Limitations & Future Improvements

### Current Limitations:
- **Single-Threaded SQLite**: SQLite handles concurrent reads well, but concurrent writes lock the database. Heavy scraping or parallel API actions can cause `database is locked` exceptions if not handled with serial queues.
- **Local JSON Storage**: Configurations are written to a local `target_settings.json` file. In multi-tenant cloud environments (e.g. serverless containers), this local file is ephemeral unless committed back to git or stored in a managed service.

### Future Improvements:
1. **Transition to PostgreSQL**: Migrating the backend data layers to PostgreSQL to support multiple concurrent connection pools and row-level locking.
2. **Asynchronous Task Queue (Celery/Redis)**: Offload heavy scraping tasks and ML model training to Celery workers with a Redis broker, replacing the simple `BackgroundTasks` of FastAPI.
