import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

// Type definitions for consistent responses
interface ErrorResponse {
  error: string;
  details?: string;
  hint?: string;
  code?: string;
  timestamp?: string;
}

interface SuccessResponse {
  success: true;
  data: any;
  message?: string;
}

// Valid columns in shop_branding table
const VALID_COLUMNS = [
  "shop_name",
  "location_address",
  "banner_url",
  "logo_url",
];

const LOG_PREFIX = "🔥 [SHOP-BRANDING-API]";

// Create a server-side Supabase client with service role key for full admin access
function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error(`${LOG_PREFIX} Missing Supabase credentials:`, {
      hasUrl: !!supabaseUrl,
      hasServiceKey: !!supabaseServiceKey,
    });
    return null;
  }

  return createClient(supabaseUrl, supabaseServiceKey);
}

// Whitelist and sanitize update data - only include valid columns
function sanitizeUpdateData(body: Record<string, any>): Record<string, any> {
  const updateData: Record<string, any> = {};

  // Only copy whitelisted columns
  for (const key of VALID_COLUMNS) {
    if (key in body && body[key] !== null && body[key] !== undefined) {
      updateData[key] = body[key];
    }
  }

  // Always set updated_at to current ISO timestamp
  updateData.updated_at = new Date().toISOString();

  return updateData;
}

// Validate updateData has at least one field to update (besides updated_at)
function hasValidFields(updateData: Record<string, any>): boolean {
  return Object.keys(updateData).some((key) => key !== "updated_at");
}

// Helper to build consistent error responses
function errorResponse(
  error: string,
  details?: string,
  hint?: string,
  code?: string,
  status: number = 400
) {
  const response: ErrorResponse = {
    error,
    ...(details && { details }),
    ...(hint && { hint }),
    ...(code && { code }),
    timestamp: new Date().toISOString(),
  };
  return [response, status] as const;
}

export async function POST(request: NextRequest) {
  const requestId = Date.now(); // For tracing
  let body: Record<string, any> | null = null;

  try {
    console.log(`${LOG_PREFIX} POST /api/admin/shop-branding [${requestId}] - Start`);

    // Step 1: Initialize Supabase
    const supabase = getSupabaseAdmin();
    if (!supabase) {
      const [errData, status] = errorResponse(
        "Supabase not configured on server",
        "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY",
        undefined,
        "SUPABASE_CONFIG_ERROR",
        500
      );
      console.error(
        `${LOG_PREFIX} POST [${requestId}] - Supabase init failed:`,
        errData
      );
      return NextResponse.json(errData, { status });
    }

    // Step 2: Parse request body safely
    try {
      body = await request.json();
    } catch (parseErr) {
      const parseError =
        parseErr instanceof Error ? parseErr.message : String(parseErr);
      const [errData, status] = errorResponse(
        "Invalid JSON in request body",
        parseError,
        "Ensure request body is valid JSON",
        "JSON_PARSE_ERROR",
        400
      );
      console.error(
        `${LOG_PREFIX} POST [${requestId}] - JSON parse failed:`,
        errData
      );
      return NextResponse.json(errData, { status });
    }

    console.log(`${LOG_PREFIX} POST [${requestId}] - Incoming body:`, body);

    // Step 3: Validate required field: id
    if (!body || !body.id) {
      const [errData, status] = errorResponse(
        "Missing required field: id",
        "Request body must include 'id' field",
        "Example: { id: 1, shop_name: '...', location_address: '...' }",
        "MISSING_ID",
        400
      );
      console.error(
        `${LOG_PREFIX} POST [${requestId}] - Missing id:`,
        errData
      );
      return NextResponse.json(errData, { status });
    }

    // Step 4: Sanitize and whitelist update data
    const updateData = sanitizeUpdateData(body);
    console.log(
      `${LOG_PREFIX} POST [${requestId}] - Sanitized data:`,
      updateData
    );

    // Step 5: Ensure at least one valid field exists
    if (!hasValidFields(updateData)) {
      const [errData, status] = errorResponse(
        "No valid fields provided to update",
        "After filtering, no whitelisted columns were found in request",
        `Valid fields: ${VALID_COLUMNS.join(", ")}`,
        "NO_VALID_FIELDS",
        400
      );
      console.error(
        `${LOG_PREFIX} POST [${requestId}] - No valid fields:`,
        errData
      );
      return NextResponse.json(errData, { status });
    }

    // Step 6: Perform Supabase update
    console.log(
      `${LOG_PREFIX} POST [${requestId}] - Updating shop_branding WHERE id = ${body.id}`
    );
    const { data, error } = await supabase
      .from("shop_branding")
      .update(updateData)
      .eq("id", body.id)
      .select();

    // Step 7: Handle Supabase errors
    if (error) {
      console.error(
        `${LOG_PREFIX} POST [${requestId}] - Supabase error:`,
        {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
        }
      );

      // Return 400 for expected Supabase errors
      if (error.code === "PGRST204" || error.code === "PGRST116") {
        const [errData, status] = errorResponse(
          error.message || "Database operation failed",
          error.details,
          error.hint,
          error.code,
          400
        );
        return NextResponse.json(errData, { status });
      }

      // Return 500 for unexpected Supabase errors
      const [errData, status] = errorResponse(
        "Database operation failed",
        error.message,
        error.hint,
        error.code,
        500
      );
      return NextResponse.json(errData, { status });
    }

    // Step 8: Success
    const response: SuccessResponse = {
      success: true,
      data: data || [],
      message: "Location updated successfully",
    };
    console.log(
      `${LOG_PREFIX} POST [${requestId}] - Success:`,
      response.message
    );
    return NextResponse.json(response);
  } catch (error) {
    // Step 9: Catch any uncaught exceptions
    const errorMessage =
      error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    const errorCode = error instanceof Error && "code" in error ? error.code : undefined;

    console.error(`${LOG_PREFIX} POST [${requestId}] - UNCAUGHT EXCEPTION:`, {
      message: errorMessage,
      code: errorCode,
      stack: errorStack,
      body,
    });

    const [errData, status] = errorResponse(
      "Internal server error",
      errorMessage,
      "Check server logs for details",
      "UNCAUGHT_EXCEPTION",
      500
    );
    return NextResponse.json(errData, { status });
  }
}

