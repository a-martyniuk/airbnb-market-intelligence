# REST API Reference

This document catalogs the web API endpoints exposed by the FastAPI backend server (`backend/api/main.py`), details parameters, payloads, and response formats.

---

## 🗂️ API Catalog

### 1. Resolve Target Property Details
- **Endpoint**: `POST /api/settings/target/resolve`
- **Purpose**: Scrapes a public Airbnb listing URL in real time to extract its baseline characteristics.
- **Request Body**:
  ```json
  {
    "url": "https://www.airbnb.com/rooms/1126744888258385312"
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "status": "success",
    "details": {
      "listing_id": "1126744888258385312",
      "title": "Apartment in Palermo Hollywood",
      "accommodates": 4,
      "bedrooms": 1,
      "bathrooms": 1.5,
      "price": 95.0,
      "rating": 4.9,
      "reviews_count": 12,
      "amenities": ["Wifi", "Air conditioning", "Pool"],
      "picture_url": "https://a0.muscache.com/..."
    }
  }
  ```

### 2. Save Target Listing Configuration
- **Endpoint**: `POST /api/settings/target/save`
- **Purpose**: Persists configuration changes, updates the database, and schedules backend pricing recalculations.
- **Request Body**:
  ```json
  {
    "target_url": "https://www.airbnb.com/rooms/1126744888258385312",
    "target_id": "1126744888258385312",
    "details": {
      "listing_id": "1126744888258385312",
      "title": "Apartment in Palermo Hollywood",
      "accommodates": 4,
      "bedrooms": 1,
      "bathrooms": 1.5,
      "price": 95.0,
      "rating": 4.9,
      "reviews_count": 12,
      "amenities": ["Wifi", "Air conditioning", "Pool"]
    },
    "pricing_overrides": {
      "cleaning_fee": 20.0
    },
    "manual_override_flags": {
      "cleaning_fee": true
    }
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "status": "success",
    "message": "Target settings saved successfully"
  }
  ```

### 3. Retrieve Target Settings
- **Endpoint**: `GET /api/settings/target`
- **Purpose**: Loads the currently active target listing configuration.
- **Response (200 OK)**:
  ```json
  {
    "target_url": "https://www.airbnb.com/rooms/1126744888258385312",
    "target_id": "1126744888258385312",
    "details": { ... }
  }
  ```

### 4. Fetch k-NN Competitors Watchlist
- **Endpoint**: `GET /api/listings/{listing_id}/competitors`
- **Purpose**: Recalculates and returns the closest competitor properties.
- **Response (200 OK)**:
  ```json
  {
    "target": { ... },
    "competitors": [
      {
        "listing_id": "1341510528713415777",
        "title": "Exclusive Loft in Palermo",
        "price": 94.0,
        "geo_distance_km": 0.91,
        "similarity_score": 0.05,
        "estimated_occupancy_rate_30d": 60.0,
        "amenities": ["Wifi", "Air conditioning", "Pool", "Gym"]
      }
    ]
  }
  ```
