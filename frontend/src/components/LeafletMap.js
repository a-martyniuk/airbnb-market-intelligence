"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";

// Component to dynamically update map center when user selects a different target listing
function MapController({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, 14);
    }
  }, [center, map]);
  return null;
}

export default function LeafletMap({ listings, center, targetListingId, selectedListingId, onSelectListing }) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return <div className="leaflet-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>Loading interactive map...</div>;
  }

  // Define custom Leaflet DivIcons to bypass bundler png asset issues and apply CSS styles
  const createDivIcon = (type, price) => {
    let className = "custom-marker";
    if (type === "target") {
      className += " target";
    } else {
      if (price < 75) className += " marker-green";
      else if (price < 120) className += " marker-yellow";
      else className += " marker-red";
    }
    
    return L.divIcon({
      className: className,
      iconSize: type === "target" ? [18, 18] : [12, 12],
      iconAnchor: type === "target" ? [9, 9] : [6, 6]
    });
  };

  const targetIcon = createDivIcon("target", 0);
  const hasValidCenter = center && center[0] && center[1];

  return (
    <MapContainer
      center={center || [-34.5861, -58.4373]}
      zoom={14}
      scrollWheelZoom={true}
      className="leaflet-container"
    >
      {/* CartoDB Dark Matter Tile Layer (Premium Tokenless Dark Map) */}
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      />

      {/* Always render target listing marker directly from center coordinates — guarantees
          the pin is visible even if the target is not in the listings array from the API */}
      {hasValidCenter && (
        <Marker
          key="__target__"
          position={center}
          icon={targetIcon}
          zIndexOffset={1000}
        >
          <Popup>
            <div style={{ color: "#0f172a", fontFamily: "sans-serif", fontSize: "0.85rem", minWidth: "180px" }}>
              <strong style={{ display: "block", marginBottom: "4px", fontSize: "0.9rem", color: "#0284c7" }}>
                🏠 Tu Propiedad
              </strong>
              <span style={{ fontSize: "0.75rem", color: "#475569" }}>Listado objetivo configurado en Sistema</span>
            </div>
          </Popup>
        </Marker>
      )}
      
      {/* Competitor markers — skip the target listing since it's always rendered above */}
      {listings.map((l) => {
        // If this listing IS the target, skip it to avoid duplicate pins
        if (l.listing_id === targetListingId) return null;

        return (
          <Marker
            key={l.listing_id}
            position={[l.latitude, l.longitude]}
            icon={createDivIcon("regular", l.price)}
          >
            <Popup>
              <div style={{ color: "#0f172a", fontFamily: "sans-serif", fontSize: "0.85rem", minWidth: "180px" }}>
                <strong style={{ display: "block", marginBottom: "4px", fontSize: "0.9rem" }}>{l.title}</strong>
                <span>Barrio: {l.neighborhood}</span><br />
                <span>Precio: <strong>${l.price.toFixed(0)} USD</strong> / noche</span><br />
                <span>Habitaciones: {l.bedrooms} BR / {l.bathrooms} BA</span><br />
                <span>Rating: ⭐ {l.rating ? l.rating.toFixed(2) : "N/A"} ({l.reviews_count || 0} reviews)</span><br />
                {l.host_is_superhost === 1 && <span style={{ color: "#f59e0b", fontWeight: "bold" }}>👑 Superhost</span>}<br />
                {l.geo_distance_km !== undefined && (
                  <span>Distancia: {l.geo_distance_km.toFixed(2)} km</span>
                )}
              </div>
            </Popup>
          </Marker>
        );
      })}
      
      {hasValidCenter && <MapController center={center} />}
    </MapContainer>
  );
}
