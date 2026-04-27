"use client";

import { useState, useEffect } from "react";

const DEFAULT_CATEGORIES = ["Shoes", "Shirts", "Slippers", "Sacks"];

export function CategoryManager() {
  const [categories, setCategories] = useState<string[]>([]);
  const [newCategory, setNewCategory] = useState("");
  const [showForm, setShowForm] = useState(false);

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

  useEffect(() => {
    if (categories.length > 0) {
      localStorage.setItem("shoe-otah-categories", JSON.stringify(categories));
    }
  }, [categories]);

  const handleAddCategory = () => {
    if (newCategory.trim() && !categories.includes(newCategory.trim())) {
      setCategories([...categories, newCategory.trim()]);
      setNewCategory("");
      setShowForm(false);
    } else if (categories.includes(newCategory.trim())) {
      alert("Category already exists!");
    }
  };

  const handleRemoveCategory = (category: string) => {
    if (confirm(`Remove category "${category}"?`)) {
      setCategories(categories.filter((c) => c !== category));
    }
  };

  return (
    <div style={{ marginBottom: "2rem", padding: "1.5rem", border: "1px solid var(--line)", borderRadius: "8px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
        <h3>Product Categories ({categories.length})</h3>
        <button
          onClick={() => setShowForm(!showForm)}
          style={{
            padding: "0.5rem 1rem",
            backgroundColor: "var(--accent)",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            fontWeight: "600",
          }}
        >
          {showForm ? "Cancel" : "+ Add Category"}
        </button>
      </div>

      {showForm && (
        <div style={{ marginBottom: "1rem", padding: "1rem", backgroundColor: "#f9f9f9", borderRadius: "6px" }}>
          <input
            type="text"
            placeholder="Enter new category name..."
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleAddCategory()}
            style={{
              width: "100%",
              padding: "0.75rem",
              marginBottom: "0.5rem",
              border: "1px solid var(--line)",
              borderRadius: "4px",
              fontSize: "1rem",
            }}
          />
          <button
            onClick={handleAddCategory}
            style={{
              padding: "0.5rem 1rem",
              backgroundColor: "var(--accent)",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontWeight: "600",
            }}
          >
            Add
          </button>
        </div>
      )}

      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
        {categories.map((category) => (
          <div
            key={category}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.75rem 1rem",
              backgroundColor: "var(--line)",
              borderRadius: "6px",
              fontWeight: "500",
            }}
          >
            {category}
            <button
              onClick={() => handleRemoveCategory(category)}
              style={{
                background: "none",
                border: "none",
                color: "#d32f2f",
                cursor: "pointer",
                fontSize: "1.2rem",
                padding: "0",
                marginLeft: "0.5rem",
              }}
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
