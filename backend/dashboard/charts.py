import plotly.express as px
import plotly.graph_objects as go
import pandas as pd
import numpy as np

# Airbnb-inspired Color Palette
PALETTE = {
    "coral": "#FF5A5F",
    "teal": "#00B5B5",
    "dark_blue": "#0F172A",
    "slate_grey": "#64748B",
    "lime": "#10B981",
    "gold": "#F59E0B"
}

def create_listings_map(df: pd.DataFrame, center_lat: float, center_lon: float) -> go.Figure:
    """
    Generates a Plotly Mapbox scatter map of active listings.
    Uses 'carto-darkmatter' style for a premium, local-tokenless dark map.
    """
    # Create bubble size column (prevent sizes <= 0)
    df = df.copy()
    df['bubble_size'] = df['price'].apply(lambda x: max(10, min(100, x / 2.0)))

    fig = px.scatter_mapbox(
        df,
        lat="latitude",
        lon="longitude",
        color="neighborhood",
        size="bubble_size",
        hover_name="title",
        hover_data={
            "price": ":$.2f",
            "bedrooms": True,
            "bathrooms": True,
            "rating": True,
            "reviews_count": True,
            "bubble_size": False
        },
        color_discrete_sequence=px.colors.qualitative.Pastel,
        zoom=12.2,
        center={"lat": center_lat, "lon": center_lon},
        height=500
    )

    fig.update_layout(
        mapbox_style="carto-darkmatter",
        margin={"r": 0, "t": 0, "l": 0, "b": 0},
        paper_bgcolor="rgba(0,0,0,0)",
        plot_bgcolor="rgba(0,0,0,0)",
        legend=dict(
            yanchor="top",
            y=0.98,
            xanchor="left",
            x=0.02,
            bgcolor="rgba(15, 23, 42, 0.8)",
            bordercolor="rgba(255, 255, 255, 0.1)",
            borderwidth=1,
            font=dict(color="#ffffff", size=10)
        )
    )
    return fig

def create_price_distribution_chart(df: pd.DataFrame) -> go.Figure:
    """
    Renders a histogram showing the distribution of nightly prices in the market.
    """
    fig = px.histogram(
        df,
        x="price",
        nbins=25,
        color_discrete_sequence=[PALETTE['coral']],
        labels={"price": "Nightly Price ($)"},
        marginal="violin", # Adds a density violin plot above
        height=320
    )
    
    fig.update_layout(
        template="plotly_dark",
        paper_bgcolor="rgba(0,0,0,0)",
        plot_bgcolor="rgba(0,0,0,0)",
        margin={"r": 10, "t": 40, "l": 10, "b": 10},
        xaxis=dict(showgrid=False, title_font=dict(size=12, color="#94a3b8")),
        yaxis=dict(showgrid=True, gridcolor="rgba(255, 255, 255, 0.05)", title_font=dict(size=12, color="#94a3b8")),
        bargap=0.08
    )
    return fig

def create_price_trend_chart(dates: List[str], current_prices: List[float], recommended_prices: List[float], competitor_avg: List[float] = None) -> go.Figure:
    """
    Renders a multi-line comparison chart showing proposed pricing strategies.
    """
    fig = go.Figure()
    
    # Competitor Average Line
    if competitor_avg is not None:
        fig.add_trace(go.Scatter(
            x=dates,
            y=competitor_avg,
            mode='lines',
            name='Competitor Average',
            line=dict(color=PALETTE['slate_grey'], width=2, dash='dot'),
            hovertemplate='Competitor Avg: $%{y:.2f}'
        ))

    # Current Price Line
    fig.add_trace(go.Scatter(
        x=dates,
        y=current_prices,
        mode='lines+markers',
        name='Current Quoted Price',
        line=dict(color=PALETTE['teal'], width=2.5),
        hovertemplate='Current Quoted: $%{y:.2f}'
    ))

    # Recommended Price Line (Dynamic Price)
    fig.add_trace(go.Scatter(
        x=dates,
        y=recommended_prices,
        mode='lines+markers',
        name='AI Recommended Price',
        line=dict(color=PALETTE['coral'], width=3),
        hovertemplate='AI Recommended: $%{y:.2f}'
    ))

    fig.update_layout(
        template="plotly_dark",
        paper_bgcolor="rgba(0,0,0,0)",
        plot_bgcolor="rgba(0,0,0,0)",
        margin={"r": 10, "t": 30, "l": 10, "b": 10},
        xaxis=dict(showgrid=False),
        yaxis=dict(showgrid=True, gridcolor="rgba(255, 255, 255, 0.05)", labelside="left"),
        legend=dict(
            orientation="h",
            yanchor="bottom",
            y=1.02,
            xanchor="right",
            x=1,
            bgcolor="rgba(0,0,0,0)"
        ),
        hovermode="x unified",
        height=350
    )
    return fig

