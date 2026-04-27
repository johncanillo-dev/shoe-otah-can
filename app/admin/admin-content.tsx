"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useOrder } from "@/lib/order-context";
import { useSeller } from "@/lib/seller-context";
import Map from "@/app/components/map";
import { AdminDashboard } from "./admin-dashboard";
import { CategoryManager } from "./category-manager";
import { ProductManager } from "./product-manager";
import { OrderManager } from "./order-manager";
import { SellerManager } from "./seller-manager";
import { UserManager } from "./user-manager";
import { ProductApprovalManager } from "./product-approval-manager";
import { SettingsManager } from "./settings-manager";
import { QuickAdminSettings } from "./quick-admin-settings";
import { DashboardHeader } from "@/app/components/dashboard-header";
import ShopLocationSearchEditor from "./shop-location-search-editor";

export default function AdminContent() {
  const router = useRouter();
  const { isAdmin, user, isLoggedIn, allUsers } = useAuth();
  const { orders } = useOrder();
  const { allSellers, allSellerProducts, getPendingProducts, getApprovedProducts } = useSeller();
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"dashboard" | "settings" | "management">("dashboard");
  const [managementSearch, setManagementSearch] = useState("");
  const [shopLocation, setShopLocation] = useState({ latitude: 8.6324, longitude: 126.3175, name: "Shoe Otah Boutique", zoom: 15 });

  // Management options
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
    
    // Validate admin email
    if (user.email !== "admin@shoe-otah.com") {
      router.push("/login");
      return;
    }
    
    setIsLoading(false);
    
    // Load shop location from localStorage
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

  return (
    <section className="admin-shell container">
      <DashboardHeader 
        title="Admin Dashboard"
        subtitle="Control Center"
        email={`Signed in as ${user?.email || user?.name || "Admin"}`}
        badge="Admin Access"
      />

      {/* Tab Navigation */}
      <div style={{ display: "flex", gap: "1rem", marginBottom: "2rem", borderBottom: "2px solid #e0d5cc" }}>
        <button
          onClick={() => setActiveTab("dashboard")}
          style={{
            padding: "1rem 1.5rem",
            borderBottom: activeTab === "dashboard" ? "3px solid var(--accent)" : "none",
            borderTop: "none",
            borderLeft: "none",
            borderRight: "none",
            backgroundColor: "transparent",
            cursor: "pointer",
            fontSize: "1rem",
            fontWeight: activeTab === "dashboard" ? "600" : "400",
            color: activeTab === "dashboard" ? "var(--accent)" : "#5e584d",
          }}
        >
          📊 Dashboard
        </button>
        <button
          onClick={() => setActiveTab("settings")}
          style={{
            padding: "1rem 1.5rem",
            borderBottom: activeTab === "settings" ? "3px solid var(--accent)" : "none",
            borderTop: "none",
            borderLeft: "none",
            borderRight: "none",
            backgroundColor: "transparent",
            cursor: "pointer",
            fontSize: "1rem",
            fontWeight: activeTab === "settings" ? "600" : "400",
            color: activeTab === "settings" ? "var(--accent)" : "#5e584d",
          }}
        >
          ⚙️ Settings
        </button>
        <button
          onClick={() => setActiveTab("management")}
          style={{
            padding: "1rem 1.5rem",
            borderBottom: activeTab === "management" ? "3px solid var(--accent)" : "none",
            borderTop: "none",
            borderLeft: "none",
            borderRight: "none",
            backgroundColor: "transparent",
            cursor: "pointer",
            fontSize: "1rem",
            fontWeight: activeTab === "management" ? "600" : "400",
            color: activeTab === "management" ? "var(--accent)" : "#5e584d",
          }}
        >
          👥 Management
        </button>
      </div>

      {/* Dashboard Tab */}
      {activeTab === "dashboard" && (
        <AdminDashboard shopLocation={shopLocation} />
      )}

      {/* Settings Tab */}
      {activeTab === "settings" && (
        <div style={{ marginBottom: "2rem" }}>
          <SettingsManager />
          <ShopLocationSearchEditor />
        </div>
      )}

      {/* Management Tab */}
      {activeTab === "management" && (
        <div className="admin-sections">
          {/* Search Bar */}
          <div style={{
            marginBottom: "2rem",
            padding: "1.5rem",
            backgroundColor: "#fff",
            borderRadius: "8px",
            border: "1px solid #e0d5cc",
            boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
          }}>
            <label style={{
              display: "block",
              marginBottom: "0.75rem",
              fontWeight: "600",
              color: "#2c2c2c",
              fontSize: "1rem",
            }}>
              🔍 Search Management Options
            </label>
            <input
              type="text"
              placeholder="Search for users, sellers, products, orders, approval..."
              value={managementSearch}
              onChange={(e) => setManagementSearch(e.target.value)}
              style={{
                width: "100%",
                padding: "0.75rem 1rem",
                fontSize: "1rem",
                border: "2px solid #d0c7bf",
                borderRadius: "6px",
                boxSizing: "border-box",
                transition: "all 0.3s ease",
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "var(--accent)";
                e.target.style.boxShadow = "0 0 0 3px rgba(33, 150, 243, 0.1)";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "#d0c7bf";
                e.target.style.boxShadow = "none";
              }}
            />
            {managementSearch && (
              <p style={{ marginTop: "0.5rem", fontSize: "0.85rem", color: "#666" }}>
                Found {filteredOptions.length} management option{filteredOptions.length !== 1 ? "s" : ""}
              </p>
            )}
          </div>

          {/* Management Options Grid */}
          {filteredOptions.length > 0 ? (
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "1.5rem",
              marginBottom: "2rem",
            }}>
              {filteredOptions.map((option) => (
                <div
                  key={option.id}
                  onClick={() => {
                    setManagementSearch("");
                    // Scroll to the section
                    const element = document.getElementById(`mgmt-${option.id}`);
                    if (element) element.scrollIntoView({ behavior: "smooth", block: "start" });
                  }}
                  style={{
                    padding: "1.5rem",
                    backgroundColor: "#fff",
                    border: "2px solid #e0d5cc",
                    borderRadius: "8px",
                    cursor: "pointer",
                    transition: "all 0.3s ease",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "var(--accent)";
                    e.currentTarget.style.boxShadow = "0 4px 12px rgba(33, 150, 243, 0.15)";
                    e.currentTarget.style.transform = "translateY(-2px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "#e0d5cc";
                    e.currentTarget.style.boxShadow = "0 2px 4px rgba(0,0,0,0.05)";
                    e.currentTarget.style.transform = "translateY(0)";
                  }}
                >
                  <div style={{ fontSize: "2rem", marginBottom: "0.75rem" }}>
                    {option.icon}
                  </div>
                  <h3 style={{
                    margin: "0 0 0.5rem 0",
                    fontSize: "1.1rem",
                    fontWeight: "600",
                    color: "#2c2c2c",
                  }}>
                    {option.label}
                  </h3>
                  <p style={{
                    margin: 0,
                    fontSize: "0.9rem",
                    color: "#666",
                    lineHeight: 1.4,
                  }}>
                    {option.description}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div style={{
              padding: "3rem 1.5rem",
              textAlign: "center",
              backgroundColor: "#f5f5f5",
              borderRadius: "8px",
              marginBottom: "2rem",
            }}>
              <p style={{ fontSize: "1rem", color: "#999", margin: 0 }}>
                No management options found for "{managementSearch}"
              </p>
              <button
                onClick={() => setManagementSearch("")}
                style={{
                  marginTop: "1rem",
                  padding: "0.5rem 1rem",
                  backgroundColor: "var(--accent)",
                  color: "white",
                  border: "none",
                  borderRadius: "5px",
                  cursor: "pointer",
                  fontSize: "0.9rem",
                }}
              >
                Clear Search
              </button>
            </div>
          )}

          {/* Management Sections with IDs for scrolling */}
          <div id="mgmt-categories" style={{ marginBottom: "3rem" }}>
            <CategoryManager />
          </div>
          <div id="mgmt-users" style={{ marginBottom: "3rem" }}>
            <UserManager />
          </div>
          <div id="mgmt-sellers" style={{ marginBottom: "3rem" }}>
            <SellerManager />
          </div>
          <div id="mgmt-approval" style={{ marginBottom: "3rem" }}>
            <ProductApprovalManager />
          </div>
          <div id="mgmt-products" style={{ marginBottom: "3rem" }}>
            <ProductManager />
          </div>
          <div id="mgmt-orders" style={{ marginBottom: "3rem" }}>
            <OrderManager />
          </div>
        </div>
      )}
    </section>
  );
}
