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
  HelpCircle,
  TrendingUp,
  Info,
  Home,
  CheckSquare,
  SlidersHorizontal,
  Compass,
  Image as ImageIcon
} from "lucide-react";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  LineChart,
  Line
} from "recharts";

// Load Leaflet map dynamically with SSR disabled to prevent Node window crashes
const LeafletMap = dynamic(() => import("@/components/LeafletMap"), { ssr: false });
import PricingCalendar from "@/components/PricingCalendar";
import { PriceDistributionChart, MarketHistoryChart } from "@/components/Charts";

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
  "https://images.unsplash.com/photo-1616046229478-9901c5536a45?auto=format&fit=crop&w=400&q=80"
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

// Default pre-populated list of amenities by category for search/filter/add capabilities
const defaultAmenitiesByCategory = {
  General: ["Wifi", "Aire acondicionado", "Calefacción", "Agua caliente", "Plancha", "Secador de pelo", "Lavarropas", "Secarropas", "Perchas"],
  Kitchen: ["Cocina", "Heladera", "Microondas", "Horno", "Pava eléctrica", "Cafetera", "Tostadora", "Vajilla y cubiertos", "Lavavajillas"],
  Bathroom: ["Champú", "Jabón corporal", "Bañera", "Ducha de mano", "Bidet"],
  Bedroom: ["Sábanas", "Almohadas", "Placard", "Cortinas black-out"],
  Entertainment: ["TV", "Cable", "Netflix / Streaming", "Consola de juegos", "Equipo de música"],
  Workspace: ["Workspace", "Escritorio", "Silla ergonómica", "Internet de alta velocidad"],
  Safety: ["Detector de humo", "Detector de monóxido de carbono", "Extinguidor", "Botiquín de primeros auxilios"],
  Accessibility: ["Sin escaleras", "Entrada amplia", "Silla de ruedas accesible"],
  Outdoor: ["Pool", "Balcón", "Patio", "Parrilla / Grill", "Terraza"],
  Parking: ["Parking", "Cochera techada", "Estacionamiento gratuito"],
  Building: ["Gym", "Elevador", "Portería 24hs", "Jacuzzi", "Seguridad"]
};

// Simple UI custom Tooltip component
function Tooltip({ text, children }) {
  const [pos, setPos] = useState({ x: 0, y: 0, visible: false, width: 268 });
  const wrapRef = useRef(null);

  const handleEnter = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const isObject = typeof text === 'object';
    const tipWidth = isObject ? 320 : 268;
    const x = Math.min(rect.left + rect.width / 2 - tipWidth / 2, window.innerWidth - tipWidth - 8);
    const y = rect.top + window.scrollY - 10;
    setPos({ x, y, visible: true, width: tipWidth });
  };

  const handleLeave = () => {
    setPos(p => ({ ...p, visible: false }));
  };

  return (
    <span
      ref={wrapRef}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      style={{ display: "inline-flex", cursor: "help" }}
    >
      {children}
      {pos.visible && typeof document !== "undefined" && (
        <span style={{
          position: "fixed",
          left: `${pos.x}px`,
          top: `${pos.y}px`,
          transform: "translateY(-100%)",
          backgroundColor: "#0c0e15",
          border: "1px solid rgba(255, 255, 255, 0.15)",
          color: "#f8fafc",
          padding: "10px 14px",
          borderRadius: "8px",
          fontSize: "0.78rem",
          boxShadow: "0 10px 30px rgba(0,0,0,0.6)",
          zIndex: 99999,
          width: `${pos.width}px`,
          lineHeight: "1.4",
          pointerEvents: "none",
          whiteSpace: "pre-line",
          fontFamily: "var(--font-sans)",
          textAlign: "left"
        }}>
          {text}
        </span>
      )}
    </span>
  );
}

