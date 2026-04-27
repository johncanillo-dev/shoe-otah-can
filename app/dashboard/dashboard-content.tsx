"use client";

import { useAuth } from "@/lib/auth-context";
import { useOrder, type DatabaseOrder } from "@/lib/order-context";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useAppSettings } from "@/lib/app-settings-context";
import { useCart } from "@/lib/cart-context";
import Map from "@/app/components/map";
import ShopCard from "@/app/components/shop-card";
import { UserSettings } from "@/app/components/user-settings";
import { QuickUserSettings } from "@/app/components/quick-user-settings";
import { DashboardHeader } from "@/app/components/dashboard-header";
import { fetchProducts, subscribeToProducts } from "@/lib/product-helpers";
import { useEffect, useState, useMemo } from "react";

type Product = {
  id: string;
  name: string;
  category: string;
  price: number;
  description: string;
  image?: string;
  created_at?: string;
};

const DEFAULT_CATEGORIES = ["Shoes", "Shirts", "Slippers", "Socks", "Necklace", "Beauty Product", "Pants"];

export default function DashboardContent() {
const { user } = useAuth();
  const { settings } = useAppSettings();
  const { items, addItem } = useCart();
  const [deliveryInfoMap, setDeliveryInfoMap] = useState<Record<string, any>>({});
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "orders" | "settings">("overview");
  const [shopLocation, setShopLocation] = useState({
    name: "👟 Shoe Otah Boutique",
    image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=500&h=300&fit=crop",
    latitude: 8.81975,
    longitude: 125.69423,
    zoom: 18,
  });
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [addedToCart, setAddedToCart] = useState<string | null>(null);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [supabaseOrders, setSupabaseOrders] = useState<DatabaseOrder[]>([]);

  // Load products from Supabase on mount and subscribe to real-time updates
  useEffect(() => {
    const loadProducts = async () => {
      setIsLoadingProducts(true);
      const productsData = await fetchProducts();
      console.log("✅ Dashboard: Fetched products from Supabase:", productsData.length, productsData);
      setProducts(productsData);
      setIsLoadingProducts(false);
    };

    loadProducts();

    const unsubscribe = subscribeToProducts(
      (updatedProducts) => {
        console.log("🔄 Dashboard: Real-time update received:", updatedProducts.length, updatedProducts);
        setProducts(updatedProducts);
      },
      (error) => console.error("Dashboard: Real-time subscription error:", error)
    );

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const loadShopLocation = () => {
      const savedLocation = localStorage.getItem("shop-location");
      if (savedLocation) {
        try {
          const parsed = JSON.parse(savedLocation);
          setShopLocation({
            name: parsed.name || "👟 Shoe Otah Boutique",
            image: parsed.image || "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=500&h=300&fit=crop",
            latitude: parsed.latitude || 8.81975,
            longitude: parsed.longitude || 125.69423,
            zoom: parsed.zoom || 18,
          });
        } catch (e) {
          console.error("Failed to load shop location:", e);
        }
      }
    };

    loadShopLocation();
    window.addEventListener("storage", loadShopLocation);
    return () => window.removeEventListener("storage", loadShopLocation);
  }, []);

  // Fetch and subscribe to real-time Supabase orders for current user
  useEffect(() => {
    if (!user?.id) return;

    const supabase = createSupabaseBrowserClient();

    const fetchUserOrders = async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching user orders:", error);
        return;
      }

      const mapped: DatabaseOrder[] = (data || []).map((o: any) => ({
        id: o.id,
        userId: o.user_id,
        productId: o.product_id,
        productName: o.product_name,
        quantity: o.quantity,
        price: o.price,
        totalAmount: o.total_amount,
        status: o.status,
        deliveryAddress: o.delivery_address,
        deliveryNotes: o.delivery_notes,
        createdAt: o.created_at,
        updatedAt: o.updated_at,
        estimatedDelivery: o.estimated_delivery,
        isDelivered: o.is_delivered,
      }));

      setSupabaseOrders(mapped);
    };

    fetchUserOrders();

    const channel = supabase
      .channel(`user-orders-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
          filter: `user_id=eq.${user.id}`
        },
        () => {
          fetchUserOrders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  // Use Supabase real-time orders for current user
  const userOrders = supabaseOrders;

  // Calculate statistics
  const totalOrders = userOrders.length;
  const totalSpent = userOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
  const pendingOrders = userOrders.filter((order) => order.status === "pending" || order.status === "processing").length;
  const deliveredOrders = userOrders.filter((order) => order.status === "delivered").length;

  // Filter products based on search query
  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) {
      return products;
    }
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [products, searchQuery]);

  const handleAddToCart = (product: Product) => {
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      category: product.category as string,
      quantity: 1,
    });
    setAddedToCart(product.id);
    setTimeout(() => setAddedToCart(null), 2000);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "#ff9800";
      case "processing":
        return "#2196f3";
      case "shipped":
        return "#9c27b0";
      case "out_for_delivery":
        return "#4caf50";
      case "delivered":
        return "#4caf50";
      case "cancelled":
        return "#f44336";
      default:
        return "#666";
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return "⏳ Pending";
      case "processing":
        return "⚙️ Processing";
      case "shipped":
        return "📦 Shipped";
      case "out_for_delivery":
        return "🚚 Out for Delivery";
      case "delivered":
        return "✓ Delivered";
      case "cancelled":
        return "✗ Cancelled";
      default:
        return status;
    }
  };

  return (
    <section className="user-dashboard-shell container">
      <DashboardHeader 
        title="My Dashboard"
        subtitle="Welcome Back"
        email={user?.name}
        badge="Customer Account"
      />

      {/* Store Closed Banner */}
      {!settings.store_open && (
        <div style={{ padding: "1rem", backgroundColor: "#f8d7da", color: "#721c24", borderRadius: "8px", marginBottom: "1.5rem", textAlign: "center", fontWeight: "600" }}>
          🚫 Store is currently closed. Please check back later.
        </div>
      )}

      {/* Announcement Banner */}
      {settings.announcement_banner && (
        <div style={{ padding: "0.75rem 1rem", backgroundColor: "#fff3cd", color: "#856404", borderRadius: "8px", marginBottom: "1.5rem", textAlign: "center", fontWeight: "500" }}>
          📢 {settings.announcement_banner}
        </div>
      )}

      {/* Tab Navigation */}
      <div style={{ display: "flex", gap: "1rem", marginBottom: "2rem", borderBottom: "2px solid #e0d5cc" }}>
        <button
          onClick={() => setActiveTab("overview")}
          style={{
            padding: "1rem 1.5rem",
            borderBottom: activeTab === "overview" ? "3px solid var(--accent)" : "none",
            borderTop: "none",
            borderLeft: "none",
            borderRight: "none",
            backgroundColor: "transparent",
            cursor: "pointer",
            fontSize: "1rem",
            fontWeight: activeTab === "overview" ? "600" : "400",
            color: activeTab === "overview" ? "var(--accent)" : "#5e584d",
          }}
        >
          📊 Overview
        </button>
        <button
          onClick={() => setActiveTab("orders")}
          style={{
            padding: "1rem 1.5rem",
            borderBottom: activeTab === "orders" ? "3px solid var(--accent)" : "none",
            borderTop: "none",
            borderLeft: "none",
            borderRight: "none",
            backgroundColor: "transparent",
            cursor: "pointer",
            fontSize: "1rem",
            fontWeight: activeTab === "orders" ? "600" : "400",
            color: activeTab === "orders" ? "var(--accent)" : "#5e584d",
          }}
        >
          📦 Orders
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
      </div>

      {/* Overview Tab */}
      {activeTab === "overview" && (
        <>
          {/* User Stats Cards */}
          <div className="dashboard-cards">
            <article>
              <h2>Total Orders</h2>
              <p style={{ fontSize: "1.8rem", fontWeight: "600", color: "var(--accent)" }}>
                {totalOrders}
              </p>
            </article>
            <article>
              <h2>In Progress</h2>
              <p style={{ fontSize: "1.8rem", fontWeight: "600", color: "#ff9800" }}>
                {pendingOrders}
              </p>
            </article>
            <article>
              <h2>Delivered</h2>
              <p style={{ fontSize: "1.8rem", fontWeight: "600", color: "#4caf50" }}>
                {deliveredOrders}
              </p>
            </article>
            <article>
              <h2>Total Spent</h2>
              <p style={{ fontSize: "1.8rem", fontWeight: "600", color: "#2196f3" }}>
                ₱{totalSpent.toFixed(2)}
              </p>
            </article>
          </div>

          {/* Cart Section */}
          {items.length > 0 && (
            <div className="dashboard-section">
              <div className="section-header">
                <h3>Shopping Cart</h3>
                <span className="badge" style={{ background: "var(--accent)", color: "white" }}>
                  {items.length} item{items.length !== 1 ? "s" : ""}
                </span>
              </div>
              <div className="cart-preview">
                {items.map((item) => (
                  <div key={item.id} className="cart-item-preview">
                    <div className="item-info">
                      <p className="item-name">{item.name}</p>
                      <p className="item-meta">
                        Qty: {item.quantity} × ₱{item.price.toFixed(2)}
                      </p>
                    </div>
                    <p className="item-price">₱{(item.quantity * item.price).toFixed(2)}</p>
                  </div>
                ))}
              </div>
              <div className="section-footer">
                <a href="/checkout" className="btn btn-primary" style={{ textDecoration: "none", display: "inline-block" }}>
                  Proceed to Checkout →
                </a>
              </div>
            </div>
          )}

          {/* Shop Search Section */}
          <div style={{ marginTop: "2rem", marginBottom: "2rem" }}>
            <div style={{ marginBottom: "1.5rem" }}>
              <h3 style={{ marginBottom: "1rem" }}>🔍 Search Shop Products</h3>
              <input
                type="text"
                placeholder="Search products by name or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: "100%",
                  padding: "0.75rem 1rem",
                  border: "2px solid var(--line)",
                  borderRadius: "8px",
                  fontSize: "1rem",
                  fontFamily: "inherit",
                  boxSizing: "border-box",
                }}
              />
            </div>

            {isLoadingProducts ? (
              <div style={{ textAlign: "center", padding: "2rem", color: "#666" }}>
                <p>Loading products from Supabase...</p>
              </div>
            ) : searchQuery.trim() ? (
              <div style={{ marginBottom: "2rem" }}>
                <p style={{ color: "#666", marginBottom: "1rem" }}>
                  Found {filteredProducts.length} product{filteredProducts.length !== 1 ? "s" : ""}
                </p>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                    gap: "1.5rem",
                  }}
                >
                  {filteredProducts.length > 0 ? (
                    filteredProducts.map((product) => (
                      <article
                        key={product.id}
                        style={{
                          border: "1px solid var(--line)",
                          borderRadius: "8px",
                          padding: "1rem",
                          backgroundColor: "#fafafa",
                          transition: "all 0.2s",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.1)";
                          e.currentTarget.style.transform = "translateY(-2px)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.boxShadow = "none";
                          e.currentTarget.style.transform = "translateY(0)";
                        }}
                      >
                        {product.image && (
                          <div style={{ width: "100%", height: "150px", marginBottom: "0.75rem", borderRadius: "4px", overflow: "hidden" }}>
                            <img
                              src={product.image}
                              alt={product.name}
                              style={{ width: "100%", height: "100%", objectFit: "cover" }}
                            />
                          </div>
                        )}
                        <div>
                          <h4 style={{ margin: "0.5rem 0", fontSize: "0.95rem", lineHeight: "1.3" }}>
                            {product.name}
                          </h4>
                          <p style={{ fontSize: "0.8rem", color: "#666", margin: "0.25rem 0", lineHeight: "1.3" }}>
                            {product.description}
                          </p>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "0.75rem" }}>
                            <span style={{ fontSize: "1.1rem", fontWeight: "600", color: "var(--accent)" }}>
                              ₱{product.price.toFixed(2)}
                            </span>
                            <span
                              style={{
                                fontSize: "0.75rem",
                                backgroundColor: "var(--line)",
                                padding: "0.25rem 0.5rem",
                                borderRadius: "4px",
                                color: "#666",
                              }}
                            >
                              {product.category}
                            </span>
                          </div>
                          <button
                            onClick={() => handleAddToCart(product)}
                            style={{
                              width: "100%",
                              marginTop: "0.75rem",
                              padding: "0.5rem",
                              border: "none",
                              borderRadius: "4px",
                              backgroundColor: addedToCart === product.id ? "#4caf50" : "var(--accent)",
                              color: "white",
                              cursor: "pointer",
                              fontWeight: "600",
                              fontSize: "0.85rem",
                              transition: "background-color 0.2s",
                            }}
                          >
                            {addedToCart === product.id ? "✓ Added!" : "Add to Cart"}
                          </button>
                        </div>
                      </article>
                    ))
                  ) : (
                    <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "2rem", color: "#999" }}>
                      <p>No products found matching your search.</p>
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </div>

          <div style={{ marginTop: "2rem", marginBottom: "2rem" }}>
            <ShopCard 
              shopName={shopLocation.name}
              latitude={shopLocation.latitude}
              longitude={shopLocation.longitude}
              zoom={shopLocation.zoom}
            />
          </div>
        </>
      )}

      {/* Orders Tab */}
      {activeTab === "orders" && (
        <div className="dashboard-section">
          <div className="section-header">
            <h3>My Orders</h3>
            <span className="badge">{totalOrders} order{totalOrders !== 1 ? "s" : ""}</span>
          </div>

          {userOrders.length === 0 ? (
            <div className="empty-state">
              <p style={{ fontSize: "1.1rem", color: "#666", marginBottom: "1rem" }}>
                No orders yet
              </p>
              <p style={{ color: "#999", marginBottom: "1.5rem" }}>
                Start shopping to place your first order
              </p>
              <a href="/" className="btn btn-primary" style={{ textDecoration: "none", display: "inline-block" }}>
                Continue Shopping
              </a>
            </div>
          ) : (
            <div>
              <div className="orders-table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Order ID</th>
                      <th>Date</th>
                      <th>Items</th>
                      <th>Total</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {userOrders.map((order) => (
                      <tr key={order.id}>
                        <td>
                          <strong>{order.id.slice(0, 8)}</strong>
                        </td>
                        <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                        <td>{order.productName} × {order.quantity}</td>
                        <td>
                          <strong>₱{order.totalAmount.toFixed(2)}</strong>
                        </td>
                        <td>
                          <span
                            style={{
                              display: "inline-block",
                              padding: "0.4rem 0.8rem",
                              borderRadius: "6px",
                              backgroundColor: getStatusColor(order.status) + "20",
                              color: getStatusColor(order.status),
                              fontSize: "0.85rem",
                              fontWeight: "600",
                            }}
                          >
                            {getStatusBadge(order.status)}
                          </span>
                        </td>
                        <td>
                          <button
                            onClick={() => setSelectedOrderId(selectedOrderId === order.id ? null : order.id)}
                            style={{
                              padding: "0.4rem 0.8rem",
                              border: "1px solid var(--line)",
                              borderRadius: "4px",
                              background: "white",
                              cursor: "pointer",
                              fontSize: "0.85rem",
                              fontWeight: "600",
                            }}
                          >
                            {selectedOrderId === order.id ? "Hide Details" : "Track"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Expanded Order Details */}
              {selectedOrderId && (
                <div style={{ marginTop: "2rem", padding: "1.5rem", background: "#f9f9f9", borderRadius: "8px" }}>
                  {userOrders
                    .filter((order) => order.id === selectedOrderId)
                    .map((order) => (
                      <div key={order.id}>
                        <h3 style={{ marginTop: 0 }}>Order {order.id.slice(0, 8)} - Details</h3>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", marginBottom: "1.5rem" }}>
                          <div>
                            <h4 style={{ margin: "0 0 1rem 0" }}>Item</h4>
                            <div style={{ marginBottom: "0.75rem", paddingBottom: "0.75rem", borderBottom: "1px solid #eee" }}>
                              <div style={{ fontWeight: "600" }}>{order.productName}</div>
                              <div style={{ fontSize: "0.9rem", color: "#666" }}>
                                {order.quantity} × ₱{order.price.toFixed(2)} = ₱{(order.quantity * order.price).toFixed(2)}
                              </div>
                            </div>
                            <div style={{ marginTop: "1rem", paddingTop: "1rem", borderTop: "2px solid var(--line)" }}>
                              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "1.1rem" }}>
                                <span>Total:</span>
                                <strong>₱{order.totalAmount.toFixed(2)}</strong>
                              </div>
                            </div>
                          </div>

                          <div>
                            <h4 style={{ margin: "0 0 1rem 0" }}>Delivery Address</h4>
                            <div style={{ lineHeight: "1.6" }}>
                              <p style={{ margin: "0.5rem 0" }}>{order.deliveryAddress}</p>
                            </div>

                            <h4 style={{ margin: "1.5rem 0 0.5rem 0" }}>Notes</h4>
                            <p style={{ margin: 0, fontSize: "0.9rem", color: "#666" }}>
                              {order.deliveryNotes || "No additional notes"}
                            </p>
                          </div>
                        </div>

                        <div style={{ marginTop: "1rem" }}>
                          <button
                            onClick={() => setSelectedOrderId(null)}
                            style={{
                              padding: "0.5rem 1rem",
                              border: "1px solid var(--line)",
                              borderRadius: "4px",
                              background: "white",
                              cursor: "pointer",
                              fontWeight: "600",
                            }}
                          >
                            Close Details
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Settings Tab */}
      {activeTab === "settings" && (
        <div style={{ marginBottom: "2rem" }}>
          <UserSettings />
        </div>
      )}
    </section>
  );
}

