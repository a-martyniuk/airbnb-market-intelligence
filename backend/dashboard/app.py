import streamlit as st
import pandas as pd
import numpy as np
import sqlite3
import os
import yaml
import json
import logging
from datetime import datetime, date, timedelta
from typing import Dict, Any, List

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Absolute paths or relative package paths
from backend.utils.db import get_connection, init_db
from backend.scraper.scheduler import ScrapingScheduler
from backend.etl.pipeline import ETLPipeline
from backend.ml.pricing_model import DynamicPricingModel
from backend.analytics.competitor import CompetitorAnalyzer
from backend.dashboard.styles import inject_styles, render_kpi_card, render_glass_card
from backend.dashboard.charts import (
    create_listings_map,
    create_price_distribution_chart,
    create_price_trend_chart,
    create_occupancy_by_neighborhood_chart,
    create_competitor_comparison_chart
)

# Streamlit Page Configuration
st.set_page_config(
    page_title="Airbnb Market Intelligence & Dynamic Pricing Platform",
    page_icon="📊",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Inject Custom CSS styles
inject_styles()

# DB Configuration
DB_PATH = "database/airbnb_intelligence.db"
init_db(DB_PATH)

def check_db_empty() -> bool:
    """Returns True if the database contains no listings."""
    conn = get_connection(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM listings")
    count = cursor.fetchone()[0]
    conn.close()
    return count == 0

def hydrate_database(num_days=14):
    """
    Simulates consecutive days of scraping, ETL ingestion, and ML recommendation.
    Generates historical time series for visual analytics.
    """
    scheduler = ScrapingScheduler()
    pipeline = ETLPipeline()
    pricing_engine = DynamicPricingModel()

    today = date.today()
    progress_bar = st.progress(0)
    status_text = st.empty()

    # Reset DB tables to avoid duplicate snapshots
    conn = get_connection(DB_PATH)
    conn.execute("DELETE FROM booking_events")
    conn.execute("DELETE FROM calendar_snapshots")
    conn.execute("DELETE FROM listings_daily")
    conn.execute("DELETE FROM price_recommendations")
    conn.execute("DELETE FROM listings")
    conn.commit()
    conn.close()

    for i in range(num_days, -1, -1):
        sim_date = today - timedelta(days=i)
        sim_date_str = sim_date.strftime("%Y-%m-%d")
        
        status_text.markdown(f"**Ingesting day {num_days - i + 1} of {num_days + 1}** (`{sim_date_str}`)...")
        
        # 1. Scrape (stores raw data in data lake)
        raw_file = scheduler.run_daily_scrape(city="Buenos Aires", run_date=sim_date_str)
        # 2. ETL (processes raw data, extracts bookings & snapshots)
        pipeline.process_raw_file(raw_file, run_date=sim_date_str)
        
        progress_bar.progress((num_days - i + 1) / (num_days + 1))

    # 3. Train ML Model
    status_text.markdown("**Training Dynamic Pricing ML Model...**")
    pricing_engine.train_model()
    
    # 4. Generate recommendations for all listings
    status_text.markdown("**Generating forward-looking price recommendations...**")
    conn = get_connection(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT listing_id FROM listings")
    listing_ids = [row[0] for row in cursor.fetchall()]
    conn.close()
    
    for idx, l_id in enumerate(listing_ids):
        pricing_engine.generate_and_save_recommendations(l_id, days=30)
        
    status_text.markdown("✨ **Database successfully hydrated with historical facts & ML models!**")
    progress_bar.empty()

# ==================== MAIN RENDER ====================

# Sidebar Layout
with st.sidebar:
    st.markdown("## 📊 Revenue Management")
    st.markdown("<span style='color:#FF5A5F;font-weight:bold;'>Airbnb Market Intelligence</span>", unsafe_allow_html=True)
    st.markdown("---")

    # Load configuration settings
    with open("config/settings.yaml", 'r', encoding='utf-8') as f:
        settings = yaml.safe_load(f)
        
    city_name = st.selectbox("Target Market / City", ["Buenos Aires"], index=0)
    city_cfg = settings['market']['buenos_aires']
    
    st.markdown("### 🛠️ Ingestion Controls")
    
    db_empty = check_db_empty()
    if db_empty:
        st.warning("⚠️ Database is empty. Hydrate simulated market data to populate analytics.")
        if st.button("🚀 Hydrate 14-Day Simulation", type="primary"):
            with st.spinner("Hydrating database..."):
                hydrate_database(14)
                st.rerun()
    else:
        st.info("Database loaded with active listings.")
        if st.button("🔄 Reset & Hydrate DB"):
            with st.spinner("Re-hydrating database..."):
                hydrate_database(14)
                st.rerun()

    st.markdown("---")
    st.markdown("#### Model Parameters")
    st.caption("Weekend Premium: +15%")
    st.caption("Summer High Season: +20%")
    st.caption("Last-Minute Discount: -15%")
    st.caption("k-NN Competitors: k=5")
    
    st.markdown("<br><br><span style='color:#64748B;font-size:0.8rem;'>Portfolio Project Demo</span>", unsafe_allow_html=True)

# Main Screen
st.title("Airbnb Market Intelligence & Dynamic Pricing Platform")

if db_empty:
    st.markdown(
        """
        <div class='info-box'>
            <h3>Welcome to the Revenue Management Platform!</h3>
            <p>This application demonstrates a professional Data Engineering, Analytics, and ML pipeline for short-term rental markets.</p>
            <p><strong>To begin:</strong> Please click the <strong>🚀 Hydrate 14-Day Simulation</strong> button in the sidebar. This will:</p>
            <ul>
                <li>Simulate 14 days of daily scraping runs for Buenos Aires.</li>
                <li>Run the ETL pipeline to process raw payloads, detect bookings via calendar state changes, and load SQLite.</li>
                <li>Train a Random Forest regressor on listing features and temporal parameters.</li>
                <li>Generate 30-day forward price recommendations for all 30 listings.</li>
            </ul>
        </div>
        """,
        unsafe_allow_html=True
    )
else:
    # 1. Fetch data from SQLite
    conn = get_connection(DB_PATH)
    
    # Active snapshot date (last ingestion)
    cursor = conn.cursor()
    cursor.execute("SELECT MAX(snapshot_date) FROM listings_daily")
    latest_date_str = cursor.fetchone()[0]
    
    # Listings map data
    query_listings = f"""
    SELECT 
        l.listing_id, l.title, l.latitude, l.longitude, l.neighborhood, 
        l.bedrooms, l.bathrooms, l.accommodates, l.rating, l.reviews_count, 
        ld.price, ld.estimated_occupancy_rate_30d
    FROM listings l
    JOIN listings_daily ld ON l.listing_id = ld.listing_id
    WHERE ld.snapshot_date = '{latest_date_str}'
    """
    df_listings = pd.read_sql_query(query_listings, conn)
    
    # Market KPIs
    cursor.execute(f"""
    SELECT 
        COUNT(listing_id) as total_listings,
        AVG(price) as avg_price,
        AVG(estimated_occupancy_rate_30d) as avg_occupancy
    FROM listings_daily
    WHERE snapshot_date = '{latest_date_str}'
    """)
    kpis = cursor.fetchone()
    
    # Get previous day KPI for delta comparison
    prev_date = datetime.strptime(latest_date_str, "%Y-%m-%d").date() - timedelta(days=1)
    cursor.execute("""
    SELECT AVG(price) as avg_price, AVG(estimated_occupancy_rate_30d) as avg_occupancy 
    FROM listings_daily WHERE snapshot_date = ?
    """, (prev_date.strftime("%Y-%m-%d"),))
    prev_kpis = cursor.fetchone()
    
    conn.close()

    # Calculate Deltas
    price_delta = ""
    occ_delta = ""
    if prev_kpis and prev_kpis[0] and prev_kpis[1]:
        p_chg = ((kpis[1] - prev_kpis[0]) / prev_kpis[0]) * 100
        o_chg = ((kpis[2] - prev_kpis[1]) / prev_kpis[1]) * 100
        price_delta = f"{p_chg:+.1f}% vs yesterday"
        occ_delta = f"{o_chg:+.1f}% vs yesterday"

    # Tab Layout
    tab_market, tab_listing, tab_etl = st.tabs([
        "🏙️ Market Explorer", 
        "📈 Property Performance & Dynamic Pricing", 
        "⚙️ ETL & Data Engine Monitor"
    ])

    # ==================== TAB 1: MARKET EXPLORER ====================
    with tab_market:
        st.markdown("<div class='section-header'>Market Overview</div>", unsafe_allow_html=True)
        
        # KPI Row
        kpi_col1, kpi_col2, kpi_col3, kpi_col4 = st.columns(4)
        with kpi_col1:
            render_kpi_card("Total Listings Supply", f"{kpis[0]} properties", delta="", delta_type="positive")
        with kpi_col2:
            render_kpi_card(
                "Average Daily Rate (ADR)", 
                f"${kpis[1]:.2f}", 
                delta=price_delta, 
                delta_type="positive" if (prev_kpis and kpis[1] >= prev_kpis[0]) else "negative"
            )
        with kpi_col3:
            render_kpi_card(
                "Market Occupancy Rate", 
                f"{kpis[2]*100:.1f}%", 
                delta=occ_delta, 
                delta_type="positive" if (prev_kpis and kpis[2] >= prev_kpis[1]) else "negative"
            )
        with kpi_col4:
            render_kpi_card("Target City", city_name, delta="Simulation Live", delta_type="positive")

        # Map and Local Trends Row
        map_col, chart_col = st.columns([2, 1])
        
        with map_col:
            st.markdown("#### Geographic Distribution of Listings")
            fig_map = create_listings_map(df_listings, city_cfg['center_lat'], city_cfg['center_lon'])
            st.plotly_chart(fig_map, use_container_width=True)
            
        with chart_col:
            st.markdown("#### Occupancy by Neighborhood")
            fig_occ = create_occupancy_by_neighborhood_chart(df_listings)
            st.plotly_chart(fig_occ, use_container_width=True)
            
            st.markdown("#### Price Distribution")
            fig_dist = create_price_distribution_chart(df_listings)
            st.plotly_chart(fig_dist, use_container_width=True)

        st.markdown("#### Active Listings Directory")
        st.dataframe(
            df_listings[['listing_id', 'title', 'neighborhood', 'bedrooms', 'bathrooms', 'accommodates', 'rating', 'price', 'estimated_occupancy_rate_30d']].rename(columns={
                'title': 'Property Title',
                'neighborhood': 'Neighborhood',
                'bedrooms': 'Bedrooms',
                'bathrooms': 'Bathrooms',
                'accommodates': 'Capacity',
                'rating': 'Rating',
                'price': 'Current Price ($)',
                'estimated_occupancy_rate_30d': 'Est Occupancy Rate'
            }),
            use_container_width=True,
            hide_index=True
        )

    # ==================== TAB 2: PROPERTY PERFORMANCE ====================
    with tab_listing:
        st.markdown("<div class='section-header'>Property Optimizer & Recommender</div>", unsafe_allow_html=True)
        
        # Selection drop down
        listing_options = {row['listing_id']: f"{row['title']} ({row['neighborhood']} - ${row['price']:.0f}/night)" for _, row in df_listings.iterrows()}
        selected_listing_id = st.selectbox("Select Your Property to Optimize", list(listing_options.keys()), format_func=lambda x: listing_options[x])

        # Fetch Listing details
        selected_listing = df_listings[df_listings['listing_id'] == selected_listing_id].iloc[0]
        
        conn = get_connection(DB_PATH)
        cursor = conn.cursor()
        
        # Bookings & Revenue
        cursor.execute("""
        SELECT COUNT(*) as bookings, SUM(price_sold) as revenue 
        FROM booking_events WHERE listing_id = ?
        """, (selected_listing_id,))
        booking_stats = cursor.fetchone()
        
        # Recommendations & Calendars
        query_recs = """
        SELECT 
            pr.date, 
            pr.recommended_price, 
            pr.confidence_score, 
            pr.features, 
            cs.price as current_price,
            cs.available as is_available
        FROM price_recommendations pr
        JOIN calendar_snapshots cs ON pr.listing_id = cs.listing_id 
            AND pr.date = cs.date 
            AND cs.snapshot_date = (SELECT MAX(snapshot_date) FROM calendar_snapshots)
        WHERE pr.listing_id = ?
        ORDER BY pr.date ASC
        """
        df_recs = pd.read_sql_query(query_recs, conn, params=(selected_listing_id,))
        conn.close()

        # Property details panel
        det_col1, det_col2, det_col3, det_col4 = st.columns(4)
        with det_col1:
            render_kpi_card("Current Price Quoted", f"${selected_listing['price']:.2f}", delta="Base Price", delta_type="positive")
        with det_col2:
            render_kpi_card("Estimated Occupancy", f"{selected_listing['estimated_occupancy_rate_30d']*100:.1f}%", delta="Next 30 Days", delta_type="positive")
        with det_col3:
            bookings_count = booking_stats[0] if booking_stats else 0
            render_kpi_card("Simulated Bookings", f"{bookings_count} stays", delta="Past 14 Days", delta_type="positive")
        with det_col4:
            revenue = booking_stats[1] if booking_stats and booking_stats[1] else 0.0
            render_kpi_card("Simulated Revenue", f"${revenue:.2f}", delta="Past 14 Days", delta_type="positive")

        # Competitor analysis row
        comp_col1, comp_col2 = st.columns([1, 1])
        
        # Find competitors
        analyzer = CompetitorAnalyzer()
        competitors = analyzer.find_competitors(selected_listing_id, DB_PATH)
        
        with comp_col1:
            st.markdown("#### Competitor Proximity & Metrics")
            comp_show_df = pd.DataFrame(competitors)
            st.dataframe(
                comp_show_df[['title', 'neighborhood', 'geo_distance_km', 'accommodates', 'bedrooms', 'bathrooms', 'rating', 'reviews_count']],
                use_container_width=True,
                hide_index=True
            )
            
        with comp_col2:
            st.markdown("#### Target Listing vs. Competitor Average")
            fig_radar = create_competitor_comparison_chart(selected_listing.to_dict(), competitors)
            st.plotly_chart(fig_radar, use_container_width=True)

        # AI Recommendations
        st.markdown("---")
        st.markdown("#### AI Dynamic Pricing Strategy (Next 30 Days)")
        
        if not df_recs.empty:
            dates = df_recs['date'].tolist()
            current_prices = df_recs['current_price'].tolist()
            recommended_prices = df_recs['recommended_price'].tolist()
            
            # Competitor prices for matching dates
            conn = get_connection(DB_PATH)
            cursor = conn.cursor()
            comp_ids = [c['listing_id'] for c in competitors]
            comp_avg_trend = []
            
            for d in dates:
                placeholders = ",".join("?" for _ in comp_ids)
                cursor.execute(f"""
                SELECT AVG(price) as avg_p 
                FROM calendar_snapshots 
                WHERE listing_id IN ({placeholders}) 
                  AND date = ? 
                  AND snapshot_date = '{latest_date_str}'
                """, (*comp_ids, d))
                avg_p = cursor.fetchone()[0]
                comp_avg_trend.append(avg_p or 100.0)
                
            conn.close()

            # Render Line chart
            fig_trend = create_price_trend_chart(dates, current_prices, recommended_prices, comp_avg_trend)
            st.plotly_chart(fig_trend, use_container_width=True)

            # Recommendations Details Dataframe
            recs_expanded = []
            for _, row in df_recs.iterrows():
                feats = json.loads(row['features'])
                recs_expanded.append({
                    "Date": row['date'],
                    "Current Quoted ($)": row['current_price'],
                    "AI Recommended ($)": row['recommended_price'],
                    "Competitor Avg ($)": feats.get('competitor_avg_price'),
                    "Lead Time (Days)": feats.get('lead_time_days'),
                    "Weekend": "Yes" if feats.get('is_weekend') else "No",
                    "Occupancy Factor": f"{feats.get('current_occupancy_rate')*100:.0f}%",
                    "Confidence": f"{row['confidence_score']*100:.0f}%"
                })
            
            st.markdown("##### Pricing Recommendation Detail Table")
            st.dataframe(pd.DataFrame(recs_expanded), use_container_width=True, hide_index=True)
            
        else:
            st.warning("No price recommendations generated. Train models and generate recommendations first.")

    # ==================== TAB 3: ETL & DATA MONITOR ====================
    with tab_etl:
        st.markdown("<div class='section-header'>Data Pipeline Diagnostics</div>", unsafe_allow_html=True)
        
        # DB Sizes
        conn = get_connection(DB_PATH)
        cursor = conn.cursor()
        
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
        
        conn.close()

        col_diag1, col_diag2 = st.columns(2)
        
        with col_diag1:
            st.markdown("#### SQLite Database Entity Counts")
            diag_df = pd.DataFrame([
                {"Table": "listings (Dimension)", "Description": "Static property details", "Rows": cnt_list},
                {"Table": "listings_daily (Facts)", "Description": "Daily snapshots of listings", "Rows": cnt_daily},
                {"Table": "calendar_snapshots (Facts)", "Description": "Future price and availability blocks", "Rows": cnt_cal},
                {"Table": "booking_events (Facts)", "Description": "Detected bookings via delta tracking", "Rows": cnt_book},
                {"Table": "price_recommendations (ML Output)", "Description": "Predicted pricing adjustments", "Rows": cnt_recs}
            ])
            st.table(diag_df)

        with col_diag2:
            st.markdown("#### ETL Pipeline Architecture")
            st.markdown(
                """
                - **Raw Files Directory**: `database/raw/YYYY-MM-DD/` contains raw scraped payloads.
                - **Relational Storage**: SQLite database handles transaction logs and provides analytic indexing.
                - **Calendar Delta Ingestion**:
                  $$\\Delta_{Calendar} = \\text{Calendar}(T-1, D)_{Available=1} \\cap \\text{Calendar}(T, D)_{Available=0}$$
                  If a check-in date changes from available to unavailable from one scraper snapshot to the next, we record a **booking event** and capture the nightly rate as the sale price.
                """
            )
            
        st.markdown("#### Database Inspection Query Tool")
        sql_input = st.text_area("Write SQL Query (Read-Only)", "SELECT * FROM listings LIMIT 3")
        if st.button("Execute Query"):
            try:
                conn = get_connection(DB_PATH)
                df_sql = pd.read_sql_query(sql_input, conn)
                conn.close()
                st.dataframe(df_sql)
            except Exception as ex:
                st.error(f"SQL Error: {str(ex)}")
