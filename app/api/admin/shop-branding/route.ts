import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

// Valid columns in shop_branding table
const VALID_COLUMNS = [
  "shop_name",
  "location_address",
  "banner_url",
  "logo_url",
  "updated_at",
];

// Create a server-side Supabase client with service role key for full admin access
function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error("Missing Supabase credentials:", {
      hasUrl: !!supabaseUrl,
      hasServiceKey: !!supabaseServiceKey,
    });
    return null;
  }

  return createClient(supabaseUrl, supabaseServiceKey);
}

// Whitelist and sanitize update data - only include valid columns
function sanitizeUpdateData(body: any): Record<string, any> {
  const updateData: Record<string, any> = {};

  for (const key of VALID_COLUMNS) {
    if (key !== "updated_at" && key in body) {
      updateData[key] = body[key];
    }
  }

  // Always set updated_at to current timestamp
  updateData.updated_at = new Date().toISOString();

  return updateData;
}

// Validate updateData has at least one field to update
function validateUpdateData(updateData: Record<string, any>): boolean {
  // Check if there are any fields besides updated_at
  return Object.keys(updateData).some((key) => key !== "updated_at");
}

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin();

    if (!supabase) {
      console.error("Failed to initialize Supabase admin client");
      return NextResponse.json(
        { error: "Supabase not configured on server" },
        { status: 500 }
      );
    }

    const body = await request.json();

    // Validate request has id
    if (!body.id) {
      return NextResponse.json(
        { error: "Missing required field: id" },
        { status: 400 }
      );
    }

    // Sanitize data - only include valid columns
    const updateData = sanitizeUpdateData(body);

    // Guard against empty updates
    if (!validateUpdateData(updateData)) {
      return NextResponse.json(
        {
          error: "No valid fields provided to update",
          hint: "Must include at least one of: shop_name, location_address, banner_url, logo_url",
        },
        { status: 400 }
      );
    }

    // Perform update
    const { data, error } = await supabase
      .from("shop_branding")
      .update(updateData)
      .eq("id", body.id)
      .select();

    // Handle Supabase errors
    if (error) {
      console.error("Supabase error details:", {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
      });

      // Return 400 for known Supabase errors
      if (error.code === "PGRST204" || error.code === "PGRST116") {
        return NextResponse.json(
          {
            error: error.message,
            code: error.code,
            details: error.details,
          },
          { status: 400 }
        );
      }

      // Return 500 for unexpected errors
      return NextResponse.json(
        {
          error: "Database operation failed",
          code: error.code,
          message: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
      message: "Location updated successfully",
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;

    console.error("🔥 SHOP-BRANDING POST API ERROR:", {
      message: errorMessage,
      stack: errorStack,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json(
      {
        error: "Internal server error",
        message: errorMessage,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const supabase = getSupabaseAdmin();

    if (!supabase) {
      console.error("Failed to initialize Supabase admin client");
      return NextResponse.json(
        { error: "Supabase not configured on server" },
        { status: 500 }
      );
    }

    const { data, error } = await supabase
      .from("shop_branding")
      .select("*")
      .limit(1)
      .single();

    if (error) {
      // PGRST116 is "no rows found" - return empty object instead
      if (error.code === "PGRST116") {
        return NextResponse.json({
          success: true,
          data: {},
        });
      }

      console.error("Supabase fetch error:", {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
      });

      return NextResponse.json(
        {
          error: "Failed to fetch branding",
          code: error.code,
          message: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data || {},
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;

    console.error("🔥 SHOP-BRANDING GET API ERROR:", {
      message: errorMessage,
      stack: errorStack,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json(
      {
        error: "Internal server error",
        message: errorMessage,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
