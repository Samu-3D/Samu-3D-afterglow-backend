import express from "express";
import { supabaseAuth } from "../config/supabase.js";

const router = express.Router();

const cleanUser = (user) => ({
  id: user.id,
  name: user.user_metadata?.name || "ISHIMWE Samuel",
  email: user.email,
  companyName: user.user_metadata?.companyName || "MOPAS Ltd",
  role: user.user_metadata?.role || "owner",
});

router.post("/register", async (req, res) => {
  try {
    const { name, email, password, companyName } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const { data, error } = await supabaseAuth.auth.signUp({
      email: String(email).toLowerCase().trim(),
      password,
      options: {
        data: {
          name: name || "ISHIMWE Samuel",
          companyName: companyName || "MOPAS Ltd",
          role: "owner",
        },
      },
    });

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    if (!data.session) {
      return res.status(400).json({
        success: false,
        message: "Account created, but email confirmation is required. Turn off email confirmation in Supabase for testing.",
      });
    }

    return res.status(201).json({
      success: true,
      token: data.session.access_token,
      user: cleanUser(data.user),
    });
  } catch (error) {
    console.error("Register error:", error);

    return res.status(500).json({
      success: false,
      message: "Register failed",
    });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const { data, error } = await supabaseAuth.auth.signInWithPassword({
      email: String(email).toLowerCase().trim(),
      password,
    });

    if (error) {
      return res.status(400).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    return res.json({
      success: true,
      token: data.session.access_token,
      user: cleanUser(data.user),
    });
  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      success: false,
      message: "Login failed",
    });
  }
});

router.get("/me", async (req, res) => {
  try {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "No token provided",
      });
    }

    const { data, error } = await supabaseAuth.auth.getUser(token);

    if (error || !data.user) {
      return res.status(401).json({
        success: false,
        message: "Invalid token",
      });
    }

    return res.json({
      success: true,
      user: cleanUser(data.user),
    });
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid token",
    });
  }
});

export default router;