"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { createSupabaseBrowserClient } from "./supabase/client";

export interface ShopBranding {
  id: string;
  logo_url: string | null;
  banner_url: string | null;
  shop_name: string;
  updated_at: string;
  location_latitude?: number;
  location_longitude?: number;
  location_address?: string;
  location_zoom?: number;
  location_image_url?: string | null;
}

const DEFAULT_BRANDING: ShopBranding = {
  id: "",
  logo_url: "/shoe-otah-logo.png",
  banner_url: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=500&h=300&fit=crop",
  shop_name: "Shoe Otah Boutique",
  updated_at: new Date().toISOString(),
  location_latitude: 8.6324,
  location_longitude: 126.3175,
  location_address: "P-4 Poblacion, Sibagat, Agusan del Sur",
  location_zoom: 15,
  location_image_url: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=500&h=300&fit=crop",
};

interface ShopContextType {
  branding: ShopBranding;
  isLoading: boolean;
  updateBranding: (
    updates: Partial<Omit<ShopBranding, "id" | "updated_at">>
  ) => Promise<{ success: boolean; persisted: boolean; message?: string }>;
  refreshBranding: () => Promise<void>;
}

const ShopContext = createContext<ShopContextType | undefined>(undefined);
const SHOP_BRANDING_STORAGE_KEY = "shop-branding";

function readLocalBranding(): ShopBranding | null {
  try {
    const raw = localStorage.getItem(SHOP_BRANDING_STORAGE_KEY);
    if (!raw) {
      return null;
    }

    return JSON.parse(raw) as ShopBranding;
  } catch {
    return null;
  }
}

function saveLocalBranding(branding: ShopBranding) {
  try {
    localStorage.setItem(SHOP_BRANDING_STORAGE_KEY, JSON.stringify(branding));
  } catch {
    // Ignore storage failures and keep the in-memory state updated.
  }
}

export function ShopProvider({ children }: { children: ReactNode }) {
  const [branding, setBranding] = useState<ShopBranding>(DEFAULT_BRANDING);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createSupabaseBrowserClient();

  // Fetch shop branding from Supabase
  const fetchBranding = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("shop_branding")
        .select("*")
        .order("updated_at", { ascending: false })
        .limit(1)
        .single();

      if (error) {
        // If table doesn't exist, use defaults (graceful fallback)
        if (error.code === "PGRST205" || error.code === "42P01") {
          console.warn("Shop branding table not found. Using default branding.", error.message);
          setBranding(DEFAULT_BRANDING);
          return;
        }
        
        // For other errors, log and use defaults
        console.error("Error fetching shop branding:", error);
        setBranding(DEFAULT_BRANDING);
        return;
      }

      if (data) {
        const nextBranding = data as ShopBranding;
        setBranding(nextBranding);
        saveLocalBranding(nextBranding);
      } else {
        const localBranding = readLocalBranding();
        setBranding(localBranding || DEFAULT_BRANDING);
      }
    } catch (err) {
      console.error("Failed to fetch shop branding:", err);
      const localBranding = readLocalBranding();
      setBranding(localBranding || DEFAULT_BRANDING);
    }
  }, [supabase]);

  // Initial load
  useEffect(() => {
    let mounted = true;

    const load = async () => {
      setIsLoading(true);
      await fetchBranding();
      if (mounted) setIsLoading(false);
    };

    load();

    return () => {
      mounted = false;
    };
  }, [fetchBranding]);

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel("shop-branding-sync")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "shop_branding",
        },
        (payload: any) => {
          console.log("Realtime shop branding update:", payload);
          const newData = payload.new as ShopBranding;
          if (newData) {
            setBranding(newData);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  // Update branding (upsert single row)
  const updateBranding = useCallback(
    async (
      updates: Partial<Omit<ShopBranding, "id" | "updated_at">>
    ): Promise<{ success: boolean; persisted: boolean; message?: string }> => {
      try {
        const response = await fetch("/api/admin/shop-branding", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify(updates),
        });

        const payload = await response.json().catch(() => null);
        const message =
          payload?.details ||
          payload?.error ||
          `HTTP ${response.status}${response.statusText ? ` ${response.statusText}` : ""}`;

        const nextBranding = {
          ...branding,
          ...updates,
          updated_at: new Date().toISOString(),
        } as ShopBranding;

        if (response.ok && payload?.success) {
          setBranding(nextBranding);
          saveLocalBranding(nextBranding);
          return { success: true, persisted: true, message: payload?.message };
        }

        if (payload?.code === "CONFIG" || payload?.fallback === true) {
          setBranding(nextBranding);
          saveLocalBranding(nextBranding);
          return { success: true, persisted: false, message };
        }

        throw new Error(message);
      } catch (err) {
        console.warn("Failed to update shop branding:", err instanceof Error ? err.message : err);
        return { success: false, persisted: false, message: err instanceof Error ? err.message : String(err) };
      }
    },
    [branding, supabase]
  );

  const refreshBranding = useCallback(async () => {
    setIsLoading(true);
    await fetchBranding();
    setIsLoading(false);
  }, [fetchBranding]);

  return (
    <ShopContext.Provider value={{ branding, isLoading, updateBranding, refreshBranding }}>
      {children}
    </ShopContext.Provider>
  );
}

export function useShopBranding(): ShopContextType {
  const context = useContext(ShopContext);
  if (context === undefined) {
    return {
      branding: DEFAULT_BRANDING,
      isLoading: false,
      updateBranding: async () => ({ success: false, persisted: false }),
      refreshBranding: async () => {},
    };
  }
  return context;
}

