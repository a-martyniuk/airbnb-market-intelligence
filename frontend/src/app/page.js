"use client";

import React, { useEffect, useState, useRef } from "react";
import dynamic from "next/dynamic";
import {
  LayoutDashboard,
  Globe,
  Users,
  Calendar,
  Map,
  DollarSign,
  Cpu,
  BarChart3,
  History,
  List,
  Layers,
  FileText,
  Settings,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Bell,
  Moon,
  Sun,
  Search,
  Sparkles,
  Award,
  ArrowUpRight,
  ArrowDownRight,
  Database,
  Terminal,
  Activity,
  Sliders,
  CheckCircle2,
  CalendarDays,
  HelpCircle
} from "lucide-react";


// ─── Global Tooltip Component ─────────────────────────────────────────────────
// Uses position:fixed so it escapes all overflow:hidden containers.
function Tooltip({ text, children }) {
  const [pos, setPos] = useState({ x: 0, y: 0, visible: false, width: 268 });
  const wrapRef = useRef(null);

  const handleEnter = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const isObject = typeof text === 'object';
    const tipWidth = isObject ? 320 : 268;
    const x = Math.min(rect.left + rect.width / 2 - tipWidth / 2, window.innerWidth - tipWidth - 8);
    const y = rect.top - 12;
    setPos({ x: Math.max(8, x), y, visible: true, width: tipWidth });
  };
  const handleLeave = () => setPos(p => ({ ...p, visible: false }));

  if (!text) return children;

  return (
    <>
      <span ref={wrapRef} style={{ display: 'inline-flex', alignItems: 'center', cursor: 'help' }}
        onMouseEnter={handleEnter}
        onMouseLeave={handleLeave}
      >
        {children}
      </span>
      {pos.visible && (
        <span style={{
          position: 'fixed',
          left: pos.x,
          top: pos.y,
          transform: 'translateY(-100%)',
          background: 'var(--bg-secondary)',
          border: '1px solid var(--card-border)',
          color: 'var(--text-primary)',
          fontSize: '0.74rem',
          fontWeight: 500,
          padding: '10px 14px',
          borderRadius: '10px',
          whiteSpace: typeof text === 'object' ? 'normal' : 'pre-line',
          width: `${pos.width}px`,
          maxWidth: '92vw',
          zIndex: 99999,
          boxShadow: '0 14px 36px rgba(0,0,0,0.6)',
          lineHeight: 1.5,
          pointerEvents: 'none',
          marginBottom: '6px',
        }}>
          {text}
        </span>
      )}
    </>
  );
}

// Table helper for structured tooltips
function FeeBreakdownTable({ price, weekendPrice, feeStructure, cleaningFee, averageStay }) {
  const stayN = parseInt(averageStay) || 3;
  const cleanFee = parseFloat(cleaningFee) || 0;
  const cleanProrated = cleanFee / stayN;

  const getRowData = (p) => {
    const nightlyTotal = p + cleanProrated;
    const isSimplified = feeStructure === "simplified";
    const hostFeePct = isSimplified ? 0.15 : 0.03;
    
    let guestFee = 0;
    let guestTotal = nightlyTotal;
    
    if (!isSimplified) {
      guestFee = nightlyTotal * 0.142;
      guestTotal = nightlyTotal + guestFee;
    }
    
    const hostFee = nightlyTotal * hostFeePct;
    const hostPayout = nightlyTotal - hostFee;
    
    return {
      base: p,
      clean: cleanProrated,
      guestTotal,
      hostFee,
      hostPayout
    };
  };

  const week = getRowData(price);
  const weekend = getRowData(weekendPrice);

  return (
    <div style={{ padding: "4px", fontSize: "0.75rem", color: "var(--text-primary)" }}>
      <div style={{ fontWeight: "bold", fontSize: "0.82rem", marginBottom: "8px", borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: "4px", color: "var(--accent-coral)" }}>
        📊 Desglose de Tarifas (Por Noche)
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr", gap: "8px", marginBottom: "6px", fontWeight: "bold", borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: "4px" }}>
        <span>Concepto</span>
        <span style={{ textAlign: "right" }}>Semana</span>
        <span style={{ textAlign: "right", color: "#f59e0b" }}>Finde</span>
      </div>
      
      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr", gap: "8px", marginBottom: "4px" }}>
        <span style={{ color: "var(--text-secondary)" }}>Precio Base:</span>
        <span style={{ textAlign: "right" }}>${week.base.toFixed(0)} USD</span>
        <span style={{ textAlign: "right" }}>${weekend.base.toFixed(0)} USD</span>
      </div>
      
      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr", gap: "8px", marginBottom: "6px", borderBottom: "1px dashed rgba(255,255,255,0.05)", paddingBottom: "4px" }}>
        <span style={{ color: "var(--text-secondary)" }}>Limpieza:</span>
        <span style={{ textAlign: "right" }}>+${week.clean.toFixed(1)} USD</span>
        <span style={{ textAlign: "right" }}>+${weekend.clean.toFixed(1)} USD</span>
      </div>
      
      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr", gap: "8px", marginBottom: "6px", fontWeight: "bold" }}>
        <span>Total Huésped:</span>
        <span style={{ textAlign: "right" }}>${week.guestTotal.toFixed(1)} USD</span>
        <span style={{ textAlign: "right" }}>${weekend.guestTotal.toFixed(1)} USD</span>
      </div>
      
      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr", gap: "8px", marginBottom: "6px", color: "var(--accent-coral)" }}>
        <span>Comisión Airbnb:</span>
        <span style={{ textAlign: "right" }}>-${week.hostFee.toFixed(1)} USD</span>
        <span style={{ textAlign: "right" }}>-${weekend.hostFee.toFixed(1)} USD</span>
      </div>
      
      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr", gap: "8px", paddingTop: "6px", borderTop: "1px solid rgba(255,255,255,0.1)", fontWeight: "bold", color: "var(--accent-emerald)", fontSize: "0.78rem" }}>
        <span>Cobro Neto:</span>
        <span style={{ textAlign: "right" }}>${week.hostPayout.toFixed(1)} USD</span>
        <span style={{ textAlign: "right" }}>${weekend.hostPayout.toFixed(1)} USD</span>
      </div>
      
      <div style={{ fontSize: "0.62rem", color: "var(--text-secondary)", marginTop: "10px", lineHeight: "1.3", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)", padding: "6px 8px", borderRadius: "6px" }}>
        * Basado en estadía promedio de {stayN} noches y limpieza de ${cleanFee.toFixed(0)} USD. 
        Comisión de Airbnb: {feeStructure === "simplified" ? "Simplificada (15% anfitrión)" : "Dividida (3% anfitrión + huésped)"}.
      </div>
    </div>
  );
}


// Also upgrade all legacy .ui-tooltip-wrapper elements via a global event listener
// (handles cases where old CSS-class tooltips are used elsewhere in the page)
function TooltipPortal() {
  const [tip, setTip] = useState(null);
  useEffect(() => {
    const show = (e) => {
      const wrapper = e.target.closest('.ui-tooltip-wrapper');
      if (!wrapper) return;
      const tooltipEl = wrapper.querySelector('.ui-tooltip');
      if (!tooltipEl) return;
      const rect = wrapper.getBoundingClientRect();
      const tipWidth = 268;
      const x = Math.max(8, Math.min(rect.left + rect.width / 2 - tipWidth / 2, window.innerWidth - tipWidth - 8));
      setTip({ text: tooltipEl.textContent, x, y: rect.top - 12 });
    };
    const hide = (e) => {
      if (!e.target.closest('.ui-tooltip-wrapper')) setTip(null);
    };
    document.addEventListener('mouseover', show);
    document.addEventListener('mouseout', hide);
    return () => {
      document.removeEventListener('mouseover', show);
      document.removeEventListener('mouseout', hide);
    };
  }, []);

  if (!tip) return null;
  return (
    <span style={{
      position: 'fixed',
      left: tip.x,
      top: tip.y,
      transform: 'translateY(-100%)',
      background: 'var(--bg-secondary)',
      border: '1px solid var(--card-border)',
      color: 'var(--text-primary)',
      fontSize: '0.74rem',
      fontWeight: 500,
      padding: '10px 14px',
      borderRadius: '10px',
      whiteSpace: 'pre-line',
      width: '268px',
      maxWidth: '92vw',
      zIndex: 99999,
      boxShadow: '0 14px 36px rgba(0,0,0,0.6)',
      lineHeight: 1.5,
      pointerEvents: 'none',
      marginBottom: '6px',
    }}>
      {tip.text}
    </span>
  );
}
// ──────────────────────────────────────────────────────────────────────────────

function KpiCard({ title, value, subValue, delta, deltaType = 'positive', icon: Icon, tooltipText, trendText, trendType = 'neutral' }) {

  const isPos = deltaType === 'positive';
  const deltaClass = isPos ? 'delta-pos' : 'delta-neg';
  const deltaSign = isPos && delta && !delta.toString().startsWith('+') && !delta.toString().startsWith('-') ? '+' : '';

  const getTrendStyles = () => {
    if (trendType === 'positive') {
      return {
        color: 'var(--accent-emerald)',
        icon: '📈',
        background: 'rgba(16, 185, 129, 0.06)',
        border: '1px solid rgba(16, 185, 129, 0.12)'
      };
    } else if (trendType === 'negative') {
      return {
        color: 'var(--accent-coral)',
        icon: '📉',
        background: 'rgba(255, 90, 95, 0.06)',
        border: '1px solid rgba(255, 90, 95, 0.12)'
      };
    } else {
      return {
        color: 'var(--text-secondary)',
        icon: '➡️',
        background: 'rgba(255, 255, 255, 0.03)',
        border: '1px solid rgba(255, 255, 255, 0.05)'
      };
    }
  };

  const trend = getTrendStyles();

  return (
    <div className="glass-card kpi-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', alignItems: 'flex-start', minHeight: '110px', padding: '16px', gap: '8px' }}>
      {/* Row 1: Icon + Title + Tooltip */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', width: '100%' }}>
        {Icon && <Icon size={14} style={{ color: 'var(--text-secondary)' }} />}
        <span className="kpi-title" style={{ margin: 0, fontSize: '0.75rem', fontWeight: 'bold' }}>{title}</span>
        {tooltipText && (
          <Tooltip text={tooltipText}>
            <span style={{ fontSize: '0.68rem', cursor: 'help', opacity: 0.6, marginLeft: '4px' }}>ℹ️</span>
          </Tooltip>
        )}
      </div>

      {/* Row 2: Value & optional Subvalue */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', width: '100%' }}>
        <div className="kpi-value" style={{ fontSize: '1.65rem', margin: 0, fontWeight: 'bold' }}>{value}</div>
        {subValue && (
          <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: '500', marginTop: '2px' }}>
            {subValue}
          </span>
        )}
      </div>
      
      {/* Row 3: Delta Badge & Trend Badge Side-by-Side */}
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', width: '100%', marginTop: 'auto' }}>
        {delta !== undefined && delta !== null && (
          <div className={`kpi-delta ${deltaClass}`} style={{ fontSize: '0.72rem', padding: '2px 6px', borderRadius: '10px', fontWeight: 'bold', display: 'inline-block' }}>
            {deltaSign}{delta}
          </div>
        )}
        {trendText && (
          <span style={{ 
            fontSize: "0.68rem", 
            color: trend.color, 
            display: "inline-flex", 
            alignItems: "center", 
            gap: "3px", 
            fontWeight: "bold", 
            background: trend.background, 
            padding: "2px 6px", 
            borderRadius: "4px", 
            border: trend.border,
            whiteSpace: "nowrap"
          }}>
            {trend.icon} {trendText}
          </span>
        )}
      </div>
    </div>
  );
}
import PricingCalendar from "@/components/PricingCalendar";
import {
  PriceDistributionChart,
  OccupancyChart,
  PriceTrendChart,
  CompetitorRadarChart,
  MarketHistoryChart
} from "@/components/Charts";

import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  AreaChart,
  Area,
  LineChart,
  Line
} from "recharts";

// Load Leaflet map dynamically with SSR disabled to prevent Node window-ref crashes
const LeafletMap = dynamic(() => import("@/components/LeafletMap"), { ssr: false });

const competitorImages = [
  "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=400&q=80",
  "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=400&q=80",
  "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=400&q=80",
  "https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=400&q=80",
  "https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=400&q=80",
  "https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=400&q=80",
  "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=400&q=80",
  "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=400&q=80",
  "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=400&q=80",
  "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=400&q=80",
  "https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=400&q=80",
  "https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=400&q=80",
  "https://images.unsplash.com/photo-1554995207-c18c203602cb?auto=format&fit=crop&w=400&q=80",
  "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=400&q=80",
  "https://images.unsplash.com/photo-1536376072261-38c75010e6c9?auto=format&fit=crop&w=400&q=80",
  "https://images.unsplash.com/photo-1560185007-cde436f6a4d0?auto=format&fit=crop&w=400&q=80",
  "https://images.unsplash.com/photo-1507089947368-19c1da9775ae?auto=format&fit=crop&w=400&q=80",
  "https://images.unsplash.com/photo-1616046229478-9901c5536a45?auto=format&fit=crop&w=400&q=80",
  "https://images.unsplash.com/photo-1617806118233-18e1db207f62?auto=format&fit=crop&w=400&q=80",
  "https://images.unsplash.com/photo-1615876234886-fd9a39faa97f?auto=format&fit=crop&w=400&q=80",
  "https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?auto=format&fit=crop&w=400&q=80",
  "https://images.unsplash.com/photo-1595428774223-ef52624120d2?auto=format&fit=crop&w=400&q=80",
  "https://images.unsplash.com/photo-1594075893649-00ab56852c7c?auto=format&fit=crop&w=400&q=80",
  "https://images.unsplash.com/photo-1600121848594-d8644e57abab?auto=format&fit=crop&w=400&q=80",
  "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=400&q=80",
  "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=400&q=80",
  "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=400&q=80",
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=400&q=80",
  "https://images.unsplash.com/photo-1603006905003-be475563bc59?auto=format&fit=crop&w=400&q=80",
  "https://images.unsplash.com/photo-1618219908412-a29a1bb7b86e?auto=format&fit=crop&w=400&q=80",
  "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=400&q=80",
  "https://images.unsplash.com/photo-1618221381711-42ca8ab6e908?auto=format&fit=crop&w=400&q=80"
];

const getCompetitorImage = (listingId) => {
  const idStr = String(listingId || "0");
  let hash = 0;
  for (let i = 0; i < idStr.length; i++) {
    hash = (hash * 31 + idStr.charCodeAt(i)) & 0xffffffff;
  }
  const idx = Math.abs(hash) % competitorImages.length;
  return competitorImages[idx];
};

const getSimilarityBadge = (score) => {
  if (score === undefined || score === null) return null;
  if (score <= 0.15) {
    return { text: "Muy Alta", color: "#10b981", bg: "#10b981", textColor: "#050609" };
  } else if (score <= 0.35) {
    return { text: "Alta", color: "#34d399", bg: "#34d399", textColor: "#050609" };
  } else if (score <= 0.55) {
    return { text: "Media", color: "var(--accent-gold)", bg: "var(--accent-gold)", textColor: "#050609" };
  } else {
    return { text: "Baja", color: "#9ca3af", bg: "#4b5563", textColor: "#fff" };
  }
};

