import { Router } from "express";
import { registerPublic, getPublicEvent, createDelegate, listDelegates, getDelegate, updateDelegate, deleteDelegate, checkinByDelegateId, checkinByQr, resendEmail } from "../controllers/delegateController.js";
import { protect, requireRoles, requireEventAccess } from "../middleware/auth.js";

const router = Router();

// Public registration link
router.get("/public/events/:eventId", getPublicEvent);
router.post("/public/events/:eventId/register", registerPublic);

// Event delegates
router.get("/events/:eventId/delegates", protect, requireEventAccess(), listDelegates);
router.post("/events/:eventId/delegates", protect, requireRoles("super_admin", "event_admin", "registration_staff"), requireEventAccess(), createDelegate);

// QR check-in
router.post("/checkin/qr", protect, requireRoles("super_admin", "event_admin", "checkin_staff", "registration_staff"), checkinByQr);

// Single delegate
router.get("/delegates/:id", protect, getDelegate);
router.put("/delegates/:id", protect, requireRoles("super_admin", "event_admin", "registration_staff"), updateDelegate);
router.delete("/delegates/:id", protect, requireRoles("super_admin", "event_admin"), deleteDelegate);
router.post("/delegates/:id/checkin", protect, requireRoles("super_admin", "event_admin", "checkin_staff", "registration_staff"), checkinByDelegateId);
router.post("/delegates/:id/resend-email", protect, requireRoles("super_admin", "event_admin", "registration_staff"), resendEmail);

export default router;
