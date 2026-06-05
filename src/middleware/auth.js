import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { User } from "../models/User.js";
import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const protect = asyncHandler(async (req, _res, next) => {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) throw new ApiError(401, "Authentication token missing.");

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user || !user.active) throw new ApiError(401, "User is not active or no longer exists.");
    req.user = user;
    next();
  } catch (err) {
    if (err instanceof ApiError) throw err;
    throw new ApiError(401, "Invalid or expired token.");
  }
});

export const requireRoles = (...roles) => (req, _res, next) => {
  if (!req.user) throw new ApiError(401, "Authentication required.");
  if (!roles.includes(req.user.role)) throw new ApiError(403, "You do not have permission for this action.");
  next();
};

export const requireEventAccess = (eventIdSource = "params") => (req, _res, next) => {
  if (!req.user) throw new ApiError(401, "Authentication required.");
  if (req.user.role === "super_admin") return next();

  const eventId = eventIdSource === "body" ? req.body.eventId : req.params.eventId || req.params.id;
  if (!eventId || !mongoose.Types.ObjectId.isValid(eventId)) {
    throw new ApiError(400, "Valid event ID is required.");
  }

  const assigned = (req.user.assignedEvents || []).map((id) => id.toString());
  if (!assigned.includes(eventId.toString())) {
    throw new ApiError(403, "This user is not assigned to this event.");
  }

  next();
};
