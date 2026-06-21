import { logger } from "../utils/logger.js";

export function errorHandler(err, req, res, next) {
  logger.error(`[ErrorHandler] ${err.message}`, { stack: err.stack, path: req.path });

  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(413).json({ error: "File too large. Max size is 10MB." });
  }

  const status = err.status || err.statusCode || 500;
  res.status(status).json({
    error: err.message || "Internal Server Error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
}
