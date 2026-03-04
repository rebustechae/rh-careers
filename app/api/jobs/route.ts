import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { logError, errorResponse } from "@/app/lib/api-utils";
import { appConfig } from "@/app/lib/config";

/**
 * GET /api/jobs
 * Retrieves all active jobs
 */
export async function GET() {
  try {
    const supabase = createClient(
      appConfig.supabase.url,
      appConfig.supabase.anonKey
    );

    const { data, error } = await supabase
      .from("jobs")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (error) {
      logError("Supabase query failed", error);
      return errorResponse(error.message, 500);
    }

    return NextResponse.json(data || []);
  } catch (error) {
    logError("GET /api/jobs", error);
    return errorResponse("Internal Server Error", 500);
  }
}
