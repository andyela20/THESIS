const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const passport = require("passport");
const crypto = require("crypto");
const User = require("../models/User");

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || process.env.SESSION_SECRET || "magnitect-jwt-secret";
const pendingGoogleStates = new Map();
const googleResults = new Map();

function createToken(user) {
  return jwt.sign(
    {
      id: user._id,
      username: user.username,
      email: user.email || null
    },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}

function cleanUser(user) {
  return {
    id: user._id,
    username: user.username,
    email: user.email || null,
    displayName: user.displayName || user.username,
    provider: user.provider || "local"
  };
}

function cleanupOldGoogleStates() {
  const now = Date.now();
  const maxAge = 10 * 60 * 1000;

  for (const [state, item] of pendingGoogleStates.entries()) {
    if (now - item.createdAt > maxAge) {
      pendingGoogleStates.delete(state);
    }
  }

  for (const [state, item] of googleResults.entries()) {
    if (now - item.createdAt > maxAge) {
      googleResults.delete(state);
    }
  }
}

router.post("/register", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: "Username and password are required." });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters." });
    }

    const existing = await User.findOne({ username: username.trim() });

    if (existing) {
      return res.status(409).json({ message: "Username already exists." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      username: username.trim(),
      password: hashedPassword,
      provider: "local"
    });

    return res.status(201).json({
      message: "Account created successfully.",
      user: cleanUser(user)
    });
  } catch (error) {
    console.error("Register error:", error);
    return res.status(500).json({ message: "Registration failed." });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: "Username and password are required." });
    }

    const user = await User.findOne({ username: username.trim() });

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    if (!user.password) {
      return res.status(401).json({
        message: "This account uses Google sign-in. Please continue with Google."
      });
    }

    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    const token = createToken(user);

    return res.json({
      token,
      username: user.username,
      user: cleanUser(user)
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ message: "Login failed." });
  }
});

router.get("/google", (req, res, next) => {
  cleanupOldGoogleStates();

  const state = req.query.state || crypto.randomUUID();

  pendingGoogleStates.set(state, {
    createdAt: Date.now()
  });

  passport.authenticate("google", {
    scope: ["profile", "email"],
    state
  })(req, res, next);
});

router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: "/api/auth/google/failure",
    session: false
  }),
  async (req, res) => {
    try {
      const state = req.query.state || "";
      const user = req.user;
      const token = createToken(user);

      googleResults.set(state, {
        createdAt: Date.now(),
        token,
        username: user.username,
        user: cleanUser(user)
      });

      pendingGoogleStates.delete(state);

      return res.send(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Google Sign-In Complete</title>
            <style>
              body {
                font-family: Arial, sans-serif;
                background: #EEF0E8;
                display: flex;
                align-items: center;
                justify-content: center;
                height: 100vh;
                margin: 0;
                color: #141514;
              }
              .box {
                background: white;
                border: 1px solid #D8DAD0;
                border-radius: 16px;
                padding: 28px;
                max-width: 420px;
                text-align: center;
                box-shadow: 0 10px 30px rgba(0,0,0,0.08);
              }
              .title {
                color: #1F5330;
                font-size: 22px;
                font-weight: 800;
                margin-bottom: 8px;
              }
              .text {
                color: #5E655C;
                font-size: 14px;
                line-height: 1.5;
              }
            </style>
          </head>
          <body>
            <div class="box">
              <div class="title">Google sign-in complete</div>
              <div class="text">
                You may now return to MagniTect. This window can be closed.
              </div>
            </div>
          </body>
        </html>
      `);
    } catch (error) {
      console.error("Google callback error:", error);
      return res.status(500).send("Google sign-in failed.");
    }
  }
);

router.get("/google/status/:state", (req, res) => {
  cleanupOldGoogleStates();

  const { state } = req.params;
  const result = googleResults.get(state);

  if (result) {
    googleResults.delete(state);

    return res.json({
      success: true,
      token: result.token,
      username: result.username,
      user: result.user
    });
  }

  if (pendingGoogleStates.has(state)) {
    return res.json({
      success: false,
      pending: true
    });
  }

  return res.status(404).json({
    success: false,
    pending: false,
    message: "Google sign-in session expired or was not found."
  });
});

router.get("/google/failure", (req, res) => {
  return res.status(401).send("Google sign-in failed. Please close this window and try again.");
});

router.get("/me", async (req, res) => {
  try {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

    if (!token) {
      return res.status(401).json({ message: "No token provided." });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    return res.json({
      user: cleanUser(user)
    });
  } catch (error) {
    return res.status(401).json({ message: "Invalid token." });
  }
});

module.exports = router;