export async function GET(request: NextRequest) {
  const requestId = Date.now(); // For tracing

  try {
    console.log(`${LOG_PREFIX} GET /api/admin/shop-branding [${requestId}] - Start`);

    // Step 1: Initialize Supabase
    const supabase = getSupabaseAdmin();
    if (!supabase) {
      const [errData, status] = errorResponse(
        "Supabase not configured on server",
        "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY",
        undefined,
        "SUPABASE_CONFIG_ERROR",
        500
      );
      console.error(
        `${LOG_PREFIX} GET [${requestId}] - Supabase init failed:`,
        errData
      );
      return NextResponse.json(errData, { status });
    }

    // Step 2: Fetch shop branding
    console.log(`${LOG_PREFIX} GET [${requestId}] - Fetching from shop_branding table`);
    const { data, error } = await supabase
      .from("shop_branding")
      .select("*")
      .limit(1)
      .single();

    // Step 3: Handle Supabase errors
    if (error) {
      // PGRST116 is "no rows found" - return empty data instead of error
      if (error.code === "PGRST116") {
        console.log(
          `${LOG_PREFIX} GET [${requestId}] - No rows found, returning empty object`
        );
        const response: SuccessResponse = {
          success: true,
          data: {},
        };
        return NextResponse.json(response);
      }

      console.error(
        `${LOG_PREFIX} GET [${requestId}] - Supabase error:`,
        {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
        }
      );

      const [errData, status] = errorResponse(
        "Failed to fetch branding",
        error.message,
        error.hint,
        error.code,
        500
      );
      return NextResponse.json(errData, { status });
    }

    // Step 4: Success
    const response: SuccessResponse = {
      success: true,
      data: data || {},
    };
    console.log(`${LOG_PREFIX} GET [${requestId}] - Success, returned data`);
    return NextResponse.json(response);
  } catch (error) {
    // Step 5: Catch any uncaught exceptions
    const errorMessage =
      error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    const errorCode = error instanceof Error && "code" in error ? error.code : undefined;

    console.error(`${LOG_PREFIX} GET [${requestId}] - UNCAUGHT EXCEPTION:`, {
      message: errorMessage,
      code: errorCode,
      stack: errorStack,
    });

    const [errData, status] = errorResponse(
      "Internal server error",
      errorMessage,
      "Check server logs for details",
      "UNCAUGHT_EXCEPTION",
      500
    );
    return NextResponse.json(errData, { status });
  }
}
