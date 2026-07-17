"use client";

import React from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ReferenceLine,
  ReferenceArea
} from "recharts";

// Airbnb Design Colors
const COLORS = {
  coral: "var(--accent-gold)", // Map coral key to gold variable to update all charts
  teal: "#00b5b5",
  slate: "#64748b",
  emerald: "#10b981",
  gold: "var(--accent-gold)",
  darkBg: "rgba(12, 14, 21, 0.95)",
  border: "rgba(212, 175, 55, 0.12)"
};

// Custom tooltip renderer for styled dark theme
const CustomTooltip = ({ active, payload, label, formatter }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        backgroundColor: "var(--bg-secondary)",
        border: "1px solid var(--card-border)",
        borderRadius: "8px",
        padding: "12px 16px",
        boxShadow: "0 8px 16px rgba(0, 0, 0, 0.15)",
        fontFamily: "var(--font-sans)",
        fontSize: "0.85rem"
      }}>
        <p style={{ margin: "0 0 6px 0", color: "var(--text-primary)", fontWeight: 600 }}>{label}</p>
        {payload.map((item, idx) => (
          <p key={idx} style={{ margin: "3px 0", color: item.color || item.fill }}>
            {item.name}: <strong>{formatter ? formatter(item.value, item.name) : item.value}</strong>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// 1. Price Distribution Chart (Histogram representation)
export function PriceDistributionChart({ data }) {
  // Process raw listings prices into histogram bins
  const prices = data.map(d => d.price);
  if (prices.length === 0) return null;
  
  const min = Math.floor(Math.min(...prices) / 10) * 10;
  const max = Math.ceil(Math.max(...prices) / 10) * 10;
  const binWidth = Math.ceil((max - min) / 10);
  
  const bins = Array.from({ length: 10 }, (_, i) => {
    const start = min + i * binWidth;
    const end = start + binWidth;
    const count = prices.filter(p => p >= start && p < end).length;
    return { name: `$${start}-${end}`, count };
  });

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={bins} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} />
        <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey="count" name="Cantidad de Anuncios" fill={COLORS.coral} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

// 2. Occupancy by Neighborhood (Horizontal Bar Chart)
export function OccupancyChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 10, right: 15, left: 15, bottom: 5 }}
      >
        <XAxis type="number" stroke="#64748b" fontSize={10} tickLine={false} unit="%" />
        <YAxis dataKey="neighborhood" type="category" stroke="#64748b" fontSize={10} tickLine={false} width={100} />
        <Tooltip content={<CustomTooltip formatter={(v) => `${v}%`} />} />
        <Bar dataKey="avg_occupancy" name="Ocupación Promedio" fill={COLORS.teal} radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

// 3. Price Trend Chart (Line Chart over next 30 days)
const getDayOfWeek = (dateStr) => {
  try {
    const date = new Date(dateStr + "T12:00:00");
    const days = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"];
    const dayName = days[date.getDay()];
    const parts = dateStr.split("-");
    const formattedDate = parts.length === 3 ? `${parts[2]}/${parts[1]}` : dateStr.substring(5);
    return `${dayName} ${formattedDate}`;
  } catch (e) {
    return dateStr;
  }
};

export function PriceTrendChart({ recs, basePrice, weekendPremium }) {
  if (!recs || recs.length === 0) return <div style={{ color: "#94a3b8", padding: "40px", textAlign: "center" }}>No hay datos de precios para los próximos 30 días.</div>;

  const base = basePrice || 0;
  const wkMultiplier = weekendPremium || 1.15;
  const weekendBase = base > 0 ? Math.round(base * wkMultiplier) : 0;

  // Detect weekend ranges for background shading
  const weekendRanges = [];
  let wkStart = null;
  recs.forEach((r, i) => {
    try {
      const dow = new Date(r.date + "T12:00:00").getDay();
      const isWknd = dow === 5 || dow === 6;
      if (isWknd && !wkStart) wkStart = r.date;
      if (!isWknd && wkStart) {
        weekendRanges.push({ x1: wkStart, x2: recs[i - 1]?.date });
        wkStart = null;
      }
    } catch (_) {}
  });
  if (wkStart) weekendRanges.push({ x1: wkStart, x2: recs[recs.length - 1]?.date });

  const CustomChartTooltip = ({ active, payload, label }) => {
    if (!active || !payload || !payload.length) return null;
    try {
      const d = new Date(label + "T12:00:00");
      const days = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
      const dayName = days[d.getDay()];
      const isWknd = d.getDay() === 5 || d.getDay() === 6;
      return (
        <div style={{
          backgroundColor: "var(--bg-secondary)",
          border: `1px solid ${isWknd ? "rgba(245,158,11,0.45)" : "var(--card-border)"}`,
          borderRadius: "10px", padding: "12px 16px",
          boxShadow: "0 8px 24px rgba(0,0,0,0.45)",
          fontSize: "0.8rem", minWidth: "200px"
        }}>
          <p style={{ margin: "0 0 8px 0", fontWeight: 700, color: isWknd ? "#f59e0b" : "var(--text-primary)", display: "flex", alignItems: "center", gap: "6px" }}>
            {dayName} {label.substring(5)}
            {isWknd && <span style={{ fontSize: "0.68rem", background: "rgba(245,158,11,0.15)", color: "#f59e0b", padding: "1px 6px", borderRadius: "4px", fontWeight: 600 }}>FIN DE SEMANA</span>}
          </p>
          {payload.filter(p => p.value != null).map((item, idx) => (
            <p key={idx} style={{ margin: "3px 0", color: item.color, display: "flex", justifyContent: "space-between", gap: "12px" }}>
              <span>{item.name}</span>
              <strong>${typeof item.value === "number" ? item.value.toFixed(0) : item.value} USD</strong>
            </p>
          ))}
          {base > 0 && (
            <p style={{ margin: "6px 0 0 0", borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: "5px", color: "rgba(255,255,255,0.35)", fontSize: "0.72rem", display: "flex", justifyContent: "space-between" }}>
              <span>Tu base configurada:</span>
              <span>${isWknd ? weekendBase : base} USD</span>
            </p>
          )}
        </div>
      );
    } catch (_) { return null; }
  };

  return (
    <ResponsiveContainer width="100%" height={370}>
      <LineChart data={recs} margin={{ top: 15, right: 24, left: -4, bottom: 30 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />

        {/* Weekend background shading */}
        {weekendRanges.map((r, i) => (
          <ReferenceArea key={i} x1={r.x1} x2={r.x2}
            fill="rgba(245,158,11,0.06)" stroke="rgba(245,158,11,0.15)" strokeWidth={1} />
        ))}

        <XAxis dataKey="date" stroke="#64748b" fontSize={9} angle={-45} textAnchor="end" height={55} tickFormatter={getDayOfWeek} />
        <YAxis stroke="#64748b" fontSize={10} tickFormatter={(v) => `$${v}`} width={50} />
        <Tooltip content={<CustomChartTooltip />} />
        <Legend verticalAlign="top" height={40} iconType="circle" />

        {/* Base price weekday reference line */}
        {base > 0 && (
          <ReferenceLine y={base} stroke="rgba(255,255,255,0.2)" strokeDasharray="6 3" strokeWidth={1.5}
            label={{ value: `Base semana $${base}`, position: "insideTopRight", fontSize: 9, fill: "rgba(255,255,255,0.3)" }} />
        )}

        {/* Base price weekend reference line */}
        {weekendBase > 0 && (
          <ReferenceLine y={weekendBase} stroke="rgba(245,158,11,0.4)" strokeDasharray="5 3" strokeWidth={1.5}
            label={{ value: `Base finde $${weekendBase}`, position: "insideBottomRight", fontSize: 9, fill: "rgba(245,158,11,0.65)" }} />
        )}

        <Line type="monotone" dataKey="competitor_avg" name="Promedio Competidores"
          stroke={COLORS.slate} strokeWidth={2} strokeDasharray="4 4" dot={false} />

        <Line type="monotone" dataKey="current_price" name="Tu Precio Publicado"
          stroke={COLORS.teal} strokeWidth={2.5} dot={{ r: 2 }} activeDot={{ r: 5 }} />

        <Line type="monotone" dataKey="recommended_price" name="Precio IA Recomendado"
          stroke={COLORS.coral} strokeWidth={3.5}
          dot={(props) => {
            const { cx, cy, payload } = props;
            try {
              const dow = new Date(payload.date + "T12:00:00").getDay();
              const isWknd = dow === 5 || dow === 6;
              return <circle key={props.key} cx={cx} cy={cy} r={isWknd ? 5 : 3} fill={isWknd ? "#f59e0b" : COLORS.coral} stroke="none" />;
            } catch (_) { return <circle key={props.key} cx={cx} cy={cy} r={3} fill={COLORS.coral} stroke="none" />; }
          }}
          activeDot={{ r: 7 }} />

      </LineChart>
    </ResponsiveContainer>
  );
}

// 4. Competitor Radar Comparison Chart


export function CompetitorRadarChart({ target, competitors }) {
  if (!target || !competitors || competitors.length === 0) return null;

  // Calculate average competitor values
  const avgBedrooms = competitors.reduce((acc, c) => acc + c.bedrooms, 0) / competitors.length;
  const avgBathrooms = competitors.reduce((acc, c) => acc + c.bathrooms, 0) / competitors.length;
  const avgAccommodates = competitors.reduce((acc, c) => acc + c.accommodates, 0) / competitors.length;
  const avgRating = competitors.reduce((acc, c) => acc + c.rating, 0) / competitors.length;
  
  // Scale reviews count to fit nicely in 0-5 scale
  const targetReviews = Math.min(target.reviews_count / 30, 5);
  const avgReviews = Math.min((competitors.reduce((acc, c) => acc + c.reviews_count, 0) / competitors.length) / 30, 5);

  const data = [
    { subject: "Dormitorios", target: target.bedrooms, competitors: avgBedrooms },
    { subject: "Baños", target: target.bathrooms, competitors: avgBathrooms },
    { subject: "Huéspedes", target: target.accommodates / 2.0, competitors: avgAccommodates / 2.0 }, // scale down accommodates
    { subject: "Calificación", target: target.rating, competitors: avgRating },
    { subject: "Reseñas (Escaladas)", target: targetReviews, competitors: avgReviews }
  ];

  return (
    <ResponsiveContainer width="100%" height={260}>
      <RadarChart cx="50%" cy="50%" outerRadius="75%" data={data}>
        <PolarGrid stroke="rgba(255,255,255,0.05)" />
        <PolarAngleAxis dataKey="subject" stroke="#94a3b8" fontSize={10} />
        <PolarRadiusAxis angle={30} domain={[0, 5]} stroke="rgba(255,255,255,0.1)" tick={false} />
        <Radar
          name="Tu Propiedad"
          dataKey="target"
          stroke={COLORS.coral}
          fill={COLORS.coral}
          fillOpacity={0.25}
        />
        <Radar
          name="Promedio Competidores"
          dataKey="competitors"
          stroke={COLORS.slate}
          fill={COLORS.slate}
          fillOpacity={0.15}
        />
        <Legend verticalAlign="bottom" height={24} iconType="circle" />
        <Tooltip content={<CustomTooltip formatter={(v) => v.toFixed(2)} />} />
      </RadarChart>
    </ResponsiveContainer>
  );
}

// 5. Market History Chart (Double Y-Axis Line Chart of Historical price and occupancy)
export function MarketHistoryChart({ data }) {
  if (!data || data.length === 0) {
    return (
      <div style={{ color: "var(--text-secondary)", padding: "60px", textAlign: "center", fontSize: "0.85rem" }}>
        No hay datos históricos del mercado disponibles. Por favor, ejecuta una actualización rápida en Sistema para recopilar estadísticas de mercado.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data} margin={{ top: 15, right: -5, left: -20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
        <XAxis 
          dataKey="date" 
          stroke="#64748b" 
          fontSize={10} 
          tickFormatter={(tick) => tick.substring(5)} 
        />
        <YAxis 
          yAxisId="left"
          stroke={COLORS.coral} 
          fontSize={10} 
          tickFormatter={(tick) => `$${tick}`} 
        />
        <YAxis 
          yAxisId="right"
          orientation="right"
          stroke={COLORS.teal} 
          fontSize={10} 
          tickFormatter={(tick) => `${tick}%`} 
        />
        <Tooltip content={<CustomTooltip formatter={(v, name) => name && name.toLowerCase().includes("precio") ? `$${v.toFixed(2)}` : `${v.toFixed(1)}%`} />} />
        <Legend verticalAlign="top" height={36} iconType="circle" />
        
        <Line 
          yAxisId="left"
          type="monotone" 
          dataKey="avg_price" 
          name="Precio Promedio (USD)" 
          stroke={COLORS.coral} 
          strokeWidth={3}
          dot={{ r: 4 }}
          activeDot={{ r: 6 }}
        />
        <Line 
          yAxisId="right"
          type="monotone" 
          dataKey="avg_occupancy" 
          name="Ocupación Promedio (%)" 
          stroke={COLORS.teal} 
          strokeWidth={3}
          dot={{ r: 4 }}
          activeDot={{ r: 6 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
