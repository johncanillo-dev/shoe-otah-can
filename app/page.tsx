"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useMemo, useEffect } from "react";
import { useCart } from "@/lib/cart-context";
import { useAuth } from "@/lib/auth-context";
import { useAppSettings } from "@/lib/app-settings-context";
import { fetchProducts, subscribeToProducts } from "@/lib/product-helpers";

type Product = {
  id: string;
  name: string;
  category: string;
  price: number;
  description: string;
  image?: string;
  created_at?: string;
};

const DEFAULT_CATEGORIES = ["Shoes", "Shirts", "Slippers", "Socks", "Necklace", "Beauty Product", "Pants"];

export default function Home() {
  const router = useRouter();
  const { isLoggedIn } = useAuth();
  const { settings } = useAppSettings();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>(DEFAULT_CATEGORIES);
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [priceRange, setPriceRange] = useState([0, 50000]);
  const [addedToCart, setAddedToCart] = useState<string | null>(null);
  const [featuredGlow, setFeaturedGlow] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { addItem } = useCart();

  // Redirect if not logged in
  useEffect(() => {
    if (!isLoggedIn) {
      router.push("/login");
    }
  }, [isLoggedIn, router]);

  // Load categories from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("shoe-otah-categories");
    if (saved) {
      try {
        const loadedCategories = JSON.parse(saved);
        setCategories(["All", ...loadedCategories]);
      } catch {
        setCategories(["All", ...DEFAULT_CATEGORIES]);
      }
    } else {
      setCategories(["All", ...DEFAULT_CATEGORIES]);
    }
  }, []);

  // Load products from Supabase on mount and subscribe to real-time updates
  useEffect(() => {
    const loadProducts = async () => {
      setIsLoading(true);
      const productsData = await fetchProducts();
      setProducts(productsData);
      setIsLoading(false);
    };

    loadProducts();

    // Subscribe to real-time product changes
    const unsubscribe = subscribeToProducts(
      (updatedProducts) => {
        setProducts(updatedProducts);
      },
      (error) => console.error("Real-time subscription error:", error)
    );

    return () => unsubscribe();
  }, []);

  const filteredProducts = useMemo(() => {
    let result = [...products];

    // Category filter (case-insensitive)
    if (activeCategory !== "All") {
      result = result.filter((p) => p.category?.toLowerCase() === activeCategory.toLowerCase());
    }

    // Search filter
    if (searchQuery.trim()) {
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Price filter
    result = result.filter((p) => p.price >= priceRange[0] && p.price <= priceRange[1]);

    return result;
  }, [activeCategory, products, searchQuery, priceRange]);

  const handleAddToCart = (product: Product) => {
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      category: product.category as string,
      quantity: 1,
    });
    setAddedToCart(product.id);
    setTimeout(() => setAddedToCart(null), 2000);
  };

  const handleBuyNow = (product: Product) => {
    const itemData = {
      id: product.id,
      name: product.name,
      price: product.price,
      category: product.category,
      quantity: 1,
    };
    router.push(`/checkout?item=${encodeURIComponent(JSON.stringify(itemData))}&quantity=1`);
  };

  return (
    <>
      {!isLoggedIn ? (
        <div style={{ padding: "2rem", textAlign: "center" }}>
          <h1>Please log in to continue</h1>
          <p>Redirecting to login page...</p>
        </div>
      ) : (
        <div className="landing-shell">
      <section className="hero">
        <div className="container hero-grid">
          <div>
            <h1>shoe-otah</h1>
            <p className="hero-copy">
              Fresh drops in shoes, shirts, pants, slippers, beauty product, jewelry and socks. Built for daily
              comfort with bold, clean looks.
            </p>
            <div className="hero-actions">
              <Link href="/register" className="btn btn-primary">
                Create Account
              </Link>
              <Link href="/cart" className="btn btn-secondary">
                View Cart
              </Link>
            </div>
          </div>
          <div className="hero-panel">
            <p>Weekend Bundle</p>
            <h2>₱129</h2>
            <span>1 shoe + 1 shirt + 1 slipper</span>
          </div>
        </div>
      </section>

      {/* Store Closed Banner */}
      {!settings.store_open && (
        <div style={{ padding: "1rem", backgroundColor: "#f8d7da", color: "#721c24", borderRadius: "8px", margin: "1rem auto", maxWidth: "1200px", textAlign: "center", fontWeight: "600" }}>
          🚫 Store is currently closed. Please check back later.
        </div>
      )}

      {/* Announcement Banner */}
      {settings.announcement_banner && (
        <div style={{ padding: "0.75rem 1rem", backgroundColor: "#fff3cd", color: "#856404", borderRadius: "8px", margin: "1rem auto", maxWidth: "1200px", textAlign: "center", fontWeight: "500" }}>
          📢 {settings.announcement_banner}
        </div>
      )}

      <section className="catalog container" aria-label="Product catalog">
        <div className="catalog-head">
          <h2
            className={`featured-title ${featuredGlow ? "glowing" : ""}`}
            onClick={() => {
              setFeaturedGlow(true);
              setTimeout(() => setFeaturedGlow(false), 600);
            }}
            style={{ cursor: "pointer" }}
          >
            Featured Products ({filteredProducts.length})
          </h2>
        </div>

        {/* Search Bar */}
        <div style={{ marginBottom: "1.5rem" }}>
          <input
            type="text"
            placeholder="🔍 Search products by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: "100%",
              padding: "0.75rem 1rem",
              border: "2px solid var(--line)",
              borderRadius: "8px",
              fontSize: "1rem",
              fontFamily: "inherit",
            }}
          />
        </div>

        {/* Category Tabs */}
        <div className="filter-tabs">
          {categories.map((category) => (
            <button
              key={category}
              className={`filter-tab ${activeCategory === category ? "active" : ""}`}
              onClick={() => setActiveCategory(category)}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Price Filter */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          style={{
            marginBottom: "1.5rem",
            padding: "0.5rem 1rem",
            border: "1px solid var(--line)",
            borderRadius: "6px",
            background: "white",
            cursor: "pointer",
            fontWeight: "600",
          }}
        >
          {showFilters ? "Hide Filters ▲" : "Show Filters ▼"}
        </button>

        {showFilters && (
          <div
            style={{
              marginBottom: "1.5rem",
              padding: "1rem",
              background: "#f9f9f9",
              borderRadius: "8px",
              border: "1px solid var(--line)",
            }}
          >
            <label style={{ display: "block", marginBottom: "1rem", fontWeight: "600" }}>
              Price Range: ₱{priceRange[0]} - ₱{priceRange[1]}
            </label>
            <input
              type="range"
              min="0"
              max="50000"
              value={priceRange[1]}
              onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
              style={{ width: "100%", marginBottom: "0.5rem" }}
            />
            <button
              onClick={() => setPriceRange([0, 50000])}
              style={{
                padding: "0.5rem 1rem",
                border: "1px solid var(--line)",
                borderRadius: "4px",
                background: "white",
                cursor: "pointer",
                fontSize: "0.9rem",
              }}
            >
              Reset Filters
            </button>
          </div>
        )}

        {isLoading ? (
          <div style={{ textAlign: "center", padding: "3rem", color: "#666" }}>
            <p style={{ fontSize: "1.1rem" }}>Loading products from Supabase...</p>
          </div>
        ) : (
          <>
            <div className="product-grid">
              {filteredProducts.length > 0 ? (
                filteredProducts.map((item) => (
                  <article className="product-card" key={item.id}>
                    {item.image && (
                      <div style={{ width: "100%", height: "200px", marginBottom: "0.5rem", borderRadius: "4px", overflow: "hidden" }}>
                        <img src={item.image} alt={item.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      </div>
                    )}
                    <Link href={`/product/${item.id}`} style={{ textDecoration: "none", color: "inherit" }}>
                      <p className="tag">{item.category}</p>
                      <h3 style={{ cursor: "pointer", color: "var(--ink)", transition: "color 0.2s" }}>{item.name}</h3>
                      <p>{item.description}</p>
                    </Link>
                    <div className="price-row">
                      <strong>₱{item.price}</strong>
                      <div className="product-actions">
                        <button
                          type="button"
                          className={`add-cart-btn ${addedToCart === item.id ? "added" : ""}`}
                          onClick={() => handleAddToCart(item)}
                        >
                          {addedToCart === item.id ? "✓ Added" : "Add to Cart"}
                        </button>
                        <button
                          type="button"
                          className="buy-now-btn"
                          onClick={() => handleBuyNow(item)}
                        >
                          Buy Now
                        </button>
                      </div>
                    </div>
                  </article>
                ))
              ) : (
                <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "2rem", color: "#5e584d" }}>
                  <p style={{ fontSize: "1.1rem", marginBottom: "1rem" }}>No products found</p>
                  <button
                    onClick={() => {
                      setSearchQuery("");
                      setActiveCategory("All");
                      setPriceRange([0, 50000]);
                    }}
                    style={{
                      padding: "0.75rem 1.5rem",
                      background: "var(--accent)",
                      color: "white",
                      border: "none",
                      borderRadius: "6px",
                      cursor: "pointer",
                      fontWeight: "600",
                    }}
                  >
                    Clear Filters
                  </button>
                </div>
              )}
            </div>

            {filteredProducts.length === 0 && (
              <div style={{ textAlign: "center", padding: "2rem", color: "#5e584d" }}>
                <p style={{ fontSize: "1.1rem", marginBottom: "1rem" }}>No products found</p>
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setActiveCategory("All");
                    setPriceRange([0, 50000]);
                  }}
                  style={{
                    padding: "0.75rem 1.5rem",
                    background: "var(--accent)",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontWeight: "600",
                  }}
                >
                  Clear Filters
                </button>
              </div>
            )}
          </>
        )}
      </section>

      <section className="category-strip">
        <div className="container category-grid">
          {categories.slice(1).map((category) => (
            <button
              key={category}
              className="category-chip"
              onClick={() => setActiveCategory(category)}
            >
              {category}
            </button>
          ))}
        </div>
      </section>
    </div>
      )}
    </>
  );
}
