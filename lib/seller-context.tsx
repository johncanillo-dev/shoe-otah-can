"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export interface SellerUser {
  id: string;
  email: string;
  name: string;
  shopName: string;
  city: string;
  isActive: boolean;
  createdAt: string;
  icon?: string;
  phone?: string;
  description?: string;
}

interface SellerProduct {
  id: string;
  sellerId: string;
  name: string;
  category: "Shoes" | "Shirts" | "Slippers" | "Sacks";
  price: number;
  description: string;
  image?: string;
  videoUrl?: string;
  isEcoFriendly: boolean;
  createdAt: string;
  status: "pending" | "approved" | "rejected";
}

interface SellerContextType {
  seller: SellerUser | null;
  isSellerLoggedIn: boolean;
  sellerProducts: SellerProduct[];
  allSellers: SellerUser[];
  allSellerProducts: SellerProduct[];
  sellerLogin: (email: string, password: string, name: string, shopName: string, city: string) => boolean;
  sellerLogout: () => void;
  addSellerProduct: (product: Omit<SellerProduct, "id" | "createdAt" | "sellerId">) => void;
  updateSellerProduct: (id: string, product: Partial<SellerProduct>) => void;
  deleteSellerProduct: (id: string) => void;
  disableSeller: (sellerId: string) => void;
  enableSeller: (sellerId: string) => void;
  deleteSeller: (sellerId: string) => void;
  getSellerById: (sellerId: string) => SellerUser | null;
  getSellerProducts: (sellerId: string) => SellerProduct[];
  approveProduct: (productId: string) => void;
  rejectProduct: (productId: string) => void;
  getPendingProducts: () => SellerProduct[];
  getApprovedProducts: () => SellerProduct[];
  updateSellerProfile: (seller: SellerUser) => void;
}

const SellerContext = createContext<SellerContextType | undefined>(undefined);

const SELLER_STORAGE_KEY = "seller_user";
const SELLER_PRODUCTS_KEY = "seller_products";
const ALL_SELLERS_KEY = "all_sellers";
const ALL_SELLER_PRODUCTS_KEY = "all_seller_products";

