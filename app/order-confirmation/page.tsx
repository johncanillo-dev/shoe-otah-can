"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useOrder } from "@/lib/order-context";
import { useCart } from "@/lib/cart-context";

export default function OrderConfirmationPage() {
  const router = useRouter();
  const { isLoggedIn } = useAuth();
  const { currentOrder, clearCurrentOrder } = useOrder();
  const { clearCart } = useCart();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isLoggedIn) {
      router.push("/login");
    } else if (!currentOrder) {
      router.push("/");
    } else {
      setIsLoading(false);
      clearCart();
    }
  }, [isLoggedIn, router, currentOrder]);

  if (isLoading || !currentOrder) {
    return (
      <section className="auth-shell">
        <div className="auth-card">
          <p className="kicker">Loading...</p>
        </div>
      </section>
    );
  }

  const paymentMethodLabel = {
    cash: "Cash on Delivery",
    cod: "Cash on Delivery",
    gcash: "GCash",
    paymaya: "PayMaya",
    bankTransfer: "Bank Transfer",
  }[currentOrder.paymentMethod];

  return (
    <section className="order-confirmation-shell container">
      <div className="confirmation-card">
        <div className="success-icon">✓</div>
        <h1>Order Confirmed!</h1>
        <p className="order-id">Order ID: <strong>{currentOrder.id}</strong></p>
        <p className="order-date">
          Placed on: <strong>{new Date(currentOrder.createdAt).toLocaleDateString()}</strong>
        </p>

        {/* Customer & Delivery Info */}
        <div className="info-section">
          <div className="info-group">
            <h3>Delivery To</h3>
            <p>
              <strong>{currentOrder.customerDetails.firstName} {currentOrder.customerDetails.lastName}</strong><br />
              {currentOrder.address.street}<br />
              {currentOrder.address.barangay}, {currentOrder.address.city}<br />
              {currentOrder.address.province} {currentOrder.address.postalCode}
            </p>
            <p className="contact-info">
              Email: {currentOrder.customerDetails.email}<br />
              Phone: {currentOrder.customerDetails.phone}
            </p>
          </div>

          <div className="info-group">
            <h3>Payment Method</h3>
            <p className="payment-badge">{paymentMethodLabel}</p>
            {currentOrder.paymentMethod !== "cash" && (
              <p className="payment-note">
                Payment link will be sent to your email shortly.
              </p>
            )}
            {currentOrder.paymentMethod === "cash" && (
              <p className="payment-note">
                Please prepare the exact amount. Our driver will verify upon delivery.
              </p>
            )}
          </div>
        </div>

        {/* Order Items */}
        <div className="order-items-section">
          <h3>Order Items</h3>
          <div className="order-items-list">
            {currentOrder.items.map((item) => (
              <div key={item.id} className="order-item">
                <div className="item-details">
                  <p className="item-name">{item.name}</p>
                  <small className="item-category">{item.category}</small>
                </div>
                <div className="item-qty">Qty: {item.quantity}</div>
                <p className="item-price">₱{(item.price * item.quantity).toFixed(2)}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Order Summary */}
        <div className="order-summary">
          <div className="summary-line">
            <span>Subtotal:</span>
            <strong>₱{currentOrder.subtotal.toFixed(2)}</strong>
          </div>
          <div className="summary-line">
            <span>Shipping:</span>
            <strong>Free</strong>
          </div>
          <div className="summary-line">
            <span>Tax:</span>
            <strong>₱{currentOrder.tax.toFixed(2)}</strong>
          </div>
          <div className="summary-line summary-total">
            <span>Total:</span>
            <strong>₱{currentOrder.total.toFixed(2)}</strong>
          </div>
        </div>

        {/* Next Steps */}
        <div className="next-steps">
          <h3>What's Next?</h3>
          <ol>
            <li>We'll process your order and confirm via email</li>
            <li>Your order will be packed and prepared for shipment</li>
            <li>You'll receive a tracking number via SMS and email</li>
            <li>Your order will arrive within 3-5 business days</li>
          </ol>
        </div>

        {/* Actions */}
        <div className="confirmation-actions">
          <Link href="/" className="btn btn-primary">
            Continue Shopping
          </Link>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => {
              clearCurrentOrder();
              router.push("/");
            }}
          >
            Back to Home
          </button>
        </div>
      </div>
    </section>
  );
}
