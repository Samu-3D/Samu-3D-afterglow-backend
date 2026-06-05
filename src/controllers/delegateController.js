import mongoose from "mongoose";
import { Delegate } from "../models/Delegate.js";
import { Event } from "../models/Event.js";
import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { makeDelegateId, makeQrToken } from "../utils/id.js";
import { sendRegistrationEmail } from "../utils/email.js";

function buildDelegatePayload(body, eventId) {
  return {
    event: eventId,
    fullName: body.fullName,
    email: body.email,
    phone: body.phone,
    organization: body.organization,
    jobTitle: body.jobTitle,
    country: body.country || "Rwanda",
    category: body.category || "Delegate",
    photoUrl: body.photoUrl,
    customFields: body.customFields || {},
  };
}

export const registerPublic = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.eventId);
  if (!event) throw new ApiError(404, "Event not found.");
  if (event.status === "closed") throw new ApiError(403, "Registration is closed for this event.");

  const delegate = await Delegate.create({
    ...buildDelegatePayload(req.body, event._id),
    delegateId: makeDelegateId(),
    qrToken: makeQrToken(),
  });

  let emailResult = null;
  if (event.registrationSettings?.emailConfirmationEnabled !== false) {
    emailResult = await sendRegistrationEmail({ delegate, event });
    delegate.emailStatus = emailResult.status === "sent" ? "sent" : emailResult.status === "failed" ? "failed" : "simulated";
    delegate.emailSentAt = new Date();
    await delegate.save();
  }

  res.status(201).json({ success: true, delegate, email: emailResult });
});

export const createDelegate = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.eventId);
  if (!event) throw new ApiError(404, "Event not found.");

  const delegate = await Delegate.create({
    ...buildDelegatePayload(req.body, event._id),
    delegateId: makeDelegateId(),
    qrToken: makeQrToken(),
  });

  res.status(201).json({ success: true, delegate });
});

export const listDelegates = asyncHandler(async (req, res) => {
  const { search, category, status } = req.query;
  const query = { event: req.params.eventId };

  if (category && category !== "All") query.category = category;
  if (status === "checked") query.checkedIn = true;
  if (status === "pending") query.checkedIn = false;
  if (search) {
    const re = new RegExp(search, "i");
    query.$or = [{ fullName: re }, { email: re }, { organization: re }, { jobTitle: re }, { delegateId: re }];
  }

  const delegates = await Delegate.find(query).sort({ createdAt: -1 });
  res.json({ success: true, count: delegates.length, delegates });
});

export const getDelegate = asyncHandler(async (req, res) => {
  const delegate = await Delegate.findById(req.params.id).populate("event", "name date venue");
  if (!delegate) throw new ApiError(404, "Delegate not found.");
  res.json({ success: true, delegate });
});

export const updateDelegate = asyncHandler(async (req, res) => {
  const allowed = ["fullName", "email", "phone", "organization", "jobTitle", "country", "category", "photoUrl", "customFields"];
  const update = {};
  allowed.forEach((key) => {
    if (req.body[key] !== undefined) update[key] = req.body[key];
  });

  const delegate = await Delegate.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true });
  if (!delegate) throw new ApiError(404, "Delegate not found.");
  res.json({ success: true, delegate });
});

export const deleteDelegate = asyncHandler(async (req, res) => {
  const delegate = await Delegate.findByIdAndDelete(req.params.id);
  if (!delegate) throw new ApiError(404, "Delegate not found.");
  res.json({ success: true, message: "Delegate deleted." });
});

export const checkinByDelegateId = asyncHandler(async (req, res) => {
  const delegate = await Delegate.findById(req.params.id).populate("event");
  if (!delegate) throw new ApiError(404, "Delegate not found.");

  if (req.user.role !== "super_admin") {
    const allowedEvents = (req.user.assignedEvents || []).map((id) => id.toString());
    if (!allowedEvents.includes(delegate.event._id.toString())) throw new ApiError(403, "You are not assigned to this event.");
  }

  if (delegate.checkedIn) {
    return res.status(409).json({ success: false, message: "Already checked in.", delegate });
  }

  delegate.checkedIn = true;
  delegate.checkedInAt = new Date();
  delegate.checkedInBy = req.user._id;
  await delegate.save();

  res.json({ success: true, message: "Checked in successfully.", delegate });
});

export const checkinByQr = asyncHandler(async (req, res) => {
  const { qrToken, delegateId, eventId, qrPayload } = req.body;
  let parsed = {};

  if (qrPayload) {
    try { parsed = JSON.parse(qrPayload); } catch { parsed = { qrToken: qrPayload }; }
  }

  const finalToken = qrToken || parsed.qrToken;
  const finalDelegateId = delegateId || parsed.delegateId;
  const finalEventId = eventId || parsed.eventId;

  const query = {};
  if (finalToken) query.qrToken = finalToken;
  else if (finalDelegateId) query.delegateId = finalDelegateId;
  else throw new ApiError(400, "QR token or delegate ID is required.");

  if (finalEventId && mongoose.Types.ObjectId.isValid(finalEventId)) query.event = finalEventId;

  const delegate = await Delegate.findOne(query).populate("event");
  if (!delegate) throw new ApiError(404, "Delegate not found for this QR code.");

  if (req.user.role !== "super_admin") {
    const allowedEvents = (req.user.assignedEvents || []).map((id) => id.toString());
    if (!allowedEvents.includes(delegate.event._id.toString())) throw new ApiError(403, "You are not assigned to this event.");
  }

  if (delegate.checkedIn) {
    return res.status(409).json({ success: false, message: "Already checked in.", delegate });
  }

  delegate.checkedIn = true;
  delegate.checkedInAt = new Date();
  delegate.checkedInBy = req.user._id;
  await delegate.save();

  res.json({ success: true, message: "Checked in successfully.", delegate });
});

export const resendEmail = asyncHandler(async (req, res) => {
  const delegate = await Delegate.findById(req.params.id).populate("event");
  if (!delegate) throw new ApiError(404, "Delegate not found.");
  const email = await sendRegistrationEmail({ delegate, event: delegate.event });
  delegate.emailStatus = email.status === "sent" ? "sent" : email.status === "failed" ? "failed" : "simulated";
  delegate.emailSentAt = new Date();
  await delegate.save();
  res.json({ success: true, email });
});
