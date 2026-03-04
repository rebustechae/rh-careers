import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/app/lib/supabase-admin";
import { cookies } from "next/headers";

async function checkAuth() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("sb-access-token")?.value;

  if (!accessToken) {
    return { error: "Unauthorized", status: 401 };
  }

  const {
    data: { user },
    error,
  } = await supabaseAdmin.auth.getUser(accessToken);

  if (error || !user) {
    return { error: "Unauthorized", status: 401 };
  }

  return { user };
}

export async function GET() {
  try {
    const auth = await checkAuth();
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { data, error } = await supabaseAdmin
      .from("applications")
      .select("job_id")
      .returns<{ job_id: string }[]>();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const counts = data.reduce((acc: Record<string, number>, curr) => {
      acc[curr.job_id] = (acc[curr.job_id] || 0) + 1;
      return acc;
    }, {});

    return NextResponse.json(counts);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
