const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const router = express.Router();

const makeToken = (user) => {
  return jwt.sign(
    { id: user._id, email: user.email },
    process.env.JWT_SECRET || "afterglow_private_secret_2026_change_this_later",
    { expiresIn: "30d" }
  );
};

const cleanUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  companyName: user.companyName,
  role: user.role,
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

    const normalizedEmail = String(email).toLowerCase().trim();
    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Account already exists. Please login.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name: name || "ISHIMWE Samuel",
      email: normalizedEmail,
      password: hashedPassword,
      companyName: companyName || "MOPAS Ltd",
      role: "owner",
    });

    return res.status(201).json({
      success: true,
      token: makeToken(user),
      user: cleanUser(user),
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

    const normalizedEmail = String(email).toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const passwordOk = await bcrypt.compare(password, user.password);

    if (!passwordOk) {
      return res.status(400).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    return res.json({
      success: true,
      token: makeToken(user),
      user: cleanUser(user),
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({
      success: false,
      message: "Login failed",
    });
  }
});

module.exports = router;