import { AppSettings } from "../models/AppSettings.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const getSettings = asyncHandler(async (_req, res) => {
  const settings = await AppSettings.findOneAndUpdate({ singleton: "main" }, {}, { new: true, upsert: true, setDefaultsOnInsert: true });
  res.json({ success: true, settings });
});

export const updateSettings = asyncHandler(async (req, res) => {
  const settings = await AppSettings.findOneAndUpdate({ singleton: "main" }, req.body, { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true });
  res.json({ success: true, settings });
});
