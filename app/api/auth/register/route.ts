import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, name, city } = body;

    // Validation
    if (!email || !password || !name) {
      return Response.json(
        { success: false, error: "All fields are required" },
        { status: 400 }
      );
    }

    const supabase = await createSupabaseServerClient();
    
    if (!supabase) {
      return Response.json(
        { success: false, error: "Database not configured" },
        { status: 500 }
      );
    }

    // Simple hash function
    const simpleHash = (input: string): string => {
      let hash = 0;
      for (let i = 0; i < input.length; i++) {
        const char = input.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash = hash & hash;
      }
      return "hash_" + Math.abs(hash).toString(36);
    };

    // Check if email already exists
    const { data: existingUser, error: queryError } = await supabase
      .from("users")
      .select("id")
      .eq("email", email.toLowerCase())
      .single();

    if (existingUser) {
      return Response.json(
        { success: false, error: "Email already registered" },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = simpleHash(password + email);

    // Create new user
    const newUserId = crypto.randomUUID
      ? crypto.randomUUID()
      : Date.now().toString();

    const { data, error } = await supabase.from("users").insert([
      {
        id: newUserId,
        email: email.toLowerCase(),
        password: hashedPassword,
        name,
        city: city || null,
        createdAt: new Date().toISOString(),
        isActive: true,
      },
    ]);

    if (error) {
      console.error("Supabase insert error:", error);
      return Response.json(
        {
          success: false,
          error: `Registration failed: ${error.message || "Unknown error"}`,
        },
        { status: 500 }
      );
    }

    return Response.json({
      success: true,
      user: {
        id: newUserId,
        email: email.toLowerCase(),
        name,
        city,
      },
    });
  } catch (error) {
    console.error("API error:", error);
    return Response.json(
      { success: false, error: "Server error: " + String(error) },
      { status: 500 }
    );
  }
}
