import { supabaseAdmin } from "@/app/lib/supabase-admin";
import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { appConfig } from "@/app/lib/config";
import { logError, errorResponse } from "@/app/lib/api-utils";
import { isValidApplication } from "@/app/lib/validation";
import { EMAIL_CONFIG, ERROR_MESSAGES } from "@/app/lib/constants";

/**
 * Creates email transporter for sending notifications
 */
const createTransporter = () => {
  return nodemailer.createTransport({
    host: EMAIL_CONFIG.HOST,
    port: EMAIL_CONFIG.PORT,
    secure: EMAIL_CONFIG.SECURE,
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
 * POST /api/apply
 * Submits a new job application and sends confirmation emails
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { job_id, full_name, email, resume_url, message } = body;

    if (!isValidApplication({ job_id, full_name, email, resume_url })) {
      return errorResponse(ERROR_MESSAGES.MISSING_FIELDS, 400);
    }

    const { data: application, error: dbError } = await supabaseAdmin
      .from("applications")
      .insert([{ job_id, full_name, email, resume_url, message, status: "Applied" }])
      .select()
      .single();

    if (dbError) {
      logError("Failed to create application", dbError);
      return errorResponse(ERROR_MESSAGES.CREATE_FAILED, 500);
    }
    const runBackgroundTasks = async () => {
      try {
        const { data: jobData } = await supabaseAdmin
          .from("jobs")
          .select("title")
          .eq("id", job_id)
          .single();

        await transporter.sendMail({
          from: `"Rebus Careers" <careers.rebus@gmail.com>`,
          to: "careers.rebus@gmail.com",
          subject: `New Application: ${full_name} for ${jobData?.title || "Open Role"}`,
          html: `
            <div style="font-family: sans-serif; color: #333; max-width: 600px; border: 1px solid #eee; padding: 20px;">
              <h2 style="color: #1e293b;">New Application Received</h2>
              <hr />
              <p><strong>Candidate:</strong> ${full_name}</p>
              <p><strong>Email:</strong> ${email}</p>
              <p><strong>Role:</strong> ${jobData?.title || "N/A"} (ID: ${job_id})</p>
              <p><strong>Message:</strong> ${message}</p>
              <div style="margin-top: 30px;">
                <a href="${resume_url}" style="background: #1e293b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                  View Resume
                </a>
              </div>
            </div>
          `,
          attachments: [
            {
              filename: `${full_name.replace(/\s+/g, '_')}_Resume.pdf`,
              path: resume_url,
            },
          ],
        });
        console.log(`Notification sent for ${full_name}`);
      } catch (mailError) {
        console.error("Background Mail Error:", mailError);
      }
    };
    runBackgroundTasks();
    return NextResponse.json({ success: true }, { status: 200 });
    
  } catch (error: any) {
    console.error("Final Catch Error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}