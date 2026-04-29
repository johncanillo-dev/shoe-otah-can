import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

const VALID_COLUMNS = [
  "shop_name",
  "location_address",
  "location_latitude",
  "location_longitude",
  "location_zoom",
  "location_image_url",
  "banner_url",
  "logo_url",
];

const LOG_PREFIX = "[SHOP-BRANDING-API]";

function sanitize(body: Record<string, unknown>) {
  const out: Record<string, unknown> = {};
  for (const key of VALID_COLUMNS) {
    if (body[key] !== undefined && body[key] !== null) {
      out[key] = body[key];
    }
  }
  out.updated_at = new Date().toISOString();
  return out;
}

function jsonError(message: string, details?: string, code?: string, status = 400) {
  return NextResponse.json(
    { error: message, details, code, timestamp: new Date().toISOString() },
    { status }
  );
}

async function getAdminClient() {
  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return null;
  }
  return supabase;
}

/* ----------------------------- POST ----------------------------- */
export async function POST(request: NextRequest) {
  const requestId = Date.now();
  try {
    console.log(`${LOG_PREFIX} POST #${requestId} start`);

    // 1) Admin Supabase client with service role access
    const supabase = await getAdminClient();
    if (!supabase) {
      return jsonError(
        "Supabase service role not configured",
        "Set SUPABASE_SERVICE_ROLE_KEY in .env.local so the admin API can write branding changes.",
        "CONFIG",
        500
      );
    }

    // 2) Parse body
    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return jsonError("Invalid JSON body", undefined, "PARSE", 400);
    }
    if (!body || typeof body !== "object") {
      return jsonError("Body must be an object", undefined, "BODY", 400);
    }

    const updateData = sanitize(body);
    if (Object.keys(updateData).length <= 1) {
      return jsonError("No valid fields to update", `Allowed: ${VALID_COLUMNS.join(", ")}`, "FIELDS", 400);
    }

    // 3) Fetch existing row
    const { data: rows, error: fetchErr } = await supabase
      .from("shop_branding")
      .select("id")
      .limit(1)
      .maybeSingle();

    if (fetchErr) {
      console.error(`${LOG_PREFIX} POST #${requestId} fetch error:`, fetchErr);
      return jsonError("Database query failed", fetchErr.message, fetchErr.code, 500);
    }

    const hasExistingRow = Boolean(rows?.id);
    let resultData;
    let resultError;

    if (hasExistingRow) {
      const existingId = rows!.id;
      // Update existing
      const { data, error } = await supabase
        .from("shop_branding")
        .update(updateData)
        .eq("id", existingId)
        .select()
        .maybeSingle();
      resultData = data;
      resultError = error;
    } else {
      // Insert default + updates
      const { data, error } = await supabase
        .from("shop_branding")
        .insert({
          shop_name: "Shoe Otah Boutique",
          logo_url: "/shoe-otah-logo.png",
          banner_url: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=500&h=300&fit=crop",
          ...updateData,
        })
        .select()
        .maybeSingle();
      resultData = data;
      resultError = error;
    }

    if (resultError) {
      console.error(`${LOG_PREFIX} POST #${requestId} write error:`, {
        code: resultError.code,
        message: resultError.message,
        details: resultError.details,
        hint: resultError.hint,
      });
      return jsonError("Database update failed", resultError.message, resultError.code, 500);
    }

    console.log(`${LOG_PREFIX} POST #${requestId} success`, resultData?.id);
    return NextResponse.json({
      success: true,
      data: resultData,
      message: hasExistingRow ? "Updated" : "Created",
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`${LOG_PREFIX} POST #${requestId} CRASH:`, message);
    return jsonError("Internal server error", process.env.NODE_ENV === "development" ? message : undefined, "CRASH", 500);
  }
}

/* ----------------------------- GET ----------------------------- */
export async function GET() {
  try {
    const supabase = await getAdminClient();
    if (!supabase) {
      return jsonError(
        "Supabase service role not configured",
        "Set SUPABASE_SERVICE_ROLE_KEY in .env.local so the admin API can read branding changes.",
        "CONFIG",
        500
      );
    }

    const { data, error: err } = await supabase
      .from("shop_branding")
      .select("*")
      .limit(1)
      .maybeSingle();

    if (err) {
      return jsonError("Fetch failed", err.message, err.code, 500);
    }

    return NextResponse.json({ success: true, data: data || {} });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return jsonError("Internal error", message, "CRASH", 500);
  }
}
