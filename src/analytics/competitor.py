import sqlite3
import pandas as pd
import numpy as np
import yaml
import json
from typing import List, Dict, Any
from src.utils.db import get_connection

class CompetitorAnalyzer:
    """
    Finds competitor listing clusters using weighted k-Nearest Neighbors.
    Combines spatial (Haversine) distance with listing capacity similarities.
    """

    def __init__(self, settings_path: str = "config/settings.yaml"):
        with open(settings_path, 'r', encoding='utf-8') as f:
            self.settings = yaml.safe_load(f)
            
        config = self.settings.get('competitor_analysis', {})
        self.k_neighbors = config.get('k_neighbors', 5)
        self.weights = config.get('weights', {
            'distance': 0.5,
            'bedrooms': 0.2,
            'bathrooms': 0.1,
            'accommodates': 0.2
        })

    def _haversine_distance(self, lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """
        Calculates the great-circle distance between two points on the Earth in kilometers.
        """
        # Convert decimal degrees to radians
        lat1, lon1, lat2, lon2 = map(np.radians, [lat1, lon1, lat2, lon2])

        # Haversine formula
        dlat = lat2 - lat1
        dlon = lon2 - lon1
        a = np.sin(dlat/2.0)**2 + np.cos(lat1) * np.cos(lat2) * np.sin(dlon/2.0)**2
        c = 2.0 * np.arcsin(np.sqrt(a))
        r = 6371.0 # Radius of earth in kilometers
        return c * r

    def find_competitors(self, target_listing_id: str, db_path: str = "data/airbnb_intelligence.db") -> List[Dict[str, Any]]:
        """
        Calculates and returns the top k competitor listings for a target listing.
        """
        conn = get_connection(db_path)
        
        # Load all listings with their latest price and occupancy from listings_daily
        query = """
        SELECT l.*, 
               COALESCE(ld.price, 0.0) as price, 
               COALESCE(ld.estimated_occupancy_rate_30d, 0.0) as estimated_occupancy_rate_30d,
               COALESCE(ld.snapshot_date, 'Nunca') as last_scraped
        FROM listings l
        LEFT JOIN listings_daily ld ON l.listing_id = ld.listing_id
          AND ld.snapshot_date = (SELECT MAX(snapshot_date) FROM listings_daily WHERE listing_id = l.listing_id)
        """
        df = pd.read_sql_query(query, conn)
        conn.close()

        if df.empty:
            return []

        # Find target listing
        target_row = df[df['listing_id'] == target_listing_id]
        if target_row.empty:
            raise ValueError(f"Listing {target_listing_id} not found in database.")

        target = target_row.iloc[0]
        
        # Calculate distances and differences
        competitor_scores = []
        
        for _, row in df.iterrows():
            if row['listing_id'] == target_listing_id:
                continue # Skip self

            # Direct Competitor Hard Filters:
            # 1. Exact bedroom match
            if row['bedrooms'] != target['bedrooms']:
                continue
            # 2. Tight capacity match (max 1 guest difference)
            if abs(target['accommodates'] - row['accommodates']) > 1:
                continue
            # 3. Realistic price range (+60% / -40% of target base price)
            target_base_price = target['price'] if target['price'] else 90.0
            if not (0.6 * target_base_price <= row['price'] <= 1.6 * target_base_price):
                continue

            # 1. Geo distance (km)
            geo_dist = self._haversine_distance(
                target['latitude'], target['longitude'],
                row['latitude'], row['longitude']
            )
            # Normalize geo distance: bound to [0, 5km] and scale to [0, 1]
            norm_dist = min(geo_dist / 5.0, 1.0)

            # 2. Bedrooms differences
            bed_diff = abs(target['bedrooms'] - row['bedrooms'])
            norm_bed = min(bed_diff / 3.0, 1.0) # max bedrooms diff 3

            # 3. Bathrooms differences
            bath_diff = abs(target['bathrooms'] - row['bathrooms'])
            norm_bath = min(bath_diff / 2.0, 1.0) # max bathrooms diff 2

            # 4. Accommodates capacity differences
            accom_diff = abs(target['accommodates'] - row['accommodates'])
            norm_accom = min(accom_diff / 6.0, 1.0) # max accommodates diff 6

            # Calculate amenities match score (0.0 means perfect match, 1.0 means complete mismatch)
            row_am = json.loads(row['amenities']) if row['amenities'] else []
            target_am = json.loads(target['amenities']) if target['amenities'] else []
            
            row_am_set = set(row_am)
            target_am_set = set(target_am)
            
            # Key amenities for pricing tier comparison
            key_amenities = ["Pool", "Gym", "Jacuzzi", "Parking", "Air conditioning"]
            am_diff_count = sum(1 for am in key_amenities if (am in target_am_set) != (am in row_am_set))
            norm_am_diff = am_diff_count / len(key_amenities)

            # Compute weighted similarity distance (smaller is better/closer)
            # Since bedrooms are filtered to be exactly equal, we reallocate bedroom weight to amenities.
            weighted_score = (
                0.35 * norm_dist +
                0.10 * norm_bath +
                0.20 * norm_accom +
                0.35 * norm_am_diff
            )

            competitor_scores.append({
                "listing_id": row['listing_id'],
                "title": row['title'],
                "neighborhood": row['neighborhood'],
                "bedrooms": row['bedrooms'],
                "bathrooms": row['bathrooms'],
                "accommodates": row['accommodates'],
                "rating": row['rating'],
                "reviews_count": row['reviews_count'],
                "latitude": row['latitude'],
                "longitude": row['longitude'],
                "geo_distance_km": round(geo_dist, 2),
                "similarity_score": round(weighted_score, 4),
                "price": float(row['price']),
                "estimated_occupancy_rate_30d": round(float(row['estimated_occupancy_rate_30d']) * 100, 1),
                "last_scraped": row['last_scraped'],
                "picture_url": str(row['picture_url']) if pd.notna(row.get('picture_url')) else None
            })

        # Sort by similarity score ascending
        competitor_scores.sort(key=lambda x: x['similarity_score'])
        
        # Return top k neighbors
        return competitor_scores[:self.k_neighbors]

if __name__ == "__main__":
    analyzer = CompetitorAnalyzer()
    try:
        comps = analyzer.find_competitors("mock_1001")
        print(f"Top 5 competitors for mock_1001:")
        for idx, c in enumerate(comps):
            print(f"{idx+1}. {c['title']} ({c['neighborhood']}) - Distance: {c['geo_distance_km']} km, Score: {c['similarity_score']}")
    except Exception as e:
        print(f"Test run failed (DB probably empty): {str(e)}")
