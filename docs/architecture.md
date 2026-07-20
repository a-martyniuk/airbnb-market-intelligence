# System Architecture Specification

This document details the high-level system architecture, design patterns, and deployment topologies of the AirMarket AI application.

---

## 🏛️ High-Level System Architecture

AirMarket AI is built using a decoupled **Micro-SaaS architecture** composed of:
1. **Frontend UI**: A Single Page Application (SPA) built using Next.js (React), communicating with the backend API asynchronously.
2. **Backend API**: A FastAPI (Python) server providing endpoints for market analysis, pricing rules, pipeline execution status, and listing details.
3. **Scraper & ETL Pipeline**: A modular Python orchestration pipeline that scrapes public web pages of Airbnb, parses the data, runs the dynamic pricing model, and updates the database.
4. **Git-as-a-Database (GitDB)**: The system utilizes GitHub as a database synchronization ledger. Daily cron runs on GitHub Actions update the database and push commits directly to the repository, which triggers deployments on Render and Vercel automatically.

```mermaid
graph TD
    User([User Browser]) <-->|HTTPS / JSON| FE[Vercel Frontend - React / Next.js]
    FE <-->|REST API / HTTP| BE[Render Backend - FastAPI]
    
    subgraph Data Layer [Data & Sync Layer]
        BE <-->|Read / Write| SQLite[(airbnb_intelligence.db)]
        BE <-->|Read / Write| Settings[config/target_settings.json]
    end

    subgraph Automation [GitHub Automated Pipelines]
        GH[GitHub Actions Cron Workflow] -->|Triggers Daily Run| Pipeline[etl/run_daily_pipeline.py]
        Pipeline -->|1. Public Scrape| Scraper[scraper/real_scraper.py]
        Pipeline -->|2. Ingest JSON| ETL[etl/pipeline.py]
        Pipeline -->|3. Train Model| ML[ml/pricing_model.py]
        Pipeline -->|4. Update Watchlist| KNN[analytics/competitor.py]
        Pipeline -->|5. Commit DB| Commit[Git Commit & Push]
        
        Commit -->|Updates Codebase| GitHubRepo[(GitHub Repository)]
        GitHubRepo -->|Deploy Webhook| FE
        GitHubRepo -->|Deploy Webhook| BE
    end
```

---

## 🌐 Next.js Frontend Architecture

The frontend is a single-page Next.js application built with vanilla CSS. It handles modular state routing internally:

```mermaid
graph TD
    App[App page.js] --> State[Component States: selectedId, activeView, targetDetails, competitors]
    State --> Navigation{activeView router}
    
    Navigation -->|dashboard| Decisions[Centro de Decisiones - Decision Cards]
    Navigation -->|pricing| Intelligence[Inteligencia de Precios - Charts & Overrides]
    Navigation -->|competidores| Competitors[Competidores Afines - Cards & Drawer]
    Navigation -->|forecast| Forecast[Forecast y Escenarios - Projections AreaChart]
    Navigation -->|calendario| Calendar[Calendario Tarifario - Calendar Matrix]
    Navigation -->|property_profile| Profile[Mi Propiedad Setup - SubTabs]
    Navigation -->|pricing_rules| Rules[Reglas de Tarifas - Overrides Autosave]
    Navigation -->|historicos| History[Análisis Histórico - Snapshots Picker]
    
    Profile --> SubTabSync[🔗 Conexión Airbnb]
    Profile --> SubTabSpecs[📋 Ficha Técnica y Mapa Preview]
    Profile --> SubTabAmenities[✨ Amenities Checklist & Search]
    
    State --> AutoSave[Debounced Autosave Hook - Notion Style]
    AutoSave -->|POST /api/settings/target/save| BEAPI[FastAPI Server]
```

---

## 🐍 Python Backend Architecture

The backend is modular and follows standard Python package conventions:

```mermaid
graph TD
    API[api/main.py] --> Router[FastAPI Route Handlers]
    
    Router -->|Query listings/stats| DB[(utils/db.py - SQLite Connector)]
    Router -->|Trigger scraping update| Scheduler[scraper/scheduler.py]
    Router -->|Process parameters overrides| Pricing[ml/pricing_model.py]
    Router -->|Sync database file| GitDB[utils/git_db.py]
    
    Scheduler -->|Spawns| RealScraper[scraper/real_scraper.py]
    RealScraper -->|Extracts HTML/JSON| BS4[BeautifulSoup4 / RegEx]
    BS4 -->|Save Raw Payloads| RawFolder[(database/raw/)]
```