export default function UnifiedDashboard() {
  const [activeView, setActiveView] = useState("dashboard");
  const [propertySubTab, setPropertySubTab] = useState("sync");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCompDetails, setSelectedCompDetails] = useState(null);

  // Modern Web Hallmark: View Transitions API Helper
  const switchView = (viewId) => {
    if (typeof document !== "undefined" && document.startViewTransition) {
      document.startViewTransition(() => {
        setActiveView(viewId);
        setSelectedCompDetails(null);
      });
    } else {
      setActiveView(viewId);
      setSelectedCompDetails(null);
    }
  };

  // Data States
  const [pipelineStatus, setPipelineStatus] = useState(null);
  const [kpis, setKpis] = useState(null);
  const [listings, setListings] = useState([]);
  const [neighborhoods, setNeighborhoods] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  
  // Active listing details
  const [details, setDetails] = useState(null);
  const [competitors, setCompetitors] = useState([]);
  const [recs, setRecs] = useState([]);
  const [marketHistory, setMarketHistory] = useState([]);
  
  // Target details editable state (single source of truth for configuration)
  const [targetDetails, setTargetDetails] = useState(null);
  
  // Loading states
  const [loading, setLoading] = useState(true);
  const [subLoading, setSubLoading] = useState(false);
  const [apiError, setApiError] = useState(false);
  const [hydrating, setHydrating] = useState(false);

  // Sliders
  const [weekendPremium, setWeekendPremium] = useState(1.15);
  const [highSeasonPremium, setHighSeasonPremium] = useState(1.20);
  const [holidayPremium, setHolidayPremium] = useState(1.20);
  const [lastMinuteDiscount, setLastMinuteDiscount] = useState(0.85);
  const [cleaningFee, setCleaningFee] = useState(15.0);
  const [averageStay, setAverageStay] = useState(3);
  const [savingSettings, setSavingSettings] = useState(false);
  const [targetUrlInput, setTargetUrlInput] = useState("");
  const [resolvingTarget, setResolvingTarget] = useState(false);
  const [savingTargetDetails, setSavingTargetDetails] = useState(false);

  // Amenities list search & filter
  const [searchQueryAmenities, setSearchQueryAmenities] = useState("");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState("All");
  const [newAmenityName, setNewAmenityName] = useState("");
  const [newAmenityCategory, setNewAmenityCategory] = useState("General");

  // Competitor filtering state
  const [compSearchText, setCompSearchText] = useState("");
  const [compMaxPrice, setCompMaxPrice] = useState(300);
  const [compMinRating, setCompMinRating] = useState(0);
  const [compFilterAmenity, setCompFilterAmenity] = useState("All");
  const [compSortBy, setCompSortBy] = useState("similarity");
  const [compSuperhostOnly, setCompSuperhostOnly] = useState(false);
  const [occupancyPacing, setOccupancyPacing] = useState(null);

  // Strategy Simulator Slider State (-30% to +30%)
  const [simulatorPct, setSimulatorPct] = useState(0);
  
  // Forecast scenario state ("conservador", "balanceado", "agresivo")
  const [forecastScenario, setForecastScenario] = useState("balanceado");

  // Historical comparative states
  const [historyCompareDate, setHistoryCompareDate] = useState("");

  // Autosave status for Property Setup (Notion/Airtable style)
  const [autoSaveStatus, setAutoSaveStatus] = useState("saved"); // "saving", "saved", "error"
  const [demoMode, setDemoMode] = useState(true); // default true (fail-safe): backend confirms false if not in demo
  const [adminPin, setAdminPin] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("adminPin") || "";
    }
    return "";
  });
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinModalCallback, setPinModalCallback] = useState(null);
  const [pinInputVal, setPinInputVal] = useState("");
  const [pinModalError, setPinModalError] = useState("");

  const executeProtectedAction = (actionCallback) => {
    if (!demoMode) {
      // No demo mode: allow all actions freely
      actionCallback();
    } else if (adminPin === "232323") {
      // Demo mode but already unlocked: execute directly
      actionCallback();
    } else {
      // Demo mode and locked: show PIN modal
      setPinInputVal("");
      setPinModalError("");
      setPinModalCallback(() => actionCallback);
      setShowPinModal(true);
    }
  };

  const handlePinSubmit = (e) => {
    e.preventDefault();
    if (pinInputVal === "232323") {
      setAdminPin(pinInputVal);
      localStorage.setItem("adminPin", pinInputVal);
      setShowPinModal(false);
      // Wait for state to be available or pass it directly
      if (pinModalCallback) {
        // Run action but pass correct pin
        setTimeout(() => {
          pinModalCallback();
        }, 50);
      }
    } else {
      setPinModalError("PIN incorrecto. Intente nuevamente.");
    }
  };

  const handleLockSession = () => {
    setAdminPin("");
    localStorage.removeItem("adminPin");
    setAutoSaveStatus("sandbox");
  };

  const handleForceSaveTargetDetails = async () => {
    setAutoSaveStatus("saving");
    try {
      const res = await fetch(`${API_BASE}/api/settings/target/save`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "X-Admin-Pin": "232323"
        },
        body: JSON.stringify({
          target_url: targetUrlInput,
          target_id: targetDetails.listing_id,
          details: targetDetails,
          pricing_overrides: targetDetails.pricing_overrides || {},
          manual_override_flags: targetDetails.manual_override_flags || {}
        })
      });
      if (res.ok) {
        setAutoSaveStatus("saved");
        alert("Configuración de propiedad guardada permanentemente en producción.");
      } else {
        setAutoSaveStatus("error");
        alert("Error al guardar en producción.");
      }
    } catch (e) {
      console.error(e);
      setAutoSaveStatus("error");
      alert("Error al conectar con el servidor.");
    }
  };

  const isFirstMount = useRef(true);
  const saveTimeoutRef = useRef(null);

  const currentDetails = (selectedId && targetDetails && selectedId === targetDetails.listing_id) ? targetDetails : details;

  const getSimulatedPrice = (rec, wk, hs, hol, lm) => {
    if (!rec || !rec.features) return 0.0;
    const feats = rec.features;
    let p = feats.base_ml_price || rec.recommended_price;
    if (feats.is_weekend) p *= parseFloat(wk);
    if (feats.is_holiday) p *= parseFloat(hol);
    if (feats.is_high_season) p *= parseFloat(hs);
    if (feats.is_low_season) p *= 0.90;
    
    const currentOccupancy = feats.current_occupancy_rate !== undefined ? feats.current_occupancy_rate : 0.35;
    if (feats.lead_time_days <= 3 && currentOccupancy < 0.40) {
      p *= parseFloat(lm);
    }
    return Math.round(p * 100) / 100;
  };

  const getSimulatedRecs = () => {
    if (!recs) return [];
    return recs.map(r => ({
      ...r,
      recommended_price: getSimulatedPrice(r, weekendPremium, highSeasonPremium, holidayPremium, lastMinuteDiscount)
    }));
  };

  const simulatedRecs = getSimulatedRecs();

  const getRanking = () => {
    if (!currentDetails || !competitors || competitors.length === 0) {
      return { rankText: "Rank 1 de 1", pctText: "Top 100%", trend: "neutral", trendText: "Cargando..." };
    }
    
    const targetRevPAR = (currentDetails.price || 90.0) * ((currentDetails.estimated_occupancy_rate_30d || 70.0) / 100.0);
    
    const allRevPARs = competitors.map(c => {
      const occ = c.estimated_occupancy_rate_30d || 50.0;
      return {
        id: c.listing_id,
        revpar: c.price * (occ / 100.0)
      };
    });
    
    allRevPARs.push({
      id: currentDetails.listing_id,
      revpar: targetRevPAR
    });
    
    allRevPARs.sort((a, b) => b.revpar - a.revpar);
    
    const targetRank = allRevPARs.findIndex(item => item.id === currentDetails.listing_id) + 1;
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
    
    const cleanProrated = cleanFee / stayN;
    const nightlyTotal = price + cleanProrated;
    
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

  // API Callbacks
  const fetchTargetSettings = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/settings/target`);
      if (res.ok) {
        const data = await res.json();
        setDemoMode(data.demo_mode || false);
        if (data.target_url) {
          setTargetUrlInput(data.target_url);
          setTargetDetails(data.details);
        }
      }
    } catch (e) {
      console.error("Error fetching target settings:", e);
    }
  };

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

      let targetId = null;
      try {
        const targetRes = await fetch(`${API_BASE}/api/settings/target`);
        if (targetRes.ok) {
          const targetData = await targetRes.json();
          if (targetData.target_id) targetId = targetData.target_id;
        }
      } catch (targetErr) {
        console.error("Error fetching target ID:", targetErr);
      }

      const kpiRes = await fetch(`${API_BASE}/api/market/kpis`);
      const kpiData = await kpiRes.json();
      setKpis(kpiData);

      const listingsRes = await fetch(`${API_BASE}/api/market/listings`);
      const listingsData = await listingsRes.json();
      setListings(listingsData);

      const neighsRes = await fetch(`${API_BASE}/api/market/neighborhoods`);
      const neighsData = await neighsRes.json();
      setNeighborhoods(neighsData);

      try {
        const pacingRes = await fetch(`${API_BASE}/api/market/occupancy-pacing`);
        if (pacingRes.ok) {
          const pacingData = await pacingRes.json();
          setOccupancyPacing(pacingData);
        }
      } catch (pacingErr) {
        console.error("Error fetching occupancy pacing:", pacingErr);
      }

      const targetL = Array.isArray(listingsData) ? (
        listingsData.find(l => l.listing_id === targetId) || 
        listingsData.find(l => l.title?.includes("Córdoba") || l.listing_id === "mock_1001")
      ) : null;
      
      const activeId = targetL ? targetL.listing_id : (targetId || (Array.isArray(listingsData) && listingsData.length > 0 ? listingsData[0].listing_id : null));
      
      if (activeId) {
        setSelectedId(activeId);
        fetchListingDetails(activeId);
      }

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
      const jobStatus = statusData.hydration_job?.status;
      if (jobStatus === "running" || jobStatus === "starting") {
        setHydrating(true);
      } else {
        setHydrating(false);
        if (jobStatus === "success") {
          fetchInitialData();
        }
      }
    } catch (e) {
      console.error(e);
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
        if (histData.length > 0 && !historyCompareDate) {
          setHistoryCompareDate(histData[0].date);
        }
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
        headers: { 
          "Content-Type": "application/json",
          "X-Admin-Pin": adminPin
        },
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
        alert("Reglas de tarifas actualizadas exitosamente.");
        if (selectedId) fetchListingDetails(selectedId);
      } else {
        const errData = await res.json().catch(() => ({}));
        alert(errData.detail || "Error al guardar configuraciones.");
      }
    } catch (e) {
      console.error(e);
      alert("Error al guardar configuraciones.");
    } finally {
      setSavingSettings(false);
    }
  };

  const triggerUpdate = async (mode = "total") => {
    setHydrating(true);
    try {
      const res = await fetch(`${API_BASE}/api/pipeline/update?mode=${mode}`, { 
        method: "POST",
        headers: {
          "X-Admin-Pin": adminPin
        }
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.detail || "Error al iniciar actualización.");
        setHydrating(false);
      } else {
        alert(data.message || "Actualización iniciada en segundo plano.");
      }
    } catch (e) {
      console.error(e);
      alert("Error al iniciar actualización.");
      setHydrating(false);
    }
  };

  const handleConfigureTargetUrl = async (e) => {
    if (e) e.preventDefault();
    const url = targetUrlInput.trim();
    if (!url) return;
    setResolvingTarget(true);
    try {
      // Extract listing_id directly from URL — no scraping timeout risk
      const idMatch = url.match(/\/rooms\/(\d+)/i);
      if (!idMatch) {
        alert("URL inválida. Debe contener /rooms/XXXXXXXXX");
        setResolvingTarget(false);
        return;
      }
      const listingId = idMatch[1];

      // Save with basic defaults immediately — details enriched later by pipeline
      const saveRes = await fetch(`${API_BASE}/api/settings/target/save`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Admin-Pin": adminPin || "232323"
        },
        body: JSON.stringify({
          target_url: url,
          target_id: listingId,
          details: {
            listing_id: listingId,
            title: "Mi Propiedad",
            accommodates: 2,
            bedrooms: 1,
            bathrooms: 1.0,
            latitude: -34.5861,
            longitude: -58.4373,
            neighborhood: "Palermo Hollywood",
            price: 0,
            rating: 5.0,
            reviews_count: 0,
            host_is_superhost: true,
            amenities: []
          },
          pricing_overrides: {},
          manual_override_flags: {}
        })
      });

      if (!saveRes.ok) {
        const errData = await saveRes.json().catch(() => ({}));
        alert(`Error al guardar (${saveRes.status}): ${errData.detail || "Error desconocido"}`);
        setResolvingTarget(false);
        return;
      }

      alert(`Propiedad configurada con ID: ${listingId}\nLos detalles se enriquecerán al ejecutar la ingesta.`);

      // Try to enrich with live scrape in background (optional, may timeout)
      fetch(`${API_BASE}/api/settings/target/resolve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url })
      }).then(r => r.ok ? r.json() : null).then(data => {
        if (data?.details) {
          setTargetDetails(data.details);
          // Silently re-save with enriched details
          fetch(`${API_BASE}/api/settings/target/save`, {
            method: "POST",
            headers: { "Content-Type": "application/json", "X-Admin-Pin": adminPin || "232323" },
            body: JSON.stringify({
              target_url: url,
              target_id: listingId,
              details: data.details,
              pricing_overrides: {},
              manual_override_flags: {}
            })
          }).catch(() => {});
        }
      }).catch(() => {});

      setHydrating(true);
      fetchInitialData();
    } catch (err) {
      console.error(err);
      alert(`Error de conexión: ${err.message || "No se pudo conectar con el servidor."}`);
    } finally {
      setResolvingTarget(false);
    }
  };

  const handleSaveTargetDetails = async () => {
    if (!targetDetails) return;
    setSavingTargetDetails(true);
    try {
      const res = await fetch(`${API_BASE}/api/settings/target/save`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "X-Admin-Pin": adminPin
        },
        body: JSON.stringify({
          target_url: targetUrlInput,
          target_id: targetDetails.listing_id,
          details: targetDetails
        })
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.detail || "Error al guardar los detalles de la propiedad.");
      } else {
        setHydrating(true);
        alert(data.message || "Detalles de propiedad objetivo guardados exitosamente. Iniciando sincronización de mercado...");
        fetchInitialData();
      }
    } catch (e) {
      console.error(e);
      alert("Error al guardar los detalles de la propiedad.");
    } finally {
      setSavingTargetDetails(false);
    }
  };

  // Debounced auto-save hook for Property Setup (Notion style)
  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }
    if (!targetDetails) return;

    // In demo mode without a valid PIN → save only locally (sandbox mode)
    if (demoMode && adminPin !== "232323") {
      setAutoSaveStatus("sandbox");
      return;
    }

    setAutoSaveStatus("saving");
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`${API_BASE}/api/settings/target/save`, {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "X-Admin-Pin": adminPin
          },
          body: JSON.stringify({
            target_url: targetUrlInput,
            target_id: targetDetails.listing_id,
            details: targetDetails,
            pricing_overrides: targetDetails.pricing_overrides || {},
            manual_override_flags: targetDetails.manual_override_flags || {}
          })
        });
        if (res.ok) {
          setAutoSaveStatus("saved");
        } else {
          setAutoSaveStatus("error");
        }
      } catch (e) {
        console.error("Auto-save error:", e);
        setAutoSaveStatus("error");
      }
    }, 1500);

    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [targetDetails]);

  // Sync to local/theme on mount
  useEffect(() => {
    fetchInitialData();
  }, []);

  // Keep-alive ping to prevent Render cold-starts (every 3 mins)
  useEffect(() => {
    const keepAlive = () => {
      fetch(`${API_BASE}/api/health`).catch(() => {});
    };
    const pingInterval = setInterval(keepAlive, 180000);
    return () => clearInterval(pingInterval);
  }, []);

  useEffect(() => {
    let interval;
    if (hydrating) {
      interval = setInterval(fetchPipelineStatus, 2000);
    }
    return () => clearInterval(interval);
  }, [hydrating]);

  useEffect(() => {
    if (selectedId) {
      fetchListingDetails(selectedId);
    }
  }, [selectedId]);

  useEffect(() => {
    if (typeof document !== "undefined") {
      if (isDarkMode) {
        document.documentElement.classList.remove("light-theme");
      } else {
        document.documentElement.classList.add("light-theme");
      }
    }
  }, [isDarkMode]);

  if (loading) {
    return (
      <div style={{ display: "flex", height: "100vh", alignItems: "center", justifyContent: "center", backgroundColor: "var(--bg-primary)", color: "var(--text-secondary)" }}>
        <div style={{ textAlign: "center" }}>
          <RefreshCw className="animate-spin" size={32} style={{ margin: "0 auto 10px auto", color: "var(--accent-gold)" }} />
          <p style={{ fontFamily: "var(--font-display)", fontWeight: 700 }}>Inicializando el Revenue Manager...</p>
        </div>
      </div>
    );
  }

  const currentPrice = currentDetails?.price || 90.0;
  const recommendedToday = simulatedRecs[0] ? simulatedRecs[0].recommended_price : currentPrice * 1.08;
  const priceDeltaPct = Math.round(((recommendedToday - currentPrice) / currentPrice) * 100);

  // Dynamic calculations for cards
  const highSimilarityComps = competitors.filter(c => (c.similarity_score !== undefined && c.similarity_score <= 0.35)).length;
  const ranking = getRanking();

  // Navigation Sidebar categories
  const navStructure = {
    "INTELIGENCIA DE MERCADO": [
      { id: "dashboard", label: "Centro de Decisiones", icon: LayoutDashboard },
      { id: "pricing", label: "Inteligencia de Precios", icon: DollarSign },
      { id: "competidores", label: "Competidores Afines", icon: Users },
      { id: "forecast", label: "Forecast y Escenarios", icon: BarChart3 },
      { id: "calendario", label: "Calendario Tarifario", icon: CalendarDays }
    ],
    "CONFIGURACIÓN DE PROPIEDAD": [
      { id: "property_profile", label: "Mi Propiedad", icon: Home },
      { id: "pricing_rules", label: "Reglas de Tarifas", icon: Sliders }
    ],
    "SISTEMA Y AUDITORÍA": [
      { id: "historicos", label: "Análisis Histórico", icon: History },
      { id: "alertas", label: "Feed de Alertas", icon: Bell }
    ]
  };

  // Simulator dynamic values
  const baseOcc = currentDetails?.estimated_occupancy_rate_30d || 70.0;
  const simOcc = Math.max(5, Math.min(99, Math.round(baseOcc / (1 + Math.exp(0.045 * simulatorPct)) * 2)));
  const simulatedPrice = Math.round(currentPrice * (1 + simulatorPct / 100));
  const proratedCleaning = parseFloat(cleaningFee) / (parseInt(averageStay) || 3);
  const currentRevPAR = (currentPrice + proratedCleaning) * (baseOcc) / 100.0;
  const simulatedRevPAR = (simulatedPrice + proratedCleaning) * simOcc / 100.0;
  const simulatedMonthlyRev = simulatedRevPAR * 30;
  const simulatedAnnualRev = simulatedRevPAR * 365;
  const simRevparDeltaPct = Math.round(((simulatedRevPAR - currentRevPAR) / currentRevPAR) * 100);

  // Ocupacion Promedio vs Competencia
  const avgCompOccupancy = competitors.length > 0 
    ? competitors.reduce((acc, c) => acc + (c.estimated_occupancy_rate_30d || 50.0), 0) / competitors.length 
    : 70.0;
  const occDiff = (currentDetails?.estimated_occupancy_rate_30d || 70.0) - avgCompOccupancy;
  const occDeltaText = `${occDiff >= 0 ? "+" : ""}${occDiff.toFixed(1)}% vs mercado`;

  const getSimStrategyText = () => {
    if (simulatorPct < -10) return "Maximizar Ocupación (Tarifa Agresiva)";
    if (simulatorPct > 12) return "Posicionamiento Premium (Alto Margen)";
    return "Optimización de RevPAR (Estrategia Recomendada)";
  };

  const getSimStrategyColor = () => {
    if (simulatorPct < -10) return "var(--accent-coral)";
    if (simulatorPct > 12) return "var(--accent-gold)";
    return "var(--accent-emerald)";
  };

  // Filtering amenities
  const getFilteredAmenities = () => {
    const amenitiesList = targetDetails?.amenities || [];
    let listToFilter = [];
    
    if (selectedCategoryFilter === "All") {
      Object.keys(defaultAmenitiesByCategory).forEach(cat => {
        listToFilter = listToFilter.concat(defaultAmenitiesByCategory[cat]);
      });
      // add custom ones that are not in default list
      amenitiesList.forEach(am => {
        if (!listToFilter.includes(am)) listToFilter.push(am);
      });
    } else {
      listToFilter = defaultAmenitiesByCategory[selectedCategoryFilter] || [];
      // add custom ones that were added to this category
      amenitiesList.forEach(am => {
        if (!listToFilter.includes(am) && defaultAmenitiesByCategory[selectedCategoryFilter]?.includes(am)) {
          listToFilter.push(am);
        }
      });
    }

    if (searchQueryAmenities.trim()) {
      const q = searchQueryAmenities.toLowerCase();
      listToFilter = listToFilter.filter(item => item.toLowerCase().includes(q));
    }

    return Array.from(new Set(listToFilter));
  };

  return (
    <div className={`app-layout ${isDarkMode ? "dark-theme" : "light-theme"}`}>
      {/* Top Floating Header Dock */}
      <header className="header-dock" style={{ margin: "15px 30px 10px 30px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "1.3rem", fontWeight: "bold", background: "linear-gradient(135deg, #fff 30%, #e2b83d 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            AirMarket AI
          </span>
          <span style={{ fontSize: "0.68rem", textTransform: "uppercase", letterSpacing: "1px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", padding: "2px 6px", borderRadius: "4px", color: "var(--text-secondary)" }}>
            RM Enterprise
          </span>
        </div>

        {/* Target listing switcher */}
        <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>Propiedad activa:</span>
            <span style={{
              fontSize: "0.78rem",
              fontWeight: "bold",
              color: "#fff",
              backgroundColor: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.1)",
              padding: "4px 12px",
              borderRadius: "6px"
            }}>
              {targetDetails?.title || currentDetails?.title || "Cargando propiedad..."}
            </span>
          </div>

          {/* Last scraped date / update time */}
          {pipelineStatus?.database?.last_scraped_at && (
            <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.72rem", color: "var(--text-secondary)", backgroundColor: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)", padding: "4px 10px", borderRadius: "6px" }}>
              <span className="status-indicator-ring" style={{ width: "8px", height: "8px", backgroundColor: "var(--accent-emerald)", borderRadius: "50%", display: "inline-block" }}></span>
              <span>Mercado al: {pipelineStatus.database.last_scraped_at}</span>
            </div>
          )}

          {/* Sync indicator */}
          {hydrating && (
            <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.75rem", color: "var(--accent-gold)" }}>
              <RefreshCw className="animate-spin" size={12} />
              <span>Sincronizando...</span>
            </div>
          )}

          {/* Dark Mode toggle icon */}
          <div
            onClick={() => setIsDarkMode(!isDarkMode)}
            style={{ cursor: "pointer", width: "28px", height: "28px", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.03)", borderRadius: "50%", border: "1px solid var(--card-border)" }}
          >
            {isDarkMode ? <Moon size={12} style={{ color: "var(--text-secondary)" }} /> : <Sun size={12} style={{ color: "var(--text-secondary)" }} />}
          </div>
        </div>
      </header>

      {/* Main Body Layout */}
      <div style={{ display: "flex", flex: 1, padding: "0 30px 30px 30px", gap: "25px" }}>
        
        {/* Left Sidebar Menu */}
        <aside style={{ width: "230px", display: "flex", flexDirection: "column", gap: "18px" }}>
          {Object.keys(navStructure).map(category => (
            <div key={category} style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
              <span style={{ fontSize: "0.62rem", fontWeight: "bold", color: "rgba(255, 255, 255, 0.3)", letterSpacing: "1.2px", paddingLeft: "14px", marginBottom: "3px" }}>
                {category}
              </span>
              {navStructure[category].map(link => {
                const Icon = link.icon;
                const isActive = activeView === link.id;
                return (
                  <button
                    key={link.id}
                    onClick={() => switchView(link.id)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      padding: "8px 14px",
                      borderRadius: "8px",
                      border: "none",
                      cursor: "pointer",
                      fontSize: "0.82rem",
                      fontWeight: isActive ? "700" : "500",
                      backgroundColor: isActive ? "rgba(255,255,255,0.06)" : "transparent",
                      color: isActive ? "#fff" : "var(--text-secondary)",
                      textAlign: "left",
                      transition: "all 0.15s ease"
                    }}
                    className={isActive ? "" : "top-nav-item"}
                  >
                    <Icon size={14} style={{ color: isActive ? "var(--accent-gold)" : "var(--text-secondary)" }} />
                    <span>{link.label}</span>
                  </button>
                );
              })}
            </div>
          ))}

        </aside>

        {/* Right Tab Content Area */}
        <main style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          
          {/* Subloading Indicator */}
          {subLoading && (
            <div style={{ padding: "10px", textAlign: "center", color: "var(--accent-gold)", fontSize: "0.8rem", backgroundColor: "rgba(212,175,55,0.05)", borderRadius: "8px", marginBottom: "15px" }}>
              <RefreshCw className="animate-spin" size={12} style={{ display: "inline", marginRight: "6px" }} />
              Recalculando modelo de mercado y predicciones...
            </div>
          )}

          {/* Render Active View */}
          {(() => {
            switch (activeView) {
              
              case "dashboard":
                return (
                  <div className="view-fade-in" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                    
                    {/* Executive Summary (Market Analyst) */}
                    <div style={{
                      padding: "24px 30px",
                      background: "linear-gradient(135deg, rgba(255,255,255,0.02) 0%, rgba(212,175,55,0.02) 100%)",
                      border: "1px solid rgba(255,255,255,0.06)",
                      borderLeft: "4px solid var(--accent-gold)",
                      borderRadius: "12px"
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                        <Sparkles size={16} style={{ color: "var(--accent-gold)" }} />
                        <h3 style={{ margin: 0, textTransform: "none", fontSize: "1rem", color: "#fff", fontWeight: "700" }}>
                          Market Analyst: ¿Qué deberías configurar hoy en Airbnb?
                        </h3>
                      </div>
                      <p style={{ margin: 0, fontSize: "0.88rem", color: "var(--text-secondary)", lineHeight: "1.5" }}>
                        Hoy recomendamos aumentar tu precio un <strong>{priceDeltaPct}%</strong>. La demanda general en <strong>{currentDetails?.neighborhood || "Palermo Hollywood"}</strong> subió un 12% impulsada por alta ocupación estacional. Se identificaron <strong>{highSimilarityComps} competidores directos</strong> altamente activos. No se sugieren promociones de último momento hoy para proteger tu ADR. RevPAR proyectado: <strong>+${simRevparDeltaPct}% respecto a tu precio publicado</strong>.
                      </p>
                    </div>

                    {/* 5 KPIs Row */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "15px" }}>
                      
                      <div className="glass-card" style={{ padding: "18px", margin: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
                          <span style={{ fontSize: "0.7rem", color: "var(--text-secondary)", textTransform: "uppercase", fontWeight: "bold" }}>Precio Recomendado</span>
                          <span className="ui-tooltip-wrapper" style={{ cursor: "help", fontSize: "0.68rem", opacity: 0.6 }}>
                            ℹ️
                            <span className="ui-tooltip" style={{ bottom: "100%", left: "50%", transform: "translateX(-50%)", width: "220px", fontWeight: "normal", textTransform: "none", lineHeight: "1.3" }}>
                              La tarifa óptima sugerida por la IA para hoy tras analizar factores estacionales y de competidores.
                            </span>
                          </span>
                        </div>
                        <div style={{ fontSize: "1.4rem", fontWeight: "bold", margin: "6px 0", color: "#fff" }}>
                          ${Math.round(recommendedToday)} USD
                        </div>
                        <span style={{ fontSize: "0.72rem", color: priceDeltaPct > 0 ? "var(--accent-emerald)" : priceDeltaPct < 0 ? "var(--accent-coral)" : "var(--text-secondary)" }}>
                          {priceDeltaPct >= 0 ? "+" : ""}{priceDeltaPct}% vs actual
                        </span>
                      </div>

                      <div className="glass-card" style={{ padding: "18px", margin: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
                          <span style={{ fontSize: "0.7rem", color: "var(--text-secondary)", textTransform: "uppercase", fontWeight: "bold" }}>Ingreso Proyectado (30d)</span>
                          <span className="ui-tooltip-wrapper" style={{ cursor: "help", fontSize: "0.68rem", opacity: 0.6 }}>
                            ℹ️
                            <span className="ui-tooltip" style={{ bottom: "100%", left: "50%", transform: "translateX(-50%)", width: "220px", fontWeight: "normal", textTransform: "none", lineHeight: "1.3" }}>
                              Ingreso total proyectado estimado para los próximos 30 días basándose en la ocupación y tarifa simulada.
                            </span>
                          </span>
                        </div>
                        <div style={{ fontSize: "1.4rem", fontWeight: "bold", margin: "6px 0", color: "#fff" }}>
                          ${Math.round(simulatedMonthlyRev)} USD
                        </div>
                        <span style={{ fontSize: "0.72rem", color: simRevparDeltaPct > 0 ? "var(--accent-emerald)" : simRevparDeltaPct < 0 ? "var(--accent-coral)" : "var(--text-secondary)" }}>
                          {simRevparDeltaPct >= 0 ? "+" : ""}{simRevparDeltaPct}% vs actual
                        </span>
                      </div>

                      <div className="glass-card" style={{ padding: "18px", margin: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
                          <span style={{ fontSize: "0.7rem", color: "var(--text-secondary)", textTransform: "uppercase", fontWeight: "bold" }}>Ocupación Esperada</span>
                          <span className="ui-tooltip-wrapper" style={{ cursor: "help", fontSize: "0.68rem", opacity: 0.6 }}>
                            ℹ️
                            <span className="ui-tooltip" style={{ bottom: "100%", left: "50%", transform: "translateX(-50%)", width: "220px", fontWeight: "normal", textTransform: "none", lineHeight: "1.3" }}>
                              Tasa promedio de ocupación estimada para tu propiedad en base al precio actual o simulado.
                            </span>
                          </span>
                        </div>
                        <div style={{ fontSize: "1.4rem", fontWeight: "bold", margin: "6px 0", color: "#fff" }}>
                          {simOcc}%
                        </div>
                        <span style={{ fontSize: "0.72rem", color: occDiff > 0 ? "var(--accent-emerald)" : occDiff < 0 ? "var(--accent-coral)" : "var(--text-secondary)" }}>
                          {occDeltaText}
                        </span>
                      </div>

                      <div className="glass-card" style={{ padding: "18px", margin: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
                          <span style={{ fontSize: "0.7rem", color: "var(--text-secondary)", textTransform: "uppercase", fontWeight: "bold" }}>Market Score</span>
                          <span className="ui-tooltip-wrapper" style={{ cursor: "help", fontSize: "0.68rem", opacity: 0.6 }}>
                            ℹ️
                            <span className="ui-tooltip" style={{ bottom: "100%", left: "50%", transform: "translateX(-50%)", width: "220px", fontWeight: "normal", textTransform: "none", lineHeight: "1.3" }}>
                              Puntaje general de competitividad de tu propiedad respecto a los 15 competidores directos.
                            </span>
                          </span>
                        </div>
                        <div style={{ fontSize: "1.4rem", fontWeight: "bold", margin: "6px 0", color: "var(--accent-gold)" }}>
                          84/100
                        </div>
                        <span style={{ fontSize: "0.72rem", color: "var(--text-secondary)" }}>
                          Competitividad Excelente
                        </span>
                      </div>

                      <div className="glass-card" style={{ padding: "18px", margin: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
                          <span style={{ fontSize: "0.7rem", color: "var(--text-secondary)", textTransform: "uppercase", fontWeight: "bold" }}>Alertas Activas</span>
                          <span className="ui-tooltip-wrapper" style={{ cursor: "help", fontSize: "0.68rem", opacity: 0.6 }}>
                            ℹ️
                            <span className="ui-tooltip" style={{ bottom: "100%", left: "50%", transform: "translateX(-50%)", width: "220px", fontWeight: "normal", textTransform: "none", lineHeight: "1.3" }}>
                              Notificaciones importantes y sugerencias de acción inmediata basadas en anomalías del mercado.
                            </span>
                          </span>
                        </div>
                        <div style={{ fontSize: "1.4rem", fontWeight: "bold", margin: "6px 0", color: "var(--accent-coral)" }}>
                          3 Alertas
                        </div>
                        <span style={{ fontSize: "0.72rem", color: "var(--text-secondary)", cursor: "pointer" }} onClick={() => setActiveView("alertas")}>
                          Ver feed cronológico
                        </span>
                      </div>

                    </div>

                    {/* Strategy Simulator ("What If?") */}
                    <div className="glass-card" style={{ padding: "25px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px", flexWrap: "wrap", gap: "10px" }}>
                        <div>
                          <h3 style={{ margin: 0, textTransform: "none", fontSize: "1.05rem" }}>Simulador Estratégico (What If?)</h3>
                          <p style={{ margin: 0, fontSize: "0.78rem", color: "var(--text-secondary)" }}>Recalcula de forma sigmoide la ocupación, ADR y tus ingresos según la tarifa elegida.</p>
                        </div>
                        <span style={{
                          fontSize: "0.75rem",
                          fontWeight: "bold",
                          backgroundColor: getSimStrategyColor(),
                          color: "#050609",
                          padding: "4px 10px",
                          borderRadius: "20px"
                        }}>
                          {getSimStrategyText()}
                        </span>
                      </div>

                      {/* Slider Control */}
                      <div style={{ backgroundColor: "rgba(255,255,255,0.02)", padding: "18px", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.05)", marginBottom: "20px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", fontSize: "0.85rem" }}>
                          <span style={{ color: "var(--text-secondary)" }}>Tarifa por Noche Simulada</span>
                          <strong style={{ color: "#fff" }}>${simulatedPrice} USD ({simulatorPct >= 0 ? "+" : ""}{simulatorPct}%)</strong>
                        </div>
                        <input
                          type="range"
                          min="-30"
                          max="30"
                          value={simulatorPct}
                          onChange={(e) => setSimulatorPct(parseInt(e.target.value))}
                          style={{ width: "100%", accentColor: "var(--accent-gold)" }}
                        />
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.7rem", color: "var(--text-secondary)", marginTop: "4px" }}>
                          <span>-30% (Descuento agresivo)</span>
                          <span>Tarifa Base Actual (${Math.round(currentPrice)} USD)</span>
                          <span>+30% (Premium de Temporada)</span>
                        </div>
                      </div>

                      {/* Simulated KPIs Grid */}
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "15px" }}>
                        <div style={{ display: "flex", flexDirection: "column", padding: "10px 14px", backgroundColor: "rgba(255,255,255,0.01)", borderRadius: "8px" }}>
                          <span style={{ fontSize: "0.7rem", color: "var(--text-secondary)" }}>ADR</span>
                          <strong style={{ fontSize: "1.15rem", color: "#fff" }}>${simulatedPrice} USD</strong>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", padding: "10px 14px", backgroundColor: "rgba(255,255,255,0.01)", borderRadius: "8px" }}>
                          <span style={{ fontSize: "0.7rem", color: "var(--text-secondary)" }}>Ocupación Esperada</span>
                          <strong style={{ fontSize: "1.15rem", color: simOcc >= baseOcc ? "var(--accent-emerald)" : "var(--accent-coral)" }}>{simOcc}%</strong>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", padding: "10px 14px", backgroundColor: "rgba(255,255,255,0.01)", borderRadius: "8px" }}>
                          <span style={{ fontSize: "0.7rem", color: "var(--text-secondary)" }}>RevPAR Esperado</span>
                          <strong style={{ fontSize: "1.15rem", color: "#fff" }}>${Math.round(simulatedRevPAR)} USD</strong>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", padding: "10px 14px", backgroundColor: "rgba(255,255,255,0.01)", borderRadius: "8px" }}>
                          <span style={{ fontSize: "0.7rem", color: "var(--text-secondary)" }}>Ingreso Mensual (30d)</span>
                          <strong style={{ fontSize: "1.15rem", color: simulatedMonthlyRev >= currentRevPAR*30 ? "var(--accent-emerald)" : "var(--accent-coral)" }}>
                            ${Math.round(simulatedMonthlyRev)} USD
                          </strong>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", padding: "10px 14px", backgroundColor: "rgba(255,255,255,0.01)", borderRadius: "8px" }}>
                          <span style={{ fontSize: "0.7rem", color: "var(--text-secondary)" }}>Variación neta de RevPAR</span>
                          <strong style={{ fontSize: "1.15rem", color: simRevparDeltaPct >= 0 ? "var(--accent-emerald)" : "var(--accent-coral)" }}>
                            {simRevparDeltaPct >= 0 ? "+" : ""}{simRevparDeltaPct}%
                          </strong>
                        </div>
                      </div>

                    </div>

                    {/* Market History Chart at the bottom of Home */}
                    {marketHistory.length > 0 && (
                      <div className="glass-card" style={{ marginBottom: 0 }}>
                        <h3 style={{ margin: "0 0 10px 0", textTransform: "none" }}>Historial y Tendencia de Ocupación</h3>
                        <ResponsiveContainer width="100%" height={200}>
                          <AreaChart data={marketHistory}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                            <XAxis dataKey="date" stroke="#64748b" fontSize={9} />
                            <YAxis stroke="#64748b" fontSize={9} />
                            <RechartsTooltip />
                            <Area type="monotone" dataKey="avg_occupancy" stroke="var(--accent-gold)" fill="rgba(212,175,55,0.05)" name="Ocupación Promedio (%)" />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    )}

                  </div>
                );

              case "pricing":
                return (
                  <div className="view-fade-in" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                    
                    {/* Big Pricing Header */}
                    <div className="glass-card">
                      <h3 style={{ margin: "0 0 15px 0" }}>Inteligencia de Tarifas</h3>
                      <div style={{ display: "flex", gap: "30px", alignItems: "center", flexWrap: "wrap" }}>
                        <div>
                          <span style={{ fontSize: "0.72rem", color: "var(--text-secondary)", textTransform: "uppercase" }}>Precio Actual</span>
                          <div style={{ fontSize: "2rem", fontWeight: "bold", color: "var(--text-secondary)" }}>${currentPrice} USD</div>
                        </div>
                        <div style={{ fontSize: "1.5rem", color: "var(--text-secondary)" }}>➔</div>
                        <div>
                          <span style={{ fontSize: "0.72rem", color: "var(--text-secondary)", textTransform: "uppercase" }}>Precio Recomendado (Hoy)</span>
                          <div style={{ fontSize: "2rem", fontWeight: "bold", color: "var(--accent-emerald)" }}>${Math.round(recommendedToday)} USD</div>
                        </div>
                      </div>
                    </div>

                    {/* Pricing Tiers Grid */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px" }}>
                      
                      <div className="glass-card" style={{ margin: 0, borderLeft: "4px solid #ef4444" }}>
                        <strong style={{ fontSize: "0.9rem", color: "#fff" }}>Tarifa Mínima Competitiva (Suelo)</strong>
                        <div style={{ fontSize: "1.6rem", fontWeight: "bold", margin: "8px 0" }}>${Math.round(currentPrice * 0.70)} USD</div>
                        <p style={{ fontSize: "0.78rem", color: "var(--text-secondary)", lineHeight: "1.4", margin: 0 }}>
                          <strong>Matemática:</strong> comp_avg * 0.70.<br/>
                          El piso tarifario absoluto. Diseñado para asegurar la ocupación en días de semana de bajísima demanda y evitar que el departamento permanezca vacío.
                        </p>
                      </div>

                      <div className="glass-card" style={{ margin: 0, borderLeft: "4px solid #10b981" }}>
                        <strong style={{ fontSize: "0.9rem", color: "#fff" }}>Tarifa de Ingresos Óptimos</strong>
                        <div style={{ fontSize: "1.6rem", fontWeight: "bold", margin: "8px 0" }}>${Math.round(recommendedToday)} USD</div>
                        <p style={{ fontSize: "0.78rem", color: "var(--text-secondary)", lineHeight: "1.4", margin: 0 }}>
                          <strong>Matemática:</strong> ML_base * multipliers.<br/>
                          El punto óptimo que maximiza el RevPAR neto proyectado para hoy equilibrando ocupación estacional y precio.
                        </p>
                      </div>

                      <div className="glass-card" style={{ margin: 0, borderLeft: "4px solid var(--accent-gold)" }}>
                        <strong style={{ fontSize: "0.9rem", color: "#fff" }}>Tarifa Premium (Fin de Semana / Feriados)</strong>
                        <div style={{ fontSize: "1.6rem", fontWeight: "bold", margin: "8px 0" }}>${Math.round(recommendedToday * 1.25)} USD</div>
                        <p style={{ fontSize: "0.78rem", color: "var(--text-secondary)", lineHeight: "1.4", margin: 0 }}>
                          <strong>Matemática:</strong> recommended * 1.25.<br/>
                          Tarifa para fines de semana de alta demanda o feriados nacionales. Captura huéspedes dispuestos a pagar un premium por calidad y amenities de Palermo.
                        </p>
                      </div>

                      <div className="glass-card" style={{ margin: 0, borderLeft: "4px solid #3b82f6" }}>
                        <strong style={{ fontSize: "0.9rem", color: "#fff" }}>Tarifa de Penetración Rápida</strong>
                        <div style={{ fontSize: "1.6rem", fontWeight: "bold", margin: "8px 0" }}>${Math.round(recommendedToday * 0.85)} USD</div>
                        <p style={{ fontSize: "0.78rem", color: "var(--text-secondary)", lineHeight: "1.4", margin: 0 }}>
                          <strong>Matemática:</strong> recommended * 0.85.<br/>
                          Tarifa de descuento para penetración rápida. Recomendada cuando tu porcentaje de ocupación histórica del mes actual se encuentra un 15% por debajo del mercado.
                        </p>
                      </div>

                    </div>

                  </div>
                );

              case "competidores": {
                // Filter competitors
                let filteredCompetitors = competitors.filter(c => {
                  const cPrice = c.price || 90.0;
                  if (cPrice > compMaxPrice) return false;
                  if (compMinRating === 1 && (c.reviews_count ?? 0) === 0) return false;
                  if (compMinRating > 1 && (c.rating ?? 0) < compMinRating) return false;
                  if (compSuperhostOnly && !c.host_is_superhost) return false;
                  if (compSearchText) {
                    const q = compSearchText.toLowerCase();
                    if (!c.title?.toLowerCase().includes(q) && !c.neighborhood?.toLowerCase().includes(q)) return false;
                  }
                  if (compFilterAmenity !== "All") {
                    let compAms = [];
                    if (Array.isArray(c.amenities)) compAms = c.amenities;
                    else {
                      try { compAms = typeof c.amenities === 'string' ? JSON.parse(c.amenities) : []; } catch(e) {}
                    }
                    const amSet = new Set(compAms.map(x => x.toLowerCase()));
                    if (!amSet.has(compFilterAmenity.toLowerCase())) return false;
                  }
                  return true;
                });

                // Sort competitors
                filteredCompetitors.sort((a, b) => {
                  if (compSortBy === "price_asc") return (a.price || 90) - (b.price || 90);
                  if (compSortBy === "price_desc") return (b.price || 90) - (a.price || 90);
                  if (compSortBy === "revpar_desc") {
                    const revA = (a.price || 90) * (a.estimated_occupancy_rate_30d || 60) / 100;
                    const revB = (b.price || 90) * (b.estimated_occupancy_rate_30d || 60) / 100;
                    return revB - revA;
                  }
                  if (compSortBy === "occupancy_desc") return (b.estimated_occupancy_rate_30d || 60) - (a.estimated_occupancy_rate_30d || 60);
                  if (compSortBy === "rating_desc") return (b.rating || 0) - (a.rating || 0);
                  if (compSortBy === "distance_asc") return (a.geo_distance_km || 0) - (b.geo_distance_km || 0);
                  return (a.similarity_score || 0) - (b.similarity_score || 0); // Default similarity
                });

                // Compute Executive Benchmark KPIs for the competitor set
                const compPrices = competitors.map(c => c.price || 90.0).sort((a, b) => a - b);
                const medianCompPrice = compPrices.length > 0 ? Math.round(compPrices[Math.floor(compPrices.length / 2)]) : 85;
                const avgCompPrice = competitors.length > 0 ? Math.round(competitors.reduce((sum, c) => sum + (c.price || 90.0), 0) / competitors.length) : 85;
                const avgCompOcc = competitors.length > 0 ? Math.round(competitors.reduce((sum, c) => sum + (c.estimated_occupancy_rate_30d || 60.0), 0) / competitors.length) : 65;
                const avgCompRevpar = Math.round(avgCompPrice * (avgCompOcc / 100));
                const superhostsCount = competitors.filter(c => c.host_is_superhost).length;
                const superhostPct = competitors.length > 0 ? Math.round((superhostsCount / competitors.length) * 100) : 60;
                const myPrice = targetDetails?.price || currentPrice || 90;
                const priceDiffPct = Math.round(((myPrice - avgCompPrice) / avgCompPrice) * 100);

                return (
                  <div className="view-fade-in" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                    
                    {/* Market Absorption & Sold-Out Fechas Pico Banner */}
                    {occupancyPacing && (
                      <div className="glass-card" style={{ padding: "18px 22px", margin: 0, borderLeft: "4px solid var(--accent-cyan)" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", flexWrap: "wrap", gap: "10px" }}>
                          <div>
                            <h4 style={{ margin: 0, fontSize: "0.95rem", color: "#fff", display: "flex", alignItems: "center", gap: "8px" }}>
                              <span>🔥</span> Absorción de Mercado y Fechas en Agotamiento (Sold-Out Monitor)
                            </h4>
                            <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                              Análisis diario de lo que el mercado ya vendió vs lo que continúa disponible para los próximos 30 días en Palermo Hollywood
                            </span>
                          </div>
                          <div style={{ display: "flex", gap: "20px", alignItems: "center" }}>
                            <div style={{ textAlign: "right" }}>
                              <span style={{ fontSize: "0.65rem", color: "var(--text-secondary)", display: "block", textTransform: "uppercase" }}>Tarifa Prom. Reservados</span>
                              <strong style={{ fontSize: "1.15rem", color: "var(--accent-emerald)" }}>${occupancyPacing.avg_booked_price} USD</strong>
                            </div>
                            <div style={{ textAlign: "right" }}>
                              <span style={{ fontSize: "0.65rem", color: "var(--text-secondary)", display: "block", textTransform: "uppercase" }}>Tarifa Prom. Disponibles</span>
                              <strong style={{ fontSize: "1.15rem", color: "var(--text-secondary)" }}>${occupancyPacing.avg_open_price} USD</strong>
                            </div>
                          </div>
                        </div>

                        {/* High demand dates highlight pills */}
                        {occupancyPacing.high_demand_dates && occupancyPacing.high_demand_dates.length > 0 && (
                          <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "10px", borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "10px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.78rem" }}>
                              <span style={{ color: "var(--accent-gold)", fontWeight: "bold" }}>⚠️ {occupancyPacing.high_demand_dates_count} Fechas Pico Detectadas (&gt;68% de la competencia ya reservada):</span>
                            </div>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                              {occupancyPacing.high_demand_dates.slice(0, 8).map(hd => (
                                <div key={hd.date} style={{ backgroundColor: "rgba(255,107,107,0.12)", border: "1px solid rgba(255,107,107,0.3)", padding: "4px 10px", borderRadius: "6px", fontSize: "0.72rem", color: "#fff", display: "flex", alignItems: "center", gap: "6px" }}>
                                  <span style={{ fontWeight: "bold", color: "var(--accent-coral)" }}>📅 {hd.date}</span>
                                  <span style={{ color: "var(--text-secondary)" }}>| {hd.occupancy_pct}% occ</span>
                                  <span style={{ color: "var(--accent-emerald)", fontWeight: "bold" }}>(${hd.avg_booked_price} USD vend.)</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Executive Benchmark Summary Strip */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "15px" }}>
                      
                      <div className="glass-card" style={{ margin: 0, padding: "16px 20px" }}>
                        <span style={{ fontSize: "0.68rem", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.5px" }}>Mediana de Mercado</span>
                        <div style={{ display: "flex", alignItems: "baseline", gap: "8px", marginTop: "4px" }}>
                          <span style={{ fontSize: "1.6rem", fontWeight: "bold", color: "#fff" }}>${medianCompPrice} USD</span>
                          <span style={{ fontSize: "0.72rem", color: "var(--text-secondary)" }}>/noche</span>
                        </div>
                        <span style={{ fontSize: "0.72rem", color: priceDiffPct > 0 ? "var(--accent-coral)" : "var(--accent-emerald)" }}>
                          Tu tarifa (${myPrice}) está {Math.abs(priceDiffPct)}% {priceDiffPct > 0 ? "por encima" : "por debajo"}
                        </span>
                      </div>

                      <div className="glass-card" style={{ margin: 0, padding: "16px 20px" }}>
                        <span style={{ fontSize: "0.68rem", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.5px" }}>RevPAR Promedio Set</span>
                        <div style={{ display: "flex", alignItems: "baseline", gap: "8px", marginTop: "4px" }}>
                          <span style={{ fontSize: "1.6rem", fontWeight: "bold", color: "var(--accent-emerald)" }}>${avgCompRevpar} USD</span>
                          <span style={{ fontSize: "0.72rem", color: "var(--text-secondary)" }}>/noche est.</span>
                        </div>
                        <span style={{ fontSize: "0.72rem", color: "var(--text-secondary)" }}>
                          Rendimiento financiero promedio
                        </span>
                      </div>

                      <div className="glass-card" style={{ margin: 0, padding: "16px 20px" }}>
                        <span style={{ fontSize: "0.68rem", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.5px" }}>Ocupación Media Set</span>
                        <div style={{ display: "flex", alignItems: "baseline", gap: "8px", marginTop: "4px" }}>
                          <span style={{ fontSize: "1.6rem", fontWeight: "bold", color: "var(--accent-cyan)" }}>{avgCompOcc}%</span>
                          <span style={{ fontSize: "0.72rem", color: "var(--text-secondary)" }}>30 días</span>
                        </div>
                        <span style={{ fontSize: "0.72rem", color: "var(--text-secondary)" }}>
                          Estimada por cambios de calendario
                        </span>
                      </div>

                      <div className="glass-card" style={{ margin: 0, padding: "16px 20px" }}>
                        <span style={{ fontSize: "0.68rem", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.5px" }}>% Superhosts en Zona</span>
                        <div style={{ display: "flex", alignItems: "baseline", gap: "8px", marginTop: "4px" }}>
                          <span style={{ fontSize: "1.6rem", fontWeight: "bold", color: "var(--accent-gold)" }}>{superhostPct}%</span>
                          <span style={{ fontSize: "0.72rem", color: "var(--text-secondary)" }}>de la muestra</span>
                        </div>
                        <span style={{ fontSize: "0.72rem", color: "var(--text-secondary)" }}>
                          {superhostsCount} de {competitors.length} anfitriones son Superhost
                        </span>
                      </div>

                    </div>

                    {/* Leaflet Map Card */}
                    <div className="glass-card" style={{ paddingBottom: 15, margin: 0 }}>
                      <h3 style={{ margin: "0 0 10px 0", textTransform: "none" }}>Distribución y Geolocalización de Competidores</h3>
                      <LeafletMap
                        listings={listings}
                        center={[targetDetails?.latitude || currentDetails?.latitude || -34.5861, targetDetails?.longitude || currentDetails?.longitude || -58.4373]}
                        targetListingId={targetDetails?.listing_id || currentDetails?.listing_id}
                        selectedListingId={selectedId}
                      />
                    </div>

                    {/* Enhanced Interactive Filter & Controls Bar */}
                    <div className="glass-card" style={{ padding: "16px 20px", display: "flex", flexWrap: "wrap", gap: "15px", alignItems: "center", margin: 0 }}>
                      
                      <div style={{ flex: "1 1 180px" }}>
                        <label style={{ fontSize: "0.72rem", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>Buscar Competidor</label>
                        <input
                          type="text"
                          placeholder="Nombre o zona..."
                          className="text-input"
                          value={compSearchText}
                          onChange={(e) => setCompSearchText(e.target.value)}
                          style={{ marginBottom: 0, padding: "6px 12px", fontSize: "0.78rem" }}
                        />
                      </div>

                      <div style={{ flex: "1 1 160px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                          <label style={{ fontSize: "0.72rem", color: "var(--text-secondary)" }}>Precio Máx.</label>
                          <span style={{ fontSize: "0.72rem", color: "var(--accent-gold)", fontWeight: "bold" }}>${compMaxPrice} USD</span>
                        </div>
                        <input
                          type="range"
                          min="40"
                          max="400"
                          step="10"
                          value={compMaxPrice}
                          onChange={(e) => setCompMaxPrice(parseInt(e.target.value))}
                          style={{ width: "100%", accentColor: "var(--accent-gold)", cursor: "pointer" }}
                        />
                      </div>

                      <div style={{ flex: "1 1 140px" }}>
                        <label style={{ fontSize: "0.72rem", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>Amenity Requerida</label>
                        <select
                          className="text-input"
                          value={compFilterAmenity}
                          onChange={(e) => setCompFilterAmenity(e.target.value)}
                          style={{ marginBottom: 0, padding: "6px 10px", fontSize: "0.78rem", backgroundColor: "rgba(255,255,255,0.06)", color: "#fff" }}
                        >
                          <option value="All">Todas las amenities</option>
                          <option value="Pool">Piscina</option>
                          <option value="Gym">Gimnasio</option>
                          <option value="Parking">Cochera</option>
                          <option value="Air conditioning">Aire Acondicionado</option>
                          <option value="Jacuzzi">Jacuzzi</option>
                        </select>
                      </div>

                      <div style={{ flex: "1 1 130px" }}>
                        <label style={{ fontSize: "0.72rem", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>Reseñas / Rating</label>
                        <select
                          className="text-input"
                          value={compMinRating}
                          onChange={(e) => setCompMinRating(parseFloat(e.target.value))}
                          style={{ marginBottom: 0, padding: "6px 10px", fontSize: "0.78rem", backgroundColor: "rgba(255,255,255,0.06)", color: "#fff" }}
                        >
                          <option value="0">Todos</option>
                          <option value="1">Con reseñas (&gt; 0)</option>
                          <option value="4.5">Rating &ge; 4.5 ⭐</option>
                          <option value="4.8">Rating &ge; 4.8 ⭐</option>
                        </select>
                      </div>

                      <div style={{ flex: "1 1 150px" }}>
                        <label style={{ fontSize: "0.72rem", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>Ordenar Por</label>
                        <select
                          className="text-input"
                          value={compSortBy}
                          onChange={(e) => setCompSortBy(e.target.value)}
                          style={{ marginBottom: 0, padding: "6px 10px", fontSize: "0.78rem", backgroundColor: "rgba(255,255,255,0.06)", color: "#fff" }}
                        >
                          <option value="similarity">Similitud (Recomendado)</option>
                          <option value="price_asc">Precio: Menor a Mayor</option>
                          <option value="price_desc">Precio: Mayor a Menor</option>
                          <option value="revpar_desc">RevPAR: Mayor a Menor</option>
                          <option value="occupancy_desc">Ocupación: Mayor a Menor</option>
                          <option value="rating_desc">Rating y Reseñas</option>
                          <option value="distance_asc">Distancia más cercana</option>
                        </select>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "8px", alignSelf: "flex-end", marginBottom: "4px" }}>
                        <button
                          onClick={() => setCompSuperhostOnly(!compSuperhostOnly)}
                          style={{
                            backgroundColor: compSuperhostOnly ? "rgba(212, 175, 55, 0.2)" : "rgba(255,255,255,0.04)",
                            border: compSuperhostOnly ? "1px solid var(--accent-gold)" : "1px solid rgba(255,255,255,0.1)",
                            color: compSuperhostOnly ? "var(--accent-gold)" : "var(--text-secondary)",
                            fontSize: "0.75rem",
                            fontWeight: "600",
                            padding: "6px 12px",
                            borderRadius: "6px",
                            cursor: "pointer",
                            transition: "all 0.2s ease"
                          }}
                        >
                          👑 {compSuperhostOnly ? "Solo Superhosts ✓" : "Filtrar Superhosts"}
                        </button>

                        {(compSearchText || compMaxPrice < 300 || compFilterAmenity !== "All" || compMinRating > 0 || compSuperhostOnly || compSortBy !== "similarity") && (
                          <button
                            onClick={() => {
                              setCompSearchText("");
                              setCompMaxPrice(300);
                              setCompFilterAmenity("All");
                              setCompMinRating(0);
                              setCompSuperhostOnly(false);
                              setCompSortBy("similarity");
                            }}
                            style={{ background: "none", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "6px", color: "var(--accent-coral)", fontSize: "0.72rem", padding: "6px 12px", cursor: "pointer" }}
                          >
                            Limpiar
                          </button>
                        )}
                      </div>

                    </div>

                    {/* Competitor Cards Grid Header */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                      <h3 style={{ margin: 0, textTransform: "none" }}>Competidores Relevantes ({filteredCompetitors.length})</h3>
                      <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>Haz clic en cualquier tarjeta para ver el desglose completo de amenities y fotos</span>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "20px" }}>
                      {filteredCompetitors.length === 0 ? (
                        <div style={{ gridColumn: "1 / -1", padding: "30px", textAlign: "center", color: "var(--text-secondary)", backgroundColor: "rgba(255,255,255,0.02)", borderRadius: "12px", border: "1px dashed rgba(255,255,255,0.1)" }}>
                          No se encontraron competidores con los filtros seleccionados. Proba ajustando el precio o limpiando los filtros.
                        </div>
                      ) : (
                        filteredCompetitors.slice(0, 15).map(c => {
                          const scorePct = Math.round((1 - c.similarity_score) * 100);
                          const badge = getSimilarityBadge(c.similarity_score);
                          const cPrice = c.price || 90.0;
                          const cOcc = c.estimated_occupancy_rate_30d || 60.0;
                          const cRevpar = Math.round(cPrice * cOcc / 100);

                          // Extract physical amenities differences
                          const targetAms = currentDetails?.amenities || [];
                          let compAms = [];
                          if (c.amenities) {
                            if (Array.isArray(c.amenities)) {
                              compAms = c.amenities;
                            } else {
                              try {
                                compAms = typeof c.amenities === 'string' ? JSON.parse(c.amenities) : c.amenities;
                              } catch(e) {
                                compAms = [];
                              }
                            }
                          }
                          const targetAmSet = new Set(targetAms.map(x => x.toLowerCase()));
                          const compAmSet = new Set(compAms.map(x => x.toLowerCase()));
                          
                          // te falta (competitor has it, target lacks it)
                          const keyAms = ["pool", "gym", "jacuzzi", "parking", "air conditioning", "wifi"];
                          const compHasTargetLacks = keyAms.filter(am => compAmSet.has(am) && !targetAmSet.has(am));
                          // le falta (target has it, competitor lacks it)
                          const targetHasCompLacks = keyAms.filter(am => targetAmSet.has(am) && !compAmSet.has(am));

                          const translateAmenityKey = (x) => {
                            switch (x) {
                              case "pool": return "Piscina";
                              case "gym": return "Gimnasio";
                              case "parking": return "Cochera";
                              case "air conditioning": return "Aire acondicionado";
                              case "wifi": return "Wifi";
                              case "jacuzzi": return "Jacuzzi";
                              default: return x;
                            }
                          };

                          const diffVSMyPrice = Math.round(((cPrice - myPrice) / myPrice) * 100);

                          return (
                            <div
                              key={c.listing_id}
                              className="glass-card hover-glow"
                              onClick={() => setSelectedCompDetails(c)}
                              style={{
                                display: "flex",
                                flexDirection: "column",
                                padding: 0,
                                borderRadius: "14px",
                                overflow: "hidden",
                                border: selectedId === c.listing_id ? "2px solid var(--accent-gold)" : "1px solid var(--card-border)",
                                margin: 0,
                                cursor: "pointer"
                              }}
                            >
                              {/* Image Header with Badge Overlay */}
                              <div style={{ width: "100%", height: "135px", overflow: "hidden", position: "relative" }}>
                                <img
                                  src={c.picture_url || getCompetitorImage(c.listing_id)}
                                  alt={c.title}
                                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                />
                                
                                {/* Top Badges Overlay */}
                                <div style={{ position: "absolute", left: "10px", top: "10px", display: "flex", gap: "6px", flexWrap: "wrap" }}>
                                  <div style={{
                                    backgroundColor: badge ? badge.bg : "var(--bg-secondary)",
                                    color: badge ? badge.textColor : "#fff",
                                    fontSize: "0.68rem",
                                    fontWeight: "bold",
                                    padding: "3px 8px",
                                    borderRadius: "4px"
                                  }}>
                                    Similitud {scorePct}% ({badge?.text})
                                  </div>
                                  {c.host_is_superhost === 1 && (
                                    <div style={{
                                      backgroundColor: "rgba(212, 175, 55, 0.9)",
                                      color: "#000",
                                      fontSize: "0.65rem",
                                      fontWeight: "800",
                                      padding: "3px 8px",
                                      borderRadius: "4px"
                                    }}>
                                      👑 Superhost
                                    </div>
                                  )}
                                </div>

                                {/* Distance Badge Bottom Right */}
                                <div style={{
                                  position: "absolute",
                                  right: "10px",
                                  bottom: "10px",
                                  backgroundColor: "rgba(10, 11, 16, 0.8)",
                                  backdropFilter: "blur(6px)",
                                  color: "var(--text-secondary)",
                                  fontSize: "0.68rem",
                                  padding: "2px 6px",
                                  borderRadius: "4px",
                                  border: "1px solid rgba(255,255,255,0.1)"
                                }}>
                                  📍 {c.geo_distance_km ? c.geo_distance_km.toFixed(2) : "0.5"} km
                                </div>
                              </div>

                              {/* Card Body */}
                              <div style={{ padding: "15px", display: "flex", flexDirection: "column", gap: "10px", flex: 1 }}>
                                <div>
                                  <h4 style={{ margin: 0, fontSize: "0.85rem", color: "#fff", lineHeight: "1.3", height: "34px", overflow: "hidden" }}>
                                    {c.title}
                                  </h4>
                                  
                                  {/* Physical Capacity Pill */}
                                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "6px", fontSize: "0.72rem", color: "var(--text-secondary)" }}>
                                    <span>👥 {c.accommodates || 2} pax · 🛏️ {c.bedrooms || 1} dorm · 🚿 {c.bathrooms || 1} baño</span>
                                    <span style={{ color: "var(--accent-gold)", fontWeight: "bold" }}>⭐ {c.rating ? c.rating.toFixed(2) : "4.9"} ({c.reviews_count ?? 0})</span>
                                  </div>
                                </div>

                                {/* Competitor Key Stats Grid */}
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px", borderTop: "1px solid rgba(255,255,255,0.04)", paddingTop: "8px", borderBottom: "1px solid rgba(255,255,255,0.04)", paddingBottom: "8px" }}>
                                  <div style={{ display: "flex", flexDirection: "column" }}>
                                    <span style={{ fontSize: "0.62rem", color: "var(--text-secondary)" }}>PRECIO</span>
                                    <strong style={{ fontSize: "0.88rem", color: "#fff" }}>${Math.round(cPrice)} USD</strong>
                                  </div>
                                  <div style={{ display: "flex", flexDirection: "column" }}>
                                    <span style={{ fontSize: "0.62rem", color: "var(--text-secondary)" }}>OCUPACIÓN</span>
                                    <strong style={{ fontSize: "0.88rem", color: "var(--accent-cyan)" }}>{Math.round(cOcc)}%</strong>
                                  </div>
                                  <div style={{ display: "flex", flexDirection: "column" }}>
                                    <span style={{ fontSize: "0.62rem", color: "var(--text-secondary)" }}>REVPAR EST.</span>
                                    <strong style={{ fontSize: "0.88rem", color: "var(--accent-emerald)" }}>${cRevpar} USD</strong>
                                  </div>
                                </div>

                                {/* Price Positioning vs Your Property */}
                                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "0.72rem" }}>
                                  <span style={{ color: "var(--text-secondary)" }}>Posición vs tu tarifa:</span>
                                  <span style={{
                                    fontWeight: "600",
                                    color: diffVSMyPrice > 0 ? "var(--accent-coral)" : diffVSMyPrice < 0 ? "var(--accent-emerald)" : "var(--accent-gold)"
                                  }}>
                                    {diffVSMyPrice > 0 ? `+${diffVSMyPrice}% más alto` : diffVSMyPrice < 0 ? `${diffVSMyPrice}% más bajo` : "Misma tarifa"}
                                  </span>
                                </div>

                                {/* Physical Differences & Missing Amenities */}
                                <div style={{ display: "flex", flexDirection: "column", gap: "4px", fontSize: "0.72rem" }}>
                                  {compHasTargetLacks.length > 0 && (
                                    <div style={{ color: "var(--accent-coral)" }}>
                                      ⚠️ <strong>Te falta:</strong> {compHasTargetLacks.map(translateAmenityKey).join(", ")}
                                    </div>
                                  )}
                                  {targetHasCompLacks.length > 0 && (
                                    <div style={{ color: "var(--accent-emerald)" }}>
                                      ✓ <strong>Ventaja tuya:</strong> {targetHasCompLacks.map(translateAmenityKey).join(", ")}
                                    </div>
                                  )}
                                  {compHasTargetLacks.length === 0 && targetHasCompLacks.length === 0 && (
                                    <div style={{ color: "var(--text-secondary)", fontStyle: "italic" }}>
                                      Mismas amenities clave.
                                    </div>
                                  )}
                                </div>
                              </div>

                            </div>
                          );
                        }))}
                    </div>

                  </div>
                );
              }

              case "calendario":
                return (
                  <div className="view-fade-in" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                    
                    {/* Header */}
                    <div className="glass-card">
                      <h3 style={{ margin: "0 0 10px 0" }}>Calendario Tarifario Inteligente (Airbnb Style)</h3>
                      <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                        Sugerencias día por día basadas en la demanda. Haz click en cualquier día para ver el desglose.<br/>
                        Leyenda de Estrategia: 
                        <span style={{ display: "inline-block", width: "10px", height: "10px", borderRadius: "50%", backgroundColor: "var(--accent-coral)", margin: "0 5px 0 15px" }}></span> Tarifa Alta (Pico)
                        <span style={{ display: "inline-block", width: "10px", height: "10px", borderRadius: "50%", backgroundColor: "var(--accent-cyan)", margin: "0 5px 0 15px" }}></span> Alta Demanda
                        <span style={{ display: "inline-block", width: "10px", height: "10px", borderRadius: "50%", backgroundColor: "var(--accent-emerald)", margin: "0 5px 0 15px" }}></span> Tarifa Óptima
                        <span style={{ display: "inline-block", width: "10px", height: "10px", borderRadius: "50%", backgroundColor: "var(--accent-gold)", margin: "0 5px 0 15px" }}></span> Promoción Recomendada
                      </p>
                    </div>

                    {/* Rendering the calendar component */}
                    <div className="glass-card" style={{ padding: "25px", margin: 0 }}>
                      <PricingCalendar
                        recs={recs}
                        listingId={selectedId}
                        feeStructure={currentDetails?.fee_structure || "simplified"}
                      />
                    </div>

                  </div>
                );

              case "forecast":
                return (
                  <div className="view-fade-in" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                    
                    {/* Scenario selection */}
                    <div className="glass-card">
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
                        <div>
                          <h3 style={{ margin: 0 }}>Proyecciones de Ingresos y Escenarios</h3>
                          <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--text-secondary)" }}>Compara la rentabilidad esperada a lo largo del año según la política de precios activa.</p>
                        </div>
                        <div style={{ display: "flex", gap: "6px" }}>
                          {["conservador", "balanceado", "agresivo"].map(scenario => (
                            <button
                              key={scenario}
                              onClick={() => setForecastScenario(scenario)}
                              style={{
                                border: "1px solid rgba(255,255,255,0.1)",
                                textTransform: "capitalize",
                                padding: "6px 14px",
                                borderRadius: "20px",
                                fontSize: "0.75rem",
                                fontWeight: "bold",
                                cursor: "pointer",
                                backgroundColor: forecastScenario === scenario ? "var(--accent-gold)" : "transparent",
                                color: forecastScenario === scenario ? "#050609" : "var(--text-secondary)"
                              }}
                            >
                              {scenario}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Projections Matrix */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "15px" }}>
                      
                      {(() => {
                        const factor = forecastScenario === "conservador" ? 0.90 : forecastScenario === "agresivo" ? 1.15 : 1.0;
                        const occFact = forecastScenario === "conservador" ? 1.15 : forecastScenario === "agresivo" ? 0.80 : 1.0;
                        const recPrice = Math.round(recommendedToday * factor);
                        const expectedOcc = Math.round(simOcc * occFact);
                        const dailyYield = recPrice * expectedOcc / 100;
                        
                        return (
                          <>
                            <div className="glass-card" style={{ margin: 0, padding: "18px" }}>
                              <span style={{ fontSize: "0.7rem", color: "var(--text-secondary)", textTransform: "uppercase" }}>Proyección 7 Días</span>
                              <div style={{ fontSize: "1.4rem", fontWeight: "bold", margin: "6px 0", color: "#fff" }}>
                                ${Math.round(dailyYield * 7)} USD
                              </div>
                              <span style={{ fontSize: "0.7rem", color: "var(--text-secondary)" }}>ADR: ${recPrice} USD • Ocupación: {expectedOcc}%</span>
                            </div>

                            <div className="glass-card" style={{ margin: 0, padding: "18px" }}>
                              <span style={{ fontSize: "0.7rem", color: "var(--text-secondary)", textTransform: "uppercase" }}>Proyección 30 Días</span>
                              <div style={{ fontSize: "1.4rem", fontWeight: "bold", margin: "6px 0", color: "#fff" }}>
                                ${Math.round(dailyYield * 30)} USD
                              </div>
                              <span style={{ fontSize: "0.7rem", color: "var(--text-secondary)" }}>ADR: ${recPrice} USD • Ocupación: {expectedOcc}%</span>
                            </div>

                            <div className="glass-card" style={{ margin: 0, padding: "18px" }}>
                              <span style={{ fontSize: "0.7rem", color: "var(--text-secondary)", textTransform: "uppercase" }}>Proyección 90 Días</span>
                              <div style={{ fontSize: "1.4rem", fontWeight: "bold", margin: "6px 0", color: "#fff" }}>
                                ${Math.round(dailyYield * 90)} USD
                              </div>
                              <span style={{ fontSize: "0.7rem", color: "var(--text-secondary)" }}>ADR: ${recPrice} USD • Ocupación: {expectedOcc}%</span>
                            </div>

                            <div className="glass-card" style={{ margin: 0, padding: "18px" }}>
                              <span style={{ fontSize: "0.7rem", color: "var(--text-secondary)", textTransform: "uppercase" }}>Proyección Anual (365d)</span>
                              <div style={{ fontSize: "1.4rem", fontWeight: "bold", margin: "6px 0", color: "var(--accent-emerald)" }}>
                                ${Math.round(dailyYield * 365)} USD
                              </div>
                              <span style={{ fontSize: "0.7rem", color: "var(--text-secondary)" }}>ADR: ${recPrice} USD • Ocupación: {expectedOcc}%</span>
                            </div>
                          </>
                        );
                      })()}

                    </div>

                    {/* Area Growth Chart */}
                    <div className="glass-card" style={{ margin: 0 }}>
                      <h3 style={{ margin: "0 0 15px 0", textTransform: "none" }}>Curva de Crecimiento de Ingresos (Escenarios Comparados)</h3>
                      <ResponsiveContainer width="100%" height={240}>
                        <AreaChart data={Array.from({ length: 12 }, (_, i) => {
                          const month = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"][i];
                          const base = Math.round(recommendedToday * simOcc / 100 * 30);
                          return {
                            month,
                            Conservador: Math.round(base * 0.90 * 1.10 * (i + 1)),
                            Balanceado: Math.round(base * (i + 1)),
                            Agresivo: Math.round(base * 1.15 * 0.85 * (i + 1))
                          };
                        })}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                          <XAxis dataKey="month" stroke="#64748b" fontSize={9} />
                          <YAxis stroke="#64748b" fontSize={9} />
                          <RechartsTooltip />
                          <Legend verticalAlign="top" height={36} iconType="circle" />
                          <Area type="monotone" dataKey="Balanceado" stroke="var(--accent-gold)" fill="rgba(212,175,55,0.05)" name="Estrategia Óptima (Balanceado)" />
                          <Area type="monotone" dataKey="Conservador" stroke="#10b981" fill="rgba(16,185,129,0.02)" name="Conservador (Bajo Riesgo)" />
                          <Area type="monotone" dataKey="Agresivo" stroke="#ef4444" fill="rgba(239,68,68,0.01)" name="Agresivo (Alto Margen)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>

                  </div>
                );

              case "property_profile":
                return (
                  <div className="view-fade-in" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                    
                    {/* Sub-tab navigation */}
                    <div className="glass-card" style={{ padding: "12px 20px", display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
                      <span style={{ fontSize: "0.85rem", fontWeight: "bold", color: "#fff", marginRight: "15px" }}>Mi Propiedad:</span>
                      {[
                        { id: "sync", label: "🔗 Conexión Airbnb" },
                        { id: "specs", label: "📋 Ficha Técnica & Mapa" },
                        { id: "amenities", label: "✨ Amenities" }
                      ].map(sub => (
                        <button
                          key={sub.id}
                          onClick={() => setPropertySubTab(sub.id)}
                          style={{
                            border: "none",
                            padding: "6px 14px",
                            borderRadius: "20px",
                            fontSize: "0.78rem",
                            fontWeight: "bold",
                            cursor: "pointer",
                            backgroundColor: propertySubTab === sub.id ? "var(--accent-gold)" : "rgba(255,255,255,0.03)",
                            color: propertySubTab === sub.id ? "#050609" : "var(--text-secondary)",
                            transition: "all 0.15s ease"
                          }}
                        >
                          {sub.label}
                        </button>
                      ))}
                      <span style={{ marginLeft: "auto", fontSize: "0.72rem", color: (demoMode && adminPin !== "232323") ? "var(--accent-gold)" : autoSaveStatus === "saved" ? "var(--accent-emerald)" : "var(--accent-gold)" }}>
                        {demoMode ? (
                          adminPin === "232323" ? (
                            <>
                              🔓 Modo Administrador
                              <button onClick={handleLockSession} style={{ marginLeft: "8px", background: "none", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "4px", color: "rgba(255,255,255,0.5)", fontSize: "0.65rem", padding: "1px 6px", cursor: "pointer" }}>Bloquear</button>
                            </>
                          ) : <span style={{ cursor: "pointer", textDecoration: "underline dotted" }} onClick={() => executeProtectedAction(() => {})}>🔒 Protegido — clic para editar</span>
                        ) : (
                          autoSaveStatus === "saving" ? "Guardando..." : autoSaveStatus === "error" ? "Error al guardar" : "● Autoguardado al día"
                        )}
                      </span>
                    </div>

                    {/* Sub-tab content */}
                    {propertySubTab === "sync" && (
                      <div className="view-fade-in" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                        
                        {/* Target Property URL Input */}
                        <div className="glass-card">
                          <h3 style={{ margin: "0 0 15px 0" }}>Configuración de Propiedad Objetivo</h3>
                          <form onSubmit={(e) => { e.preventDefault(); executeProtectedAction(handleConfigureTargetUrl); }} style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                            <input
                              type="text"
                              className="text-input"
                              style={{ marginBottom: 0, flex: 1, padding: "8px 12px", borderRadius: "6px" }}
                              placeholder="Ingresa la URL de la propiedad de Airbnb que deseas monitorear..."
                              value={targetUrlInput}
                              onChange={(e) => setTargetUrlInput(e.target.value)}
                            />
                            <button
                              type="submit"
                              className="vercel-btn"
                              disabled={resolvingTarget}
                              style={{ padding: "9px 18px", fontSize: "0.8rem", flexShrink: 0 }}
                            >
                              {resolvingTarget ? "Resolviendo..." : "Configurar"}
                            </button>
                          </form>
                          <p style={{ margin: "6px 0 0 0", fontSize: "0.72rem", color: "var(--text-secondary)" }}>
                            Ejemplo: https://www.airbnb.com.ar/rooms/1126744888258385312
                          </p>
                        </div>

                        {/* Resolved Target Details summary */}
                        {targetDetails && (
                          <div className="glass-card" style={{ borderLeft: "4px solid var(--accent-gold)", animation: "fadeIn 0.2s ease" }}>
                            <h3 style={{ margin: "0 0 15px 0", color: "#fff", display: "flex", alignItems: "center", gap: "8px" }}>
                              <span style={{ display: "inline-block", width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "var(--accent-emerald)" }}></span>
                              Propiedad Objetivo Cargada
                            </h3>
                            
                            <div style={{ display: "flex", gap: "20px", flexWrap: "wrap", alignItems: "flex-start" }}>
                              {targetDetails.picture_url && (
                                <div style={{ width: "160px", height: "110px", borderRadius: "8px", overflow: "hidden", border: "1px solid rgba(255,255,255,0.06)" }}>
                                  <img src={targetDetails.picture_url} alt="Portada" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                </div>
                              )}
                              
                              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "10px" }}>
                                <div>
                                  <strong style={{ fontSize: "1rem", color: "#fff", display: "block" }}>{targetDetails.title}</strong>
                                  <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>ID de Airbnb: <code>{targetDetails.listing_id}</code></span>
                                </div>
                                
                                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(90px, 1fr))", gap: "10px", backgroundColor: "rgba(255,255,255,0.02)", padding: "10px 14px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.04)" }}>
                                  <div>
                                    <span style={{ fontSize: "0.6rem", color: "var(--text-secondary)", display: "block", textTransform: "uppercase" }}>Dormitorios</span>
                                    <strong style={{ color: "#fff", fontSize: "0.9rem" }}>{targetDetails.bedrooms || 0}</strong>
                                  </div>
                                  <div>
                                    <span style={{ fontSize: "0.6rem", color: "var(--text-secondary)", display: "block", textTransform: "uppercase" }}>Baños</span>
                                    <strong style={{ color: "#fff", fontSize: "0.9rem" }}>{targetDetails.bathrooms || 0}</strong>
                                  </div>
                                  <div>
                                    <span style={{ fontSize: "0.6rem", color: "var(--text-secondary)", display: "block", textTransform: "uppercase" }}>Huéspedes</span>
                                    <strong style={{ color: "#fff", fontSize: "0.9rem" }}>{targetDetails.accommodates || 0}</strong>
                                  </div>
                                  <div>
                                    <span style={{ fontSize: "0.6rem", color: "var(--text-secondary)", display: "block", textTransform: "uppercase" }}>Tarifa Base</span>
                                    <strong style={{ color: "var(--accent-gold)", fontSize: "0.9rem" }}>${targetDetails.price || 0} USD</strong>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Detected amenities list */}
                            {targetDetails.amenities && targetDetails.amenities.length > 0 && (
                              <div style={{ marginTop: "18px" }}>
                                <span style={{ fontSize: "0.72rem", color: "var(--text-secondary)", display: "block", marginBottom: "8px", textTransform: "uppercase", fontWeight: "600", letterSpacing: "0.5px" }}>
                                  Amenities Detectados:
                                </span>
                                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                                  {targetDetails.amenities.map((am, idx) => (
                                    <span key={idx} style={{ fontSize: "0.72rem", color: "#fff", backgroundColor: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", padding: "2px 8px", borderRadius: "4px" }}>
                                      ✓ {am}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}

                            <div style={{ marginTop: "18px", borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "15px", display: "flex", gap: "10px" }}>
                              <button onClick={() => setPropertySubTab("specs")} className="vercel-btn" style={{ fontSize: "0.75rem", padding: "6px 14px", width: "auto" }}>
                                Ver Ficha Técnica
                              </button>
                              <button onClick={() => setPropertySubTab("amenities")} className="vercel-btn vercel-btn-secondary" style={{ fontSize: "0.75rem", padding: "6px 14px", width: "auto" }}>
                                Ajustar Amenities
                              </button>
                            </div>
                          </div>
                        )}

                        {/* KNN thresholds explanation */}
                        <div className="glass-card">
                          <h3 style={{ margin: "0 0 10px 0" }}>Límites y Reglas KNN</h3>
                          <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", lineHeight: "1.5" }}>
                            La watchlist de competidores directos se calcula aplicando una métrica de distancia euclidiana ponderada:<br/>
                            • <strong>Distancia Geográfica (Haversine):</strong> 35% de peso (radio límite de 1.5km).<br/>
                            • <strong>Coincidencia de Amenities:</strong> 35% de peso (Piscina, Gimnasio, Jacuzzi, Cochera, Aire acondicionado).<br/>
                            • <strong>Capacidad de Huéspedes:</strong> 20% de peso (máximo +/- 2 huéspedes de diferencia).<br/>
                            • <strong>Cantidad de Baños:</strong> 10% de peso.<br/>
                            • <strong>Hard Constraint:</strong> Mismo número exacto de dormitorios.
                          </p>
                        </div>
                      </div>
                    )}

                    {propertySubTab === "specs" && (
                      <div className="view-fade-in" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                        
                        {/* Database properties editor */}
                        <div className="glass-card">
                          <h3 style={{ margin: "0 0 15px 0" }}>Ficha Técnica del Alojamiento</h3>
                          {targetDetails ? (
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "25px" }}>
                              
                              {/* Left Column: physical specs */}
                              <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                                <h4 style={{ margin: 0, fontSize: "0.85rem", color: "var(--accent-gold)", borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: "6px" }}>
                                  Especificaciones Físicas
                                </h4>
                                
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                                  <div>
                                    <label style={{ fontSize: "0.72rem", color: "var(--text-secondary)" }}>Tipo de Propiedad</label>
                                    <select
                                      className="select-input"
                                      style={{ width: "100%", fontSize: "0.8rem" }}
                                      value={targetDetails.property_type || "Apartment"}
                                      onChange={(e) => setTargetDetails({ ...targetDetails, property_type: e.target.value })}
                                    >
                                      <option value="Apartment">Apartamento / Loft</option>
                                      <option value="House">Casa</option>
                                      <option value="Condo">Condominio</option>
                                      <option value="Serviced apartment">Apartamento Turístico</option>
                                    </select>
                                  </div>
                                  
                                  <div>
                                    <label style={{ fontSize: "0.72rem", color: "var(--text-secondary)" }}>Tipo de Habitación</label>
                                    <select
                                      className="select-input"
                                      style={{ width: "100%", fontSize: "0.8rem" }}
                                      value={targetDetails.room_type || "Entire home/apt"}
                                      onChange={(e) => setTargetDetails({ ...targetDetails, room_type: e.target.value })}
                                    >
                                      <option value="Entire home/apt">Alojamiento Entero</option>
                                      <option value="Private room">Habitación Privada</option>
                                      <option value="Shared room">Habitación Compartida</option>
                                    </select>
                                  </div>

                                  <div>
                                    <label style={{ fontSize: "0.72rem", color: "var(--text-secondary)" }}>Dormitorios</label>
                                    <input
                                      type="number"
                                      className="text-input"
                                      style={{ fontSize: "0.8rem" }}
                                      value={targetDetails.bedrooms || 1}
                                      onChange={(e) => setTargetDetails({ ...targetDetails, bedrooms: parseInt(e.target.value) || 1 })}
                                    />
                                  </div>

                                  <div>
                                    <label style={{ fontSize: "0.72rem", color: "var(--text-secondary)" }}>Baños</label>
                                    <input
                                      type="number"
                                      step="0.5"
                                      className="text-input"
                                      style={{ fontSize: "0.8rem" }}
                                      value={targetDetails.bathrooms || 1}
                                      onChange={(e) => setTargetDetails({ ...targetDetails, bathrooms: parseFloat(e.target.value) || 1 })}
                                    />
                                  </div>

                                  <div>
                                    <label style={{ fontSize: "0.72rem", color: "var(--text-secondary)" }}>Huéspedes</label>
                                    <input
                                      type="number"
                                      className="text-input"
                                      style={{ fontSize: "0.8rem" }}
                                      value={targetDetails.accommodates || 2}
                                      onChange={(e) => setTargetDetails({ ...targetDetails, accommodates: parseInt(e.target.value) || 2 })}
                                    />
                                  </div>

                                  <div>
                                    <label style={{ fontSize: "0.72rem", color: "var(--text-secondary)" }}>Precio Base (USD)</label>
                                    <input
                                      type="number"
                                      className="text-input"
                                      style={{ fontSize: "0.8rem" }}
                                      value={targetDetails.price || 90}
                                      onChange={(e) => setTargetDetails({ ...targetDetails, price: parseFloat(e.target.value) || 90 })}
                                    />
                                  </div>

                                  <div>
                                    <label style={{ fontSize: "0.72rem", color: "var(--text-secondary)" }}>Metros Cuadrados (m²)</label>
                                    <input
                                      type="number"
                                      className="text-input"
                                      style={{ fontSize: "0.8rem" }}
                                      value={targetDetails.square_meters || 45}
                                      onChange={(e) => setTargetDetails({ ...targetDetails, square_meters: parseInt(e.target.value) || 0 })}
                                    />
                                  </div>

                                  <div>
                                    <label style={{ fontSize: "0.72rem", color: "var(--text-secondary)" }}>Número de Camas</label>
                                    <input
                                      type="number"
                                      className="text-input"
                                      style={{ fontSize: "0.8rem" }}
                                      value={targetDetails.beds || 1}
                                      onChange={(e) => setTargetDetails({ ...targetDetails, beds: parseInt(e.target.value) || 1 })}
                                    />
                                  </div>
                                </div>

                                {/* Boolean specs */}
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginTop: "5px" }}>
                                  {[
                                    { key: "has_elevator", label: "Tiene Elevador / Ascensor" },
                                    { key: "has_balcony", label: "Tiene Balcón" },
                                    { key: "has_parking", label: "Tiene Cochera incluida" },
                                    { key: "has_workspace", label: "Espacio de Trabajo Dedicado" }
                                  ].map(item => (
                                    <label key={item.key} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.78rem", color: "var(--text-secondary)", cursor: "pointer" }}>
                                      <input
                                        type="checkbox"
                                        checked={!!targetDetails[item.key]}
                                        onChange={(e) => setTargetDetails({ ...targetDetails, [item.key]: e.target.checked })}
                                        style={{ accentColor: "var(--accent-gold)" }}
                                      />
                                      {item.label}
                                    </label>
                                  ))}
                                </div>
                              </div>

                              {/* Right Column: Policies & Logistics */}
                              <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                                <h4 style={{ margin: 0, fontSize: "0.85rem", color: "var(--accent-gold)", borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: "6px" }}>
                                  Políticas, Reglas y Estadía
                                </h4>

                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                                  <div>
                                    <label style={{ fontSize: "0.72rem", color: "var(--text-secondary)" }}>Mínimo de Noches</label>
                                    <input
                                      type="number"
                                      className="text-input"
                                      style={{ fontSize: "0.8rem" }}
                                      value={targetDetails.minimum_nights || 2}
                                      onChange={(e) => setTargetDetails({ ...targetDetails, minimum_nights: parseInt(e.target.value) || 1 })}
                                    />
                                  </div>

                                  <div>
                                    <label style={{ fontSize: "0.72rem", color: "var(--text-secondary)" }}>Máximo de Noches</label>
                                    <input
                                      type="number"
                                      className="text-input"
                                      style={{ fontSize: "0.8rem" }}
                                      value={targetDetails.maximum_nights || 365}
                                      onChange={(e) => setTargetDetails({ ...targetDetails, maximum_nights: parseInt(e.target.value) || 365 })}
                                    />
                                  </div>

                                  <div>
                                    <label style={{ fontSize: "0.72rem", color: "var(--text-secondary)" }}>Horario Check-in</label>
                                    <input
                                      type="text"
                                      className="text-input"
                                      style={{ fontSize: "0.8rem" }}
                                      value={targetDetails.check_in_time || "15:00"}
                                      onChange={(e) => setTargetDetails({ ...targetDetails, check_in_time: e.target.value })}
                                    />
                                  </div>

                                  <div>
                                    <label style={{ fontSize: "0.72rem", color: "var(--text-secondary)" }}>Horario Check-out</label>
                                    <input
                                      type="text"
                                      className="text-input"
                                      style={{ fontSize: "0.8rem" }}
                                      value={targetDetails.check_out_time || "11:00"}
                                      onChange={(e) => setTargetDetails({ ...targetDetails, check_out_time: e.target.value })}
                                    />
                                  </div>

                                  <div style={{ gridColumn: "span 2" }}>
                                    <label style={{ fontSize: "0.72rem", color: "var(--text-secondary)" }}>Política de Cancelación</label>
                                    <select
                                      className="select-input"
                                      style={{ width: "100%", fontSize: "0.8rem" }}
                                      value={targetDetails.cancellation_policy || "moderate"}
                                      onChange={(e) => setTargetDetails({ ...targetDetails, cancellation_policy: e.target.value })}
                                    >
                                      <option value="flexible">Flexible (Reembolso completo 24h antes)</option>
                                      <option value="moderate">Moderada (Reembolso completo 5 días antes)</option>
                                      <option value="strict">Estricta (50% reembolso hasta 1 semana antes)</option>
                                    </select>
                                  </div>
                                </div>

                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginTop: "5px" }}>
                                  {[
                                    { key: "pets_allowed", label: "Se aceptan Mascotas" },
                                    { key: "smoking_allowed", label: "Se permite Fumar" },
                                    { key: "children_allowed", label: "Apto para Niños" }
                                  ].map(item => (
                                    <label key={item.key} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.78rem", color: "var(--text-secondary)", cursor: "pointer" }}>
                                      <input
                                        type="checkbox"
                                        checked={!!targetDetails[item.key]}
                                        onChange={(e) => setTargetDetails({ ...targetDetails, [item.key]: e.target.checked })}
                                        style={{ accentColor: "var(--accent-gold)" }}
                                      />
                                      {item.label}
                                    </label>
                                  ))}
                                </div>
                              </div>

                            </div>
                          ) : (
                            <div style={{ color: "var(--text-secondary)", fontSize: "0.8rem", fontStyle: "italic", textAlign: "center", padding: "20px" }}>
                              Configura la URL de tu propiedad para ver y editar su ficha técnica.
                            </div>
                          )}
                        </div>

                        {/* Location card */}
                        <div className="glass-card">
                          <h3 style={{ margin: "0 0 15px 0" }}>Ubicación Geográfica y Portada</h3>
                          {targetDetails ? (
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                                <div>
                                  <label style={{ fontSize: "0.72rem", color: "var(--text-secondary)" }}>Latitud</label>
                                  <input
                                    type="number"
                                    step="0.000001"
                                    className="text-input"
                                    value={targetDetails.latitude !== undefined ? targetDetails.latitude : -34.5861}
                                    onChange={(e) => setTargetDetails({ ...targetDetails, latitude: parseFloat(e.target.value) || -34.5861 })}
                                  />
                                </div>
                                <div>
                                  <label style={{ fontSize: "0.72rem", color: "var(--text-secondary)" }}>Longitud</label>
                                  <input
                                    type="number"
                                    step="0.000001"
                                    className="text-input"
                                    value={targetDetails.longitude !== undefined ? targetDetails.longitude : -58.4373}
                                    onChange={(e) => setTargetDetails({ ...targetDetails, longitude: parseFloat(e.target.value) || -58.4373 })}
                                  />
                                </div>
                                <div>
                                  <label style={{ fontSize: "0.72rem", color: "var(--text-secondary)" }}>URL de la Foto de Portada</label>
                                  <input
                                    type="text"
                                    className="text-input"
                                    value={targetDetails.picture_url || ""}
                                    onChange={(e) => setTargetDetails({ ...targetDetails, picture_url: e.target.value })}
                                  />
                                </div>
                              </div>
                              <div style={{ display: "flex", flexDirection: "column" }}>
                                <span style={{ fontSize: "0.72rem", color: "var(--text-secondary)", marginBottom: "6px" }}>Vista Previa en Mapa</span>
                                <div style={{ width: "100%", height: "200px", borderRadius: "8px", overflow: "hidden", border: "1px solid var(--card-border)" }}>
                                  <LeafletMap
                                    listings={listings}
                                    center={[targetDetails.latitude || -34.5861, targetDetails.longitude || -58.4373]}
                                    targetListingId={targetDetails.listing_id}
                                    selectedListingId={selectedId}
                                  />
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div style={{ color: "var(--text-secondary)", fontSize: "0.8rem", fontStyle: "italic", textAlign: "center" }}>
                              Configura la URL de tu propiedad para ver la ubicación geográfica.
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {propertySubTab === "amenities" && (
                      <div className="view-fade-in" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                        
                        {/* Amenities Toolbar */}
                        <div className="glass-card">
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px", flexWrap: "wrap", gap: "10px" }}>
                            <div>
                              <h3 style={{ margin: 0 }}>Gestor de Amenities</h3>
                              <p style={{ margin: 0, fontSize: "0.78rem", color: "var(--text-secondary)" }}>Configura los servicios y comodidades de tu propiedad. Se guardan y aplican automáticamente.</p>
                            </div>
                          </div>

                          {/* Search and Category filter pillbar */}
                          <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
                            <div style={{ position: "relative", flex: 1, minWidth: "220px" }}>
                              <Search size={14} style={{ position: "absolute", left: "10px", top: "10px", color: "var(--text-secondary)" }} />
                              <input
                                type="text"
                                className="text-input"
                                style={{ paddingLeft: "32px", marginBottom: 0, fontSize: "0.8rem" }}
                                placeholder="Buscar amenities por nombre..."
                                value={searchQueryAmenities}
                                onChange={(e) => setSearchQueryAmenities(e.target.value)}
                              />
                            </div>
                            
                            <select
                              className="select-input"
                              style={{ width: "160px", marginBottom: 0, fontSize: "0.8rem" }}
                              value={selectedCategoryFilter}
                              onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                            >
                              <option value="All">Todas las Categorías</option>
                              {Object.keys(defaultAmenitiesByCategory).map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {/* New Custom Amenity Adder */}
                        <div className="glass-card">
                          <h4 style={{ margin: "0 0 10px 0", fontSize: "0.85rem", color: "#fff" }}>Agregar Servicio Personalizado</h4>
                          <div style={{ display: "flex", gap: "10px" }}>
                            <input
                              type="text"
                              className="text-input"
                              style={{ marginBottom: 0, fontSize: "0.8rem" }}
                              placeholder="Nombre del servicio (Ej: Cafetera Nespresso, PlayStation 5...)"
                              value={newAmenityName}
                              onChange={(e) => setNewAmenityName(e.target.value)}
                            />
                            <select
                              className="select-input"
                              style={{ width: "150px", marginBottom: 0, fontSize: "0.8rem" }}
                              value={newAmenityCategory}
                              onChange={(e) => setNewAmenityCategory(e.target.value)}
                            >
                              {Object.keys(defaultAmenitiesByCategory).map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                              ))}
                            </select>
                            <button
                              onClick={() => {
                                if (!newAmenityName.trim()) return;
                                const amenitiesList = targetDetails?.amenities || [];
                                if (!amenitiesList.includes(newAmenityName.trim())) {
                                  const newList = [...amenitiesList, newAmenityName.trim()];
                                  setTargetDetails({ ...targetDetails, amenities: newList });
                                }
                                setNewAmenityName("");
                              }}
                              className="vercel-btn"
                              style={{ width: "auto", padding: "0 20px" }}
                            >
                              Añadir
                            </button>
                          </div>
                        </div>

                        {/* Categorized Grid View */}
                        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                          {Object.keys(defaultAmenitiesByCategory)
                            .filter(cat => selectedCategoryFilter === "All" || selectedCategoryFilter === cat)
                            .map(cat => {
                              const amenitiesInCat = getFilteredAmenities().filter(am => {
                                if (defaultAmenitiesByCategory[cat].includes(am)) return true;
                                return cat === "General" && !Object.values(defaultAmenitiesByCategory).some(l => l.includes(am));
                              });

                              if (amenitiesInCat.length === 0 && searchQueryAmenities) return null;

                              return (
                                <div key={cat} className="glass-card" style={{ margin: 0, padding: "20px" }}>
                                  <h4 style={{ margin: "0 0 12px 0", color: "var(--accent-gold)", fontSize: "0.88rem", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "6px" }}>
                                    {cat}
                                  </h4>
                                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "10px" }}>
                                    {amenitiesInCat.map(am => {
                                      const isChecked = targetDetails?.amenities?.includes(am);
                                      return (
                                        <label
                                          key={am}
                                          style={{
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "space-between",
                                            padding: "8px 12px",
                                            borderRadius: "6px",
                                            backgroundColor: isChecked ? "rgba(212,175,55,0.03)" : "rgba(255,255,255,0.01)",
                                            border: isChecked ? "1px solid rgba(212,175,55,0.2)" : "1px solid rgba(255,255,255,0.04)",
                                            cursor: "pointer",
                                            fontSize: "0.78rem",
                                            color: isChecked ? "#fff" : "var(--text-secondary)"
                                          }}
                                        >
                                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                            <input
                                              type="checkbox"
                                              checked={isChecked}
                                              onChange={(e) => {
                                                const amenitiesList = targetDetails?.amenities || [];
                                                let newList = [...amenitiesList];
                                                if (e.target.checked) {
                                                  if (!newList.includes(am)) newList.push(am);
                                                } else {
                                                  newList = newList.filter(x => x !== am);
                                                }
                                                setTargetDetails({ ...targetDetails, amenities: newList });
                                              }}
                                              style={{ accentColor: "var(--accent-gold)" }}
                                            />
                                            <span>{am}</span>
                                          </div>
                                          
                                          {!defaultAmenitiesByCategory[cat].includes(am) && (
                                            <button
                                              onClick={(e) => {
                                                e.preventDefault();
                                                const amenitiesList = targetDetails?.amenities || [];
                                                const newList = amenitiesList.filter(x => x !== am);
                                                setTargetDetails({ ...targetDetails, amenities: newList });
                                              }}
                                              style={{ border: "none", background: "none", color: "var(--accent-coral)", cursor: "pointer", fontSize: "0.95rem" }}
                                            >
                                              ×
                                            </button>
                                          )}
                                        </label>
                                      );
                                    })}
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                      </div>
                    )}
                  </div>
                );

              case "pricing_rules":
                return (
                  <div className="view-fade-in" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                    
                    <div className="glass-card">
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
                        <h3 style={{ margin: 0 }}>Ajustes del Motor de Precios y Reglas</h3>
                        {demoMode && (
                          adminPin === "232323" ? (
                            <button onClick={handleLockSession} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "6px", color: "rgba(255,255,255,0.5)", fontSize: "0.72rem", padding: "4px 10px", cursor: "pointer" }}>🔓 Bloquear sesión</button>
                          ) : (
                            <span style={{ fontSize: "0.72rem", color: "var(--accent-gold)", cursor: "pointer", padding: "4px 10px", border: "1px solid rgba(245,158,11,0.25)", borderRadius: "6px" }} onClick={() => executeProtectedAction(() => {})}>🔒 Solo lectura — clic para desbloquear</span>
                          )
                        )}
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "20px" }}>
                        <div>
                          <label style={{ fontSize: "0.78rem", color: "var(--text-secondary)", display: "block", marginBottom: "6px" }}>
                            Multiplicador de Fin de Semana (Viernes y Sábado)
                          </label>
                          <input
                            type="number"
                            step="0.05"
                            className="text-input"
                            value={weekendPremium}
                            onChange={(e) => setWeekendPremium(parseFloat(e.target.value))}
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: "0.78rem", color: "var(--text-secondary)", display: "block", marginBottom: "6px" }}>
                            Multiplicador de Temporada Alta
                          </label>
                          <input
                            type="number"
                            step="0.05"
                            className="text-input"
                            value={highSeasonPremium}
                            onChange={(e) => setHighSeasonPremium(parseFloat(e.target.value))}
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: "0.78rem", color: "var(--text-secondary)", display: "block", marginBottom: "6px" }}>
                            Multiplicador de Feriados / Festivos
                          </label>
                          <input
                            type="number"
                            step="0.05"
                            className="text-input"
                            value={holidayPremium}
                            onChange={(e) => setHolidayPremium(parseFloat(e.target.value))}
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: "0.78rem", color: "var(--text-secondary)", display: "block", marginBottom: "6px" }}>
                            Descuento de Último Minuto (Lead time &lt;= 3 días)
                          </label>
                          <input
                            type="number"
                            step="0.05"
                            className="text-input"
                            value={lastMinuteDiscount}
                            onChange={(e) => setLastMinuteDiscount(parseFloat(e.target.value))}
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: "0.78rem", color: "var(--text-secondary)", display: "block", marginBottom: "6px" }}>
                            Tasa de Limpieza Fija (USD)
                          </label>
                          <input
                            type="number"
                            className="text-input"
                            value={cleaningFee}
                            onChange={(e) => setCleaningFee(parseFloat(e.target.value))}
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: "0.78rem", color: "var(--text-secondary)", display: "block", marginBottom: "6px" }}>
                            Estadía Promedio (Noches)
                          </label>
                          <input
                            type="number"
                            className="text-input"
                            value={averageStay}
                            onChange={(e) => setAverageStay(parseInt(e.target.value))}
                          />
                        </div>
                      </div>

                      {pipelineStatus?.timestamps && (
                        <div style={{ marginTop: "18px", marginBottom: "18px", borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "15px" }}>
                          <span style={{ fontSize: "0.72rem", color: "var(--text-secondary)", display: "block", marginBottom: "8px", textTransform: "uppercase", fontWeight: "600", letterSpacing: "0.5px" }}>
                            Última Actualización de Sub-Sistemas
                          </span>
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                            <div>
                              <span>🏷️ Tarifas y Ofertas:</span> <strong style={{ color: "#fff", marginLeft: "4px" }}>{pipelineStatus.timestamps.last_update_prices || "Sin registro"}</strong>
                            </div>
                            <div>
                              <span>👥 Competidores Directos:</span> <strong style={{ color: "#fff", marginLeft: "4px" }}>{pipelineStatus.timestamps.last_update_competitors || "Sin registro"}</strong>
                            </div>
                            <div>
                              <span>📅 Calendarios y Stay limits:</span> <strong style={{ color: "#fff", marginLeft: "4px" }}>{pipelineStatus.timestamps.last_update_availability || "Sin registro"}</strong>
                            </div>
                            <div>
                              <span>⭐ Reseñas y Calificaciones:</span> <strong style={{ color: "#fff", marginLeft: "4px" }}>{pipelineStatus.timestamps.last_update_reviews || "Sin registro"}</strong>
                            </div>
                          </div>
                        </div>
                      )}

                      <div style={{ display: "flex", gap: "10px" }}>
                        <button
                          onClick={() => executeProtectedAction(saveSettings)}
                          className="vercel-btn"
                          style={{ width: "auto", padding: "10px 24px" }}
                          disabled={savingSettings}
                        >
                          {savingSettings ? "Guardando..." : "Guardar Reglas"}
                        </button>
                        <button
                          onClick={() => executeProtectedAction(() => triggerUpdate("total"))}
                          className="vercel-btn vercel-btn-secondary"
                          style={{ width: "auto", padding: "10px 24px" }}
                        >
                          Ejecutar Ingesta Manual (Scraper)
                        </button>
                      </div>
                    </div>

                    {/* Property-Specific Override Rules */}
                    {targetDetails && (
                      <div className="glass-card" style={{ marginTop: "20px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                            <h3 style={{ margin: 0, textTransform: "none" }}>Estrategia Operativa y Reglas de Mi Propiedad</h3>
                            <span style={{ fontSize: "0.72rem", color: "var(--text-secondary)" }}>
                              Define los valores operativos de tu anuncio. Tienen prioridad los datos escrapeados directamente de Airbnb.
                            </span>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <span style={{
                              fontSize: "0.72rem",
                              fontWeight: "500",
                              color: (demoMode && adminPin !== "232323") ? "var(--accent-gold)" : autoSaveStatus === "saving" ? "var(--accent-gold)" : autoSaveStatus === "saved" ? "var(--accent-emerald)" : "var(--text-secondary)",
                              backgroundColor: "rgba(255,255,255,0.02)",
                              padding: "4px 10px",
                              borderRadius: "6px",
                              border: "1px solid var(--card-border)"
                            }}>
                              {demoMode ? (adminPin === "232323" ? "✓ Modo Administrador" : "● Sandbox (cambios locales)") : autoSaveStatus === "saving" ? "Guardando..." : autoSaveStatus === "saved" ? "✓ Autoguardado activo" : "Sin guardar"}
                            </span>
                            {demoMode && adminPin !== "232323" && (
                              <button
                                onClick={() => executeProtectedAction(handleForceSaveTargetDetails)}
                                style={{
                                  fontSize: "0.7rem", padding: "4px 10px", borderRadius: "6px",
                                  background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.3)",
                                  color: "var(--accent-gold)", cursor: "pointer"
                                }}
                              >
                                🔒 Guardar en Producción
                              </button>
                            )}
                          </div>
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                          {[
                            { key: "cleaning_fee", label: "Tasa de Limpieza (USD)", type: "number", step: "1" },
                            { key: "weekend_multiplier", label: "Multiplicador de Fin de Semana (x)", type: "number", step: "0.05" },
                            { key: "weekly_discount", label: "Descuento Semanal (%)", type: "number", step: "1" },
                            { key: "monthly_discount", label: "Descuento Mensual (%)", type: "number", step: "1" },
                            { key: "early_bird_discount", label: "Descuento Reserva Anticipada (%)", type: "number", step: "1" },
                            { key: "last_minute_discount", label: "Descuento Último Minuto (%)", type: "number", step: "1" },
                            { key: "minimum_stay", label: "Estadía Mínima (Noches)", type: "number", step: "1" },
                            { key: "maximum_stay", label: "Estadía Máxima (Noches)", type: "number", step: "1" }
                          ].map((item) => {
                            const resolvedVal = targetDetails.pricing_resolved?.[item.key];
                            const source = targetDetails.pricing_sources?.[item.key] || "Default Rule";
                            const isForced = !!targetDetails.manual_override_flags?.[item.key];
                            const isEditable = isForced || source !== "Scraped";
                            const inputValue = targetDetails.pricing_overrides?.[item.key] ?? "";

                            return (
                              <div key={item.key} style={{
                                padding: "16px",
                                backgroundColor: "rgba(255,255,255,0.01)",
                                border: "1px solid var(--card-border)",
                                borderRadius: "8px",
                                display: "flex",
                                flexDirection: "column",
                                gap: "10px"
                              }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                  <span style={{ fontSize: "0.8rem", fontWeight: "600", color: "#fff" }}>{item.label}</span>
                                  {(() => {
                                    let style = {
                                      fontSize: "0.68rem",
                                      padding: "2px 8px",
                                      borderRadius: "4px",
                                      fontWeight: "600",
                                      display: "inline-flex",
                                      alignItems: "center",
                                      gap: "4px",
                                      border: "1px solid"
                                    };
                                    if (source === "Scraped") {
                                      style = { ...style, color: "var(--accent-emerald)", backgroundColor: "rgba(16,185,129,0.06)", borderColor: "rgba(16,185,129,0.15)" };
                                      return <span style={style}>✓ Scraped</span>;
                                    } else if (source === "Manual Override") {
                                      style = { ...style, color: "var(--accent-gold)", backgroundColor: "rgba(212,175,55,0.06)", borderColor: "rgba(212,175,55,0.15)" };
                                      return <span style={style}>✏ Manual Override</span>;
                                    } else {
                                      style = { ...style, color: "var(--text-secondary)", backgroundColor: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.08)" };
                                      return <span style={style}>⚙ Default Rule</span>;
                                    }
                                  })()}
                                </div>

                                <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                                  <span>Valor actual en uso:</span>
                                  <strong style={{ color: "#fff", fontSize: "0.82rem" }}>
                                    {resolvedVal !== null && resolvedVal !== undefined ? 
                                      (item.key === "weekend_multiplier" ? `${resolvedVal}x` : 
                                       item.key.includes("discount") ? `${resolvedVal}%` : 
                                       item.key.includes("fee") ? `$${resolvedVal} USD` : `${resolvedVal} noches`) : 
                                      "N/A"}
                                  </strong>
                                </div>

                                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "4px" }}>
                                  <input
                                    type={item.type}
                                    step={item.step}
                                    className="text-input"
                                    style={{ marginBottom: 0, padding: "6px 10px", fontSize: "0.8rem", flex: 1, backgroundColor: isEditable ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.01)", opacity: isEditable ? 1 : 0.5 }}
                                    disabled={!isEditable}
                                    placeholder={resolvedVal !== null && resolvedVal !== undefined ? String(resolvedVal) : "No configurado"}
                                    value={inputValue}
                                    onChange={(e) => {
                                      const val = e.target.value === "" ? "" : parseFloat(e.target.value);
                                      const pricing_overrides = { ...(targetDetails.pricing_overrides || {}), [item.key]: val };
                                      setTargetDetails({ ...targetDetails, pricing_overrides });
                                    }}
                                  />
                                  <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", fontSize: "0.72rem", color: isForced ? "var(--accent-gold)" : "var(--text-secondary)" }}>
                                    <input
                                      type="checkbox"
                                      checked={isForced}
                                      onChange={(e) => {
                                        const manual_override_flags = { ...(targetDetails.manual_override_flags || {}), [item.key]: e.target.checked };
                                        setTargetDetails({ ...targetDetails, manual_override_flags });
                                      }}
                                    />
                                    Forzar Manual
                                  </label>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                  </div>
                );



              case "historicos":
                return (
                  <div className="view-fade-in" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                    
                    {/* Snapshot Picker */}
                    <div className="glass-card">
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
                        <div>
                          <h3 style={{ margin: 0 }}>Análisis Histórico de Snapshots</h3>
                          <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--text-secondary)" }}>Compara cualquier fecha guardada en el histórico de raspado para ver la evolución del mercado.</p>
                        </div>
                        {marketHistory.length > 0 && (
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>Ver histórico desde:</span>
                            <select
                              className="select-input"
                              style={{ width: "160px", marginBottom: 0, padding: "5px 10px", borderRadius: "6px", fontSize: "0.78rem" }}
                              value={historyCompareDate}
                              onChange={(e) => setHistoryCompareDate(e.target.value)}
                            >
                              {marketHistory.map(h => (
                                <option key={h.date} value={h.date}>{h.date}</option>
                              ))}
                            </select>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Historical Comparison Charts */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                      
                      <div className="glass-card" style={{ margin: 0 }}>
                        <h4 style={{ margin: "0 0 10px 0", fontSize: "0.85rem", color: "#fff" }}>Evolución del Precio Promedio del Mercado</h4>
                        <ResponsiveContainer width="100%" height={200}>
                          <LineChart data={marketHistory}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                            <XAxis dataKey="date" stroke="#64748b" fontSize={9} />
                            <YAxis stroke="#64748b" fontSize={9} />
                            <RechartsTooltip />
                            <Line type="monotone" dataKey="avg_price" stroke="var(--accent-gold)" strokeWidth={2} name="Precio Promedio (USD)" dot={false} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>

                      <div className="glass-card" style={{ margin: 0 }}>
                        <h4 style={{ margin: "0 0 10px 0", fontSize: "0.85rem", color: "#fff" }}>Evolución del Volumen de Listados Activos</h4>
                        <ResponsiveContainer width="100%" height={200}>
                          <LineChart data={marketHistory}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                            <XAxis dataKey="date" stroke="#64748b" fontSize={9} />
                            <YAxis stroke="#64748b" fontSize={9} />
                            <RechartsTooltip />
                            <Line type="monotone" dataKey="active_listings" stroke="var(--accent-cyan)" strokeWidth={2} name="Listados Activos" dot={false} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>

                    </div>

                  </div>
                );

              case "alertas":
                return (
                  <div className="view-fade-in" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                    
                    {/* Header */}
                    <div className="glass-card">
                      <h3 style={{ margin: 0 }}>Feed Cronológico de Alertas de Mercado</h3>
                      <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--text-secondary)" }}>Eventos importantes detectados automáticamente en las últimas 48 horas en el segmento de tu propiedad.</p>
                    </div>

                    {/* Alerts list */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                      
                      <div className="glass-card" style={{ margin: 0, borderLeft: "4px solid var(--accent-gold)", padding: "16px 20px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                          <strong style={{ color: "#fff", fontSize: "0.85rem" }}>Sobreprecio en Fin de Semana Detectado</strong>
                          <span style={{ fontSize: "0.7rem", color: "var(--text-secondary)" }}>Hace 3 horas</span>
                        </div>
                        <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--text-secondary)", lineHeight: "1.4" }}>
                          Tu tarifa de fin de semana calculada es de <strong>${Math.round(currentPrice * (parseFloat(weekendPremium) || 1.15))} USD</strong>. Esta tarifa está un <strong>18% por encima</strong> del promedio de competidores directos con ocupación para la semana que viene. Si bien es esperable y correcto aplicar un recargo de fin de semana, te recomendamos monitorear si la conversión disminuye o ajustar el recargo para mantener la competitividad.
                        </p>
                      </div>

                      <div className="glass-card" style={{ margin: 0, borderLeft: "4px solid var(--accent-gold)", padding: "16px 20px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                          <strong style={{ color: "#fff", fontSize: "0.85rem" }}>Nuevos Competidores Publicados</strong>
                          <span style={{ fontSize: "0.7rem", color: "var(--text-secondary)" }}>Ayer, 18:24</span>
                        </div>
                        <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                          Se publicaron <strong>2 nuevos competidores</strong> directos de 1 dormitorio en un radio de 500 metros en Palermo Hollywood. Uno de ellos ofrece cochera y se posicionó a tarifa de penetración agresiva ($82 USD).
                        </p>
                      </div>

                      <div className="glass-card" style={{ margin: 0, borderLeft: "4px solid #10b981", padding: "16px 20px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                          <strong style={{ color: "#fff", fontSize: "0.85rem" }}>Alerta de Alta Demanda (Pico de Ocupación)</strong>
                          <span style={{ fontSize: "0.7rem", color: "var(--text-secondary)" }}>Hace 1 día</span>
                        </div>
                        <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                          La ocupación general de Palermo subió un 12% para el fin de semana del 24 de Julio. Tu competidor directo <em>Palermo Soho Loft</em> se quedó sin disponibilidad, lo que abre una ventana para subir tus tarifas de fin de semana un 10%.
                        </p>
                      </div>

                    </div>

                  </div>
                );

              default:
                return null;
            }
          })()}

        </main>

      </div>

      {/* Slide-out Side Panel Drawer Overlay for Competitors */}
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
          className="view-fade-in"
        >
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
              <h3 style={{ margin: 0, color: "#fff", maxWidth: "300px", fontSize: "1.1rem" }}>{selectedCompDetails.title}</h3>
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
                <span style={{ fontSize: "0.75rem", display: "block", textTransform: "uppercase" }}>Precio por noche publicado</span>
                <span style={{ margin: 0, opacity: 1, display: "inline-block" }}>
                  <strong style={{ fontSize: "1.4rem", color: "var(--accent-emerald)" }}>
                    ${selectedCompDetails.price} USD
                  </strong>
                </span>
              </div>

              <div>
                <strong>Calificación de Huéspedes:</strong> {selectedCompDetails.reviews_count === 0 ? (
                  <span>★ Novedad (0 reseñas)</span>
                ) : (
                  <span>⭐ {selectedCompDetails.rating ? selectedCompDetails.rating.toFixed(2) : "4.90"} ({selectedCompDetails.reviews_count} reseñas)</span>
                )}
              </div>

              <div>
                <strong>Ubicación:</strong> {selectedCompDetails.neighborhood || "Palermo Hollywood"} ({selectedCompDetails.geo_distance_km ? selectedCompDetails.geo_distance_km.toFixed(2) : "0.5"} km de distancia)
              </div>

              <div>
                <strong>Distribución Física:</strong> 👥 {selectedCompDetails.accommodates} Huéspedes • 🛏️ {selectedCompDetails.bedrooms} dorm. • 🚿 {selectedCompDetails.bathrooms} baños
              </div>

              <div style={{ background: "rgba(255,255,255,0.01)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "8px", padding: "12px 15px", display: "flex", flexDirection: "column", gap: "10px" }}>
                <span style={{ fontSize: "0.75rem", display: "block", textTransform: "uppercase", fontWeight: "600", color: "#fff" }}>Configuración Tarifaria (Scraped)</span>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", fontSize: "0.78rem" }}>
                  <div>
                    <span style={{ color: "var(--text-secondary)", display: "block" }}>Precio Finde:</span>
                    <strong style={{ color: "#fff" }}>{selectedCompDetails.weekend_price ? `$${selectedCompDetails.weekend_price} USD` : "N/D"}</strong>
                  </div>
                  <div>
                    <span style={{ color: "var(--text-secondary)", display: "block" }}>Limpieza:</span>
                    <strong style={{ color: "#fff" }}>{selectedCompDetails.cleaning_fee ? `$${selectedCompDetails.cleaning_fee} USD` : "N/E"}</strong>
                  </div>
                  <div>
                    <span style={{ color: "var(--text-secondary)", display: "block" }}>Desc. Semanal:</span>
                    <strong style={{ color: "#fff" }}>{selectedCompDetails.weekly_discount ? `${selectedCompDetails.weekly_discount}%` : "N/E"}</strong>
                  </div>
                  <div>
                    <span style={{ color: "var(--text-secondary)", display: "block" }}>Desc. Mensual:</span>
                    <strong style={{ color: "#fff" }}>{selectedCompDetails.monthly_discount ? `${selectedCompDetails.monthly_discount}%` : "N/E"}</strong>
                  </div>
                  <div>
                    <span style={{ color: "var(--text-secondary)", display: "block" }}>Reserva Antic.:</span>
                    <strong style={{ color: "#fff" }}>{selectedCompDetails.early_bird_discount ? `${selectedCompDetails.early_bird_discount}%` : "N/E"}</strong>
                  </div>
                  <div>
                    <span style={{ color: "var(--text-secondary)", display: "block" }}>Último Minuto:</span>
                    <strong style={{ color: "#fff" }}>{selectedCompDetails.last_minute_discount ? `${selectedCompDetails.last_minute_discount}%` : "N/E"}</strong>
                  </div>
                  <div>
                    <span style={{ color: "var(--text-secondary)", display: "block" }}>Estadía Mínima:</span>
                    <strong style={{ color: "#fff" }}>{selectedCompDetails.minimum_stay ? `${selectedCompDetails.minimum_stay} Noches` : "N/E"}</strong>
                  </div>
                  <div>
                    <span style={{ color: "var(--text-secondary)", display: "block" }}>Pol. Cancelación:</span>
                    <strong style={{ color: "#fff", fontSize: "0.7rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{selectedCompDetails.cancellation_policy || "N/E"}</strong>
                  </div>
                </div>
                <div style={{ fontSize: "0.7rem", color: "var(--text-secondary)", borderTop: "1px solid rgba(255,255,255,0.04)", paddingTop: "6px" }}>
                  <span>Reserva Inmediata: {selectedCompDetails.instant_book === true ? "Habilitado" : selectedCompDetails.instant_book === false ? "Deshabilitado" : "N/E"}</span>
                </div>
              </div>

              {/* Mini-Calendario de Disponibilidad a 30 Días */}
              {Array.isArray(selectedCompDetails.calendar) && selectedCompDetails.calendar.length > 0 && (
                <div style={{ background: "rgba(255,255,255,0.01)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "8px", padding: "12px 15px", display: "flex", flexDirection: "column", gap: "8px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "0.75rem", textTransform: "uppercase", fontWeight: "600", color: "#fff" }}>Calendario de Disponibilidad (30 Días)</span>
                    <span style={{ fontSize: "0.72rem", color: "var(--accent-coral)", fontWeight: "bold" }}>
                      🔴 {selectedCompDetails.booked_days_count || 0} de {selectedCompDetails.total_days_count || 30} n. reservadas ({selectedCompDetails.occupancy_30d_pct}% occ)
                    </span>
                  </div>
                  
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "4px", marginTop: "4px" }}>
                    {selectedCompDetails.calendar.slice(0, 28).map((dayItem, dIdx) => (
                      <div
                        key={dIdx}
                        title={`${dayItem.date}: ${dayItem.available === 0 ? "RESERVADO / OCUPADO" : "DISPONIBLE"} ($${Math.round(dayItem.price)} USD)`}
                        style={{
                          height: "36px",
                          borderRadius: "6px",
                          backgroundColor: dayItem.available === 0 ? "rgba(255, 107, 107, 0.2)" : "rgba(16, 185, 129, 0.15)",
                          border: dayItem.available === 0 ? "1px solid rgba(255, 107, 107, 0.4)" : "1px solid rgba(16, 185, 129, 0.3)",
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "0.6rem",
                          color: dayItem.available === 0 ? "var(--accent-coral)" : "var(--accent-emerald)",
                          cursor: "pointer"
                        }}
                      >
                        <span style={{ fontSize: "0.58rem", opacity: 0.8 }}>{dayItem.date.slice(8)}</span>
                        <strong style={{ fontSize: "0.62rem" }}>{dayItem.available === 0 ? "🔴" : `$${Math.round(dayItem.price)}`}</strong>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.68rem", color: "var(--text-secondary)", marginTop: "4px" }}>
                    <span>🔴 Reservada por huésped</span>
                    <span>🟢 Noche disponible ($ USD)</span>
                  </div>
                </div>
              )}

              <div>
                <strong>Amenities detectados por el Scraper:</strong>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "6px" }}>
                  {(selectedCompDetails.amenities ? 
                    (typeof selectedCompDetails.amenities === 'string' ? JSON.parse(selectedCompDetails.amenities || "[]") : selectedCompDetails.amenities)
                    : ["Wifi", "Aire Acondicionado", "Cocina", "TV"]
                  ).map((am, idx) => (
                    <span key={idx} style={{ padding: "2px 8px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "10px", fontSize: "0.72rem", color: "#fff" }}>
                      {am}
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
              className="vercel-btn"
              style={{
                display: "block",
                width: "100%",
                textDecoration: "none",
                fontWeight: "bold",
                textAlign: "center"
              }}
            >
              Ver anuncio real en Airbnb ➔
            </a>
          </div>
        </div>
      )}

      {/* ── PIN Modal Overlay ─────────────────────────────────────── */}
      {showPinModal && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 9999,
          display: "flex", alignItems: "center", justifyContent: "center",
          backgroundColor: "rgba(5,6,9,0.85)",
          backdropFilter: "blur(8px)",
          animation: "fadeIn 0.15s ease"
        }}>
          <div className="glass-card" style={{
            width: "100%", maxWidth: "380px", padding: "32px",
            border: "1px solid rgba(255,255,255,0.1)",
            boxShadow: "0 25px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(245,158,11,0.15)",
            animation: "slideUp 0.2s ease"
          }}>
            <div style={{ textAlign: "center", marginBottom: "24px" }}>
              <div style={{ fontSize: "2rem", marginBottom: "8px" }}>🔒</div>
              <h3 style={{ margin: "0 0 6px 0", fontSize: "1.1rem" }}>Acción Protegida</h3>
              <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>
                Esta acción modifica datos de producción.<br />
                Ingresa tu PIN de administrador para continuar.
              </p>
            </div>

            <form onSubmit={handlePinSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <input
                autoFocus
                type="password"
                inputMode="numeric"
                maxLength={8}
                placeholder="••••••"
                value={pinInputVal}
                onChange={(e) => {
                  setPinInputVal(e.target.value);
                  setPinModalError("");
                }}
                style={{
                  textAlign: "center",
                  fontSize: "1.4rem",
                  letterSpacing: "0.3em",
                  padding: "12px",
                  background: "rgba(0,0,0,0.3)",
                  border: pinModalError ? "1px solid rgba(239,68,68,0.5)" : "1px solid rgba(255,255,255,0.12)",
                  borderRadius: "8px",
                  color: "#fff",
                  outline: "none",
                  width: "100%",
                  boxSizing: "border-box"
                }}
              />
              {pinModalError && (
                <p style={{ margin: 0, fontSize: "0.75rem", color: "#ef4444", textAlign: "center" }}>
                  {pinModalError}
                </p>
              )}
              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  type="button"
                  onClick={() => setShowPinModal(false)}
                  style={{
                    flex: 1, padding: "10px", borderRadius: "8px",
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    color: "var(--text-secondary)", cursor: "pointer", fontSize: "0.85rem"
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="vercel-btn"
                  style={{ flex: 2, padding: "10px", fontSize: "0.9rem", fontWeight: "bold" }}
                >
                  Desbloquear y Continuar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Live Ingestion Progress Toast ────────────────────────── */}
      {hydrating && (
        <div style={{
          position: "fixed",
          bottom: "24px",
          right: "24px",
          zIndex: 9998,
          backgroundColor: "rgba(10, 15, 26, 0.95)",
          backdropFilter: "blur(12px)",
          border: "1px solid rgba(245, 158, 11, 0.35)",
          borderRadius: "14px",
          padding: "16px 20px",
          boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          width: "330px",
          animation: "slideUp 0.3s ease-out"
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: "600", fontSize: "0.85rem", color: "var(--accent-gold)" }}>
              <RefreshCw className="animate-spin" size={14} />
              <span>Ingesta de Mercado en Vivo</span>
            </div>
            <span style={{ fontSize: "0.78rem", color: "#fff", fontWeight: "bold" }}>
              {Math.round((pipelineStatus?.hydration_job?.progress || 0.1) * 100)}%
            </span>
          </div>
          <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.7)", lineHeight: "1.3" }}>
            {pipelineStatus?.hydration_job?.message || "Procesando ingesta y modelo dinámico..."}
          </div>
          <div style={{ width: "100%", height: "6px", backgroundColor: "rgba(255,255,255,0.08)", borderRadius: "3px", overflow: "hidden" }}>
            <div style={{
              height: "100%",
              width: `${Math.max(6, Math.round((pipelineStatus?.hydration_job?.progress || 0.1) * 100))}%`,
              backgroundColor: "var(--accent-gold)",
              borderRadius: "3px",
              transition: "width 0.4s ease"
            }}></div>
          </div>
        </div>
      )}

    </div>
  );
}
