import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/app/lib/supabase-admin";
import { cookies } from "next/headers";
import { logError, errorResponse } from "@/app/lib/api-utils";
import { hasRequiredFields } from "@/app/lib/validation";
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from "@/app/lib/constants";
import { Job } from "@/app/types";

/**
 * Validates user authentication via session token
 */
async function validateAuth() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("sb-access-token")?.value;

  if (!accessToken) {
    return { valid: false, error: ERROR_MESSAGES.UNAUTHORIZED, status: 401 };
  }

  const { data: { user }, error } = await supabaseAdmin.auth.getUser(accessToken);

  if (error || !user) {
    return { valid: false, error: ERROR_MESSAGES.UNAUTHORIZED, status: 401 };
  }

  return { valid: true, user };
}

/**
 * GET /api/admin/jobs
 * Retrieves all jobs (including inactive ones)
 */
export async function GET() {
  try {
    const auth = await validateAuth();
    if (!auth.valid) {
      return errorResponse(auth.error, auth.status);
    }

    const { data, error } = await supabaseAdmin
      .from("jobs")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      logError("Failed to fetch jobs", error);
      return errorResponse(ERROR_MESSAGES.FETCH_FAILED, 500);
    }

    return NextResponse.json(data || []);
  } catch (error) {
    logError("GET /api/admin/jobs", error);
    return errorResponse(ERROR_MESSAGES.INTERNAL_ERROR, 500);
  }
}

/**
 * POST /api/admin/jobs
 * Creates a new job posting
 */
export async function POST(req: Request) {
  try {
    const auth = await validateAuth();
    if (!auth.valid) {
      return errorResponse(auth.error, auth.status);
    }

    const body = await req.json();
    const {
      title,
      department,
      location,
      vacancies,
      employment_type,
      work_mode,
      requirements,
      responsibilities,
      is_active = true,
    } = body;

    const requiredFields = ["title", "department", "location", "employment_type", "work_mode"];
    if (!hasRequiredFields(body, requiredFields)) {
      return errorResponse(ERROR_MESSAGES.MISSING_FIELDS, 400);
    }

    const jobId = crypto.randomUUID();

    const { data, error } = await supabaseAdmin
      .from("jobs")
      .insert([
        {
          id: jobId,
          title,
          department,
          location: location || null,
          vacancies: vacancies || null,
          employment_type: employment_type || null,
          work_mode: work_mode || null,
          requirements: requirements && requirements.length > 0 ? requirements : null,
          responsibilities: responsibilities && responsibilities.length > 0 ? responsibilities : null,
          is_active,
        },
      ])
      .select()
      .single();

    if (error) {
      logError("Failed to create job", error);
      return errorResponse(ERROR_MESSAGES.CREATE_FAILED, 500);
    }

    if (!data) {
      return errorResponse(ERROR_MESSAGES.CREATE_FAILED, 500);
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    logError("POST /api/admin/jobs", error);
    return errorResponse(ERROR_MESSAGES.INTERNAL_ERROR, 500);
  }
}

