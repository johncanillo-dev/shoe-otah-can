"use client";

import { useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useGeolocation } from "../hooks/useGeolocation";

// Fix Leaflet marker icon issues in Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "/leaflet/marker-icon-2x.png",
  iconUrl: "/leaflet/marker-icon.png",
  shadowUrl: "/leaflet/marker-shadow.png",
});

// Blue dot icon for current location
const currentLocationIcon = new L.Icon({
  iconUrl: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0Ij48Y2lyY2xlIGN4PSIxMiIgY3k9IjEyIiByPSI4IiBmaWxsPSIjMDA4MkI4Ii8+PC9zdmc+",
  iconSize: [24, 24],
  iconAnchor: [12, 12],
  popupAnchor: [0, -12],
});

interface MapComponentProps {
  position?: [number, number];
  title?: string;
  height?: string;
  zoom?: number;
  showLiveTracking?: boolean;
}

export default function MapClient({ 
  position,
  title = "Location", 
  height = "500px",
  zoom = 13,
  showLiveTracking = false
}: MapComponentProps) {
  const { position: livePosition, isLoading, error } = useGeolocation();
  const [trackingEnabled, setTrackingEnabled] = useState(showLiveTracking);
  
  // Use live position if tracking is enabled, otherwise use provided position
  const displayPosition = trackingEnabled && livePosition 
    ? ([livePosition.latitude, livePosition.longitude] as [number, number])
    : position || [0, 0] as [number, number];

  return (
    <div style={{ borderRadius: "8px", overflow: "hidden", border: "1px solid #ddd" }}>
      <div style={{ 
        padding: "10px", 
        backgroundColor: "#f5f5f5", 
        display: "flex", 
        justifyContent: "space-between",
        alignItems: "center"
      }}>
        <div>
          {isLoading && trackingEnabled && <span style={{ fontSize: "12px", color: "#666" }}>📍 Getting location...</span>}
          {error && trackingEnabled && <span style={{ fontSize: "12px", color: "#d32f2f" }}>⚠️ {error}</span>}
          {livePosition && trackingEnabled && <span style={{ fontSize: "12px", color: "#388e3c" }}>✓ Live tracking active</span>}
        </div>
        <button
          onClick={() => setTrackingEnabled(!trackingEnabled)}
          style={{
            padding: "6px 12px",
            backgroundColor: trackingEnabled ? "#388e3c" : "#757575",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            fontSize: "12px",
            fontWeight: "600",
          }}
        >
          {trackingEnabled ? "Stop Tracking" : "Start Tracking"}
        </button>
      </div>
      
      <MapContainer 
        center={displayPosition as any} 
        zoom={zoom} 
        style={{ height: height, width: "100%" }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* Static location marker */}
        {position && (
          <Marker position={position as any}>
            <Popup>
              <span style={{ fontWeight: 600 }}>{title}</span>
            </Popup>
          </Marker>
        )}
        
        {/* Live location marker */}
        {trackingEnabled && livePosition && (
          <>
            <Marker 
              position={[livePosition.latitude, livePosition.longitude] as any}
              icon={currentLocationIcon}
            >
              <Popup>
                <div style={{ fontWeight: 600 }}>
                  <div>📍 Your Location</div>
                  <div style={{ fontSize: "12px", marginTop: "4px" }}>
                    {livePosition.latitude.toFixed(6)}, {livePosition.longitude.toFixed(6)}
                  </div>
                  <div style={{ fontSize: "11px", color: "#666", marginTop: "4px" }}>
                    Accuracy: ±{Math.round(livePosition.accuracy)}m
                  </div>
                </div>
              </Popup>
            </Marker>
            
            {/* Accuracy circle */}
            <Circle 
              center={[livePosition.latitude, livePosition.longitude] as any}
              radius={livePosition.accuracy}
              pathOptions={{ color: "blue", fillColor: "blue", fillOpacity: 0.1 }}
            />
          </>
        )}
      </MapContainer>
    </div>
  );
}
