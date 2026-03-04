import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/app/lib/supabase-admin";
import { cookies } from "next/headers";
import { logError, errorResponse } from "@/app/lib/api-utils";
import { ERROR_MESSAGES } from "@/app/lib/constants";

/**
 * Validates user authentication via session token
 */
async function validateAuth() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("sb-access-token")?.value;

  if (!accessToken) {
    return { valid: false, error: ERROR_MESSAGES.UNAUTHORIZED, status: 401 };
  }

  const {
    data: { user },
    error,
  } = await supabaseAdmin.auth.getUser(accessToken);

  if (error || !user) {
    return { valid: false, error: ERROR_MESSAGES.UNAUTHORIZED, status: 401 };
  }

  return { valid: true, user };
}

/**
 * GET /api/admin/applications/stats
 * Returns count of applications per job
 */
export async function GET() {
  try {
    const auth = await validateAuth();
    if (!auth.valid) {
      return errorResponse(auth.error || ERROR_MESSAGES.UNAUTHORIZED, auth.status);
    }

    const { data, error } = await supabaseAdmin
      .from("applications")
      .select("job_id")
      .returns<{ job_id: string }[]>();

    if (error) {
      logError("Failed to fetch application stats", error);
      return errorResponse(ERROR_MESSAGES.FETCH_FAILED, 500);
    }

    const counts: Record<string, number> = {};
    data?.forEach((app) => {
      counts[app.job_id] = (counts[app.job_id] || 0) + 1;
    });

    return NextResponse.json(counts);
  } catch (error) {
    logError("GET /api/admin/applications/stats", error);
    return errorResponse(ERROR_MESSAGES.INTERNAL_ERROR, 500);
  }
}
