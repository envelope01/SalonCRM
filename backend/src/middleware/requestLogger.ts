import { logger } from "../lib/logger";

export function requestLogger(req: any, res: any, next: any) {
  const startedAt = Date.now();

  res.on("finish", () => {
    const durationMs = Date.now() - startedAt;
    const context = {
      requestId: req.requestId,
      method: req.method,
      path: req.originalUrl || req.url,
      statusCode: res.statusCode,
      durationMs,
    };

    if (res.statusCode >= 500) logger.error("request_failed", context);
    else if (res.statusCode >= 400) logger.warn("request_rejected", context);
    else logger.info("request_completed", context);
  });

  next();
}
