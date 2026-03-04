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

  const { data: { user }, error } = await supabaseAdmin.auth.getUser(accessToken);

  if (error || !user) {
    return { valid: false, error: ERROR_MESSAGES.UNAUTHORIZED, status: 401 };
  }

  return { valid: true, user };
}

/**
 * PATCH /api/admin/jobs/[id]
 * Updates a specific job
 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await validateAuth();
    if (!auth.valid) {
      return errorResponse(auth.error, auth.status);
    }

    const { id } = await params;
    const body = await req.json();

    const updateResult = await supabaseAdmin
      .from("jobs")
      .update(body)
      .eq("id", id)
      .select();

    if (updateResult.error) {
      logError("Failed to update job", updateResult.error);
      return errorResponse(ERROR_MESSAGES.UPDATE_FAILED, 500);
    }

    if (!updateResult.data || updateResult.data.length === 0) {
      return errorResponse("Job not found", 404);
    }

    return NextResponse.json(updateResult.data[0], { status: 200 });
  } catch (error) {
    logError("PATCH /api/admin/jobs/[id]", error);
    return errorResponse(ERROR_MESSAGES.INTERNAL_ERROR, 500);
  }
}

/**
 * DELETE /api/admin/jobs/[id]
 * Deletes a specific job
 */
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await validateAuth();
    if (!auth.valid) {
      return errorResponse(auth.error, auth.status);
    }

    const { id } = await params;

    const { error } = await supabaseAdmin
      .from("jobs")
      .delete()
      .eq("id", id);

    if (error) {
      logError("Failed to delete job", error);
      return errorResponse(ERROR_MESSAGES.DELETE_FAILED, 500);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logError("DELETE /api/admin/jobs/[id]", error);
    return errorResponse(ERROR_MESSAGES.INTERNAL_ERROR, 500);
  }
}

