import { createSupabaseBrowserClient } from "./supabase/client";

export type Product = {
  id: string;
  name: string;
  category: string;
  price: number;
  description: string;
  image?: string;
  created_at?: string;
};

// Fetch all products
export async function fetchProducts(): Promise<Product[]> {
  try {
    const supabase = createSupabaseBrowserClient();
    const { data, error } = await supabase
      .from("shoe-otah")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      return [];
    }

    return data || [];
  } catch (err) {
    return [];
  }
}

// Fetch single product by ID
export async function fetchProductById(id: string): Promise<Product | null> {
  try {
    const supabase = createSupabaseBrowserClient();
    const { data, error } = await supabase
      .from("shoe-otah")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      return null;
    }

    return data;
  } catch (err) {
    return null;
  }
}

// Add new product
export async function addProduct(product: Omit<Product, "id" | "created_at">): Promise<Product | null> {
  try {
    const supabase = createSupabaseBrowserClient();
    const { data, error } = await supabase
      .from("shoe-otah")
      .insert({
        name: product.name,
        category: product.category,
        price: product.price,
        description: product.description,
        image: product.image || null,
      })
      .select()
      .single();

    if (error) {
      return null;
    }

    return data;
  } catch (err) {
    return null;
  }
}

// Update product
export async function updateProduct(id: string, updates: Partial<Product>): Promise<Product | null> {
  try {
    const supabase = createSupabaseBrowserClient();
    const { data, error } = await supabase
      .from("shoe-otah")
      .update({
        name: updates.name,
        category: updates.category,
        price: updates.price,
        description: updates.description,
        image: updates.image || null,
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return null;
    }

    return data;
  } catch (err) {
    return null;
  }
}

// Delete product
export async function deleteProduct(id: string): Promise<boolean> {
  try {
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase
      .from("shoe-otah")
      .delete()
      .eq("id", id);

    if (error) {
      return false;
    }

    return true;
  } catch (err) {
    return false;
  }
}

// Subscribe to real-time product updates
export function subscribeToProducts(
  callback: (products: Product[]) => void,
  onError?: (error: any) => void
) {
  try {
    const supabase = createSupabaseBrowserClient();
    const subscription = supabase
      .channel("public:shoe-otah")
      .on(
        "postgres_changes",
        {
          event: "*", // Listen to all events: INSERT, UPDATE, DELETE
          schema: "public",
          table: "shoe-otah",
        },
        async () => {
          // Fetch fresh data when changes occur
          const products = await fetchProducts();
          callback(products);
        },
      )
      .subscribe((status, err) => {
        if (err) {
          onError?.(err);
        }
      });

    return () => {
      supabase.removeChannel(subscription);
    };
  } catch (err) {
    onError?.(err);
    return () => {};
  }
}
