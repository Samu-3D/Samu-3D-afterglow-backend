import { ApiError } from "../utils/apiError.js";

export function notFound(req, _res, next) {
  next(new ApiError(404, `Route not found: ${req.originalUrl}`));
}

export function errorHandler(err, _req, res, _next) {
  const status = err.statusCode || 500;

  if (err.name === "ValidationError") {
    return res.status(400).json({
      success: false,
      message: Object.values(err.errors).map((e) => e.message).join(", "),
    });
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0] || "field";
    return res.status(409).json({ success: false, message: `${field} already exists.` });
  }

  res.status(status).json({
    success: false,
    message: err.message || "Server error",
    ...(process.env.NODE_ENV !== "production" ? { stack: err.stack } : {}),
  });
}
