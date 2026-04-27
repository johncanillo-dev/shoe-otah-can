"use client";

import { useState, useEffect } from "react";
import { SectionHeader } from "@/app/components/ui/section-header";
import { Card } from "@/app/components/ui/card";

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
    <Card>
      <SectionHeader
        title="Product Categories"
        subtitle={`${categories.length} categories`}
        action={
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-4 py-2 bg-[var(--accent)] text-white rounded-md font-semibold cursor-pointer hover:opacity-90 transition-opacity text-sm"
          >
            {showForm ? "Cancel" : "+ Add Category"}
          </button>
        }
      />

      {showForm && (
        <div className="mb-6 p-4 bg-[#f9f9f9] rounded-lg">
          <input
            type="text"
            placeholder="Enter new category name..."
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleAddCategory()}
            className="w-full px-4 py-3 mb-3 border border-[var(--line)] rounded-lg text-base box-border focus:outline-none focus:border-[var(--accent)]"
          />
          <button
            onClick={handleAddCategory}
            className="px-4 py-2 bg-[var(--accent)] text-white rounded-md cursor-pointer font-semibold hover:opacity-90 transition-opacity text-sm"
          >
            Add Category
          </button>
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        {categories.map((category) => (
          <div
            key={category}
            className="flex items-center gap-2 px-4 py-2.5 bg-[var(--line)] rounded-lg font-medium"
          >
            {category}
            <button
              onClick={() => handleRemoveCategory(category)}
              className="bg-none border-none text-[#d32f2f] cursor-pointer text-lg leading-none p-0 ml-1 hover:opacity-70"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </Card>
  );
}
