import mongoose from "mongoose";

const badgeFieldSchema = new mongoose.Schema(
  {
    key: { type: String, required: true },
    label: String,
    x: { type: Number, default: 50 },
    y: { type: Number, default: 50 },
    size: { type: Number, default: 14 },
    weight: { type: String, default: "normal" },
    color: { type: String, default: "#ffffff" },
    align: { type: String, default: "center" },
  },
  { _id: false }
);

const badgeTemplateSchema = new mongoose.Schema(
  {
    backgroundUrl: String,
    bgColor: { type: String, default: "#1A1A19" },
    size: { type: String, default: "A6" },
    fields: [badgeFieldSchema],
    qrX: { type: Number, default: 50 },
    qrY: { type: Number, default: 30 },
    qrSize: { type: Number, default: 22 },
    photoX: { type: Number, default: 50 },
    photoY: { type: Number, default: 20 },
    photoSize: { type: Number, default: 20 },
    showPhoto: { type: Boolean, default: true },
    photoShape: { type: String, default: "circle" },
    photoBorderColor: { type: String, default: "#ffffff" },
    photoBorderWidth: { type: Number, default: 2 },
    photoFit: { type: String, default: "cover" },
    showPhotoPlaceholder: { type: Boolean, default: true },
    showEventTitle: { type: Boolean, default: true },
    eventTitleX: { type: Number, default: 50 },
    eventTitleY: { type: Number, default: 5 },
    eventTitleSize: { type: Number, default: 9 },
    eventTitleColor: { type: String, default: "#E8B267" },
    eventTitleWeight: { type: String, default: "bold" },
    eventTitleUppercase: { type: Boolean, default: true },
    showQR: { type: Boolean, default: true },
    qrBackground: { type: Boolean, default: true },
    qrPadding: { type: Number, default: 5 },
    qrRadius: { type: Number, default: 6 },
    backgroundFit: { type: String, default: "cover" },
  },
  { _id: false }
);

const printSettingsSchema = new mongoose.Schema(
  {
    paperSize: { type: String, default: "A6" },
    customWidthMm: { type: Number, default: 105 },
    customHeightMm: { type: Number, default: 148 },
    marginMm: { type: Number, default: 0 },
    fitToPaper: { type: Boolean, default: true },
    autoPrintAfterCheckin: { type: Boolean, default: true },
  },
  { _id: false }
);

const eventSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    date: { type: Date, required: true },
    venue: { type: String, trim: true },
    organizer: { type: String, default: "Afterglow Register" },
    description: String,
    status: { type: String, enum: ["open", "closed"], default: "open" },
    themeColor: { type: String, default: "#CF6B11" },
    logoUrl: String,
    badgeTemplate: { type: badgeTemplateSchema, default: () => ({}) },
    printSettings: { type: printSettingsSchema, default: () => ({}) },
    registrationSettings: {
      photoUploadEnabled: { type: Boolean, default: true },
      emailConfirmationEnabled: { type: Boolean, default: true },
      requiredFields: [{ type: String }],
      fieldModes: { type: Map, of: String },
      categories: [{ type: String }],
      customFields: [
        {
          label: String,
          key: String,
          type: { type: String, default: "text" },
          required: { type: Boolean, default: false },
        },
      ],
    },
  },
  { timestamps: true }
);

export const Event = mongoose.model("Event", eventSchema);
