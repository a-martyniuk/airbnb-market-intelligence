# Project Roadmap

This document outlines completed milestones, items currently in progress, and planned enhancements for the AirMarket AI project.

---

## ✅ Completed Milestones

- **Unified Configuration Interface**: Merged the 5 separate configuration tabs into a single tab called **"Mi Propiedad"** with sub-tab controls.
- **k-NN Competitor Optimization**: Reduced search radius to a strict **1.5km limit** to better capture localized Palermo micro-markets.
- **Auto-Save Notion Style**: Added debounced auto-saving on all property configuration changes.
- **Competitor Amenities Bug Fix**: Corrected backend payload serialization to return competitor amenities and map them to Spanish labels.
- **Git-as-a-Database (GitDB)**: Persisted runtime configurations and data models directly within git repositories to avoid serverless database overhead.

---

## ⏳ In Progress

- **Real-Time Log Viewer**: Real-time visualization of scheduler logs in the dashboard alerts section.
- **Database Schema Validation**: Adding strict Pydantic model type validation to backend API requests.

---

## 🔮 Planned Enhancements

- **Dynamic Proxy Rotation**: Adding proxy pools in the scraping scheduler to avoid Cloudflare/Airbnb IP blocks.
- **Support for Multi-Unit Listings**: Scaling the model to handle properties with multiple units under the same ID.
- **Machine Learning Improvements**: Training XGBoost regressors on competitor features to model local seasonality.
