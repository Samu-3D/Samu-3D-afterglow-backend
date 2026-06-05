import path from "path";
import multer from "multer";
import { ApiError } from "../utils/apiError.js";

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, "uploads/"),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  },
});

export const upload = multer({
  storage,
  limits: { fileSize: 4 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith("image/") && file.mimetype !== "application/pdf") {
      return cb(new ApiError(400, "Only images or PDF files are allowed."));
    }
    cb(null, true);
  },
});

export const uploadFile = (req, res) => {
  if (!req.file) throw new ApiError(400, "No file uploaded.");
  const baseUrl = process.env.API_PUBLIC_URL || `${req.protocol}://${req.get("host")}`;
  const publicUrl = `${baseUrl}/uploads/${req.file.filename}`;
  res.status(201).json({ success: true, url: publicUrl, file: req.file });
};
