"use client";

import React, { useState, useEffect } from "react";
import { Info, Check, Lock, RotateCcw } from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  CartesianGrid,
  ReferenceLine
} from "recharts";

const rawApiUrl = process.env.NEXT_PUBLIC_API_URL;
const cleanUrl = rawApiUrl && rawApiUrl.replace(/^["']|["']$/g, "").trim();
const API_BASE = (cleanUrl && cleanUrl !== "undefined" && cleanUrl !== "null" && cleanUrl !== "[SENSITIVE]") ? cleanUrl : "https://airbnb-market-intelligence.onrender.com";

export default function PricingCalendar({ recs, listingId, feeStructure = "simplified", onOverrideUpdated }) {
  const [selectedDay, setSelectedDay] = useState(null);
  const [overrideVal, setOverrideVal] = useState("");

  const getFeeBreakdownTooltip = (price) => {
    if (feeStructure === "simplified") {
      const hostFee = price * 0.15;
      const hostPayout = price * 0.85;
      return `Desglose (Tarifa Simplificada):
• Total Huésped: $${price.toFixed(1)} USD
• Comisión Airbnb (15%): $${hostFee.toFixed(1)} USD
• Cobro Neto Anfitrión (85%): $${hostPayout.toFixed(1)} USD`;
    } else {
      const hostFee = price * 0.03;
      const hostPayout = price * 0.97;
      const guestFee = price * 0.142;
      const totalGuest = price + guestFee;
      return `Desglose (Tarifa Dividida):
• Precio Anuncio: $${price.toFixed(1)} USD
• Tarifa Huésped (~14.2%): $${guestFee.toFixed(1)} USD
• Total Huésped: $${totalGuest.toFixed(1)} USD
• Comisión Airbnb (3%): $${hostFee.toFixed(1)} USD
• Cobro Neto Anfitrión (97%): $${hostPayout.toFixed(1)} USD`;
    }
  };

  // Sync details if selected day is updated from parent refresh
  useEffect(() => {
    if (selectedDay && recs) {
      const updated = recs.find(r => r.date === selectedDay.dateStr);
      if (updated) {
        const d = parseDateStr(updated.date);
        const feats = updated.features || {};
        const isOverride = feats.is_override || false;
        
        let priceState = "standard";
        if (updated.recommended_price > feats.base_ml_price) {
          priceState = "premium";
        } else if (updated.recommended_price < feats.base_ml_price) {
          priceState = "discount";
        }

        setSelectedDay({
          isPadding: false,
          key: updated.date,
          dateStr: updated.date,
          dayNum: d.getDate(),
          monthName: d.toLocaleString("en-US", { month: "short" }),
          price: updated.recommended_price,
          isAvailable: updated.is_available === 1,
          isWeekend: feats.is_weekend,
          isHoliday: feats.is_holiday,
          holidayName: feats.holiday_name,
          basePrice: feats.base_ml_price || updated.recommended_price,
          compAvg: updated.competitor_avg || 100,
          leadTime: feats.lead_time_days || 0,
          priceState: priceState,
          isOverride: isOverride
        });
      }
    }
  }, [recs]);

  if (!recs || recs.length === 0) {
    return <div style={{ color: "#94a3b8", padding: "40px", textAlign: "center" }}>No calendar data available.</div>;
  }

  const parseDateStr = (dateStr) => {
    const parts = dateStr.split("-");
    return new Date(parts[0], parts[1] - 1, parts[2]);
  };

  const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const firstDate = parseDateStr(recs[0].date);
  const firstDayIndex = firstDate.getDay();
  
  const paddingCells = Array.from({ length: firstDayIndex }, (_, i) => ({
    isPadding: true,
    key: `pad-${i}`
  }));

  const calendarCells = recs.map((r) => {
    const d = parseDateStr(r.date);
    const feats = r.features || {};
    const isOverride = feats.is_override || false;
    
    let priceState = "standard";
    if (r.recommended_price > feats.base_ml_price) {
      priceState = "premium";
    } else if (r.recommended_price < feats.base_ml_price) {
      priceState = "discount";
    }

    return {
      isPadding: false,
      key: r.date,
      dateStr: r.date,
      dayNum: d.getDate(),
      monthName: d.toLocaleString("en-US", { month: "short" }),
      price: r.recommended_price,
      isAvailable: r.is_available === 1,
      isWeekend: feats.is_weekend,
      isHoliday: feats.is_holiday,
      holidayName: feats.holiday_name,
      basePrice: feats.base_ml_price || r.recommended_price,
      compAvg: r.competitor_avg || 100,
      leadTime: feats.lead_time_days || 0,
      priceState: priceState,
      isOverride: isOverride
    };
  });

  const allCells = [...paddingCells, ...calendarCells];
  const remainingCells = 7 - (allCells.length % 7);
  if (remainingCells < 7) {
    for (let i = 0; i < remainingCells; i++) {
      allCells.push({
        isPadding: true,
        key: `pad-end-${i}`
      });
    }
  }

  const cellStyles = {
    padding: { background: "transparent", border: "none" },
    booked: { background: "rgba(100, 116, 139, 0.12)", border: "1px dashed rgba(255, 255, 255, 0.05)", opacity: 0.5 },
    standard: { background: "rgba(15, 23, 42, 0.5)", border: "1px solid rgba(255,255,255,0.06)" },
    premium: { background: "rgba(255, 90, 95, 0.08)", border: "1px solid rgba(255, 90, 95, 0.25)", color: "var(--accent-coral)" },
    discount: { background: "rgba(16, 185, 129, 0.08)", border: "1px solid rgba(16, 185, 129, 0.25)", color: "var(--accent-emerald)" },
    override: { background: "rgba(245, 158, 11, 0.08)", border: "1px solid rgba(245, 158, 11, 0.35)", color: "#f59e0b" }
  };

  const handleApplyOverride = async () => {
    if (!overrideVal || isNaN(overrideVal) || parseFloat(overrideVal) <= 0) return;
    try {
      const res = await fetch(`${API_BASE}/api/listings/${listingId}/recommendations/override`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: selectedDay.dateStr, price: parseFloat(overrideVal) })
      });
      if (res.ok) {
        if (onOverrideUpdated) await onOverrideUpdated();
        setSelectedDay(prev => ({
          ...prev,
          price: parseFloat(overrideVal),
          isOverride: true
        }));
        setOverrideVal("");
      }
    } catch (e) {
      console.error("Failed to save override price", e);
    }
  };

  const handleResetOverride = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/listings/${listingId}/recommendations/reset`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: selectedDay.dateStr })
      });
      if (res.ok) {
        if (onOverrideUpdated) await onOverrideUpdated();
        setSelectedDay(null); // Force close breakdown to reload state
      }
    } catch (e) {
      console.error("Failed to reset override price", e);
    }
  };

  // Generate Price Elasticity Data Curve points
  const getElasticityData = () => {
    if (!selectedDay || !selectedDay.compAvg) return [];
    const pComp = selectedDay.compAvg;
    const minSearch = Math.round(pComp * 0.5);
    const maxSearch = Math.round(pComp * 1.5);
    const step = Math.max(1, Math.round((maxSearch - minSearch) / 20));
    
    const data = [];
    for (let p = minSearch; p <= maxSearch; p += step) {
      const prob = 1.0 / (1.0 + Math.exp(0.035 * (p - pComp)));
      data.push({
        price: p,
        "Booking Probability (%)": Math.round(prob * 100),
        "Expected Revenue ($)": Math.round(p * prob)
      });
    }
    return data;
  };

  const elasticityData = getElasticityData();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Calendar Grid */}
      <div className="glass-card" style={{ padding: "20px", marginBottom: 0 }}>
        {/* Days Header */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "8px", textAlign: "center", marginBottom: "12px" }}>
          {daysOfWeek.map((day) => (
            <div key={day} style={{ fontSize: "0.8rem", color: "var(--text-secondary)", fontWeight: 700, textTransform: "uppercase" }}>
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Body */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "8px" }}>
          {allCells.map((cell) => {
            if (cell.isPadding) {
              return <div key={cell.key} style={{ minHeight: "85px" }}></div>;
            }

            const styleType = !cell.isAvailable ? "booked" : cell.isOverride ? "override" : cell.priceState;
            const style = cellStyles[styleType];
            const isSelected = selectedDay && selectedDay.dateStr === cell.dateStr;

            return (
              <div
                key={cell.key}
                onClick={() => cell.isAvailable && setSelectedDay(cell)}
                style={{
                  ...style,
                  minHeight: "85px",
                  borderRadius: "10px",
                  padding: "10px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  cursor: cell.isAvailable ? "pointer" : "not-allowed",
                  position: "relative",
                  transition: "all 0.2s ease",
                  border: isSelected ? "2px solid #ffffff" : style.border,
                  transform: isSelected ? "scale(1.03)" : "none",
                  boxShadow: isSelected ? "0 0 15px rgba(255,255,255,0.2)" : "none"
                }}
                className={cell.isAvailable ? "calendar-cell-hover" : ""}
              >
                {/* Day Header (Number + Icons) */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)", fontWeight: 700 }}>
                    {cell.dayNum} {cell.monthName}
                  </span>
                  <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
                    {cell.isOverride && (
                      <span title="Manual Override Active" style={{ fontSize: "0.7rem", color: "#f59e0b" }}>
                        👤
                      </span>
                    )}
                    {cell.isHoliday && (
                      <span
                        title={cell.holidayName}
                        style={{
                          width: "6px",
                          height: "6px",
                          borderRadius: "50%",
                          backgroundColor: "var(--accent-coral)",
                          boxShadow: "0 0 6px var(--accent-coral)",
                          display: "inline-block"
                        }}
                      ></span>
                    )}
                  </div>
                </div>

                {/* Day Price */}
                <div style={{ textAlign: "right" }}>
                  {!cell.isAvailable ? (
                    <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)", fontWeight: 600 }}>Booked</span>
                  ) : (
                    <span className="ui-tooltip-wrapper" style={{ margin: 0, opacity: 1, display: "inline-block" }}>
                      <span style={{ 
                        fontSize: "1.1rem", 
                        fontWeight: 700, 
                        color: cell.isOverride ? "#f59e0b" : cell.priceState === "premium" ? "var(--accent-coral)" : cell.priceState === "discount" ? "var(--accent-emerald)" : "#ffffff",
                        borderBottom: "1px dashed rgba(255,255,255,0.2)",
                        cursor: "help"
                      }}>
                        ${cell.price.toFixed(0)}
                      </span>
                      <span className="ui-tooltip" style={{ bottom: "100%", left: "50%", transform: "translateX(-50%)", whiteSpace: "pre-line", fontSize: "0.75rem" }}>
                        {getFeeBreakdownTooltip(cell.price)}
                      </span>
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2-Column Selected Day Breakdown Details Panel */}
      {selectedDay && (
        <div className="glass-card" style={{ borderLeft: "4px solid var(--accent-coral)", animation: "fadeIn 0.2s ease", marginBottom: 0, padding: "24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
            <div>
              <h3 style={{ margin: 0, color: "#ffffff" }}>
                Price Decision Workspace: {selectedDay.dayNum} de {selectedDay.monthName} {selectedDay.isOverride && "🔒 (Manual Override)"}
              </h3>
              <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                Analyze expected revenue and override rates for check-in date: <code>{selectedDay.dateStr}</code>
              </p>
            </div>
            <button
              className="btn btn-secondary"
              onClick={() => { setSelectedDay(null); setOverrideVal(""); }}
              style={{ width: "auto", padding: "5px 12px", fontSize: "0.8rem", height: "auto" }}
            >
              Close Workspace
            </button>
          </div>

          <div className="grid-equal-2col" style={{ gap: "30px", alignItems: "stretch" }}>
            {/* Left Column: Price metrics & Overrides */}
            <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "0.9rem", paddingBottom: "20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "6px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                  <span style={{ color: "var(--text-secondary)" }}>Active Price:</span>
                  <span className="ui-tooltip-wrapper" style={{ margin: 0, opacity: 1 }}>
                    <strong style={{ color: selectedDay.isOverride ? "#f59e0b" : "#ffffff", fontSize: "1.05rem", borderBottom: "1px dashed rgba(255,255,255,0.2)", cursor: "help" }}>
                      ${selectedDay.price.toFixed(2)}
                    </strong>
                    <span className="ui-tooltip" style={{ bottom: "100%", right: 0, whiteSpace: "pre-line", fontSize: "0.75rem" }}>
                      {getFeeBreakdownTooltip(selectedDay.price)}
                    </span>
                  </span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--text-secondary)" }}>AI Expected Rate:</span>
                  <span className="ui-tooltip-wrapper" style={{ margin: 0, opacity: 1 }}>
                    <span style={{ color: "var(--text-primary)", borderBottom: "1px dashed rgba(255,255,255,0.2)", cursor: "help" }}>
                      ${selectedDay.basePrice.toFixed(2)}
                    </span>
                    <span className="ui-tooltip" style={{ bottom: "100%", right: 0, whiteSpace: "pre-line", fontSize: "0.75rem" }}>
                      {getFeeBreakdownTooltip(selectedDay.basePrice)}
                    </span>
                  </span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--text-secondary)" }}>Competitors Avg:</span>
                  <span className="ui-tooltip-wrapper" style={{ margin: 0, opacity: 1 }}>
                    <span style={{ color: "var(--text-primary)", borderBottom: "1px dashed rgba(255,255,255,0.2)", cursor: "help" }}>
                      ${selectedDay.compAvg.toFixed(2)}
                    </span>
                    <span className="ui-tooltip" style={{ bottom: "100%", right: 0, whiteSpace: "pre-line", fontSize: "0.75rem" }}>
                      {getFeeBreakdownTooltip(selectedDay.compAvg)}
                    </span>
                  </span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--text-secondary)" }}>Days to Check-in:</span>
                  <span style={{ color: "var(--text-primary)" }}>{selectedDay.leadTime} days</span>
                </div>
                {selectedDay.isHoliday && (
                  <div style={{ display: "flex", justifyContent: "space-between", color: "var(--accent-coral)" }}>
                    <span>National Holiday:</span>
                    <span>{selectedDay.holidayName} (+20%)</span>
                  </div>
                )}
              </div>

              {/* Override Inputs */}
              <div style={{ backgroundColor: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", padding: "16px", borderRadius: "10px" }}>
                <span style={{ display: "block", fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "8px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  Set Custom Override Rate
                </span>
                <div style={{ display: "flex", gap: "10px" }}>
                  <div style={{ position: "relative", flex: 1 }}>
                    <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-secondary)", fontSize: "0.9rem" }}>$</span>
                    <input
                      type="number"
                      className="text-input"
                      placeholder="Enter custom price"
                      value={overrideVal}
                      onChange={(e) => setOverrideVal(e.target.value)}
                      style={{ paddingLeft: "24px", marginBottom: 0, height: "38px", fontSize: "0.9rem" }}
                    />
                  </div>
                  <button
                    className="btn btn-primary"
                    onClick={handleApplyOverride}
                    style={{ width: "auto", padding: "0 16px", height: "38px", display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "0.85rem" }}
                  >
                    <Check size={16} /> Apply
                  </button>
                  {selectedDay.isOverride && (
                    <button
                      className="btn btn-secondary"
                      onClick={handleResetOverride}
                      style={{ width: "auto", padding: "0 12px", height: "38px", display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "0.85rem", border: "1px solid rgba(255,255,255,0.1)" }}
                      title="Reset to AI recommendations"
                    >
                      <RotateCcw size={16} /> Reset
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column: Elasticity expected revenue curve chart */}
            <div style={{ minHeight: "220px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)", display: "block", marginBottom: "10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Price Elasticity & Expected Revenue Curve
              </span>
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={elasticityData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                  <XAxis dataKey="price" stroke="#64748b" fontSize={9} unit="$" />
                  <YAxis stroke="#64748b" fontSize={9} />
                  <RechartsTooltip
                    contentStyle={{ backgroundColor: "rgba(15, 23, 42, 0.95)", borderColor: "rgba(255,255,255,0.08)", borderRadius: "8px" }}
                    itemStyle={{ fontSize: "0.8rem" }}
                    labelStyle={{ fontSize: "0.8rem", fontWeight: "bold", color: "#fff" }}
                  />
                  <ReferenceLine x={selectedDay.compAvg} stroke="rgba(255,255,255,0.2)" strokeDasharray="3 3" label={{ value: "Comp Avg", fill: "#94a3b8", fontSize: 8, position: "top" }} />
                  <ReferenceLine x={selectedDay.price} stroke="var(--accent-coral)" strokeWidth={2} label={{ value: "Active", fill: "var(--accent-coral)", fontSize: 8, position: "top" }} />
                  <Line type="monotone" dataKey="Expected Revenue ($)" name="Expected Rev ($)" stroke="var(--accent-coral)" strokeWidth={3} dot={false} />
                  <Line type="monotone" dataKey="Booking Probability (%)" name="Booking Prob (%)" stroke="var(--accent-cyan)" strokeWidth={1.5} strokeDasharray="5 5" dot={false} />
                </LineChart>
              </ResponsiveContainer>
              <div style={{ display: "flex", gap: "10px", fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "8px", justifyContent: "center" }}>
                <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  <span style={{ width: "12px", height: "3px", backgroundColor: "var(--accent-coral)", display: "inline-block" }}></span> Expected Revenue (Rates × Prob)
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  <span style={{ width: "12px", height: "3px", borderTop: "2px dashed var(--accent-cyan)", display: "inline-block" }}></span> Booking Probability
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
