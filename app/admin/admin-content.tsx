"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useOrder } from "@/lib/order-context";
import { useSeller } from "@/lib/seller-context";
import { AdminDashboard } from "./admin-dashboard";
import { CategoryManager } from "./category-manager";
import { ProductManager } from "./product-manager";
import { OrderManager } from "./order-manager";
import { SellerManager } from "./seller-manager";
import { UserManager } from "./user-manager";
import { ProductApprovalManager } from "./product-approval-manager";
import { SettingsManager } from "./settings-manager";
import { DashboardHeader } from "@/app/components/dashboard-header";
import { Tabs, TabPanel } from "@/app/components/ui/tabs";
import { Card } from "@/app/components/ui/card";
import ShopLocationSearchEditor from "./shop-location-search-editor";

export default function AdminContent() {
  const router = useRouter();
  const { isAdmin, user } = useAuth();
  const { orders } = useOrder();
  const { allSellers, allSellerProducts, getPendingProducts, getApprovedProducts } = useSeller();
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"dashboard" | "settings" | "management">("dashboard");
  const [managementSearch, setManagementSearch] = useState("");
  const [shopLocation, setShopLocation] = useState({ latitude: 8.6324, longitude: 126.3175, name: "Shoe Otah Boutique", zoom: 15 });

  const managementOptions = [
    { id: "categories", label: "🏷️ Category Management", description: "Add, edit, or remove product categories", icon: "🏷️" },
    { id: "users", label: "👥 User Management", description: "Manage customers and user accounts", icon: "👥" },
    { id: "sellers", label: "🏪 Seller Management", description: "Manage seller accounts and status", icon: "🏪" },
    { id: "approval", label: "✓ Product Approval", description: "Review and approve seller products", icon: "✓" },
    { id: "products", label: "📦 Product Management", description: "Manage all store products", icon: "📦" },
    { id: "orders", label: "📋 Order Management", description: "Track and manage customer orders", icon: "📋" },
  ];

  const filteredOptions = managementOptions.filter(option =>
    option.label.toLowerCase().includes(managementSearch.toLowerCase()) ||
    option.description.toLowerCase().includes(managementSearch.toLowerCase())
  );

  useEffect(() => {
    if (!isAdmin || !user) {
      router.push("/login");
      return;
    }
    
    if (user.email !== "admin@shoe-otah.com") {
      router.push("/login");
      return;
    }
    
    setIsLoading(false);
    
    const savedLocation = localStorage.getItem("shop-location");
    if (savedLocation) {
      try {
        const parsed = JSON.parse(savedLocation);
        setShopLocation(parsed);
      } catch (e) {
        console.error("Failed to load shop location:", e);
      }
    }
  }, [isAdmin, router]);

  if (isLoading) {
    return (
      <section className="auth-shell">
        <div className="auth-card">
          <p className="kicker">Loading...</p>
        </div>
      </section>
    );
  }

  if (!isAdmin) {
    return (
      <section className="auth-shell">
        <div className="auth-card">
          <p className="kicker">Admin Access Required</p>
          <h1>Unauthorized</h1>
          <p style={{ marginTop: "1rem", color: "#5e584d" }}>
            You don't have admin access. Please log in with admin credentials.
          </p>
          <button
            onClick={() => router.push("/login")}
            className="btn btn-primary"
            style={{ marginTop: "1.5rem", cursor: "pointer" }}
          >
            Go to Admin Login
          </button>
        </div>
      </section>
    );
  }

  const tabs = [
    { id: "dashboard", label: "Dashboard", icon: "📊" },
    { id: "settings", label: "Settings", icon: "⚙️" },
    { id: "management", label: "Management", icon: "👥" },
  ];

  return (
    <section className="admin-shell container">
      <DashboardHeader 
        title="Admin Dashboard"
        subtitle="Control Center"
        email={`Signed in as ${user?.email || user?.name || "Admin"}`}
        badge="Admin Access"
      />

      <Tabs
        tabs={tabs}
        activeTab={activeTab}
        onChange={(tabId) => setActiveTab(tabId as typeof activeTab)}
      />

      <TabPanel isActive={activeTab === "dashboard"}>
        <AdminDashboard shopLocation={shopLocation} />
      </TabPanel>

      <TabPanel isActive={activeTab === "settings"}>
        <div className="space-y-6 mb-8">
          <SettingsManager />
          <ShopLocationSearchEditor />
        </div>
      </TabPanel>

      <TabPanel isActive={activeTab === "management"}>
        <div className="admin-sections space-y-8">
          {/* Search Bar */}
          <Card variant="form" padding="lg">
            <label className="block mb-3 font-semibold text-[#2c2c2c] text-base">
              🔍 Search Management Options
            </label>
            <input
              type="text"
              placeholder="Search for users, sellers, products, orders, approval..."
              value={managementSearch}
              onChange={(e) => setManagementSearch(e.target.value)}
              className="w-full px-4 py-3 text-base border-2 border-[#d0c7bf] rounded-lg box-border transition-all duration-300 focus:border-[var(--accent)] focus:shadow-[0_0_0_3px_rgba(33,150,243,0.1)] focus:outline-none"
            />
            {managementSearch && (
              <p className="mt-2 text-sm text-[#666]">
                Found {filteredOptions.length} management option{filteredOptions.length !== 1 ? "s" : ""}
              </p>
            )}
          </Card>

          {/* Management Options Grid */}
          {filteredOptions.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
              {filteredOptions.map((option) => (
                <Card
                  key={option.id}
                  variant="hoverable"
                  padding="lg"
                  onClick={() => {
                    setManagementSearch("");
                    const element = document.getElementById(`mgmt-${option.id}`);
                    if (element) element.scrollIntoView({ behavior: "smooth", block: "start" });
                  }}
                >
                  <div className="text-3xl mb-3">{option.icon}</div>
                  <h3 className="m-0 mb-2 text-lg font-semibold text-[#2c2c2c]">
                    {option.label}
                  </h3>
                  <p className="m-0 text-sm text-[#666] leading-relaxed">
                    {option.description}
                  </p>
                </Card>
              ))}
            </div>
          ) : (
            <Card variant="outline" padding="lg" className="text-center mb-8">
              <p className="text-base text-[#999] m-0 mb-4">
                No management options found for "{managementSearch}"
              </p>
              <button
                onClick={() => setManagementSearch("")}
                className="px-4 py-2 bg-[var(--accent)] text-white rounded-md text-sm font-medium hover:opacity-90 transition-opacity"
              >
                Clear Search
              </button>
            </Card>
          )}

          {/* Management Sections */}
          <div id="mgmt-categories" className="mb-12">
            <CategoryManager />
          </div>
          <div id="mgmt-users" className="mb-12">
            <UserManager />
          </div>
          <div id="mgmt-sellers" className="mb-12">
            <SellerManager />
          </div>
          <div id="mgmt-approval" className="mb-12">
            <ProductApprovalManager />
          </div>
          <div id="mgmt-products" className="mb-12">
            <ProductManager />
          </div>
          <div id="mgmt-orders" className="mb-12">
            <OrderManager />
          </div>
        </div>
      </TabPanel>
    </section>
  );
}

