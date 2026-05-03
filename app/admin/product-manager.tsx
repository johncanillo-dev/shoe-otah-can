"use client";

import { useState, useEffect } from "react";
import { fetchProducts, addProduct, updateProduct, deleteProduct, subscribeToProducts } from "@/lib/product-helpers";

export type AdminProduct = {
  id: string;
  name: string;
  category: string;
  price: number;
  description: string;
  image?: string;
  created_at?: string;
};

const DEFAULT_CATEGORIES = ["Shoes", "Shirts", "Slippers", "Socks", "Necklace", "Beauty Product", "Pants"];

export function ProductManager() {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<Partial<AdminProduct>>({
    name: "",
    category: "",
    price: 0,
    description: "",
    image: "",
  });

  // Load categories from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("shoe-otah-categories");
    if (saved) {
      try {
        setCategories(JSON.parse(saved));
      } catch {
        setCategories(DEFAULT_CATEGORIES);
      }
    } else {
      setCategories(DEFAULT_CATEGORIES);
    }
  }, []);

  // Update formData category when categories are loaded
  useEffect(() => {
    if (categories.length > 0 && !formData.category) {
      setFormData((prev) => ({ ...prev, category: categories[0] }));
    }
  }, [categories]);

  // Load products from Supabase on mount and subscribe to real-time updates
  useEffect(() => {
    const loadProducts = async () => {
      setIsLoading(true);
      const productsData = await fetchProducts();
      setProducts(productsData as AdminProduct[]);
      setIsLoading(false);
    };

    loadProducts();

    // Subscribe to real-time product changes
    const unsubscribe = subscribeToProducts(
      (updatedProducts) => {
        setProducts(updatedProducts as AdminProduct[]);
      },
      () => {}
    );

    return () => unsubscribe();
  }, []);

  const handleAddNew = () => {
    setEditingId(null);
    const defaultCategory = categories.length > 0 ? categories[0] : DEFAULT_CATEGORIES[0];
    setFormData({ name: "", category: defaultCategory, price: 0, description: "", image: "" });
    setShowForm(true);
  };

  const handleEdit = (product: AdminProduct) => {
    setEditingId(product.id);
    setFormData({ ...product, image: product.image || "" });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this product?")) {
      setIsSaving(true);
      const success = await deleteProduct(id);
      if (success) {
        setProducts(products.filter((p) => p.id !== id));
      } else {
        alert("Failed to delete product");
      }
      setIsSaving(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.category || formData.price === undefined || formData.price === null || !formData.description) {
      alert("Please fill in all fields, including a valid category");
      return;
    }

    if (!categories.includes(formData.category)) {
      alert("Please select a valid category");
      return;
    }

    const name = formData.name as string;
    const category = formData.category as string;
    const price = formData.price as number;
    const description = formData.description as string;
    const image = formData.image as string | undefined;

    setIsSaving(true);

    try {
      if (editingId) {
        // Update existing product
        const updated = await updateProduct(editingId, {
          name,
          category,
          price,
          description,
          image,
        });
        if (updated) {
          setProducts(
            products.map((p) =>
              p.id === editingId
                ? {
                    id: p.id,
                    name,
                    category,
                    price,
                    description,
                    image,
                  }
                : p,
            ),
          );
        } else {
          alert("Failed to update product");
        }
      } else {
        // Add new product
        const newProduct = await addProduct({
          name,
          category,
          price,
          description,
          image,
        });
        if (newProduct) {
          setProducts([...products, newProduct as AdminProduct]);
        } else {
          alert("Failed to add product");
        }
      }

      setShowForm(false);
      const defaultCategory = categories.length > 0 ? categories[0] : DEFAULT_CATEGORIES[0];
      setFormData({ name: "", category: defaultCategory, price: 0, description: "", image: "" });
    } catch (error) {
      alert("Error saving product");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    const defaultCategory = categories.length > 0 ? categories[0] : DEFAULT_CATEGORIES[0];
    setFormData({ name: "", category: defaultCategory, price: 0, description: "", image: "" });
  };

  return (
    <div className="product-manager">
      <div className="manager-head">
        <h2>Products ({products.length})</h2>
        {isLoading && <span style={{ color: "#666", fontSize: "0.9rem" }}>Loading from Supabase...</span>}
        <button type="button" className="btn btn-primary" onClick={handleAddNew} disabled={isSaving}>
          + Add Product
        </button>
      </div>

      {showForm && (
        <div className="product-form-card">
          <h3>{editingId ? "Edit Product" : "Add New Product"}</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="name">Product Name</label>
              <input
                id="name"
                type="text"
                placeholder="e.g., Urban Sprint Pro"
                value={formData.name || ""}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                disabled={isSaving}
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="category">Category</label>
                <select
                  id="category"
                  value={formData.category || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      category: e.target.value,
                    })
                  }
                  disabled={isSaving}
                >
                  <option value="">Select a category</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="price">Price (₱)</label>
                <input
                  id="price"
                  type="number"
                  placeholder="49.99"
                  min="0"
                  step="0.01"
                  value={formData.price || ""}
                  onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                  disabled={isSaving}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="image">Product Image</label>
              <input
                id="image"
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                      setFormData({ ...formData, image: reader.result as string });
                    };
                    reader.readAsDataURL(file);
                  }
                }}
                disabled={isSaving}
              />
              {formData.image && (
                <div style={{ marginTop: "0.5rem" }}>
                  <img src={formData.image} alt="Preview" style={{ maxWidth: "100px", maxHeight: "100px", borderRadius: "4px" }} />
                </div>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                placeholder="Brief product description..."
                rows={3}
                value={formData.description || ""}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                disabled={isSaving}
                required
              />
            </div>

            <div className="form-actions">
              <button type="submit" className="btn btn-primary" disabled={isSaving}>
                {isSaving ? (editingId ? "Updating..." : "Adding...") : editingId ? "Update Product" : "Add Product"}
              </button>
              <button type="button" className="btn btn-secondary" onClick={handleCancel} disabled={isSaving}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="products-list">
        {isLoading ? (
          <p style={{ textAlign: "center", color: "#666" }}>Loading products...</p>
        ) : products.length === 0 && !showForm ? (
          <div className="empty-state">
            <p>No products yet. Create your first product!</p>
            <button type="button" className="btn btn-primary" onClick={handleAddNew}>
              Add Product
            </button>
          </div>
        ) : (
          products.map((product) => (
            <div key={product.id} className="product-row">
              <div className="product-info">
                <h4>{product.name}</h4>
                {product.image && (
                  <img src={product.image} alt={product.name} style={{ width: "80px", height: "80px", objectFit: "cover", borderRadius: "4px", marginBottom: "0.5rem" }} />
                )}
                <p className="product-meta">
                  {product.category} • ₱{product.price.toFixed(2)}
                </p>
                <p className="product-desc">{product.description}</p>
              </div>
              <div className="product-actions">
                <button type="button" className="btn-edit" onClick={() => handleEdit(product)} disabled={isSaving}>
                  Edit
                </button>
                <button type="button" className="btn-delete" onClick={() => handleDelete(product.id)} disabled={isSaving}>
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
