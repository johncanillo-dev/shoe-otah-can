"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { useCart } from "@/lib/cart-context";
import { useAppSettings } from "@/lib/app-settings-context";
import {
  useOrder,
  type PaymentMethod,
  type CustomerDetails,
  type Address,
} from "@/lib/order-context";

type CartItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  category?: string;
  image?: string;
};

export default function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const { isLoggedIn, user } = useAuth();
  const { items, clearCart } = useCart();
  const { settings } = useAppSettings();
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
  const [paymentMethod, setPaymentMethod] =
    useState<PaymentMethod>("cod");

  // Auth check
  useEffect(() => {
    if (!isLoggedIn) {
      router.push("/login");
    } else {
      setIsLoading(false);
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

  // Safe cart
  let checkoutItems: CartItem[] = items || [];

  if (directBuyItem) {
    try {
      checkoutItems = [
        JSON.parse(decodeURIComponent(directBuyItem)),
      ];
    } catch {
      checkoutItems = items || [];
    }
  }

  // Empty cart
  if (!checkoutItems.length) {
    return (
      <section className="auth-shell">
        <div className="auth-card">
          <p className="kicker">Checkout</p>
          <h1>No Items</h1>
          <Link href="/" className="btn btn-primary">
            Continue Shopping
          </Link>
        </div>
      </section>
    );
  }

  // Totals
  const checkoutTotal = checkoutItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const tax = checkoutTotal * 0.08;
  const deliveryFee = checkoutTotal >= settings.free_shipping_threshold ? 0 : settings.delivery_fee;
  const finalTotal = checkoutTotal + tax + deliveryFee;

  // Submit handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      if (!user?.id) throw new Error("User not found");

      if (!firstName || !lastName || !phone || !street || !city) {
        alert("Please fill all required fields");
        setIsSubmitting(false);
        return;
      }

      if (!checkoutItems.length) {
        alert("Cart is empty");
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

      // Local order
      createOrder({
        items: checkoutItems.map((item) => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          category: item.category ?? "uncategorized",
        })),
        customerDetails,
        address,
        paymentMethod,
        subtotal: checkoutTotal,
        tax,
        total: finalTotal,
      });

      // Database save
      const deliveryAddress = `${street}, ${barangay}, ${city}, ${province} ${postalCode}`;

      const savePromises = checkoutItems.map((item) =>
        createDatabaseOrder({
          userId: user.id,
          productId: item.id,
          productName: item.name,
          quantity: item.quantity,
          price: item.price,
          totalAmount: item.price * item.quantity,
          status: "pending",
          isDelivered: false,
          deliveryAddress,
          deliveryNotes: `Payment: ${paymentMethod} | ${firstName} ${lastName} | ${phone}`,
          estimatedDelivery: new Date(
            Date.now() + 7 * 24 * 60 * 60 * 1000
          )
            .toISOString()
            .split("T")[0],
        })
      );

      await Promise.all(savePromises);

      // Clear cart
      clearCart();

      // Success
      router.push("/order-confirmation");
    } catch (error) {
      console.error("Checkout error:", error);
      alert("Checkout failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="checkout-shell container">
      <div className="checkout-head">
        <h1>Checkout</h1>
      </div>

      <div className="checkout-layout">
        {/* Form */}
        <div className="checkout-form">
          <form onSubmit={handleSubmit}>
            {/* Contact Information */}
            <fieldset className="form-section">
              <legend className="form-legend">Contact Information</legend>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="firstName">First Name *</label>
                  <input
                    id="firstName"
                    type="text"
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
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="email">Email</label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="phone">Phone *</label>
                  <input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                  />
                </div>
              </div>
            </fieldset>

            {/* Shipping Address */}
            <fieldset className="form-section">
              <legend className="form-legend">Shipping Address</legend>
              <div className="form-group">
                <label htmlFor="street">Street Address *</label>
                <input
                  id="street"
                  type="text"
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                  required
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="barangay">Barangay</label>
                  <input
                    id="barangay"
                    type="text"
                    value={barangay}
                    onChange={(e) => setBarangay(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="city">City / Municipality *</label>
                  <input
                    id="city"
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="province">Province</label>
                  <input
                    id="province"
                    type="text"
                    value={province}
                    onChange={(e) => setProvince(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="postalCode">Postal Code</label>
                  <input
                    id="postalCode"
                    type="text"
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                  />
                </div>
              </div>
            </fieldset>

            {/* Payment Method */}
            <fieldset className="form-section">
              <legend className="form-legend">Payment Method</legend>
              <div className="payment-options">
                {([
                  { value: "cod", label: "Cash on Delivery (COD)", desc: "Pay when you receive your order", enabled: settings.enable_cod },
                  { value: "gcash", label: "GCash", desc: "Pay via GCash e-wallet", enabled: settings.enable_gcash },
                  { value: "paymaya", label: "PayMaya", desc: "Pay via PayMaya", enabled: settings.enable_paymaya },
                  { value: "bankTransfer", label: "Bank Transfer", desc: "Transfer to our bank account", enabled: settings.enable_bank_transfer },
                ] as { value: PaymentMethod; label: string; desc: string; enabled: boolean }[]).filter(o => o.enabled).map((option) => (
                  <label key={option.value} className="payment-option">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value={option.value}
                      checked={paymentMethod === option.value}
                      onChange={() => setPaymentMethod(option.value)}
                    />
                    <span className="payment-label">
                      <strong>{option.label}</strong>
                      <small>{option.desc}</small>
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn btn-primary"
              style={{ width: "100%", marginTop: "1rem" }}
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
              {checkoutItems.map((item) => (
                <div key={item.id} className="order-item-row">
                  <div>
                    <p className="item-name">{item.name}</p>
                    <p className="item-qty">Qty: {item.quantity}</p>
                  </div>
                  <p className="item-price">
                    ₱{(item.price * item.quantity).toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
            <div className="summary-divider" />
            <div className="summary-line">
              <span>Subtotal</span>
              <strong>₱{checkoutTotal.toFixed(2)}</strong>
            </div>
            <div className="summary-line">
              <span>Tax (8%)</span>
              <strong>₱{tax.toFixed(2)}</strong>
            </div>
            <div className="summary-line">
              <span>Shipping</span>
              <strong>{deliveryFee === 0 ? 'Free' : '₱' + deliveryFee.toFixed(2)}</strong>
            </div>
            <div className="summary-line summary-total">
              <span>Total</span>
              <strong>₱{finalTotal.toFixed(2)}</strong>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