export function SellerProvider({ children }: { children: ReactNode }) {
  const [seller, setSeller] = useState<SellerUser | null>(null);
  const [sellerProducts, setSellerProducts] = useState<SellerProduct[]>([]);
  const [allSellers, setAllSellers] = useState<SellerUser[]>([]);
  const [allSellerProducts, setAllSellerProducts] = useState<SellerProduct[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  // Hydrate from localStorage on mount
  useEffect(() => {
    const storedSeller = localStorage.getItem(SELLER_STORAGE_KEY);
    const storedProducts = localStorage.getItem(SELLER_PRODUCTS_KEY);
    const storedAllSellers = localStorage.getItem(ALL_SELLERS_KEY);
    const storedAllProducts = localStorage.getItem(ALL_SELLER_PRODUCTS_KEY);

    if (storedSeller) {
      try {
        setSeller(JSON.parse(storedSeller));
      } catch (e) {
        console.error("Failed to parse stored seller:", e);
        localStorage.removeItem(SELLER_STORAGE_KEY);
      }
    }

    if (storedProducts) {
      try {
        setSellerProducts(JSON.parse(storedProducts));
      } catch (e) {
        console.error("Failed to parse stored products:", e);
      }
    }

    if (storedAllSellers) {
      try {
        setAllSellers(JSON.parse(storedAllSellers));
      } catch (e) {
        console.error("Failed to parse all sellers:", e);
      }
    }

    if (storedAllProducts) {
      try {
        setAllSellerProducts(JSON.parse(storedAllProducts));
      } catch (e) {
        console.error("Failed to parse all seller products:", e);
      }
    }

    setIsHydrated(true);
  }, []);

  const sellerLogin = (email: string, password: string, name: string, shopName: string, city: string): boolean => {
    if (!email || !password || !name || !shopName || !city) {
      return false;
    }

    const newSeller: SellerUser = {
      id: `seller-${Date.now()}`,
      email,
      name,
      shopName,
      city,
      isActive: true,
      createdAt: new Date().toISOString(),
    };

    setSeller(newSeller);
    localStorage.setItem(SELLER_STORAGE_KEY, JSON.stringify(newSeller));

    // Add to all sellers list
    const updated = [...allSellers, newSeller];
    setAllSellers(updated);
    localStorage.setItem(ALL_SELLERS_KEY, JSON.stringify(updated));

    return true;
  };

  const sellerLogout = () => {
    setSeller(null);
    localStorage.removeItem(SELLER_STORAGE_KEY);
  };

  const addSellerProduct = (product: Omit<SellerProduct, "id" | "createdAt" | "sellerId" | "status">) => {
    if (!seller) return;

    const newProduct: SellerProduct = {
      ...product,
      id: `prod-${Date.now()}`,
      sellerId: seller.id,
      createdAt: new Date().toISOString(),
      status: "pending",
    };

    const updatedLocal = [...sellerProducts, newProduct];
    setSellerProducts(updatedLocal);
    localStorage.setItem(SELLER_PRODUCTS_KEY, JSON.stringify(updatedLocal));

    const updatedAll = [...allSellerProducts, newProduct];
    setAllSellerProducts(updatedAll);
    localStorage.setItem(ALL_SELLER_PRODUCTS_KEY, JSON.stringify(updatedAll));
  };

  const updateSellerProduct = (id: string, product: Partial<SellerProduct>) => {
    const updated = sellerProducts.map((p) => (p.id === id ? { ...p, ...product } : p));
    setSellerProducts(updated);
    localStorage.setItem(SELLER_PRODUCTS_KEY, JSON.stringify(updated));

    const updatedAll = allSellerProducts.map((p) => (p.id === id ? { ...p, ...product } : p));
    setAllSellerProducts(updatedAll);
    localStorage.setItem(ALL_SELLER_PRODUCTS_KEY, JSON.stringify(updatedAll));
  };

  const deleteSellerProduct = (id: string) => {
    const updated = sellerProducts.filter((p) => p.id !== id);
    setSellerProducts(updated);
    localStorage.setItem(SELLER_PRODUCTS_KEY, JSON.stringify(updated));

    const updatedAll = allSellerProducts.filter((p) => p.id !== id);
    setAllSellerProducts(updatedAll);
    localStorage.setItem(ALL_SELLER_PRODUCTS_KEY, JSON.stringify(updatedAll));
  };

  const disableSeller = (sellerId: string) => {
    const updated = allSellers.map((s) =>
      s.id === sellerId ? { ...s, isActive: false } : s
    );
    setAllSellers(updated);
    localStorage.setItem(ALL_SELLERS_KEY, JSON.stringify(updated));
  };

  const enableSeller = (sellerId: string) => {
    const updated = allSellers.map((s) =>
      s.id === sellerId ? { ...s, isActive: true } : s
    );
    setAllSellers(updated);
    localStorage.setItem(ALL_SELLERS_KEY, JSON.stringify(updated));
  };

  const deleteSeller = (sellerId: string) => {
    const updated = allSellers.filter((s) => s.id !== sellerId);
    setAllSellers(updated);
    localStorage.setItem(ALL_SELLERS_KEY, JSON.stringify(updated));

    // Also delete all products from this seller
    const updatedProducts = allSellerProducts.filter((p) => p.sellerId !== sellerId);
    setAllSellerProducts(updatedProducts);
    localStorage.setItem(ALL_SELLER_PRODUCTS_KEY, JSON.stringify(updatedProducts));
  };

  const getSellerById = (sellerId: string): SellerUser | null => {
    return allSellers.find((s) => s.id === sellerId) || null;
  };

  const getSellerProducts = (sellerId: string): SellerProduct[] => {
    return allSellerProducts.filter((p) => p.sellerId === sellerId);
  };

  const approveProduct = (productId: string) => {
    const updated = allSellerProducts.map((p) =>
      p.id === productId ? { ...p, status: "approved" as const } : p
    );
    setAllSellerProducts(updated);
    localStorage.setItem(ALL_SELLER_PRODUCTS_KEY, JSON.stringify(updated));

    const updatedLocal = sellerProducts.map((p) =>
      p.id === productId ? { ...p, status: "approved" as const } : p
    );
    setSellerProducts(updatedLocal);
    localStorage.setItem(SELLER_PRODUCTS_KEY, JSON.stringify(updatedLocal));
  };

  const rejectProduct = (productId: string) => {
    const updated = allSellerProducts.map((p) =>
      p.id === productId ? { ...p, status: "rejected" as const } : p
    );
    setAllSellerProducts(updated);
    localStorage.setItem(ALL_SELLER_PRODUCTS_KEY, JSON.stringify(updated));

    const updatedLocal = sellerProducts.map((p) =>
      p.id === productId ? { ...p, status: "rejected" as const } : p
    );
    setSellerProducts(updatedLocal);
    localStorage.setItem(SELLER_PRODUCTS_KEY, JSON.stringify(updatedLocal));
  };

  const getPendingProducts = (): SellerProduct[] => {
    return allSellerProducts.filter((p) => p.status === "pending");
  };

  const getApprovedProducts = (): SellerProduct[] => {
    return allSellerProducts.filter((p) => p.status === "approved");
  };

  const updateSellerProfile = (updatedSeller: SellerUser) => {
    setSeller(updatedSeller);
    localStorage.setItem(SELLER_STORAGE_KEY, JSON.stringify(updatedSeller));
    
    // Also update in allSellers list
    const updatedAllSellers = allSellers.map((s) => (s.id === updatedSeller.id ? updatedSeller : s));
    setAllSellers(updatedAllSellers);
    localStorage.setItem(ALL_SELLERS_KEY, JSON.stringify(updatedAllSellers));
  };

  if (!isHydrated) {
    return <div>{children}</div>;
  }

  return (
    <SellerContext.Provider
      value={{
        seller,
        isSellerLoggedIn: !!seller,
        sellerProducts,
        allSellers,
        allSellerProducts,
        sellerLogin,
        sellerLogout,
        addSellerProduct,
        updateSellerProduct,
        deleteSellerProduct,
        disableSeller,
        enableSeller,
        deleteSeller,
        getSellerById,
        getSellerProducts,
        approveProduct,
        rejectProduct,
        getPendingProducts,
        getApprovedProducts,
        updateSellerProfile,
      }}
    >
      {children}
    </SellerContext.Provider>
  );
}

export function useSeller() {
  const context = useContext(SellerContext);

  if (context === undefined) {
    return {
      seller: null,
      isSellerLoggedIn: false,
      sellerProducts: [],
      allSellers: [],
      allSellerProducts: [],
      sellerLogin: () => false,
      sellerLogout: () => {},
      addSellerProduct: () => {},
      updateSellerProduct: () => {},
      deleteSellerProduct: () => {},
      disableSeller: () => {},
      enableSeller: () => {},
      deleteSeller: () => {},
      getSellerById: () => null,
      getSellerProducts: () => [],
      approveProduct: () => {},
      rejectProduct: () => {},
      getPendingProducts: () => [],
      getApprovedProducts: () => [],
      updateSellerProfile: () => {},
    };
  }

  return context;
}
