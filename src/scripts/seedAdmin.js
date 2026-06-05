import dotenv from "dotenv";
dotenv.config();

import { connectDB } from "../config/db.js";
import { User } from "../models/User.js";
import { Event } from "../models/Event.js";
import { AppSettings } from "../models/AppSettings.js";

async function seed() {
  await connectDB();

  const demoEvent = await Event.findOneAndUpdate(
    { name: "Afterglow Register Demo Event" },
    {
      name: "Afterglow Register Demo Event",
      date: new Date(),
      venue: "Kigali Convention Centre",
      organizer: "Afterglow Register",
      status: "open",
      themeColor: "#CF6B11",
    },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  const username = (process.env.DEFAULT_ADMIN_USERNAME || "Afterglow").toLowerCase();
  const existing = await User.findOne({ username });

  if (!existing) {
    const passwordHash = await User.hashPassword(process.env.DEFAULT_ADMIN_PASSWORD || "After26");
    await User.create({
      fullName: process.env.DEFAULT_ADMIN_FULL_NAME || "Afterglow Admin",
      username,
      passwordHash,
      role: "super_admin",
      assignedEvents: [demoEvent._id],
      active: true,
    });
    console.log("✅ Default admin created");
  } else {
    console.log("ℹ️ Default admin already exists");
  }

  await AppSettings.findOneAndUpdate(
    { singleton: "main" },
    { systemName: "Afterglow Register" },
    { upsert: true, setDefaultsOnInsert: true }
  );

  console.log("✅ Seed finished");
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
