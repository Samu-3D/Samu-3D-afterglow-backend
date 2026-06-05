import { Event } from "../models/Event.js";
import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

function baseEventQueryForUser(user) {
  if (user.role === "super_admin") return {};
  return { _id: { $in: user.assignedEvents || [] } };
}

export const listEvents = asyncHandler(async (req, res) => {
  const events = await Event.find(baseEventQueryForUser(req.user)).sort({ date: -1 });
  res.json({ success: true, count: events.length, events });
});

export const getEvent = asyncHandler(async (req, res) => {
  const event = await Event.findOne({ _id: req.params.id, ...baseEventQueryForUser(req.user) });
  if (!event) throw new ApiError(404, "Event not found or not accessible.");
  res.json({ success: true, event });
});

export const createEvent = asyncHandler(async (req, res) => {
  const event = await Event.create(req.body);
  res.status(201).json({ success: true, event });
});

export const updateEvent = asyncHandler(async (req, res) => {
  const event = await Event.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!event) throw new ApiError(404, "Event not found.");
  res.json({ success: true, event });
});

export const deleteEvent = asyncHandler(async (req, res) => {
  const event = await Event.findByIdAndDelete(req.params.id);
  if (!event) throw new ApiError(404, "Event not found.");
  res.json({ success: true, message: "Event deleted." });
});
