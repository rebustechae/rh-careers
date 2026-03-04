/**
 * Utility functions for API responses and error handling
 */

import { NextResponse } from "next/server";
import { ApiResponse } from "@/app/types";

/**
 * Creates a successful JSON response
 */
export const successResponse = <T = unknown>(
  data: T,
  status: number = 200
): NextResponse<ApiResponse<T>> => {
  return NextResponse.json(
    {
      success: true,
      data,
      status,
    },
    { status }
  );
};

/**
 * Creates an error JSON response
 */
export const errorResponse = (
  error: string | undefined,
  status: number = 400
): NextResponse<ApiResponse> => {
  return NextResponse.json(
    {
      success: false,
      error: error || "Unknown error",
      status,
    },
    { status }
  );
};

/**
 * Safely parses request JSON body
 */
export const parseRequestBody = async (req: Request): Promise<{
  success: boolean;
  data?: unknown;
  error?: string;
}> => {
  try {
    const data = await req.json();
    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: "Invalid JSON body",
    };
  }
};

/**
 * Logs errors with context
 */
export const logError = (
  context: string,
  error: unknown,
  additionalInfo?: Record<string, unknown>
): void => {
  const errorMessage = error instanceof Error ? error.message : String(error);
  console.error(`[${context}]`, errorMessage, additionalInfo);
};

/**
 * Handles async API route execution with error catching
 */
export const handleApiRoute = async <T>(
  handler: () => Promise<T>
): Promise<{
  success: boolean;
  data?: T;
  error?: string;
}> => {
  try {
    const data = await handler();
    return { success: true, data };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    logError("API Handler", error);
    return { success: false, error: message };
  }
};
