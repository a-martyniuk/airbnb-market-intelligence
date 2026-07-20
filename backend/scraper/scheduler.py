import os
import yaml
import json
import logging
from datetime import datetime
from typing import Dict, Any, List
from backend.scraper.real_scraper import RealAirbnbScraper

logger = logging.getLogger(__name__)

class ScrapingScheduler:
    """
    Coordinates and schedules scraping runs.
    Saves raw scraping outputs to a local file-based data lake (raw JSON files),
    maintaining historical data before ETL processing.
    """

    def __init__(self, settings_path: str = "config/settings.yaml"):
        with open(settings_path, 'r', encoding='utf-8') as f:
            self.settings = yaml.safe_load(f)

        self.mock_mode = False
        self.default_city = self.settings['scraper'].get('default_city', 'Buenos Aires')
        self.max_listings = self.settings['scraper'].get('max_listings_per_run', 50)
        
        logger.info("Initializing ScrapingScheduler in REAL mode.")
        self.scraper = RealAirbnbScraper(settings_path)

    def run_daily_scrape(self, city: str = None, run_date: str = None) -> str:
        """
        Runs the daily scrape sequence.
        1. Searches for listings in the target city.
        2. Retrieves details and a 30-day calendar for each listing.
        3. Saves all results into a single raw JSON package representing today's dump.
        
        Returns the path of the saved raw JSON file.
        """
        target_city = city or self.default_city
        today_str = run_date or datetime.now().strftime("%Y-%m-%d")
        
        logger.info(f"Starting daily scrape run for '{target_city}' on {today_str}...")
        
        try:
            # 1. Search listings
            listings = self.scraper.search_listings(target_city, limit=self.max_listings)
            logger.info(f"Found {len(listings)} listings to scrape.")
            
            # Load watchlist and target listing IDs to ensure they are always scraped
            watchlist_ids = []
            db_path = "database/airbnb_intelligence.db"
            if os.path.exists(db_path):
                import sqlite3
                try:
                    conn = sqlite3.connect(db_path)
                    cursor = conn.cursor()
                    cursor.execute("SELECT competitor_listing_id FROM competitor_watchlist")
                    watchlist_ids = [row[0] for row in cursor.fetchall()]
                    
                    # Also include configured target listings
                    cursor.execute("SELECT DISTINCT listing_id FROM listings WHERE host_id = 'user_host'")
                    watchlist_ids += [row[0] for row in cursor.fetchall()]
                    
                    conn.close()
                except Exception as db_err:
                    logger.warning(f"Could not load watchlist IDs for daily scrape: {db_err}")

            # Merge listing IDs ensuring no duplicates
            scraped_ids = set()
            listings_to_process = []
            
            for l in listings:
                l_id = str(l['listing_id'])
                if l_id not in scraped_ids:
                    scraped_ids.add(l_id)
                    listings_to_process.append(l_id)
                    
            for w_id in watchlist_ids:
                w_str = str(w_id)
                if w_str not in scraped_ids:
                    scraped_ids.add(w_str)
                    listings_to_process.append(w_str)

            logger.info(f"Consolidated listings to process (including watchlist): {len(listings_to_process)}")
            
            scraped_data = []
            
            # 2. Extract calendar and details for each listing
            for idx, listing_id in enumerate(listings_to_process):
                logger.info(f"[{idx+1}/{len(listings_to_process)}] Scraping calendar for listing {listing_id}...")
                
                try:
                    # Get listing details (to get any daily updates like reviews)
                    details = self.scraper.get_listing_details(listing_id)
                    # Get future availability calendar
                    calendar = self.scraper.get_listing_calendar(listing_id, days=30)
                    
                    scraped_data.append({
                        "listing": details,
                        "calendar": calendar,
                        "scraped_at": datetime.now().isoformat()
                    })
                except Exception as e:
                    logger.error(f"Failed to scrape details for listing {listing_id}: {str(e)}")
                    # Continue scraping other listings
                    continue
            
            # 3. Store raw dump in data lake
            output_dir = os.path.join("data", "raw", today_str)
            os.makedirs(output_dir, exist_ok=True)
            
            output_file = os.path.join(output_dir, f"scrape_{target_city.lower().replace(' ', '_')}.json")
            
            payload = {
                "metadata": {
                    "city": target_city,
                    "date": today_str,
                    "count": len(scraped_data),
                    "mock_mode": self.mock_mode,
                    "timestamp": datetime.now().isoformat()
                },
                "results": scraped_data
            }
            
            with open(output_file, 'w', encoding='utf-8') as f:
                json.dump(payload, f, indent=2, ensure_ascii=False)
                
            logger.info(f"Daily scrape run complete. Saved raw data to: {output_file}")
            return output_file

        except Exception as e:
            logger.error(f"Critical failure in scraping run: {str(e)}")
            raise e

    def run_watchlist_scrape(self, listing_ids: List[str], run_date: str = None) -> str:
        """
        Scrapes ONLY the specified listing IDs (e.g. target + watchlist competitors).
        Maintains the same JSON format output as run_daily_scrape for ETL compatibility.
        """
        from typing import List
        today_str = run_date or datetime.now().strftime("%Y-%m-%d")
        logger.info(f"Starting targeted watchlist scrape run for {len(listing_ids)} properties on {today_str}...")
        
        scraped_data = []
        for idx, listing_id in enumerate(listing_ids):
            logger.info(f"[{idx+1}/{len(listing_ids)}] Scraping watchlist property {listing_id}...")
            try:
                # Force fresh scrape of details and calendar
                details = self.scraper.get_listing_details(listing_id)
                calendar = self.scraper.get_listing_calendar(listing_id, days=30)
                scraped_data.append({
                    "listing": details,
                    "calendar": calendar,
                    "scraped_at": datetime.now().isoformat()
                })
            except Exception as e:
                logger.error(f"Failed to scrape details for watchlist listing {listing_id}: {str(e)}")
                continue

        # Save to a temporary raw folder for the ETL processing
        output_dir = os.path.join("data", "raw_temp")
        os.makedirs(output_dir, exist_ok=True)
        output_file = os.path.join(output_dir, f"scrape_{today_str}.json")
        
        payload = {
            "metadata": {
                "city": self.default_city,
                "date": today_str,
                "count": len(scraped_data),
                "mock_mode": self.mock_mode,
                "timestamp": datetime.now().isoformat()
            },
            "results": scraped_data
        }
        
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(payload, f, indent=2, ensure_ascii=False)
            
        logger.info(f"Watchlist scrape run complete. Saved raw data to: {output_file}")
        return output_file

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
    scheduler = ScrapingScheduler()
    scheduler.run_daily_scrape()
