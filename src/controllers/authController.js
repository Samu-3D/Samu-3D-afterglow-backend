import { User } from "../models/User.js";
import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { signToken } from "../utils/tokens.js";

export const login = asyncHandler(async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) throw new ApiError(400, "Username and password are required.");

  const user = await User.findOne({ username: username.toLowerCase().trim() }).select("+passwordHash");
  if (!user || !user.active) throw new ApiError(401, "Invalid username or password.");

  const ok = await user.comparePassword(password);
  if (!ok) throw new ApiError(401, "Invalid username or password.");

  user.lastLoginAt = new Date();
  await user.save();

  res.json({ success: true, token: signToken(user), user: user.toSafeJSON() });
});

export const me = asyncHandler(async (req, res) => {
  res.json({ success: true, user: req.user.toSafeJSON() });
});
