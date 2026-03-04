/**
 * Validation utilities for common use cases
 */

/**
 * Validates email format
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validates phone number format
 */
export const isValidPhone = (phone: string): boolean => {
  const phoneRegex = /^[\d\s\-\+\(\)]{10,}$/;
  return phoneRegex.test(phone);
};

/**
 * Checks if a string is empty or contains only whitespace
 */
export const isEmpty = (value: string): boolean => {
  return !value || value.trim().length === 0;
};

/**
 * Validates required fields
 */
export const hasRequiredFields = (
  obj: Record<string, unknown> | unknown,
  requiredFields: string[]
): boolean => {
  if (!obj || typeof obj !== "object") return false;
  
  const objRecord = obj as Record<string, unknown>;
  return requiredFields.every((field) => {
    const value = objRecord[field];
    if (typeof value === "string") {
      return !isEmpty(value);
    }
    return value !== null && value !== undefined;
  });
};

/**
 * Sanitizes user input to prevent XSS
 */
export const sanitizeInput = (input: string): string => {
  return input
    .replace(/[<>]/g, "")
    .trim();
};

/**
 * Validates job form data
 */
export const isValidJobForm = (data: {
  title: string;
  department: string;
  location: string;
  employment_type: string;
  work_mode: string;
  description: string;
}): boolean => {
  return (
    !isEmpty(data.title) &&
    !isEmpty(data.department) &&
    !isEmpty(data.location) &&
    !isEmpty(data.employment_type) &&
    !isEmpty(data.work_mode) &&
    !isEmpty(data.description)
  );
};

/**
 * Validates application submission
 */
export const isValidApplication = (data: {
  job_id: string;
  full_name: string;
  email: string;
  resume_url: string;
}): boolean => {
  return (
    !isEmpty(data.job_id) &&
    !isEmpty(data.full_name) &&
    isValidEmail(data.email) &&
    !isEmpty(data.resume_url)
  );
};
