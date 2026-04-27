"use client";

import { useEffect, useState } from "react";
import { useOrder } from "@/lib/order-context";
import { useAuth } from "@/lib/auth-context";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import Map from "@/app/components/map";
import { StatsCard } from "@/app/components/ui/stats-card";
import { SectionHeader } from "@/app/components/ui/section-header";
import { Card } from "@/app/components/ui/card";

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

  useEffect(() => {
    if (!isAdmin) return;

    fetchStats();

    const ordersChannel = supabase
      .channel('admin-orders-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => fetchStats())
      .subscribe();

    const usersChannel = supabase
      .channel('admin-users-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, () => fetchStats())
      .subscribe();

    const productsChannel = supabase
      .channel('admin-products-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'shoe-otah' }, () => fetchStats())
      .subscribe();

    const interval = setInterval(fetchStats, 30000);

    return () => {
      supabase.removeChannel(ordersChannel);
      supabase.removeChannel(usersChannel);
      supabase.removeChannel(productsChannel);
      clearInterval(interval);
    };
  }, [isAdmin, getAdminDashboardStats]);

  if (!isAdmin) {
    return (
      <Card variant="outline" padding="lg" className="bg-[#fff5f0] border-[#ffccbb]">
        <p className="text-[#d32f2f] m-0">⚠️ Admin access required to view dashboard</p>
      </Card>
    );
  }

  if (isLoading && !stats) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="text-4xl mb-4">📊</div>
          <p className="text-[#5e584d] m-0">Loading dashboard statistics...</p>
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

  const statItems = [
    { label: "Total Users", value: stats?.totalUsers || 0, icon: "👥", color: "default" as const },
    { label: "Total Orders", value: stats?.totalOrders || 0, icon: "📦", color: "default" as const },
    { label: "Pending", value: stats?.pendingOrders || 0, icon: "⏳", color: "orange" as const },
    { label: "Processing", value: stats?.processingOrders || 0, icon: "⚙️", color: "blue" as const },
    { label: "Shipped", value: stats?.shippedOrders || 0, icon: "🚚", color: "purple" as const },
    { label: "Delivered", value: stats?.deliveredOrders || 0, icon: "✅", color: "green" as const },
    { label: "Cancelled", value: stats?.cancelledOrders || 0, icon: "❌", color: "red" as const },
    { label: "Total Products", value: stats?.totalProducts || 0, icon: "👟", color: "default" as const },
    { label: "Total Revenue", value: formatCurrency(stats?.totalRevenue || 0), icon: "💰", color: "default" as const },
    { label: "Avg Order Value", value: formatCurrency(stats?.averageOrderValue || 0), icon: "📈", color: "default" as const },
  ];

  return (
    <div className="p-6 md:p-8 min-h-screen bg-[#f5f1ed]">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-[#2c2420] mb-2">📊 Admin Dashboard</h1>
        <p className="text-sm text-[#5e584d] m-0">
          Last updated: {lastUpdated || "Loading..."}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-8">
        {statItems.map((stat) => (
          <StatsCard
            key={stat.label}
            label={stat.label}
            value={stat.value}
            icon={stat.icon}
            color={stat.color}
          />
        ))}
      </div>

      {/* Store Location Map */}
      <Card>
        <SectionHeader
          title="📍 Store Location"
          subtitle={`${shopLocation.name} — Lat: ${shopLocation.latitude}, Lng: ${shopLocation.longitude}`}
        />
        <div className="rounded-lg overflow-hidden h-[400px] border border-[var(--line)]">
          <Map
            position={[shopLocation.latitude, shopLocation.longitude]}
            title={shopLocation.name}
            zoom={shopLocation.zoom}
          />
        </div>
      </Card>
    </div>
  );
}

