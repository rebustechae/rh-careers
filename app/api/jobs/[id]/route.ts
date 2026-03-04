import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { logError, errorResponse } from "@/app/lib/api-utils";
import { appConfig } from "@/app/lib/config";

/**
 * GET /api/jobs/[id]
 * Retrieves a specific job by ID
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const supabase = createClient(
      appConfig.supabase.url,
      appConfig.supabase.anonKey
    );

    const { data, error } = await supabase
      .from("jobs")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      logError("Job not found", error);
      return errorResponse("Job not found", 404);
    }

    return NextResponse.json(data);
  } catch (error) {
    logError("GET /api/jobs/[id]", error);
    return errorResponse("Internal Server Error", 500);
  }
}
