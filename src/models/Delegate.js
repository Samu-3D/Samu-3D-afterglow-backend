import mongoose from "mongoose";

const delegateSchema = new mongoose.Schema(
  {
    event: { type: mongoose.Schema.Types.ObjectId, ref: "Event", required: true, index: true },
    delegateId: { type: String, required: true, unique: true, index: true },
    qrToken: { type: String, required: true, unique: true, index: true },
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    phone: String,
    organization: String,
    jobTitle: String,
    country: { type: String, default: "Rwanda" },
    category: { type: String, default: "Delegate" },
    photoUrl: String,
    customFields: { type: Map, of: mongoose.Schema.Types.Mixed },
    checkedIn: { type: Boolean, default: false, index: true },
    checkedInAt: Date,
    checkedInBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    emailStatus: { type: String, enum: ["not_sent", "simulated", "sent", "failed"], default: "not_sent" },
    emailSentAt: Date,
  },
  { timestamps: true }
);

delegateSchema.index({ event: 1, email: 1 }, { unique: true });

export const Delegate = mongoose.model("Delegate", delegateSchema);