def create_occupancy_by_neighborhood_chart(df: pd.DataFrame) -> go.Figure:
    """
    Generates a horizontal bar chart showing average occupancy rates by neighborhood.
    """
    # Aggregate data
    agg_df = df.groupby('neighborhood')['estimated_occupancy_rate_30d'].mean().reset_index()
    agg_df['estimated_occupancy_rate_30d'] *= 100.0 # Convert to %
    agg_df = agg_df.sort_values(by='estimated_occupancy_rate_30d', ascending=True)

    fig = px.bar(
        agg_df,
        y="neighborhood",
        x="estimated_occupancy_rate_30d",
        orientation="h",
        color="estimated_occupancy_rate_30d",
        color_continuous_scale=[[0, PALETTE['teal']], [1, PALETTE['lime']]],
        labels={"estimated_occupancy_rate_30d": "Avg Occupancy (%)", "neighborhood": "Neighborhood"},
        height=320
    )

    fig.update_layout(
        template="plotly_dark",
        paper_bgcolor="rgba(0,0,0,0)",
        plot_bgcolor="rgba(0,0,0,0)",
        margin={"r": 10, "t": 40, "l": 10, "b": 10},
        coloraxis_showscale=False,
        xaxis=dict(showgrid=True, gridcolor="rgba(255, 255, 255, 0.05)", title_font=dict(size=12, color="#94a3b8")),
        yaxis=dict(showgrid=False, title_font=dict(size=12, color="#94a3b8"))
    )
    return fig

def create_competitor_comparison_chart(target: Dict[str, Any], competitors: List[Dict[str, Any]]) -> go.Figure:
    """
    Generates a radar/spider chart comparing target listing features against competitor average.
    """
    comp_df = pd.DataFrame(competitors)
    
    categories = ['Bedrooms', 'Bathrooms', 'Accommodates', 'Rating', 'Reviews (scaled)']
    
    # Scale reviews to fit radar nicely (e.g. log scale or division)
    target_reviews = min(target['reviews_count'] / 30.0, 5.0)
    comp_reviews_avg = min(comp_df['reviews_count'].mean() / 30.0, 5.0)

    target_vals = [target['bedrooms'], target['bathrooms'], target['accommodates'] / 2.0, target['rating'], target_reviews]
    comp_vals = [comp_df['bedrooms'].mean(), comp_df['bathrooms'].mean(), comp_df['accommodates'].mean() / 2.0, comp_df['rating'].mean(), comp_reviews_avg]
    
    # Close the radar loop
    categories.append(categories[0])
    target_vals.append(target_vals[0])
    comp_vals.append(comp_vals[0])

    fig = go.Figure()

    fig.add_trace(go.Scatterpolar(
        r=comp_vals,
        theta=categories,
        fill='toself',
        fillcolor='rgba(100, 116, 139, 0.2)',
        name='Competitors Avg',
        line=dict(color=PALETTE['slate_grey'], width=2)
    ))
    
    fig.add_trace(go.Scatterpolar(
        r=target_vals,
        theta=categories,
        fill='toself',
        fillcolor='rgba(255, 90, 95, 0.3)',
        name='Your Listing',
        line=dict(color=PALETTE['coral'], width=3)
    ))

    fig.update_layout(
        polar=dict(
            radialaxis=dict(visible=True, showline=False, gridcolor="rgba(255, 255, 255, 0.05)", color="#94a3b8"),
            angularaxis=dict(gridcolor="rgba(255, 255, 255, 0.05)", color="#ffffff")
        ),
        template="plotly_dark",
        paper_bgcolor="rgba(0,0,0,0)",
        plot_bgcolor="rgba(0,0,0,0)",
        margin={"r": 30, "t": 20, "l": 30, "b": 20},
        legend=dict(orientation="h", yanchor="bottom", y=-0.15, xanchor="center", x=0.5),
        height=320
    )
    return fig
