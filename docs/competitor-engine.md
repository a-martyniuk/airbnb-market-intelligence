# Competitor Engine Specification

This document provides a technical specification for the competitor selection engine (`backend/analytics/competitor.py`), including similarity weights, formulas, and geographic boundary constraints.

---

## 🌎 Geographic Haversine Distance Formula

Geographic distance between coordinates (latitude, longitude) is computed using the **Haversine formula**, accounting for the earth's curvature:

\[a = \sin^2\left(\frac{\Delta \text{lat}}{2}\right) + \cos(\text{lat}_1) \cdot \cos(\text{lat}_2) \cdot \sin^2\left(\frac{\Delta \text{lon}}{2}\right)\]
\[c = 2 \cdot \arctan2\left(\sqrt{a}, \sqrt{1-a}\right)\]
\[d = R \cdot c\]

Where:
- \(R = 6371.0\) km (earth's radius).
- \(d\) = final distance in kilometers.

---

## 👥 k-NN Competitor Matching Algorithm

To compile a target listing's direct watchlist, candidates must pass three strict primary filters:
1. **Exact Bedroom Count**: Listings must have the exact same number of bedrooms as the target listing (\(Bed_{target} == Bed_{comp}\)).
2. **Accommodates Capacity**: Guest capacity must not deviate by more than 2 (\(|Capacity_{target} - Capacity_{comp}| \le 2\)).
3. **Price Ranges**: The base price must remain within a logical boundary:
   \[0.6 \cdot Price_{target} \le Price_{comp} \le 1.8 \cdot Price_{target}\]
4. **Hard Distance Limit**: The candidate must reside within a **1.5km limit radius** from the target property:
   \[d \le 1.5 \text{ km}\]

---

## 📐 Similarity Distance Weights

For all listings passing the constraints, the engine computes a weighted similarity score:

\[\text{Similarity Score} = w_{dist} \cdot D_{dist} + w_{bath} \cdot D_{bath} + w_{accom} \cdot D_{accom} + w_{am} \cdot D_{am}\]

Where the normalized distance metrics (\(D\)) and weight coefficients (\(w\)) are defined as:

| Parameter | Weight Coefficient (\(w\)) | Normalization Boundary |
| :--- | :---: | :--- |
| **Ubicación (\(D_{dist}\))** | **0.35** | Geographic distance divided by 1.5 (maximum 1.5km). |
| **Amenities (\(D_{am}\))** | **0.35** | Percentage mismatch of key amenities (Pool, Gym, Jacuzzi, Parking, AC). |
| **Capacidad (\(D_{accom}\))** | **0.20** | Guest difference divided by 6.0 (maximum difference 6). |
| **Baños (\(D_{bath}\))** | **0.10** | Bathroom difference divided by 2.0 (maximum difference 2). |

A **Similarity Score of 0.0** represents a perfect match. The engine sorts listings by score in ascending order, returning the top $K$ neighbors (default $K=20$).
