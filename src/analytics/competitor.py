import sqlite3
import pandas as pd
import numpy as np
import yaml
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

            # Filter out listings that are too different
            if abs(target['bedrooms'] - row['bedrooms']) > 1:
                continue # Max difference of 1 bedroom
            if abs(target['accommodates'] - row['accommodates']) > 2:
                continue # Max difference of 2 guests capacity

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

            # Compute weighted similarity distance (smaller is better/closer)
            weighted_score = (
                self.weights['distance'] * norm_dist +
                self.weights['bedrooms'] * norm_bed +
                self.weights['bathrooms'] * norm_bath +
                self.weights['accommodates'] * norm_accom
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
