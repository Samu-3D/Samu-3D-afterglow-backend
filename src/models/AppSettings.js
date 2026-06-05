import mongoose from "mongoose";

const appSettingsSchema = new mongoose.Schema(
  {
    singleton: { type: String, default: "main", unique: true },
    systemName: { type: String, default: "Afterglow Register" },
    logoUrl: String,
    appearance: {
      mode: { type: String, enum: ["dark", "light", "system"], default: "dark" },
      accentColor: { type: String, default: "#CF6B11" },
      fontSize: { type: String, enum: ["small", "normal", "large"], default: "normal" },
      compactMode: { type: Boolean, default: false },
      sidebarStyle: { type: String, default: "default" },
    },
    email: {
      enabled: { type: Boolean, default: false },
      mode: { type: String, enum: ["simulation", "smtp"], default: "simulation" },
      fromName: { type: String, default: "Afterglow Register Team" },
    },
  },
  { timestamps: true }
);

export const AppSettings = mongoose.model("AppSettings", appSettingsSchema);
