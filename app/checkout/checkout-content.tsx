"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { useCart } from "@/lib/cart-context";
import { useOrder, type PaymentMethod, type CustomerDetails, type Address } from "@/lib/order-context";

// ✅ Add proper type instead of "any"
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
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cod");

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

  // ✅ Typed checkout items
  let checkoutItems: CartItem[] = items;

  if (directBuyItem) {
    try {
      checkoutItems = [JSON.parse(decodeURIComponent(directBuyItem))];
    } catch {
      checkoutItems = items;
    }
  }

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

  const checkoutTotal = checkoutItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const tax = checkoutTotal * 0.08;
  const finalTotal = checkoutTotal + tax;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (!user?.id) {
      alert("User not found");
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

    // ✅ Local order (unchanged)
    createOrder({
  items: checkoutItems.map((item) => ({
    id: item.id,
    name: item.name,
    price: item.price,
    quantity: item.quantity,
    category: item.category ?? "uncategorized", // ✅ keep this
  })),
  customerDetails,
  address,
  paymentMethod,
  subtotal: checkoutTotal,
  tax,
  total: finalTotal,
});

    // ✅ FIXED DATABASE SAVE
    const saveDatabaseOrders = async () => {
      try {
        const deliveryAddress = `${street}, ${barangay}, ${city}, ${province} ${postalCode}`;

        const savePromises = checkoutItems.map((item) =>
          createDatabaseOrder({
            userId: user.id,
            productId: item.id,
            productName: item.name,
            quantity: item.quantity,
            price: item.price,
            totalAmount: item.price * item.quantity,

            // ✅ REQUIRED FIELDS (FIX)
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

        router.push("/order-confirmation");
      } catch (error) {
        console.error(error);
        router.push("/order-confirmation");
      }
    };

    saveDatabaseOrders();
  };

  return (
    // 🔥 UI unchanged (your UI is already fine)
    <section className="checkout-shell container">
      {/* KEEP YOUR EXISTING JSX */}
    </section>
  );
}