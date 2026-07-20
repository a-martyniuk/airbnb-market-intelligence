import json
import os
import logging
import sqlite3
from datetime import datetime, timedelta
from typing import Dict, Any, List
from backend.utils.db import get_connection, init_db

logger = logging.getLogger(__name__)

class ETLPipeline:
    """
    ETL Pipeline to process raw Airbnb scrape outputs.
    Parses listing details, daily facts, and future calendars.
    Implements Calendar Delta Tracking to detect bookings and records booking events.
    """

    def __init__(self, db_path: str = "database/airbnb_intelligence.db"):
        self.db_path = db_path
        # Ensure database is initialized
        init_db(self.db_path)

    def process_raw_file(self, raw_file_path: str, run_date: str = None) -> Dict[str, Any]:
        """
        Executes the ETL process on a raw scraper JSON file.
        
        :param raw_file_path: Path to the raw JSON file.
        :param run_date: Custom date string (YYYY-MM-DD) to override execution date (for history generation).
        """
        logger.info(f"Starting ETL execution on: {raw_file_path}")
        
        if not os.path.exists(raw_file_path):
            raise FileNotFoundError(f"Raw file {raw_file_path} not found.")

        with open(raw_file_path, 'r', encoding='utf-8') as f:
            raw_data = json.load(f)

        metadata = raw_data.get("metadata", {})
        results = raw_data.get("results", [])
        
        # Determine target date for ETL
        target_date_str = run_date or metadata.get("date") or datetime.now().strftime("%Y-%m-%d")
        target_date = datetime.strptime(target_date_str, "%Y-%m-%d").date()
        yesterday_date = target_date - timedelta(days=1)
        yesterday_date_str = yesterday_date.strftime("%Y-%m-%d")

        conn = get_connection(self.db_path)
        cursor = conn.cursor()

        stats = {
            "date": target_date_str,
            "listings_processed": 0,
            "listings_inserted": 0,
            "calendar_rows_inserted": 0,
            "bookings_detected": 0
        }

        try:
            for item in results:
                listing_data = item.get("listing", {})
                calendar_data = item.get("calendar", [])
                
                if not listing_data or "listing_id" not in listing_data:
                    continue

                listing_id = listing_data["listing_id"]
                stats["listings_processed"] += 1

                # 1. Update/Insert listing dimension
                cursor.execute("""
                INSERT INTO listings (
                    listing_id, title, property_type, room_type, accommodates, 
                    bedrooms, bathrooms, latitude, longitude, neighborhood, 
                    rating, reviews_count, host_id, host_name, host_is_superhost,
                    amenities, picture_url
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(listing_id) DO UPDATE SET
                    title=excluded.title,
                    rating=excluded.rating,
                    reviews_count=excluded.reviews_count,
                    host_is_superhost=excluded.host_is_superhost,
                    amenities=excluded.amenities,
                    picture_url=excluded.picture_url
                """, (
                    listing_id,
                    listing_data.get("title"),
                    listing_data.get("property_type"),
                    listing_data.get("room_type"),
                    listing_data.get("accommodates"),
                    listing_data.get("bedrooms"),
                    listing_data.get("bathrooms"),
                    listing_data.get("latitude"),
                    listing_data.get("longitude"),
                    listing_data.get("neighborhood"),
                    listing_data.get("rating"),
                    listing_data.get("reviews_count"),
                    listing_data.get("host_id"),
                    listing_data.get("host_name"),
                    listing_data.get("host_is_superhost"),
                    json.dumps(listing_data.get("amenities", [])),
                    listing_data.get("picture_url")
                ))
                
                if cursor.rowcount > 0:
                    stats["listings_inserted"] += 1

                # 2. Get yesterday's calendar snapshot for this listing to compare
                cursor.execute("""
                SELECT date, price, available 
                FROM calendar_snapshots 
                WHERE listing_id = ? AND snapshot_date = ?
                """, (listing_id, yesterday_date_str))
                
                yesterday_cal = {row["date"]: {"price": row["price"], "available": row["available"]} 
                                 for row in cursor.fetchall()}

                # 3. Process calendar rows & Detect booking deltas
                booked_days_count = 0
                total_days_count = len(calendar_data)

                for cal_row in calendar_data:
                    future_date_str = cal_row["date"]
                    price = cal_row["price"]
                    available = cal_row["available"] # 1 = free, 0 = booked/blocked

                    if available == 0:
                        booked_days_count += 1

                    # Insert calendar snapshot
                    cursor.execute("""
                    INSERT INTO calendar_snapshots (
                        snapshot_date, listing_id, date, price, available
                    ) VALUES (?, ?, ?, ?, ?)
                    ON CONFLICT(snapshot_date, listing_id, date) DO UPDATE SET
                        price=excluded.price,
                        available=excluded.available
                    """, (target_date_str, listing_id, future_date_str, price, available))
                    stats["calendar_rows_inserted"] += 1

                    # Calendar Delta Tracking logic:
                    # If this date was available yesterday (available = 1) 
                    # and is booked today (available = 0), record a booking event
                    if future_date_str in yesterday_cal:
                        y_state = yesterday_cal[future_date_str]
                        if y_state["available"] == 1 and available == 0:
                            # Record booking event
                            # The price sold is yesterday's quoted price for that day
                            price_sold = y_state["price"]
                            cursor.execute("""
                            INSERT INTO booking_events (
                                listing_id, date, price_sold, detected_at
                            ) VALUES (?, ?, ?, ?)
                            ON CONFLICT(listing_id, date) DO NOTHING
                            """, (listing_id, future_date_str, price_sold, target_date_str))
                            stats["bookings_detected"] += 1

                # 4. Calculate forward 30-day occupancy rate
                occupancy_rate = booked_days_count / total_days_count if total_days_count > 0 else 0.0

                # 5. Insert daily listing stats snapshot
                cursor.execute("""
                INSERT INTO listings_daily (
                    snapshot_date, listing_id, price, rating, reviews_count, estimated_occupancy_rate_30d,
                    weekend_price, weekly_discount, monthly_discount, early_bird_discount, last_minute_discount,
                    cleaning_fee, minimum_stay, maximum_stay, instant_book, cancellation_policy
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(snapshot_date, listing_id) DO UPDATE SET
                    price=excluded.price,
                    rating=excluded.rating,
                    reviews_count=excluded.reviews_count,
                    estimated_occupancy_rate_30d=excluded.estimated_occupancy_rate_30d,
                    weekend_price=excluded.weekend_price,
                    weekly_discount=excluded.weekly_discount,
                    monthly_discount=excluded.monthly_discount,
                    early_bird_discount=excluded.early_bird_discount,
                    last_minute_discount=excluded.last_minute_discount,
                    cleaning_fee=excluded.cleaning_fee,
                    minimum_stay=excluded.minimum_stay,
                    maximum_stay=excluded.maximum_stay,
                    instant_book=excluded.instant_book,
                    cancellation_policy=excluded.cancellation_policy
                """, (
                    target_date_str,
                    listing_id,
                    calendar_data[0]["price"] if calendar_data else 0.0,
                    listing_data.get("rating"),
                    listing_data.get("reviews_count"),
                    occupancy_rate,
                    listing_data.get("weekend_price"),
                    listing_data.get("weekly_discount"),
                    listing_data.get("monthly_discount"),
                    listing_data.get("early_bird_discount"),
                    listing_data.get("last_minute_discount"),
                    listing_data.get("cleaning_fee"),
                    listing_data.get("minimum_stay"),
                    listing_data.get("maximum_stay"),
                    listing_data.get("instant_book"),
                    listing_data.get("cancellation_policy")
                ))

            conn.commit()
            logger.info(f"ETL completed successfully. Stats: {stats}")
            return stats

        except Exception as e:
            conn.rollback()
            logger.error(f"ETL transaction failed: {str(e)}")
            raise e
        finally:
            conn.close()

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    pipeline = ETLPipeline()
    # Test on existing output if applicable
    import glob
    files = glob.glob("database/raw/*/*.json")
    if files:
        pipeline.process_raw_file(files[0])
    else:
        print("No raw files found. Run the scraper first.")
