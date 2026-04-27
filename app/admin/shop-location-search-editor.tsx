"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";

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
  image?: string;
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

// Helper to safely parse API responses
async function parseApiResponse(response: Response): Promise<{ error?: string; message?: string; [key: string]: any }> {
  const contentType = response.headers.get("content-type");

  // Try to parse as JSON if content-type indicates JSON
  if (contentType?.includes("application/json")) {
    try {
      const json = await response.json();
      return json;
    } catch (jsonErr) {
      // JSON parsing failed - fall back to text
      console.warn("Failed to parse JSON response:", jsonErr);
      try {
        const text = await response.text();
        return {
          error: "Invalid server response",
          details: text || "(empty response body)",
        };
      } catch (textErr) {
        return {
          error: "Failed to read response",
          details: "Unable to parse server response as JSON or text",
        };
      }
    }
  }

  // Not JSON - try to get text
  try {
    const text = await response.text();
    if (!text) {
      return {
        error: "Empty response from server",
        details: `HTTP ${response.status}`,
      };
    }
    return {
      error: "Unexpected response format",
      details: text,
    };
  } catch (textErr) {
    return {
      error: "Failed to read response",
      details: `HTTP ${response.status}`,
    };
  }
}

// Helper to extract readable error message
function getErrorMessage(errorData: any): string {
  if (!errorData) {
    return "Unknown error";
  }

  // Try multiple error fields in order of preference
  if (typeof errorData.error === "string" && errorData.error.trim()) {
    return errorData.error;
  }
  if (typeof errorData.message === "string" && errorData.message.trim()) {
    return errorData.message;
  }
  if (typeof errorData.details === "string" && errorData.details.trim()) {
    return errorData.details;
  }

  // Last resort: try to convert to string (avoid logging empty {})
  const str = String(errorData);
  if (str && str !== "[object Object]") {
    return str;
  }

  return "Unknown error";
}