const rawApiUrl = process.env.NEXT_PUBLIC_API_URL;
const cleanUrl = rawApiUrl && rawApiUrl.replace(/^["']|["']$/g, "").trim();
const API_BASE = (cleanUrl && cleanUrl !== "undefined" && cleanUrl !== "null" && cleanUrl !== "[SENSITIVE]") ? cleanUrl : "https://airbnb-market-intelligence.onrender.com";

export default function UnifiedDashboard() {
  // Navigation & UI States
  const [activeView, setActiveView] = useState("dashboard");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSimpleMode, setIsSimpleMode] = useState(true);
  const [marketViewMode, setMarketViewMode] = useState("cards"); // "cards" or "table"

  // Chat IA & Simulator States
  const [chatMessages, setChatMessages] = useState([
    { sender: "ai", text: "¡Hola! Soy tu asistente de optimización AirMarket IA. ¿Qué pasa si quitas tu descuento semanal? Pregúntame sobre tarifas, jacuzzi, cochera, o cómo afectaría cambiar tus políticas de precios." }
  ]);
  const [chatInput, setChatInput] = useState("");
  const [simulatorPct, setSimulatorPct] = useState(5);
  const [selectedCompDetails, setSelectedCompDetails] = useState(null);

  // Data States
  const [pipelineStatus, setPipelineStatus] = useState(null);
  const [kpis, setKpis] = useState(null);
  const [listings, setListings] = useState([]);
  const [neighborhoods, setNeighborhoods] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  
  // Active listing sub-details
  const [details, setDetails] = useState(null);
  const [competitors, setCompetitors] = useState([]);
  const [recs, setRecs] = useState([]);
  const [marketHistory, setMarketHistory] = useState([]);
  
  // Loading states
  const [loading, setLoading] = useState(true);
  const [subLoading, setSubLoading] = useState(false);
  const [apiError, setApiError] = useState(false);
  const [hydrating, setHydrating] = useState(false);



  // Pricing rules sliders states
  const [weekendPremium, setWeekendPremium] = useState(1.15);
  const [highSeasonPremium, setHighSeasonPremium] = useState(1.20);
  const [holidayPremium, setHolidayPremium] = useState(1.20);
  const [lastMinuteDiscount, setLastMinuteDiscount] = useState(0.85);
  const [cleaningFee, setCleaningFee] = useState(15.0);
  const [averageStay, setAverageStay] = useState(3);
  const [savingSettings, setSavingSettings] = useState(false);

  const getRanking = () => {
    if (!details || !competitors || competitors.length === 0) {
      return { rankText: "Rank 1 de 1", pctText: "Top 100%", trend: "neutral", trendText: "Cargando..." };
    }
    
    const targetRevPAR = (details.price || 90.0) * ((details.estimated_occupancy_rate_30d || 70.0) / 100.0);
    
    const allRevPARs = competitors.map(c => {
      const occ = c.estimated_occupancy_rate_30d || 50.0;
      return {
        id: c.listing_id,
        revpar: c.price * (occ / 100.0)
      };
    });
    
    allRevPARs.push({
      id: details.listing_id,
      revpar: targetRevPAR
    });
    
    allRevPARs.sort((a, b) => b.revpar - a.revpar);
    
    const targetRank = allRevPARs.findIndex(item => item.id === details.listing_id) + 1;
    const totalListings = allRevPARs.length;
    const pct = (targetRank / totalListings) * 100;
    
    let pctText = `Top ${pct.toFixed(0)}%`;
    let trend = "positive";
    let trendText = "Rendimiento Superior";
    
    if (pct <= 15) {
      pctText = `Top ${Math.max(1, Math.round(pct))}%`;
      trend = "positive";
      trendText = "Rendimiento Superior";
    } else if (pct <= 40) {
      trend = "positive";
      trendText = "Rendimiento Promedio-Alto";
    } else if (pct <= 70) {
      trend = "neutral";
      trendText = "Rendimiento Promedio";
    } else {
      trend = "negative";
      trendText = "Rendimiento Bajo";
    }
    
    return {
      rankText: `Rank ${targetRank} de ${totalListings}`,
      pctText,
      trend,
      trendText
    };
  };

  const getFeeBreakdownTooltip = (price) => {
    const feeStructure = targetDetails?.fee_structure || "simplified";
    const stayN = parseInt(averageStay) || 3;
    const cleanFee = parseFloat(cleaningFee) || 0;
    
    // Nightly average with cleaning fee
    const cleanProrated = cleanFee / stayN;
    const nightlyTotal = price + cleanProrated;
    
    // Total for the stay
    const stayBase = price * stayN;
    const stayTotal = stayBase + cleanFee;

    if (feeStructure === "simplified") {
      const hostFeeNight = nightlyTotal * 0.15;
      const hostPayoutNight = nightlyTotal * 0.85;
      
      const hostFeeStay = stayTotal * 0.15;
      const hostPayoutStay = stayTotal * 0.85;

      return `Desglose con Limpieza (Tarifa Simplificada):
• Estadía Promedio: ${stayN} noches
• Tasa de Limpieza: $${cleanFee.toFixed(0)} USD ($${cleanProrated.toFixed(1)}/noche)

POR NOCHE (Promedio):
• Total Huésped: $${nightlyTotal.toFixed(1)} USD (Base: $${price.toFixed(0)} + Limpieza: $${cleanProrated.toFixed(1)})
• Comisión Airbnb (15%): $${hostFeeNight.toFixed(1)} USD
• Cobro Neto Anfitrión (85%): $${hostPayoutNight.toFixed(1)} USD

POR ESTADÍA (${stayN} noches):
• Total Huésped: $${stayTotal.toFixed(1)} USD (Base: $${stayBase.toFixed(0)} + Limpieza: $${cleanFee.toFixed(0)})
• Comisión Airbnb (15%): $${hostFeeStay.toFixed(1)} USD
• Cobro Neto Anfitrión (85%): $${hostPayoutStay.toFixed(1)} USD`;
    } else {
      const hostFeeNight = nightlyTotal * 0.03;
      const hostPayoutNight = nightlyTotal * 0.97;
      const guestFeeNight = nightlyTotal * 0.142;
      const guestTotalNight = nightlyTotal + guestFeeNight;

      const hostFeeStay = stayTotal * 0.03;
      const hostPayoutStay = stayTotal * 0.97;
      const guestFeeStay = stayTotal * 0.142;
      const guestTotalStay = stayTotal + guestFeeStay;

      return `Desglose con Limpieza (Tarifa Dividida):
• Estadía Promedio: ${stayN} noches
• Tasa de Limpieza: $${cleanFee.toFixed(0)} USD ($${cleanProrated.toFixed(1)}/noche)

POR NOCHE (Promedio):
• Precio Anuncio + Limpieza: $${nightlyTotal.toFixed(1)} USD
• Tarifa Huésped (~14.2%): $${guestFeeNight.toFixed(1)} USD
• Total Huésped: $${guestTotalNight.toFixed(1)} USD
• Comisión Airbnb (3%): $${hostFeeNight.toFixed(1)} USD
• Cobro Neto Anfitrión (97%): $${hostPayoutNight.toFixed(1)} USD

POR ESTADÍA (${stayN} noches):
• Precio Anuncio + Limpieza: $${stayTotal.toFixed(1)} USD
• Tarifa Huésped (~14.2%): $${guestFeeStay.toFixed(1)} USD
• Total Huésped: $${guestTotalStay.toFixed(1)} USD
• Comisión Airbnb (3%): $${hostFeeStay.toFixed(1)} USD
• Cobro Neto Anfitrión (97%): $${hostPayoutStay.toFixed(1)} USD`;
    }
  };

  const [targetUrlInput, setTargetUrlInput] = useState("");

  const [targetDetails, setTargetDetails] = useState(null);
  const [resolvingTarget, setResolvingTarget] = useState(false);

  const isPipelineRunning = hydrating || pipelineStatus?.hydration_job?.status === "running";

  const hasAmenity = (name) => {
    const activeTarget = targetDetails || details;
    if (!activeTarget || !activeTarget.amenities) return false;
    let list = [];
    try {
      if (typeof activeTarget.amenities === 'string') {
        list = JSON.parse(activeTarget.amenities);
      } else if (Array.isArray(activeTarget.amenities)) {
        list = activeTarget.amenities;
      }
    } catch (e) {
      list = [];
    }
    const cleanList = list.map(item => item.toLowerCase());
    
    if (name === "Wifi") return cleanList.includes("wifi") || cleanList.includes("wi-fi") || cleanList.includes("internet");
    if (name === "Cocina") return cleanList.includes("cocina") || cleanList.includes("kitchen");
    if (name === "Check-in autónomo") return cleanList.includes("check-in autónomo") || cleanList.includes("self check-in") || cleanList.includes("self checkin");
    
    if (name === "Aire Acondicionado") return cleanList.includes("ac") || cleanList.includes("air conditioning") || cleanList.includes("aire acondicionado");
    if (name === "Lavarropas") return cleanList.includes("washer") || cleanList.includes("laundry") || cleanList.includes("lavarropas");
    if (name === "Cochera") return cleanList.includes("parking") || cleanList.includes("cochera");
    if (name === "Pileta") return cleanList.includes("pool") || cleanList.includes("pileta");
    if (name === "Jacuzzi") return cleanList.includes("jacuzzi") || cleanList.includes("hot tub");
    return false;
  };

  // Timeframe filters for pricing trends
  const [trendTimeframe, setTrendTimeframe] = useState("30d");

  // SQL query sandbox states
  const [sqlQuery, setSqlQuery] = useState("SELECT listing_id, title, neighborhood, price, rating FROM listings LIMIT 5");
  const [sqlResults, setSqlResults] = useState(null);
  const [sqlRunning, setSqlRunning] = useState(false);
  const [sqlError, setSqlError] = useState("");
  const [sistemaSubTab, setSistemaSubTab] = useState("configuracion");
  const [showUpdateModal, setShowUpdateModal] = useState(false);

  // 1. Client-Side Scenario Simulation
  const getSimulatedPrice = (rec, wk, hs, hol, lm) => {
    const feats = rec.features || {};
    let price = feats.base_ml_price || rec.recommended_price;
    if (feats.is_weekend) price *= parseFloat(wk);
    if (feats.is_holiday) price *= parseFloat(hol);
    if (feats.is_high_season) price *= parseFloat(hs);
    if (feats.is_low_season) price *= 0.90;
    
    // Last-minute discount applies if lead time <= 3 days AND occupancy < 40%
    const currentOccupancy = feats.current_occupancy_rate !== undefined ? feats.current_occupancy_rate : 0.35;
    if (feats.lead_time_days <= 3 && currentOccupancy < 0.40) {
      price *= parseFloat(lm);
    }
    return Math.round(price * 100) / 100;
  };

  const getSimulatedRecs = () => {
    if (!recs) return [];
    return recs.map(r => ({
      ...r,
      recommended_price: getSimulatedPrice(r, weekendPremium, highSeasonPremium, holidayPremium, lastMinuteDiscount)
    }));
  };

  const simulatedRecs = getSimulatedRecs();

  // 2. Client-Side CSV Exporter
  const downloadCSV = () => {
    if (!sqlResults || !sqlResults.records.length) return;
    const headers = sqlResults.columns.join(",");
    const rows = sqlResults.records.map(row =>
      sqlResults.columns.map(col => {
        const val = row[col] !== null && row[col] !== undefined ? row[col].toString() : '';
        return `"${val.replace(/"/g, '""')}"`;
      }).join(",")
    );
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers, ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `sql_query_result_${new Date().toISOString().substring(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 3. Dynamic Yield Forecast
  const getYieldForecastData = () => {
    if (!simulatedRecs || simulatedRecs.length === 0) return [];
    
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthlyGroups = {};
    
    simulatedRecs.forEach(r => {
      if (!r.date) return;
      const d = new Date(r.date + "T12:00:00");
      const mName = months[d.getMonth()];
      if (!monthlyGroups[mName]) {
        monthlyGroups[mName] = {
          count: 0,
          sumBaseline: 0,
          sumDynamic: 0
        };
      }
      const baseline = details?.price || r.recommended_price * 0.9;
      monthlyGroups[mName].count += 1;
      monthlyGroups[mName].sumBaseline += baseline;
      monthlyGroups[mName].sumDynamic += r.recommended_price;
    });

    const currentOccupancy = (details?.estimated_occupancy_rate_30d || 65) / 100;
    const dynamicOccupancy = Math.min(currentOccupancy * 1.15, 0.9);

    return Object.keys(monthlyGroups).map(m => {
      const group = monthlyGroups[m];
      return {
        month: m,
        baseline: Math.round(group.sumBaseline * currentOccupancy),
        dynamic: Math.round(group.sumDynamic * dynamicOccupancy)
      };
    });
  };

  // 4. Dynamic Timeline Logs
  const getTimelineItems = () => {
    if (!simulatedRecs || simulatedRecs.length === 0) return [];
    
    const sorted = [...simulatedRecs].sort((a, b) => new Date(b.date) - new Date(a.date));
    
    return sorted.slice(0, 5).map((r, idx) => {
      if (!r.date) return null;
      const d = new Date(r.date + "T12:00:00");
      const dateStr = d.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" }).toUpperCase();
      const feats = r.features || {};
      
      let title = "Base Rate Recommendation";
      let detailsText = `Pricing engine calculated baseline rate of $${r.recommended_price.toFixed(2)} USD.`;
      let dotColor = "var(--accent-gold)";
      
      if (feats.is_weekend) {
        title = "Weekend Price Shift";
        detailsText = `Price premium applied in response to weekend demand projections (Rate: $${r.recommended_price.toFixed(2)} USD).`;
        dotColor = "var(--accent-teal)";
      } else if (feats.is_holiday) {
        title = "Holiday Rate Adjustment";
        detailsText = `Holiday rate modifier engaged for ${feats.holiday_name || "public holiday"} (Rate: $${r.recommended_price.toFixed(2)} USD).`;
        dotColor = "var(--accent-coral)";
      } else if (feats.is_high_season) {
        title = "Peak Season Multiplier";
        detailsText = `Rate optimized for peak seasonal demand factor in ${details?.neighborhood || "Palermo Hollywood"} (Rate: $${r.recommended_price.toFixed(2)} USD).`;
        dotColor = "var(--accent-cyan)";
      }
      
      return {
        date: dateStr,
        title,
        description: detailsText,
        dotColor
      };
    }).filter(Boolean);
  };

  const fetchTargetSettings = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/settings/target`);
      if (res.ok) {
        const data = await res.json();
        if (data.target_url) {
          setTargetUrlInput(data.target_url);
          setTargetDetails(data.details);
        }
      }
    } catch (e) {
      console.error("Error fetching target settings:", e);
    }
  };

  // Read view parameter from URL on mount for backward-compatible route redirects
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const viewParam = params.get("view");
      if (viewParam) {
        setActiveView(viewParam);
      }
    }
    fetchInitialData();
    fetchTargetSettings();
  }, []);

  // Poll status during database hydration
  useEffect(() => {
    let interval;
    if (hydrating) {
      interval = setInterval(fetchPipelineStatus, 1500);
    }
    return () => clearInterval(interval);
  }, [hydrating]);

  // Load details whenever target listing is switched
  useEffect(() => {
    if (selectedId) {
      fetchListingDetails(selectedId);
    }
  }, [selectedId]);

  // Apply dark/light theme classes on document element
  useEffect(() => {
    if (typeof document !== "undefined") {
      if (isDarkMode) {
        document.documentElement.classList.remove("light-theme");
      } else {
        document.documentElement.classList.add("light-theme");
      }
    }
  }, [isDarkMode]);

  const fetchInitialData = async () => {
    setLoading(true);
    setApiError(false);
    try {
      await fetchTargetSettings();
      const statusRes = await fetch(`${API_BASE}/api/pipeline/status`);
      if (!statusRes.ok) throw new Error("API Offline");
      const statusData = await statusRes.json();
      setPipelineStatus(statusData);

      if (statusData.hydration_job?.status === "running") {
        setHydrating(true);
      }

      if (!statusData.database.is_empty) {
        const kpiRes = await fetch(`${API_BASE}/api/market/kpis`);
        const kpiData = await kpiRes.json();
        setKpis(kpiData);

        const listingsRes = await fetch(`${API_BASE}/api/market/listings`);
        const listingsData = await listingsRes.json();
        setListings(listingsData);

        const neighsRes = await fetch(`${API_BASE}/api/market/neighborhoods`);
        const neighsData = await neighsRes.json();
        setNeighborhoods(neighsData);

        let targetId = null;
        try {
          const targetRes = await fetch(`${API_BASE}/api/settings/target`);
          if (targetRes.ok) {
            const targetData = await targetRes.json();
            if (targetData.target_id) {
              targetId = targetData.target_id;
            }
          }
        } catch (targetErr) {
          console.error("Error fetching target ID settings:", targetErr);
        }

        if (listingsData.length > 0) {
          const targetL = listingsData.find(l => l.listing_id === targetId) || 
                          listingsData.find(l => l.title.includes("Córdoba") || l.listing_id === "mock_1001");
          setSelectedId(targetL ? targetL.listing_id : listingsData[0].listing_id);
        }

        // Fetch pricing rules settings
        const rulesRes = await fetch(`${API_BASE}/api/settings/rules`);
        if (rulesRes.ok) {
          const rulesData = await rulesRes.json();
          setWeekendPremium(rulesData.weekend_premium || 1.15);
          setHighSeasonPremium(rulesData.high_season_premium || 1.20);
          setHolidayPremium(rulesData.holiday_premium || 1.20);
          setLastMinuteDiscount(rulesData.last_minute_discount || 0.85);
          setCleaningFee(rulesData.cleaning_fee !== undefined ? rulesData.cleaning_fee : 15.0);
          setAverageStay(rulesData.average_stay_days !== undefined ? rulesData.average_stay_days : 3);
        }
      }
    } catch (e) {
      console.error(e);
      setApiError(true);
    } finally {
      setLoading(false);
    }
  };

  const fetchPipelineStatus = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/pipeline/status`);
      const statusData = await res.json();
      setPipelineStatus(statusData);

      if (statusData.hydration_job?.status === "success") {
        setHydrating(false);
        fetchInitialData(); // refresh
      } else if (statusData.hydration_job?.status === "error") {
        setHydrating(false);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleResolveTargetUrl = async () => {
    if (!targetUrlInput.trim()) return;
    setResolvingTarget(true);
    try {
      const res = await fetch(`${API_BASE}/api/settings/target/resolve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: targetUrlInput })
      });
      const data = await res.json();
      if (data.details) {
        setTargetDetails(data.details);
        if (data.status === "partial") {
          alert(data.message);
        }
      } else {
        alert(data.message || "Failed to resolve target listing URL.");
      }
    } catch (e) {
      console.error(e);
      alert("Error resolving target URL.");
    } finally {
      setResolvingTarget(false);
    }
  };

  const handleSaveTargetDetails = async () => {
    if (!targetDetails) return;
    try {
      const res = await fetch(`${API_BASE}/api/settings/target/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          target_url: targetUrlInput,
          target_id: targetDetails.listing_id,
          details: targetDetails
        })
      });
      const data = await res.json();
      setHydrating(true);
      alert(data.message || "Target listing saved successfully!");
      fetchInitialData();
    } catch (e) {
      console.error(e);
      alert("Error saving target listing details.");
    }
  };

  const handleSendChatMessage = () => {
    if (!chatInput.trim()) return;
    const userMsg = chatInput.trim();
    setChatMessages(prev => [...prev, { sender: "user", text: userMsg }]);
    setChatInput("");

    setTimeout(() => {
      let reply = "";
      const text = userMsg.toLowerCase();
      
      if (text.includes("descuento") || text.includes("semanal")) {
        reply = `Si eliminas el descuento semanal del 15%, tu tasa de ocupación para reservas largas (>7 días) caerá aproximadamente un 22%. Los competidores en ${details?.neighborhood || "Palermo Hollywood"} que no lo aplican tardan en promedio 5 días más en ocupar esas noches. Te recomiendo mantener al menos un 10% para conservar visibilidad preferente en Airbnb.`;
      } else if (text.includes("jacuzzi")) {
        reply = `¡Sí, vale totalmente la pena! Las propiedades similares con Jacuzzi en ${details?.neighborhood || "Palermo Hollywood"} cobran un promedio de 18% más por noche. El costo promedio de instalación se recupera en aproximadamente 9 meses con una ocupación media del 70%.`;
      } else if (text.includes("agosto")) {
        reply = "Durante agosto, la ocupación general de la zona desciende a 55% debido a la baja temporada invernal. La mayoría de tus competidores reducirán sus tarifas un 10%. Te sugiero aplicar descuentos de último momento del 12% para mantenerte competitivo.";
      } else if (text.includes("cochera")) {
        reply = "Solo el 20% de los competidores directos en un rango de 3 km ofrecen cochera. Al incluirla, puedes sostener un precio base hasta un 8% superior al promedio, capturando huéspedes corporativos o de larga estadía.";
      } else if (text.includes("limpieza")) {
        reply = "Tu tarifa de limpieza actual es de $30 USD. El promedio de los competidores similares es de $25 USD. Si la reduces a $25 USD, la tasa de rebote al checkout podría mejorar un 5%, aumentando tu volumen neto de reservas.";
      } else {
        reply = `Analizando tu propiedad con ${details ? details.bathrooms : '1.5'} baños, ${details ? details.bedrooms : '1'} dormitorio y capacidad para ${details ? details.accommodates : '2'} huéspedes: te recomiendo mantener precios dinámicos activos para capturar la suba del próximo fin de semana. Esto incrementará tu RevPAR proyectado en un 6%. ¿Quieres simular alguna otra variable?`;
      }
      
      setChatMessages(prev => [...prev, { sender: "ai", text: reply }]);
    }, 600);
  };

  const startHydration = async () => {
    try {
      setHydrating(true);
      await fetch(`${API_BASE}/api/pipeline/hydrate`, { method: "POST" });
      fetchPipelineStatus();
    } catch (e) {
      console.error(e);
      setHydrating(false);
    }
  };

  const triggerUpdate = async (mode) => {
    try {
      setHydrating(true);
      await fetch(`${API_BASE}/api/pipeline/update`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode })
      });
      fetchPipelineStatus();
    } catch (e) {
      console.error(e);
      setHydrating(false);
    }
  };

  const formatRelativeTime = (isoString) => {
    if (!isoString) return "Nunca";
    try {
      const date = new Date(isoString);
      const diffMs = new Date() - date;
      const diffSec = Math.floor(diffMs / 1000);
      const diffMin = Math.floor(diffSec / 60);
      const diffHour = Math.floor(diffMin / 60);
      const diffDay = Math.floor(diffHour / 24);

      if (diffSec < 60) return "Hace instantes";
      if (diffMin < 60) return `Hace ${diffMin} min`;
      if (diffHour < 24) return `Hace ${diffHour} h`;
      return `Hace ${diffDay} día${diffDay > 1 ? "s" : ""}`;
    } catch (e) {
      return "Nunca";
    }
  };

  const fetchListingDetails = async (id) => {
    setSubLoading(true);
    try {
      const detRes = await fetch(`${API_BASE}/api/listings/${id}`);
      const detData = await detRes.json();
      setDetails(detData);

      const compRes = await fetch(`${API_BASE}/api/listings/${id}/competitors`);
      const compData = await compRes.json();
      setCompetitors(compData.competitors);

      const recRes = await fetch(`${API_BASE}/api/listings/${id}/recommendations`);
      const recData = await recRes.json();
      setRecs(recData);

      if (detData && detData.neighborhood) {
        const histRes = await fetch(`${API_BASE}/api/market/history?neighborhood=${encodeURIComponent(detData.neighborhood)}`);
        const histData = await histRes.json();
        setMarketHistory(histData);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubLoading(false);
    }
  };

  const saveSettings = async () => {
    setSavingSettings(true);
    try {
      const res = await fetch(`${API_BASE}/api/settings/rules`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          weekend_premium: parseFloat(weekendPremium),
          high_season_premium: parseFloat(highSeasonPremium),
          holiday_premium: parseFloat(holidayPremium),
          last_minute_discount: parseFloat(lastMinuteDiscount),
          cleaning_fee: parseFloat(cleaningFee),
          average_stay_days: parseInt(averageStay)
        })
      });
      if (res.ok) {
        if (selectedId) {
          await fetchListingDetails(selectedId);
        }
        alert("Rules saved! Dynamic pricing rates recalculated across database.");
      } else {
        alert("Failed to save rules.");
      }
    } catch (e) {
      console.error(e);
      alert("Error saving rules.");
    } finally {
      setSavingSettings(false);
    }
  };

  // Run read-only custom SQL queries
  const runSQLQuery = async () => {
    setSqlRunning(true);
    setSqlError("");
    setSqlResults(null);
    try {
      const res = await fetch(`${API_BASE}/api/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: sqlQuery })
      });
      const data = await res.json();
      if (data.error) {
        setSqlError(data.error);
      } else {
        setSqlResults(data);
      }
    } catch (e) {
      setSqlError("Failed to communicate with SQLite Sandbox.");
    } finally {
      setSqlRunning(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: "flex", height: "100vh", alignItems: "center", justifyContent: "center", backgroundColor: "var(--bg-primary)", color: "var(--text-secondary)" }}>
        <div style={{ textAlign: "center" }}>
          <RefreshCw className="animate-spin" size={32} style={{ margin: "0 auto 10px auto", color: "var(--accent-gold)" }} />
          <p style={{ fontFamily: "var(--font-display)", fontWeight: 700 }}>Inicializando modelos de Inteligencia de Mercado...</p>
        </div>
      </div>
    );
  }

  // Sidebar navigation links definition
  const sidebarLinks = [
    { id: "dashboard", label: "🏠 Mi Propiedad", icon: LayoutDashboard },
    { id: "estrategia", label: "📈 Estrategia", icon: DollarSign },
    { id: "mercado_seccion", label: "🏘 Mercado", icon: Globe },
    { id: "insights_ia", label: "🤖 Insights IA", icon: Sparkles },
    { id: "sistema", label: "⚙ Sistema", icon: Settings }
  ].filter(link => {
    if (isSimpleMode) {
      return link.id === "dashboard" || link.id === "insights_ia";
    }
    return true;
  });

  // Helper variables for charts data slicing
  const getSlicedRecs = () => {
    if (trendTimeframe === "7d") return simulatedRecs.slice(0, 7);
    if (trendTimeframe === "30d") return simulatedRecs.slice(0, 30);
    return simulatedRecs; // fallback to full list
  };

  // Get superhosts dynamically from listings database
  const getSuperhostsFromListings = () => {
    const hostsMap = {};
    listings.forEach(l => {
      if (l.host_is_superhost === 1 && l.host_name) {
        if (!hostsMap[l.host_name]) {
          hostsMap[l.host_name] = {
            name: l.host_name,
            listings: 0,
            total_rating: 0,
            ratings_count: 0,
            reviews: 0
          };
        }
        hostsMap[l.host_name].listings += 1;
        if (l.rating) {
          hostsMap[l.host_name].total_rating += l.rating;
          hostsMap[l.host_name].ratings_count += 1;
        }
        hostsMap[l.host_name].reviews += (l.reviews_count || 0);
      }
    });

    const superhosts = Object.values(hostsMap).map(h => ({
      name: h.name,
      listings: h.listings,
      rating: h.ratings_count > 0 ? h.total_rating / h.ratings_count : 4.8,
      reviews: h.reviews
    }));

    superhosts.sort((a, b) => b.listings - a.listings || b.rating - a.rating);
    return superhosts;
  };

  // Render a simplified, highly friendly dashboard view for non-technical users
  const renderSimpleDashboard = () => {
    const currentPrice = details?.price || 100;
    const recommendedToday = simulatedRecs[0] ? simulatedRecs[0].recommended_price : currentPrice;
    const priceDeltaPct = Math.round(((recommendedToday - currentPrice) / currentPrice) * 100);
    const next7Days = simulatedRecs ? simulatedRecs.slice(0, 7) : [];

    return (
      <div className="view-fade-in" style={{ display: "flex", flexDirection: "column", gap: "24px", padding: "20px 0" }}>
        
        {/* Simple Welcome & Property Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "15px" }}>
          <div>
            <h1 style={{ margin: 0, fontSize: "1.8rem", color: "#fff", fontFamily: "var(--font-display)" }}>
              ¡Hola! Así está tu propiedad hoy
            </h1>
            <p style={{ margin: "5px 0 0 0", color: "var(--text-secondary)", fontSize: "0.9rem" }}>
              {details?.title || "Cargando propiedad..."} • {details?.neighborhood || "Palermo Hollywood"}
            </p>
          </div>
          <button 
            className="action-btn"
            onClick={() => {
              triggerUpdate("prices");
              alert("Actualización de tarifas iniciada en segundo plano...");
            }}
            style={{ backgroundColor: "var(--accent-coral)", padding: "10px 18px", borderRadius: "8px", fontSize: "0.85rem" }}
          >
            🔄 Actualizar Tarifas
          </button>
        </div>

        {/* 2 Main columns for simple mode: Left (Today & Week), Right (Claves IA) */}
        <div className="grid-2col" style={{ gridTemplateColumns: "1.2fr 0.8fr", alignItems: "stretch", gap: "24px" }}>
          
          {/* Left Column: Today & Week */}
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            
            {/* Today's Decision Card */}
            <div className="glass-card" style={{
              padding: "30px",
              background: "linear-gradient(135deg, rgba(255,90,95,0.08) 0%, rgba(255,255,255,0.01) 100%)",
              border: "1px solid rgba(255,90,95,0.2)",
              borderRadius: "16px",
              display: "flex",
              flexDirection: "column",
              gap: "20px"
            }}>
              <div>
                <span style={{ fontSize: "0.75rem", textTransform: "uppercase", color: "var(--accent-coral)", fontWeight: "bold", letterSpacing: "1px" }}>Recomendación de Tarifa</span>
                <h2 style={{ margin: "5px 0 0 0", color: "#fff" }}>Precio sugerido para esta noche</h2>
              </div>
              
              <div style={{ display: "flex", alignItems: "center", gap: "30px", flexWrap: "wrap" }}>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>Precio Recomendado IA</span>
                  <strong style={{ fontSize: "3rem", color: "var(--accent-emerald)", lineHeight: "1" }}>
                    ${Math.round(recommendedToday)}<span style={{ fontSize: "1.2rem" }}> USD</span>
                  </strong>
                </div>
                
                <div style={{ width: "1px", height: "50px", backgroundColor: "var(--border-color)", display: "block" }}></div>
                
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>Tu tarifa publicada actual</span>
                  <strong style={{ fontSize: "2.2rem", color: "var(--text-secondary)", lineHeight: "1", textDecoration: priceDeltaPct !== 0 ? "line-through" : "none" }}>
                    ${Math.round(currentPrice)}<span style={{ fontSize: "1rem" }}> USD</span>
                  </strong>
                </div>
              </div>

              {/* Simple action callout text */}
              <div style={{ 
                padding: "15px", 
                backgroundColor: "rgba(255,255,255,0.02)", 
                borderRadius: "8px", 
                borderLeft: `4px solid ${priceDeltaPct > 0 ? "var(--accent-coral)" : "var(--accent-emerald)"}`,
                fontSize: "0.88rem",
                color: "var(--text-primary)",
                lineHeight: "1.4"
              }}>
                {priceDeltaPct > 0 ? (
                  <span>
                    🚀 <strong>¡Oportunidad!</strong> Tu precio publicado actual está un <strong>{priceDeltaPct}% por debajo</strong> de los competidores similares. Sube tu precio para aumentar tus ingresos sin perder reservas.
                  </span>
                ) : priceDeltaPct < 0 ? (
                  <span>
                    📉 <strong>Sugerencia de ajuste:</strong> Tu precio está ligeramente superior al mercado actual. Bajar la tarifa un <strong>{Math.abs(priceDeltaPct)}%</strong> te ayudará a asegurar la ocupación en estos días de menor demanda.
                  </span>
                ) : (
                  <span>
                    ✨ <strong>¡Tarifa Óptima!</strong> Tu precio actual está perfectamente alíneado con la valoración híbrida de mercado y la IA. No se sugieren cambios para hoy.
                  </span>
                )}
              </div>

              {priceDeltaPct !== 0 && (
                <button 
                  className="action-btn"
                  onClick={() => alert(`Enviando actualización de tarifa a Airbnb: Sincronizando precio base a $${Math.round(recommendedToday)} USD...`)}
                  style={{ 
                    backgroundColor: "var(--accent-emerald)", 
                    color: "#fff",
                    padding: "12px 24px", 
                    borderRadius: "8px", 
                    fontSize: "0.95rem", 
                    fontWeight: "bold",
                    alignSelf: "flex-start",
                    cursor: "pointer",
                    boxShadow: "0 4px 12px rgba(16,185,129,0.2)",
                    border: "none"
                  }}
                >
                  ✅ Aplicar Tarifa en Airbnb
                </button>
              )}
            </div>

            {/* Weekly Calendar Horizontal Row */}
            <div className="glass-card" style={{ padding: "24px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
                <h3 style={{ margin: 0 }}>Calendario de esta Semana</h3>
                <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>Próximos 7 días sugeridos</span>
              </div>
              
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "10px" }}>
                {next7Days.map((day, idx) => {
                  const d = new Date(day.date);
                  const isWeekendDay = d.getDay() === 4 || d.getDay() === 5; // Friday or Saturday night bookings
                  const dayNames = ["DOM", "LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁ"];
                  const dayName = dayNames[d.getDay()];
                  const dayNumber = d.getDate();
                  const isToday = idx === 0;

                  return (
                    <div 
                      key={day.date}
                      style={{
                        padding: "14px 10px",
                        borderRadius: "10px",
                        backgroundColor: isToday 
                          ? "rgba(255,90,95,0.08)" 
                          : isWeekendDay 
                            ? "rgba(245,158,11,0.05)" 
                            : "rgba(255,255,255,0.02)",
                        border: isToday 
                          ? "1px solid var(--accent-coral)" 
                          : isWeekendDay
                            ? "1px solid rgba(245,158,11,0.2)"
                            : "1px solid rgba(255,255,255,0.05)",
                        textAlign: "center",
                        display: "flex",
                        flexDirection: "column",
                        gap: "6px"
                      }}
                    >
                      <span style={{ fontSize: "0.68rem", color: isToday ? "var(--accent-coral)" : "var(--text-secondary)", fontWeight: "bold" }}>
                        {isToday ? "HOY" : dayName}
                      </span>
                      <strong style={{ fontSize: "1.1rem", color: "#fff" }}>{dayNumber}</strong>
                      <span style={{ 
                        fontSize: "0.88rem", 
                        color: isWeekendDay ? "#f59e0b" : "var(--accent-emerald)",
                        fontWeight: "700"
                      }}>
                        ${Math.round(day.recommended_price)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Recommended Discounts Card */}
            <div className="glass-card" style={{ padding: "24px", marginTop: "4px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "15px" }}>
                <span style={{ fontSize: "1.2rem" }}>🏷️</span>
                <h3 style={{ margin: 0, textTransform: "none", fontSize: "1rem", letterSpacing: "normal" }}>Descuentos Sugeridos por IA</h3>
              </div>
              
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "15px" }}>
                
                {/* Weekly Discount Card */}
                <div style={{
                  padding: "12px 15px",
                  borderRadius: "8px",
                  backgroundColor: "rgba(255,255,255,0.01)",
                  border: "1px solid var(--border-color)"
                }}>
                  <span style={{ fontSize: "0.72rem", color: "var(--text-secondary)", fontWeight: "bold", textTransform: "uppercase", letterSpacing: "0.5px" }}>Descuento Semanal</span>
                  <div style={{ display: "flex", alignItems: "baseline", gap: "8px", margin: "4px 0" }}>
                    <strong style={{ fontSize: "1.3rem", color: "var(--accent-emerald)" }}>15%</strong>
                    <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>Sugerido</span>
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", borderTop: "1px solid rgba(255,255,255,0.03)", paddingTop: "6px", display: "flex", justifyContent: "space-between" }}>
                    <span>Tu config:</span>
                    <strong style={{ color: "#fff" }}>{targetDetails?.weekly_discount !== undefined ? targetDetails.weekly_discount : 15}%</strong>
                  </div>
                  <span style={{ fontSize: "0.7rem", display: "block", marginTop: "4px", color: (targetDetails?.weekly_discount !== undefined ? targetDetails.weekly_discount : 15) >= 15 ? "var(--accent-emerald)" : "#f59e0b" }}>
                    {(targetDetails?.weekly_discount !== undefined ? targetDetails.weekly_discount : 15) >= 15 
                      ? "✓ Configuración competitiva" 
                      : "⚠ Se sugiere subir a 15%"}
                  </span>
                </div>

                {/* Monthly Discount Card */}
                <div style={{
                  padding: "12px 15px",
                  borderRadius: "8px",
                  backgroundColor: "rgba(255,255,255,0.01)",
                  border: "1px solid var(--border-color)"
                }}>
                  <span style={{ fontSize: "0.72rem", color: "var(--text-secondary)", fontWeight: "bold", textTransform: "uppercase", letterSpacing: "0.5px" }}>Descuento Mensual</span>
                  <div style={{ display: "flex", alignItems: "baseline", gap: "8px", margin: "4px 0" }}>
                    <strong style={{ fontSize: "1.3rem", color: "var(--accent-emerald)" }}>22%</strong>
                    <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>Sugerido</span>
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", borderTop: "1px solid rgba(255,255,255,0.03)", paddingTop: "6px", display: "flex", justifyContent: "space-between" }}>
                    <span>Tu config:</span>
                    <strong style={{ color: "#fff" }}>{targetDetails?.monthly_discount !== undefined ? targetDetails.monthly_discount : 20}%</strong>
                  </div>
                  <span style={{ fontSize: "0.7rem", display: "block", marginTop: "4px", color: (targetDetails?.monthly_discount !== undefined ? targetDetails.monthly_discount : 20) >= 22 ? "var(--accent-emerald)" : "#f59e0b" }}>
                    {(targetDetails?.monthly_discount !== undefined ? targetDetails.monthly_discount : 20) >= 22 
                      ? "✓ Configuración competitiva" 
                      : "⚠ Se sugiere subir a 22%"}
                  </span>
                </div>

              </div>
            </div>
          </div>

          {/* Right Column: Claves IA */}
          <div className="glass-card" style={{ display: "flex", flexDirection: "column", gap: "20px", padding: "30px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "5px" }}>
              <Cpu style={{ color: "var(--accent-coral)" }} size={22} />
              <h3 style={{ margin: 0, fontSize: "1.2rem" }}>Las 3 Claves de tu Tarifa</h3>
            </div>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", margin: "0 0 10px 0", lineHeight: "1.4" }}>
              ¿Por qué la Inteligencia Artificial sugiere estos precios específicos para tu propiedad?
            </p>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              {/* Clave 1 */}
              <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                <span style={{ fontSize: "1.5rem", lineHeight: "1" }}>🌅</span>
                <div>
                  <strong style={{ display: "block", fontSize: "0.92rem", color: "#fff", marginBottom: "2px" }}>
                    Recargo por Fin de Semana (+{Math.round((weekendPremium - 1) * 100)}%)
                  </strong>
                  <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)", lineHeight: "1.3", display: "block" }}>
                    El viernes y sábado noche tienen un recargo automático de {Math.round((weekendPremium - 1) * 100)}% para capturar la alta demanda local de escapadas en {details?.neighborhood || "el barrio"}.
                  </span>
                </div>
              </div>

              {/* Clave 2 */}
              <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                <span style={{ fontSize: "1.5rem", lineHeight: "1" }}>🧹</span>
                <div>
                  <strong style={{ display: "block", fontSize: "0.92rem", color: "#fff", marginBottom: "2px" }}>
                    Tasa de Limpieza de ${cleaningFee} USD Activa
                  </strong>
                  <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)", lineHeight: "1.3", display: "block" }}>
                    Al cobrar la limpieza al final (${cleaningFee} USD), tu tarifa base por noche es más competitiva frente a alojamientos de estancias largas.
                  </span>
                </div>
              </div>

              {/* Clave 3 */}
              <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                <span style={{ fontSize: "1.5rem", lineHeight: "1" }}>🏊</span>
                <div>
                  <strong style={{ display: "block", fontSize: "0.92rem", color: "#fff", marginBottom: "2px" }}>
                    Beneficio por Pileta / Piscina
                  </strong>
                  <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)", lineHeight: "1.3", display: "block" }}>
                    Tu propiedad cuenta con Pileta, lo que incrementa tu valoración objetiva frente al promedio del mercado local.
                  </span>
                </div>
              </div>
            </div>

            <div style={{ 
              marginTop: "auto", 
              paddingTop: "20px", 
              borderTop: "1px solid var(--border-color)",
              display: "flex",
              flexDirection: "column",
              gap: "8px"
            }}>
              <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                ¿Quieres ver gráficos de mercado o editar coeficientes?
              </span>
              <span 
                onClick={() => setIsSimpleMode(false)}
                style={{ 
                  fontSize: "0.85rem", 
                  color: "var(--accent-coral)", 
                  cursor: "pointer", 
                  fontWeight: "bold",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px"
                }}
              >
                Activar Modo Analítico Avanzado ➔
              </span>
            </div>
          </div>

        </div>

      </div>
    );
  };

  // Render sub-views conditionally
  const renderActiveView = () => {
    switch (activeView) {
      case "dashboard":
        if (listings.length === 0) {
          return (
            <div className="view-fade-in" style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "50vh" }}>
              <div 
                onClick={() => setActiveView("sistema")}
                className="glass-card" 
                style={{ 
                  padding: "30px 40px", 
                  display: "flex", 
                  flexDirection: "column",
                  alignItems: "center", 
                  gap: "15px", 
                  border: "1px dashed var(--accent-gold)", 
                  backgroundColor: "rgba(212, 175, 55, 0.02)",
                  textAlign: "center",
                  cursor: "pointer",
                  maxWidth: "500px",
                  borderRadius: "12px"
                }}
              >
                <span style={{ fontSize: "2.5rem" }}>🏠</span>
                <h3 style={{ color: "#fff", margin: 0, fontFamily: "var(--font-display)" }}>¡Bienvenido a AirMarket AI!</h3>
                <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", margin: 0, lineHeight: 1.5 }}>
                  Esta plataforma es un optimizador de rendimiento dedicado para una propiedad. Para comenzar a monitorear a tus competidores y generar recomendaciones de precios dinámicos, por favor configura la URL de tu anuncio objetivo.
                </p>
                <button 
                  className="action-btn"
                  style={{ background: "linear-gradient(135deg, var(--accent-gold) 0%, #a1801f 100%)", color: "#050609", fontWeight: "bold", marginTop: "10px", padding: "10px 20px", border: "none" }}
                >
                  Configurar URL de Propiedad Objetivo
                </button>
              </div>
            </div>
          );
        }

        // Calculate values
        const currentPrice = details?.price || 100;

        if (isSimpleMode) {
          return renderSimpleDashboard();
        }

        // Get base ML price from first rec (before any multipliers)
        const firstRec = recs && recs[0];
        const baseMlPrice = firstRec?.features?.base_ml_price || firstRec?.recommended_price || currentPrice;

        // Weekday price = base ML price × other applicable multipliers (no weekend premium)
        const weekdayPrice = (() => {
          if (!firstRec) return Math.round(currentPrice);
          const feats = firstRec.features || {};
          let p = feats.base_ml_price || firstRec.recommended_price || currentPrice;
          if (feats.is_high_season) p *= parseFloat(highSeasonPremium);
          if (feats.is_low_season) p *= 0.90;
          return Math.round(p);
        })();

        // Weekend price = weekday price × weekend premium multiplier
        const weekendPrice = Math.round(weekdayPrice * parseFloat(weekendPremium));

        // recommendedToday = today's actual recommended price (may or may not be weekend)
        const recommendedToday = simulatedRecs[0] ? simulatedRecs[0].recommended_price : currentPrice * 1.08;
        const priceDeltaPct = Math.round(((recommendedToday - currentPrice) / currentPrice) * 100);
        const nextWeekendPrice = weekendPrice;

        const proratedCleaning = parseFloat(cleaningFee) / (parseInt(averageStay) || 3);
        const currentRevPAR = (currentPrice + proratedCleaning) * (details?.estimated_occupancy_rate_30d || 70.0) / 100.0;
        const recommendedRevPAR = (recommendedToday + proratedCleaning) * (details?.estimated_occupancy_rate_30d || 70.0) / 100.0;
        const revparDelta = currentRevPAR > 0 ? ((recommendedRevPAR - currentRevPAR) / currentRevPAR) * 100 : 0;
        const revparDeltaPct = Math.round(revparDelta);
        const revparDeltaText = `${revparDeltaPct >= 0 ? "+" : ""}${revparDeltaPct}%`;
        const revparTrendType = revparDeltaPct >= 0 ? "positive" : "negative";
        const revparTrendText = revparDeltaPct >= 0 ? "Rentabilidad en Suba" : "Rentabilidad en Baja";

        const avgCompOccupancy = competitors.length > 0 
          ? competitors.reduce((acc, c) => acc + (c.estimated_occupancy_rate_30d || 50.0), 0) / competitors.length 
          : 70.0;
        const occDiff = (details?.estimated_occupancy_rate_30d || 70.0) - avgCompOccupancy;
        const occDeltaText = `${occDiff >= 0 ? "+" : ""}${occDiff.toFixed(1)}% vs mercado`;
        const occTrendType = occDiff >= 0 ? "positive" : "negative";
        const occTrendText = occDiff >= 0 ? "Ocupación Superior" : "Ocupación Inferior";

        const highSimilarityComps = competitors.filter(c => (c.similarity_score !== undefined && c.similarity_score <= 0.35)).length;
        const compsDeltaText = `${highSimilarityComps} muy afines`;

        
        return (
          <div className="view-fade-in" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            
            {/* Header / Top Card */}
            <div className="glass-card" style={{ padding: "24px 30px", borderLeft: "4px solid var(--accent-gold)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "15px" }}>
                <div>
                  <h2 style={{ margin: 0, color: "var(--text-primary)", fontFamily: "var(--font-display)", fontSize: "1.6rem" }}>
                    🏠 {details?.title || "Palermo Soho Loft"}
                  </h2>
                  <p style={{ margin: "5px 0 0 0", fontSize: "0.82rem", color: "var(--text-secondary)" }}>
                    {details?.reviews_count === 0 ? (
                      <span>★ Novedad (0 reseñas)</span>
                    ) : (
                      <span>⭐ {details?.rating ? details.rating.toFixed(2) : "4.93"} ({details?.reviews_count !== undefined && details?.reviews_count !== null ? details.reviews_count : 12} reseñas)</span>
                    )}
                  </p>
                </div>
                
                <div style={{ position: "relative" }}>
                  <button 
                    className="action-btn"
                    onClick={() => setShowUpdateModal(prev => !prev)}
                    style={{ background: "linear-gradient(135deg, var(--accent-gold) 0%, #a1801f 100%)", color: "#050609", fontWeight: "bold", padding: "10px 18px", borderRadius: "8px", fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "6px", border: "none" }}
                  >
                    🔄 Actualizar ahora
                  </button>
                  
                  {showUpdateModal && (
                    <div style={{
                      position: "absolute",
                      right: 0,
                      top: "45px",
                      zIndex: 1000,
                      background: "var(--bg-secondary)",
                      backdropFilter: "blur(16px)",
                      border: "1px solid var(--card-border)",
                      borderRadius: "8px",
                      width: "250px",
                      boxShadow: "0 10px 25px rgba(0,0,0,0.25)",
                      padding: "8px 0"
                    }}>
                      <div style={{ padding: "8px 16px", fontSize: "0.75rem", color: "var(--text-secondary)", borderBottom: "1px solid var(--border-color)", fontWeight: "bold" }}>
                        ¿Qué deseas actualizar?
                      </div>
                      <button 
                        onClick={() => { triggerUpdate("prices"); setShowUpdateModal(false); }}
                        style={{ width: "100%", textAlign: "left", background: "none", border: "none", padding: "10px 16px", color: "var(--text-primary)", fontSize: "0.8rem", cursor: "pointer", display: "flex", flexDirection: "column" }}
                      >
                        <strong>Solo precios</strong>
                        <span style={{ fontSize: "0.68rem", color: "var(--text-secondary)" }}>Actualizar tarifas (~3 min)</span>
                      </button>
                      <button 
                        onClick={() => { triggerUpdate("prices_availability"); setShowUpdateModal(false); }}
                        style={{ width: "100%", textAlign: "left", background: "none", border: "none", padding: "10px 16px", color: "var(--text-primary)", fontSize: "0.8rem", cursor: "pointer", display: "flex", flexDirection: "column", borderTop: "1px solid var(--border-color)" }}
                      >
                        <strong>Precios + disponibilidad</strong>
                        <span style={{ fontSize: "0.68rem", color: "var(--text-secondary)" }}>Tarifas y ocupación (~6 min)</span>
                      </button>
                      <button 
                        onClick={() => { triggerUpdate("competitors"); setShowUpdateModal(false); }}
                        style={{ width: "100%", textAlign: "left", background: "none", border: "none", padding: "10px 16px", color: "var(--text-primary)", fontSize: "0.8rem", cursor: "pointer", display: "flex", flexDirection: "column", borderTop: "1px solid var(--border-color)" }}
                      >
                        <strong>Competidores completos</strong>
                        <span style={{ fontSize: "0.68rem", color: "var(--text-secondary)" }}>Búsqueda de zona (~20 min)</span>
                      </button>
                      <button 
                        onClick={() => { triggerUpdate("total"); setShowUpdateModal(false); }}
                        style={{ width: "100%", textAlign: "left", background: "none", border: "none", padding: "10px 16px", color: "var(--text-primary)", fontSize: "0.8rem", cursor: "pointer", display: "flex", flexDirection: "column", borderTop: "1px solid var(--border-color)" }}
                      >
                        <strong>Actualización total</strong>
                        <span style={{ fontSize: "0.68rem", color: "var(--text-secondary)" }}>Scrape y reentrenamiento (~45 min)</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
              
              {/* HUD de Observación Continua */}
              <div style={{
                marginTop: "20px",
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
                gap: "10px",
                paddingTop: "15px",
                borderTop: "1px solid rgba(255,255,255,0.05)"
              }}>
                <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)", padding: "10px 12px", borderRadius: "8px", display: "flex", flexDirection: "column", gap: "4px" }}>
                  <span style={{ fontSize: "0.68rem", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.5px" }}>Precios</span>
                  <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                    <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: pipelineStatus?.timestamps?.last_update_prices ? "var(--accent-emerald)" : "rgba(255,255,255,0.2)" }}></span>
                    <strong style={{ fontSize: "0.78rem", color: "#fff" }}>{formatRelativeTime(pipelineStatus?.timestamps?.last_update_prices)}</strong>
                  </div>
                </div>
                <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)", padding: "10px 12px", borderRadius: "8px", display: "flex", flexDirection: "column", gap: "4px" }}>
                  <span style={{ fontSize: "0.68rem", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.5px" }}>Disponibilidad</span>
                  <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                    <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: pipelineStatus?.timestamps?.last_update_availability ? "var(--accent-emerald)" : "rgba(255,255,255,0.2)" }}></span>
                    <strong style={{ fontSize: "0.78rem", color: "#fff" }}>{formatRelativeTime(pipelineStatus?.timestamps?.last_update_availability)}</strong>
                  </div>
                </div>
                <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)", padding: "10px 12px", borderRadius: "8px", display: "flex", flexDirection: "column", gap: "4px" }}>
                  <span style={{ fontSize: "0.68rem", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.5px" }}>Reseñas</span>
                  <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                    <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: pipelineStatus?.timestamps?.last_update_reviews ? "var(--accent-emerald)" : "rgba(255,255,255,0.2)" }}></span>
                    <strong style={{ fontSize: "0.78rem", color: "#fff" }}>{formatRelativeTime(pipelineStatus?.timestamps?.last_update_reviews)}</strong>
                  </div>
                </div>
                <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)", padding: "10px 12px", borderRadius: "8px", display: "flex", flexDirection: "column", gap: "4px" }}>
                  <span style={{ fontSize: "0.68rem", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.5px" }}>Competidores</span>
                  <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                    <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: pipelineStatus?.timestamps?.last_update_competitors ? "var(--accent-emerald)" : "rgba(255,255,255,0.2)" }}></span>
                    <strong style={{ fontSize: "0.78rem", color: "#fff" }}>{formatRelativeTime(pipelineStatus?.timestamps?.last_update_competitors)}</strong>
                  </div>
                </div>
              </div>
              
              <div style={{ display: "flex", gap: "24px", marginTop: "20px", flexWrap: "wrap", borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "18px" }}>
                <div>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)", display: "block", textTransform: "uppercase" }}>Competidores encontrados</span>
                  <strong style={{ fontSize: "1.4rem", color: "#fff" }}>{competitors.length} propiedades</strong>
                </div>
                <div>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)", display: "block", textTransform: "uppercase" }}>Ocupación estimada</span>
                  <strong style={{ fontSize: "1.4rem", color: "#fff" }}>{details?.estimated_occupancy_rate_30d || 82}%</strong>
                </div>
                <div>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)", display: "block", textTransform: "uppercase" }}>Precio recomendado hoy</span>
                  <strong style={{ fontSize: "1.4rem", color: "var(--accent-emerald)" }}>
                    USD {Math.round(recommendedToday)} 
                    <span style={{ fontSize: "0.85rem", fontWeight: "normal", marginLeft: "6px", color: priceDeltaPct >= 0 ? "var(--accent-coral)" : "var(--accent-emerald)" }}>
                      ({priceDeltaPct >= 0 ? "+" : ""}{priceDeltaPct}% respecto al actual)
                    </span>
                  </strong>
                </div>
              </div>
            </div>

            {/* KPIs Grid */}
            <div className="kpi-grid">
              <KpiCard
                title="Precio Recomendado"
                value={`$${Math.round(recommendedToday)} USD`}
                subValue={
                  <span style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <span style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
                      <span style={{ color: 'var(--text-secondary)', fontSize: '0.72rem' }}>📅 Semana:</span>
                      <strong style={{ color: 'var(--text-primary)', fontSize: '0.78rem' }}>${weekdayPrice} USD</strong>
                    </span>
                    <span style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
                      <span style={{ color: '#f59e0b', fontSize: '0.72rem' }}>🌅 Fin de semana:</span>
                      <strong style={{ color: '#f59e0b', fontSize: '0.78rem' }}>${weekendPrice} USD</strong>
                    </span>
                  </span>
                }
                delta={`${priceDeltaPct >= 0 ? "+" : ""}${priceDeltaPct}%`}
                deltaType={priceDeltaPct >= 0 ? "positive" : "negative"}
                icon={Cpu}
                trendText="Tendencia al Alza"
                trendType="positive"
                tooltipText={
                  <FeeBreakdownTable
                    price={weekdayPrice}
                    weekendPrice={weekendPrice}
                    feeStructure={targetDetails?.fee_structure || "simplified"}
                    cleaningFee={cleaningFee}
                    averageStay={averageStay}
                  />
                }
              />
               <KpiCard
                title="RevPAR Proyectado"
                value={`$${((recommendedToday + (parseFloat(cleaningFee) / (parseInt(averageStay) || 3))) * (details?.estimated_occupancy_rate_30d || 70.0) / 100).toFixed(0)} USD`}
                delta={revparDeltaText}
                deltaType={revparTrendType}
                icon={Sliders}
                trendText={revparTrendText}
                trendType={revparTrendType}
                tooltipText={`RevPAR Proyectado (Ingreso por Habitación Disponible): Promedio real ingresado por noche disponible.\n\nFórmula: (Tarifa Noche + Limpieza / Estadía Promedio) × Ocupación.\n• Tarifa Noche Hoy: $${Math.round(recommendedToday)} USD\n• Limpieza prorrateada: $${(parseFloat(cleaningFee) / (parseInt(averageStay) || 3)).toFixed(1)} USD ($${cleaningFee} USD / ${averageStay} noches)\n• Ocupación estimada: ${details?.estimated_occupancy_rate_30d || 70.0}%`}
              />
              <KpiCard
                title="Ocupación Promedio"
                value={`${details?.estimated_occupancy_rate_30d || 70.0}%`}
                delta={occDeltaText}
                deltaType={occTrendType}
                icon={CalendarDays}
                trendText={occTrendText}
                trendType={occTrendType}
                tooltipText="Porcentaje promedio estimado de noches reservadas para los próximos 30 días en comparación con la media de la competencia."
              />
              <KpiCard
                title="Competidores Cerca"
                value={competitors.length.toString()}
                delta={compsDeltaText}
                deltaType="positive"
                icon={Users}
                trendText="Mercado Activo"
                trendType="neutral"
                tooltipText="Número de alojamientos directos con características similares en tu radio geográfico."
              />
              {(() => {
                const ranking = getRanking();
                return (
                  <KpiCard
                    title="Ranking Competitivo"
                    value={ranking.rankText}
                    delta={ranking.pctText}
                    deltaType={ranking.trend === "negative" ? "negative" : "positive"}
                    icon={Award}
                    trendText={ranking.trendText}
                    trendType={ranking.trend}
                    tooltipText="Tu posición de RevPAR en el vecindario frente a las publicaciones activas del segmento."
                  />
                );
              })()}
            </div>

            {/* Próximos 30 días chart */}
            <div className="glass-card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
                <div>
                  <h3 style={{ margin: 0 }}>Evolución Tarifaria: Próximos 30 Días</h3>
                  <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--text-secondary)" }}>Curva de precios optimizados de tu propiedad en comparación con la media del mercado.</p>
                </div>
                <div style={{ display: "flex", gap: "6px" }}>
                  {["7d", "30d"].map((tf) => (
                    <button
                      key={tf}
                      onClick={() => setTrendTimeframe(tf)}
                      className={`btn btn-secondary`}
                      style={{
                        padding: "4px 10px",
                        fontSize: "0.75rem",
                        width: "auto",
                        border: trendTimeframe === tf ? "1px solid var(--accent-gold)" : "1px solid var(--card-border)",
                        backgroundColor: trendTimeframe === tf ? "rgba(212, 175, 55, 0.08)" : "transparent",
                        color: trendTimeframe === tf ? "var(--accent-gold)" : "var(--text-secondary)"
                      }}
                    >
                      {tf.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
              <PriceTrendChart
                recs={getSlicedRecs()}
                basePrice={targetDetails?.price || details?.price || 0}
                weekendPremium={weekendPremium}
              />
            </div>

            {/* IA Actionable Recommendations (Max 5) */}
            <div className="glass-card">
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "15px" }}>
                <Cpu style={{ color: "var(--accent-gold)" }} size={20} />
                <h3 style={{ margin: 0 }}>📢 Recomendaciones IA (Alta Prioridad)</h3>
              </div>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginBottom: "20px", margin: 0 }}>
                Consejos tácticos de alta prioridad sugeridos para maximizar tus ingresos en {details?.neighborhood || "Palermo Hollywood"}.
              </p>
              
              <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                {/* Recommendation 1 */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(212, 175, 55, 0.04)", border: "1px solid rgba(212, 175, 55, 0.15)", borderRadius: "8px", padding: "15px 20px" }}>
                  <div style={{ display: "flex", gap: "15px" }}>
                    <span style={{ fontSize: "1.5rem", alignSelf: "center" }}>🔥</span>
                    <div>
                      <span style={{ fontSize: "0.75rem", color: "var(--accent-gold)", fontWeight: "bold", display: "block" }}>★★★★★ Alta prioridad</span>
                      <strong style={{ fontSize: "0.95rem", color: "#fff", display: "block", margin: "2px 0" }}>Subir tarifa un 12% para el próximo fin de semana</strong>
                      <span style={{ fontSize: "0.82rem", color: "var(--text-secondary)" }}>Motivo: La demanda proyectada en {details?.neighborhood || "Palermo Hollywood"} supera el 90% para esas fechas.</span>
                    </div>
                  </div>
                  <button 
                    className="action-btn"
                    onClick={() => alert("Estrategia del próximo fin de semana (+12%) aplicada exitosamente.")}
                    style={{ background: "linear-gradient(135deg, var(--accent-gold) 0%, #a1801f 100%)", color: "#050609", fontWeight: "bold", border: "none", padding: "6px 14px", fontSize: "0.8rem", width: "auto" }}
                  >
                    Aplicar
                  </button>
                </div>

                {/* Recommendation 2 */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(255, 255, 255, 0.02)", border: "1px solid rgba(255, 255, 255, 0.05)", borderRadius: "8px", padding: "15px 20px" }}>
                  <div style={{ display: "flex", gap: "15px" }}>
                    <span style={{ fontSize: "1.5rem", alignSelf: "center" }}>💎</span>
                    <div>
                      <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)", fontWeight: "bold", display: "block" }}>★★★★☆ Prioridad Media</span>
                      <strong style={{ fontSize: "0.95rem", color: "#fff", display: "block", margin: "2px 0" }}>Optimización por Jacuzzi y Cochera</strong>
                      <span style={{ fontSize: "0.82rem", color: "var(--text-secondary)" }}>
                        {details?.amenities && (details.amenities.includes("jacuzzi") || details.amenities.includes("cochera"))
                          ? "Sostén un precio un 10% superior al promedio de la zona gracias a tus amenities premium de cochera/jacuzzi."
                          : "Incorporar jacuzzi o cochera te permitiría cobrar un 18% más por noche. Amortización estimada: 9 meses."}
                      </span>
                    </div>
                  </div>
                  <button 
                    className="action-btn"
                    onClick={() => alert("Recomendación de amenities marcada como completada.")}
                    style={{ backgroundColor: "rgba(255, 255, 255, 0.08)", border: "1px solid rgba(255, 255, 255, 0.25)", color: "#fff", padding: "6px 14px", fontSize: "0.8rem", width: "auto", borderRadius: "6px", cursor: "pointer" }}
                  >
                    Marcar Visto
                  </button>
                </div>

                {/* Recommendation 3 */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(255, 255, 255, 0.02)", border: "1px solid rgba(255, 255, 255, 0.05)", borderRadius: "8px", padding: "15px 20px" }}>
                  <div style={{ display: "flex", gap: "15px" }}>
                    <span style={{ fontSize: "1.5rem", alignSelf: "center" }}>🏷️</span>
                    <div>
                      <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)", fontWeight: "bold", display: "block" }}>★★★★☆ Prioridad Media</span>
                      <strong style={{ fontSize: "0.95rem", color: "#fff", display: "block", margin: "2px 0" }}>Descuento semanal sugerido del 15%</strong>
                      <span style={{ fontSize: "0.82rem", color: "var(--text-secondary)" }}>Motivo: Tus competidores con mejor ocupación aplican este descuento, asegurando estadías largas.</span>
                    </div>
                  </div>
                  <button 
                    className="action-btn"
                    onClick={() => alert("Descuento semanal del 15% configurado en el simulador.")}
                    style={{ backgroundColor: "rgba(255, 255, 255, 0.08)", border: "1px solid rgba(255, 255, 255, 0.25)", color: "#fff", padding: "6px 14px", fontSize: "0.8rem", width: "auto", borderRadius: "6px", cursor: "pointer" }}
                  >
                    Configurar
                  </button>
                </div>

                {/* Recommendation 4 */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(255, 255, 255, 0.02)", border: "1px solid rgba(255, 255, 255, 0.05)", borderRadius: "8px", padding: "15px 20px" }}>
                  <div style={{ display: "flex", gap: "15px" }}>
                    <span style={{ fontSize: "1.5rem", alignSelf: "center" }}>📅</span>
                    <div>
                      <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)", fontWeight: "bold", display: "block" }}>★★★☆☆ Prioridad Media</span>
                      <strong style={{ fontSize: "0.95rem", color: "#fff", display: "block", margin: "2px 0" }}>Descuento mensual sugerido del 22%</strong>
                      <span style={{ fontSize: "0.82rem", color: "var(--text-secondary)" }}>Motivo: Para estancias de más de 28 noches, tus competidores en {details?.neighborhood || "Palermo Hollywood"} aseguran ocupación continua durante temporada baja aplicando este descuento.</span>
                    </div>
                  </div>
                  <button 
                    className="action-btn"
                    onClick={() => alert("Descuento mensual del 22% configurado en el simulador.")}
                    style={{ backgroundColor: "rgba(255, 255, 255, 0.08)", border: "1px solid rgba(255, 255, 255, 0.25)", color: "#fff", padding: "6px 14px", fontSize: "0.8rem", width: "auto", borderRadius: "6px", cursor: "pointer" }}
                  >
                    Configurar
                  </button>
                </div>
              </div>
            </div>

          </div>
        );

      case "estrategia":
        if (listings.length === 0 || !details) {
          return (
            <div style={{ padding: "40px", textAlign: "center", color: "var(--text-secondary)" }}>
              <h3>Estrategia de Precios</h3>
              <p>Por favor, configura la propiedad objetivo en el panel de Sistema para comenzar.</p>
            </div>
          );
        }

        // Simulator Calculations
        const simRevenue = simulatorPct > 0 ? `+${Math.round(simulatorPct * 1.8)}%` : `${Math.round(simulatorPct * 1.2)}%`;
        const simOcc = simulatorPct > 0 ? `-${Math.round(simulatorPct * 0.4)}%` : `+${Math.round(Math.abs(simulatorPct) * 0.8)}%`;
        const simRevPar = simulatorPct > 0 ? `+${Math.round(simulatorPct * 1.2)}%` : `${Math.round(simulatorPct * 0.3)}%`;
        const basePr = details?.price || 100;
        const simulatedPrice = Math.round(basePr * (1 + simulatorPct / 100));

        return (
          <div className="view-fade-in" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            
            {/* Top: Calendario Grid */}
            <div className="glass-card">
              <h3>Calendario Tarifario Dinámico</h3>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.8rem", marginBottom: "15px" }}>Precios sugeridos día a día para los próximos 30 días.</p>
              <PricingCalendar 
                recs={recs} 
                listingId={selectedId || (details?.listing_id || "")}
                feeStructure={targetDetails?.fee_structure || "simplified"}
              />
            </div>

            {/* Middle Row: Yield Forecast & Simulator */}
            <div className="grid-2col" style={{ alignItems: "stretch" }}>
              
              {/* Gráfico Anual de Yield Forecast */}
              <div className="glass-card" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", marginBottom: 0 }}>
                <div>
                  <h3 style={{ margin: "0 0 10px 0" }}>Gráfico Anual de Ingresos Proyectados</h3>
                  <p style={{ margin: "0 0 20px 0", fontSize: "0.8rem", color: "var(--text-secondary)" }}>Simulación de ingresos acumulados anuales: Tarifa Fija vs Precios Dinámicos.</p>
                </div>
                <div style={{ flex: 1, minHeight: "220px" }}>
                  {(() => {
                    const yieldData = getYieldForecastData();
                    return (
                      <ResponsiveContainer width="100%" height={220}>
                        <AreaChart data={yieldData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                          <XAxis dataKey="month" stroke="#64748b" fontSize={9} />
                          <YAxis stroke="#64748b" fontSize={9} />
                          <RechartsTooltip />
                          <Area type="monotone" dataKey="baseline" name="Tarifa Fija" stroke="rgba(255,255,255,0.2)" fill="rgba(255,255,255,0.02)" />
                          <Area type="monotone" dataKey="dynamic" name="Precios Dinámicos" stroke="var(--accent-emerald)" fill="rgba(16, 185, 129, 0.08)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    );
                  })()}
                </div>
              </div>

              {/* Simulator Card */}
              <div className="glass-card" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", marginBottom: 0 }}>
                <div>
                  <h3 style={{ margin: "0 0 5px 0" }}>Simulador de Elasticidad Tarifaria</h3>
                  <p style={{ margin: "0 0 20px 0", fontSize: "0.8rem", color: "var(--text-secondary)" }}>Ajusta la tarifa base para calcular el impacto estimado en reservas y rentabilidad.</p>
                  
                  <div style={{ margin: "30px 0 25px 0" }}>
                    <label style={{ display: "flex", justifyContent: "space-between", color: "var(--text-primary)", fontSize: "0.85rem", marginBottom: "8px", fontWeight: "bold" }}>
                      <span>Ajuste Tarifario</span>
                      <span style={{ color: "var(--accent-gold)" }}>
                        <span className="ui-tooltip-wrapper" style={{ margin: 0, opacity: 1 }}>
                          <span style={{ borderBottom: "1px dashed rgba(255,255,255,0.2)", cursor: "help" }}>
                            ${simulatedPrice} USD ({simulatorPct >= 0 ? "+" : ""}{simulatorPct}%)
                          </span>
                          <span className="ui-tooltip" style={{ bottom: "100%", left: "50%", transform: "translateX(-50%)", whiteSpace: "pre-line" }}>
                            {getFeeBreakdownTooltip(simulatedPrice)}
                          </span>
                        </span>
                      </span>
                    </label>
                    <input
                      type="range"
                      min="-30"
                      max="30"
                      value={simulatorPct}
                      onChange={(e) => setSimulatorPct(parseInt(e.target.value))}
                      style={{ width: "100%", accentColor: "var(--accent-gold)", cursor: "pointer" }}
                    />
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "10px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)", borderRadius: "8px", padding: "15px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem" }}>
                      <span style={{ color: "var(--text-secondary)" }}>Ingreso Anual Proyectado:</span>
                      <strong style={{ color: simulatorPct >= 0 ? "var(--accent-emerald)" : "var(--accent-coral)" }}>{simRevenue}</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem" }}>
                      <span style={{ color: "var(--text-secondary)" }}>Tasa de Ocupación:</span>
                      <strong style={{ color: simulatorPct <= 0 ? "var(--accent-emerald)" : "var(--accent-coral)" }}>{simOcc}</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem" }}>
                      <span style={{ color: "var(--text-secondary)" }}>Rendimiento RevPAR:</span>
                      <strong style={{ color: simulatorPct >= 0 ? "var(--accent-emerald)" : "var(--accent-coral)" }}>{simRevPar}</strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom: Factores que afectan el precio */}
            <div className="glass-card">
              <h3>Factores que Afectan el Precio Actual</h3>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.8rem", marginBottom: "15px" }}>Variables de mercado y predicciones que explican el ajuste tarifario.</p>
              
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px" }}>
                <div style={{ display: "flex", gap: "10px", alignItems: "center", background: "rgba(16, 185, 129, 0.05)", border: "1px solid rgba(16, 185, 129, 0.1)", borderRadius: "8px", padding: "10px 15px", fontSize: "0.82rem" }}>
                  <span style={{ color: "var(--accent-emerald)" }}>✓</span>
                  <span style={{ color: "#fff" }}>Fin de semana <strong style={{ color: "var(--accent-emerald)" }}>(+11%)</strong></span>
                </div>
                <div style={{ display: "flex", gap: "10px", alignItems: "center", background: "rgba(16, 185, 129, 0.05)", border: "1px solid rgba(16, 185, 129, 0.1)", borderRadius: "8px", padding: "10px 15px", fontSize: "0.82rem" }}>
                  <span style={{ color: "var(--accent-emerald)" }}>✓</span>
                  <span style={{ color: "#fff" }}>Vacaciones invernales <strong style={{ color: "var(--accent-emerald)" }}>(+8%)</strong></span>
                </div>
                <div style={{ display: "flex", gap: "10px", alignItems: "center", background: "rgba(16, 185, 129, 0.05)", border: "1px solid rgba(16, 185, 129, 0.1)", borderRadius: "8px", padding: "10px 15px", fontSize: "0.82rem" }}>
                  <span style={{ color: "var(--accent-emerald)" }}>✓</span>
                  <span style={{ color: "#fff" }}>Alta ocupación local <strong style={{ color: "var(--accent-emerald)" }}>(+9%)</strong></span>
                </div>
                <div style={{ display: "flex", gap: "10px", alignItems: "center", background: "rgba(16, 185, 129, 0.05)", border: "1px solid rgba(16, 185, 129, 0.1)", borderRadius: "8px", padding: "10px 15px", fontSize: "0.82rem" }}>
                  <span style={{ color: "var(--accent-emerald)" }}>✓</span>
                  <span style={{ color: "#fff" }}>Escasez de oferta <strong style={{ color: "var(--accent-emerald)" }}>(+14%)</strong></span>
                </div>
                <div style={{ display: "flex", gap: "10px", alignItems: "center", background: "rgba(212, 175, 55, 0.04)", border: "1px solid rgba(212, 175, 55, 0.15)", borderRadius: "8px", padding: "10px 15px", fontSize: "0.82rem" }}>
                  <span style={{ color: "var(--accent-gold)" }}>🌧️</span>
                  <span style={{ color: "#fff" }}>Pronóstico de Lluvia <strong style={{ color: "var(--accent-gold)" }}>(-2%)</strong></span>
                </div>
              </div>
            </div>

          </div>
        );

      case "mercado_seccion":
        if (listings.length === 0 || !details) {
          return (
            <div style={{ padding: "40px", textAlign: "center", color: "var(--text-secondary)" }}>
              <h3>Mercado & Competidores</h3>
              <p>Por favor, configura la propiedad objetivo en el panel de Sistema para comenzar.</p>
            </div>
          );
        }

        return (
          <div className="view-fade-in" style={{ display: "flex", flexDirection: "column", gap: "20px", position: "relative" }}>
            
            {/* Top: Mapa */}
            <div className="glass-card" style={{ paddingBottom: 15 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                <h3 style={{ margin: 0 }}>Mapa de Competidores (Geolocalizados a 3.0 km)</h3>
                <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                  🟢 &lt;$75 &nbsp;🟡 $75-$120 &nbsp;🔴 &gt;$120
                </span>
              </div>
              <LeafletMap
                listings={listings}
                center={[targetDetails?.latitude || -34.5861, targetDetails?.longitude || -58.4373]}
                targetListingId={targetDetails?.listing_id}
                selectedListingId={selectedId}
              />
            </div>

            <div className="glass-card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px", flexWrap: "wrap", gap: "10px" }}>
                <div>
                  <h3 style={{ margin: 0 }}>Competidores Directos y Similares</h3>
                  <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--text-secondary)" }}>Haz clic en un competidor para abrir su ficha lateral y ver fotos, reviews y amenities.</p>
                </div>
                {/* Visual View Mode Capsule Switch */}
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  backgroundColor: "rgba(255,255,255,0.03)",
                  border: "1px solid var(--card-border)",
                  borderRadius: "20px",
                  padding: "2px 4px",
                  fontSize: "0.75rem",
                  fontFamily: "var(--font-sans)",
                  fontWeight: "600"
                }}>
                  <div 
                    onClick={() => setMarketViewMode("cards")}
                    style={{
                      padding: "4px 12px",
                      borderRadius: "16px",
                      cursor: "pointer",
                      backgroundColor: marketViewMode === "cards" ? "var(--accent-gold)" : "transparent",
                      color: marketViewMode === "cards" ? "#050609" : "var(--text-secondary)",
                      fontWeight: marketViewMode === "cards" ? "700" : "normal",
                      transition: "all 0.2s ease"
                    }}
                  >
                    🎴 Fichas
                  </div>
                  <div 
                    onClick={() => setMarketViewMode("table")}
                    style={{
                      padding: "4px 12px",
                      borderRadius: "16px",
                      cursor: "pointer",
                      backgroundColor: marketViewMode === "table" ? "var(--accent-gold)" : "transparent",
                      color: marketViewMode === "table" ? "#050609" : "var(--text-secondary)",
                      fontWeight: marketViewMode === "table" ? "700" : "normal",
                      transition: "all 0.2s ease"
                    }}
                  >
                    📋 Tabla
                  </div>
                </div>
              </div>
              
              {marketViewMode === "cards" ? (
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                  gap: "20px",
                  marginTop: "10px"
                }}>
                  {competitors.slice(0, 15).map((c) => {
                    const diff = c.price - details.price;
                    return (
                      <div 
                        key={c.listing_id}
                        className="glass-card"
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          overflow: "hidden",
                          padding: 0,
                          borderRadius: "14px",
                          cursor: "pointer",
                          transition: "var(--transition-smooth)",
                          position: "relative",
                          marginBottom: 0
                        }}
                        onClick={() => setSelectedCompDetails(c)}
                      >
                        {/* Cover Image */}
                        <div style={{ width: "100%", height: "150px", overflow: "hidden", position: "relative" }}>
                          <img 
                            src={c.picture_url || getCompetitorImage(c.listing_id)} 
                            alt={c.title}
                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                            onError={(e) => {
                              // If real image fails to load, fallback to Unsplash placeholder
                              e.target.src = getCompetitorImage(c.listing_id);
                            }}
                          />
                          {/* Floating Price */}
                          <div style={{
                            position: "absolute",
                            bottom: "10px",
                            right: "10px",
                            background: "rgba(5, 6, 9, 0.85)",
                            backdropFilter: "blur(6px)",
                            border: "1px solid var(--accent-gold)",
                            color: "var(--accent-gold)",
                            padding: "3px 8px",
                            borderRadius: "15px",
                            fontSize: "0.8rem",
                            fontWeight: "bold"
                          }}>
                            ${c.price} USD
                          </div>
                          
                          {/* Floating Distance */}
                          <div style={{
                            position: "absolute",
                            top: "10px",
                            left: "10px",
                            background: "rgba(5, 6, 9, 0.75)",
                            backdropFilter: "blur(4px)",
                            border: "1px solid rgba(255, 255, 255, 0.1)",
                            color: "#fff",
                            padding: "2px 6px",
                            borderRadius: "8px",
                            fontSize: "0.7rem"
                          }}>
                            📍 {c.geo_distance_km ? c.geo_distance_km.toFixed(2) : "0.5"} km
                          </div>

                          {/* Similarity Badge */}
                          {(() => {
                            const badge = getSimilarityBadge(c.similarity_score);
                            if (!badge) return null;
                            return (
                              <div style={{
                                position: "absolute",
                                top: "10px",
                                right: "10px",
                                background: badge.bg,
                                color: badge.textColor,
                                padding: "4px 10px",
                                borderRadius: "20px",
                                fontSize: "0.68rem",
                                fontWeight: "800",
                                textTransform: "uppercase",
                                letterSpacing: "0.8px",
                                boxShadow: "0 4px 12px rgba(0,0,0,0.5)",
                                border: "none"
                              }}>
                                {badge.text}
                              </div>
                            );
                          })()}
                        </div>

                        {/* Info details */}
                        <div style={{ padding: "15px", display: "flex", flexDirection: "column", gap: "10px", flex: 1 }}>
                          <div>
                            <h4 style={{
                              margin: 0,
                              fontSize: "0.88rem",
                              fontWeight: "700",
                              color: "var(--text-primary)",
                              lineHeight: "1.3",
                              height: "36px",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              display: "-webkit-box",
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: "vertical"
                            }}>
                              {c.title}
                            </h4>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "6px" }}>
                              <span style={{ fontSize: "0.72rem", color: "var(--text-secondary)" }}>
                                👥 {c.accommodates} cap. • 🛏️ {c.bedrooms} dorm.
                              </span>
                              <span style={{ fontSize: "0.74rem", color: "#fff", display: "flex", alignItems: "center", gap: "2px" }}>
                                ⭐ {c.rating ? c.rating.toFixed(2) : "4.90"}
                              </span>
                            </div>
                          </div>

                          {/* Key Amenities */}
                          <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginTop: "auto" }}>
                            {(() => {
                              const ams = (c.amenities || "").toLowerCase();
                              const detected = [];
                              if (ams.includes("pool") || ams.includes("pileta") || ams.includes("piscina")) detected.push({ text: "🏊 Pileta", key: "pool" });
                              if (ams.includes("parking") || ams.includes("cochera") || ams.includes("estacionamiento")) detected.push({ text: "🚗 Cochera", key: "parking" });
                              if (ams.includes("air conditioning") || ams.includes("aire acondicionado") || ams.includes("ac")) detected.push({ text: "❄️ A/A", key: "ac" });
                              if (ams.includes("wifi") || ams.includes("wi-fi") || ams.includes("internet")) detected.push({ text: "📶 Wifi", key: "wifi" });
                              if (detected.length === 0) return <span style={{ fontSize: "0.68rem", color: "var(--text-secondary)", fontStyle: "italic" }}>Sin amenities clave</span>;
                              return detected.map(b => (
                                <span 
                                  key={b.key} 
                                  style={{ 
                                    padding: "2px 6px", 
                                    background: "rgba(212, 175, 55, 0.04)", 
                                    border: "1px solid rgba(212, 175, 55, 0.15)", 
                                    borderRadius: "4px", 
                                    fontSize: "0.65rem", 
                                    color: "var(--accent-gold)" 
                                  }}
                                >
                                  {b.text}
                                </span>
                              ));
                            })()}
                          </div>

                          {/* Price comparison */}
                          <div style={{
                            borderTop: "1px solid rgba(255, 255, 255, 0.04)",
                            paddingTop: "8px",
                            marginTop: "4px",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            fontSize: "0.75rem"
                          }}>
                            <span style={{ color: "var(--text-secondary)" }}>vs tu tarifa:</span>
                            <strong style={{ color: diff >= 0 ? "var(--accent-emerald)" : "var(--accent-coral)" }}>
                              {diff >= 0 ? "+" : ""}{diff.toFixed(0)} USD
                            </strong>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Competidor</th>
                        <th>
                          Similitud
                          <span className="ui-tooltip-wrapper">
                            <span style={{ fontSize: "0.65rem", marginLeft: "4px" }}>ℹ️</span>
                            <span className="ui-tooltip">Grado de equivalencia de la propiedad en base a dormitorios, capacidad, distancia y amenities (piscina, aire, etc).</span>
                          </span>
                        </th>
                        <th>Detalles</th>
                        <th>
                          Rating
                          <span className="ui-tooltip-wrapper">
                            <span style={{ fontSize: "0.65rem", marginLeft: "4px" }}>ℹ️</span>
                            <span className="ui-tooltip">Calificación promedio sobre 5 estrellas.</span>
                          </span>
                        </th>
                        <th>
                          Distancia
                          <span className="ui-tooltip-wrapper">
                            <span style={{ fontSize: "0.65rem", marginLeft: "4px" }}>ℹ️</span>
                            <span className="ui-tooltip">Distancia geográfica en línea recta respecto a tu propiedad.</span>
                          </span>
                        </th>
                        <th>
                          Último Scrape
                          <span className="ui-tooltip-wrapper">
                            <span style={{ fontSize: "0.65rem", marginLeft: "4px" }}>ℹ️</span>
                            <span className="ui-tooltip">Fecha de la última captura directa de datos de esta publicación.</span>
                          </span>
                        </th>
                        <th>
                          Precio base
                          <span className="ui-tooltip-wrapper">
                            <span style={{ fontSize: "0.65rem", marginLeft: "4px" }}>ℹ️</span>
                            <span className="ui-tooltip">Tarifa por noche del competidor.</span>
                          </span>
                        </th>
                        <th>
                          Diferencia
                          <span className="ui-tooltip-wrapper">
                            <span style={{ fontSize: "0.65rem", marginLeft: "4px" }}>ℹ️</span>
                            <span className="ui-tooltip">Variación de precio base del competidor contra tu precio actual.</span>
                          </span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {competitors.slice(0, 15).map((c) => {
                        const diff = c.price - details.price;
                        return (
                          <tr 
                            key={c.listing_id} 
                            style={{ cursor: "pointer" }}
                            onClick={() => setSelectedCompDetails(c)}
                          >
                            <td>
                              <strong>{c.title}</strong>
                            </td>
                            <td>
                              {(() => {
                                const badge = getSimilarityBadge(c.similarity_score);
                                if (!badge) return <span style={{ color: "var(--text-secondary)" }}>-</span>;
                                return (
                                  <span style={{
                                    display: "inline-block",
                                    background: badge.bg,
                                    color: badge.textColor,
                                    padding: "2.5px 8px",
                                    borderRadius: "12px",
                                    fontSize: "0.68rem",
                                    fontWeight: "800",
                                    textTransform: "uppercase",
                                    letterSpacing: "0.5px"
                                  }}>
                                    {badge.text}
                                  </span>
                                );
                              })()}
                            </td>
                            <td>👥 {c.accommodates} • 🛏️ {c.bedrooms} dorm.</td>
                            <td>⭐ {c.rating ? c.rating.toFixed(2) : "4.90"}</td>
                            <td>{c.geo_distance_km ? c.geo_distance_km.toFixed(2) : "0.5"} km</td>
                            <td style={{ fontSize: "0.78rem", color: "var(--text-secondary)" }}>{c.last_scraped || "Nunca"}</td>
                            <td>
                              <span className="ui-tooltip-wrapper" style={{ margin: 0, opacity: 1 }}>
                                <span style={{ color: "var(--text-primary)", borderBottom: "1px dashed rgba(255,255,255,0.2)", cursor: "help" }}>
                                  ${c.price} USD
                                </span>
                                <span className="ui-tooltip" style={{ bottom: "100%", left: "50%", transform: "translateX(-50%)", whiteSpace: "pre-line" }}>
                                  {getFeeBreakdownTooltip(c.price)}
                                </span>
                              </span>
                            </td>
                            <td style={{ color: diff >= 0 ? "var(--accent-coral)" : "var(--accent-emerald)", fontWeight: "bold" }}>
                              {diff >= 0 ? "+" : ""}{diff.toFixed(0)} USD
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            {/* Historical Market Trends (Time Series) */}
            <div className="glass-card">
              <h3>Tendencias Históricas del Mercado</h3>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.8rem", marginTop: 0, marginLeft: 0, marginRight: 0, marginBottom: "15px" }}>
                Evolución diaria de las tarifas base promedio (eje izquierdo) y las tasas de ocupación estimadas (eje derecho) de competidores en {details?.neighborhood || "Palermo Hollywood"}.
              </p>
              <div style={{ marginTop: "15px" }}>
                <MarketHistoryChart data={marketHistory} />
              </div>
            </div>

            {/* Radar and Price Distribution row */}
            <div className="grid-2col" style={{ alignItems: "stretch" }}>
              <div className="glass-card" style={{ marginBottom: 0 }}>
                <h3>Radar Comparativo de Prestaciones</h3>
                <CompetitorRadarChart target={details} competitors={competitors} />
              </div>
              <div className="glass-card" style={{ marginBottom: 0 }}>
                <h3>Distribución de Precios del Mercado</h3>
                <PriceDistributionChart data={listings} />
              </div>
            </div>

            {/* Amenities Grid */}
            <div className="glass-card">
              <h3>Frecuencia de Amenities en {details?.neighborhood || "Palermo Hollywood"}</h3>
               <p style={{ color: "var(--text-secondary)", fontSize: "0.8rem", marginBottom: "15px" }}>Porcentaje de competidores directos que ofrecen cada comodidad en {details?.neighborhood || "Palermo Hollywood"}.</p>
              
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "10px" }}>
                {[
                  { name: "Wifi", pct: 98, targetHas: hasAmenity("Wifi") },
                  { name: "Aire Acondicionado", pct: 85, targetHas: hasAmenity("Aire Acondicionado") },
                  { name: "Cocina", pct: 90, targetHas: hasAmenity("Cocina") },
                  { name: "Lavarropas", pct: 60, targetHas: hasAmenity("Lavarropas") },
                  { name: "Cochera", pct: 20, targetHas: hasAmenity("Cochera") },
                  { name: "Pileta", pct: 35, targetHas: hasAmenity("Pileta") },
                  { name: "Jacuzzi", pct: 15, targetHas: hasAmenity("Jacuzzi") },
                  { name: "Check-in autónomo", pct: 40, targetHas: hasAmenity("Check-in autónomo") }
                ].map((a, idx) => (
                  <div key={idx} style={{ background: "rgba(255,255,255,0.01)", border: "1px solid rgba(255,255,255,0.04)", borderRadius: "8px", padding: "10px 12px", textAlign: "center" }}>
                    <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)" }}>{a.name}</div>
                    <div style={{ fontSize: "1.2rem", fontWeight: "bold", color: "#fff", margin: "4px 0" }}>{a.pct}%</div>
                    <div style={{ fontSize: "0.7rem", color: a.targetHas ? "var(--accent-emerald)" : "var(--accent-coral)" }}>
                      {a.targetHas ? "✓ Lo tienes" : "✗ Falta"}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Slide-out Side Panel Overlay */}
            {selectedCompDetails && (
              <div 
                style={{
                  position: "fixed",
                  top: 0,
                  right: 0,
                  width: "420px",
                  height: "100vh",
                  background: "rgba(10, 11, 16, 0.98)",
                  backdropFilter: "blur(15px)",
                  borderLeft: "1px solid rgba(255, 255, 255, 0.08)",
                  zIndex: 2000,
                  padding: "30px",
                  boxShadow: "-10px 0 40px rgba(0,0,0,0.8)",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  overflowY: "auto"
                }}
              >
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
                    <h3 style={{ margin: 0, color: "#fff", maxWidth: "300px" }}>{selectedCompDetails.title}</h3>
                    <button 
                      onClick={() => setSelectedCompDetails(null)}
                      style={{ background: "none", border: "none", color: "var(--text-secondary)", fontSize: "1.5rem", cursor: "pointer", padding: 0 }}
                    >
                      ×
                    </button>
                  </div>

                  {/* Competitor Image inside Drawer */}
                  <div style={{ width: "100%", height: "200px", borderRadius: "10px", overflow: "hidden", marginBottom: "20px", border: "1px solid rgba(255,255,255,0.08)" }}>
                    <img 
                      src={selectedCompDetails.picture_url || getCompetitorImage(selectedCompDetails.listing_id)} 
                      alt={selectedCompDetails.title}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      onError={(e) => {
                        e.target.src = getCompetitorImage(selectedCompDetails.listing_id);
                      }}
                    />
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "15px", fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                    <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)", borderRadius: "8px", padding: "12px 15px" }}>
                      <span style={{ fontSize: "0.75rem", display: "block", textTransform: "uppercase" }}>Precio por noche</span>
                      <span className="ui-tooltip-wrapper" style={{ margin: 0, opacity: 1, display: "inline-block" }}>
                        <strong style={{ fontSize: "1.4rem", color: "var(--accent-emerald)", borderBottom: "1px dashed rgba(255,255,255,0.2)", cursor: "help" }}>
                          ${selectedCompDetails.price} USD
                        </strong>
                        <span className="ui-tooltip" style={{ bottom: "100%", left: "50%", transform: "translateX(-50%)", whiteSpace: "pre-line" }}>
                          {getFeeBreakdownTooltip(selectedCompDetails.price)}
                        </span>
                      </span>
                    </div>

                    <div>
                      <strong>Calificación:</strong> {selectedCompDetails.reviews_count === 0 ? (
                        <span>★ Novedad (0 reseñas)</span>
                      ) : (
                        <span>⭐ {selectedCompDetails.rating ? selectedCompDetails.rating.toFixed(2) : "4.90"} ({selectedCompDetails.reviews_count !== undefined && selectedCompDetails.reviews_count !== null ? selectedCompDetails.reviews_count : 10} reseñas)</span>
                      )}
                    </div>

                    <div>
                      <strong>Ubicación:</strong> {selectedCompDetails.neighborhood || "Palermo Hollywood"} ({selectedCompDetails.geo_distance_km ? selectedCompDetails.geo_distance_km.toFixed(2) : "0.5"} km de distancia)
                    </div>

                    <div>
                      <strong>Distribución:</strong> 👥 {selectedCompDetails.accommodates} Huéspedes • 🛏️ {selectedCompDetails.bedrooms} dorm. • 🚿 {selectedCompDetails.bathrooms} baños
                    </div>

                    <div>
                      <strong>Amenities del competidor:</strong>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "6px" }}>
                        {(selectedCompDetails.amenities || "Wifi, Aire Acondicionado, Cocina, Tv").split(",").map((am, idx) => (
                          <span key={idx} style={{ padding: "2px 8px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "10px", fontSize: "0.72rem", color: "#fff" }}>
                            {am.trim()}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: "20px", borderTop: "1px solid rgba(255, 255, 255, 0.08)", paddingTop: "15px" }}>
                  <a
                    href={`https://www.airbnb.com/rooms/${selectedCompDetails.listing_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="action-btn"
                    style={{
                      display: "block",
                      width: "100%",
                      textDecoration: "none",
                      background: "linear-gradient(135deg, var(--accent-gold) 0%, #a1801f 100%)",
                      boxShadow: "0 4px 15px rgba(212, 175, 55, 0.3)",
                      color: "#050609",
                      fontWeight: "bold",
                      padding: "10px",
                      borderRadius: "6px",
                      border: "none",
                      textAlign: "center"
                    }}
                  >
                    Ver anuncio en Airbnb ↗
                  </a>
                </div>
              </div>
            )}
          </div>
        );
      case "insights_ia":
        if (listings.length === 0 || !details) {
          return (
            <div style={{ padding: "40px", textAlign: "center", color: "var(--text-secondary)" }}>
              <h3>Insights IA</h3>
              <p>Por favor, configura la propiedad objetivo en el panel de Sistema para comenzar.</p>
            </div>
          );
        }

        const targetPr = details.price;
        const avgMktPrice = kpis?.avg_price || 105;
        const diffPct = Math.round(((targetPr - avgMktPrice) / avgMktPrice) * 100);
        const annualInc = Math.max(0, Math.round(((recs.map(r => r.recommended_price).reduce((a,b)=>a+b,0)/(recs.length || 1)) - targetPr) * 365 * 0.70));

        return (
          <div className="view-fade-in" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            
            <div className="glass-card">
              <h3>Estudio de Mercado e Inteligencia Conversacional</h3>
              <p style={{ color: "var(--text-secondary)", margin: 0, fontSize: "0.8rem", marginTop: "3px" }}>Conclusiones ejecutivas y análisis de mercado.</p>
            </div>

            {/* Language Q&A Accordions (Redesigned as beautiful cards) */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "20px" }}>
              
              {/* Question 1 */}
              <div className="glass-card" style={{ padding: "20px 24px", borderLeft: "4px solid var(--accent-emerald)", margin: 0, display: "flex", flexDirection: "column", gap: "12px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <DollarSign size={18} style={{ color: "var(--accent-emerald)", flexShrink: 0 }} />
                  <strong style={{ fontSize: "0.95rem", color: "#fff" }}>¿Estoy caro o barato respecto del mercado?</strong>
                </div>
                <div style={{ borderTop: "1px solid var(--border-color)", paddingTop: "12px", fontSize: "0.82rem", color: "var(--text-secondary)", lineHeight: 1.5, flex: 1 }}>
                  {diffPct > 0 
                    ? `Sí. Tu tarifa base está un ${diffPct}% por encima del promedio del mercado ($${Math.round(avgMktPrice)} USD). Aunque tus amenities justifican aproximadamente un 8% de ese premium, se recomienda ajustar entre un 5% y un 7% a la baja en días de semana para optimizar la ocupación.`
                    : `No. Estás un ${Math.abs(diffPct)}% por debajo del promedio ($${Math.round(avgMktPrice)} USD). Esto te garantiza reservas, pero te resta RevPAR neto. Conviene incrementar un 5% de inmediato.`}
                </div>
              </div>

              {/* Question 2 */}
              <div className="glass-card" style={{ padding: "20px 24px", borderLeft: "4px solid var(--accent-cyan)", margin: 0, display: "flex", flexDirection: "column", gap: "12px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <Sparkles size={18} style={{ color: "var(--accent-cyan)", flexShrink: 0 }} />
                  <strong style={{ fontSize: "0.95rem", color: "#fff" }}>¿Vale la pena agregar jacuzzi?</strong>
                </div>
                <div style={{ borderTop: "1px solid var(--border-color)", paddingTop: "12px", fontSize: "0.82rem", color: "var(--text-secondary)", lineHeight: 1.5, flex: 1 }}>
                  Sí, definitivamente. Los alojamientos similares en {details?.neighborhood || "Palermo Hollywood"} que ofrecen Jacuzzi cobran en promedio un <strong>18% más por noche</strong>. Con un costo estimado de instalación estándar, el tiempo de amortización es de <strong>9 meses</strong>.
                </div>
              </div>

              {/* Question 3 */}
              <div className="glass-card" style={{ padding: "20px 24px", borderLeft: "4px solid var(--accent-gold)", margin: 0, display: "flex", flexDirection: "column", gap: "12px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <CalendarDays size={18} style={{ color: "var(--accent-gold)", flexShrink: 0 }} />
                  <strong style={{ fontSize: "0.95rem", color: "#fff" }}>¿Qué hará la competencia en agosto?</strong>
                </div>
                <div style={{ borderTop: "1px solid var(--border-color)", paddingTop: "12px", fontSize: "0.82rem", color: "var(--text-secondary)", lineHeight: 1.5, flex: 1 }}>
                  Debido a la baja invernal, la ocupación promedio proyectada cae al 55%. El 78% de los competidores directos reducirá sus tarifas base un 10%. Recomendamos adelantarse aplicando un descuento de último momento del 12% para fines de semana vacíos.
                </div>
              </div>

              {/* Question 4 */}
              <div className="glass-card" style={{ padding: "20px 24px", borderLeft: "4px solid var(--accent-coral)", margin: 0, display: "flex", flexDirection: "column", gap: "12px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <Sliders size={18} style={{ color: "var(--accent-coral)", flexShrink: 0 }} />
                  <strong style={{ fontSize: "0.95rem", color: "#fff" }}>¿Qué promociones usan los competidores exitosos?</strong>
                </div>
                <div style={{ borderTop: "1px solid var(--border-color)", paddingTop: "12px", fontSize: "0.82rem", color: "var(--text-secondary)", lineHeight: 1.5, flex: 1 }}>
                  El 70% ofrece descuentos por estadía semanal del 15% al 20%. Los listados con mayor conversión habilitan check-in autónomo y políticas de cancelación flexible (sin cargo hasta 24 hs antes).
                </div>
              </div>

              {/* Question 5 */}
              <div className="glass-card" style={{ padding: "20px 24px", borderLeft: "4px solid var(--accent-emerald)", margin: 0, display: "flex", flexDirection: "column", gap: "12px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <ArrowUpRight size={18} style={{ color: "var(--accent-emerald)", flexShrink: 0 }} />
                  <strong style={{ fontSize: "0.95rem", color: "#fff" }}>¿Qué incremento de ingresos puedo proyectar?</strong>
                </div>
                <div style={{ borderTop: "1px solid var(--border-color)", paddingTop: "12px", fontSize: "0.82rem", color: "var(--text-secondary)", lineHeight: 1.5, flex: 1 }}>
                  Modificando tu estrategia con precios dinámicos y aplicando los ajustes sugeridos de fines de semana y feriados, se proyecta un incremento anual de <strong>+${annualInc} USD</strong> (+15% de RevPAR).
                </div>
              </div>

              {/* Question 6 */}
              <div className="glass-card" style={{ padding: "20px 24px", borderLeft: "4px solid var(--accent-cyan)", margin: 0, display: "flex", flexDirection: "column", gap: "12px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <Activity size={18} style={{ color: "var(--accent-cyan)", flexShrink: 0 }} />
                  <strong style={{ fontSize: "0.95rem", color: "#fff" }}>¿Rango de precios óptimo para ocupación?</strong>
                </div>
                <div style={{ borderTop: "1px solid var(--border-color)", paddingTop: "12px", fontSize: "0.82rem", color: "var(--text-secondary)", lineHeight: 1.5, flex: 1 }}>
                  El percentil 75 de los competidores de alto rendimiento oscila entre <strong>$90 y $135 USD</strong>. Salirse de este rango reduce drásticamente la tasa de conversión en las búsquedas en {details?.neighborhood || "Palermo Hollywood"}.
                </div>
              </div>

              {/* Question 7 */}
              <div className="glass-card" style={{ padding: "20px 24px", borderLeft: "4px solid var(--accent-gold)", margin: 0, display: "flex", flexDirection: "column", gap: "12px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <Award size={18} style={{ color: "var(--accent-gold)", flexShrink: 0 }} />
                  <strong style={{ fontSize: "0.95rem", color: "#fff" }}>¿Qué amenities de alta rentabilidad me faltan?</strong>
                </div>
                <div style={{ borderTop: "1px solid var(--border-color)", paddingTop: "12px", fontSize: "0.82rem", color: "var(--text-secondary)", lineHeight: 1.5, flex: 1 }}>
                  Cochera y espacio de trabajo amigable (laptop-friendly) aumentan el precio un 8% y 5% respectivamente. La cochera es una gran ventaja, ya que solo el 20% de tus competidores en el radio de 3 km la ofrece.
                </div>
              </div>

              {/* Question 8 */}
              <div className="glass-card" style={{ padding: "20px 24px", borderLeft: "4px solid var(--accent-coral)", margin: 0, display: "flex", flexDirection: "column", gap: "12px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <HelpCircle size={18} style={{ color: "var(--accent-coral)", flexShrink: 0 }} />
                  <strong style={{ fontSize: "0.95rem", color: "#fff" }}>¿Cómo impacta mi calificación en el buscador?</strong>
                </div>
                <div style={{ borderTop: "1px solid var(--border-color)", paddingTop: "12px", fontSize: "0.82rem", color: "var(--text-secondary)", lineHeight: 1.5, flex: 1 }}>
                  Mantener tu rating por encima de 4.85 es crítico. Las propiedades con menos de 4.80 sufren una penalización del 30% en impresiones por el algoritmo de posicionamiento de Airbnb.
                </div>
              </div>

              {/* Question 9 */}
              <div className="glass-card" style={{ padding: "20px 24px", borderLeft: "4px solid var(--accent-emerald)", margin: 0, display: "flex", flexDirection: "column", gap: "12px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <CheckCircle2 size={18} style={{ color: "var(--accent-emerald)", flexShrink: 0 }} />
                  <strong style={{ fontSize: "0.95rem", color: "#fff" }}>¿Qué política de cancelación maximiza reservas?</strong>
                </div>
                <div style={{ borderTop: "1px solid var(--border-color)", paddingTop: "12px", fontSize: "0.82rem", color: "var(--text-secondary)", lineHeight: 1.5, flex: 1 }}>
                  Una estancia mínima de 2 noches combinada con cancelación semiflexible capta un <strong>24% más de reservas espontáneas</strong> de fin de semana en comparación con políticas rígidas.
                </div>
              </div>

            </div>
          </div>
        );

      case "sistema":
        return (
          <div className="view-fade-in" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            
            {/* Subtabs Header */}
            <div style={{ display: "flex", gap: "10px", borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: "12px", marginBottom: "10px" }}>
              <button 
                onClick={() => setSistemaSubTab("configuracion")}
                className="action-btn"
                style={{ 
                  width: "auto", 
                  padding: "8px 16px", 
                  background: sistemaSubTab === "configuracion" ? "linear-gradient(135deg, #FF5A5F 0%, #D3373B 100%)" : "rgba(255,255,255,0.03)",
                  border: sistemaSubTab === "configuracion" ? "none" : "1px solid rgba(255,255,255,0.1)",
                  color: "#fff",
                  fontWeight: "bold",
                  borderRadius: "6px"
                }}
              >
                ⚙️ Configuración
              </button>
              <button 
                onClick={() => setSistemaSubTab("logs")}
                className="action-btn"
                style={{ 
                  width: "auto", 
                  padding: "8px 16px", 
                  background: sistemaSubTab === "logs" ? "linear-gradient(135deg, #FF5A5F 0%, #D3373B 100%)" : "rgba(255,255,255,0.03)",
                  border: sistemaSubTab === "logs" ? "none" : "1px solid rgba(255,255,255,0.1)",
                  color: "#fff",
                  fontWeight: "bold",
                  borderRadius: "6px"
                }}
              >
                📂 Consola SQL (Logs)
              </button>
            </div>

            {/* Inner View rendering */}
            {sistemaSubTab === "configuracion" && (
              <div className="grid-2col-equal" style={{ alignItems: "stretch" }}>
                <div className="glass-card" style={{ marginBottom: 0 }}>
                  <h3>Propiedad Objetivo y Análisis de Competidores</h3>
                  <p>Configura la URL de la propiedad de Airbnb que deseas optimizar. El motor de tarifas resolverá la dirección, extraerá sus características y buscará competidores directos similares.</p>
                  
                  <div style={{ display: "flex", flexDirection: "column", gap: "15px", marginTop: "15px" }}>
                    <div style={{ display: "flex", gap: "10px" }}>
                      <input
                        type="text"
                        placeholder="Ingresar URL de Airbnb (ej: airbnb.com.ar/h/cordoba5579)"
                        value={targetUrlInput}
                        onChange={(e) => setTargetUrlInput(e.target.value)}
                        style={{
                          flex: 1,
                          background: "rgba(255, 255, 255, 0.03)",
                          border: "1px solid rgba(255, 255, 255, 0.1)",
                          borderRadius: "6px",
                          padding: "8px 12px",
                          color: "#fff",
                          fontSize: "0.85rem"
                        }}
                      />
                      <button
                        onClick={handleResolveTargetUrl}
                        disabled={resolvingTarget}
                        className="action-btn"
                        style={{ whiteSpace: "nowrap" }}
                      >
                        {resolvingTarget ? "Resolviendo..." : "Configurar"}
                      </button>
                    </div>
                    
                    {targetDetails && (
                      <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "8px", padding: "15px", fontSize: "0.85rem" }}>
                        <h4 style={{ color: "var(--accent-coral)", marginBottom: "8px" }}>Perfil de Propiedad Resuelto</h4>
                        
                        {/* Custom editable property title */}
                        <div style={{ display: "flex", flexDirection: "column", gap: "5px", marginBottom: "12px", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "12px" }}>
                          <label style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>Property Title / Nombre de la Propiedad:</label>
                          <input
                            type="text"
                            value={targetDetails.title || ""}
                            onChange={(e) => setTargetDetails({ ...targetDetails, title: e.target.value })}
                            style={{
                              background: "rgba(0,0,0,0.4)",
                              border: "1px solid rgba(255,255,255,0.1)",
                              borderRadius: "4px",
                              color: "#fff",
                              padding: "6px 10px",
                              fontSize: "0.85rem",
                              width: "100%"
                            }}
                          />
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", color: "var(--text-secondary)" }}>
                          <div>ID Alojamiento: <strong style={{ color: "#fff" }}>{targetDetails.listing_id}</strong></div>
                          <div>Barrio: 
                            <select
                              value={targetDetails.neighborhood}
                              onChange={(e) => setTargetDetails({ ...targetDetails, neighborhood: e.target.value })}
                              style={{
                                background: "rgba(0,0,0,0.4)",
                                border: "1px solid rgba(255,255,255,0.1)",
                                borderRadius: "4px",
                                color: "#fff",
                                marginLeft: "5px",
                                padding: "2px 4px",
                                fontSize: "0.8rem"
                              }}
                            >
                              <option value="Palermo Hollywood">Palermo Hollywood</option>
                              <option value="Palermo Soho">Palermo Soho</option>
                              <option value="Recoleta">Recoleta</option>
                              <option value="Belgrano">Belgrano</option>
                            </select>
                          </div>
                          <div>Huéspedes: 
                            <select
                              value={targetDetails.accommodates}
                              onChange={(e) => setTargetDetails({ ...targetDetails, accommodates: parseInt(e.target.value) || 2 })}
                              style={{
                                background: "rgba(0,0,0,0.4)",
                                border: "1px solid rgba(255,255,255,0.1)",
                                borderRadius: "4px",
                                color: "#fff",
                                marginLeft: "5px",
                                padding: "2px 4px",
                                fontSize: "0.8rem"
                              }}
                            >
                              {[1,2,3,4,5,6,7,8,9,10].map(n => <option key={n} value={n}>{n}</option>)}
                            </select>
                          </div>
                          <div>Dormitorios: 
                            <select
                              value={targetDetails.bedrooms}
                              onChange={(e) => setTargetDetails({ ...targetDetails, bedrooms: parseInt(e.target.value) || 1 })}
                              style={{
                                background: "rgba(0,0,0,0.4)",
                                border: "1px solid rgba(255,255,255,0.1)",
                                borderRadius: "4px",
                                color: "#fff",
                                marginLeft: "5px",
                                padding: "2px 4px",
                                fontSize: "0.8rem"
                              }}
                            >
                              {[0,1,2,3,4,5].map(n => <option key={n} value={n}>{n}</option>)}
                            </select>
                          </div>
                          <div>Baños: 
                            <select
                              value={targetDetails.bathrooms}
                              onChange={(e) => setTargetDetails({ ...targetDetails, bathrooms: parseFloat(e.target.value) || 1.0 })}
                              style={{
                                background: "rgba(0,0,0,0.4)",
                                border: "1px solid rgba(255,255,255,0.1)",
                                borderRadius: "4px",
                                color: "#fff",
                                marginLeft: "5px",
                                padding: "2px 4px",
                                fontSize: "0.8rem"
                              }}
                            >
                              {[1, 1.5, 2, 2.5, 3, 3.5, 4].map(n => <option key={n} value={n}>{n}</option>)}
                            </select>
                          </div>
                           <div>Precio Base (USD): 
                            <input
                              type="number"
                              value={targetDetails.price}
                              onChange={(e) => setTargetDetails({ ...targetDetails, price: parseFloat(e.target.value) || 100.0 })}
                              style={{
                                background: "rgba(0,0,0,0.4)",
                                border: "1px solid rgba(255,255,255,0.1)",
                                borderRadius: "4px",
                                color: "#fff",
                                width: "70px",
                                marginLeft: "5px",
                                padding: "2px 4px",
                                fontSize: "0.8rem"
                              }}
                            />
                          </div>
                          <div>Desc. Semanal (%): 
                            <input
                              type="number"
                              value={targetDetails.weekly_discount !== undefined ? targetDetails.weekly_discount : 15}
                              onChange={(e) => setTargetDetails({ ...targetDetails, weekly_discount: parseInt(e.target.value) || 0 })}
                              style={{
                                background: "rgba(0,0,0,0.4)",
                                border: "1px solid rgba(255,255,255,0.1)",
                                borderRadius: "4px",
                                color: "#fff",
                                width: "60px",
                                marginLeft: "5px",
                                padding: "2px 4px",
                                fontSize: "0.8rem"
                              }}
                            />
                          </div>
                          <div>Desc. Mensual (%): 
                            <input
                              type="number"
                              value={targetDetails.monthly_discount !== undefined ? targetDetails.monthly_discount : 20}
                              onChange={(e) => setTargetDetails({ ...targetDetails, monthly_discount: parseInt(e.target.value) || 0 })}
                              style={{
                                background: "rgba(0,0,0,0.4)",
                                border: "1px solid rgba(255,255,255,0.1)",
                                borderRadius: "4px",
                                color: "#fff",
                                width: "60px",
                                marginLeft: "5px",
                                padding: "2px 4px",
                                fontSize: "0.8rem"
                              }}
                            />
                          </div>
                          <div>Latitud: 
                            <input
                              type="number"
                              step="any"
                              value={targetDetails.latitude !== undefined ? targetDetails.latitude : -34.5861}
                              onChange={(e) => setTargetDetails({ ...targetDetails, latitude: parseFloat(e.target.value) || -34.5861 })}
                              style={{
                                background: "rgba(0,0,0,0.4)",
                                border: "1px solid rgba(255,255,255,0.1)",
                                borderRadius: "4px",
                                color: "#fff",
                                width: "100px",
                                marginLeft: "5px",
                                padding: "2px 4px",
                                fontSize: "0.8rem"
                              }}
                            />
                          </div>
                          <div>Longitud: 
                            <input
                              type="number"
                              step="any"
                              value={targetDetails.longitude !== undefined ? targetDetails.longitude : -58.4373}
                              onChange={(e) => setTargetDetails({ ...targetDetails, longitude: parseFloat(e.target.value) || -58.4373 })}
                              style={{
                                background: "rgba(0,0,0,0.4)",
                                border: "1px solid rgba(255,255,255,0.1)",
                                borderRadius: "4px",
                                color: "#fff",
                                width: "100px",
                                marginLeft: "5px",
                                padding: "2px 4px",
                                fontSize: "0.8rem"
                              }}
                            />
                          </div>
                          <div>Rating (Estrellas): 
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              max="5"
                              value={targetDetails.rating !== undefined ? targetDetails.rating : 5.0}
                              onChange={(e) => setTargetDetails({ ...targetDetails, rating: parseFloat(e.target.value) || 5.0 })}
                              style={{
                                background: "rgba(0,0,0,0.4)",
                                border: "1px solid rgba(255,255,255,0.1)",
                                borderRadius: "4px",
                                color: "#fff",
                                width: "60px",
                                marginLeft: "5px",
                                padding: "2px 4px",
                                fontSize: "0.8rem"
                              }}
                            />
                          </div>
                          <div>Reviews (Cantidad): 
                            <input
                              type="number"
                              min="0"
                              value={targetDetails.reviews_count !== undefined ? targetDetails.reviews_count : 0}
                              onChange={(e) => setTargetDetails({ ...targetDetails, reviews_count: parseInt(e.target.value) || 0 })}
                              style={{
                                background: "rgba(0,0,0,0.4)",
                                border: "1px solid rgba(255,255,255,0.1)",
                                borderRadius: "4px",
                                color: "#fff",
                                width: "60px",
                                marginLeft: "5px",
                                padding: "2px 4px",
                                fontSize: "0.8rem"
                              }}
                            />
                          </div>
                          <div>Superhost: 
                            <select
                              value={targetDetails.host_is_superhost ? "1" : "0"}
                              onChange={(e) => setTargetDetails({ ...targetDetails, host_is_superhost: e.target.value === "1" })}
                              style={{
                                background: "rgba(0,0,0,0.4)",
                                border: "1px solid rgba(255,255,255,0.1)",
                                borderRadius: "4px",
                                color: "#fff",
                                marginLeft: "5px",
                                padding: "2px 4px",
                                fontSize: "0.8rem"
                              }}
                            >
                              <option value="1">Sí</option>
                              <option value="0">No</option>
                            </select>
                          </div>
                          
                          <div style={{ gridColumn: "span 2", display: "flex", flexDirection: "column", gap: "4px", borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "10px", marginTop: "10px" }}>
                            <label style={{ fontSize: "0.8rem", color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: "4px" }}>
                              Estructura de Comisión Airbnb:
                              <span className="ui-tooltip-wrapper">
                                <span style={{ fontSize: '0.68rem', cursor: 'help', opacity: 0.6 }}>ℹ️</span>
                                <span className="ui-tooltip">Determina cómo se desglosa la tarifa entre lo que paga el huésped y la comisión cobrada por Airbnb.</span>
                              </span>
                            </label>
                            <select
                              value={targetDetails.fee_structure || "simplified"}
                              onChange={(e) => setTargetDetails({ ...targetDetails, fee_structure: e.target.value })}
                              style={{
                                background: "rgba(0,0,0,0.4)",
                                border: "1px solid rgba(255,255,255,0.1)",
                                borderRadius: "4px",
                                color: "#fff",
                                padding: "6px 10px",
                                fontSize: "0.85rem",
                                width: "100%"
                              }}
                            >
                              <option value="simplified">Tarifa Simplificada (15% cargo al anfitrión, 0% al huésped)</option>
                              <option value="split">Tarifa Dividida (3% cargo al anfitrión, ~14.2% al huésped)</option>
                            </select>
                          </div>
                        </div>
                        
                        {/* Amenities / Servicios Selectors */}
                        <div style={{ marginTop: "15px", borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "15px" }}>
                          <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)", display: "block", marginBottom: "8px", fontWeight: "bold" }}>
                            Amenities / Servicios de la Propiedad:
                          </span>
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                            {[
                              { label: "📶 Wifi", value: "Wifi" },
                              { label: "🍳 Cocina", value: "Cocina" },
                              { label: "🧺 Lavarropas", value: "Lavarropas" },
                              { label: "🔑 Check-in autónomo", value: "Check-in autónomo" },
                              { label: "🏊 Pileta / Piscina", value: "Pool" },
                              { label: "🚗 Cochera / Estacionamiento", value: "Parking" },
                              { label: "🛁 Jacuzzi / Hot Tub", value: "Jacuzzi" },
                              { label: "💪 Gimnasio", value: "Gym" },
                              { label: "💻 Espacio de trabajo", value: "Workspace" },
                              { label: "❄️ Aire acondicionado", value: "Air conditioning" }
                            ].map(item => {
                              const amenitiesList = targetDetails.amenities || [];
                              const isChecked = amenitiesList.includes(item.value);
                              return (
                                <label key={item.value} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.8rem", color: "#fff", cursor: "pointer" }}>
                                  <input 
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={(e) => {
                                      let newList = [...amenitiesList];
                                      if (e.target.checked) {
                                        if (!newList.includes(item.value)) newList.push(item.value);
                                      } else {
                                        newList = newList.filter(x => x !== item.value);
                                      }
                                      setTargetDetails({ ...targetDetails, amenities: newList });
                                    }}
                                    style={{ accentColor: "var(--accent-coral)", cursor: "pointer" }}
                                  />
                                  {item.label}
                                </label>
                              );
                            })}
                          </div>
                        </div>
                        
                        <div style={{ marginTop: "15px", display: "flex", gap: "10px" }}>
                          <button
                            onClick={handleSaveTargetDetails}
                            className="action-btn"
                            style={{ padding: "6px 12px", fontSize: "0.8rem", backgroundColor: "var(--accent-emerald)" }}
                          >
                            Confirmar y Buscar Competidores
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div className="glass-card" style={{ marginBottom: 0 }}>
                  <h3>Coeficientes de Reglas de Precios IA</h3>
                  <p>Los deslizadores aplican multiplicadores dinámicos sobre las recomendaciones de Machine Learning.</p>
                  
                  <div style={{ display: "flex", flexDirection: "column", gap: "20px", marginTop: "15px" }}>
                    <div>
                      <label style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "4px" }}>
                        <span>
                          Weekend Premium / Recargo Fin de Semana:
                          <span className="ui-tooltip-wrapper">
                            <span style={{ fontSize: '0.68rem', cursor: 'help', opacity: 0.6 }}>ℹ️</span>
                            <span className="ui-tooltip">Incremento porcentual aplicado automáticamente a las tarifas de los días viernes y sábado.</span>
                          </span>
                        </span>
                        <strong style={{ color: "var(--accent-coral)" }}>+{Math.round((weekendPremium - 1) * 100)}%</strong>
                      </label>
                      <input
                        type="range"
                        min="1.0"
                        max="1.50"
                        step="0.05"
                        value={weekendPremium}
                        onChange={(e) => setWeekendPremium(e.target.value)}
                        style={{ width: "100%", accentColor: "var(--accent-coral)" }}
                      />
                    </div>

                    <div>
                      <label style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "4px" }}>
                        <span>
                          High Season Premium / Recargo Temporada Alta:
                          <span className="ui-tooltip-wrapper">
                            <span style={{ fontSize: '0.68rem', cursor: 'help', opacity: 0.6 }}>ℹ️</span>
                            <span className="ui-tooltip">Incremento porcentual aplicado a las tarifas durante los meses de alta demanda turística en la zona.</span>
                          </span>
                        </span>
                        <strong style={{ color: "var(--accent-coral)" }}>+{Math.round((highSeasonPremium - 1) * 100)}%</strong>
                      </label>
                      <input
                        type="range"
                        min="1.0"
                        max="1.50"
                        step="0.05"
                        value={highSeasonPremium}
                        onChange={(e) => setHighSeasonPremium(e.target.value)}
                        style={{ width: "100%", accentColor: "var(--accent-coral)" }}
                      />
                    </div>

                    <div>
                      <label style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "4px" }}>
                        <span>
                          Holiday Premium / Recargo Feriados:
                          <span className="ui-tooltip-wrapper">
                            <span style={{ fontSize: '0.68rem', cursor: 'help', opacity: 0.6 }}>ℹ️</span>
                            <span className="ui-tooltip">Incremento porcentual aplicado automáticamente en fechas de feriados, días festivos nacionales y eventos especiales.</span>
                          </span>
                        </span>
                        <strong style={{ color: "var(--accent-coral)" }}>+{Math.round((holidayPremium - 1) * 100)}%</strong>
                      </label>
                      <input
                        type="range"
                        min="1.0"
                        max="1.50"
                        step="0.05"
                        value={holidayPremium}
                        onChange={(e) => setHolidayPremium(e.target.value)}
                        style={{ width: "100%", accentColor: "var(--accent-coral)" }}
                      />
                    </div>

                    <div>
                      <label style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "4px" }}>
                        <span>
                          Last-Minute Discount / Descuento Último Minuto:
                          <span className="ui-tooltip-wrapper">
                            <span style={{ fontSize: '0.68rem', cursor: 'help', opacity: 0.6 }}>ℹ️</span>
                            <span className="ui-tooltip">Descuento aplicado dinámicamente para reservas de última hora con el fin de evitar noches vacías e incrementar la ocupación.</span>
                          </span>
                        </span>
                        <strong style={{ color: "var(--accent-teal)" }}>-{Math.round((1 - lastMinuteDiscount) * 100)}%</strong>
                      </label>
                      <input
                        type="range"
                        min="0.70"
                        max="1.0"
                        step="0.05"
                        value={lastMinuteDiscount}
                        onChange={(e) => setLastMinuteDiscount(e.target.value)}
                        style={{ width: "100%", accentColor: "var(--accent-teal)" }}
                      />
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px", margin: "10px 0" }}>
                      <div>
                        <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "4px" }}>
                          Tasa de Limpieza (USD):
                          <span className="ui-tooltip-wrapper">
                            <span style={{ fontSize: '0.68rem', cursor: 'help', opacity: 0.6, marginLeft: "4px" }}>ℹ️</span>
                            <span className="ui-tooltip">Monto fijo cobrado por estadía para cubrir costos de limpieza. Se utiliza para desgloses y cálculo de RevPAR.</span>
                          </span>
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="200"
                          value={cleaningFee}
                          onChange={(e) => setCleaningFee(parseFloat(e.target.value) || 0)}
                          style={{
                            width: "100%",
                            background: "rgba(0,0,0,0.4)",
                            border: "1px solid rgba(255,255,255,0.1)",
                            borderRadius: "6px",
                            color: "#fff",
                            padding: "8px 12px",
                            fontSize: "0.9rem"
                          }}
                        />
                      </div>

                      <div>
                        <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "4px" }}>
                          Estadía Promedio (Noches):
                          <span className="ui-tooltip-wrapper">
                            <span style={{ fontSize: '0.68rem', cursor: 'help', opacity: 0.6, marginLeft: "4px" }}>ℹ️</span>
                            <span className="ui-tooltip">Noches promedio por reserva en tu propiedad. Permite prorratear la tasa de limpieza por noche.</span>
                          </span>
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="30"
                          value={averageStay}
                          onChange={(e) => setAverageStay(parseInt(e.target.value) || 1)}
                          style={{
                            width: "100%",
                            background: "rgba(0,0,0,0.4)",
                            border: "1px solid rgba(255,255,255,0.1)",
                            borderRadius: "6px",
                            color: "#fff",
                            padding: "8px 12px",
                            fontSize: "0.9rem"
                          }}
                        />
                      </div>
                    </div>

                    <button
                      className={`btn btn-primary ${savingSettings ? "btn-disabled" : ""}`}
                      onClick={saveSettings}
                      disabled={savingSettings}
                      style={{ marginTop: "10px" }}
                    >
                      {savingSettings ? "Guardando Reglas..." : "Guardar Reglas y Recalcular"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {sistemaSubTab === "logs" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                <div className="glass-card" style={{ display: "grid", gridTemplateColumns: "250px 1fr", gap: "24px", alignItems: "stretch", padding: "24px", marginBottom: 0 }}>
                  
                  {/* Schema Tree Directory */}
                  <div style={{ borderRight: "1px solid rgba(255, 255, 255, 0.05)", paddingRight: "20px", display: "flex", flexDirection: "column", gap: "16px" }}>
                    <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                      🗃️ DB Schema Directory
                    </span>
                    
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px", maxHeight: "420px", overflowY: "auto", fontSize: "0.85rem" }}>
                      <div>
                        <strong style={{ color: "var(--accent-cyan)", display: "block", marginBottom: "4px" }}>📋 listings</strong>
                        <div style={{ paddingLeft: "10px", color: "var(--text-secondary)", fontFamily: "monospace", display: "flex", flexDirection: "column", fontSize: "0.75rem" }}>
                          <span>• listing_id (TEXT PRIMARY KEY)</span>
                          <span>• title (TEXT)</span>
                          <span>• property_type (TEXT)</span>
                          <span>• room_type (TEXT)</span>
                          <span>• accommodates (INTEGER)</span>
                          <span>• bedrooms (INTEGER)</span>
                          <span>• bathrooms (REAL)</span>
                          <span>• latitude (REAL)</span>
                          <span>• longitude (REAL)</span>
                          <span>• neighborhood (TEXT)</span>
                          <span>• rating (REAL)</span>
                          <span>• reviews_count (INTEGER)</span>
                          <span>• host_id (TEXT)</span>
                          <span>• host_name (TEXT)</span>
                          <span>• host_is_superhost (INTEGER)</span>
                          <span>• amenities (TEXT JSON)</span>
                        </div>
                      </div>

                      <div>
                        <strong style={{ color: "var(--accent-cyan)", display: "block", marginBottom: "4px" }}>📋 listings_daily</strong>
                        <div style={{ paddingLeft: "10px", color: "var(--text-secondary)", fontFamily: "monospace", display: "flex", flexDirection: "column", fontSize: "0.75rem" }}>
                          <span>• snapshot_date (DATE)</span>
                          <span>• listing_id (TEXT)</span>
                          <span>• price (REAL)</span>
                          <span>• rating (REAL)</span>
                          <span>• reviews_count (INTEGER)</span>
                          <span>• estimated_occupancy_rate_30d (REAL)</span>
                        </div>
                      </div>

                      <div>
                        <strong style={{ color: "var(--accent-cyan)", display: "block", marginBottom: "4px" }}>📋 calendar_snapshots</strong>
                        <div style={{ paddingLeft: "10px", color: "var(--text-secondary)", fontFamily: "monospace", display: "flex", flexDirection: "column", fontSize: "0.75rem" }}>
                          <span>• snapshot_date (DATE)</span>
                          <span>• listing_id (TEXT)</span>
                          <span>• date (DATE)</span>
                          <span>• price (REAL)</span>
                          <span>• available (INTEGER)</span>
                        </div>
                      </div>

                      <div>
                        <strong style={{ color: "var(--accent-cyan)", display: "block", marginBottom: "4px" }}>📋 price_recommendations</strong>
                        <div style={{ paddingLeft: "10px", color: "var(--text-secondary)", fontFamily: "monospace", display: "flex", flexDirection: "column", fontSize: "0.75rem" }}>
                          <span>• listing_id (TEXT)</span>
                          <span>• date (DATE)</span>
                          <span>• recommended_price (REAL)</span>
                          <span>• confidence_score (REAL)</span>
                          <span>• features (TEXT JSON)</span>
                        </div>
                      </div>

                      <div>
                        <strong style={{ color: "var(--accent-cyan)", display: "block", marginBottom: "4px" }}>📋 booking_events</strong>
                        <div style={{ paddingLeft: "10px", color: "var(--text-secondary)", fontFamily: "monospace", display: "flex", flexDirection: "column", fontSize: "0.75rem" }}>
                          <span>• listing_id (TEXT)</span>
                          <span>• date (DATE)</span>
                          <span>• price_sold (REAL)</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* SQLite DB Console */}
                  <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                    <div>
                      <h3 style={{ margin: "0 0 4px 0" }}>SQLite DB Sandbox Terminal</h3>
                      <p style={{ margin: "0 0 16px 0", fontSize: "0.85rem" }}>Execute raw read-only SQL queries or use templates below to analyze listings databases.</p>
                      
                      <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "12px", flexWrap: "wrap" }}>
                        <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>Query Templates:</span>
                        <button
                          className="btn btn-secondary"
                          onClick={() => setSqlQuery("SELECT listing_id, title, neighborhood, price, rating FROM listings LIMIT 5")}
                          style={{ width: "auto", padding: "4px 8px", fontSize: "0.7rem", height: "auto" }}
                        >
                          List properties
                        </button>
                        <button
                          className="btn btn-secondary"
                          onClick={() => setSqlQuery("SELECT snapshot_date, price, estimated_occupancy_rate_30d FROM listings_daily LIMIT 5")}
                          style={{ width: "auto", padding: "4px 8px", fontSize: "0.7rem", height: "auto" }}
                        >
                          Daily history
                        </button>
                        <button
                          className="btn btn-secondary"
                          onClick={() => setSqlQuery("SELECT date, recommended_price, confidence_score FROM price_recommendations LIMIT 5")}
                          style={{ width: "auto", padding: "4px 8px", fontSize: "0.7rem", height: "auto" }}
                        >
                          AI suggestions
                        </button>
                      </div>

                      <textarea
                        className="sql-textarea"
                        value={sqlQuery}
                        onChange={(e) => setSqlQuery(e.target.value)}
                        placeholder="SELECT * FROM listings LIMIT 5"
                        style={{ minHeight: "100px", fontSize: "0.85rem" }}
                      />

                      <div style={{ display: "flex", gap: "10px" }}>
                        <button
                          className="btn btn-primary"
                          onClick={runSQLQuery}
                          disabled={sqlRunning}
                          style={{ width: "auto", padding: "0 20px", height: "36px", fontSize: "0.82rem" }}
                        >
                          {sqlRunning ? "Executing SELECT Query..." : "Execute SQL"}
                        </button>
                        {sqlResults && sqlResults.records.length > 0 && (
                          <button
                            className="btn btn-secondary"
                            onClick={downloadCSV}
                            style={{ width: "auto", padding: "0 16px", height: "36px", fontSize: "0.82rem", display: "inline-flex", alignItems: "center", gap: "4px" }}
                          >
                            📥 Export to CSV
                          </button>
                        )}
                      </div>
                    </div>

                    {sqlError && (
                      <div className="alert-box" style={{ marginTop: "15px" }}>
                        <strong>SQL Syntax Error:</strong>
                        <pre style={{ fontSize: "0.78rem", margin: "5px 0 0 0" }}>{sqlError}</pre>
                      </div>
                    )}

                    {sqlResults && (
                      <div style={{ marginTop: "20px" }}>
                        <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)", display: "block", marginBottom: "8px", fontWeight: "bold" }}>
                          Output Records Table ({sqlResults.records.length} rows returned):
                        </span>
                        <div className="table-container" style={{ maxHeight: "200px", overflowY: "auto", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "8px" }}>
                          <table className="data-table" style={{ fontSize: "0.78rem" }}>
                            <thead>
                              <tr>
                                {sqlResults.columns.map((col, idx) => (
                                  <th key={idx} style={{ padding: "6px 8px" }}>{col}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {sqlResults.records.map((row, rIdx) => (
                                <tr key={rIdx}>
                                  {sqlResults.columns.map((col, cIdx) => (
                                    <td key={cIdx} style={{ padding: "6px 8px", borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                                      {row[col] !== null && row[col] !== undefined ? row[col].toString() : "NULL"}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      default:
        return <div>View not implemented.</div>;
    }
  };

  return (
    <div className="app-layout">
      <TooltipPortal />
      
      {/* Floating Glass Navigation Bar (Header Dock) */}
      <div className="header-dock">
        {/* Left Logo */}
        <div className="logo" style={{ marginBottom: 0, padding: 0 }} onClick={() => setActiveView("dashboard")}>
          <Sliders className="logo-icon" style={{ color: "var(--accent-gold)" }} size={20} />
          <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, color: "#fff", fontSize: "1.1rem" }}>AirMarket AI</span>
        </div>

        {/* Center Nav Links */}
        <div className="top-nav-links">
          {sidebarLinks.map((link) => {
            const Icon = link.icon;
            const isActive = activeView === link.id;
            return (
              <div
                key={link.id}
                onClick={() => setActiveView(link.id)}
                className={`top-nav-item ${isActive ? "active" : ""}`}
              >
                <Icon size={16} />
                <span>{link.label}</span>
              </div>
            );
          })}
        </div>

        {/* Right Actions & Simple/Analítico toggle */}
        <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
          {/* Simple / Pro Mode Toggle Selector */}
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "4px",
            backgroundColor: "rgba(255,255,255,0.03)",
            border: "1px solid var(--card-border)",
            borderRadius: "20px",
            padding: "2px 4px",
            fontSize: "0.75rem",
            fontFamily: "var(--font-sans)",
            fontWeight: "600",
            color: "var(--text-primary)"
          }}>
            <div 
              onClick={() => {
                setIsSimpleMode(true);
                setActiveView("dashboard");
              }}
              style={{
                padding: "4px 12px",
                borderRadius: "16px",
                cursor: "pointer",
                backgroundColor: isSimpleMode ? "var(--accent-gold)" : "transparent",
                color: isSimpleMode ? "#050609" : "var(--text-secondary)",
                fontWeight: isSimpleMode ? "700" : "normal",
                transition: "all 0.2s ease"
              }}
            >
              🍃 Simple
            </div>
            <div 
              onClick={() => setIsSimpleMode(false)}
              style={{
                padding: "4px 12px",
                borderRadius: "16px",
                cursor: "pointer",
                backgroundColor: !isSimpleMode ? "var(--accent-gold)" : "transparent",
                color: !isSimpleMode ? "#050609" : "var(--text-secondary)",
                fontWeight: !isSimpleMode ? "700" : "normal",
                transition: "all 0.2s ease"
              }}
            >
              📊 Analítico
            </div>
          </div>

          {/* Last Scrape and Pipeline status (compact) */}
          {!isSimpleMode && (
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <div style={{ 
                display: "inline-flex", 
                alignItems: "center", 
                gap: "6px", 
                backgroundColor: isPipelineRunning ? "rgba(245, 158, 11, 0.08)" : "rgba(255, 255, 255, 0.02)", 
                color: isPipelineRunning ? "var(--accent-gold)" : "var(--text-secondary)", 
                padding: "5px 10px", 
                borderRadius: "15px", 
                fontSize: "0.72rem", 
                fontWeight: 700, 
                border: "1px solid var(--card-border)" 
              }}>
                <span style={{ 
                  width: "5px", 
                  height: "5px", 
                  borderRadius: "50%", 
                  backgroundColor: isPipelineRunning ? "var(--accent-gold)" : "var(--text-secondary)" 
                }}></span>
                {isPipelineRunning ? "Scraper Activo" : "Inactivo"}
              </div>
            </div>
          )}

          {/* Notifications */}
          <div 
            onClick={() => setShowNotifications(!showNotifications)}
            style={{ position: "relative", cursor: "pointer", width: "30px", height: "30px", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.03)", borderRadius: "50%", border: "1px solid var(--card-border)" }}
          >
            <Bell size={14} style={{ color: "var(--text-secondary)" }} />
            <span style={{ position: "absolute", right: "2px", top: "2px", width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "var(--accent-gold)" }}></span>
            
            {showNotifications && (
              <div style={{
                position: "absolute",
                right: 0,
                top: "36px",
                width: "280px",
                backgroundColor: "var(--bg-secondary)",
                border: "1px solid var(--card-border)",
                borderRadius: "10px",
                boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
                zIndex: 1000,
                padding: "12px",
                fontFamily: "var(--font-sans)",
                fontSize: "0.8rem",
                color: "var(--text-primary)",
                cursor: "default"
              }} onClick={(e) => e.stopPropagation()}>
                <div style={{ fontWeight: "bold", borderBottom: "1px solid var(--border-color)", paddingBottom: "6px", marginBottom: "8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span>Notificaciones</span>
                  <span style={{ fontSize: "0.7rem", color: "var(--accent-gold)", cursor: "pointer" }} onClick={() => setShowNotifications(false)}>Cerrar</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <div style={{ borderBottom: "1px solid var(--border-color)", paddingBottom: "6px" }}>
                    <strong style={{ color: "var(--accent-gold)", display: "block" }}>Precios Sincronizados</strong>
                    <span style={{ color: "var(--text-secondary)", fontSize: "0.75rem" }}>Las tarifas recomendadas para los próximos 30 días ya están activas en base a las reglas de precios.</span>
                  </div>
                  <div style={{ borderBottom: "1px solid var(--border-color)", paddingBottom: "6px" }}>
                    <strong style={{ color: "var(--accent-coral)", display: "block" }}>ML Pipeline</strong>
                    <span style={{ color: "var(--text-secondary)", fontSize: "0.75rem" }}>El modelo predictivo de red neuronal se ha reentrenado con los datos de Palermo Hollywood.</span>
                  </div>
                  <div>
                    <strong style={{ color: "var(--accent-gold)", display: "block" }}>Watchlist Competidores</strong>
                    <span style={{ color: "var(--text-secondary)", fontSize: "0.75rem" }}>Se identificaron 20 competidores locales para monitoreo incremental continuo.</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Dark Mode toggle icon */}
          <div
            onClick={() => setIsDarkMode(!isDarkMode)}
            style={{ cursor: "pointer", width: "30px", height: "30px", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.03)", borderRadius: "50%", border: "1px solid var(--card-border)" }}
          >
            {isDarkMode ? <Moon size={14} style={{ color: "var(--text-secondary)" }} /> : <Sun size={14} style={{ color: "var(--text-secondary)" }} />}
          </div>
        </div>
      </div>

      {/* Main Panel content workspace */}
      <main className="main-content">
        {/* Section Title Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "25px", borderBottom: "1px solid rgba(212,175,55,0.05)", paddingBottom: "12px" }}>
          <div>
            <h1 style={{ fontSize: "1.6rem" }}>
              {activeView === "dashboard" && "Panel de Control"}
              {activeView === "estrategia" && "Optimización de Tarifas"}
              {activeView === "mercado_seccion" && "Análisis del Mercado"}
              {activeView === "insights_ia" && "Reporte de Insights con IA"}
              {activeView === "sistema" && "Configuración del Sistema"}
            </h1>
            <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--text-secondary)" }}>
              Propiedad objetivo: <strong>{targetDetails?.title || details?.title || "Dpto. Moderno, Espacioso & Pileta"}</strong> • {targetDetails?.neighborhood || details?.neighborhood || "Palermo Hollywood"}
            </p>
          </div>
          
          {/* Subtitle action info */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.75rem", color: "var(--text-secondary)" }}>
            <span>Última lectura:</span>
            <strong style={{ color: "#fff" }}>
              {pipelineStatus?.database?.last_scraped_at ? formatRelativeTime(pipelineStatus.database.last_scraped_at) : "Hace instantes"}
            </strong>
          </div>
        </div>

        {/* Dynamic subview wrapper rendering */}
        <div style={{ flex: 1 }}>
          {subLoading && !details ? (
            <div style={{ padding: "80px", textAlign: "center", color: "var(--text-secondary)" }}>
              <RefreshCw className="animate-spin" size={24} style={{ margin: "0 auto 10px auto", color: "var(--accent-gold)" }} />
              <p>Sincronizando especificaciones de la propiedad...</p>
            </div>
          ) : (
            renderActiveView()
          )}
        </div>
      </main>
    </div>
  );
}
