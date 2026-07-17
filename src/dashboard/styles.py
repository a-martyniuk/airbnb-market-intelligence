import streamlit as st

def inject_styles():
    """
    Injects custom CSS to style the Streamlit dashboard with a premium, 
    glassmorphic dark-mode interface.
    """
    st.markdown(
        """
        <style>
        /* Main page overrides */
        .stApp {
            background-color: #0e1117;
            color: #e2e8f0;
            font-family: 'Outfit', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        }

        /* Glassmorphic Container Cards */
        .glass-card {
            background: rgba(30, 41, 59, 0.45);
            border-radius: 16px;
            padding: 24px;
            border: 1px solid rgba(255, 255, 255, 0.07);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            box-shadow: 0 10px 30px 0 rgba(0, 0, 0, 0.25);
            margin-bottom: 20px;
        }

        .glass-card-header {
            font-size: 1.15rem;
            font-weight: 600;
            color: #00f2fe;
            margin-bottom: 12px;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            border-bottom: 1px solid rgba(255, 255, 255, 0.05);
            padding-bottom: 8px;
        }

        /* Custom metric layouts */
        .metric-container {
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .metric-value {
            font-size: 2.2rem;
            font-weight: 700;
            color: #ffffff;
            margin-top: 5px;
            background: linear-gradient(45deg, #ffffff, #94a3b8);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }

        .metric-title {
            font-size: 0.85rem;
            color: #94a3b8;
            text-transform: uppercase;
            font-weight: 500;
            letter-spacing: 0.05em;
        }

        .metric-delta {
            font-size: 0.85rem;
            font-weight: 600;
            padding: 3px 8px;
            border-radius: 20px;
        }

        .delta-positive {
            color: #00ffcc;
            background-color: rgba(0, 255, 204, 0.1);
        }

        .delta-negative {
            color: #ff5a5f;
            background-color: rgba(255, 90, 95, 0.1);
        }

        /* Tab adjustments */
        .stTabs [data-baseweb="tab-list"] {
            gap: 10px;
            background-color: rgba(15, 23, 42, 0.6);
            padding: 8px 12px;
            border-radius: 12px;
            border: 1px solid rgba(255, 255, 255, 0.05);
        }

        .stTabs [data-baseweb="tab"] {
            height: 40px;
            white-space: pre-wrap;
            background-color: transparent;
            border-radius: 8px;
            color: #94a3b8;
            font-weight: 600;
            border: none;
            transition: all 0.3s ease;
        }

        .stTabs [data-baseweb="tab"]:hover {
            color: #ffffff;
            background-color: rgba(255, 255, 255, 0.03);
        }

        .stTabs [aria-selected="true"] {
            background-color: rgba(255, 90, 95, 0.15) !important;
            color: #ff5a5f !important;
            border: 1px solid rgba(255, 90, 95, 0.3) !important;
        }

        /* Custom status bar and titles */
        h1, h2, h3 {
            font-weight: 700 !important;
            letter-spacing: -0.02em !important;
        }
        
        h1 {
            background: linear-gradient(135deg, #ff5a5f 0%, #ff8a00 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            margin-bottom: 24px !important;
        }

        /* Subheaders with gradients */
        .section-header {
            background: linear-gradient(45deg, #00f2fe, #4facfe);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            font-size: 1.5rem;
            font-weight: 700;
            margin-top: 30px;
            margin-bottom: 15px;
        }

        /* Highlight box */
        .alert-box {
            padding: 15px;
            background: rgba(255, 90, 95, 0.08);
            border-left: 4px solid #ff5a5f;
            border-radius: 4px;
            margin-bottom: 20px;
        }
        
        .info-box {
            padding: 15px;
            background: rgba(0, 181, 181, 0.08);
            border-left: 4px solid #00B5B5;
            border-radius: 4px;
            margin-bottom: 20px;
        }

        /* Sidebar Styling */
        [data-testid="stSidebar"] {
            background-color: #0b0d13;
            border-right: 1px solid rgba(255, 255, 255, 0.05);
        }

        </style>
        """,
        unsafe_allow_html=True
    )

def render_kpi_card(title: str, value: str, delta: str = "", delta_type: str = "positive"):
    """
    Renders a premium glassmorphic KPI card with delta percentage.
    """
    delta_class = "delta-positive" if delta_type == "positive" else "delta-negative"
    delta_sign = "+" if delta_type == "positive" and delta and not delta.startswith(("+", "-")) else ""
    
    delta_html = f'<div class="metric-delta {delta_class}">{delta_sign}{delta}</div>' if delta else ''
    
    st.markdown(
        f"""
        <div class="glass-card">
            <div class="metric-container">
                <div>
                    <div class="metric-title">{title}</div>
                    <div class="metric-value">{value}</div>
                </div>
                {delta_html}
            </div>
        </div>
        """,
        unsafe_allow_html=True
    )

def render_glass_card(title: str, content: str):
    """
    Renders a generic glassmorphic card container with custom HTML/Markdown content.
    """
    st.markdown(
        f"""
        <div class="glass-card">
            <div class="glass-card-header">{title}</div>
            <div>{content}</div>
        </div>
        """,
        unsafe_allow_html=True
    )
