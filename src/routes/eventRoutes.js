import { Router } from "express";
import { listEvents, getEvent, createEvent, updateEvent, deleteEvent } from "../controllers/eventController.js";
import { protect, requireRoles, requireEventAccess } from "../middleware/auth.js";

const router = Router();
router.get("/", protect, listEvents);
router.post("/", protect, requireRoles("super_admin", "event_admin"), createEvent);
router.get("/:id", protect, getEvent);
router.put("/:id", protect, requireRoles("super_admin", "event_admin"), requireEventAccess(), updateEvent);
router.delete("/:id", protect, requireRoles("super_admin"), deleteEvent);
export default router;
