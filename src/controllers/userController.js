import { User } from "../models/User.js";
import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const listUsers = asyncHandler(async (_req, res) => {
  const users = await User.find().populate("assignedEvents", "name date").sort({ createdAt: -1 });
  res.json({ success: true, count: users.length, users });
});

export const createUser = asyncHandler(async (req, res) => {
  const { fullName, username, password, role, assignedEvents = [], active = true } = req.body;
  if (!fullName || !username || !password) throw new ApiError(400, "Full name, username, and password are required.");

  const passwordHash = await User.hashPassword(password);
  const user = await User.create({
    fullName,
    username: username.toLowerCase().trim(),
    passwordHash,
    role,
    assignedEvents,
    active,
  });

  res.status(201).json({ success: true, user: user.toSafeJSON() });
});

export const updateUser = asyncHandler(async (req, res) => {
  const { fullName, username, password, role, assignedEvents, active } = req.body;
  const update = {};
  if (fullName !== undefined) update.fullName = fullName;
  if (username !== undefined) update.username = username.toLowerCase().trim();
  if (role !== undefined) update.role = role;
  if (assignedEvents !== undefined) update.assignedEvents = assignedEvents;
  if (active !== undefined) update.active = active;
  if (password) update.passwordHash = await User.hashPassword(password);

  const user = await User.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true });
  if (!user) throw new ApiError(404, "User not found.");
  res.json({ success: true, user: user.toSafeJSON() });
});

export const deleteUser = asyncHandler(async (req, res) => {
  if (req.user._id.toString() === req.params.id) throw new ApiError(400, "You cannot delete your own account while logged in.");
  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) throw new ApiError(404, "User not found.");
  res.json({ success: true, message: "User deleted." });
});
