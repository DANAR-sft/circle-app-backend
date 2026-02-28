import { Request, Response, NextFunction } from "express";

/**
 * Wraps an async route handler and passes errors to Express error handler.
 * Eliminates the need for try-catch in every controller function.
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
