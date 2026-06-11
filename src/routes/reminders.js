import express from "express";
import webpush, { pushReady } from "../config/push.js";
import { supabaseAdmin } from "../config/supabase.js";

const router = express.Router();

const pad2 = (value) => String(value).padStart(2, "0");
const timezone = process.env.REMINDER_TIMEZONE || "Africa/Kigali";

const getLocalParts = (date = new Date()) => {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year:"numeric",
    month:"2-digit",
    day:"2-digit",
    hour:"2-digit",
    minute:"2-digit",
    hour12:false,
  });
  const parts = Object.fromEntries(formatter.formatToParts(date).filter(p => p.type !== "literal").map(p => [p.type, p.value]));
  const hour = Number(parts.hour === "24" ? "0" : parts.hour);
  const minute = Number(parts.minute || 0);
  return {
    dateKey:`${parts.year}-${parts.month}-${parts.day}`,
    minutes:hour * 60 + minute,
    timeLabel:`${pad2(hour)}:${pad2(minute)}`,
  };
};

const timeToMinutes = (time = "") => {
  const [h, m] = String(time || "00:00").split(":").map(Number);
  return (Number.isFinite(h) ? h : 0) * 60 + (Number.isFinite(m) ? m : 0);
};

const authCron = (req, res, next) => {
  const expected = process.env.REMINDER_CRON_SECRET || "";
  if (!expected) return next();
  const supplied = req.headers["x-reminder-secret"] || req.query.secret || "";
  if (supplied !== expected) return res.status(401).json({ success:false, message:"Invalid reminder secret." });
  next();
};

router.post("/run", authCron, async (req, res) => {
  try {
    if (!pushReady) return res.status(400).json({ success:false, message:"VAPID keys are missing." });
    const now = getLocalParts();
    const before = Math.max(0, Number(process.env.REMINDER_MINUTES_BEFORE || 10));
    const windowMinutes = Math.max(2, Number(process.env.REMINDER_WINDOW_MINUTES || 5));

    const { data:tasks, error:taskError } = await supabaseAdmin
      .from("tasks")
      .select("id,user_id,data")
      .limit(5000);
    if (taskError) throw taskError;

    const dueTasks = (tasks || []).filter((row) => {
      const task = row.data || {};
      if (!task || task.status === "Done") return false;
      const due = task.due || task.routineDate || "";
      const time = task.time || "";
      if (due !== now.dateKey || !time) return false;
      const diff = timeToMinutes(time) - now.minutes;
      return diff <= before && diff >= before - windowMinutes;
    });

    let sent = 0;
    let skipped = 0;
    for (const row of dueTasks) {
      const task = row.data || {};
      const fireKey = `${now.dateKey}_${task.time}_${row.id}_${Math.floor(now.minutes / windowMinutes)}`;
      const { data:existingLog } = await supabaseAdmin
        .from("reminder_logs")
        .select("id")
        .eq("user_id", row.user_id)
        .eq("task_id", String(row.id))
        .eq("fire_key", fireKey)
        .maybeSingle();
      if (existingLog) { skipped += 1; continue; }

      const { data:subs, error:subError } = await supabaseAdmin
        .from("push_subscriptions")
        .select("*")
        .eq("user_id", row.user_id);
      if (subError) throw subError;
      if (!subs?.length) { skipped += 1; continue; }

      const payload = JSON.stringify({
        title:task.title || "AFTERGLOW task reminder",
        body:`${task.time || now.timeLabel} · ${task.priority || "Normal"} · ${task.folder || task.space || "Task"}`,
        url:"/",
        taskId:String(row.id),
        tag:`afterglow-${row.id}`,
      });

      const results = await Promise.allSettled(subs.map((sub) => webpush.sendNotification(sub.subscription, payload)));
      sent += results.filter(r => r.status === "fulfilled").length;

      await supabaseAdmin.from("reminder_logs").insert({
        user_id:row.user_id,
        task_id:String(row.id),
        fire_key:fireKey,
        notification_type:"task-reminder",
      });
    }

    return res.json({ success:true, timezone, date:now.dateKey, checked:tasks?.length || 0, due:dueTasks.length, sent, skipped });
  } catch (error) {
    console.error("Reminder run error:", error);
    return res.status(500).json({ success:false, message:error.message || "Reminder run failed." });
  }
});

router.get("/run", authCron, (req, res, next) => {
  req.method = "POST";
  return router.handle(req, res, next);
});

export default router;
