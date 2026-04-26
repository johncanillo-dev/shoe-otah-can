"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { useShopBranding } from "@/lib/shop-context";
import { getCacheBustedUrl } from "@/lib/shop-helpers";

const MapComponent = dynamic(() => import("./map-component"), {
  ssr: false,
  loading: () => (
    <div style={{ height: "180px", backgroundColor: "#f0f0f0", display: "flex", alignItems: "center", justifyContent: "center" }}>
      Loading map...
    </div>
  ),
});

interface ShopCardProps {
  shopName?: string;
  shopImage?: string;
  latitude?: number;
  longitude?: number;
  zoom?: number;
}

// This component displays the shop location (admin-configured)
// Customers can only VIEW and TRACK - they cannot edit the location
// Location is managed exclusively by admins in the admin dashboard settings

interface ShopLocation {
  latitude: number;
  longitude: number;
  name: string;
  address: string;
  zoom: number;
  phone?: string;
}

export default function ShopCard({
  shopName = "Our Store",
  shopImage,
  latitude = 8.81975,
  longitude = 125.69423,
  zoom = 18,
}: ShopCardProps) {
  const { branding } = useShopBranding();
  const [isTrackingEnabled, setIsTrackingEnabled] = useState(true); // Default to true (show by default)
  const [showMap, setShowMap] = useState(true); // Default to true (show map by default)
  const [shopLocation, setShopLocation] = useState<ShopLocation>({
    latitude: 8.81975,
    longitude: 125.69423,
    name: "👟 Shoe Otah Boutique",
    address: "Purok 4, Poblacion, Sibagat, 8503 Agusan del Sur",
    zoom: 18,
    phone: "0950 703 1066",
  });

  // Use dynamic banner from shop branding if no explicit shopImage prop
  const displayImage = shopImage || branding.banner_url || "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=500&h=300&fit=crop";

  // Load shop location from localStorage on mount
  useEffect(() => {
    const loadLocation = () => {
      const saved = localStorage.getItem("shop-location");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setShopLocation({
            latitude: parsed.latitude || 8.81975,
            longitude: parsed.longitude || 125.69423,
            name: parsed.name || "👟 Shoe Otah Boutique",
            address: parsed.address || "Purok 4, Poblacion, Sibagat, 8503 Agusan del Sur",
            zoom: parsed.zoom || 18,
            phone: "0950 703 1066",
          });
        } catch (e) {
          console.error("Failed to load shop location:", e);
        }
      }
    };

    loadLocation();
    
    // Listen for storage changes
    window.addEventListener("storage", loadLocation);
    return () => window.removeEventListener("storage", loadLocation);
  }, []);

  const handleImageClick = () => {
    setShowMap(true);
    setIsTrackingEnabled(true);
  };

  return (
    <div
      style={{
        display: "block",
        padding: "1rem",
        backgroundColor: "#fafafa",
        borderRadius: "10px",
        border: "1px solid #e0d5cc",
        marginTop: "1rem",
        marginBottom: "1rem",
      }}
    >
      {/* Shop Image - Ultra compact */}
      <div
        style={{
          borderRadius: "6px",
          overflow: "hidden",
          boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
          marginBottom: "0.5rem",
          aspectRatio: "16/9",
          width: "100%",
          height: "auto",
          minHeight: "100px",
        }}
      >
        <img
          key={displayImage}
          src={getCacheBustedUrl(displayImage)}
          alt={shopLocation.name}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />
      </div>

      {/* Shop Info & Map Section */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        <div>
          <h3 style={{ margin: 0, marginBottom: "0.15rem", color: "#2c2c2c", fontSize: "0.95rem" }}>
            {shopLocation.name}
          </h3>
          <p style={{ margin: 0, color: "#666", fontSize: "0.75rem", lineHeight: 1.2 }}>
            View shop location
          </p>
        </div>

        {/* Tracking Status Badge - Compact */}
        <div
          style={{
            padding: "0.35rem 0.5rem",
            backgroundColor: "#e8f5e9",
            borderLeft: `3px solid #4caf50`,
            borderRadius: "4px",
            fontSize: "0.75rem",
            fontWeight: "600",
            color: "#2e7d32",
          }}
        >
          ✓ Live Tracking Active
        </div>

        {/* Compact Map Display */}
        <div
          style={{
            borderRadius: "6px",
            overflow: "hidden",
            border: "1px solid #d0c7bf",
            height: "130px",
          }}
        >
          <MapComponent
            position={[shopLocation.latitude, shopLocation.longitude]}
            title={shopLocation.name}
            height="130px"
            zoom={shopLocation.zoom}
            showLiveTracking={true}
          />
        </div>

        {/* Ultra-Compact Location Details */}
        <div
          style={{
            padding: "0.5rem",
            backgroundColor: "#fff",
            border: "1px solid #e0d5cc",
            borderRadius: "5px",
            fontSize: "0.75rem",
          }}
        >
          <div style={{ marginBottom: "0.35rem", fontWeight: "600", color: "#2c2c2c" }}>
            📍 Location
          </div>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem", color: "#666" }}>
            <div>
              <strong style={{ color: "#2c2c2c" }}>📮</strong> {shopLocation.address.substring(0, 35)}...
            </div>
            <div>
              <strong style={{ color: "#2c2c2c" }}>📞</strong> 
              <a href={`tel:${shopLocation.phone}`} style={{ color: "#2196f3", textDecoration: "none", marginLeft: "0.2rem" }}>
                {shopLocation.phone}
              </a>
            </div>
            <div style={{ fontSize: "0.7rem", color: "#999" }}>
              🎯 {shopLocation.latitude.toFixed(4)}, {shopLocation.longitude.toFixed(4)}
            </div>
          </div>

          {/* Trust Badge - Minimal */}
          <div
            style={{
              marginTop: "0.35rem",
              paddingTop: "0.35rem",
              borderTop: "1px solid #e0d5cc",
              fontSize: "0.7rem",
              color: "#1565c0",
            }}
          >
            ✓ Verified Location
          </div>
        </div>

        {/* Toggle Button - Minimal */}
        <button
          onClick={() => setShowMap(!showMap)}
          style={{
            padding: "0.3rem 0.5rem",
            backgroundColor: "#f5f5f5",
            color: "#2c2c2c",
            border: "1px solid #d0c7bf",
            borderRadius: "4px",
            cursor: "pointer",
            fontSize: "0.75rem",
            fontWeight: "600",
            transition: "all 0.3s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "#e0e0e0";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "#f5f5f5";
          }}
        >
          {showMap ? "↕ Collapse" : "↕ Expand"}
        </button>
      </div>
    </div>
  );
}
