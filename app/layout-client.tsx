"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useSeller } from "@/lib/seller-context";
import { useShopBranding } from "@/lib/shop-context";
import { QuickUserSettings } from "@/app/components/quick-user-settings";
import { QuickSellerSettings } from "@/app/components/quick-seller-settings";
import { NotificationBell } from "@/app/components/notification-bell";

function HeaderContent() {
  const { user, isLoggedIn, logout } = useAuth();
  const { seller, isSellerLoggedIn, sellerLogout } = useSeller();
  const pathname = usePathname();
  const isAuthPage = pathname === "/login" || pathname === "/register" || pathname === "/seller-register";
  const isAdminPage = pathname.startsWith("/admin");

  return (
    <>
      {isSellerLoggedIn && seller && !isAuthPage ? (
        <>
          {/* Seller Navigation */}
          {!isAdminPage && <Link href="/">Shop</Link>}
          <Link href="/seller" style={{ fontWeight: "600", color: "var(--accent)" }}>
            👤 Seller Dashboard
          </Link>

          {/* Seller Account Section */}
          <span className="user-info" style={{ position: "relative", display: "inline-flex", alignItems: "center", gap: "0.5rem" }}>
            👤 {seller.name}
            <button
              onClick={() => {
                sellerLogout();
              }}
              className="btn-logout"
              style={{
                background: "none",
                border: "none",
                color: "inherit",
                cursor: "pointer",
                marginLeft: "0.5rem",
                textDecoration: "underline",
              }}
            >
              Logout
            </button>
            <QuickSellerSettings />
          </span>
        </>
      ) : isLoggedIn && !isAuthPage ? (
        <>
          {/* Regular Customer Navigation */}
          {!isAdminPage && <Link href="/">Shop</Link>}
          {!isAdminPage && <Link href="/cart">Cart</Link>}
          <Link href="/dashboard" style={{ fontWeight: "600", color: "var(--accent)" }}>
            📊 My Dashboard
          </Link>
          <NotificationBell />

          {/* User Account Section */}
          <span className="user-info" style={{ position: "relative", display: "inline-flex", alignItems: "center", gap: "0.5rem" }}>
            👋 Welcome, {user?.name}!
            <button
              onClick={logout}
              className="btn-logout"
              style={{
                background: "none",
                border: "none",
                color: "inherit",
                cursor: "pointer",
                marginLeft: "0.5rem",
                textDecoration: "underline",
              }}
            >
              Logout
            </button>
            <QuickUserSettings />
          </span>
        </>
      ) : (
        <>
          {/* Guest Navigation */}
          <Link href="/">Shop</Link>
          <Link href="/login">Login</Link>
          <Link href="/register">Register</Link>
        </>
      )}
    </>
  );
}

function MainContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isShopBgPage = pathname === "/login";

  return (
    <main className={isShopBgPage ? "shop-bg" : undefined} style={{ minHeight: "calc(100vh - 74px)" }}>
      {children}
    </main>
  );
}

export function LayoutClient({ children }: { children: React.ReactNode }) {
  const { branding } = useShopBranding();

  return (
    <>
      <header
        style={{
          backgroundColor: "var(--bg-secondary)",
          padding: "1rem 2rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: "1px solid var(--border-color)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", fontWeight: "bold", fontSize: "1.5rem", color: "var(--accent)" }}>
          <img 
            key={branding.logo_url}
            src={branding.logo_url || "/shoe-otah-logo.png"} 
            alt="Shoe Otah Boutique Logo"
            style={{ width: "45px", height: "45px", objectFit: "contain" }}
          />
          {branding.shop_name || "Shoe Otah Boutique"}
        </div>
        <nav style={{ display: "flex", gap: "2rem", alignItems: "center" }}>
          <HeaderContent />
        </nav>
      </header>
      <MainContent>{children}</MainContent>
    </>
  );
}
