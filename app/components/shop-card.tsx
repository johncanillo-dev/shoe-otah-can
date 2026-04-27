"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { useShopBranding } from "@/lib/shop-context";
import { getCacheBustedUrl } from "@/lib/shop-helpers";
import { Card } from "@/app/components/ui/card";

const MapComponent = dynamic(() => import("./map-component"), {
  ssr: false,
  loading: () => (
    <div className="h-32 bg-[#f0f0f0] flex items-center justify-center text-sm text-[#666]">
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
  const [showMap, setShowMap] = useState(true);
  const [shopLocation, setShopLocation] = useState<ShopLocation>({
    latitude: 8.81975,
    longitude: 125.69423,
    name: "👟 Shoe Otah Boutique",
    address: "Purok 4, Poblacion, Sibagat, 8503 Agusan del Sur",
    zoom: 18,
    phone: "0950 703 1066",
  });

  const displayImage = shopImage || branding.banner_url || "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=500&h=300&fit=crop";

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
    window.addEventListener("storage", loadLocation);
    return () => window.removeEventListener("storage", loadLocation);
  }, []);

  return (
    <Card className="overflow-hidden">
      {/* Shop Image */}
      <div className="rounded-lg overflow-hidden shadow-sm mb-4 aspect-video w-full">
        <img
          key={displayImage}
          src={getCacheBustedUrl(displayImage)}
          alt={shopLocation.name}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Shop Info & Map Section */}
      <div className="flex flex-col gap-3">
        <div>
          <h3 className="m-0 mb-1 text-[var(--ink)] text-lg font-semibold">
            {shopLocation.name}
          </h3>
          <p className="m-0 text-[#666] text-sm">
            View shop location
          </p>
        </div>

        {/* Tracking Status Badge */}
        <div className="px-3 py-2 bg-[#e8f5e9] border-l-4 border-[#4caf50] rounded-r-md text-sm font-semibold text-[#2e7d32]">
          ✓ Live Tracking Active
        </div>

        {/* Compact Map Display */}
        {showMap && (
          <div className="rounded-lg overflow-hidden border border-[#d0c7bf] h-36">
            <MapComponent
              position={[shopLocation.latitude, shopLocation.longitude]}
              title={shopLocation.name}
              height="144px"
              zoom={shopLocation.zoom}
              showLiveTracking={true}
            />
          </div>
        )}

        {/* Location Details */}
        <div className="p-4 bg-white border border-[#e0d5cc] rounded-lg text-sm">
          <div className="mb-2 font-semibold text-[#2c2c2c]">
            📍 Location
          </div>
          
          <div className="flex flex-col gap-2 text-[#666]">
            <div>
              <strong className="text-[#2c2c2c]">📮</strong> {shopLocation.address}
            </div>
            <div>
              <strong className="text-[#2c2c2c]">📞</strong> 
              <a href={`tel:${shopLocation.phone}`} className="text-[#2196f3] no-underline ml-1 hover:underline">
                {shopLocation.phone}
              </a>
            </div>
            <div className="text-xs text-[#999]">
              🎯 {shopLocation.latitude.toFixed(4)}, {shopLocation.longitude.toFixed(4)}
            </div>
          </div>

          {/* Trust Badge */}
          <div className="mt-3 pt-3 border-t border-[#e0d5cc] text-xs text-[#1565c0]">
            ✓ Verified Location
          </div>
        </div>

        {/* Toggle Button */}
        <button
          onClick={() => setShowMap(!showMap)}
          className="px-3 py-2 bg-[#f5f5f5] text-[#2c2c2c] border border-[#d0c7bf] rounded cursor-pointer text-sm font-semibold hover:bg-[#e0e0e0] transition-colors duration-300"
        >
          {showMap ? "↕ Hide Map" : "↕ Show Map"}
        </button>
      </div>
    </Card>
  );
}

