import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { supabaseAdmin } from "@/app/lib/supabase-admin";
import { cookies } from "next/headers";
import { appConfig } from "@/app/lib/config";
import { getEmailTemplate } from "@/app/lib/email-templates";
import { hasRequiredFields } from "@/app/lib/validation";
import { ERROR_MESSAGES, EMAIL_CONFIG } from "@/app/lib/constants";
import { errorResponse, logError } from "@/app/lib/api-utils";
import { EmailPayload } from "@/app/types";

/**
 * Email transporter configuration
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
    return { valid: false, error: ERROR_MESSAGES.INVALID_SESSION, status: 401 };
  }

  return { valid: true, user };
}

/**
 * POST /api/admin/applications/send-email
 * Sends email notification to candidate about application status
 */
export async function POST(req: Request) {
  try {
    const auth = await validateAuth();
    if (!auth.valid) {
      return errorResponse(auth.error, auth.status);
    }

    const body = await req.json() as EmailPayload;

    const requiredFields = ["applicationId", "status", "candidateEmail", "candidateName", "jobTitle"];
    if (!hasRequiredFields(body, requiredFields)) {
      return errorResponse(ERROR_MESSAGES.MISSING_FIELDS, 400);
    }

    const { status, candidateName, candidateEmail, jobTitle } = body;

    const emailTemplate = getEmailTemplate(status, candidateName, jobTitle);

    try {
      const transporter = createTransporter();
      await transporter.sendMail({
        from: `"${EMAIL_CONFIG.FROM_NAME}" <${EMAIL_CONFIG.FROM_EMAIL}>`,
        to: candidateEmail,
        subject: emailTemplate.subject,
        html: emailTemplate.htmlContent,
      });

      return NextResponse.json({ success: true });
    } catch (emailError) {
      logError("Email sending failed", emailError, { candidateEmail, jobTitle });
      return errorResponse(ERROR_MESSAGES.EMAIL_FAILED, 500);
    }
  } catch (error) {
    logError("Send email endpoint", error);
    return errorResponse(ERROR_MESSAGES.INTERNAL_ERROR, 500);
  }
}