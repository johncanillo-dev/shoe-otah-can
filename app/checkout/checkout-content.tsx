"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { useCart } from "@/lib/cart-context";
import { useOrder, type PaymentMethod, type CustomerDetails, type Address } from "@/lib/order-context";

export default function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isLoggedIn, user } = useAuth();
  const { items, total } = useCart();
  const { createOrder, createDatabaseOrder } = useOrder();
  
  const directBuyItem = searchParams.get("item");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [street, setStreet] = useState("");
  const [barangay, setBarangay] = useState("");
  const [city, setCity] = useState("");
  const [province, setProvince] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cod");

  useEffect(() => {
    if (!isLoggedIn) {
      router.push("/login");
    } else {
      setIsLoading(false);
      // Pre-fill email with user's email
      if (user?.email) setEmail(user.email);
      if (user?.name) setFirstName(user.name.split(" ")[0]);
    }
  }, [isLoggedIn, router, user]);

  if (isLoading) {
    return (
      <section className="auth-shell">
        <div className="auth-card">
          <p className="kicker">Loading...</p>
        </div>
      </section>
    );
  }

  // Get items to checkout
  let checkoutItems = items;
  if (directBuyItem) {
    try {
      checkoutItems = [JSON.parse(decodeURIComponent(directBuyItem))];
    } catch (e) {
      checkoutItems = items;
    }
  }

  if (!checkoutItems || checkoutItems.length === 0) {
    return (
      <section className="auth-shell">
        <div className="auth-card">
          <p className="kicker">Checkout</p>
          <h1>No Items</h1>
          <p style={{ marginTop: "1rem", color: "#5e584d" }}>
            Please add items to checkout.
          </p>
          <Link href="/" className="btn btn-primary" style={{ marginTop: "1.5rem", display: "inline-block" }}>
            Continue Shopping
          </Link>
        </div>
      </section>
    );
  }

  const checkoutTotal = checkoutItems.reduce((sum: number, item: any) => sum + item.price * item.quantity, 0);
  const tax = checkoutTotal * 0.08;
  const finalTotal = checkoutTotal + tax;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Validate form
    if (!firstName || !lastName || !email || !phone || !street || !barangay || !city || !province || !postalCode) {
      alert("Please fill in all fields.");
      setIsSubmitting(false);
      return;
    }

    if (!user?.id) {
      alert("Error: User ID not found. Please log in again.");
      setIsSubmitting(false);
      return;
    }

    const customerDetails: CustomerDetails = {
      firstName,
      lastName,
      email,
      phone,
    };

    const address: Address = {
      street,
      barangay,
      city,
      province,
      postalCode,
    };

    // Create local order first (for local state management)
    createOrder({
      items: checkoutItems.map((item: any) => ({
        id: item.id,
        name: item.name,
        price: item.price,
        category: item.category,
        quantity: item.quantity,
      })),
      customerDetails,
      address,
      paymentMethod,
      subtotal: checkoutTotal,
      tax,
      total: finalTotal,
    });

    // Save each item to Supabase database for admin to see
    const saveDatabaseOrders = async () => {
      try {
        const deliveryAddress = `${street}, ${barangay}, ${city}, ${province} ${postalCode}`;
        
        // Create a database order for each item in the cart
        const savePromises = checkoutItems.map((item: any) =>
          createDatabaseOrder({
            userId: user.id,
            productId: item.id,
            productName: item.name,
            quantity: item.quantity,
            price: item.price,
            totalAmount: item.price * item.quantity,
            status: "pending",
            deliveryAddress,
            deliveryNotes: `Payment method: ${paymentMethod}. Buyer: ${firstName} ${lastName}. Phone: ${phone}`,
            estimatedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          })
        );

        const results = await Promise.all(savePromises);
        
        // Check if all orders were saved successfully
        const allSuccess = results.every(r => r.success);
        
        if (!allSuccess) {
          console.warn("Some orders failed to save to database, but proceeding anyway");
        }

        // Redirect to order confirmation after saving
        setTimeout(() => {
          router.push("/order-confirmation");
        }, 500);
      } catch (error) {
        console.error("Error saving orders to database:", error);
        alert("Order placed but failed to sync to database. Admin will review manually.");
        // Still redirect to order confirmation
        setTimeout(() => {
          router.push("/order-confirmation");
        }, 500);
      }
    };

    saveDatabaseOrders();
  };

  return (
    <section className="checkout-shell container">
      <div className="checkout-head">
        <h1>Checkout</h1>
      </div>

      <div className="checkout-layout">
        <div className="checkout-form">
          <form onSubmit={handleSubmit}>
            {/* Personal Details */}
            <fieldset className="form-section">
              <legend className="form-legend">Personal Details</legend>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="firstName">First Name *</label>
                  <input
                    id="firstName"
                    type="text"
                    placeholder="John"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="lastName">Last Name *</label>
                  <input
                    id="lastName"
                    type="text"
                    placeholder="Doe"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="email">Email *</label>
                  <input
                    id="email"
                    type="email"
                    placeholder="john@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="phone">Phone Number *</label>
                  <input
                    id="phone"
                    type="tel"
                    placeholder="+63 912 345 6789"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                  />
                </div>
              </div>
            </fieldset>

            {/* Delivery Address */}
            <fieldset className="form-section">
              <legend className="form-legend">Delivery Address</legend>
              
              <div className="form-group">
                <label htmlFor="street">Street Address *</label>
                <input
                  id="street"
                  type="text"
                  placeholder="123 Main Street"
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="barangay">Barangay *</label>
                  <input
                    id="barangay"
                    type="text"
                    placeholder="San Juan"
                    value={barangay}
                    onChange={(e) => setBarangay(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="city">City/Municipality *</label>
                  <input
                    id="city"
                    type="text"
                    placeholder="Manila"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="province">Province *</label>
                  <input
                    id="province"
                    type="text"
                    placeholder="Metro Manila"
                    value={province}
                    onChange={(e) => setProvince(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="postalCode">Postal Code *</label>
                  <input
                    id="postalCode"
                    type="text"
                    placeholder="1000"
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    required
                  />
                </div>
              </div>
            </fieldset>

            {/* Payment Method */}
            <fieldset className="form-section">
              <legend className="form-legend">Payment Method</legend>
              
              <div className="payment-options">
                <label className="payment-option">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="cod"
                    checked={paymentMethod === "cod"}
                    onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                  />
                  <span className="payment-label">
                    <strong>💸 Cash on Delivery</strong>
                    <small>Pay when your order arrives</small>
                  </span>
                </label>

                <label className="payment-option">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="gcash"
                    checked={paymentMethod === "gcash"}
                    onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                  />
                  <span className="payment-label">
                    <strong>GCash</strong>
                    <small>Mobile payment via GCash</small>
                  </span>
                </label>

                <label className="payment-option">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="paymaya"
                    checked={paymentMethod === "paymaya"}
                    onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                  />
                  <span className="payment-label">
                    <strong>PayMaya</strong>
                    <small>Online payment via PayMaya</small>
                  </span>
                </label>

                <label className="payment-option">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="bankTransfer"
                    checked={paymentMethod === "bankTransfer"}
                    onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                  />
                  <span className="payment-label">
                    <strong>Bank Transfer</strong>
                    <small>Direct bank transfer</small>
                  </span>
                </label>
              </div>
            </fieldset>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting}
              style={{ width: "100%", marginTop: "2rem" }}
            >
              {isSubmitting ? "Processing..." : "Place Order"}
            </button>
          </form>
        </div>

        {/* Order Summary */}
        <div className="checkout-summary">
          <div className="summary-card">
            <h2>Order Summary</h2>
            <div className="order-items">
              {checkoutItems.map((item: any) => (
                <div key={item.id} className="order-item-row">
                  <div>
                    <p className="item-name">{item.name}</p>
                    <small className="item-qty">Qty: {item.quantity}</small>
                  </div>
                  <p className="item-price">₱{(item.price * item.quantity).toFixed(2)}</p>
                </div>
              ))}
            </div>

            <div className="summary-divider"></div>

            <div className="summary-line">
              <span>Subtotal:</span>
              <strong>₱{checkoutTotal.toFixed(2)}</strong>
            </div>
            <div className="summary-line">
              <span>Shipping:</span>
              <strong>Free</strong>
            </div>
            <div className="summary-line">
              <span>Tax (8%):</span>
              <strong>₱{tax.toFixed(2)}</strong>
            </div>
            <div className="summary-line summary-total">
              <span>Total:</span>
              <strong>₱{finalTotal.toFixed(2)}</strong>
            </div>

            <Link href="/" className="btn btn-secondary" style={{ width: "100%", textAlign: "center", marginTop: "1rem" }}>
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
