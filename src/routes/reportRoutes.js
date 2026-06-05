import { Router } from "express";
import { summary, exportExcel } from "../controllers/reportController.js";
import { protect, requireEventAccess } from "../middleware/auth.js";

const router = Router();
router.get("/events/:eventId/reports/summary", protect, requireEventAccess(), summary);
router.get("/events/:eventId/reports/export", protect, requireEventAccess(), exportExcel);
export default router;
