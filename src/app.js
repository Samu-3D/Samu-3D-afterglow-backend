import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.js";
import taskRoutes from "./routes/tasks.js";
import pushRoutes from "./routes/push.js";
import reminderRoutes from "./routes/reminders.js";

const app = express();

const allowedOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:5180",
  "http://127.0.0.1:5180",
  "https://afterglow-workspace.onrender.com",
  "https://afterglowltd.com",
  "https://www.afterglowltd.com",
  process.env.CLIENT_URL,
  ...(process.env.EXTRA_CLIENT_URLS || "")
    .split(",")
    .map(x => x.trim())
    .filter(Boolean),
].filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      console.log("CORS blocked:", origin);
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) =>
  res.json({
    success: true,
    name: "AFTERGLOW Workspace API",
    status: "online",
    health: "/api/health",
  })
);

app.get("/api/health", (req, res) =>
  res.json({
    success: true,
    name: "AFTERGLOW Workspace API",
    status: "online",
    time: new Date().toISOString(),
  })
);

app.use("/api/auth", authRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/push", pushRoutes);
app.use("/api/reminders", reminderRoutes);

app.use((req, res) =>
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  })
);

app.use((error, req, res, next) => {
  console.error("Server error:", error);

  res.status(error.status || 500).json({
    success: false,
    message: error.message || "Internal server error",
  });
});

export default app;