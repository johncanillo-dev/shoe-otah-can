"use client";

import { useEffect, useState } from "react";
import { useOrder, type DatabaseOrder } from "@/lib/order-context";
import { SectionHeader } from "@/app/components/ui/section-header";
import { Badge } from "@/app/components/ui/badge";
import { Card } from "@/app/components/ui/card";
import { EmptyState } from "@/app/components/ui/empty-state";

export function OrderManager() {
  const { databaseOrders, updateDatabaseOrderStatus } = useOrder();
  const [selectedOrder, setSelectedOrder] = useState<DatabaseOrder | null>(null);
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "processing" | "shipped" | "delivered" | "cancelled">("all");
  const [isLoading, setIsLoading] = useState(true);
  const [deliveryNotes, setDeliveryNotes] = useState("");
  const [allOrders, setAllOrders] = useState<DatabaseOrder[]>([]);

  useEffect(() => {
    setIsLoading(false);
    setAllOrders(databaseOrders);
  }, [databaseOrders]);

  useEffect(() => {
    if (selectedOrder) {
      const orderNotes = localStorage.getItem(`order-notes-${selectedOrder.id}`) || "";
      setDeliveryNotes(orderNotes);
    }
  }, [selectedOrder]);

  const filteredOrders = statusFilter === "all" 
    ? allOrders 
    : allOrders.filter(order => order.status === statusFilter);

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "pending": return "warning";
      case "processing": return "info";
      case "shipped": return "primary";
      case "delivered": return "success";
      case "cancelled": return "danger";
      default: return "default";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "#ff9800";
      case "processing": return "#2196f3";
      case "shipped": return "#9c27b0";
      case "delivered": return "#4caf50";
      case "cancelled": return "#f44336";
      default: return "#757575";
    }
  };

  const getStatusLabel = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending": return "⏳";
      case "processing": return "⚙️";
      case "shipped": return "📦";
      case "delivered": return "🚚";
      case "cancelled": return "❌";
      default: return "📋";
    }
  };

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    const result = await updateDatabaseOrderStatus(orderId, newStatus);
    if (result.success) {
      if (selectedOrder?.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status: newStatus as DatabaseOrder["status"] });
      }
    } else {
      console.error("Failed to update order status:", result.error);
      alert("Failed to update order status. Please try again.");
    }
  };

  const handleSaveDeliveryNotes = () => {
    if (selectedOrder) {
      localStorage.setItem(`order-notes-${selectedOrder.id}`, deliveryNotes);
      alert("Delivery notes saved successfully!");
    }
  };

  const handleMarkDelivered = (orderId: string) => {
    const order = allOrders.find(o => o.id === orderId);
    if (order) {
      const deliveryDate = new Date().toLocaleDateString();
      handleStatusUpdate(orderId, "delivered");
      const deliveryInfo = { date: deliveryDate, time: new Date().toLocaleTimeString(), notes: deliveryNotes };
      localStorage.setItem(`delivery-${orderId}`, JSON.stringify(deliveryInfo));
      if (selectedOrder?.id === orderId) {
        alert(`Order ${orderId} marked as delivered on ${deliveryDate}`);
      }
    }
  };

  const getDeliveryInfo = (orderId: string) => {
    const info = localStorage.getItem(`delivery-${orderId}`);
    return info ? JSON.parse(info) : null;
  };

  if (isLoading) {
    return <div className="text-center py-8 text-[#666]">Loading orders...</div>;
  }

  const filters = ["all", "pending", "processing", "shipped", "delivered", "cancelled"] as const;

  return (
    <>
      <Card>
        <SectionHeader
          title="📦 Customer Orders & Checkouts"
          subtitle={`${allOrders.length} total orders`}
        />

        {/* Filter Buttons */}
        <div className="flex flex-wrap gap-2 mb-6">
          {filters.map((filter) => (
            <button
              key={filter}
              onClick={() => setStatusFilter(filter)}
              className={`px-4 py-2 rounded-full text-sm font-medium cursor-pointer transition-all duration-200 border ${
                statusFilter === filter
                  ? "bg-[var(--accent)] text-white border-[var(--accent)]"
                  : "bg-transparent border-[var(--line)] hover:border-[var(--ink)]"
              }`}
            >
              {filter === "all" ? "All Orders" : getStatusLabel(filter)}
              {filter !== "all" && statusFilter === "all" && ` (${allOrders.filter(o => o.status === filter).length})`}
            </button>
          ))}
        </div>

        {filteredOrders.length === 0 ? (
          <EmptyState icon="📭" title="No orders found" />
        ) : (
          <div className="overflow-x-auto border border-[var(--line)] rounded-xl">
            <table className="w-full border-collapse text-sm">
              <thead className="bg-[#f9f6f0]">
                <tr>
                  <th className="p-4 text-left font-semibold border-b-2 border-[var(--line)]">Order ID</th>
                  <th className="p-4 text-left font-semibold border-b-2 border-[var(--line)]">Product</th>
                  <th className="p-4 text-left font-semibold border-b-2 border-[var(--line)]">Qty</th>
                  <th className="p-4 text-left font-semibold border-b-2 border-[var(--line)]">Amount</th>
                  <th className="p-4 text-left font-semibold border-b-2 border-[var(--line)]">Status</th>
                  <th className="p-4 text-left font-semibold border-b-2 border-[var(--line)]">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-[#fbf7ee] transition-colors">
                    <td className="p-4 border-b border-[var(--line)] font-semibold">{order.id.slice(0, 8)}</td>
                    <td className="p-4 border-b border-[var(--line)]">{order.productName}</td>
                    <td className="p-4 border-b border-[var(--line)]">{order.quantity}</td>
                    <td className="p-4 border-b border-[var(--line)] font-semibold">₱{order.totalAmount.toFixed(2)}</td>
                    <td className="p-4 border-b border-[var(--line)]">
                      <Badge variant={getStatusVariant(order.status)}>
                        {getStatusLabel(order.status)}
                      </Badge>
                    </td>
                    <td className="p-4 border-b border-[var(--line)]">
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="px-3 py-1.5 bg-[var(--ink)] text-white rounded-md text-sm cursor-pointer hover:opacity-90 transition-opacity"
                      >
                        Manage
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSelectedOrder(null)} />
          <Card className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <button 
              onClick={() => setSelectedOrder(null)}
              className="absolute top-4 right-4 bg-none border-none text-2xl cursor-pointer hover:opacity-70"
            >
              ×
            </button>

            <h2 className="text-xl font-bold mb-6">📋 Order Management</h2>

            {/* Order Header */}
            <div className="space-y-3 mb-6">
              <div className="flex justify-between items-center py-2 border-b border-[#ddd]">
                <strong>Order ID:</strong>
                <span>{selectedOrder.id}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-[#ddd]">
                <strong>Date:</strong>
                <span>{new Date(selectedOrder.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-[#ddd]">
                <strong>Current Status:</strong>
                <Badge variant={getStatusVariant(selectedOrder.status)}>
                  {getStatusLabel(selectedOrder.status)}
                </Badge>
              </div>
            </div>

            {/* Customer Information */}
            <div className="mb-6">
              <h3 className="text-base font-semibold mb-3">👤 Customer Information</h3>
              <div className="space-y-2 text-sm">
                <div><strong>User ID:</strong> {selectedOrder.userId}</div>
              </div>
            </div>

            {/* Delivery Address */}
            <div className="mb-6">
              <h3 className="text-base font-semibold mb-3">📍 Delivery Address</h3>
              <div className="p-4 bg-[#f9f6f0] rounded-lg">
                <p className="m-0 text-[#5e584d]">{selectedOrder.deliveryAddress}</p>
              </div>
            </div>

            {/* Products */}
            <div className="mb-6">
              <h3 className="text-base font-semibold mb-3">🛍️ Product Ordered</h3>
              <div className="p-4 bg-[#f9f6f0] rounded-lg">
                <div className="font-semibold">{selectedOrder.productName}</div>
                <div className="flex justify-between mt-2">
                  <span>Qty: {selectedOrder.quantity}</span>
                  <span>Price: ₱{selectedOrder.price.toFixed(2)}</span>
                </div>
                <div className="text-right mt-2 font-semibold">
                  Total: ₱{(selectedOrder.quantity * selectedOrder.price).toFixed(2)}
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="mb-6">
              <h3 className="text-base font-semibold mb-3">💳 Notes</h3>
              <p className="text-[#5e584d] m-0">{selectedOrder.deliveryNotes || "No additional notes"}</p>
            </div>

            {/* Order Summary */}
            <div className="bg-[#f9f6f0] p-4 rounded-lg mb-6">
              <div className="flex justify-between items-center text-lg font-semibold">
                <strong>Total Amount:</strong>
                <span>₱{selectedOrder.totalAmount.toFixed(2)}</span>
              </div>
            </div>

            {/* Delivery Tracking */}
            {selectedOrder.status === "delivered" && getDeliveryInfo(selectedOrder.id) && (
              <div className="bg-[#e8f5e9] p-4 rounded-lg mb-6">
                <h3 className="font-semibold mb-3">✅ Delivered</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <strong>Delivered Date:</strong>
                    <span>{getDeliveryInfo(selectedOrder.id)?.date}</span>
                  </div>
                  <div className="flex justify-between">
                    <strong>Delivered Time:</strong>
                    <span>{getDeliveryInfo(selectedOrder.id)?.time}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Delivery Notes */}
            <div className="mb-6">
              <h3 className="text-base font-semibold mb-3">📝 Delivery Notes</h3>
              <textarea
                value={deliveryNotes}
                onChange={(e) => setDeliveryNotes(e.target.value)}
                placeholder="Add delivery instructions, recipient name, special handling notes, etc."
                className="w-full min-h-[100px] p-3 border border-[var(--line)] rounded-lg font-inherit text-sm resize-y focus:outline-none focus:border-[var(--accent)]"
              />
              <button
                onClick={handleSaveDeliveryNotes}
                className="mt-3 px-4 py-2 bg-[#2196f3] text-white rounded-md cursor-pointer font-semibold hover:opacity-90 transition-opacity"
              >
                💾 Save Notes
              </button>
            </div>

            {/* Status Update Buttons */}
            <div className="mb-6">
              <h3 className="text-base font-semibold mb-3">🔄 Update Order Status</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {(["pending", "processing", "shipped", "delivered", "cancelled"] as const).map((status) => (
                  <button
                    key={status}
                    onClick={() => handleStatusUpdate(selectedOrder.id, status)}
                    className={`py-2.5 px-4 rounded-lg border-none cursor-pointer font-semibold transition-all duration-200 ${
                      selectedOrder.status === status
                        ? "text-white"
                        : "bg-[var(--line)] text-[var(--ink)] hover:opacity-80"
                    }`}
                    style={selectedOrder.status === status ? { backgroundColor: getStatusColor(status) } : {}}
                  >
                    {getStatusIcon(status)} {getStatusLabel(status)}
                  </button>
                ))}
              </div>
            </div>

            {/* Mark as Delivered */}
            {selectedOrder.status !== "delivered" && (
              <button
                onClick={() => handleMarkDelivered(selectedOrder.id)}
                className="w-full py-3 bg-[#4caf50] text-white rounded-lg cursor-pointer font-semibold text-base hover:opacity-90 transition-opacity"
              >
                🎉 Mark as Delivered
              </button>
            )}
          </Card>
        </div>
      )}
    </>
  );
}

