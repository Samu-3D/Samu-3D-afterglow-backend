import express from "express";
import webpush from "web-push";
import { supabaseAuth, supabaseAdmin } from "../config/supabase.js";

const router = express.Router();

const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
const vapidSubject = process.env.VAPID_SUBJECT || "mailto:ishimwesamuel3d@gmail.com";

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
}

const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ")
      ? authHeader.replace("Bearer ", "")
      : "";

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Not authorized. No token provided.",
      });
    }

    const { data, error } = await supabaseAuth.auth.getUser(token);

    if (error || !data.user) {
      return res.status(401).json({
        success: false,
        message: "Not authorized. Invalid token.",
      });
    }

    req.userId = data.user.id;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Not authorized.",
    });
  }
};

router.get("/public-key", (req, res) => {
  if (!vapidPublicKey) {
    return res.status(500).json({
      success: false,
      message: "VAPID_PUBLIC_KEY is missing",
    });
  }

  return res.json({
    success: true,
    publicKey: vapidPublicKey,
  });
});

router.post("/subscribe", protect, async (req, res) => {
  try {
    const subscription = req.body.subscription || req.body;

    if (!subscription || !subscription.endpoint) {
      return res.status(400).json({
        success: false,
        message: "Push subscription endpoint is required",
      });
    }

    const { data, error } = await supabaseAdmin
      .from("push_subscriptions")
      .upsert(
        {
          user_id: req.userId,
          endpoint: subscription.endpoint,
          subscription,
          user_agent: req.headers["user-agent"] || "",
          platform: req.body.platform || "web",
          enabled: true,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "endpoint",
        }
      )
      .select("*")
      .single();

    if (error) throw error;

    return res.json({
      success: true,
      message: "Push subscription saved",
      data,
    });
  } catch (error) {
    console.error("Push subscribe error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to save push subscription",
    });
  }
});

router.post("/test", protect, async (req, res) => {
  try {
    if (!vapidPublicKey || !vapidPrivateKey) {
      return res.status(500).json({
        success: false,
        message: "VAPID keys are missing in backend environment",
      });
    }

    const { data, error } = await supabaseAdmin
      .from("push_subscriptions")
      .select("*")
      .eq("user_id", req.userId)
      .eq("enabled", true);

    if (error) throw error;

    const subscriptions = data || [];

    if (!subscriptions.length) {
      return res.status(404).json({
        success: false,
        message: "No push subscription found. Enable reminders again from the app.",
      });
    }

    const payload = JSON.stringify({
      title: "AFTERGLOW Reminder",
      body: req.body.message || "Your iPhone reminders are connected.",
      url: "/",
      tag: "afterglow-test-reminder",
    });

    const results = await Promise.allSettled(
      subscriptions.map(item => webpush.sendNotification(item.subscription, payload))
    );

    return res.json({
      success: true,
      message: "Test reminder sent",
      sent: results.filter(r => r.status === "fulfilled").length,
      failed: results.filter(r => r.status === "rejected").length,
    });
  } catch (error) {
    console.error("Push test error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to send test reminder",
    });
  }
});

export default router;