export default function ShopLocationSearchEditor() {
  const [shopLocation, setShopLocation] = useState<ShopLocation>({
    latitude: 8.81975,
    longitude: 125.69423,
    name: "👟 Shoe Otah Boutique",
    address: "Purok 4, Poblacion, Sibagat, 8503 Agusan del Sur",
    zoom: 18,
  });

  const [editingLocation, setEditingLocation] = useState<ShopLocation>(shopLocation);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSaved, setIsSaved] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showMap, setShowMap] = useState(true);
  const [selectedResult, setSelectedResult] = useState<SearchResult | null>(null);
  const [saveMessage, setSaveMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Preset locations including Shoe Otah Boutique
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

  // Load location from Supabase on mount, fallback to localStorage
  useEffect(() => {
    const loadLocation = async () => {
      try {
        // Try to load from API first (server-side)
        const response = await fetch("/api/admin/shop-branding");
        if (response.ok) {
          const result = await parseApiResponse(response);
          if (result.data && result.data.location_latitude) {
            const location: ShopLocation = {
              latitude: result.data.location_latitude || 8.81975,
              longitude: result.data.location_longitude || 125.69423,
              name: result.data.shop_name || "👟 Shoe Otah Boutique",
              address: result.data.location_address || "Purok 4, Poblacion, Sibagat, 8503 Agusan del Sur",
              zoom: result.data.location_zoom || 18,
              image: result.data.location_image_url || undefined,
            };
            setShopLocation(location);
            setEditingLocation(location);
            return;
          }
        }
      } catch (err) {
        console.warn("Could not load from API, using localStorage:", err instanceof Error ? err.message : String(err));
      }

      // Fallback to localStorage
      const saved = localStorage.getItem("shop-location");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setShopLocation(parsed);
          setEditingLocation(parsed);
        } catch (e) {
          console.error("Failed to load shop location from localStorage:", e instanceof Error ? e.message : String(e));
        }
      }
    };

    loadLocation();
  }, []);

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
      // Use Nominatim (OpenStreetMap) for geocoding - No API key required
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
      // Call server-side API to save to Supabase (bypasses RLS issues)
      const response = await fetch("/api/admin/shop-branding", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: 1, // Required: shop_branding table has a single row with id=1
          shop_name: editingLocation.name,
          location_address: editingLocation.address,
        }),
      });

      if (!response.ok) {
        // Safely parse response (handles JSON, text, empty responses)
        const errorData = await parseApiResponse(response);
        const errorMessage = getErrorMessage(errorData);

        // Log with full context for debugging
        console.error("API error response:", {
          status: response.statusText,
          statusCode: response.status,
          error: errorMessage,
          fullResponse: errorData,
        });

        setSaveMessage({ type: "error", text: `Failed to update location: ${errorMessage}` });
        return;
      }

      // Parse success response
      const result = await parseApiResponse(response);

      if (!result.success) {
        const errorMessage = getErrorMessage(result);
        console.error("Save error:", {
          error: errorMessage,
          fullResponse: result,
        });
        setSaveMessage({ type: "error", text: `Failed to update location: ${errorMessage}` });
        return;
      }

      // Also save to localStorage as backup
      localStorage.setItem("shop-location", JSON.stringify(editingLocation));
      setShopLocation(editingLocation);
      setIsSaved(true);
      console.log("Location saved successfully");
      setSaveMessage({ type: "success", text: "✅ Location updated successfully! Customers will see the changes in real-time." });
      setTimeout(() => setSaveMessage(null), 4000);
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
                    latitude: 8.81975,
                    longitude: 125.69423,
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
                {searchResults.map((result, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSelectResult(result)}
                    style={{
                      width: "100%",
                      textAlign: "left",
                      padding: "0.75rem 1rem",
                      border: "none",
                      borderBottom: idx < searchResults.length - 1 ? "1px solid #e0d5cc" : "none",
                      backgroundColor: selectedResult === result ? "#e3f2fd" : "white",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "#f5f5f5";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor =
                        selectedResult === result ? "#e3f2fd" : "white";
                    }}
                  >
                    <div style={{ fontWeight: "600", fontSize: "0.9rem", color: "#2c2c2c" }}>
                      📍 {result.display_name.split(",")[0]}
                    </div>
                    <div style={{ fontSize: "0.8rem", color: "#666", marginTop: "0.25rem" }}>
                      {result.display_name.substring(0, 80)}
                    </div>
                  </button>
                ))}
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

            {/* Image Preview - Ultra Compact */}
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
                    (e.target as HTMLImageElement).src =
                      "https://via.placeholder.com/200x100?text=Image+Error";
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
              ⚠️ You have unsaved changes
            </div>
          )}
        </div>

        {/* Right: Map Preview */}
        {/* Right: Map Preview and Image */}
        <div>
          {/* Image Preview - Compact */}
          <h3 style={{ margin: "0 0 0.5rem 0", color: "#2c2c2c", fontSize: "0.9rem" }}>
            🖼️ Image Preview
          </h3>
          <div
            style={{
              borderRadius: "6px",
              overflow: "hidden",
              border: "1px solid #d0c7bf",
              height: "110px",
              marginBottom: "0.75rem",
              backgroundColor: "#f5f5f5",
            }}
          >
            {editingLocation.image ? (
              <img
                src={editingLocation.image}
                alt={editingLocation.name}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />
            ) : (
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#999",
                  fontSize: "0.85rem",
                }}
              >
                No image
              </div>
            )}
          </div>

          <h3 style={{ margin: "0.75rem 0 0.5rem 0", color: "#2c2c2c", fontSize: "0.9rem" }}>
            🗺️ Map Preview
          </h3>
          <div
            style={{
              borderRadius: "6px",
              overflow: "hidden",
              border: "1px solid #d0c7bf",
              height: "200px",
            }}
          >
            <MapComponent
              position={[editingLocation.latitude, editingLocation.longitude]}
              title={editingLocation.name}
              height="200px"
              zoom={editingLocation.zoom}
              showLiveTracking={false}
            />
          </div>
          <p style={{ marginTop: "0.75rem", fontSize: "0.8rem", color: "#666", lineHeight: 1.3 }}>
            <strong>{editingLocation.name}</strong>
            <br />
            {editingLocation.address}
            <br />
            🎯 {editingLocation.latitude.toFixed(5)}, {editingLocation.longitude.toFixed(5)}
          </p>
        </div>
      </div>

      {/* Instructions */}
      <div
        style={{
          marginTop: "2rem",
          padding: "1.5rem",
          backgroundColor: "#e8f5e9",
          borderRadius: "8px",
          border: "1px solid #4caf50",
        }}
      >
        <h4 style={{ margin: "0 0 1rem 0", color: "#2e7d32", fontSize: "0.95rem" }}>
          🔍 How to Use Google Maps Style Search:
        </h4>
        <ol style={{ margin: 0, paddingLeft: "1.5rem", color: "#2e7d32", fontSize: "0.9rem", lineHeight: 2 }}>
          <li><strong>Type in the search box:</strong> "Shoe Otah Boutique Sibagat" or any place name</li>
          <li><strong>Press "Search" or Enter</strong> to find matching locations</li>
          <li><strong>Click any result</strong> to select it and see the location on the map</li>
          <li><strong>Fine-tune manually:</strong> Edit name, address, latitude, longitude as needed</li>
          <li><strong>Adjust zoom level</strong> (17-18 recommended for street-level precision)</li>
          <li><strong>Click "Save Location"</strong> to apply changes</li>
        </ol>
        <p style={{ margin: "1rem 0 0", color: "#2e7d32", fontSize: "0.85rem" }}>
          💡 <strong>Tip:</strong> The search uses OpenStreetMap (same data as Google Maps). Search results are powered by Nominatim geocoding service for accurate location finding.
        </p>
      </div>
    </div>
  );
}
