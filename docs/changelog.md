# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
