import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabaseAdmin } from "@/app/lib/supabase-admin";
import { logError } from "@/app/lib/api-utils";
import { AuthUser } from "@/app/types";

/**
 * GET /api/auth/me
 * Returns current authenticated user
 */
export async function GET() {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get("sb-access-token")?.value;

    if (!accessToken) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    const { data: { user }, error } = await supabaseAdmin.auth.getUser(accessToken);

    if (error || !user) {
      logError("Auth validation failed", error);
      return NextResponse.json({ user: null }, { status: 401 });
    }

    const authUser: AuthUser = {
      id: user.id,
      email: user.email || "",
      user_metadata: user.user_metadata,
    };

    return NextResponse.json({ user: authUser });
  } catch (error) {
    logError("GET /api/auth/me", error);
    return NextResponse.json({ user: null }, { status: 401 });
  }
}

