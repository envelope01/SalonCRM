const crypto = require("node:crypto");

export function requestContext(req: any, res: any, next: any) {
  const requestId = req.headers["x-request-id"] || crypto.randomUUID();

  req.requestId = requestId;
  res.setHeader("X-Request-Id", requestId);

  next();
}
