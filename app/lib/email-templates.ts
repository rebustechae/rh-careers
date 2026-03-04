/**
 * Email templates for application status notifications
 */

import { ApplicationStatus } from "@/app/types";

interface EmailTemplate {
  subject: string;
  htmlContent: string;
}

/**
 * Gets email template based on application status
 */
export const getEmailTemplate = (
  status: ApplicationStatus,
  candidateName: string,
  jobTitle: string
): EmailTemplate => {
  const baseStyles = "font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0;";

  const templates: Record<ApplicationStatus, EmailTemplate> = {
    Accepted: {
      subject: `Congratulations! Your application for ${jobTitle} has been accepted`,
      htmlContent: `
        <div style="${baseStyles}">
          <h2 style="color: #059669;">Congratulations, ${candidateName}!</h2>
          <p>We are pleased to inform you that your application for <strong>${jobTitle}</strong> has been accepted!</p>
          <p>Our team will contact you shortly for next steps.</p>
        </div>
      `,
    },
    Shortlisted: {
      subject: `Update on your application for ${jobTitle}`,
      htmlContent: `
        <div style="${baseStyles}">
          <h2 style="color: #10b981;">Application Update</h2>
          <p>Dear ${candidateName},</p>
          <p>Your application for <strong>${jobTitle}</strong> has been shortlisted! We will contact you soon regarding the next steps.</p>
        </div>
      `,
    },
    Rejected: {
      subject: `Update on your application for ${jobTitle}`,
      htmlContent: `
        <div style="${baseStyles}">
          <h2 style="color: #dc2626;">Application Update</h2>
          <p>Dear ${candidateName},</p>
          <p>After careful consideration, we have decided to move forward with other candidates for the <strong>${jobTitle}</strong> position.</p>
          <p>We encourage you to apply for future roles at Rebus Holdings.</p>
        </div>
      `,
    },
    Applied: {
      subject: `Application Received for ${jobTitle}`,
      htmlContent: `
        <div style="${baseStyles}">
          <h2 style="color: #2563eb;">Application Received</h2>
          <p>Dear ${candidateName},</p>
          <p>Thank you for applying for the <strong>${jobTitle}</strong> position at Rebus Holdings.</p>
          <p>We have received your application and will review it carefully. You will hear from us soon.</p>
        </div>
      `,
    },
  };

  return templates[status];
};
