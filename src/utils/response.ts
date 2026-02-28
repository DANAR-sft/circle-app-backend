import { Response } from "express";

/**
 * Standard success response helper
 */
export function successResponse(
  res: Response,
  data: unknown,
  message: string,
  statusCode: number = 200,
  extra?: Record<string, unknown>,
) {
  return res.status(statusCode).json({
    code: statusCode,
    status: "success",
    message,
    data,
    ...extra,
  });
}

/**
 * Standard error response helper
 */
export function errorResponse(
  res: Response,
  message: string,
  statusCode: number = 500,
  error?: unknown,
) {
  const body: Record<string, unknown> = {
    code: statusCode,
    status: "error",
    message,
  };
  if (error instanceof Error) {
    body.error = error.message;
  }
  return res.status(statusCode).json(body);
}
