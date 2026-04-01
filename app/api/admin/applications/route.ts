import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { supabaseAdmin } from "@/app/lib/supabase-admin";
import { cookies } from "next/headers";
import { appConfig } from "@/app/lib/config";
import { getEmailTemplate } from "@/app/lib/email-templates";
import { logError, errorResponse } from "@/app/lib/api-utils";
import { ERROR_MESSAGES } from "@/app/lib/constants";   

/**
 * Creates email transporter
 */
const createTransporter = () => {
  return nodemailer.createTransport({
    host: "smtp.office365.com",
    port: 587,
    secure: false,
    auth: {
      user: appConfig.email.user,
      pass: appConfig.email.pass,
    },
  });
};

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true, 
  pool: true,
  maxConnections: 5,
  maxMessages: 100,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

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

export async function GET(req: Request) {
  try {
    const auth = await validateAuth();
    if (!auth.valid) return errorResponse(auth.error, auth.status);

    const { searchParams } = new URL(req.url);
    const jobId = searchParams.get("jobId");

    let query = supabaseAdmin
      .from("applications")
      .select(`
        id,
        full_name,
        email,
        status,
        created_at,
        resume_url,
        jobs (
          title
        )
      `)
      .order("created_at", { ascending: false });

    if (jobId) {
      query = query.eq("job_id", jobId);
    }

    const { data, error } = await query;

    if (error) throw error;

    // Format data for the frontend component
    const formattedData = data.map((app: any) => ({
      id: app.id,
      name: app.full_name,
      email: app.email,
      jobPosition: app.jobs?.title || "Unknown Position",
      dateApplied: app.created_at,
      status: app.status,
      resumeUrl: app.resume_url,
    }));

    return NextResponse.json(formattedData);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const auth = await validateAuth();
    if (!auth.valid) return errorResponse(auth.error, auth.status);

    const body = await req.json();
    const { id, status, note, name, email } = body;

    if (!id) return errorResponse("Application ID required", 400);

    const { data: application, error: fetchError } = await supabaseAdmin
      .from("applications")
      .select(`
        full_name, 
        email, 
        jobs ( 
          title 
        )
      `)
      .eq("id", id)
      .single();

    if (fetchError || !application) {
      return errorResponse("Application not found", 404);
    }

    const updateData: any = {};
    if (status !== undefined) updateData.status = status;
    if (note !== undefined) updateData.admin_note = note;
    if (name !== undefined) updateData.full_name = name;
    if (email !== undefined) updateData.email = email;

    const { error: updateError } = await supabaseAdmin
      .from("applications")
      .update(updateData)
      .eq("id", id);

    if (updateError) {
      logError("Failed to update application", updateError);
      return errorResponse(ERROR_MESSAGES.UPDATE_FAILED, 500);
    }

    if (status && ["Accepted", "Shortlisted", "Rejected"].includes(status)) {
      const runEmailTask = async () => {
        const jobData = application.jobs as unknown as { title: string } | null;
        const jobTitle = jobData?.title || "the position";
        const candidateName = name || application.full_name || "Candidate";
        const targetEmail = email || application.email;

        let subject = "";
        let htmlContent = "";

        if (status === "Accepted") {
          subject = `Congratulations! Your application for ${jobTitle} has been accepted`;
          htmlContent = `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0;">
            <h2 style="color: #059669;">Congratulations, ${candidateName}!</h2>
            <p>We are pleased to inform you that your application for <strong>${jobTitle}</strong> has been accepted!</p>
            <p>Our team will contact you shortly for next steps.</p>
            <p style="margin-top: 30px; color: #666;">Best regards,<br>HR Team | Rebus Holdings</p>
          </div>`;
        } else if (status === "Shortlisted") {
          subject = `Update on your application for ${jobTitle}`;
          htmlContent = `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0;">
            <h2 style="color: #10b981;">Application Update</h2>
            <p>Dear ${candidateName},</p>
            <p>Your application for <strong>${jobTitle}</strong> has been shortlisted! We will contact you soon regarding the next steps.</p>
            <p style="margin-top: 30px; color: #666;">Best regards,<br>HR Team | Rebus Holdings</p>
          </div>`;
        } else if (status === "Rejected") {
          subject = `Update on your application for ${jobTitle}`;
          htmlContent = `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0;">
            <h2 style="color: #dc2626;">Application Update</h2>
            <p>Dear ${candidateName},</p>
            <p>After careful consideration, we have decided to move forward with other candidates for the <strong>${jobTitle}</strong> position.</p>
            <p>We encourage you to apply for future roles at Rebus Holdings.</p>
            <p style="margin-top: 30px; color: #666;">Best regards,<br>HR Team | Rebus Holdings</p>
          </div>`;
        }

        try {
          await transporter.sendMail({
            from: `"Rebus Careers" <${process.env.EMAIL_USER}>`,
            to: targetEmail,
            subject,
            html: htmlContent,
          });
        } catch (err) {
          console.error("Delayed Email Error:", err);
        }
      };
      runEmailTask();
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logError("PATCH /api/admin/applications", error);
    return errorResponse(ERROR_MESSAGES.INTERNAL_ERROR, 500);
  }
}

export async function DELETE(req: Request) {
  try {
    const auth = await validateAuth();
    if (!auth.valid) return errorResponse(auth.error, auth.status);

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) return errorResponse("ID required", 400);

    const { error } = await supabaseAdmin.from("applications").delete().eq("id", id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    logError("DELETE /api/admin/applications", error);
    return errorResponse(ERROR_MESSAGES.INTERNAL_ERROR, 500);
  }
}