---

## 💾 Database ER Diagram

The database structure is normalized into dimension and fact tables, designed for historical tracking and fast query retrieval:

```mermaid
erDiagram
    listings ||--o{ listings_daily : "has daily snapshots"
    listings ||--o{ calendar_snapshots : "has future calendars"
    listings ||--o{ price_recommendations : "has recommended prices"
    listings ||--o{ booking_events : "has booked history"
    listings ||--o{ competitor_watchlist : "is target property in"
    
    listings {
        TEXT listing_id PK
        TEXT title
        TEXT property_type
        TEXT room_type
        INTEGER accommodates
        INTEGER bedrooms
        REAL bathrooms
        REAL latitude
        REAL longitude
        TEXT neighborhood
        REAL rating
        INTEGER reviews_count
        TEXT host_id
        TEXT host_name
        INTEGER host_is_superhost
        TEXT amenities
        TEXT picture_url
        TIMESTAMP created_at
    }
    
    listings_daily {
        DATE snapshot_date PK
        TEXT listing_id PK, FK
        REAL price
        REAL rating
        INTEGER reviews_count
        REAL estimated_occupancy_rate_30d
        REAL weekend_price
        REAL weekly_discount
        REAL monthly_discount
        REAL early_bird_discount
        REAL last_minute_discount
        REAL cleaning_fee
        INTEGER minimum_stay
        INTEGER maximum_stay
        INTEGER instant_book
        TEXT cancellation_policy
    }
    
    calendar_snapshots {
        DATE snapshot_date PK
        TEXT listing_id PK, FK
        DATE date PK
        REAL price
        INTEGER available
    }
    
    price_recommendations {
        TEXT listing_id PK, FK
        DATE date PK
        REAL recommended_price
        REAL confidence_score
        TEXT features
        TIMESTAMP created_at
    }
    
    booking_events {
        TEXT listing_id PK, FK
        DATE date PK
        REAL price_sold
        TIMESTAMP detected_at
    }
    
    competitor_watchlist {
        TEXT target_listing_id PK, FK
        TEXT competitor_listing_id PK, FK
        TIMESTAMP created_at
    }
```

---

## 🤖 GitHub Actions Workflow Flow

The automated daily ingestion pipeline is driven by GitHub Actions:

```mermaid
sequenceDiagram
    autonumber
    participant CRON as GitHub Cron Trigger
    participant VM as runner-virtual-machine
    participant SCR as scraper/real_scraper.py
    participant ETL as etl/pipeline.py
    participant ML as ml/pricing_model.py
    participant REPO as github-repository-remote

    CRON->>VM: Trigger Workflow (Daily 04:00 UTC)
    VM->>VM: Checkout codebase & setup python
    VM->>SCR: Execute search & details public scrape
    SCR->>VM: Save raw payloads under database/raw/
    VM->>ETL: Process raw payloads (occupancy & listing info)
    ETL->>VM: Insert/Update SQLite listings_daily
    VM->>ML: Train pricing model & generate recommendations
    ML->>VM: Save price recommendations to SQLite
    VM->>REPO: Git commit & push (database & settings changes)
    Note over REPO: Webhook triggers redeploy on Vercel & Render
```

---

## 📈 Recommendation & Simulation Engine Data Flow

Calculates user pricing recommendations, RevPAR projections, and simulator scenarios:

```mermaid
graph TD
    Config[config/target_settings.json Overrides] --> Resolver[Rules Resolver]
    DBListings[SQLite: listings_daily history] --> Resolver
    Defaults[config/settings.yaml default rules] --> Resolver
    
    Resolver -->|Resolves Pricing Settings| FinalParams[Resolved Pricing Params]
    
    FinalParams -->|Inputs| PricingModel[backend/ml/pricing_model.py]
    MLData[Listing occupancy & competitor bounds] --> PricingModel
    
    PricingModel -->|Computes Recommended Price| RecPrice[recommended_price]
    
    RecPrice -->|1. Base Recommendation| RecsTable[price_recommendations table]
    
    RecPrice & FinalParams -->|2. Frontend Simulator| Sim[page.js Revenue Simulator]
    Sim -->|Inputs: simulatorPct slider| SimRevpar[Simulated RevPAR / Monthly projections]
    Sim -->|Display Strategy Badge| UIDisplay[Centro de Decisiones Dashboard]
```
