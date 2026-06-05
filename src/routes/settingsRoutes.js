import { Router } from "express";
import { getSettings, updateSettings } from "../controllers/settingsController.js";
import { protect, requireRoles } from "../middleware/auth.js";

const router = Router();
router.get("/", protect, getSettings);
router.put("/", protect, requireRoles("super_admin"), updateSettings);
export default router;
