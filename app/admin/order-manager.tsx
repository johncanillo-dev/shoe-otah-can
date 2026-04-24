"use client";

import { useEffect, useState } from "react";
import { useOrder, type Order, type DatabaseOrder } from "@/lib/order-context";
import { useAuth } from "@/lib/auth-context";

export function OrderManager() {
  const { orders, databaseOrders, getAllDatabaseOrders, updateDatabaseOrderStatus } = useOrder();
  const { isAdmin } = useAuth();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "confirmed" | "shipped" | "delivered">("all");
  const [dbStatusFilter, setDbStatusFilter] = useState<"all" | "pending" | "processing" | "shipped" | "delivered" | "cancelled">("all");
  const [isLoading, setIsLoading] = useState(true);
  const [deliveryNotes, setDeliveryNotes] = useState("");
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [activeTab, setActiveTab] = useState<"checkout" | "orders">("orders");
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await getAllDatabaseOrders();
      setAllOrders(orders);
      setIsLoading(false);
    };
    loadData();
  }, [orders, getAllDatabaseOrders]);

  useEffect(() => {
    if (selectedOrder) {
      const orderNotes = localStorage.getItem(`order-notes-${selectedOrder.id}`) || "";
      setDeliveryNotes(orderNotes);
    }
  }, [selectedOrder]);

  const filteredOrders = statusFilter === "all" 
    ? allOrders 
    : allOrders.filter(order => order.status === statusFilter);

  const filteredDatabaseOrders = dbStatusFilter === "all"
    ? databaseOrders
    : databaseOrders.filter(order => order.status === dbStatusFilter);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "#ff9800"; // Orange
      case "confirmed":
        return "#2196f3"; // Blue
      case "shipped":
        return "#9c27b0"; // Purple
      case "delivered":
        return "#4caf50"; // Green
      default:
        return "#757575"; // Gray
    }
  };

  const getStatusLabel = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const handleDatabaseStatusUpdate = async (orderId: string, newStatus: string) => {
    setUpdatingOrderId(orderId);
    const result = await updateDatabaseOrderStatus(orderId, newStatus);
    if (result.success) {
      await getAllDatabaseOrders();
    } else {
      alert(result.error || "Failed to update order");
    }
    setUpdatingOrderId(null);
  };

  const handleStatusUpdate = (orderId: string, newStatus: "pending" | "confirmed" | "shipped" | "delivered") => {
    const updatedOrders = allOrders.map(order =>
      order.id === orderId ? { ...order, status: newStatus } : order
    );
    
    setAllOrders(updatedOrders);
    localStorage.setItem("orders", JSON.stringify(updatedOrders));
    
    if (selectedOrder?.id === orderId) {
      setSelectedOrder({ ...selectedOrder, status: newStatus });
    }

    // Send notification (in real app, would send to backend/email service)
    const order = allOrders.find(o => o.id === orderId);
    if (order) {
      console.log(`Customer ${order.customerDetails.email} notified of status: ${newStatus}`);
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
      
      // Save delivery info
      const deliveryInfo = {
        date: deliveryDate,
        time: new Date().toLocaleTimeString(),
        notes: deliveryNotes,
      };
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
    return <div style={{ padding: "2rem", textAlign: "center" }}>Loading orders...</div>;
  }

  return (
    <>
      {/* Tabs */}
      <div style={{ display: "flex", borderBottom: "2px solid var(--line)", marginBottom: "2rem" }}>
        <button
          onClick={() => setActiveTab("orders")}
          style={{
            padding: "1rem 2rem",
            backgroundColor: activeTab === "orders" ? "var(--accent)" : "transparent",
            color: activeTab === "orders" ? "white" : "inherit",
            border: "none",
            cursor: "pointer",
            fontSize: "1rem",
            fontWeight: "600",
            borderRadius: "6px 6px 0 0",
            marginRight: "0.5rem",
          }}
        >
          Database Orders ({databaseOrders.length})
        </button>
        <button
          onClick={() => setActiveTab("checkout")}
          style={{
            padding: "1rem 2rem",
            backgroundColor: activeTab === "checkout" ? "var(--accent)" : "transparent",
            color: activeTab === "checkout" ? "white" : "inherit",
            border: "none",
            cursor: "pointer",
            fontSize: "1rem",
            fontWeight: "600",
            borderRadius: "6px 6px 0 0",
          }}
        >
          Checkout Orders ({allOrders.length})
        </button>
      </div>

      {/* Database Orders Tab */}
      {activeTab === "orders" && (
        <div className="orders-section">
          <div className="section-header">
            <h2>📦 Database Orders</h2>
            <div className="filter-buttons">
              {(["all", "pending", "processing", "shipped", "delivered", "cancelled"] as const).map((filter) => (
                <button
                  key={filter}
                  className={`filter-btn ${dbStatusFilter === filter ? "active" : ""}`}
                  onClick={() => setDbStatusFilter(filter)}
                  style={{
                    padding: "0.5rem 1rem",
                    borderRadius: "6px",
                    border: "1px solid var(--line)",
                    background: dbStatusFilter === filter ? "var(--accent)" : "transparent",
                    color: dbStatusFilter === filter ? "white" : "inherit",
                    cursor: "pointer",
                    fontSize: "0.9rem",
                    marginRight: "0.5rem",
                  }}
                >
                  {filter === "all" ? "All" : getStatusLabel(filter)}
                  {filter !== "all" && ` (${databaseOrders.filter(o => o.status === filter).length})`}
                </button>
              ))}
            </div>
          </div>

          {filteredDatabaseOrders.length === 0 ? (
            <div style={{ padding: "2rem", textAlign: "center", color: "#5e584d" }}>
              <p>No orders found</p>
            </div>
          ) : (
            <div className="orders-table-wrapper">
              <table className="orders-table">
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Product</th>
                    <th>Qty</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Address</th>
                    <th>Date</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDatabaseOrders.map((order) => (
                    <tr key={order.id}>
                      <td style={{ fontWeight: "600", fontSize: "0.85rem" }}>{order.id.substring(0, 8)}</td>
                      <td>{order.productName}</td>
                      <td>{order.quantity}</td>
                      <td style={{ fontWeight: "600" }}>₱{order.totalAmount.toFixed(2)}</td>
                      <td>
                        <span
                          style={{
                            display: "inline-block",
                            padding: "0.4rem 0.8rem",
                            borderRadius: "999px",
                            backgroundColor: 
                              order.status === "pending" ? "#ff9800" :
                              order.status === "processing" ? "#2196f3" :
                              order.status === "shipped" ? "#9c27b0" :
                              order.status === "delivered" ? "#4caf50" : "#f44336",
                            color: "white",
                            fontSize: "0.85rem",
                            fontWeight: "600",
                          }}
                        >
                          {order.status}
                        </span>
                      </td>
                      <td style={{ fontSize: "0.85rem" }}>{order.deliveryAddress.substring(0, 20)}...</td>
                      <td style={{ fontSize: "0.85rem" }}>{new Date(order.createdAt).toLocaleDateString()}</td>
                      <td>
                        <select
                          value={order.status}
                          onChange={(e) => handleDatabaseStatusUpdate(order.id, e.target.value)}
                          disabled={updatingOrderId === order.id}
                          style={{
                            padding: "0.4rem 0.8rem",
                            borderRadius: "6px",
                            border: "1px solid var(--line)",
                            backgroundColor: "white",
                            cursor: updatingOrderId === order.id ? "not-allowed" : "pointer",
                            fontSize: "0.85rem",
                          }}
                        >
                          <option value="pending">Pending</option>
                          <option value="processing">Processing</option>
                          <option value="shipped">Shipped</option>
                          <option value="delivered">Delivered</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Checkout Orders Tab */}
      {activeTab === "checkout" && (
        <>
      <div className="orders-section">
        <div className="section-header">
          <h2>📦 Checkout Orders</h2>
          <div className="filter-buttons">
            {(["all", "pending", "confirmed", "shipped", "delivered"] as const).map((filter) => (
              <button
                key={filter}
                className={`filter-btn ${statusFilter === filter ? "active" : ""}`}
                onClick={() => setStatusFilter(filter)}
                style={{
                  padding: "0.5rem 1rem",
                  borderRadius: "6px",
                  border: "1px solid var(--line)",
                  background: statusFilter === filter ? "var(--accent)" : "transparent",
                  color: statusFilter === filter ? "white" : "inherit",
                  cursor: "pointer",
                  fontSize: "0.9rem",
                  marginRight: "0.5rem",
                }}
              >
                {filter === "all" ? "All Orders" : getStatusLabel(filter)} 
                {filter !== "all" && statusFilter === "all" && ` (${allOrders.filter(o => o.status === filter).length})`}
              </button>
            ))}
          </div>
        </div>

        {filteredOrders.length === 0 ? (
          <div style={{ padding: "2rem", textAlign: "center", color: "#5e584d" }}>
            <p>No orders found</p>
          </div>
        ) : (
          <div className="orders-table-wrapper">
            <table className="orders-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => (
                  <tr key={order.id}>
                    <td style={{ fontWeight: "600" }}>{order.id}</td>
                    <td>{order.customerDetails.firstName} {order.customerDetails.lastName}</td>
                    <td>{order.customerDetails.email}</td>
                    <td>{order.customerDetails.phone}</td>
                    <td style={{ fontWeight: "600" }}>₱{order.total.toFixed(2)}</td>
                    <td>
                      <span
                        style={{
                          display: "inline-block",
                          padding: "0.4rem 0.8rem",
                          borderRadius: "999px",
                          backgroundColor: getStatusColor(order.status),
                          color: "white",
                          fontSize: "0.85rem",
                          fontWeight: "600",
                        }}
                      >
                        {getStatusLabel(order.status)}
                      </span>
                    </td>
                    <td>
                      <button
                        onClick={() => setSelectedOrder(order)}
                        style={{
                          padding: "0.4rem 0.8rem",
                          backgroundColor: "var(--ink)",
                          color: "white",
                          border: "none",
                          borderRadius: "6px",
                          cursor: "pointer",
                          fontSize: "0.85rem",
                        }}
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
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="order-details-modal">
          <div className="modal-backdrop" onClick={() => setSelectedOrder(null)} />
          <div className="modal-content">
            <button 
              className="modal-close"
              onClick={() => setSelectedOrder(null)}
              style={{
                position: "absolute",
                top: "1rem",
                right: "1rem",
                background: "none",
                border: "none",
                fontSize: "1.5rem",
                cursor: "pointer",
              }}
            >
              ×
            </button>

            <h2>📋 Order Management</h2>

            {/* Order Header */}
            <div className="detail-section">
              <div className="detail-row">
                <strong>Order ID:</strong>
                <span>{selectedOrder.id}</span>
              </div>
              <div className="detail-row">
                <strong>Date:</strong>
                <span>{new Date(selectedOrder.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="detail-row">
                <strong>Current Status:</strong>
                <span
                  style={{
                    padding: "0.4rem 0.8rem",
                    borderRadius: "999px",
                    backgroundColor: getStatusColor(selectedOrder.status),
                    color: "white",
                    fontSize: "0.9rem",
                    fontWeight: "600",
                  }}
                >
                  {getStatusLabel(selectedOrder.status)}
                </span>
              </div>
            </div>

            {/* Customer Information */}
            <div className="detail-section">
              <h3>👤 Customer Information</h3>
              <div className="detail-row">
                <strong>Name:</strong>
                <span>{selectedOrder.customerDetails.firstName} {selectedOrder.customerDetails.lastName}</span>
              </div>
              <div className="detail-row">
                <strong>Email:</strong>
                <span>{selectedOrder.customerDetails.email}</span>
              </div>
              <div className="detail-row">
                <strong>Phone:</strong>
                <span>{selectedOrder.customerDetails.phone}</span>
              </div>
            </div>

            {/* Delivery Address */}
            <div className="detail-section">
              <h3>📍 Delivery Address</h3>
              <div style={{ padding: "1rem", backgroundColor: "#f9f6f0", borderRadius: "8px" }}>
                <p style={{ margin: "0.3rem 0" }}>
                  <strong>{selectedOrder.customerDetails.firstName} {selectedOrder.customerDetails.lastName}</strong>
                </p>
                <p style={{ margin: "0.3rem 0", color: "#5e584d" }}>
                  {selectedOrder.address.street}
                </p>
                <p style={{ margin: "0.3rem 0", color: "#5e584d" }}>
                  {selectedOrder.address.barangay}, {selectedOrder.address.city}
                </p>
                <p style={{ margin: "0.3rem 0", color: "#5e584d" }}>
                  {selectedOrder.address.province} {selectedOrder.address.postalCode}
                </p>
              </div>
            </div>

            {/* Products */}
            <div className="detail-section">
              <h3>🛍️ Products Ordered</h3>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--line)" }}>
                    <th style={{ textAlign: "left", padding: "0.5rem", fontWeight: "600" }}>Product</th>
                    <th style={{ textAlign: "center", padding: "0.5rem", fontWeight: "600" }}>Qty</th>
                    <th style={{ textAlign: "right", padding: "0.5rem", fontWeight: "600" }}>Price</th>
                    <th style={{ textAlign: "right", padding: "0.5rem", fontWeight: "600" }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedOrder.items.map((item) => (
                    <tr key={item.id} style={{ borderBottom: "1px solid #ddd" }}>
                      <td style={{ padding: "0.8rem 0.5rem" }}>
                        <div>
                          <strong>{item.name}</strong>
                          <div style={{ fontSize: "0.85rem", color: "#5e584d" }}>{item.category}</div>
                        </div>
                      </td>
                      <td style={{ textAlign: "center", padding: "0.8rem 0.5rem" }}>{item.quantity}</td>
                      <td style={{ textAlign: "right", padding: "0.8rem 0.5rem" }}>₱{item.price.toFixed(2)}</td>
                      <td style={{ textAlign: "right", padding: "0.8rem 0.5rem", fontWeight: "600" }}>
                        ₱{(item.price * item.quantity).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Payment Information */}
            <div className="detail-section">
              <h3>💳 Payment Information</h3>
              <div className="detail-row">
                <strong>Method:</strong>
                <span style={{ textTransform: "capitalize" }}>
                  {selectedOrder.paymentMethod === "cash" ? "💵 Cash on Delivery" :
                   selectedOrder.paymentMethod === "gcash" ? "📱 GCash" :
                   selectedOrder.paymentMethod === "paymaya" ? "💳 PayMaya" :
                   selectedOrder.paymentMethod === "bankTransfer" ? "🏦 Bank Transfer" :
                   selectedOrder.paymentMethod}
                </span>
              </div>
            </div>

            {/* Order Summary */}
            <div className="detail-section" style={{ backgroundColor: "#f9f6f0", padding: "1rem", borderRadius: "8px" }}>
              <div className="detail-row">
                <strong>Subtotal:</strong>
                <span>₱{selectedOrder.subtotal.toFixed(2)}</span>
              </div>
              <div className="detail-row">
                <strong>Tax (8%):</strong>
                <span>₱{selectedOrder.tax.toFixed(2)}</span>
              </div>
              <div className="detail-row" style={{ fontSize: "1.1rem", fontWeight: "600", borderTop: "1px solid var(--line)", paddingTop: "0.5rem" }}>
                <strong>Total:</strong>
                <span>₱{selectedOrder.total.toFixed(2)}</span>
              </div>
            </div>

            {/* Delivery Tracking */}
            {selectedOrder.status === "delivered" && getDeliveryInfo(selectedOrder.id) && (
              <div className="detail-section" style={{ backgroundColor: "#e8f5e9", padding: "1rem", borderRadius: "8px" }}>
                <h3 style={{ margin: "0 0 1rem" }}>✅ Delivered</h3>
                <div className="detail-row">
                  <strong>Delivered Date:</strong>
                  <span>{getDeliveryInfo(selectedOrder.id)?.date}</span>
                </div>
                <div className="detail-row">
                  <strong>Delivered Time:</strong>
                  <span>{getDeliveryInfo(selectedOrder.id)?.time}</span>
                </div>
              </div>
            )}

            {/* Delivery Notes */}
            <div className="detail-section">
              <h3>📝 Delivery Notes</h3>
              <textarea
                value={deliveryNotes}
                onChange={(e) => setDeliveryNotes(e.target.value)}
                placeholder="Add delivery instructions, recipient name, special handling notes, etc."
                style={{
                  width: "100%",
                  minHeight: "100px",
                  padding: "0.8rem",
                  border: "1px solid var(--line)",
                  borderRadius: "8px",
                  fontFamily: "inherit",
                  fontSize: "0.95rem",
                  resize: "vertical",
                }}
              />
              <button
                onClick={handleSaveDeliveryNotes}
                style={{
                  marginTop: "0.8rem",
                  padding: "0.6rem 1rem",
                  backgroundColor: "#2196f3",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontWeight: "600",
                }}
              >
                💾 Save Notes
              </button>
            </div>

            {/* Status Update Buttons */}
            <div className="detail-section">
              <h3>🔄 Update Order Status</h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "0.8rem" }}>
                {(["pending", "confirmed", "shipped", "delivered"] as const).map((status) => (
                  <button
                    key={status}
                    onClick={() => handleStatusUpdate(selectedOrder.id, status)}
                    style={{
                      padding: "0.8rem 1rem",
                      backgroundColor: selectedOrder.status === status ? getStatusColor(status) : "var(--line)",
                      color: selectedOrder.status === status ? "white" : "var(--ink)",
                      border: "none",
                      borderRadius: "6px",
                      cursor: "pointer",
                      fontWeight: "600",
                      transition: "all 0.2s",
                      fontSize: "0.95rem",
                    }}
                    onMouseOver={(e) => {
                      if (selectedOrder.status !== status) {
                        e.currentTarget.style.opacity = "0.8";
                      }
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.opacity = "1";
                    }}
                  >
                    {status === "pending" ? "⏳" : 
                     status === "confirmed" ? "✅" :
                     status === "shipped" ? "📦" :
                     "🚚"} {getStatusLabel(status)}
                  </button>
                ))}
              </div>
            </div>

            {/* Mark as Delivered */}
            {selectedOrder.status !== "delivered" && (
              <div className="detail-section">
                <button
                  onClick={() => handleMarkDelivered(selectedOrder.id)}
                  style={{
                    width: "100%",
                    padding: "1rem",
                    backgroundColor: "#4caf50",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontWeight: "600",
                    fontSize: "1rem",
                  }}
                >
                  🎉 Mark as Delivered
                </button>
              </div>
            )}
          </div>
        </>
      )}

      <style jsx>{`
        .orders-table-wrapper {
          overflow-x: auto;
          border: 1px solid var(--line);
          border-radius: 12px;
        }

        .orders-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.95rem;
        }

        .orders-table thead {
          background: #f9f6f0;
          font-weight: 600;
        }

        .orders-table th {
          padding: 1rem;
          text-align: left;
          border-bottom: 2px solid var(--line);
        }

        .orders-table td {
          padding: 1rem;
          border-bottom: 1px solid var(--line);
        }

        .orders-table tbody tr:hover {
          background: #fbf7ee;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .section-header h2 {
          margin: 0;
          font-family: var(--font-display), sans-serif;
          font-size: 1.5rem;
        }

        .filter-buttons {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
        }

        .order-details-modal {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 1000;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .modal-backdrop {
          position: absolute;
          inset: 0;
          background: rgba(0, 0, 0, 0.5);
        }

        .modal-content {
          position: relative;
          background: white;
          border-radius: 12px;
          padding: 2rem;
          max-width: 700px;
          max-height: 90vh;
          overflow-y: auto;
          width: 95vw;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
        }

        .modal-content h2 {
          margin: 0 0 1.5rem;
          font-family: var(--font-display), sans-serif;
        }

        .modal-content h3 {
          margin: 1.5rem 0 1rem;
          font-family: var(--font-display), sans-serif;
          font-size: 1.1rem;
        }

        .detail-section {
          margin-bottom: 1.5rem;
        }

        .detail-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.6rem 0;
          border-bottom: 1px solid #ddd;
        }

        .detail-row strong {
          color: var(--ink);
        }

        @media (max-width: 768px) {
          .section-header {
            flex-direction: column;
            align-items: flex-start;
          }

          .orders-table {
            font-size: 0.85rem;
          }

          .orders-table th,
          .orders-table td {
            padding: 0.6rem;
          }

          .modal-content {
            padding: 1.5rem;
          }
        }
      `}</style>
    </>
  );
}
