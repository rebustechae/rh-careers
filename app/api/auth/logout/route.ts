import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { logError } from "@/app/lib/api-utils";

/**
 * POST /api/auth/logout
 * Clears authentication tokens and logs out user
 */
export async function POST() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete("sb-access-token");
    cookieStore.delete("sb-refresh-token");

    return NextResponse.json({ success: true });
  } catch (error) {
    logError("POST /api/auth/logout", error);
    return NextResponse.json(
      { error: "Failed to logout" },
      { status: 500 }
    );
  }
}

