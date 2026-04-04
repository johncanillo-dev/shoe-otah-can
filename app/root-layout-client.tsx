"use client";

import { Suspense } from "react";
import { CartProvider } from "@/lib/cart-context";
import { AuthProvider } from "@/lib/auth-context";
import { OrderProvider } from "@/lib/order-context";
import { SellerProvider } from "@/lib/seller-context";
import { ChatProvider } from "@/lib/chat-context";
import { InitializeAdmin } from "@/app/components/initialize-admin";
import { LayoutClient } from "./layout-client";

export default function RootLayoutClient({ children }: { children: React.ReactNode }) {
  return (
    <>
      <InitializeAdmin />
      <AuthProvider>
        <SellerProvider>
          <ChatProvider>
            <CartProvider>
              <OrderProvider>
                <Suspense fallback={<header className="site-header"><div className="container">Loading...</div></header>}>
                  <LayoutClient>{children}</LayoutClient>
                </Suspense>
              </OrderProvider>
            </CartProvider>
          </ChatProvider>
        </SellerProvider>
      </AuthProvider>
    </>
  );
}
