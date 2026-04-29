"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { useShopBranding } from "@/lib/shop-context";

const MapComponent = dynamic(() => import("../components/map-component"), {
  ssr: false,
  loading: () => (
    <div style={{ height: "400px", backgroundColor: "#f0f0f0", display: "flex", alignItems: "center", justifyContent: "center" }}>
      Loading map...
    </div>
  ),
});

interface ShopLocation {
  latitude: number;
  longitude: number;
  name: string;
  address: string;
  zoom: number;
  image?: string | null;
}

interface SearchResult {
  lat: number;
  lon: number;
  display_name: string;
  address?: {
    road?: string;
    village?: string;
    county?: string;
    state?: string;
    postcode?: string;
  };
}

const IMAGE_ERROR_PLACEHOLDER =
  "data:image/svg+xml;charset=UTF-8," +
  encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="200" height="100" viewBox="0 0 200 100" role="img" aria-label="Image unavailable">
      <rect width="200" height="100" rx="10" fill="#f6f0ea" />
      <rect x="14" y="14" width="172" height="72" rx="8" fill="#ffffff" stroke="#d8c9bc" />
      <circle cx="58" cy="45" r="12" fill="#e2d4c6" />
      <path d="M38 72l26-26 16 16 14-12 28 22z" fill="#c9b39f" />
      <text x="100" y="86" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" fill="#8a6f5a">Image unavailable</text>
    </svg>
  `);

export default function ShopLocationSearchEditor() {
  const { branding, isLoading: brandingLoading, updateBranding, refreshBranding } = useShopBranding();

  const defaultLocation: ShopLocation = {
    latitude: 8.632396,
    longitude: 126.315832,
    name: "Shoe Otah Boutique",
    address: "Purok 4, Poblacion, Sibagat, 8503 Agusan del Sur, Philippines",
    zoom: 18,
  };

  const [shopLocation, setShopLocation] = useState<ShopLocation>(defaultLocation);
  const [editingLocation, setEditingLocation] = useState<ShopLocation>(defaultLocation);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSaved, setIsSaved] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedResult, setSelectedResult] = useState<SearchResult | null>(null);
  const [saveMessage, setSaveMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  const presetLocations: Record<string, ShopLocation> = {
    shoe_otah: {
      latitude: 8.632396,
      longitude: 126.315832,
      name: "Shoe Otah Boutique",
      address: "Purok 4, Poblacion, Sibagat, 8503 Agusan del Sur, Philippines",
      zoom: 18,
    },
    sibagat_center: {
      latitude: 8.6327,
      longitude: 126.3158,
      name: "Sibagat Town Center",
      address: "Población, Sibagat, Agusan del Sur, Philippines",
      zoom: 15,
    },
  };

  useEffect(() => {
    if (brandingLoading || !branding) return;

    const location: ShopLocation = {
      latitude: branding.location_latitude ?? defaultLocation.latitude,
      longitude: branding.location_longitude ?? defaultLocation.longitude,
      name: branding.shop_name || defaultLocation.name,
      address: branding.location_address || defaultLocation.address,
      zoom: branding.location_zoom ?? defaultLocation.zoom,
      image: branding.location_image_url || undefined,
    };

    setShopLocation(location);

    if (!isInitialized) {
      setEditingLocation(location);
      setIsInitialized(true);
    } else if (isSaved) {
      setEditingLocation(location);
    }
  }, [branding, brandingLoading, isInitialized, isSaved]);

  // Data loading is handled by ShopContext; no need for redundant API/localStorage fetch

  const handleQuickPreset = (presetKey: string) => {
    const preset = presetLocations[presetKey];
    if (preset) {
      setEditingLocation(preset);
      setSelectedResult(null);
      setSearchQuery("");
      setSearchResults([]);
      setIsSaved(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          searchQuery
        )}&limit=8`
      );
      
      if (!response.ok) {
        console.warn(`Nominatim search failed with status ${response.status}`);
        setSearchResults([]);
        return;
      }

      try {
        const results = await response.json();
        setSearchResults(Array.isArray(results) ? results : []);
      } catch (jsonErr) {
        console.warn("Failed to parse Nominatim response as JSON:", jsonErr);
        setSearchResults([]);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error("Search error:", errorMsg);
      setSearchResults([]);
    }
    setIsSearching(false);
  };

  const handleSelectResult = (result: SearchResult) => {
    setEditingLocation({
      ...editingLocation,
      latitude: parseFloat(result.lat.toString()),
      longitude: parseFloat(result.lon.toString()),
      address: result.display_name.substring(0, 100),
    });
    setSelectedResult(result);
    setSearchQuery("");
    setSearchResults([]);
    setIsSaved(false);
  };

  const handleSelectPreset = (preset: ShopLocation) => {
    setEditingLocation(preset);
    setSearchQuery("");
    setSearchResults([]);
    setSelectedResult(null);
    setIsSaved(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveMessage(null);

    try {
      const result = await updateBranding({
        shop_name: editingLocation.name,
        location_address: editingLocation.address,
        location_latitude: editingLocation.latitude,
        location_longitude: editingLocation.longitude,
        location_zoom: editingLocation.zoom,
        location_image_url: editingLocation.image || null,
      });

      if (!result.success) {
        setSaveMessage({ type: "error", text: result.message || "Failed to update location." });
        return;
      }

      localStorage.setItem("shop-location", JSON.stringify(editingLocation));
      setShopLocation(editingLocation);
      setIsSaved(true);
      console.log("Location saved successfully");
      setSaveMessage({
        type: "success",
        text: result.persisted
          ? "✅ Location and image updated successfully! Customers will see the changes in real-time."
          : "✅ Location saved locally in this browser. Add SUPABASE_SERVICE_ROLE_KEY to sync changes to Supabase.",
      });
      setTimeout(() => setSaveMessage(null), 4000);

      if (result.persisted) {
        await refreshBranding();
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error("Unexpected error saving location:", {
        message: errorMsg,
        name: error instanceof Error ? error.name : "Unknown",
        stack: error instanceof Error ? error.stack : undefined,
      });
      setSaveMessage({ type: "error", text: `Error saving location: ${errorMsg}` });
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setEditingLocation(shopLocation);
    setIsSaved(true);
  };

  const handleInputChange = (field: keyof ShopLocation, value: string | number) => {
    setEditingLocation({
      ...editingLocation,
      [field]: field === "zoom" ? parseInt(value as string) : value,
    });
    setIsSaved(false);
  };

  return (
    <div style={{ marginTop: "2rem" }}>
      <div style={{ marginBottom: "2rem" }}>
        <h2 style={{ marginTop: 0, marginBottom: "0.5rem", color: "#2c2c2c" }}>
          📍 Shop Location Settings (Google Maps Style)
        </h2>
        <p style={{ margin: 0, color: "#666", fontSize: "0.95rem" }}>
          Search and set your shop location with live map preview
          {brandingLoading && <span style={{ marginLeft: "0.5rem", color: "#2196f3" }}>⏳ Loading...</span>}
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "2rem",
          backgroundColor: "#fafafa",
          padding: "2rem",
          borderRadius: "10px",
          border: "1px solid #e0d5cc",
        }}
      >
        {/* Left: Search and Controls */}
        <div>
          {/* Search Bar */}
          <form onSubmit={handleSearch} style={{ marginBottom: "1.5rem" }}>
            <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for places (e.g., 'Shoe Otah Boutique Sibagat')"
                style={{
                  flex: 1,
                  padding: "0.75rem 1rem",
                  border: "1px solid #d0c7bf",
                  borderRadius: "6px",
                  fontSize: "0.95rem",
                  boxSizing: "border-box",
                }}
              />
              <button
                type="submit"
                disabled={isSearching || !searchQuery.trim()}
                style={{
                  padding: "0.75rem 1.5rem",
                  backgroundColor: isSearching || !searchQuery.trim() ? "#ccc" : "#2196f3",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  cursor: isSearching || !searchQuery.trim() ? "not-allowed" : "pointer",
                  fontSize: "0.9rem",
                  fontWeight: "600",
                  transition: "all 0.3s ease",
                }}
                onMouseEnter={(e) => {
                  if (!isSearching && searchQuery.trim()) {
                    e.currentTarget.style.backgroundColor = "#1976d2";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSearching && searchQuery.trim()) {
                    e.currentTarget.style.backgroundColor = "#2196f3";
                  }
                }}
              >
                {isSearching ? "Searching..." : "🔍 Search"}
              </button>
            </div>

            {/* Quick Select Presets */}
            <div style={{ marginBottom: "1rem" }}>
              <p style={{ margin: "0 0 0.5rem 0", fontSize: "0.85rem", color: "#666", fontWeight: "600" }}>
                ⚡ Quick Select Your Shop:
              </p>
              <button
                onClick={() =>
                  handleSelectPreset({
                    latitude: 8.632396,
                    longitude: 126.315832,
                    name: "👟 Shoe Otah Boutique",
                    address: "Purok 4, Poblacion, Sibagat, 8503 Agusan del Sur",
                    zoom: 18,
                  })
                }
                style={{
                  width: "100%",
                  padding: "0.75rem 1rem",
                  backgroundColor: "#4caf50",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "0.95rem",
                  fontWeight: "600",
                  transition: "all 0.3s ease",
                  marginBottom: "0.5rem",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#45a049";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "#4caf50";
                }}
              >
                ✓ Use Shoe Otah Boutique Location
              </button>
            </div>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div
                style={{
                  maxHeight: "250px",
                  overflowY: "auto",
                  border: "1px solid #d0c7bf",
                  borderRadius: "6px",
                  backgroundColor: "white",
                }}
              >
                {searchResults.map((result, idx) => {
                  const isSelected = selectedResult?.lat === result.lat && selectedResult?.lon === result.lon;
                  return (
                    <button
                      key={idx}
                      onClick={() => handleSelectResult(result)}
                      style={{
                        width: "100%",
                        textAlign: "left",
                        padding: "0.75rem 1rem",
                        border: "none",
                        borderBottom: idx < searchResults.length - 1 ? "1px solid #e0d5cc" : "none",
                        backgroundColor: isSelected ? "#e3f2fd" : "white",
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = "#f5f5f5";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = isSelected ? "#e3f2fd" : "white";
                      }}
                    >
                      <div style={{ fontWeight: "600", fontSize: "0.9rem", color: "#2c2c2c" }}>
                        📍 {result.display_name.split(",")[0]}
                      </div>
                      <div style={{ fontSize: "0.8rem", color: "#666", marginTop: "0.25rem" }}>
                        {result.display_name.substring(0, 80)}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </form>

          {/* Manual Input Fields */}
          <div style={{ marginBottom: "1rem" }}>
            <label
              style={{
                display: "block",
                marginBottom: "0.4rem",
                fontWeight: "600",
                color: "#2c2c2c",
                fontSize: "0.9rem",
              }}
            >
              Shop Image URL
            </label>
            <input
              type="text"
              value={editingLocation.image || ""}
              onChange={(e) => handleInputChange("image", e.target.value)}
              style={{
                width: "100%",
                padding: "0.5rem",
                border: "1px solid #d0c7bf",
                borderRadius: "5px",
                fontSize: "0.9rem",
                boxSizing: "border-box",
              }}
              placeholder="Enter image URL (e.g., https://...)"
            />
            <p style={{ margin: "0.35rem 0 0", fontSize: "0.75rem", color: "#999" }}>
              💡 Paste a direct image URL from your image hosting service
            </p>

            {/* Image Preview */}
            {editingLocation.image && (
              <div
                style={{
                  marginTop: "0.5rem",
                  borderRadius: "5px",
                  overflow: "hidden",
                  border: "1px solid #d0c7bf",
                  width: "100%",
                  height: "100px",
                }}
              >
                <img
                  src={editingLocation.image}
                  alt="Shop Preview"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                  onError={(e) => {
                    const imageElement = e.currentTarget;
                    if (imageElement.src !== IMAGE_ERROR_PLACEHOLDER) {
                      imageElement.src = IMAGE_ERROR_PLACEHOLDER;
                    }
                  }}
                />
              </div>
            )}
          </div>

          <div style={{ marginBottom: "1.5rem" }}>
            <label
              style={{
                display: "block",
                marginBottom: "0.5rem",
                fontWeight: "600",
                color: "#2c2c2c",
                fontSize: "0.95rem",
              }}
            >
              Shop Name
            </label>
            <input
              type="text"
              value={editingLocation.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              style={{
                width: "100%",
                padding: "0.75rem",
                border: "1px solid #d0c7bf",
                borderRadius: "6px",
                fontSize: "0.95rem",
                boxSizing: "border-box",
              }}
              placeholder="Enter shop name"
            />
          </div>

          <div style={{ marginBottom: "1.5rem" }}>
            <label
              style={{
                display: "block",
                marginBottom: "0.5rem",
                fontWeight: "600",
                color: "#2c2c2c",
                fontSize: "0.95rem",
              }}
            >
              Shop Address
            </label>
            <input
              type="text"
              value={editingLocation.address}
              onChange={(e) => handleInputChange("address", e.target.value)}
              style={{
                width: "100%",
                padding: "0.75rem",
                border: "1px solid #d0c7bf",
                borderRadius: "6px",
                fontSize: "0.95rem",
                boxSizing: "border-box",
              }}
              placeholder="Enter shop address"
            />
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "1rem",
              marginBottom: "1.5rem",
            }}
          >
            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: "0.5rem",
                  fontWeight: "600",
                  color: "#2c2c2c",
                  fontSize: "0.95rem",
                }}
              >
                Latitude
              </label>
              <input
                type="number"
                step="0.0001"
                value={editingLocation.latitude}
                onChange={(e) => handleInputChange("latitude", parseFloat(e.target.value))}
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  border: "1px solid #d0c7bf",
                  borderRadius: "6px",
                  fontSize: "0.95rem",
                  boxSizing: "border-box",
                }}
                placeholder="Latitude"
              />
            </div>
            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: "0.5rem",
                  fontWeight: "600",
                  color: "#2c2c2c",
                  fontSize: "0.95rem",
                }}
              >
                Longitude
              </label>
              <input
                type="number"
                step="0.0001"
                value={editingLocation.longitude}
                onChange={(e) => handleInputChange("longitude", parseFloat(e.target.value))}
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  border: "1px solid #d0c7bf",
                  borderRadius: "6px",
                  fontSize: "0.95rem",
                  boxSizing: "border-box",
                }}
                placeholder="Longitude"
              />
            </div>
          </div>

          <div style={{ marginBottom: "1.5rem" }}>
            <label
              style={{
                display: "block",
                marginBottom: "0.5rem",
                fontWeight: "600",
                color: "#2c2c2c",
                fontSize: "0.95rem",
              }}
            >
              Map Zoom Level
            </label>
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <input
                type="range"
                min="1"
                max="20"
                value={editingLocation.zoom}
                onChange={(e) => handleInputChange("zoom", parseInt(e.target.value))}
                style={{ flex: 1 }}
              />
              <span
                style={{
                  padding: "0.5rem 0.75rem",
                  backgroundColor: "#fff",
                  border: "1px solid #d0c7bf",
                  borderRadius: "4px",
                  fontSize: "0.9rem",
                  fontWeight: "600",
                  minWidth: "40px",
                  textAlign: "center",
                }}
              >
                {editingLocation.zoom}
              </span>
            </div>
          </div>

          {/* Current Location Display */}
          <div
            style={{
              padding: "1rem",
              backgroundColor: "#e3f2fd",
              borderLeft: "4px solid #2196f3",
              borderRadius: "6px",
              marginBottom: "1.5rem",
            }}
          >
            <strong style={{ display: "block", marginBottom: "0.5rem", color: "#1565c0" }}>
              📌 Current Saved Location
            </strong>
            <div style={{ fontSize: "0.85rem", color: "#1565c0", lineHeight: 1.6 }}>
              <div>📍 {shopLocation.name}</div>
              <div>📮 {shopLocation.address}</div>
              <div>Lat: {shopLocation.latitude.toFixed(6)} | Lon: {shopLocation.longitude.toFixed(6)}</div>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: "flex", gap: "1rem" }}>
            <button
              onClick={handleSave}
              disabled={isSaved || isSaving}
              style={{
                flex: 1,
                padding: "0.75rem 1.5rem",
                backgroundColor: isSaved || isSaving ? "#ccc" : "#4caf50",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: isSaved || isSaving ? "not-allowed" : "pointer",
                fontSize: "0.95rem",
                fontWeight: "600",
                transition: "all 0.3s ease",
              }}
              onMouseEnter={(e) => {
                if (!isSaved && !isSaving) {
                  e.currentTarget.style.backgroundColor = "#45a049";
                }
              }}
              onMouseLeave={(e) => {
                if (!isSaved && !isSaving) {
                  e.currentTarget.style.backgroundColor = "#4caf50";
                }
              }}
            >
              {isSaving ? "⏳ Saving..." : "✓ Save Location"}
            </button>
            <button
              onClick={handleReset}
              disabled={isSaved || isSaving}
              style={{
                flex: 1,
                padding: "0.75rem 1.5rem",
                backgroundColor: "transparent",
                color: isSaved || isSaving ? "#ccc" : "#d32f2f",
                border: `1px solid ${isSaved || isSaving ? "#ccc" : "#d32f2f"}`,
                borderRadius: "6px",
                cursor: isSaved || isSaving ? "not-allowed" : "pointer",
                fontSize: "0.95rem",
                fontWeight: "600",
                transition: "all 0.3s ease",
              }}
              onMouseEnter={(e) => {
                if (!isSaved && !isSaving) {
                  e.currentTarget.style.backgroundColor = "#ffebee";
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
              }}
            >
              ↺ Reset
            </button>
          </div>

          {saveMessage && (
            <div
              style={{
                marginTop: "1rem",
                padding: "0.75rem 1rem",
                backgroundColor: saveMessage.type === "success" ? "#d4edda" : "#f8d7da",
                border: `1px solid ${saveMessage.type === "success" ? "#4caf50" : "#ff9800"}`,
                borderRadius: "6px",
                color: saveMessage.type === "success" ? "#155724" : "#e65100",
                fontSize: "0.9rem",
              }}
            >
              {saveMessage.text}
            </div>
          )}

          {!isSaved && (
            <div
              style={{
                marginTop: "1rem",
                padding: "0.75rem 1rem",
                backgroundColor: "#fff3e0",
                border: "1px solid #ff9800",
                borderRadius: "6px",
                color: "#e65100",
                fontSize: "0.9rem",
              }}
            >
              ⚠️ You have unsaved changes. Click Save Location to update your shop location.
            </div>
          )}
        </div>

        {/* Right: Live Map Preview */}
        <div>
          <h3
            style={{
              marginTop: 0,
              marginBottom: "1rem",
              color: "#2c2c2c",
              fontSize: "1.1rem",
            }}
          >
            🗺️ Live Map Preview
          </h3>
          <div
            style={{
              borderRadius: "10px",
              overflow: "hidden",
              border: "1px solid #d0c7bf",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            }}
          >
            <MapComponent
              position={[editingLocation.latitude, editingLocation.longitude]}
              title={editingLocation.name}
              zoom={editingLocation.zoom}
              height="500px"
            />
          </div>
          <p
            style={{
              marginTop: "0.75rem",
              fontSize: "0.8rem",
              color: "#666",
              textAlign: "center",
            }}
          >
            📍 Drag the map to adjust the pin position if needed
          </p>
        </div>
      </div>
    </div>
  );
}

