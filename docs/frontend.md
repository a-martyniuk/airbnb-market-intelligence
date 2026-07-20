# Next.js Frontend Specification

This document provides a detailed specification of the React Next.js frontend application, including state management, custom styling, layout unification, and maps integrations.

---

## 🌐 Overview

The user interface is built as a Single Page Application (SPA) using **Next.js 16 (React)**. It is styled with custom vanilla CSS (`frontend/src/app/globals.css`) incorporating dark mode styles, glowing borders, premium typography, and micro-animations.

---

## 📂 Codebase Structure

- `frontend/src/app/page.js`: The central component. Exposes sidebar navigation, monitors overall loading/offline state, loads dashboard KPIs, and renders the active workspace view.
- `frontend/src/app/globals.css`: Contains CSS variables (design tokens), scrollbar customizers, card styles (glassmorphism), button animations, and custom theme overrides.
- `frontend/src/app/components/LeafletMap.js`: Interactive Leaflet map container that displays geolocalized listings and coordinates pins.
- `frontend/src/app/components/PricingCalendar.js`: Displays a grid representation of calendar dates matching the Airbnb pricing styles, with daily recommendations.

---

## 🎛️ Navigation Structure & Views

The sidebar navigation splits the application into three sections:

### 📊 1. INTELIGENCIA DE MERCADO
- **Centro de Decisiones (`dashboard`)**: Renders high-level decision cards showing:
  - *Precio Sugerido Hoy*: The ML-recommended price.
  - *Ingreso Proyectado (30d)*: Projected simulated revenue.
  - *Ocupación Esperada (30d)*: Projected simulated occupancy.
  - *RevPAR vs Mercado*: Relative ranking indicator.
- **Inteligencia de Precios (`pricing`)**: Comparative line chart displaying base price vs recommended price vs competitor average over 30 days, alongside the dynamic revenue simulator slider.
- **Competidores Afines (`competidores`)**: List of direct competitor cards showing similarity badges, distance in km, average rating, estimated RevPAR, and detailed key stats. Includes slide-out details panel.
- **Forecast y Escenarios (`forecast`)**: A cumulative AreaChart detailing expected revenue over the next 12 months under three scenario paths (Conservador, Balanceado, Agresivo).
- **Calendario Tarifario (`calendario`)**: Custom visual calendar grid showing target date status, prices, and tooltips detailing holidays and premium factors.

### 🏡 2. CONFIGURACIÓN DE PROPIEDAD
- **Mi Propiedad (`property_profile`)**: The consolidated, single tab for property setup. Navigated via three sub-tabs:
  1. *🔗 Conexión Airbnb*: URL scraping input and dynamic verification card.
  2. *📋 Ficha Técnica & Mapa*: Physical details (beds, baths, square meters, floor) and Leaflet map preview coordinate editor.
  3. *✨ Amenities*: Checklist categorized list of property features with search bar filtering.
- **Reglas de Tarifas (`pricing_rules`)**: Strategy sliders and manual override checkboxes allowing users to override cleaning fees, weekend multipliers, and discounts.

### 🗄️ 3. SISTEMA Y AUDITORÍA
- **Análisis Histórico (`historicos`)**: Snapshot history comparator allowing the user to select scraped execution logs and analyze market shifts.
- **Feed de Alertas (`alertas`)**: Real-time activity notifications detailing scraping events and price spikes.

---

## 🔄 Custom State Management & Autosave

### Live Synchronization Selector (`currentDetails`)
To ensure edits made in the profile setup tab immediately update projections and competitor calculations without forcing page refreshes, the frontend uses the `currentDetails` selector:
```javascript
const currentDetails = (selectedId && targetDetails && selectedId === targetDetails.listing_id) 
  ? targetDetails 
  : details;
```
All components in the dashboard use `currentDetails` instead of the cached `details` state hook.

### Notion-Style Debounced Autosave
When the user edits text inputs, checks amenities, or moves sliders in the configuration tabs, changes update the local state immediately. An effect hook monitors `targetDetails` updates, debounces execution for 1.5 seconds, and triggers an API save request:
```javascript
useEffect(() => {
  if (isFirstMount.current) {
    isFirstMount.current = false;
    return;
  }
  if (!targetDetails) return;

  setAutoSaveStatus("saving");
  if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
  
  saveTimeoutRef.current = setTimeout(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/settings/target/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          target_url: targetUrlInput,
          target_id: targetDetails.listing_id,
          details: targetDetails,
          pricing_overrides: targetDetails.pricing_overrides || {},
          manual_override_flags: targetDetails.manual_override_flags || {}
        })
      });
      if (res.ok) setAutoSaveStatus("saved");
      else setAutoSaveStatus("error");
    } catch (e) {
      setAutoSaveStatus("error");
    }
  }, 1500);
}, [targetDetails]);
```
This guarantees an effortless, silent data synchronization experience.
