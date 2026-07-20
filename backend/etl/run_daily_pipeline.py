import os
import json
import logging
from datetime import datetime
from backend.utils.db import get_connection
from backend.scraper.scheduler import ScrapingScheduler
from backend.etl.pipeline import ETLPipeline
from backend.ml.pricing_model import DynamicPricingModel
from backend.analytics.competitor import CompetitorAnalyzer

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

def set_pipeline_status_time(db_path: str, key: str):
    """Auxiliary function to update execution timestamps in the DB."""
    try:
        conn = get_connection(db_path)
        cursor = conn.cursor()
        now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        cursor.execute("""
            INSERT INTO pipeline_status (key, value, updated_at)
            VALUES (?, ?, CURRENT_TIMESTAMP)
            ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated_at=CURRENT_TIMESTAMP
        """, (key, now_str))
        conn.commit()
        conn.close()
    except Exception as e:
        logger.error(f"Error setting pipeline status time for key '{key}': {str(e)}")

def main():
    logger.info("Starting Daily AirMarket AI Pipeline Run...")
    
    db_path = os.getenv("DATABASE_PATH", "database/airbnb_intelligence.db")
    settings_file = "config/target_settings.json"
    
    target_id = None
    target_neighborhood = "Palermo Hollywood"
    
    # 1. Load target listing ID and neighborhood
    if os.path.exists(settings_file):
        try:
            with open(settings_file, "r", encoding="utf-8") as f:
                settings_data = json.load(f)
                target_id = settings_data.get("target_id")
                target_neighborhood = settings_data.get("details", {}).get("neighborhood", "Palermo Hollywood")
                logger.info(f"Target Listing ID loaded: {target_id} in {target_neighborhood}")
        except Exception as e:
            logger.error(f"Failed to read target settings config: {str(e)}")
            
    # 2. Run Scraping Scheduler
    scheduler = ScrapingScheduler()
    logger.info("Executing scraper...")
    raw_file_path = scheduler.run_daily_scrape(city="Buenos Aires")
    
    # 3. Process with ETL Pipeline
    logger.info(f"Scraper completed. Running ETL on raw file: {raw_file_path}")
    pipeline = ETLPipeline(db_path)
    pipeline.process_raw_file(raw_file_path)
    
    # 4. Refresh Competitor Watchlist if target_id exists
    if target_id:
        logger.info(f"Re-evaluating competitor watchlist for target {target_id}...")
        analyzer = CompetitorAnalyzer()
        competitors = analyzer.find_competitors(target_id, db_path=db_path)
        
        conn = get_connection(db_path)
        cursor = conn.cursor()
        cursor.execute("DELETE FROM competitor_watchlist WHERE target_listing_id = ?", (target_id,))
        for comp in competitors:
            cursor.execute("""
                INSERT INTO competitor_watchlist (target_listing_id, competitor_listing_id)
                VALUES (?, ?)
            """, (target_id, comp["listing_id"]))
        conn.commit()
        conn.close()
        logger.info(f"Watchlist updated with {len(competitors)} competitors.")
        
    # 5. Train Pricing Model & Generate recommendations
    logger.info("Training Dynamic Pricing Model...")
    pricing_engine = DynamicPricingModel()
    pricing_engine.train_model(db_path)
    
    if target_id:
        logger.info(f"Generating price recommendations for target {target_id}...")
        pricing_engine.generate_and_save_recommendations(target_id, days=30, db_path=db_path)
        
    # 6. Save execution status timestamps
    logger.info("Updating pipeline status timestamps...")
    set_pipeline_status_time(db_path, "last_update_total")
    set_pipeline_status_time(db_path, "last_update_prices")
    set_pipeline_status_time(db_path, "last_update_availability")
    set_pipeline_status_time(db_path, "last_update_reviews")
    set_pipeline_status_time(db_path, "last_update_competitors")
    
    logger.info("Daily AirMarket AI Pipeline Run completed successfully!")

if __name__ == "__main__":
    main()
