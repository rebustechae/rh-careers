/**
 * Type definitions for the Careers Management System
 */

export interface Job {
  id: string;
  title: string;
  department: string;
  location: string;
  vacancies: number;
  employment_type: string;
  work_mode: string;
  description: string;
  requirements: string[];
  responsibilities: string[];
  applicants?: number;
  isActive: boolean;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Candidate {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  resume_url: string;
  job_id: string;
  status: "Applied" | "Shortlisted" | "Accepted" | "Rejected";
  created_at: string;
  updated_at: string;
}

export interface Application {
  id: string;
  job_id: string;
  candidate_id: string;
  status: ApplicationStatus;
  created_at: string;
  updated_at: string;
}

export type ApplicationStatus = "Applied" | "Shortlisted" | "Accepted" | "Rejected";

export interface EmailPayload {
  applicationId: string;
  status: ApplicationStatus;
  candidateName: string;
  candidateEmail: string;
  jobTitle: string;
}

export interface AuthUser {
  id: string;
  email: string;
  user_metadata?: Record<string, unknown>;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  status: number;
}
