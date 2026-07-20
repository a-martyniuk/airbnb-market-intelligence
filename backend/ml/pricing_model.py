import sqlite3
import json
import logging
import yaml
import numpy as np
import pandas as pd
from datetime import datetime, date, timedelta
from typing import List, Dict, Any, Tuple
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import LabelEncoder
from backend.utils.db import get_connection
from backend.analytics.competitor import CompetitorAnalyzer

logger = logging.getLogger(__name__)

class DynamicPricingModel:
    """
    ML-driven Pricing Engine with Revenue Management rule overlays.
    Uses RandomForestRegressor to learn pricing patterns and applies real-time
    elasticity constraints based on lead time, occupancy, and competitor bounds.
    """

    def __init__(self, settings_path: str = "config/settings.yaml"):
        with open(settings_path, 'r', encoding='utf-8') as f:
            self.settings = yaml.safe_load(f)
            
        self.config = self.settings.get('pricing_model', {})
        self.competitor_analyzer = CompetitorAnalyzer(settings_path)
        self.model = None
        self.is_trained = False

    def _resolve_pricing_value(self, listing_id: str, field_key: str, default_val: Any, db_path: str) -> Any:
        import os
        # Priority 1: Scraped value (from listings_daily)
        scraped_val = None
        conn = get_connection(db_path)
        try:
            cursor = conn.cursor()
            db_col = field_key if field_key != "weekend_multiplier" else "weekend_price"
            # Fetch the latest daily snapshot for this listing
            cursor.execute(f"""
            SELECT {db_col}, price, weekend_price FROM listings_daily
            WHERE listing_id = ?
            ORDER BY snapshot_date DESC LIMIT 1
            """, (listing_id,))
            row = cursor.fetchone()
            if row:
                if field_key == "weekend_multiplier":
                    if row["weekend_price"] is not None and row["price"] is not None and row["price"] > 0:
                        scraped_val = round(row["weekend_price"] / row["price"], 2)
                else:
                    scraped_val = row[db_col]
        except Exception as e:
            logger.error(f"Error fetching scraped value {field_key} for {listing_id}: {str(e)}")
        finally:
            conn.close()

        # If it's the target listing, check for manual overrides
        target_settings_file = "config/target_settings.json"
        is_target = False
        pricing_overrides = {}
        manual_override_flags = {}
        if os.path.exists(target_settings_file):
            try:
                with open(target_settings_file, "r", encoding="utf-8") as f:
                    t_settings = json.load(f)
                    if str(t_settings.get("target_id")) == str(listing_id):
                        is_target = True
                        pricing_overrides = t_settings.get("pricing_overrides", {})
                        manual_override_flags = t_settings.get("manual_override_flags", {})
            except Exception:
                pass

        if is_target:
            flag = bool(manual_override_flags.get(field_key, False))
            manual_val = pricing_overrides.get(field_key)
            if flag:
                return manual_val if manual_val is not None else default_val
            elif scraped_val is not None:
                return scraped_val
            elif manual_val is not None:
                return manual_val
            else:
                return default_val
        else:
            if scraped_val is not None:
                return scraped_val
            else:
                return default_val

    def train_model(self, db_path: str = "database/airbnb_intelligence.db") -> bool:
        """
        Loads historical snapshot data from the database and trains the ML Pricing Model.
        Compares RandomForest and GradientBoosting regressors, choosing the best on MAE.
        """
        logger.info("Training Dynamic Pricing Model...")
        conn = get_connection(db_path)
        
        try:
            # Query historical daily listings and their features
            query = """
            SELECT 
                ld.snapshot_date,
                ld.price,
                ld.estimated_occupancy_rate_30d,
                l.listing_id,
                l.property_type,
                l.room_type,
                l.accommodates,
                l.bedrooms,
                l.bathrooms,
                l.neighborhood,
                l.rating,
                l.reviews_count,
                l.amenities
            FROM listings_daily ld
            JOIN listings l ON ld.listing_id = l.listing_id
            """
            df = pd.read_sql_query(query, conn)
            
            if len(df) < 20:
                logger.warning(f"Insufficient data for ML training ({len(df)} records). Rule-based fallback will be used.")
                self.is_trained = False
                return False

            # Feature Engineering
            from backend.utils.holidays import is_argentine_holiday
            df['snapshot_date'] = pd.to_datetime(df['snapshot_date'])
            df['month'] = df['snapshot_date'].dt.month
            df['day_of_week'] = df['snapshot_date'].dt.dayofweek
            df['is_weekend'] = df['day_of_week'].apply(lambda x: 1 if x in [4, 5] else 0)
            df['is_holiday'] = df['snapshot_date'].apply(lambda x: 1 if is_argentine_holiday(x.date())[0] else 0)

            # Parse normalized amenities from JSON text field
            def parse_amenities(amenities_str):
                if not amenities_str:
                    return []
                try:
                    return json.loads(amenities_str)
                except Exception:
                    return []

            df['parsed_amenities'] = df['amenities'].apply(parse_amenities)
            df['has_pool'] = df['parsed_amenities'].apply(lambda x: 1 if "Pool" in x else 0)
            df['has_gym'] = df['parsed_amenities'].apply(lambda x: 1 if "Gym" in x else 0)
            df['has_ac'] = df['parsed_amenities'].apply(lambda x: 1 if "Air conditioning" in x else 0)
            df['has_elevator'] = df['parsed_amenities'].apply(lambda x: 1 if "Elevator" in x else 0)

            # Categorical encoding
            self.prop_le = LabelEncoder()
            self.room_le = LabelEncoder()
            self.neigh_le = LabelEncoder()
            
            df['property_type_enc'] = self.prop_le.fit_transform(df['property_type'])
            df['room_type_enc'] = self.room_le.fit_transform(df['room_type'])
            df['neighborhood_enc'] = self.neigh_le.fit_transform(df['neighborhood'])

            # K-Means clustering for property segmentation
            from sklearn.cluster import KMeans
            listing_specs = df[[
                'listing_id', 'accommodates', 'bedrooms', 'bathrooms', 'rating',
                'has_pool', 'has_gym', 'has_ac', 'has_elevator'
            ]].drop_duplicates(subset=['listing_id']).copy()
            
            n_clusters = min(3, len(listing_specs))
            kmeans = KMeans(n_clusters=n_clusters, random_state=42, n_init=10)
            cluster_features = ['accommodates', 'bedrooms', 'bathrooms', 'rating', 'has_pool', 'has_gym', 'has_ac', 'has_elevator']
            
            listing_specs['rating'] = listing_specs['rating'].fillna(4.5)
            kmeans.fit(listing_specs[cluster_features])
            
            self.kmeans_model = kmeans
            self.cluster_features = cluster_features
            
            listing_to_cluster = dict(zip(listing_specs['listing_id'], kmeans.labels_))
            df['cluster_segment'] = df['listing_id'].map(listing_to_cluster)

            # Define feature matrix X and target y
            features = [
                'accommodates', 'bedrooms', 'bathrooms', 'rating', 'reviews_count',
                'property_type_enc', 'room_type_enc', 'neighborhood_enc',
                'month', 'is_weekend', 'is_holiday',
                'has_pool', 'has_gym', 'has_ac', 'has_elevator',
                'cluster_segment'
            ]
            X = df[features]
            y = df['price']

            # Multi-model evaluation if data is sufficient
            from sklearn.model_selection import train_test_split
            from sklearn.metrics import mean_absolute_error
            from sklearn.ensemble import GradientBoostingRegressor

            if len(df) >= 30:
                X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
                
                # 1. Random Forest Regressor
                rf = RandomForestRegressor(n_estimators=50, random_state=42)
                rf.fit(X_train, y_train)
                rf_preds = rf.predict(X_test)
                rf_mae = mean_absolute_error(y_test, rf_preds)
                
                # 2. Gradient Boosting Regressor
                gb = GradientBoostingRegressor(n_estimators=50, random_state=42)
                gb.fit(X_train, y_train)
                gb_preds = gb.predict(X_test)
                gb_mae = mean_absolute_error(y_test, gb_preds)
                
                logger.info(f"Model Evaluation - RandomForest MAE: {rf_mae:.2f} | GradientBoosting MAE: {gb_mae:.2f}")
                
                if gb_mae < rf_mae:
                    self.model = gb
                    best_model_name = "GradientBoosting"
                    best_mae = gb_mae
                else:
                    self.model = rf
                    best_model_name = "RandomForest"
                    best_mae = rf_mae
                
                # Fit the best model on full dataset
                self.model.fit(X, y)
                logger.info(f"Selected best model: {best_model_name} with test MAE: {best_mae:.2f}")
            else:
                # Default to Random Forest if dataset is too small to split
                self.model = RandomForestRegressor(n_estimators=50, random_state=42)
                self.model.fit(X, y)
                logger.info("RandomForest trained on full dataset (insufficient rows for train-test split evaluation).")
            
            self.is_trained = True
            logger.info("Dynamic Pricing Model trained successfully.")
            return True
            
        except Exception as e:
            logger.error(f"Failed to train pricing model: {str(e)}")
            self.is_trained = False
            return False
        finally:
            conn.close()

    def recommend_price(self, listing_id: str, target_date: date, db_path: str = "database/airbnb_intelligence.db") -> Tuple[float, float, Dict[str, Any]]:
        """
        Recommends a price for a target listing on a specific check-in date.
        Combines ML prediction with dynamic rules (lead time, competitors, seasonality).
        
        Returns:
            recommended_price (float)
            confidence_score (float)
            features (dict of features used)
        """
        conn = get_connection(db_path)
        cursor = conn.cursor()
        
        # 1. Fetch listing characteristics
        cursor.execute("SELECT * FROM listings WHERE listing_id = ?", (listing_id,))
        listing = cursor.fetchone()
        
        # 2. Fetch competitor prices for this target date
        competitors = self.competitor_analyzer.find_competitors(listing_id, db_path)
        comp_ids = [c['listing_id'] for c in competitors]
        
        comp_avg_price = None
        if comp_ids:
            placeholders = ",".join("?" for _ in comp_ids)
            cursor.execute(f"""
            SELECT AVG(price) as avg_price 
            FROM calendar_snapshots 
            WHERE listing_id IN ({placeholders}) 
              AND date = ? 
              AND snapshot_date = (SELECT MAX(snapshot_date) FROM calendar_snapshots)
            """, (*comp_ids, target_date.strftime("%Y-%m-%d")))
            row = cursor.fetchone()
            if row and row['avg_price']:
                comp_avg_price = row['avg_price']
                
        # 3. Fetch listing's current occupancy rate
        cursor.execute("""
        SELECT estimated_occupancy_rate_30d 
        FROM listings_daily 
        WHERE listing_id = ? 
        ORDER BY snapshot_date DESC LIMIT 1
        """, (listing_id,))
        row = cursor.fetchone()
        current_occupancy = row['estimated_occupancy_rate_30d'] if row else 0.5
        
        conn.close()

        # Build feature variables
        from backend.utils.holidays import is_argentine_holiday
        today = date.today()
        lead_time = (target_date - today).days
        month = target_date.month
        day_of_week = target_date.weekday()
        is_weekend = 1 if day_of_week in [4, 5] else 0
        is_holiday_flag, holiday_name = is_argentine_holiday(target_date)
        is_holiday = 1 if is_holiday_flag else 0

        # Helper to parse amenities JSON safely
        def parse_amenities(amenities_str):
            if not amenities_str:
                return []
            try:
                return json.loads(amenities_str)
            except Exception:
                return []

        parsed_am = parse_amenities(listing['amenities'])
        has_pool = 1 if "Pool" in parsed_am else 0
        has_gym = 1 if "Gym" in parsed_am else 0
        has_ac = 1 if "Air conditioning" in parsed_am else 0
        has_elevator = 1 if "Elevator" in parsed_am else 0

        # ML Prediction (Fallback to base rule-based pricing if model is not trained)
        base_ml_price = None
        if self.is_trained and self.model:
            try:
                # Encode values
                prop_enc = self.prop_le.transform([listing['property_type']])[0]
                room_enc = self.room_le.transform([listing['room_type']])[0]
                neigh_enc = self.neigh_le.transform([listing['neighborhood']])[0]
                
                # Predict cluster segment using KMeans
                cluster_seg = 0
                if hasattr(self, 'kmeans_model'):
                    import pandas as pd
                    target_features = [
                        listing['accommodates'], listing['bedrooms'], listing['bathrooms'],
                        listing['rating'] if listing['rating'] is not None else 4.5,
                        has_pool, has_gym, has_ac, has_elevator
                    ]
                    target_df = pd.DataFrame([target_features], columns=self.cluster_features)
                    cluster_seg = int(self.kmeans_model.predict(target_df)[0])

                features_names = [
                    'accommodates', 'bedrooms', 'bathrooms', 'rating', 'reviews_count',
                    'property_type_enc', 'room_type_enc', 'neighborhood_enc',
                    'month', 'is_weekend', 'is_holiday',
                    'has_pool', 'has_gym', 'has_ac', 'has_elevator',
                    'cluster_segment'
                ]
                x_val = pd.DataFrame([[
                    listing['accommodates'], listing['bedrooms'], listing['bathrooms'],
                    listing['rating'], listing['reviews_count'],
                    prop_enc, room_enc, neigh_enc,
                    month, is_weekend, is_holiday,
                    has_pool, has_gym, has_ac, has_elevator,
                    cluster_seg
                ]], columns=features_names)
                base_ml_price = float(self.model.predict(x_val)[0])
            except Exception as e:
                logger.debug(f"Encoding or prediction failed: {str(e)}")
                base_ml_price = None

        if base_ml_price is None:
            # Rule-based base price estimation
            base_ml_price = 30.0 + (listing["bedrooms"] * 25) + (listing["bathrooms"] * 15) + (listing["rating"] - 4.0) * 20
            # Adjust price based on structured amenities in rule-based fallback
            if has_pool:
                base_ml_price += 15.0
            if has_gym:
                base_ml_price += 10.0
            if has_ac:
                base_ml_price += 8.0
            if listing["host_is_superhost"]:
                base_ml_price *= 1.05

        # 4. Hybrid Value-Market pricing model
        if comp_avg_price:
            # Anchor price is 60% of listing's ML valuation (based on bedrooms, bathrooms, amenities, ratings)
            # and 40% of the local competitor average market price.
            base_optimized_price = 0.6 * base_ml_price + 0.4 * comp_avg_price
        else:
            base_optimized_price = base_ml_price


        # Resolve pricing variables using priority chain
        resolved_weekend_multiplier = self._resolve_pricing_value(listing_id, "weekend_multiplier", self.config.get('weekend_premium', 1.15), db_path)
        resolved_cleaning_fee = self._resolve_pricing_value(listing_id, "cleaning_fee", self.config.get('cleaning_fee', 15.0), db_path)
        resolved_minimum_stay = self._resolve_pricing_value(listing_id, "minimum_stay", self.config.get('average_stay_days', 3), db_path)
        resolved_maximum_stay = self._resolve_pricing_value(listing_id, "maximum_stay", 365, db_path)
        resolved_weekly_discount = self._resolve_pricing_value(listing_id, "weekly_discount", 0.0, db_path)
        resolved_monthly_discount = self._resolve_pricing_value(listing_id, "monthly_discount", 0.0, db_path)
        resolved_early_bird_discount = self._resolve_pricing_value(listing_id, "early_bird_discount", 0.0, db_path)
        resolved_last_minute_discount = self._resolve_pricing_value(listing_id, "last_minute_discount", self.config.get('last_minute_discount', 0.85), db_path)

        # Apply Dynamic Rule Overlays on top of the mathematically optimized base price
        recommended_price = base_optimized_price
        
        # Rule 1: Weekend Premium
        if is_weekend:
            recommended_price *= resolved_weekend_multiplier
            
        # Rule 2: Seasonality
        if month in self.config.get('high_season_months', []):
            recommended_price *= self.config.get('high_season_premium', 1.20)
        elif month in self.config.get('low_season_months', []):
            recommended_price *= self.config.get('low_season_discount', 0.90)
            
        # Rule 2b: Holiday Premium
        if is_holiday:
            recommended_price *= self.config.get('holiday_premium', 1.20)

        # Rule 3: Last-Minute Discount (Apply if lead time is short and listing occupancy is low)
        last_minute_days = self.config.get('last_minute_discount_days', 3)
        if 0 <= lead_time <= last_minute_days and current_occupancy < 0.4:
            lm_factor = (100.0 - resolved_last_minute_discount) / 100.0 if resolved_last_minute_discount > 1 else resolved_last_minute_discount
            recommended_price *= lm_factor

        # Rule 4: Competitor Anchoring & Hard Boundaries
        if comp_avg_price:
            # Prevent recommending prices that are way off competitor averages
            max_bound = comp_avg_price * 1.30 # Cap at 130% of competitor avg
            min_bound = comp_avg_price * 0.70 # Floor at 70% of competitor avg
            
            if recommended_price > max_bound:
                recommended_price = max_bound
                logger.debug(f"Capping price for {listing_id} on {target_date} at 130% competitor average: ${max_bound:.2f}")
            elif recommended_price < min_bound:
                recommended_price = min_bound
                logger.debug(f"Flooring price for {listing_id} on {target_date} at 70% competitor average: ${min_bound:.2f}")

        # Round to nearest integer for clean listings pricing
        recommended_price = round(recommended_price, 2)
        
        # Calculate confidence score based on competitor availability and listing data size
        confidence_score = 0.85
        if not comp_avg_price:
            confidence_score -= 0.15 # Less confident without direct competitor metrics
        if not self.is_trained:
            confidence_score -= 0.10 # Less confident without trained ML model

        features_used = {
            "base_ml_price": round(base_ml_price, 2),
            "competitor_avg_price": round(comp_avg_price, 2) if comp_avg_price else None,
            "lead_time_days": lead_time,
            "is_weekend": bool(is_weekend),
            "season_month": month,
            "is_high_season": bool(month in self.config.get('high_season_months', [])),
            "is_low_season": bool(month in self.config.get('low_season_months', [])),
            "current_occupancy_rate": round(current_occupancy, 2),
            "is_holiday": bool(is_holiday),
            "holiday_name": holiday_name,
            "cleaning_fee": resolved_cleaning_fee,
            "weekly_discount": resolved_weekly_discount,
            "monthly_discount": resolved_monthly_discount,
            "early_bird_discount": resolved_early_bird_discount,
            "last_minute_discount": resolved_last_minute_discount,
            "weekend_multiplier": resolved_weekend_multiplier,
            "minimum_stay": resolved_minimum_stay,
            "maximum_stay": resolved_maximum_stay
        }

        return recommended_price, confidence_score, features_used

    def generate_and_save_recommendations(self, listing_id: str, days: int = 30, db_path: str = "database/airbnb_intelligence.db"):
        """
        Generates price recommendations for the next N days and stores them in SQLite.
        """
        logger.info(f"Generating price recommendations for listing {listing_id} ({days} days)...")
        conn = get_connection(db_path)
        cursor = conn.cursor()
        
        today = date.today()
        
        for d_idx in range(1, days + 1):
            target_date = today + timedelta(days=d_idx)
            target_date_str = target_date.strftime("%Y-%m-%d")
            
            rec_price, confidence, features = self.recommend_price(listing_id, target_date, db_path)
            
            cursor.execute("""
            INSERT INTO price_recommendations (
                listing_id, date, recommended_price, confidence_score, features
            ) VALUES (?, ?, ?, ?, ?)
            ON CONFLICT(listing_id, date) DO UPDATE SET
                recommended_price=excluded.recommended_price,
                confidence_score=excluded.confidence_score,
                features=excluded.features,
                created_at=CURRENT_TIMESTAMP
            """, (listing_id, target_date_str, rec_price, confidence, json.dumps(features)))
            
        conn.commit()
        conn.close()
        logger.info(f"Saved {days} recommendations for listing {listing_id} to database.")

if __name__ == "__main__":
    # Test model
    logging.basicConfig(level=logging.INFO)
    model = DynamicPricingModel()
    model.train_model()
    try:
        model.generate_and_save_recommendations("mock_1001", 5)
    except Exception as e:
        print(f"Test recommendation run failed (DB probably empty): {str(e)}")
