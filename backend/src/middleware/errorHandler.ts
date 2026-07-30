import { AppError } from "../lib/httpErrors";
import { logger } from "../lib/logger";

export function notFoundHandler(req: any, _res: any, next: any) {
  next(new AppError(404, `Route not found: ${req.method} ${req.originalUrl || req.url}`));
}

export function errorHandler(error: any, req: any, res: any, _next: any) {
  const statusCode = Number(error.statusCode) || 500;
  const isOperational = error.isOperational === true;
  const message = isOperational ? error.message : "Server error";

  logger.error("request_error", {
    requestId: req.requestId,
    method: req.method,
    path: req.originalUrl || req.url,
    statusCode,
    error,
  });

  res.status(statusCode).json({ message });
}
