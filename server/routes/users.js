const express = require("express")
const multer = require("multer")
const { pool } = require("../index")
const { authenticateToken } = require("../middleware/auth")

const router = express.Router()

// Configure multer for file uploads
const upload = multer({
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true)
    } else {
      cb(new Error("Only image files are allowed"))
    }
  },
})

// Get user profile
router.get("/me", authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT u.id, u.email, u.phone, u.first_name, u.last_name, u.profile_image, 
              u.user_type, u.is_verified, u.created_at,
              COUNT(pm.id) as payment_methods_count
       FROM users u
       LEFT JOIN payment_methods pm ON u.id = pm.user_id
       WHERE u.id = $1
       GROUP BY u.id`,
      [req.user.id],
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" })
    }

    res.json({ user: result.rows[0] })
  } catch (error) {
    console.error("Get profile error:", error)
    res.status(500).json({ error: "Failed to get profile" })
  }
})

// Update user profile
router.put("/me", authenticateToken, async (req, res) => {
  try {
    const { firstName, lastName, phone } = req.body
    const userId = req.user.id

    const result = await pool.query(
      `UPDATE users 
       SET first_name = $1, last_name = $2, phone = $3, updated_at = CURRENT_TIMESTAMP
       WHERE id = $4
       RETURNING id, email, first_name, last_name, phone, user_type`,
      [firstName, lastName, phone, userId],
    )

    res.json({
      message: "Profile updated successfully",
      user: result.rows[0],
    })
  } catch (error) {
    console.error("Update profile error:", error)
    res.status(500).json({ error: "Failed to update profile" })
  }
})

// Upload verification document
router.post("/verify", authenticateToken, upload.single("document"), async (req, res) => {
  try {
    const { documentType } = req.body
    const userId = req.user.id

    if (!req.file) {
      return res.status(400).json({ error: "Document file is required" })
    }

    // In production, upload to S3 or similar service
    const documentUrl = `/uploads/${req.file.filename}`

    await pool.query(
      `INSERT INTO user_verification_docs (user_id, document_type, document_url)
       VALUES ($1, $2, $3)`,
      [userId, documentType, documentUrl],
    )

    res.json({
      message: "Verification document uploaded successfully",
      documentUrl,
    })
  } catch (error) {
    console.error("Document upload error:", error)
    res.status(500).json({ error: "Failed to upload document" })
  }
})

// Get user's payment methods
router.get("/payment-methods", authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, type, provider, last_four, is_default, created_at
       FROM payment_methods
       WHERE user_id = $1
       ORDER BY is_default DESC, created_at DESC`,
      [req.user.id],
    )

    res.json({ paymentMethods: result.rows })
  } catch (error) {
    console.error("Get payment methods error:", error)
    res.status(500).json({ error: "Failed to get payment methods" })
  }
})

module.exports = router
