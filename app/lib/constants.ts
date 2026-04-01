/**
 * Application-wide constants
 */

// Department options
export const DEPARTMENTS = [
  "Engineering & Contracting",
  "Technology Solutions",
  "Projects Management",
  "Safety and Security",
] as const;

// Employment type options
export const EMPLOYMENT_TYPES = [
  "Full-time",
  "Part-time",
  "Contract",
  "Temporary",
] as const;

// Work mode options
export const WORK_MODES = [
  "Remote",
  "On-site",
  "Hybrid",
] as const;

// UAE Emirates
export const EMIRATES = [
  "Abu Dhabi",
  "Dubai",
  "Sharjah",
  "Ajman",
  "Umm Al Quwain",
  "Ras Al Khaimah",
  "Fujairah",
] as const;

// Application statuses
export const APPLICATION_STATUSES = [
  "Applied",
  "Shortlisted",
  "Accepted",
  "Rejected",
] as const;

// Email configuration (SMTP via Nodemailer)
const parseBool = (value: string | undefined, fallback: boolean) => {
  if (value == null) return fallback;
  const v = value.trim().toLowerCase();
  if (["true", "1", "yes", "y", "on"].includes(v)) return true;
  if (["false", "0", "no", "n", "off"].includes(v)) return false;
  return fallback;
};

const parseIntOr = (value: string | undefined, fallback: number) => {
  if (value == null) return fallback;
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) ? n : fallback;
};

export const EMAIL_CONFIG = {
  // Default to Office 365 SMTP
  HOST: process.env.EMAIL_HOST || "smtp.office365.com",
  PORT: parseIntOr(process.env.EMAIL_PORT, 587),
  SECURE: parseBool(process.env.EMAIL_SECURE, false),
  FROM_NAME: process.env.EMAIL_FROM_NAME || "Rebus Holdings",
  // Important: Office 365 will block "Send As" unless the authenticated user has permission.
  // Default to EMAIL_USER to avoid SendAsDenied errors.
  FROM_EMAIL: process.env.EMAIL_FROM_EMAIL || process.env.EMAIL_USER || "hr@rebus.ae",
} as const;

// UI Configuration
export const UI_CONFIG = {
  ANIMATION_DURATION: 0.6,
  TOAST_DURATION: 3000,
  DEBOUNCE_DELAY: 300,
} as const;

// API endpoints
export const API_ENDPOINTS = {
  JOBS: "/api/jobs",
  ADMIN_JOBS: "/api/admin/jobs",
  ADMIN_APPLICATIONS: "/api/admin/applications",
  ADMIN_APPLICATIONS_STATS: "/api/admin/applications/stats",
  ADMIN_SEND_EMAIL: "/api/admin/applications/send-email",
  AUTH_LOGIN: "/api/auth/login",
  AUTH_LOGOUT: "/api/auth/logout",
  AUTH_ME: "/api/auth/me",
  APPLY: "/api/apply",
} as const;

// Error messages
export const ERROR_MESSAGES = {
  UNAUTHORIZED: "Unauthorized access",
  INVALID_SESSION: "Invalid session",
  MISSING_FIELDS: "Missing required fields",
  INVALID_STATUS: "Invalid status",
  EMAIL_FAILED: "Email service failed",
  FETCH_FAILED: "Failed to fetch data",
  UPDATE_FAILED: "Failed to update",
  DELETE_FAILED: "Failed to delete",
  CREATE_FAILED: "Failed to create",
  INTERNAL_ERROR: "Internal Server Error",
} as const;

// Success messages
export const SUCCESS_MESSAGES = {
  EMAIL_SENT: "Email sent successfully",
  JOB_CREATED: "Job created successfully",
  JOB_UPDATED: "Job updated successfully",
  JOB_DELETED: "Job deleted successfully",
  STATUS_UPDATED: "Status updated successfully",
} as const;
