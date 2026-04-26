"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { createSupabaseBrowserClient } from "./supabase/client";

export interface AppSettings {
  store_open: boolean;
  delivery_fee: number;
  free_shipping_threshold: number;
  enable_cod: boolean;
  enable_gcash: boolean;
  enable_paymaya: boolean;
  enable_bank_transfer: boolean;
  discount_percentage: number;
  announcement_banner: string;
  maintenance_mode: boolean;
  enable_notifications: boolean;
  enable_email_alerts: boolean;
}

const DEFAULT_SETTINGS: AppSettings = {
  store_open: true,
  delivery_fee: 50,
  free_shipping_threshold: 500,
  enable_cod: true,
  enable_gcash: true,
  enable_paymaya: true,
  enable_bank_transfer: true,
  discount_percentage: 0,
  announcement_banner: "",
  maintenance_mode: false,
  enable_notifications: true,
  enable_email_alerts: true,
};

interface AppSettingsContextType {
  settings: AppSettings;
  isLoading: boolean;
  updateSetting: (key: keyof AppSettings, value: any) => Promise<void>;
  updateSettings: (updates: Partial<AppSettings>) => Promise<void>;
  refreshSettings: () => Promise<void>;
}

const AppSettingsContext = createContext<AppSettingsContextType | undefined>(undefined);

export function AppSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createSupabaseBrowserClient();

  // Fetch all settings from Supabase
  const fetchSettings = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("app_settings")
        .select("key, value");

      if (error) {
        console.error("Error fetching app settings:", error);
        return;
      }

      const formatted: Partial<AppSettings> = {};
      (data || []).forEach((item: any) => {
        const key = item.key as keyof AppSettings;
        if (key in DEFAULT_SETTINGS) {
          formatted[key] = item.value;
        }
      });

      setSettings((prev) => ({ ...prev, ...formatted }));
    } catch (err) {
      console.error("Failed to fetch settings:", err);
    }
  }, [supabase]);

  // Initial load
  useEffect(() => {
    let mounted = true;

    const load = async () => {
      setIsLoading(true);
      await fetchSettings();
      if (mounted) setIsLoading(false);
    };

    load();

    return () => {
      mounted = false;
    };
  }, [fetchSettings]);

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel("settings-sync")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "app_settings",
        },
        (payload: any) => {
          console.log("Realtime settings update:", payload);
          const newKey = payload.new?.key as keyof AppSettings;
          const newValue = payload.new?.value;

          if (newKey && newKey in DEFAULT_SETTINGS) {
            setSettings((prev) => ({
              ...prev,
              [newKey]: newValue,
            }));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  // Update a single setting
  const updateSetting = useCallback(
    async (key: keyof AppSettings, value: any) => {
      try {
        const { error } = await supabase.from("app_settings").upsert(
          {
            key,
            value,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "key" }
        );

        if (error) {
          console.error("Error updating setting:", error);
          throw error;
        }

        // Optimistic update
        setSettings((prev) => ({ ...prev, [key]: value }));
      } catch (err) {
        console.error("Failed to update setting:", err);
        throw err;
      }
    },
    [supabase]
  );

  // Update multiple settings at once
  const updateSettings = useCallback(
    async (updates: Partial<AppSettings>) => {
      const entries = Object.entries(updates);
      if (entries.length === 0) return;

      try {
        const rows = entries.map(([key, value]) => ({
          key,
          value,
          updated_at: new Date().toISOString(),
        }));

        const { error } = await supabase.from("app_settings").upsert(rows, {
          onConflict: "key",
        });

        if (error) {
          console.error("Error updating settings:", error);
          throw error;
        }

        // Optimistic update
        setSettings((prev) => ({ ...prev, ...updates }));
      } catch (err) {
        console.error("Failed to update settings:", err);
        throw err;
      }
    },
    [supabase]
  );

  const refreshSettings = useCallback(async () => {
    setIsLoading(true);
    await fetchSettings();
    setIsLoading(false);
  }, [fetchSettings]);

  return (
    <AppSettingsContext.Provider
      value={{ settings, isLoading, updateSetting, updateSettings, refreshSettings }}
    >
      {children}
    </AppSettingsContext.Provider>
  );
}

export function useAppSettings(): AppSettingsContextType {
  const context = useContext(AppSettingsContext);
  if (context === undefined) {
    // Return safe defaults if outside provider
    return {
      settings: DEFAULT_SETTINGS,
      isLoading: false,
      updateSetting: async () => {},
      updateSettings: async () => {},
      refreshSettings: async () => {},
    };
  }
  return context;
}

