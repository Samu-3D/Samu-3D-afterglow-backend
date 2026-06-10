import express from "express";
import { supabaseAuth, supabaseAdmin } from "../config/supabase.js";

const router = express.Router();

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

const cleanPayload = (body = {}) => {
  const payload = { ...body };

  delete payload.id;
  delete payload._id;
  delete payload.userId;
  delete payload.user_id;
  delete payload.createdAt;
  delete payload.updatedAt;
  delete payload.created_at;
  delete payload.updated_at;

  if (!payload.title) payload.title = "Untitled task";
  if (!payload.status) payload.status = "To Do";
  if (!payload.priority) payload.priority = "Normal";

  return payload;
};

const rowToTask = (row) => {
  const task = row.data || {};

  return {
    ...task,
    id: row.id,
    _id: row.id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
};

router.get("/", protect, async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit || 500), 1000);

    const { data, error } = await supabaseAdmin
      .from("tasks")
      .select("*")
      .eq("user_id", req.userId)
      .order("updated_at", { ascending: false })
      .limit(limit);

    if (error) throw error;

    return res.json({
      success: true,
      data: (data || []).map(rowToTask),
    });
  } catch (error) {
    console.error("Get tasks error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load tasks",
    });
  }
});

router.post("/", protect, async (req, res) => {
  try {
    const payload = cleanPayload(req.body);

    const { data, error } = await supabaseAdmin
      .from("tasks")
      .insert({
        user_id: req.userId,
        data: payload,
      })
      .select("*")
      .single();

    if (error) throw error;

    return res.status(201).json({
      success: true,
      data: rowToTask(data),
    });
  } catch (error) {
    console.error("Create task error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create task",
    });
  }
});

router.patch("/:id", protect, async (req, res) => {
  try {
    const payload = cleanPayload(req.body);

    const existing = await supabaseAdmin
      .from("tasks")
      .select("*")
      .eq("id", req.params.id)
      .eq("user_id", req.userId)
      .single();

    if (existing.error) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    const mergedData = {
      ...(existing.data.data || {}),
      ...payload,
    };

    const { data, error } = await supabaseAdmin
      .from("tasks")
      .update({
        data: mergedData,
        updated_at: new Date().toISOString(),
      })
      .eq("id", req.params.id)
      .eq("user_id", req.userId)
      .select("*")
      .single();

    if (error) throw error;

    return res.json({
      success: true,
      data: rowToTask(data),
    });
  } catch (error) {
    console.error("Update task error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update task",
    });
  }
});

router.delete("/:id", protect, async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("tasks")
      .delete()
      .eq("id", req.params.id)
      .eq("user_id", req.userId)
      .select("*")
      .single();

    if (error) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    return res.json({
      success: true,
      message: "Task deleted",
      data: rowToTask(data),
    });
  } catch (error) {
    console.error("Delete task error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete task",
    });
  }
});

export default router;