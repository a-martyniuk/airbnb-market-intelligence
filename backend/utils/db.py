import sqlite3
import os
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

def get_connection(db_path="database/airbnb_intelligence.db"):
    """
    Establishes a connection to the SQLite database.
    Ensures parent directories exist and enables foreign key constraints.
    """
    os.makedirs(os.path.dirname(db_path), exist_ok=True)
    conn = sqlite3.connect(db_path)
    conn.execute("PRAGMA foreign_keys = ON;")
    conn.row_factory = sqlite3.Row
    return conn

def init_db(db_path="database/airbnb_intelligence.db"):
    """
    Initializes the database schema if it doesn't already exist.
    """
    conn = get_connection(db_path)
    cursor = conn.cursor()

    # 1. Listings dimension table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS listings (
        listing_id TEXT PRIMARY KEY,
        title TEXT,
        property_type TEXT,
        room_type TEXT,
        accommodates INTEGER,
        bedrooms INTEGER,
        bathrooms REAL,
        latitude REAL,
        longitude REAL,
        neighborhood TEXT,
        rating REAL,
        reviews_count INTEGER,
        host_id TEXT,
        host_name TEXT,
        host_is_superhost INTEGER, -- 1 for True, 0 for False
        amenities TEXT, -- Serialized JSON list of normalized amenities
        picture_url TEXT, -- Hero cover image URL
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)

    # 2. Daily listings fact table (historical pricing & metrics snapshot)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS listings_daily (
        snapshot_date DATE,
        listing_id TEXT,
        price REAL,
        rating REAL,
        reviews_count INTEGER,
        estimated_occupancy_rate_30d REAL,
        PRIMARY KEY (snapshot_date, listing_id),
        FOREIGN KEY (listing_id) REFERENCES listings(listing_id) ON DELETE CASCADE
    )
    """)

    # 3. Calendar snapshots (future pricing and availability)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS calendar_snapshots (
        snapshot_date DATE,
        listing_id TEXT,
        date DATE,
        price REAL,
        available INTEGER, -- 1 for available, 0 for booked/blocked
        PRIMARY KEY (snapshot_date, listing_id, date),
        FOREIGN KEY (listing_id) REFERENCES listings(listing_id) ON DELETE CASCADE
    )
    """)

    # 4. Price recommendations
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS price_recommendations (
        listing_id TEXT,
        date DATE,
        recommended_price REAL,
        confidence_score REAL,
        features TEXT, -- JSON string containing features used
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (listing_id, date),
        FOREIGN KEY (listing_id) REFERENCES listings(listing_id) ON DELETE CASCADE
    )
    """)

    # 5. Booking events (ETL derived tables to show actual bookings)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS booking_events (
        listing_id TEXT,
        date DATE,
        price_sold REAL,
        detected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (listing_id, date),
        FOREIGN KEY (listing_id) REFERENCES listings(listing_id) ON DELETE CASCADE
    )
    """)

    # 6. Competitor watchlist (stores locked competitor IDs for target properties)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS competitor_watchlist (
        target_listing_id TEXT,
        competitor_listing_id TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (target_listing_id, competitor_listing_id),
        FOREIGN KEY (target_listing_id) REFERENCES listings(listing_id) ON DELETE CASCADE,
        FOREIGN KEY (competitor_listing_id) REFERENCES listings(listing_id) ON DELETE CASCADE
    )
    """)

    # 7. Pipeline status (stores relative run execution logs/timestamps)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS pipeline_status (
        key TEXT PRIMARY KEY,
        value TEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)

    # Create indexes for speed
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_listings_neighborhood ON listings(neighborhood);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_daily_listing ON listings_daily(listing_id);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_calendar_listing_date ON calendar_snapshots(listing_id, date);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_recommendations_listing ON price_recommendations(listing_id);")

    # Safe schema migration for amenities column
    cursor.execute("PRAGMA table_info(listings);")
    columns = [row[1] for row in cursor.fetchall()]
    if "amenities" not in columns:
        cursor.execute("ALTER TABLE listings ADD COLUMN amenities TEXT;")
        logger.info("Migrated listings table: added 'amenities' column.")
    
    if "picture_url" not in columns:
        cursor.execute("ALTER TABLE listings ADD COLUMN picture_url TEXT;")
        logger.info("Migrated listings table: added 'picture_url' column.")

    # Safe schema migration for new pricing columns in listings_daily
    cursor.execute("PRAGMA table_info(listings_daily);")
    daily_columns = [row[1] for row in cursor.fetchall()]
    new_daily_cols = {
        "weekend_price": "REAL",
        "weekly_discount": "REAL",
        "monthly_discount": "REAL",
        "early_bird_discount": "REAL",
        "last_minute_discount": "REAL",
        "cleaning_fee": "REAL",
        "minimum_stay": "INTEGER",
        "maximum_stay": "INTEGER",
        "instant_book": "INTEGER",
        "cancellation_policy": "TEXT"
    }
    for col_name, col_type in new_daily_cols.items():
        if col_name not in daily_columns:
            cursor.execute(f"ALTER TABLE listings_daily ADD COLUMN {col_name} {col_type};")
            logger.info(f"Migrated listings_daily table: added '{col_name}' column.")

    conn.commit()
    conn.close()
    logger.info(f"Database initialized at {db_path}")

if __name__ == "__main__":
    # Test initialization
    logging.basicConfig(level=logging.INFO)
    init_db()
