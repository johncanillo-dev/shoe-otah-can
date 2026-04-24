import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // Validation
    if (!email || !password) {
      return Response.json(
        { success: false, error: "Email and password are required" },
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

    // Simple hash function (must match auth-context)
    const simpleHash = (input: string): string => {
      let hash = 0;
      for (let i = 0; i < input.length; i++) {
        const char = input.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash = hash & hash;
      }
      return "hash_" + Math.abs(hash).toString(36);
    };

    // Find user by email
    const { data: foundUser, error } = await supabase
      .from("users")
      .select("*")
      .eq("email", email.toLowerCase())
      .single();

    if (error || !foundUser) {
      return Response.json(
        { success: false, error: "Account not found. Please register first." },
        { status: 401 }
      );
    }

    // Verify password
    const hashedInput = simpleHash(password + email);
    if (foundUser.password !== hashedInput) {
      return Response.json(
        { success: false, error: "Incorrect password" },
        { status: 401 }
      );
    }

    // Check if user is active
    if (!foundUser.isActive) {
      return Response.json(
        { success: false, error: "Account is inactive" },
        { status: 401 }
      );
    }

    return Response.json({
      success: true,
      user: {
        id: foundUser.id,
        email: foundUser.email,
        name: foundUser.name,
        city: foundUser.city,
        createdAt: foundUser.createdAt,
        isActive: foundUser.isActive,
      },
    });
  } catch (error) {
    console.error("Login API error:", error);
    return Response.json(
      { success: false, error: "Server error: " + String(error) },
      { status: 500 }
    );
  }
}
