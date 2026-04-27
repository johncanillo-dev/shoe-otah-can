"use client";

import { useAuth } from "@/lib/auth-context";
import { useOrder, type DatabaseOrder } from "@/lib/order-context";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useAppSettings } from "@/lib/app-settings-context";
import { useCart } from "@/lib/cart-context";
import Map from "@/app/components/map";
import ShopCard from "@/app/components/shop-card";
import { UserSettings } from "@/app/components/user-settings";
import { DashboardHeader } from "@/app/components/dashboard-header";
import { fetchProducts, subscribeToProducts } from "@/lib/product-helpers";
import { useEffect, useState, useMemo } from "react";
import { Tabs, TabPanel } from "@/app/components/ui/tabs";
import { StatsCard } from "@/app/components/ui/stats-card";
import { Card } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { EmptyState } from "@/app/components/ui/empty-state";
import { SectionHeader } from "@/app/components/ui/section-header";

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

  const userOrders = supabaseOrders;

  const totalOrders = userOrders.length;
  const totalSpent = userOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
  const pendingOrders = userOrders.filter((order) => order.status === "pending" || order.status === "processing").length;
  const deliveredOrders = userOrders.filter((order) => order.status === "delivered").length;

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
      case "pending": return "#ff9800";
      case "processing": return "#2196f3";
      case "shipped": return "#9c27b0";
      case "out_for_delivery": return "#4caf50";
      case "delivered": return "#4caf50";
      case "cancelled": return "#f44336";
      default: return "#666";
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending": return "⏳ Pending";
      case "processing": return "⚙️ Processing";
      case "shipped": return "📦 Shipped";
      case "out_for_delivery": return "🚚 Out for Delivery";
      case "delivered": return "✓ Delivered";
      case "cancelled": return "✗ Cancelled";
      default: return status;
    }
  };

  const tabs = [
    { id: "overview", label: "Overview", icon: "📊" },
    { id: "orders", label: "Orders", icon: "📦" },
    { id: "settings", label: "Settings", icon: "⚙️" },
  ];

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
        <Card padding="md" className="bg-[#f8d7da] border-[#f5c6cb] mb-6 text-center">
          <p className="text-[#721c24] font-semibold m-0">🚫 Store is currently closed. Please check back later.</p>
        </Card>
      )}

      {/* Announcement Banner */}
      {settings.announcement_banner && (
        <Card padding="sm" className="bg-[#fff3cd] border-[#ffeeba] mb-6 text-center">
          <p className="text-[#856404] font-medium m-0">📢 {settings.announcement_banner}</p>
        </Card>
      )}

      <Tabs
        tabs={tabs}
        activeTab={activeTab}
        onChange={(tabId) => setActiveTab(tabId as typeof activeTab)}
      />

      <TabPanel isActive={activeTab === "overview"}>
        {/* User Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatsCard label="Total Orders" value={totalOrders} icon="📦" color="default" />
          <StatsCard label="In Progress" value={pendingOrders} icon="⏳" color="orange" />
          <StatsCard label="Delivered" value={deliveredOrders} icon="✅" color="green" />
          <StatsCard label="Total Spent" value={`₱${totalSpent.toFixed(2)}`} icon="💰" color="blue" />
        </div>

        {/* Cart Section */}
        {items.length > 0 && (
          <Card className="mb-8">
            <SectionHeader
              title="Shopping Cart"
              action={<Badge variant="primary">{items.length} item{items.length !== 1 ? "s" : ""}</Badge>}
            />
            <div className="flex flex-col gap-3 mb-4">
              {items.map((item) => (
                <div key={item.id} className="flex justify-between items-center p-3 bg-[#fafafa] rounded-lg gap-4">
                  <div className="flex-1">
                    <p className="font-semibold text-[var(--ink)] m-0">{item.name}</p>
                    <p className="text-sm text-[#666] mt-1 m-0">
                      Qty: {item.quantity} × ₱{item.price.toFixed(2)}
                    </p>
                  </div>
                  <p className="font-bold text-[var(--accent)] m-0">₱{(item.quantity * item.price).toFixed(2)}</p>
                </div>
              ))}
            </div>
            <div className="pt-4 border-t border-[var(--line)]">
              <a href="/checkout" className="btn btn-primary inline-block no-underline">
                Proceed to Checkout →
              </a>
            </div>
          </Card>
        )}

        {/* Shop Search Section */}
        <Card className="mb-8">
          <SectionHeader title="🔍 Search Shop Products" />
          <input
            type="text"
            placeholder="Search products by name or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-3 border-2 border-[var(--line)] rounded-lg text-base font-[inherit] box-border transition-all duration-200 focus:border-[var(--accent)] focus:shadow-[0_0_0_3px_rgba(239,91,42,0.1)] focus:outline-none"
          />

          {isLoadingProducts ? (
            <div className="text-center py-8 text-[#666]">
              <p className="m-0">Loading products from Supabase...</p>
            </div>
          ) : searchQuery.trim() ? (
            <div className="mt-6">
              <p className="text-[#666] mb-4 m-0">
                Found {filteredProducts.length} product{filteredProducts.length !== 1 ? "s" : ""}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                {filteredProducts.length > 0 ? (
                  filteredProducts.map((product) => (
                    <Card
                      key={product.id}
                      variant="hoverable"
                      padding="sm"
                      className="group"
                    >
                      {product.image && (
                        <div className="w-full h-36 mb-3 rounded overflow-hidden">
                          <img
                            src={product.image}
                            alt={product.name}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                        </div>
                      )}
                      <h4 className="m-0 mb-1 text-sm font-semibold leading-snug">
                        {product.name}
                      </h4>
                      <p className="text-xs text-[#666] m-0 mb-2 leading-snug overflow-hidden display [-webkit-box] [-webkit-line-clamp:2] [-webkit-box-orient:vertical]">
                        {product.description}
                      </p>
                      <div className="flex justify-between items-center mt-auto">
                        <span className="text-lg font-semibold text-[var(--accent)]">
                          ₱{product.price.toFixed(2)}
                        </span>
                        <span className="text-xs bg-[var(--line)] px-2 py-1 rounded text-[#666]">
                          {product.category}
                        </span>
                      </div>
                      <button
                        onClick={() => handleAddToCart(product)}
                        className={`w-full mt-3 py-2 border-none rounded font-semibold text-sm cursor-pointer transition-colors duration-200 ${
                          addedToCart === product.id
                            ? "bg-[#4caf50] text-white"
                            : "bg-[var(--accent)] text-white hover:bg-[#d94e22]"
                        }`}
                      >
                        {addedToCart === product.id ? "✓ Added!" : "Add to Cart"}
                      </button>
                    </Card>
                  ))
                ) : (
                  <div className="col-span-full text-center py-8 text-[#999]">
                    <p className="m-0">No products found matching your search.</p>
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </Card>

        <ShopCard 
          shopName={shopLocation.name}
          latitude={shopLocation.latitude}
          longitude={shopLocation.longitude}
          zoom={shopLocation.zoom}
        />
      </TabPanel>

      <TabPanel isActive={activeTab === "orders"}>
        <Card>
          <SectionHeader
            title="My Orders"
            action={<Badge>{totalOrders} order{totalOrders !== 1 ? "s" : ""}</Badge>}
          />

          {userOrders.length === 0 ? (
            <EmptyState
              icon="📭"
              title="No orders yet"
              description="Start shopping to place your first order"
              action={
                <a href="/" className="btn btn-primary inline-block no-underline">
                  Continue Shopping
                </a>
              }
            />
          ) : (
            <div>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-[#f9f9f9]">
                      <th className="text-left p-3 font-semibold text-[var(--ink)] border-b-2 border-[var(--line)] text-sm">Order ID</th>
                      <th className="text-left p-3 font-semibold text-[var(--ink)] border-b-2 border-[var(--line)] text-sm">Date</th>
                      <th className="text-left p-3 font-semibold text-[var(--ink)] border-b-2 border-[var(--line)] text-sm">Items</th>
                      <th className="text-left p-3 font-semibold text-[var(--ink)] border-b-2 border-[var(--line)] text-sm">Total</th>
                      <th className="text-left p-3 font-semibold text-[var(--ink)] border-b-2 border-[var(--line)] text-sm">Status</th>
                      <th className="text-left p-3 font-semibold text-[var(--ink)] border-b-2 border-[var(--line)] text-sm">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {userOrders.map((order) => (
                      <tr key={order.id} className="hover:bg-[#fafafa] transition-colors">
                        <td className="p-3 border-b border-[var(--line)] font-semibold text-sm">{order.id.slice(0, 8)}</td>
                        <td className="p-3 border-b border-[var(--line)] text-sm">{new Date(order.createdAt).toLocaleDateString()}</td>
                        <td className="p-3 border-b border-[var(--line)] text-sm">{order.productName} × {order.quantity}</td>
                        <td className="p-3 border-b border-[var(--line)] font-semibold text-sm">₱{order.totalAmount.toFixed(2)}</td>
                        <td className="p-3 border-b border-[var(--line)]">
                          <span
                            className="inline-block px-3 py-1.5 rounded-md text-sm font-semibold"
                            style={{
                              backgroundColor: getStatusColor(order.status) + "20",
                              color: getStatusColor(order.status),
                            }}
                          >
                            {getStatusBadge(order.status)}
                          </span>
                        </td>
                        <td className="p-3 border-b border-[var(--line)]">
                          <button
                            onClick={() => setSelectedOrderId(selectedOrderId === order.id ? null : order.id)}
                            className="px-3 py-1.5 border border-[var(--line)] rounded bg-white cursor-pointer text-sm font-semibold hover:bg-[#fafafa] transition-colors"
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
                <Card variant="form" className="mt-6 bg-[#f9f9f9]">
                  {userOrders
                    .filter((order) => order.id === selectedOrderId)
                    .map((order) => (
                      <div key={order.id}>
                        <h3 className="mt-0 mb-4 text-lg font-semibold">Order {order.id.slice(0, 8)} - Details</h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                          <div>
                            <h4 className="m-0 mb-4 font-semibold">Item</h4>
                            <div className="mb-3 pb-3 border-b border-[#eee]">
                              <div className="font-semibold">{order.productName}</div>
                              <div className="text-sm text-[#666]">
                                {order.quantity} × ₱{order.price.toFixed(2)} = ₱{(order.quantity * order.price).toFixed(2)}
                              </div>
                            </div>
                            <div className="mt-4 pt-4 border-t-2 border-[var(--line)]">
                              <div className="flex justify-between text-lg">
                                <span>Total:</span>
                                <strong>₱{order.totalAmount.toFixed(2)}</strong>
                              </div>
                            </div>
                          </div>

                          <div>
                            <h4 className="m-0 mb-4 font-semibold">Delivery Address</h4>
                            <div className="leading-relaxed">
                              <p className="my-2">{order.deliveryAddress}</p>
                            </div>

                            <h4 className="mt-6 mb-2 font-semibold">Notes</h4>
                            <p className="m-0 text-sm text-[#666]">
                              {order.deliveryNotes || "No additional notes"}
                            </p>
                          </div>
                        </div>

                        <button
                          onClick={() => setSelectedOrderId(null)}
                          className="px-4 py-2 border border-[var(--line)] rounded bg-white cursor-pointer font-semibold hover:bg-[#fafafa] transition-colors"
                        >
                          Close Details
                        </button>
                      </div>
                    ))}
                </Card>
              )}
            </div>
          )}
        </Card>
      </TabPanel>

      <TabPanel isActive={activeTab === "settings"}>
        <div className="mb-8">
          <UserSettings />
        </div>
      </TabPanel>
    </section>
  );
}

