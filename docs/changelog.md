# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.3.0] - 2026-07-21

### Added
- **Multilingual & New Listing Scraper Parsing**: Expanded regex parsing to recognize Spanish and English review labels (*"evaluaciones"*, *"reseñas"*, *"reviews"*) and handle *"Nuevo"* badge without default dummy review counts.
- **User-Agent Rotation**: Rotates standard modern browser User-Agents to prevent anti-bot IP blocks.
- **Market Competitor Discount Medians**: Pricing engine computes median weekly and monthly discounts across k-NN competitor properties (`suggested_weekly_discount`, `suggested_monthly_discount`).
- **Argentine Holiday Calendar**: Integrated ArgentinaDatos API with static fallbacks for 2026/2027 holidays and long weekend bridges.
- **Keep-Alive Endpoint (`/api/health`)**: Added lightweight health check endpoint to prevent Render free-tier cold starts.
- **Live Ingestion Progress Toast**: Floating UI toast displaying real-time scraping and ML training progress percentage.
- **Interactive Competitor Filters**: Added filter panel for competitor cards (text search, max price range slider, required amenities dropdown, min rating/reviews dropdown, clear filters button).

### Fixed
- **Dropdown Option Menu Styling**: Fixed `<select>` and `<option>` dropdown styling for dark theme (`#0f172a` background, white text) preventing unreadable white-on-white text.
- **CORS Explicit Origins**: Replaced wildcard CORS with explicit allowed origin list for sub-path portfolio proxying (`https://www.alexismartyniuk.com.ar`).
- **Fast Client-side Target URL Resolution**: Extracted room ID client-side from Airbnb URL regex to eliminate target configuration timeouts.
- **Hydration Toast State Fix**: Fixed sticky 10% progress toast by clearing `hydrating` state when backend status is `"idle"`, `"success"`, or `"error"`.

---

## [1.2.0] - 2026-07-20

### Added
- Created `/docs/PROJECT_INDEX.md` as the developer entry point.
- Reorganized source folders: moved python backend from `src/` to `backend/` and database files from `data/` to `database/`.
- Documented entire project including API reference, database constraints, dynamic pricing formulas, and k-NN metrics.

### Changed
- Shifted k-NN geographic limits to a strict **1.5km limit radius** constraint.
- Unified 5 separate property configuration views into a single, modular tab **"Mi Propiedad"** with sub-tabs.

### Fixed
- Fixed competitor amenities bug in the API response that caused the frontend to list all target amenities as advantages.
- Fixed `listings_daily` database insertion to prevent SQL column count alignment errors.

---

## [1.1.0] - 2026-07-18

### Added
- Added automated daily ingestion workflow cron jobs via GitHub Actions.
- Added git commit updates inside GitHub Actions.
- Integrated override settings resolution logic (Prioritizes Manual Overrides -> Web Scrapes -> Defaults).

---

## [1.0.0] - 2026-07-12

### Added
- Initial release of the AirMarket AI SaaS application.
- Exposes Decision Center dashboard, interactive Leaflet Map preview, and 12-month Cumulative forecast.
