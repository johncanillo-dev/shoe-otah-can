import { createSupabaseServerClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    
    // Check if Supabase is configured
    if (!supabase) {
      return NextResponse.json(
        { error: "Supabase not configured" },
        { status: 500 }
      );
    }
    
    const body = await request.json();

    const {
      location_latitude,
      location_longitude,
      location_address,
      location_zoom,
      location_image_url,
      shop_name,
    } = body;

    // Validate required fields
    if (
      location_latitude === undefined ||
      location_longitude === undefined ||
      !location_address
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Get existing record or create new
    const { data: existing, error: selectError } = await supabase
      .from("shop_branding")
      .select("id")
      .limit(1)
      .single();

    if (selectError && selectError.code !== "PGRST116") {
      console.error("Select error:", selectError);
      return NextResponse.json(
        { error: "Failed to fetch existing record" },
        { status: 500 }
      );
    }

    const branding_update = {
      location_latitude,
      location_longitude,
      location_address,
      location_zoom,
      location_image_url: location_image_url || null,
      shop_name: shop_name || "Shoe Otah Boutique",
      updated_at: new Date().toISOString(),
    };

    let result;

    if (existing?.id) {
      // Update existing record
      result = await supabase
        .from("shop_branding")
        .update(branding_update)
        .eq("id", existing.id)
        .select();
    } else {
      // Create new record
      result = await supabase
        .from("shop_branding")
        .insert([branding_update])
        .select();
    }

    if (result.error) {
      console.error("Database error:", result.error);
      return NextResponse.json(
        { error: "Failed to update location" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data,
      message: "Location updated successfully",
    });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    
    // Check if Supabase is configured
    if (!supabase) {
      return NextResponse.json(
        { error: "Supabase not configured" },
        { status: 500 }
      );
    }

    const { data, error } = await supabase
      .from("shop_branding")
      .select("*")
      .limit(1)
      .single();

    if (error && error.code !== "PGRST116") {
      console.error("Fetch error:", error);
      return NextResponse.json(
        { error: "Failed to fetch branding" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data || {},
    });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
