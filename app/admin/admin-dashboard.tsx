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

    // Subscribe to real-time changes on orders table
    const subscription = supabase
      .from("orders")
      .on("*", (payload) => {
        console.log("📡 Real-time order update detected:", payload);
        // Refresh stats when order table changes
        fetchStats();
      })
      .subscribe();

    // Fallback: Also poll every 30 seconds for extra reliability
    const interval = setInterval(fetchStats, 30000);

    return () => {
      supabase.removeAllChannels();
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
    <div style={{ width: "100%" }}>
      {/* Stats Cards - Live Supabase Data */}
      <div className="admin-cards" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1.5rem", marginBottom: "2rem" }}>
        {/* Users Card */}
        <article style={{
          padding: "1.5rem",
          backgroundColor: "#fff",
          borderRadius: "8px",
          border: "1px solid #e0d5cc",
          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
        }}>
          <h2 style={{ fontSize: "0.9rem", fontWeight: "500", color: "#5e584d", margin: "0 0 0.5rem 0" }}>👥 Total Users</h2>
          <p style={{ fontSize: "2rem", fontWeight: "700", color: "#2196f3", margin: "0" }}>
            {stats?.totalUsers || 0}
          </p>
          <p style={{ fontSize: "0.75rem", color: "#999", margin: "0.5rem 0 0 0" }}>Registered customers</p>
        </article>

        {/* Total Orders Card */}
        <article style={{
          padding: "1.5rem",
          backgroundColor: "#fff",
          borderRadius: "8px",
          border: "1px solid #e0d5cc",
          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
        }}>
          <h2 style={{ fontSize: "0.9rem", fontWeight: "500", color: "#5e584d", margin: "0 0 0.5rem 0" }}>📋 Total Orders</h2>
          <p style={{ fontSize: "2rem", fontWeight: "700", color: "#ff9800", margin: "0" }}>
            {stats?.totalOrders || 0}
          </p>
          <p style={{ fontSize: "0.75rem", color: "#999", margin: "0.5rem 0 0 0" }}>All time orders</p>
        </article>

        {/* Pending Orders Card */}
        <article style={{
          padding: "1.5rem",
          backgroundColor: "#fff",
          borderRadius: "8px",
          border: "1px solid #e0d5cc",
          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
        }}>
          <h2 style={{ fontSize: "0.9rem", fontWeight: "500", color: "#5e584d", margin: "0 0 0.5rem 0" }}>⏳ Pending Orders</h2>
          <p style={{ fontSize: "2rem", fontWeight: "700", color: "#ff6f00", margin: "0" }}>
            {stats?.pendingOrders || 0}
          </p>
          <p style={{ fontSize: "0.75rem", color: "#999", margin: "0.5rem 0 0 0" }}>Awaiting processing</p>
        </article>

        {/* Processing Orders Card */}
        <article style={{
          padding: "1.5rem",
          backgroundColor: "#fff",
          borderRadius: "8px",
          border: "1px solid #e0d5cc",
          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
        }}>
          <h2 style={{ fontSize: "0.9rem", fontWeight: "500", color: "#5e584d", margin: "0 0 0.5rem 0" }}>🔄 Processing Orders</h2>
          <p style={{ fontSize: "2rem", fontWeight: "700", color: "#673ab7", margin: "0" }}>
            {stats?.processingOrders || 0}
          </p>
          <p style={{ fontSize: "0.75rem", color: "#999", margin: "0.5rem 0 0 0" }}>Being prepared</p>
        </article>

        {/* Shipped Orders Card */}
        <article style={{
          padding: "1.5rem",
          backgroundColor: "#fff",
          borderRadius: "8px",
          border: "1px solid #e0d5cc",
          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
        }}>
          <h2 style={{ fontSize: "0.9rem", fontWeight: "500", color: "#5e584d", margin: "0 0 0.5rem 0" }}>🚚 Shipped Orders</h2>
          <p style={{ fontSize: "2rem", fontWeight: "700", color: "#2196f3", margin: "0" }}>
            {stats?.shippedOrders || 0}
          </p>
          <p style={{ fontSize: "0.75rem", color: "#999", margin: "0.5rem 0 0 0" }}>In transit</p>
        </article>

        {/* Delivered Orders Card */}
        <article style={{
          padding: "1.5rem",
          backgroundColor: "#fff",
          borderRadius: "8px",
          border: "1px solid #e0d5cc",
          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
        }}>
          <h2 style={{ fontSize: "0.9rem", fontWeight: "500", color: "#5e584d", margin: "0 0 0.5rem 0" }}>✅ Delivered Orders</h2>
          <p style={{ fontSize: "2rem", fontWeight: "700", color: "#4caf50", margin: "0" }}>
            {stats?.deliveredOrders || 0}
          </p>
          <p style={{ fontSize: "0.75rem", color: "#999", margin: "0.5rem 0 0 0" }}>Successfully delivered</p>
        </article>

        {/* Cancelled Orders Card */}
        <article style={{
          padding: "1.5rem",
          backgroundColor: "#fff",
          borderRadius: "8px",
          border: "1px solid #e0d5cc",
          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
        }}>
          <h2 style={{ fontSize: "0.9rem", fontWeight: "500", color: "#5e584d", margin: "0 0 0.5rem 0" }}>❌ Cancelled Orders</h2>
          <p style={{ fontSize: "2rem", fontWeight: "700", color: "#d32f2f", margin: "0" }}>
            {stats?.cancelledOrders || 0}
          </p>
          <p style={{ fontSize: "0.75rem", color: "#999", margin: "0.5rem 0 0 0" }}>Cancelled</p>
        </article>

        {/* Total Products Card */}
        <article style={{
          padding: "1.5rem",
          backgroundColor: "#fff",
          borderRadius: "8px",
          border: "1px solid #e0d5cc",
          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
        }}>
          <h2 style={{ fontSize: "0.9rem", fontWeight: "500", color: "#5e584d", margin: "0 0 0.5rem 0" }}>📦 Total Products</h2>
          <p style={{ fontSize: "2rem", fontWeight: "700", color: "#9c27b0", margin: "0" }}>
            {stats?.totalProducts || 0}
          </p>
          <p style={{ fontSize: "0.75rem", color: "#999", margin: "0.5rem 0 0 0" }}>In catalog</p>
        </article>

        {/* Total Revenue Card */}
        <article style={{
          padding: "1.5rem",
          backgroundColor: "#fff",
          borderRadius: "8px",
          border: "1px solid #e0d5cc",
          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
        }}>
          <h2 style={{ fontSize: "0.9rem", fontWeight: "500", color: "#5e584d", margin: "0 0 0.5rem 0" }}>💰 Total Revenue</h2>
          <p style={{ fontSize: "1.5rem", fontWeight: "700", color: "#4caf50", margin: "0" }}>
            {formatCurrency(stats?.totalRevenue || 0)}
          </p>
          <p style={{ fontSize: "0.75rem", color: "#999", margin: "0.5rem 0 0 0" }}>From delivered orders</p>
        </article>

        {/* Average Order Value Card */}
        <article style={{
          padding: "1.5rem",
          backgroundColor: "#fff",
          borderRadius: "8px",
          border: "1px solid #e0d5cc",
          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
        }}>
          <h2 style={{ fontSize: "0.9rem", fontWeight: "500", color: "#5e584d", margin: "0 0 0.5rem 0" }}>📊 Avg Order Value</h2>
          <p style={{ fontSize: "1.5rem", fontWeight: "700", color: "#2196f3", margin: "0" }}>
            {formatCurrency(stats?.averageOrderValue || 0)}
          </p>
          <p style={{ fontSize: "0.75rem", color: "#999", margin: "0.5rem 0 0 0" }}>Average per order</p>
        </article>
      </div>

      {/* Last Updated Info */}
      <div style={{
        padding: "1rem",
        backgroundColor: "#f5f5f5",
        borderRadius: "6px",
        border: "1px solid #e0d5cc",
        marginBottom: "2rem",
        textAlign: "center",
      }}>
        <p style={{ fontSize: "0.85rem", color: "#666", margin: "0" }}>
          � LIVE REAL-TIME DATA from Supabase • Last updated: {lastUpdated || "Loading..."} • Instant updates on order changes + 30s fallback refresh
        </p>
      </div>

      {/* Store Location Map */}
      <div style={{ marginBottom: "2rem" }}>
        <Map
          position={[shopLocation.latitude, shopLocation.longitude]}
          title={`📍 Admin Store Location - ${shopLocation.name}`}
          height="400px"
          zoom={shopLocation.zoom}
        />
      </div>
    </div>
  );
}
