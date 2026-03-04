import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/app/lib/supabase-server";
import { logError, errorResponse } from "@/app/lib/api-utils";
import { ERROR_MESSAGES } from "@/app/lib/constants";

/**
 * POST /api/auth/login
 * Authenticates user with email and password
 */
export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return errorResponse(ERROR_MESSAGES.MISSING_FIELDS, 400);
    }

    const supabase = await createClient();

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      logError("Login authentication failed", error);
      return errorResponse(ERROR_MESSAGES.UNAUTHORIZED, 401);
    }

    if (!data.session) {
      return errorResponse("Failed to create session", 500);
    }

    const cookieStore = await cookies();

    cookieStore.set("sb-access-token", data.session.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 4,
    });

    cookieStore.set("sb-refresh-token", data.session.refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 4,
    });

    return NextResponse.json({
      success: true,
      user: data.user,
    });
  } catch (error) {
    logError("POST /api/auth/login", error);
    return errorResponse(ERROR_MESSAGES.INTERNAL_ERROR, 500);
  }
}