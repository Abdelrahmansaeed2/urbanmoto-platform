const express = require("express")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const { pool } = require("../index")
const { validateAuth } = require("../middleware/validation")
const { rateLimiter } = require("../middleware/rateLimiter")

const router = express.Router()

// Register
router.post("/register", rateLimiter, validateAuth, async (req, res) => {
  try {
    const { email, phone, password, firstName, lastName, userType = "customer" } = req.body

    // Check if user exists
    const existingUser = await pool.query("SELECT id FROM users WHERE email = $1 OR phone = $2", [email, phone])

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: "User already exists" })
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12)

    // Create user
    const result = await pool.query(
      `INSERT INTO users (email, phone, password_hash, first_name, last_name, user_type)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, email, first_name, last_name, user_type`,
      [email, phone, passwordHash, firstName, lastName, userType],
    )

    const user = result.rows[0]

    // Generate JWT
    const token = jwt.sign(
      { userId: user.id, email: user.email, userType: user.user_type },
      process.env.JWT_SECRET || "your-secret-key",
      { expiresIn: "7d" },
    )

    res.status(201).json({
      message: "User created successfully",
      user,
      token,
    })
  } catch (error) {
    console.error("Registration error:", error)
    res.status(500).json({ error: "Registration failed" })
  }
})

// Login
router.post("/login", rateLimiter, async (req, res) => {
  try {
    const { email, password } = req.body

    // Find user
    const result = await pool.query(
      "SELECT id, email, password_hash, first_name, last_name, user_type, is_active FROM users WHERE email = $1",
      [email],
    )

    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Invalid credentials" })
    }

    const user = result.rows[0]

    if (!user.is_active) {
      return res.status(401).json({ error: "Account is deactivated" })
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash)

    if (!isValidPassword) {
      return res.status(401).json({ error: "Invalid credentials" })
    }

    // Generate JWT
    const token = jwt.sign(
      { userId: user.id, email: user.email, userType: user.user_type },
      process.env.JWT_SECRET || "your-secret-key",
      { expiresIn: "7d" },
    )

    // Remove password hash from response
    delete user.password_hash

    res.json({
      message: "Login successful",
      user,
      token,
    })
  } catch (error) {
    console.error("Login error:", error)
    res.status(500).json({ error: "Login failed" })
  }
})

// Verify token
router.get("/verify", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1]

    if (!token) {
      return res.status(401).json({ error: "No token provided" })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "your-secret-key")

    // Get fresh user data
    const result = await pool.query(
      "SELECT id, email, first_name, last_name, user_type, is_active FROM users WHERE id = $1",
      [decoded.userId],
    )

    if (result.rows.length === 0 || !result.rows[0].is_active) {
      return res.status(401).json({ error: "Invalid token" })
    }

    res.json({
      valid: true,
      user: result.rows[0],
    })
  } catch (error) {
    res.status(401).json({ error: "Invalid token" })
  }
})

module.exports = router
