import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/app/lib/supabase-admin";
import { cookies } from "next/headers";

// Helper to check authentication
async function checkAuth() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("sb-access-token")?.value;

  if (!accessToken) {
    return { error: "Unauthorized", status: 401 };
  }

  const { data: { user }, error } = await supabaseAdmin.auth.getUser(accessToken);

  if (error || !user) {
    return { error: "Unauthorized", status: 401 };
  }

  return { user };
}

// GET all jobs (including inactive)
export async function GET() {
  try {
    const auth = await checkAuth();
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { data, error } = await supabaseAdmin
      .from("jobs")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data || []);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

// POST create new job
export async function POST(req: Request) {
  try {
    const auth = await checkAuth();
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
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

    if (!title || !department) {
      return NextResponse.json(
        { error: "Title and department are required" },
        { status: 400 }
      );
    }

    // Generate a UUID for the job ID
    const jobId = crypto.randomUUID();

    console.log("Creating job with data:", body);

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
      console.error("Supabase error creating job:", error);
      return NextResponse.json(
        { error: error.message || "Failed to create job in database" },
        { status: 500 }
      );
    }

    if (!data) {
      console.error("No data returned from insert");
      return NextResponse.json(
        { error: "Job was not created" },
        { status: 500 }
      );
    }

    console.log("Job created successfully:", data);
    return NextResponse.json(data, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

