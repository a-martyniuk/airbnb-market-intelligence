import os
import yaml
import json
import logging
from datetime import datetime, date, timedelta
from typing import Dict, Any, List, Optional
from fastapi import FastAPI, HTTPException, BackgroundTasks, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Manually load .env file if it exists (zero-dependency env loading for local dev)
if os.path.exists(".env"):
    with open(".env", "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                key, val = line.split("=", 1)
                os.environ[key.strip()] = val.strip()

from src.utils.db import get_connection, init_db
from src.scraper.scheduler import ScrapingScheduler
from src.etl.pipeline import ETLPipeline
from src.ml.pricing_model import DynamicPricingModel
from src.analytics.competitor import CompetitorAnalyzer

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

DB_PATH = os.getenv("DATABASE_PATH", "data/airbnb_intelligence.db")
# Ensure data directory exists if it's a nested path
db_dir = os.path.dirname(DB_PATH)
if db_dir:
    os.makedirs(db_dir, exist_ok=True)
init_db(DB_PATH)

import threading
import time

def run_pipeline_scheduler():
    logger.info("Background Scheduler: Active and running...")
    while True:
        # Run every 300 seconds (5 minutes)
        time.sleep(300)
        try:
            logger.info("Background Scheduler: Automatic daily scrape sequence triggered...")
            from src.scraper.scheduler import ScrapingScheduler
            from src.etl.pipeline import ETLPipeline
            from src.ml.pricing_model import DynamicPricingModel
            
            scheduler = ScrapingScheduler()
            raw_path = scheduler.run_daily_scrape()
            
            pipeline = ETLPipeline(DB_PATH)
            pipeline.process_raw_file(raw_path)
            
            pricing_engine = DynamicPricingModel()
            pricing_engine.train_model(DB_PATH)
            
            logger.info("Background Scheduler: Pipeline run completed successfully.")
        except Exception as e:
            logger.error(f"Background Scheduler Error: {str(e)}")

scheduler_thread = threading.Thread(target=run_pipeline_scheduler, daemon=True)
scheduler_thread.start()


app = FastAPI(
    title="Airbnb Market Intelligence API",
    description="API for Short-Term Rental Analytics & Dynamic Pricing",
    version="1.0.0"
)

# CORS configuration to enable Next.js frontend calls
allowed_origins_str = os.getenv("ALLOWED_ORIGINS", "*")
allowed_origins = [orig.strip().rstrip('/') for orig in allowed_origins_str.split(",") if orig.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class HydrationStatus(BaseModel):
    status: str
    message: str
    progress: float

# Global in-memory pipeline state
pipeline_state = {
    "status": "idle",
    "message": "Database ready",
    "progress": 0.0
}

def set_pipeline_status_time(key: str):
    conn = get_connection(DB_PATH)
    try:
        cursor = conn.cursor()
        now_str = datetime.now().isoformat()
        cursor.execute("""
            INSERT INTO pipeline_status (key, value, updated_at)
            VALUES (?, ?, CURRENT_TIMESTAMP)
            ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated_at=CURRENT_TIMESTAMP
        """, (key, now_str))
        conn.commit()
    except Exception as e:
        logger.error(f"Error setting pipeline status time for {key}: {str(e)}")
    finally:
        conn.close()

def get_pipeline_status_times() -> Dict[str, str]:
    conn = get_connection(DB_PATH)
    times = {}
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT key, value FROM pipeline_status")
        for row in cursor.fetchall():
            times[row[0]] = row[1]
    except Exception as e:
        logger.error(f"Error fetching pipeline status times: {str(e)}")
    finally:
        conn.close()
    return times

def bg_run_incremental_scrape(mode: str = "total"):
    global pipeline_state
    pipeline_state["status"] = "running"
    pipeline_state["message"] = f"Iniciando actualización en modo: {mode}..."
    pipeline_state["progress"] = 0.10
    
    try:
        scheduler = ScrapingScheduler()
        pipeline = ETLPipeline(DB_PATH)
        pricing_engine = DynamicPricingModel()
        
        # Load target settings
        settings_file = "config/target_settings.json"
        target_id = None
        target_neighborhood = "Palermo Hollywood"
        
        if os.path.exists(settings_file):
            with open(settings_file, "r", encoding="utf-8") as f:
                settings_data = json.load(f)
                target_id = settings_data.get("target_id")
                target_neighborhood = settings_data.get("details", {}).get("neighborhood", "Palermo Hollywood")

        # Get watchlist
        watchlist_ids = []
        if target_id:
            conn = get_connection(DB_PATH)
            cursor = conn.cursor()
            cursor.execute("SELECT competitor_listing_id FROM competitor_watchlist WHERE target_listing_id = ?", (target_id,))
            watchlist_ids = [row[0] for row in cursor.fetchall()]
            conn.close()

        # If watchlist is empty, force "total" mode to scrape neighborhood and build it
        if not watchlist_ids and mode in ("prices", "prices_availability"):
            logger.info("Watchlist empty, elevating mode to 'total' to build watchlist...")
            mode = "total"
            pipeline_state["message"] = "Watchlist vacía. Elevando a actualización total..."

        raw_file = None
        
        if mode in ("prices", "prices_availability"):
            # Fast targeted scrape of target listing + 20 watchlist competitors
            pipeline_state["message"] = f"Actualizando precios de propiedad objetivo y {len(watchlist_ids)} competidores..."
            pipeline_state["progress"] = 0.30
            
            listings_to_scrape = [target_id] + watchlist_ids if target_id else watchlist_ids
            # Filter out any None or empty values
            listings_to_scrape = [str(x) for x in listings_to_scrape if x]
            
            raw_file = scheduler.run_watchlist_scrape(listings_to_scrape)
            
            pipeline_state["message"] = "Procesando datos e insertando en base de datos..."
            pipeline_state["progress"] = 0.60
            pipeline.process_raw_file(raw_file)
            
            # Save timestamps
            set_pipeline_status_time("last_update_prices")
            if mode == "prices_availability":
                set_pipeline_status_time("last_update_availability")
            set_pipeline_status_time("last_update_reviews")
            
        else:
            # Full neighborhood search to find competitors
            pipeline_state["message"] = f"Buscando competidores en zona {target_neighborhood}..."
            pipeline_state["progress"] = 0.25
            
            raw_file = scheduler.run_daily_scrape(city="Buenos Aires")
            
            pipeline_state["message"] = "Ejecutando ETL en base de datos..."
            pipeline_state["progress"] = 0.50
            pipeline.process_raw_file(raw_file)
            
            # Compute/refresh watchlist competitors
            if target_id:
                pipeline_state["message"] = "Calculando watchlist de competidores (k-NN)..."
                pipeline_state["progress"] = 0.70
                
                analyzer = CompetitorAnalyzer()
                # Run competitor resolution (re-calculates similar listings)
                competitors = analyzer.find_competitors(target_id, db_path=DB_PATH)
                
                conn = get_connection(DB_PATH)
                cursor = conn.cursor()
                # Clear old watchlist entries
                cursor.execute("DELETE FROM competitor_watchlist WHERE target_listing_id = ?", (target_id,))
                for comp in competitors:
                    cursor.execute("""
                        INSERT INTO competitor_watchlist (target_listing_id, competitor_listing_id)
                        VALUES (?, ?)
                    """, (target_id, comp["listing_id"]))
                conn.commit()
                conn.close()
                logger.info(f"Watchlist updated for target {target_id} with {len(competitors)} competitors.")
            
            set_pipeline_status_time("last_update_competitors")
            set_pipeline_status_time("last_update_prices")
            set_pipeline_status_time("last_update_availability")
            set_pipeline_status_time("last_update_reviews")
            set_pipeline_status_time("last_update_total")

        # 3. Retrain and generate recommendations
        pipeline_state["message"] = "Re-entrenando modelo de precios dinámicos..."
        pipeline_state["progress"] = 0.85
        pricing_engine.train_model(DB_PATH)
        
        if target_id:
            pricing_engine.generate_and_save_recommendations(target_id, days=30, db_path=DB_PATH)
            
        pipeline_state["status"] = "success"
        pipeline_state["message"] = f"Actualización finalizada con éxito (Modo: {mode})."
        pipeline_state["progress"] = 1.0
        
        # Synchronize updated database and target settings back to GitHub
        try:
            from src.utils.git_db import sync_to_github
            sync_to_github([DB_PATH, "config/target_settings.json"])
        except Exception as sync_err:
            logger.error(f"Failed to sync database to GitHub in background task: {str(sync_err)}")
        
    except Exception as e:
        logger.error(f"Incremental pipeline failed for mode {mode}: {str(e)}")
        pipeline_state["status"] = "error"
        pipeline_state["message"] = f"Fallo en actualización: {str(e)}"
        pipeline_state["progress"] = 0.0

# ==================== ENDPOINTS ====================

@app.get("/api/pipeline/status")
def get_pipeline_status():
    """Returns database sizes and current background hydration process status."""
    today_str = datetime.now().strftime("%Y-%m-%d")
    conn = get_connection(DB_PATH)
    cursor = conn.cursor()
    
    try:
        cursor.execute("SELECT COUNT(*) FROM listings")
        cnt_list = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM listings_daily")
        cnt_daily = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM calendar_snapshots")
        cnt_cal = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM booking_events")
        cnt_book = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM price_recommendations")
        cnt_recs = cursor.fetchone()[0]
        
        cursor.execute("SELECT MAX(snapshot_date) FROM listings_daily")
        max_date = cursor.fetchone()[0]
    except Exception as e:
        logger.error(f"Database statistics fetch failed: {str(e)}")
        cnt_list = cnt_daily = cnt_cal = cnt_book = cnt_recs = 0
        max_date = today_str
    finally:
        conn.close()

    status_times = get_pipeline_status_times()

    return {
        "database": {
            "listings_count": cnt_list,
            "listings_daily_count": cnt_daily,
            "calendar_snapshots_count": cnt_cal,
            "booking_events_count": cnt_book,
            "price_recommendations_count": cnt_recs,
            "is_empty": cnt_list == 0,
            "last_scraped_at": max_date if max_date else today_str
        },
        "hydration_job": pipeline_state,
        "timestamps": {
            "last_update_prices": status_times.get("last_update_prices"),
            "last_update_availability": status_times.get("last_update_availability"),
            "last_update_reviews": status_times.get("last_update_reviews"),
            "last_update_competitors": status_times.get("last_update_competitors"),
            "last_update_total": status_times.get("last_update_total")
        },
        "scheduler": {
            "status": "active",
            "interval_seconds": 300,
            "next_run_seconds": 300 - int(time.time() % 300)
        }
    }

class UpdateRequest(BaseModel):
    mode: str  # "prices", "prices_availability", "competitors", "total"

@app.post("/api/pipeline/update")
def trigger_incremental_update(payload: UpdateRequest, background_tasks: BackgroundTasks):
    global pipeline_state
    if pipeline_state["status"] == "running":
        return {"message": "A scrape job is already running.", "status": pipeline_state}
        
    mode = payload.mode
    if mode not in ("prices", "prices_availability", "competitors", "total"):
        raise HTTPException(status_code=400, detail="Invalid update mode")
        
    pipeline_state = {
        "status": "starting",
        "message": f"Iniciando actualización ({mode})...",
        "progress": 0.0
    }
    background_tasks.add_task(bg_run_incremental_scrape, mode)
    return {"message": f"Update sequence in mode '{mode}' triggered successfully", "status": pipeline_state}

@app.post("/api/pipeline/hydrate")
def trigger_live_scrape(background_tasks: BackgroundTasks):
    """Legacy endpoint - triggers total run in background."""
    global pipeline_state
    if pipeline_state["status"] == "running":
        return {"message": "A scrape job is already running.", "status": pipeline_state}
        
    pipeline_state = {
        "status": "starting",
        "message": "Initializing live Airbnb scrape...",
        "progress": 0.0
    }
    background_tasks.add_task(bg_run_incremental_scrape, "total")
    return {"message": "Live scrape sequence triggered successfully", "status": pipeline_state}

@app.get("/api/market/kpis")
def get_market_kpis():
    """Retrieves aggregated KPIs of the market for the latest daily snapshot."""
    conn = get_connection(DB_PATH)
    cursor = conn.cursor()
    
    try:
        # Check latest date
        cursor.execute("SELECT MAX(snapshot_date) FROM listings_daily")
        latest_date = cursor.fetchone()[0]
        if not latest_date:
            return {"total_listings": 0, "avg_price": 0.0, "avg_occupancy": 0.0, "price_delta": "", "occ_delta": ""}

        # Current KPIs
        cursor.execute("""
        SELECT COUNT(listing_id), AVG(price), AVG(estimated_occupancy_rate_30d)
        FROM listings_daily WHERE snapshot_date = ?
        """, (latest_date,))
        kpis = cursor.fetchone()
        
        # Previous Day KPIs
        prev_date = datetime.strptime(latest_date, "%Y-%m-%d").date() - timedelta(days=1)
        cursor.execute("""
        SELECT AVG(price), AVG(estimated_occupancy_rate_30d)
        FROM listings_daily WHERE snapshot_date = ?
        """, (prev_date.strftime("%Y-%m-%d"),))
        prev_kpis = cursor.fetchone()
        
        price_delta = ""
        occ_delta = ""
        if prev_kpis and prev_kpis[0] and prev_kpis[1]:
            p_chg = ((kpis[1] - prev_kpis[0]) / prev_kpis[0]) * 100
            o_chg = ((kpis[2] - prev_kpis[1]) / prev_kpis[1]) * 100
            price_delta = f"{p_chg:+.1f}% vs yesterday"
            occ_delta = f"{o_chg:+.1f}% vs yesterday"

        return {
            "total_listings": kpis[0] or 0,
            "avg_price": round(kpis[1] or 0.0, 2),
            "avg_occupancy": round((kpis[2] or 0.0) * 100, 1),
            "price_delta": price_delta,
            "occ_delta": occ_delta,
            "latest_date": latest_date
        }
    except Exception as e:
        logger.error(f"Error fetching KPIs: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@app.get("/api/market/listings")
def get_market_listings():
    """Returns listings metadata and daily snapshots for mapping."""
    conn = get_connection(DB_PATH)
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT MAX(snapshot_date) FROM listings_daily")
        latest_date = cursor.fetchone()[0]
        if not latest_date:
            return []

        cursor.execute("""
        SELECT 
            l.listing_id, l.title, l.latitude, l.longitude, l.neighborhood, 
            l.bedrooms, l.bathrooms, l.accommodates, l.rating, l.reviews_count, 
            ld.price, ld.estimated_occupancy_rate_30d
        FROM listings l
        JOIN listings_daily ld ON l.listing_id = ld.listing_id
        WHERE ld.snapshot_date = ?
        """, (latest_date,))
        rows = cursor.fetchall()
        
        listings = []
        for r in rows:
            listings.append({
                "listing_id": r[0],
                "title": r[1],
                "latitude": r[2],
                "longitude": r[3],
                "neighborhood": r[4],
                "bedrooms": r[5],
                "bathrooms": r[6],
                "accommodates": r[7],
                "rating": r[8],
                "reviews_count": r[9],
                "price": r[10],
                "estimated_occupancy_rate_30d": round(r[11] * 100, 1)
            })
        return listings
    except Exception as e:
        logger.error(f"Error fetching listings map: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@app.get("/api/market/neighborhoods")
def get_neighborhoods_summary():
    """Aggregates price and occupancy levels by neighborhood."""
    conn = get_connection(DB_PATH)
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT MAX(snapshot_date) FROM listings_daily")
        latest_date = cursor.fetchone()[0]
        if not latest_date:
            return []

        cursor.execute("""
        SELECT 
            l.neighborhood, 
            AVG(ld.price) as avg_price, 
            AVG(ld.estimated_occupancy_rate_30d) as avg_occupancy,
            COUNT(l.listing_id) as count
        FROM listings l
        JOIN listings_daily ld ON l.listing_id = ld.listing_id
        WHERE ld.snapshot_date = ?
        GROUP BY l.neighborhood
        ORDER BY avg_occupancy DESC
        """, (latest_date,))
        rows = cursor.fetchall()
        
        neighs = []
        for r in rows:
            neighs.append({
                "neighborhood": r[0],
                "avg_price": round(r[1] or 0.0, 2),
                "avg_occupancy": round((r[2] or 0.0) * 100, 1),
                "count": r[3]
            })
        return neighs
    except Exception as e:
        logger.error(f"Error fetching neighborhood averages: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@app.get("/api/market/history")
def get_market_history(neighborhood: str = "Palermo Hollywood"):
    """Returns daily average price, average occupancy, and active competitor counts over time for a given neighborhood."""
    conn = get_connection(DB_PATH)
    try:
        cursor = conn.cursor()
        cursor.execute("""
        SELECT 
            ld.snapshot_date,
            AVG(ld.price) as avg_price,
            AVG(ld.estimated_occupancy_rate_30d) as avg_occupancy,
            COUNT(DISTINCT ld.listing_id) as active_listings
        FROM listings_daily ld
        JOIN listings l ON ld.listing_id = l.listing_id
        WHERE l.neighborhood = ?
        GROUP BY ld.snapshot_date
        ORDER BY ld.snapshot_date ASC
        """, (neighborhood,))
        rows = cursor.fetchall()
        
        history = []
        for r in rows:
            history.append({
                "date": r[0],
                "avg_price": round(r[1] or 0.0, 2),
                "avg_occupancy": round((r[2] or 0.0) * 100, 1),
                "active_listings": r[3]
            })
        return history
    except Exception as e:
        logger.error(f"Error fetching market history: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@app.get("/api/listings/{listing_id}")
def get_listing_details(listing_id: str):
    """Retrieves specific listing parameters, booking statistics, and historical performance."""
    conn = get_connection(DB_PATH)
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM listings WHERE listing_id = ?", (listing_id,))
        listing = cursor.fetchone()
        if not listing:
            raise HTTPException(status_code=404, detail="Listing not found")
            
        cursor.execute("""
        SELECT price, estimated_occupancy_rate_30d,
               weekend_price, weekly_discount, monthly_discount, early_bird_discount, last_minute_discount,
               cleaning_fee, minimum_stay, maximum_stay, instant_book, cancellation_policy
        FROM listings_daily 
        WHERE listing_id = ? 
        ORDER BY snapshot_date DESC LIMIT 1
        """, (listing_id,))
        daily = cursor.fetchone()
        
        cursor.execute("""
        SELECT COUNT(*), SUM(price_sold) 
        FROM booking_events WHERE listing_id = ?
        """, (listing_id,))
        bookings = cursor.fetchone()

        return {
            "listing_id": listing["listing_id"],
            "title": listing["title"],
            "property_type": listing["property_type"],
            "room_type": listing["room_type"],
            "accommodates": listing["accommodates"],
            "bedrooms": listing["bedrooms"],
            "bathrooms": listing["bathrooms"],
            "latitude": listing["latitude"],
            "longitude": listing["longitude"],
            "neighborhood": listing["neighborhood"],
            "rating": listing["rating"],
            "reviews_count": listing["reviews_count"],
            "host_name": listing["host_name"],
            "host_is_superhost": bool(listing["host_is_superhost"]),
            "amenities": json.loads(listing["amenities"]) if listing["amenities"] else [],
            "picture_url": listing["picture_url"] if "picture_url" in listing.keys() else None,
            "price": daily["price"] if daily else 0.0,
            "estimated_occupancy_rate_30d": round(daily["estimated_occupancy_rate_30d"] * 100, 1) if daily and daily["estimated_occupancy_rate_30d"] else 0.0,
            "weekend_price": daily["weekend_price"] if daily else None,
            "weekly_discount": daily["weekly_discount"] if daily else None,
            "monthly_discount": daily["monthly_discount"] if daily else None,
            "early_bird_discount": daily["early_bird_discount"] if daily else None,
            "last_minute_discount": daily["last_minute_discount"] if daily else None,
            "cleaning_fee": daily["cleaning_fee"] if daily else None,
            "minimum_stay": daily["minimum_stay"] if daily else None,
            "maximum_stay": daily["maximum_stay"] if daily else None,
            "instant_book": bool(daily["instant_book"]) if daily and daily["instant_book"] is not None else None,
            "cancellation_policy": daily["cancellation_policy"] if daily else None,
            "simulated_bookings_count": bookings[0] or 0,
            "simulated_revenue": round(bookings[1] or 0.0, 2)
        }
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Error fetching listing details: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@app.get("/api/listings/{listing_id}/competitors")
def get_listing_competitors(listing_id: str):
    """Computes k-NN competitors and returns radar-comparison features."""
    try:
        # Check target listing exists
        details = get_listing_details(listing_id)
        
        analyzer = CompetitorAnalyzer()
        competitors = analyzer.find_competitors(listing_id, DB_PATH)
        return {
            "target": details,
            "competitors": competitors
        }
    except ValueError as ve:
        raise HTTPException(status_code=404, detail=str(ve))
    except Exception as e:
        logger.error(f"Error fetching competitor cluster: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/listings/{listing_id}/recommendations")
def get_listing_price_recommendations(listing_id: str):
    """Retrieves 30-day recommended price trajectory vs quoted pricing and competitor bounds."""
    conn = get_connection(DB_PATH)
    try:
        cursor = conn.cursor()
        # Find competitors to match average daily trend
        analyzer = CompetitorAnalyzer()
        try:
            competitors = analyzer.find_competitors(listing_id, DB_PATH)
            comp_ids = [c['listing_id'] for c in competitors]
        except Exception:
            comp_ids = []
            
        query = """
        SELECT 
            pr.date, 
            pr.recommended_price, 
            pr.confidence_score, 
            pr.features, 
            cs.price as current_price
        FROM price_recommendations pr
        JOIN calendar_snapshots cs ON pr.listing_id = cs.listing_id 
            AND pr.date = cs.date 
            AND cs.snapshot_date = (SELECT MAX(snapshot_date) FROM calendar_snapshots WHERE listing_id = pr.listing_id)
        WHERE pr.listing_id = ?
        ORDER BY pr.date ASC
        """
        cursor.execute(query, (listing_id,))
        rows = cursor.fetchall()
        
        recs = []
        for r in rows:
            d_str = r[0]
            rec_price = r[1]
            conf = r[2]
            feats = json.loads(r[3])
            curr_price = r[4]
            
            # Fetch competitor average for this specific date
            comp_avg = None
            if comp_ids:
                placeholders = ",".join("?" for _ in comp_ids)
                cursor.execute(f"""
                SELECT AVG(price) FROM calendar_snapshots cs
                WHERE listing_id IN ({placeholders}) AND date = ? 
                  AND snapshot_date = (SELECT MAX(snapshot_date) FROM calendar_snapshots WHERE listing_id = cs.listing_id)
                """, (*comp_ids, d_str))
                comp_avg = cursor.fetchone()[0]
                
            recs.append({
                "date": d_str,
                "recommended_price": rec_price,
                "confidence_score": round(conf * 100, 1),
                "current_price": curr_price,
                "competitor_avg": round(comp_avg, 2) if comp_avg else rec_price,
                "features": feats
            })
        return recs
    except Exception as e:
        logger.error(f"Error fetching price recommendations: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@app.get("/api/pipeline/scraped-sources")
def get_scraped_sources():
    """Returns the list of scraped property details, their extracted characteristics, and the scrape date."""
    conn = get_connection(DB_PATH)
    try:
        cursor = conn.cursor()
        # Find latest snapshot dates and listing characteristics
        cursor.execute("""
        SELECT 
            l.listing_id, 
            l.title, 
            l.property_type,
            l.room_type,
            l.accommodates,
            l.bedrooms,
            l.bathrooms,
            l.neighborhood,
            l.rating,
            l.reviews_count,
            l.host_name,
            l.host_is_superhost,
            ld.price,
            ld.snapshot_date,
            l.amenities
        FROM listings l
        JOIN listings_daily ld ON l.listing_id = ld.listing_id
        WHERE ld.snapshot_date = (SELECT MAX(snapshot_date) FROM listings_daily WHERE listing_id = l.listing_id)
        ORDER BY l.title ASC
        """)
        rows = cursor.fetchall()
        
        sources = []
        for r in rows:
            l_id = r["listing_id"]
            try:
                amenities_list = json.loads(r["amenities"]) if r["amenities"] else []
            except Exception:
                amenities_list = []
            sources.append({
                "listing_id": l_id,
                "url": f"https://www.airbnb.com/rooms/{l_id}",
                "title": r["title"],
                "property_type": r["property_type"],
                "room_type": r["room_type"],
                "accommodates": r["accommodates"],
                "bedrooms": r["bedrooms"],
                "bathrooms": r["bathrooms"],
                "neighborhood": r["neighborhood"],
                "rating": r["rating"],
                "reviews_count": r["reviews_count"],
                "host_name": r["host_name"],
                "host_is_superhost": bool(r["host_is_superhost"]),
                "price": r["price"],
                "last_extracted": r["snapshot_date"],
                "amenities": amenities_list
            })
        return sources
    except Exception as e:
        logger.error(f"Error fetching scraped sources: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@app.get("/api/settings/rules")
def get_pricing_rules():
    """Reads and returns the current pricing rules from settings.yaml."""
    try:
        with open("config/settings.yaml", "r", encoding="utf-8") as f:
            settings = yaml.safe_load(f)
        return settings.get("pricing_model", {})
    except Exception as e:
        logger.error(f"Error reading settings: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to read settings: {str(e)}")

class RulesUpdate(BaseModel):
    weekend_premium: float
    high_season_premium: float
    holiday_premium: float
    last_minute_discount: float
    cleaning_fee: float = 15.0
    average_stay_days: int = 3

@app.post("/api/settings/rules")
def update_pricing_rules(payload: RulesUpdate, background_tasks: BackgroundTasks):
    """Updates pricing rules in settings.yaml and regenerates recommendations in SQLite."""
    try:
        # 1. Read existing config
        with open("config/settings.yaml", "r", encoding="utf-8") as f:
            settings = yaml.safe_load(f)
            
        if "pricing_model" not in settings:
            settings["pricing_model"] = {}
            
        # 2. Update config keys
        settings["pricing_model"]["weekend_premium"] = payload.weekend_premium
        settings["pricing_model"]["high_season_premium"] = payload.high_season_premium
        settings["pricing_model"]["holiday_premium"] = payload.holiday_premium
        settings["pricing_model"]["last_minute_discount"] = payload.last_minute_discount
        settings["pricing_model"]["cleaning_fee"] = payload.cleaning_fee
        settings["pricing_model"]["average_stay_days"] = payload.average_stay_days
        
        # 3. Write back to file
        with open("config/settings.yaml", "w", encoding="utf-8") as f:
            yaml.safe_dump(settings, f, default_flow_style=False, allow_unicode=True)
            
        # 4. Trigger ML Pricing model recalculation
        pricing_engine = DynamicPricingModel()
        pricing_engine.train_model(DB_PATH) # Re-train ML model with new configs
        
        conn = get_connection(DB_PATH)
        cursor = conn.cursor()
        cursor.execute("SELECT listing_id FROM listings")
        listing_ids = [row[0] for row in cursor.fetchall()]
        conn.close()
        
        # Regenerate calendar recommendations for all active listings
        for l_id in listing_ids:
            pricing_engine.generate_and_save_recommendations(l_id, days=30, db_path=DB_PATH)
            
        # Sync updated config and database to GitHub
        from src.utils.git_db import sync_to_github
        background_tasks.add_task(sync_to_github, [DB_PATH, "config/settings.yaml"])
        
        return {"status": "success", "message": "Pricing rules updated and database price recommendations recalculated!"}
        
    except Exception as e:
        logger.error(f"Error updating settings: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to update settings: {str(e)}")
class OverridePayload(BaseModel):
    date: str
    price: float

class ResetPayload(BaseModel):
    date: str

@app.post("/api/listings/{listing_id}/recommendations/override")
def save_price_override(listing_id: str, payload: OverridePayload, background_tasks: BackgroundTasks):
    """Saves a manual price override for a specific listing and date."""
    conn = get_connection(DB_PATH)
    try:
        cursor = conn.cursor()
        # 1. Fetch current features JSON to insert is_override flag
        cursor.execute("SELECT features, recommended_price FROM price_recommendations WHERE listing_id = ? AND date = ?", (listing_id, payload.date))
        row = cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="No recommendation found for this date. Hydrate first.")
        
        features_dict = json.loads(row[0]) if row[0] else {}
        # Save original recommendation if not already saved
        if "original_price" not in features_dict:
            features_dict["original_price"] = row[1]
        
        features_dict["is_override"] = True
        
        # 2. Update price in DB
        cursor.execute("""
        UPDATE price_recommendations
        SET recommended_price = ?, confidence_score = 1.0, features = ?
        WHERE listing_id = ? AND date = ?
        """, (payload.price, json.dumps(features_dict), listing_id, payload.date))
        conn.commit()
        # Sync updated database to GitHub
        from src.utils.git_db import sync_to_github
        background_tasks.add_task(sync_to_github, [DB_PATH])
        
        return {"status": "success", "message": f"Saved manual price override of ${payload.price} for {payload.date}."}
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Error overriding price: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@app.post("/api/listings/{listing_id}/recommendations/reset")
def reset_price_override(listing_id: str, payload: ResetPayload, background_tasks: BackgroundTasks):
    """Resets a manual price override, restoring the original AI recommendation."""
    conn = get_connection(DB_PATH)
    try:
        cursor = conn.cursor()
        # 1. Fetch current features
        cursor.execute("SELECT features FROM price_recommendations WHERE listing_id = ? AND date = ?", (listing_id, payload.date))
        row = cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="No recommendation found for this date.")
        
        features_dict = json.loads(row[0]) if row[0] else {}
        if "is_override" in features_dict:
            original_price = features_dict.pop("original_price", None)
            features_dict.pop("is_override", None)
            
            if original_price is None:
                # Re-calculate recommendation from scratch if original was missing
                pricing_engine = DynamicPricingModel()
                pricing_engine.train_model(DB_PATH)
                original_price, _, _ = pricing_engine.recommend_price(listing_id, datetime.strptime(payload.date, "%Y-%m-%d").date(), DB_PATH)
            
            cursor.execute("""
            UPDATE price_recommendations
            SET recommended_price = ?, confidence_score = 0.85, features = ?
            WHERE listing_id = ? AND date = ?
            """, (original_price, json.dumps(features_dict), listing_id, payload.date))
            conn.commit()
            # Sync updated database to GitHub
            from src.utils.git_db import sync_to_github
            background_tasks.add_task(sync_to_github, [DB_PATH])
            
            return {"status": "success", "message": f"Reset price to AI recommended rate of ${original_price:.2f}."}
        
        return {"status": "success", "message": "Price was not overridden."}
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Error resetting price override: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@app.post("/api/query")
def execute_custom_query(payload: Dict[str, str]):
    """Executes a custom SQL query (read-only enforcement)."""
    sql = payload.get("query", "").strip()
    if not sql:
        return {"error": "Query is empty"}
        
    if not sql.lower().startswith("select"):
        return {"error": "Only SELECT (read-only) queries are allowed."}

    conn = get_connection(DB_PATH)
    try:
        import pandas as pd
        df = pd.read_sql_query(sql, conn)
        # Convert DataFrame to records dict
        records = df.to_dict(orient="records")
        return {"columns": list(df.columns), "records": records}
    except Exception as e:
        return {"error": str(e)}
    finally:
        conn.close()

def get_target_scraped_values(target_id: str) -> Dict[str, Any]:
    scraped = {
        "cleaning_fee": None,
        "weekly_discount": None,
        "monthly_discount": None,
        "early_bird_discount": None,
        "last_minute_discount": None,
        "weekend_multiplier": None,
        "minimum_stay": None,
        "maximum_stay": None
    }
    if not target_id:
        return scraped
    conn = get_connection(DB_PATH)
    try:
        cursor = conn.cursor()
        cursor.execute("""
        SELECT price, weekend_price, weekly_discount, monthly_discount, early_bird_discount, last_minute_discount,
               cleaning_fee, minimum_stay, maximum_stay
        FROM listings_daily
        WHERE listing_id = ?
        ORDER BY snapshot_date DESC LIMIT 1
        """, (target_id,))
        row = cursor.fetchone()
        if row:
            scraped["cleaning_fee"] = row["cleaning_fee"]
            scraped["weekly_discount"] = row["weekly_discount"]
            scraped["monthly_discount"] = row["monthly_discount"]
            scraped["early_bird_discount"] = row["early_bird_discount"]
            scraped["last_minute_discount"] = row["last_minute_discount"]
            scraped["minimum_stay"] = row["minimum_stay"]
            scraped["maximum_stay"] = row["maximum_stay"]
            
            if row["weekend_price"] is not None and row["price"] is not None and row["price"] > 0:
                scraped["weekend_multiplier"] = round(row["weekend_price"] / row["price"], 2)
            else:
                scraped["weekend_multiplier"] = None
    except Exception as e:
        logger.error(f"Error fetching target scraped values: {str(e)}")
    finally:
        conn.close()
    return scraped

def get_default_pricing_rules() -> Dict[str, Any]:
    try:
        with open("config/settings.yaml", "r", encoding="utf-8") as f:
            settings = yaml.safe_load(f)
        pricing_model = settings.get("pricing_model", {})
    except Exception:
        pricing_model = {}
        
    lm_factor = pricing_model.get("last_minute_discount", 0.85)
    lm_discount = round((1 - lm_factor) * 100, 1) if lm_factor < 1 else 0.0
    
    return {
        "cleaning_fee": pricing_model.get("cleaning_fee", 15.0),
        "weekly_discount": 0.0,
        "monthly_discount": 0.0,
        "early_bird_discount": 0.0,
        "last_minute_discount": lm_discount,
        "weekend_multiplier": pricing_model.get("weekend_premium", 1.15),
        "minimum_stay": pricing_model.get("average_stay_days", 3),
        "maximum_stay": 365.0
    }

def resolve_pricing_configuration(target_id: str, settings_data: Dict[str, Any]) -> Dict[str, Any]:
    scraped = get_target_scraped_values(target_id)
    defaults = get_default_pricing_rules()
    
    pricing_overrides = settings_data.get("pricing_overrides", {})
    manual_override_flags = settings_data.get("manual_override_flags", {})
    
    resolved = {}
    sources = {}
    
    keys = ["cleaning_fee", "weekly_discount", "monthly_discount", "early_bird_discount", "last_minute_discount", "weekend_multiplier", "minimum_stay", "maximum_stay"]
    
    for k in keys:
        scraped_val = scraped.get(k)
        manual_val = pricing_overrides.get(k)
        flag = bool(manual_override_flags.get(k, False))
        default_val = defaults.get(k)
        
        if flag:
            val = manual_val if manual_val is not None else default_val
            src = "Manual Override"
        elif scraped_val is not None:
            val = scraped_val
            src = "Scraped"
        elif manual_val is not None:
            val = manual_val
            src = "Manual Override"
        else:
            val = default_val
            src = "Default Rule"
            
        resolved[k] = val
        sources[k] = src
        
    return {
        "pricing_overrides": pricing_overrides,
        "manual_override_flags": manual_override_flags,
        "pricing_scraped": scraped,
        "pricing_defaults": defaults,
        "pricing_resolved": resolved,
        "pricing_sources": sources
    }

# Settings endpoints for target listing
@app.get("/api/settings/target")
def get_target_listing_settings():
    settings_file = "config/target_settings.json"
    settings_data = {"target_url": "", "target_id": "", "details": None}
    if os.path.exists(settings_file):
        with open(settings_file, "r", encoding="utf-8") as f:
            try:
                settings_data = json.load(f)
            except Exception:
                pass
    
    target_id = settings_data.get("target_id")
    resolved_info = resolve_pricing_configuration(target_id, settings_data)
    settings_data.update(resolved_info)
    return settings_data

@app.post("/api/settings/target/resolve")
def resolve_target_listing_url(payload: Dict[str, str]):
    url = payload.get("url", "").strip()
    if not url:
        raise HTTPException(status_code=400, detail="URL is empty")
        
    import requests
    from bs4 import BeautifulSoup
    import re
    
    if not url.startswith("http://") and not url.startswith("https://"):
        url = "https://" + url
        
    headers = {
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
        "Accept-Language": "es-AR,es;q=0.9,en;q=0.8",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Referer": "https://www.airbnb.com.ar/"
    }
    
    try:
        response = requests.get(url, headers=headers, allow_redirects=True, timeout=15)
        final_url = response.url
        
        match = re.search(r'/rooms/(\d+)', final_url)
        if not match:
            room_match = re.search(r'rooms/(\d+)', response.text)
            if room_match:
                listing_id = room_match.group(1)
            else:
                raise ValueError("Could not extract Airbnb room ID from resolved URL.")
        else:
            listing_id = match.group(1)
            
        soup = BeautifulSoup(response.text, 'html.parser')
        
        title_text = None
        accommodates = 2
        bedrooms = 1
        bathrooms = 1.0
        neighborhood = "Palermo Hollywood"
        price = 105.0
        rating = None
        reviews_count = None
        latitude = None
        longitude = None
        
        # 1. Parse JSON-LD structured data if available
        for s in soup.find_all('script', type='application/ld+json'):
            try:
                if not s.string: continue
                js_data = json.loads(s.string)
                items = js_data if isinstance(js_data, list) else [js_data]
                for item in items:
                    if "name" in item and item.get("@type") in ("Product", "Accommodation", "LodgingBusiness"):
                        title_text = item["name"]
                    if "aggregateRating" in item:
                        agg = item["aggregateRating"]
                        if "ratingValue" in agg:
                            rating = float(agg["ratingValue"])
                        if "reviewCount" in agg:
                            reviews_count = int(agg["reviewCount"])
                    if "geo" in item:
                        geo = item["geo"]
                        if "latitude" in geo and "longitude" in geo:
                            latitude = float(geo["latitude"])
                            longitude = float(geo["longitude"])
            except Exception:
                continue
                
        # 2. Heuristic clean title parsing
        # Sometimes Airbnb swaps og:title and og:description or puts the clean title in og:description
        meta_desc = soup.find('meta', property='og:description')
        desc_text = meta_desc['content'] if (meta_desc and meta_desc.get('content')) else ""
        
        if desc_text and not any(p in desc_text.lower() for p in ["guest", "bedroom", "bath", "bed", "huésped", "dormitorio", "cama", "baño"]):
            title_text = desc_text
            
        if not title_text:
            # Check HTML title tag
            if soup.title and soup.title.string:
                t_str = soup.title.string
                # split off standard trailing description suffixes
                for sep in [" - Departamentos", " - Apartments", " - Flats", " - Casas", " - Airbnb", " | Airbnb", " - Rooms"]:
                    if sep in t_str:
                        t_str = t_str.split(sep)[0].strip()
                title_text = t_str
                
        if not title_text:
            # Prioritize twitter:title as it contains the clean listing title, fallback to og:title
            twitter_title = soup.find('meta', attrs={'name': 'twitter:title'}) or soup.find('meta', property='twitter:title')
            if twitter_title and twitter_title.get('content'):
                title_text = twitter_title['content'].split(" - ")[0].strip()
            else:
                meta_title = soup.find('meta', property='og:title')
                if meta_title and meta_title.get('content'):
                    title_text = meta_title['content'].split(" - ")[0].strip()
            
        if desc_text:
            guest_match = re.search(r'(\d+)\s+guest', desc_text)
            bed_match = re.search(r'(\d+)\s+bedroom', desc_text)
            bath_match = re.search(r'(\d+(?:\.\d+)?)\s+bath', desc_text)
            
            if guest_match: accommodates = int(guest_match.group(1))
            if bed_match: bedrooms = int(bed_match.group(1))
            if bath_match: bathrooms = float(bath_match.group(1))
            
        if not title_text or title_text == "Airbnb":
            title_text = f"Airbnb Room {listing_id}"
            
        # Heuristic amenities parsing
        mapping = {
            "Wifi": ['wifi', 'wi-fi', 'internet'],
            "Air conditioning": ['air conditioning', 'aire acondicionado', 'split', 'SYSTEM_AC', 'ac_unit'],
            "Cocina": ['kitchen', 'cocina', 'SYSTEM_KITCHEN'],
            "Lavarropas": ['washer', 'laundry', 'lavarropas', 'lavadora', 'SYSTEM_WASHER'],
            "Parking": ['cochera', 'garaje', 'estacionamiento gratuito en las instalaciones', 'estacionamiento gratis en las instalaciones', 'free parking on premises', 'SYSTEM_PARKING', 'SYSTEM_PAID_PARKING'],
            "Pool": ['pool', 'pileta', 'piscina', 'SYSTEM_POOL'],
            "Jacuzzi": ['jacuzzi', 'hot tub', 'hidromasaje', 'SYSTEM_HOT_TUB'],
            "Gym": ['gym', 'gimnasio', 'SYSTEM_GYM'],
            "Workspace": ['workspace', 'espacio de trabajo', 'escritorio', 'laptop-friendly', 'SYSTEM_OFFICE_EQUIPMENT'],
            "Check-in autónomo": ['self check-in', 'check-in autónomo', 'llegada autónoma', 'cerradura inteligente', 'SYSTEM_SELF_CHECK_IN']
        }
        detected_amenities = []
        for name, terms in mapping.items():
            for term in terms:
                if re.search(re.escape(term), response.text, re.IGNORECASE):
                    detected_amenities.append(name)
                    break

        is_superhost = 0
        if "superhost" in response.text.lower() or "isSuperhost" in response.text:
            is_superhost = 1

        return {
            "status": "success",
            "target_url": url,
            "target_id": listing_id,
            "details": {
                "listing_id": listing_id,
                "title": title_text,
                "accommodates": accommodates,
                "bedrooms": bedrooms,
                "bathrooms": bathrooms,
                "latitude": latitude if latitude is not None else -34.58752,
                "longitude": longitude if longitude is not None else -58.43966,
                "neighborhood": neighborhood,
                "price": price,
                "rating": rating if rating is not None else 5.0,
                "reviews_count": reviews_count if reviews_count is not None else 0,
                "host_is_superhost": is_superhost,
                "amenities": detected_amenities
            }
        }
    except Exception as e:
        logger.error(f"Error resolving target URL: {str(e)}")
        digits = re.findall(r'\d+', url)
        listing_id = digits[0] if digits else "target_listing"
        
        return {
            "status": "partial",
            "message": f"Could not resolve Airbnb URL: {str(e)}. Please check for spelling typos (e.g. check if you wrote 'cordoba557' instead of 'cordoba5579') or check/fill in the details manually below.",
            "target_url": url,
            "target_id": listing_id,
            "details": {
                "listing_id": listing_id,
                "title": "Apartment at Córdoba 5579",
                "accommodates": 2,
                "bedrooms": 1,
                "bathrooms": 1.0,
                "neighborhood": "Palermo Hollywood",
                "price": 105.0,
                "rating": 5.0,
                "reviews_count": 5,
                "host_is_superhost": 1,
                "amenities": []
            }
        }

@app.post("/api/settings/target/save")
def save_target_listing_settings(payload: Dict[str, Any], background_tasks: BackgroundTasks):
    global pipeline_state
    details = payload.get("details")
    url = payload.get("target_url")
    listing_id = payload.get("target_id")
    
    if not details or not listing_id:
        raise HTTPException(status_code=400, detail="Details or listing ID missing")
        
    if pipeline_state.get("status") != "running":
        pipeline_state = {
            "status": "starting",
            "message": "Initializing live competitor search scrape...",
            "progress": 0.0
        }
        
    settings_file = "config/target_settings.json"
    os.makedirs(os.path.dirname(settings_file), exist_ok=True)
    
    pricing_overrides = payload.get("pricing_overrides")
    manual_override_flags = payload.get("manual_override_flags")
    
    # Preserve existing overrides/flags if not passed in payload but exist in file
    if pricing_overrides is None or manual_override_flags is None:
        if os.path.exists(settings_file):
            try:
                with open(settings_file, "r", encoding="utf-8") as f:
                    old_data = json.load(f)
                    if pricing_overrides is None:
                        pricing_overrides = old_data.get("pricing_overrides", {})
                    if manual_override_flags is None:
                        manual_override_flags = old_data.get("manual_override_flags", {})
            except Exception:
                pass
    if pricing_overrides is None: pricing_overrides = {}
    if manual_override_flags is None: manual_override_flags = {}

    with open(settings_file, "w", encoding="utf-8") as f:
        json.dump({
            "target_url": url,
            "target_id": listing_id,
            "details": details,
            "pricing_overrides": pricing_overrides,
            "manual_override_flags": manual_override_flags
        }, f, indent=2, ensure_ascii=False)
        
    conn = get_connection(DB_PATH)
    try:
        cursor = conn.cursor()
        
        amenities_list = details.get("amenities", [])
        amenities_json = json.dumps(amenities_list)

        cursor.execute("""
        INSERT INTO listings (
            listing_id, title, property_type, room_type, accommodates, 
            bedrooms, bathrooms, latitude, longitude, neighborhood, 
            rating, reviews_count, host_id, host_name, host_is_superhost,
            amenities, picture_url
        ) VALUES (?, ?, 'Apartment', 'Entire home/apt', ?, ?, ?, ?, ?, ?, ?, ?, 'user_host', 'User Host', ?, ?, ?)
        ON CONFLICT(listing_id) DO UPDATE SET
            title=excluded.title,
            accommodates=excluded.accommodates,
            bedrooms=excluded.bedrooms,
            bathrooms=excluded.bathrooms,
            latitude=excluded.latitude,
            longitude=excluded.longitude,
            neighborhood=excluded.neighborhood,
            rating=excluded.rating,
            reviews_count=excluded.reviews_count,
            host_is_superhost=excluded.host_is_superhost,
            amenities=excluded.amenities,
            picture_url=excluded.picture_url
        """, (
            str(listing_id),
            details.get("title", "Target Apartment"),
            int(details.get("accommodates", 2)),
            int(details.get("bedrooms", 1)),
            float(details.get("bathrooms", 1.0)),
            float(details.get("latitude", -34.5861)),
            float(details.get("longitude", -58.4373)),
            details.get("neighborhood", "Palermo Hollywood"),
            float(details.get("rating", 5.0)),
            int(details.get("reviews_count", 5)),
            1 if details.get("host_is_superhost", True) else 0,
            amenities_json,
            details.get("picture_url")
        ))
        
        today_str = datetime.now().strftime("%Y-%m-%d")
        cursor.execute("""
        INSERT INTO listings_daily (
            snapshot_date, listing_id, price, rating, reviews_count, estimated_occupancy_rate_30d
        ) VALUES (?, ?, ?, ?, ?, 0.65)
        ON CONFLICT(snapshot_date, listing_id) DO UPDATE SET
            price=excluded.price,
            rating=excluded.rating,
            reviews_count=excluded.reviews_count
        """, (
            today_str,
            str(listing_id),
            float(details.get("price", 105.0)),
            float(details.get("rating", 5.0)),
            int(details.get("reviews_count", 5))
        ))
        
        today = datetime.now().date()
        base_price = float(details.get("price", 105.0))
        for i in range(1, 31):
            future_date = today + timedelta(days=i)
            is_weekend = future_date.weekday() in (4, 5)
            price = base_price * 1.15 if is_weekend else base_price
            
            cursor.execute("""
            INSERT INTO calendar_snapshots (
                snapshot_date, listing_id, date, price, available
            ) VALUES (?, ?, ?, ?, 1)
            ON CONFLICT(snapshot_date, listing_id, date) DO UPDATE SET
                price=excluded.price
            """, (
                today_str,
                str(listing_id),
                future_date.strftime("%Y-%m-%d"),
                round(price, 2)
            ))
            
        conn.commit()
        
        # Check if we have competitor listings in DB (other than target)
        cursor.execute("SELECT COUNT(*) FROM listings WHERE listing_id != ?", (str(listing_id),))
        competitor_count = cursor.fetchone()[0]
        
        has_competitors = competitor_count >= 5
        
        if has_competitors:
            # We can calculate watchlist immediately!
            analyzer = CompetitorAnalyzer()
            competitors = analyzer.find_competitors(str(listing_id), db_path=DB_PATH)
            
            cursor.execute("DELETE FROM competitor_watchlist WHERE target_listing_id = ?", (str(listing_id),))
            for comp in competitors:
                cursor.execute("""
                    INSERT INTO competitor_watchlist (target_listing_id, competitor_listing_id)
                    VALUES (?, ?)
                """, (str(listing_id), comp["listing_id"]))
            conn.commit()
            logger.info(f"Immediate watchlist computed: {len(competitors)} items.")
            
            # Save status timestamp for competitor resolution
            set_pipeline_status_time("last_update_competitors")
            
            # Retrain models
            from src.ml.pricing_model import DynamicPricingModel
            pricing_engine = DynamicPricingModel()
            pricing_engine.train_model(DB_PATH)
            pricing_engine.generate_and_save_recommendations(str(listing_id), days=30, db_path=DB_PATH)
            
            # Queue background task to update their prices
            background_tasks.add_task(bg_run_incremental_scrape, "prices_availability")
            message = "Target listing saved, watchlist computed immediately, and price updates queued."
        else:
            # Empty database, trigger total crawl to seed everything
            logger.info("Empty database, queuing total live scrape to seed target and watchlist...")
            background_tasks.add_task(bg_run_incremental_scrape, "total")
            message = "Target listing saved and total market scrape initiated."
        # Sync local target_settings.json to GitHub immediately
        from src.utils.git_db import sync_to_github
        background_tasks.add_task(sync_to_github, ["config/target_settings.json"])
        
        return {"status": "success", "message": message}
    except Exception as e:
        logger.error(f"Error saving target settings: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()
