"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { useSeller } from "@/lib/seller-context";
import { useOrder } from "@/lib/order-context";
import { type DatabaseOrder } from "@/lib/order-context";
import { SellerOrderStatusUpdater } from "@/app/components/seller-order-status-updater";
import { SellerSettings } from "@/app/components/seller-settings";
import { QuickSellerSettings } from "@/app/components/quick-seller-settings";
import { DashboardHeader } from "@/app/components/dashboard-header";
import Map from "@/app/components/map";
import styles from "./seller-dashboard.module.css";

interface ShopLocation {
  latitude: number;
  longitude: number;
  name?: string;
  address?: string;
  zoom: number;
}

export default function SellerDashboardContent() {
  const router = useRouter();
  const { seller, sellerLogout, addSellerProduct, sellerProducts, updateSellerProduct, deleteSellerProduct } =
    useSeller();
  const { databaseOrders } = useOrder();
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"products" | "orders" | "analytics" | "settings">("analytics");
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [shopLocation, setShopLocation] = useState<ShopLocation>({
    latitude: 8.81975,
    longitude: 125.69423,
    name: "👟 Shoe Otah Boutique",
    address: "Purok 4, Poblacion, Sibagat, 8503 Agusan del Sur",
    zoom: 18,
  });
  const [formData, setFormData] = useState({
    name: "",
    category: "Shoes" as "Shoes" | "Shirts" | "Slippers" | "Sacks",
    price: "",
    description: "",
    image: "",
    videoUrl: "",
    isEcoFriendly: false,
  });

  // Load shop location from admin settings
  useEffect(() => {
    const loadShopLocation = () => {
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
          });
        } catch (e) {
          console.error("Failed to load shop location:", e);
        }
      }
    };

    loadShopLocation();
    // Listen for updates from admin panel
    window.addEventListener("storage", loadShopLocation);
    return () => window.removeEventListener("storage", loadShopLocation);
  }, []);

  // Get seller orders (Supabase real-time orders matching seller product IDs)
  const sellerProductIds = new Set(sellerProducts.map((p) => p.id));
  const sellerOrders = databaseOrders.filter((order) =>
    sellerProductIds.has(order.productId)
  );

  // Calculate seller analytics
  const totalOrders = sellerOrders.length;
  const pendingOrders = sellerOrders.filter((o) => o.status === "pending" || o.status === "processing").length;
  const completedOrders = sellerOrders.filter((o) => o.status === "delivered").length;
  const sellerRevenue = sellerOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);

  const handleAddProduct = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!formData.name || !formData.price || !formData.description) {
      alert("Please fill in all fields");
      return;
    }

    const product = {
      name: formData.name,
      category: formData.category,
      price: parseFloat(formData.price),
      description: formData.description,
      image: formData.image || undefined,
      videoUrl: formData.videoUrl || undefined,
      isEcoFriendly: formData.isEcoFriendly,
      status: "pending" as const,
    };

    if (editingId) {
      updateSellerProduct(editingId, product);
      setEditingId(null);
    } else {
      addSellerProduct(product);
    }

    // Reset form
    setFormData({ name: "", category: "Shoes", price: "", description: "", image: "", videoUrl: "", isEcoFriendly: false });
    setShowProductForm(false);
  };

  const handleLogout = () => {
    sellerLogout();
    router.push("/login");
  };

  // Get status badge styles for DatabaseOrder status
  const getStatusStyles = (status: string) => {
    switch (status) {
      case "pending":
        return { bg: "#fff3cd", color: "#856404" };
      case "processing":
        return { bg: "#cfe2ff", color: "#084298" };
      case "shipped":
        return { bg: "#d1ecf1", color: "#055160" };
      case "delivered":
        return { bg: "#d4edda", color: "#155724" };
      case "cancelled":
        return { bg: "#f8d7da", color: "#721c24" };
      default:
        return { bg: "#e2e3e5", color: "#383d41" };
    }
  };

  const getStatusLabel = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  if (!seller) {
    return null;
  }

  return (
    <section className={styles.dashboardContainer}>
      <DashboardHeader 
        title={`Welcome, ${seller.name}!`}
        subtitle={`🏪 ${seller.shopName}`}
        badge="Seller Account"
      />

      <button onClick={handleLogout} className="btn btn-secondary" style={{ marginBottom: "1.5rem" }}>
        Logout
      </button>

      <div className={styles.statsGrid}>
        <article className={styles.statCard}>
          <h2>📦 Total Products</h2>
          <p className={styles.statNumber}>{sellerProducts.length}</p>
        </article>
        <article className={styles.statCard}>
          <h2>📋 Total Orders</h2>
          <p className={styles.statNumber}>{totalOrders}</p>
        </article>
        <article className={styles.statCard}>
          <h2>⏳ Pending Orders</h2>
          <p className={styles.statNumber}>{pendingOrders}</p>
        </article>
        <article className={styles.statCard}>
          <h2>✅ Completed Orders</h2>
          <p className={styles.statNumber}>{completedOrders}</p>
        </article>
        <article className={styles.statCard}>
          <h2>💰 Total Revenue</h2>
          <p className={styles.statNumber}>₱{sellerRevenue.toFixed(2)}</p>
        </article>
      </div>

      <div style={{ marginBottom: "2rem" }}>
        <Map 
          position={[shopLocation.latitude, shopLocation.longitude]}
          title={`📍 ${shopLocation.name || seller?.shopName || 'Shop Location'}`}
          height="350px"
          zoom={shopLocation.zoom}
        />
      </div>

      <div className={styles.tabNav}>
        <button
          onClick={() => setActiveTab("analytics")}
          className={activeTab === "analytics" ? styles.tabActive : ""}
        >
          📊 Analytics
        </button>
        <button
          onClick={() => setActiveTab("products")}
          className={activeTab === "products" ? styles.tabActive : ""}
        >
          📦 Products
        </button>
        <button
          onClick={() => setActiveTab("orders")}
          className={activeTab === "orders" ? styles.tabActive : ""}
        >
          📋 Orders
        </button>
        <button
          onClick={() => setActiveTab("settings")}
          className={activeTab === "settings" ? styles.tabActive : ""}
        >
          ⚙️ Settings
        </button>
      </div>

      <div className={styles.content}>
        {activeTab === "analytics" && (
          <section className={styles.analyticsSection}>
            <h2>Business Overview</h2>
            <div className={styles.analyticsGrid}>
              <div className={styles.analyticsCard}>
                <h3>Revenue Breakdown</h3>
                <p style={{ fontSize: "1.2rem", marginBottom: "0.5rem" }}>Current Month: ₱{sellerRevenue.toFixed(2)}</p>
                <p style={{ color: "#5e584d", fontSize: "0.9rem" }}>From {totalOrders} orders</p>
              </div>
              <div className={styles.analyticsCard}>
                <h3>Order Status</h3>
                <p style={{ fontSize: "1.2rem", marginBottom: "0.5rem" }}>{completedOrders} Delivered</p>
                <p style={{ color: "#5e584d", fontSize: "0.9rem" }}>{pendingOrders} Pending</p>
              </div>

              </div>
          </section>
        )}

        {activeTab === "products" && (
          <section className={styles.productsSection}>
          <div className={styles.sectionHeader}>
            <h2>Your Products ({sellerProducts.length})</h2>
            <button onClick={() => setShowProductForm(!showProductForm)} className="btn btn-primary">
              {showProductForm ? "Cancel" : "+ Add Product"}
            </button>
          </div>

          {showProductForm && (
            <form className={styles.productForm} onSubmit={handleAddProduct}>
              <input
                type="text"
                placeholder="Product Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />

              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
              >
                <option value="Shoes">Shoes</option>
                <option value="Shirts">Shirts</option>
                <option value="Slippers">Slippers</option>
                <option value="Sacks">Sacks</option>
              </select>

              <input
                type="number"
                placeholder="Price"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                step="0.01"
                required
              />

              <textarea
                placeholder="Description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                required
              />

              <input
                type="text"
                placeholder="Image URL (optional)"
                value={formData.image}
                onChange={(e) => setFormData({ ...formData, image: e.target.value })}
              />

              <input
                type="text"
                placeholder="Product Video URL (optional - YouTube or video link)"
                value={formData.videoUrl}
                onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
              />

              <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={formData.isEcoFriendly}
                  onChange={(e) => setFormData({ ...formData, isEcoFriendly: e.target.checked })}
                />
                <span>🌱 Mark as Eco-Friendly Product</span>
              </label>

              <button type="submit" className="btn btn-primary">
                {editingId ? "Update Product" : "Add Product"}
              </button>
            </form>
          )}

          <div className={styles.productsList}>
            {sellerProducts.length === 0 ? (
              <p className={styles.emptyState}>No products yet. Add your first product to get started!</p>
            ) : (
              sellerProducts.map((product) => (
                <div key={product.id} className={styles.productCard}>
                  <div className={styles.productImage}>
                    {product.image ? (
                      <img src={product.image} alt={product.name} />
                    ) : (
                      <div className={styles.imagePlaceholder}>📦</div>
                    )}
                  </div>

                  <div className={styles.productInfo}>
                    <h3>{product.name}</h3>
                    <p className={styles.category}>{product.category}</p>
                    <p className={styles.description}>{product.description}</p>
                    <p className={styles.price}>₱{product.price.toFixed(2)}</p>
                    {product.videoUrl && <p style={{ fontSize: "0.85rem", color: "#ff6b4a" }}>🎥 Has Product Video</p>}
                    {product.isEcoFriendly && <p style={{ fontSize: "0.85rem", color: "#2ecc71" }}>🌱 Eco-Friendly</p>}
                  </div>

                  <div className={styles.actions}>
                    <button
                      onClick={() => {
                        setFormData({
                          name: product.name,
                          category: product.category,
                          price: product.price.toString(),
                          description: product.description,
                          image: product.image || "",
                          videoUrl: product.videoUrl || "",
                          isEcoFriendly: product.isEcoFriendly || false,
                        });
                        setEditingId(product.id);
                        setShowProductForm(true);
                      }}
                      className="btn btn-edit"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deleteSellerProduct(product.id)}
                      className="btn btn-delete"
                    >
                      Delete
                    </button>
</div>
                </div>
              ))
            )}
          </div>
        </section>
        )}

        {activeTab === "orders" && (
          <section className={styles.ordersSection}>
            <h2>Order Management</h2>
            {sellerOrders.length === 0 ? (
              <p className={styles.emptyState}>No orders yet. Your orders will appear here.</p>
            ) : (
              <div className={styles.ordersTable}>
                <table>
                  <thead>
                    <tr>
                      <th>Order ID</th>
                      <th>Product</th>
                      <th>Qty</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th>Date</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sellerOrders.map((order) => {
                      const styles = getStatusStyles(order.status);
                      return (
                        <tr key={order.id}>
                          <td>
                            <span style={{ fontWeight: "600", color: "var(--accent)" }}>{order.id.slice(0, 8)}</span>
                          </td>
                          <td>{order.productName}</td>
                          <td>{order.quantity}</td>
                          <td>₱{order.totalAmount.toFixed(2)}</td>
                          <td>
                            <span
                              style={{
                                padding: "0.25rem 0.75rem",
                                borderRadius: "4px",
                                fontSize: "0.85rem",
                                fontWeight: "600",
                                backgroundColor: styles.bg,
                                color: styles.color,
                              }}
                            >
                              {getStatusLabel(order.status)}
                            </span>
                          </td>
                          <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                          <td>
                            <button
                              onClick={() => setSelectedOrderId(selectedOrderId === order.id ? null : order.id)}
                              style={{
                                padding: "0.25rem 0.5rem",
                                fontSize: "0.8rem",
                                background: "var(--accent)",
                                color: "white",
                                border: "none",
                                borderRadius: "4px",
                                cursor: "pointer",
                                fontWeight: "600",
                              }}
                            >
                              {selectedOrderId === order.id ? "Close" : "Update"}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Order Status Update Form */}
            {selectedOrderId && (
              <div style={{ marginTop: "2rem", padding: "1.5rem", background: "#f9f9f9", borderRadius: "8px" }}>
                {sellerOrders
                  .filter((order) => order.id === selectedOrderId)
                  .map((order) => (
                    <div key={order.id}>
                      <h3 style={{ marginTop: 0 }}>Update Order {order.id.slice(0, 8)}</h3>
                      <p>Product: {order.productName} | Qty: {order.quantity}</p>
                      <p>Current Status: <strong>{getStatusLabel(order.status)}</strong></p>
                    </div>
                  ))}
              </div>
            )}
          </section>
        )}

        {activeTab === "settings" && (
          <section>
            <SellerSettings />
          </section>
        )}
      </div>
    </section>
  );
}
