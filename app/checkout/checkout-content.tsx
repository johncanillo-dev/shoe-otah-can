"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { useCart } from "@/lib/cart-context";
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
};

export default function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const { isLoggedIn, user } = useAuth();
  const { items } = useCart();
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

  // 🔥 AUTH CHECK
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

  // 🔥 SAFE CART
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

  // ❌ EMPTY CART
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

  // 💰 TOTALS
  const checkoutTotal = checkoutItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const tax = checkoutTotal * 0.08;
  const finalTotal = checkoutTotal + tax;

  // 🔥 SUBMIT HANDLER (FULL FIX)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      // ✅ VALIDATION
      if (!user?.id) throw new Error("User not found");

      if (!firstName || !lastName || !phone || !street || !city) {
        alert("Please fill all required fields");
        return;
      }

      if (!checkoutItems.length) {
        alert("Cart is empty");
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

      // ✅ LOCAL ORDER
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

      // ✅ DATABASE SAVE
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

      // ✅ CLEAR CART
      localStorage.removeItem("cart");

      // if you have context method:
      // clearCart();

      // ✅ SUCCESS
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
      {/* 🔥 KEEP YOUR EXISTING UI HERE */}
      {/* Just make sure your form uses: */}
      
      <form onSubmit={handleSubmit}>
        {/* your inputs here */}

        <button
          type="submit"
          disabled={isSubmitting}
          className="btn btn-primary"
        >
          {isSubmitting ? "Processing..." : "Proceed to Checkout"}
        </button>
      </form>
    </section>
  );
}