"use client";

import { useEffect, useState } from "react";
import { useOrder } from "@/lib/order-context";
import { useAuth } from "@/lib/auth-context";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import Map from "@/app/components/map";

export type AdminDashboardStats = {
  totalUsers: number;
  totalOrders: number;
  pendingOrders: number;
  processingOrders: number;
  shippedOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  totalProducts: number;
};

interface AdminDashboardProps {
  shopLocation?: { latitude: number; longitude: number; name: string; zoom: number };
}

export function AdminDashboard({ shopLocation = { latitude: 8.6324, longitude: 126.3175, name: "Shoe Otah Boutique", zoom: 15 } }: AdminDashboardProps) {
  const { getAdminDashboardStats } = useOrder();
  const { isAdmin } = useAuth();
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string>("");
  const supabase = createSupabaseBrowserClient();

  // Fetch stats function
  const fetchStats = async () => {
    setIsLoading(true);
    try {
      const dashboardStats = await getAdminDashboardStats();
      if (dashboardStats) {
        setStats(dashboardStats);
        setLastUpdated(new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
      }
    } catch (error) {
      console.error("Failed to fetch dashboard stats:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Setup real-time subscription
  useEffect(() => {
    if (!isAdmin) return;

    // Fetch initial stats
    fetchStats();

    // Subscribe to real-time changes on orders table using modern Supabase API
    const channel = supabase
      .channel('orders-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders'
        },
        (payload) => {
          console.log("📡 Real-time order update detected:", payload);
          // Refresh stats when order table changes
          fetchStats();
        }
      )
      .subscribe();

    // Fallback: Also poll every 30 seconds for extra reliability
    const interval = setInterval(fetchStats, 30000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [isAdmin, getAdminDashboardStats]);

  if (!isAdmin) {
    return (
      <div style={{ padding: "2rem", backgroundColor: "#fff5f0", borderRadius: "8px", border: "1px solid #ffccbb" }}>
        <p style={{ color: "#d32f2f" }}>⚠️ Admin access required to view dashboard</p>
      </div>
    );
  }

  if (isLoading && !stats) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "400px" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "2rem", marginBottom: "1rem" }}>📊</div>
          <p style={{ color: "#5e584d" }}>Loading dashboard statistics...</p>
        </div>
      </div>
    );
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  return (
    <div style={{ padding: "2rem", minHeight: "100vh", backgroundColor: "#f5f1ed" }}>
      {/* Header */}
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "2.5rem", fontWeight: "bold", color: "#2c2420", marginBottom: "0.5rem" }}>📊 Admin Dashboard</h1>
        <p style={{ color: "#5e584d" }}>Last updated: {lastUpdated || "Loading..."}</p>
      </div>

      {/* Stats Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "1.5rem", marginBottom: "2rem" }}>
        {/* Total Users */}
        <div style={{ backgroundColor: "white", padding: "1.5rem", borderRadius: "8px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
          <p style={{ color: "#5e584d", fontSize: "0.875rem", marginBottom: "0.5rem" }}>Total Users</p>
          <p style={{ fontSize: "2rem", fontWeight: "bold", color: "#2c2420" }}>{stats?.totalUsers || 0}</p>
        </div>

        {/* Total Orders */}
        <div style={{ backgroundColor: "white", padding: "1.5rem", borderRadius: "8px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
          <p style={{ color: "#5e584d", fontSize: "0.875rem", marginBottom: "0.5rem" }}>Total Orders</p>
          <p style={{ fontSize: "2rem", fontWeight: "bold", color: "#2c2420" }}>{stats?.totalOrders || 0}</p>
        </div>

        {/* Pending Orders */}
        <div style={{ backgroundColor: "white", padding: "1.5rem", borderRadius: "8px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
          <p style={{ color: "#5e584d", fontSize: "0.875rem", marginBottom: "0.5rem" }}>⏳ Pending</p>
          <p style={{ fontSize: "2rem", fontWeight: "bold", color: "#ff9800" }}>{stats?.pendingOrders || 0}</p>
        </div>

        {/* Processing Orders */}
        <div style={{ backgroundColor: "white", padding: "1.5rem", borderRadius: "8px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
          <p style={{ color: "#5e584d", fontSize: "0.875rem", marginBottom: "0.5rem" }}>⚙️ Processing</p>
          <p style={{ fontSize: "2rem", fontWeight: "bold", color: "#2196f3" }}>{stats?.processingOrders || 0}</p>
        </div>

        {/* Shipped Orders */}
        <div style={{ backgroundColor: "white", padding: "1.5rem", borderRadius: "8px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
          <p style={{ color: "#5e584d", fontSize: "0.875rem", marginBottom: "0.5rem" }}>📦 Shipped</p>
          <p style={{ fontSize: "2rem", fontWeight: "bold", color: "#673ab7" }}>{stats?.shippedOrders || 0}</p>
        </div>

        {/* Delivered Orders */}
        <div style={{ backgroundColor: "white", padding: "1.5rem", borderRadius: "8px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
          <p style={{ color: "#5e584d", fontSize: "0.875rem", marginBottom: "0.5rem" }}>✅ Delivered</p>
          <p style={{ fontSize: "2rem", fontWeight: "bold", color: "#4caf50" }}>{stats?.deliveredOrders || 0}</p>
        </div>

        {/* Cancelled Orders */}
        <div style={{ backgroundColor: "white", padding: "1.5rem", borderRadius: "8px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
          <p style={{ color: "#5e584d", fontSize: "0.875rem", marginBottom: "0.5rem" }}>❌ Cancelled</p>
          <p style={{ fontSize: "2rem", fontWeight: "bold", color: "#f44336" }}>{stats?.cancelledOrders || 0}</p>
        </div>

        {/* Total Products */}
        <div style={{ backgroundColor: "white", padding: "1.5rem", borderRadius: "8px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
          <p style={{ color: "#5e584d", fontSize: "0.875rem", marginBottom: "0.5rem" }}>👟 Total Products</p>
          <p style={{ fontSize: "2rem", fontWeight: "bold", color: "#2c2420" }}>{stats?.totalProducts || 0}</p>
        </div>

        {/* Total Revenue */}
        <div style={{ backgroundColor: "white", padding: "1.5rem", borderRadius: "8px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
          <p style={{ color: "#5e584d", fontSize: "0.875rem", marginBottom: "0.5rem" }}>💰 Total Revenue</p>
          <p style={{ fontSize: "2rem", fontWeight: "bold", color: "#2c2420" }}>{formatCurrency(stats?.totalRevenue || 0)}</p>
        </div>

        {/* Average Order Value */}
        <div style={{ backgroundColor: "white", padding: "1.5rem", borderRadius: "8px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
          <p style={{ color: "#5e584d", fontSize: "0.875rem", marginBottom: "0.5rem" }}>📈 Avg Order Value</p>
          <p style={{ fontSize: "2rem", fontWeight: "bold", color: "#2c2420" }}>{formatCurrency(stats?.averageOrderValue || 0)}</p>
        </div>
      </div>

      {/* Store Location Map */}
      <div style={{ marginTop: "2rem" }}>
        <h2 style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#2c2420", marginBottom: "1rem" }}>📍 Store Location</h2>
        <div style={{ backgroundColor: "white", borderRadius: "8px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)", overflow: "hidden", height: "400px" }}>
          <Map
  position={[shopLocation.latitude, shopLocation.longitude]}
  title={shopLocation.name}
  zoom={shopLocation.zoom}
/>
        </div>
      </div>
    </div>
  );
}