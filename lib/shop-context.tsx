"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { createSupabaseBrowserClient } from "./supabase/client";

export interface ShopBranding {
  id: string;
  logo_url: string | null;
  banner_url: string | null;
  shop_name: string;
  updated_at: string;
}

const DEFAULT_BRANDING: ShopBranding = {
  id: "",
  logo_url: "/shoe-otah-logo.png",
  banner_url: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=500&h=300&fit=crop",
  shop_name: "Shoe Otah Boutique",
  updated_at: new Date().toISOString(),
};

interface ShopContextType {
  branding: ShopBranding;
  isLoading: boolean;
  updateBranding: (updates: Partial<Omit<ShopBranding, "id" | "updated_at">>) => Promise<void>;
  refreshBranding: () => Promise<void>;
}

const ShopContext = createContext<ShopContextType | undefined>(undefined);

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
        console.error("Error fetching shop branding:", error);
        return;
      }

      if (data) {
        setBranding(data as ShopBranding);
      }
    } catch (err) {
      console.error("Failed to fetch shop branding:", err);
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
    async (updates: Partial<Omit<ShopBranding, "id" | "updated_at">>) => {
      try {
        // Get existing row or create new
        const { data: existing } = await supabase
          .from("shop_branding")
          .select("id")
          .limit(1)
          .single();

        const row = {
          ...updates,
          updated_at: new Date().toISOString(),
        };

        if (existing?.id) {
          const { error } = await supabase
            .from("shop_branding")
            .update(row)
            .eq("id", existing.id);

          if (error) {
            console.error("Error updating shop branding:", error);
            throw error;
          }
        } else {
          const { error } = await supabase
            .from("shop_branding")
            .insert({ ...row, id: undefined });

          if (error) {
            console.error("Error inserting shop branding:", error);
            throw error;
          }
        }

        // Optimistic update
        setBranding((prev) => ({ ...prev, ...updates }));
      } catch (err) {
        console.error("Failed to update shop branding:", err);
        throw err;
      }
    },
    [supabase]
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
      updateBranding: async () => {},
      refreshBranding: async () => {},
    };
  }
  return context;
}

