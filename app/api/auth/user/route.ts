import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get("userId");

    if (!userId) {
      return Response.json(
        { success: false, error: "User ID required" },
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

    // Fetch user data
    const { data: userData, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();

    if (error || !userData) {
      return Response.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    return Response.json({
      success: true,
      user: {
        id: userData.id,
        email: userData.email,
        name: userData.name,
        city: userData.city,
        createdAt: userData.createdAt,
        isActive: userData.isActive,
      },
    });
  } catch (error) {
    console.error("Get user API error:", error);
    return Response.json(
      { success: false, error: "Server error: " + String(error) },
      { status: 500 }
    );
  }
}
