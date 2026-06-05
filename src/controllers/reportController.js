import XLSX from "xlsx";
import { Delegate } from "../models/Delegate.js";
import { Event } from "../models/Event.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";

function row(d, event) {
  return {
    "Delegate ID": d.delegateId,
    "Full name": d.fullName,
    Email: d.email,
    Phone: d.phone || "",
    Organization: d.organization || "",
    "Job title": d.jobTitle || "",
    Country: d.country || "",
    Category: d.category || "",
    "Registration date/time": d.createdAt ? new Date(d.createdAt).toLocaleString() : "",
    "Check-in status": d.checkedIn ? "Checked in" : "Pending",
    "Check-in date/time": d.checkedInAt ? new Date(d.checkedInAt).toLocaleString() : "",
    "Event name": event.name,
  };
}

export const summary = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.eventId);
  if (!event) throw new ApiError(404, "Event not found.");
  const delegates = await Delegate.find({ event: event._id });
  const checkedIn = delegates.filter((d) => d.checkedIn).length;
  const byCategory = delegates.reduce((acc, d) => {
    acc[d.category] = (acc[d.category] || 0) + 1;
    return acc;
  }, {});
  res.json({ success: true, summary: { total: delegates.length, checkedIn, pending: delegates.length - checkedIn, byCategory } });
});

export const exportExcel = asyncHandler(async (req, res) => {
  const { type = "all", category } = req.query;
  const event = await Event.findById(req.params.eventId);
  if (!event) throw new ApiError(404, "Event not found.");

  const q = { event: event._id };
  if (type === "checked") q.checkedIn = true;
  if (type === "pending") q.checkedIn = false;
  if (type === "category" && category) q.category = category;

  const delegates = await Delegate.find(q).sort({ createdAt: -1 });
  const ws = XLSX.utils.json_to_sheet(delegates.map((d) => row(d, event)));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Participants");
  const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

  res.setHeader("Content-Disposition", `attachment; filename=afterglow-${type}-participants.xlsx`);
  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.send(buffer);
});
