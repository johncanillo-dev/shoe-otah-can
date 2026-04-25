"use client";

import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useCart } from "@/lib/cart-context";
import { useSeller } from "@/lib/seller-context";
import Link from "next/link";
import ChatButton from "@/app/components/chat-button";
import { ProductVideo } from "@/app/components/product-video";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

interface AdminProduct {
  id: string;
  name: string;
  category: "Shoes" | "Shirts" | "Slippers" | "Sacks";
  price: number;
  description: string;
  image?: string;
  videoUrl?: string;
  isEcoFriendly?: boolean;
}

export default function ProductPage() {
  const params = useParams();
  const router = useRouter();
  const { addItem } = useCart();
  const { seller, sellerProducts } = useSeller();

  const [product, setProduct] = useState<AdminProduct | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [isAdded, setIsAdded] = useState(false);
  const [reviews, setReviews] = useState<Array<{ name: string; rating: number; comment: string }>>([]);
  const [newReview, setNewReview] = useState({ name: "", rating: 5, comment: "" });
  const [showReviewForm, setShowReviewForm] = useState(false);

  const productId = params.id as string;

  // ✅ FETCH PRODUCT FROM SUPABASE
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const supabase = createSupabaseBrowserClient();

        const { data, error } = await supabase
          .from("products")
          .select("*")
          .eq("id", productId)
          .single();

        if (error || !data) {
          console.error("Failed to fetch product:", error);
          return;
        }

        setProduct({
          id: data.id,
          name: data.name,
          category: data.category,
          price: Number(data.price),
          description: data.description,
          image: data.image,
          videoUrl: data.video_url,
          isEcoFriendly: data.is_eco_friendly,
        });

        // keep reviews in localStorage
        const productReviews = localStorage.getItem(`product-reviews-${productId}`);
        if (productReviews) {
          setReviews(JSON.parse(productReviews));
        }
      } catch (e) {
        console.error("Error loading product:", e);
      }
    };

    if (productId) {
      fetchProduct();
    }
  }, [productId]);

  const handleAddToCart = () => {
    if (product) {
      addItem({
        id: product.id,
        name: product.name,
        price: product.price,
        category: product.category,
        quantity,
        image: product.image,
      });
      setIsAdded(true);
      setTimeout(() => setIsAdded(false), 2000);
    }
  };

  const handleBuyNow = () => {
    if (product) {
      addItem({
        id: product.id,
        name: product.name,
        price: product.price,
        category: product.category,
        quantity,
        image: product.image,
      });
      router.push("/checkout");
    }
  };

  const handleAddReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (newReview.name.trim() && newReview.comment.trim()) {
      const updatedReviews = [...reviews, newReview];
      setReviews(updatedReviews);
      localStorage.setItem(`product-reviews-${productId}`, JSON.stringify(updatedReviews));
      setNewReview({ name: "", rating: 5, comment: "" });
      setShowReviewForm(false);
    }
  };

  const averageRating =
    reviews.length > 0
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
      : "0";

  if (!product) {
    return (
      <section className="container" style={{ padding: "2rem 0", textAlign: "center" }}>
        <p>Loading product...</p>
      </section>
    );
  }

  return (
    <section className="container" style={{ padding: "2rem 0" }}>
      <Link href="/" style={{ color: "var(--accent)", textDecoration: "none" }}>
        ← Back to Shop
      </Link>

      <div className="product-detail">
        <div className="product-image-section">
          <div
            style={{
              borderRadius: "12px",
              padding: "1rem",
              minHeight: "400px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {product.image ? (
              <img
                src={`/${product.image}`}
                alt={product.name}
                style={{ maxWidth: "100%", borderRadius: "8px" }}
              />
            ) : (
              <span>📦 {product.name}</span>
            )}
          </div>

          {product.videoUrl && (
            <ProductVideo videoUrl={product.videoUrl} productName={product.name} />
          )}
        </div>

        <div className="product-info-section">
          <span className="badge">{product.category}</span>

          <h1>{product.name}</h1>

          <p>{product.description}</p>

          <h2>₱{Number(product.price).toFixed(2)}</h2>

          {/* Quantity */}
          <div>
            <button onClick={() => setQuantity(Math.max(1, quantity - 1))}>−</button>
            <span>{quantity}</span>
            <button onClick={() => setQuantity(quantity + 1)}>+</button>
          </div>

          {/* Actions */}
          <div>
            <button onClick={handleAddToCart}>
              {isAdded ? "✓ Added" : "🛒 Add to Cart"}
            </button>
            <button onClick={handleBuyNow}>💳 Buy Now</button>
          </div>

          {/* Seller Chat */}
          {seller && (
            <ChatButton
              recipientId={seller.id}
              recipientName={`${seller.name} (Seller)`}
            />
          )}
        </div>
      </div>

      {/* Reviews */}
      <div style={{ marginTop: "2rem" }}>
        <h2>Reviews ({averageRating})</h2>

        {reviews.map((review, i) => (
          <div key={i}>
            <strong>{review.name}</strong>
            <p>{review.comment}</p>
          </div>
        ))}

        {!showReviewForm ? (
          <button onClick={() => setShowReviewForm(true)}>Write Review</button>
        ) : (
          <form onSubmit={handleAddReview}>
            <input
              value={newReview.name}
              onChange={(e) => setNewReview({ ...newReview, name: e.target.value })}
              placeholder="Name"
              required
            />
            <textarea
              value={newReview.comment}
              onChange={(e) =>
                setNewReview({ ...newReview, comment: e.target.value })
              }
              required
            />
            <button type="submit">Submit</button>
          </form>
        )}
      </div>
    </section>
  );
}
