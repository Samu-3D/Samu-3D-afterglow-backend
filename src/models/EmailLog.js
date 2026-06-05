import mongoose from "mongoose";

const emailLogSchema = new mongoose.Schema(
  {
    delegate: { type: mongoose.Schema.Types.ObjectId, ref: "Delegate" },
    event: { type: mongoose.Schema.Types.ObjectId, ref: "Event" },
    to: String,
    subject: String,
    body: String,
    qrDataUrl: String,
    status: { type: String, enum: ["simulated", "sent", "failed"], default: "simulated" },
    error: String,
  },
  { timestamps: true }
);

export const EmailLog = mongoose.model("EmailLog", emailLogSchema);
