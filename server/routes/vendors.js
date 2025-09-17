const express = require("express")
const { pool } = require("../index")
const { authenticateToken, requireRole } = require("../middleware/auth")

const router = express.Router()

// Create vendor profile
router.post("/", authenticateToken, async (req, res) => {
  try {
    const { businessName, businessLicense, address, latitude, longitude } = req.body

    // Check if vendor profile already exists
    const existingVendor = await pool.query("SELECT id FROM vendors WHERE user_id = $1", [req.user.id])

    if (existingVendor.rows.length > 0) {
      return res.status(400).json({ error: "Vendor profile already exists" })
    }

    const result = await pool.query(
      `INSERT INTO vendors (user_id, business_name, business_license, address, latitude, longitude)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [req.user.id, businessName, businessLicense, address, latitude, longitude],
    )

    // Update user type to vendor
    await pool.query("UPDATE users SET user_type = 'vendor' WHERE id = $1", [req.user.id])

    res.status(201).json({
      message: "Vendor profile created successfully",
      vendor: result.rows[0],
    })
  } catch (error) {
    console.error("Create vendor error:", error)
    res.status(500).json({ error: "Failed to create vendor profile" })
  }
})

// Get vendor details
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params

    const result = await pool.query(
      `SELECT v.*, u.first_name, u.last_name, u.email,
              COUNT(DISTINCT vh.id) as total_vehicles,
              COUNT(DISTINCT b.id) as total_bookings,
              AVG(r.rating) as average_rating
       FROM vendors v
       JOIN users u ON v.user_id = u.id
       LEFT JOIN vehicles vh ON v.id = vh.vendor_id
       LEFT JOIN bookings b ON vh.id = b.vehicle_id AND b.status = 'completed'
       LEFT JOIN reviews r ON v.id = r.vendor_id
       WHERE v.id = $1
       GROUP BY v.id, u.first_name, u.last_name, u.email`,
      [id],
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Vendor not found" })
    }

    res.json({ vendor: result.rows[0] })
  } catch (error) {
    console.error("Get vendor error:", error)
    res.status(500).json({ error: "Failed to get vendor details" })
  }
})

// Get vendor's ratings and reviews
router.get("/:id/ratings", async (req, res) => {
  try {
    const { id } = req.params
    const { page = 1, limit = 10 } = req.query

    const offset = (page - 1) * limit

    const result = await pool.query(
      `SELECT r.rating, r.comment, r.created_at, u.first_name, u.last_name,
              v.make, v.model
       FROM reviews r
       JOIN users u ON r.user_id = u.id
       LEFT JOIN vehicles v ON r.vehicle_id = v.id
       WHERE r.vendor_id = $1
       ORDER BY r.created_at DESC
       LIMIT $2 OFFSET $3`,
      [id, limit, offset],
    )

    const countResult = await pool.query("SELECT COUNT(*) FROM reviews WHERE vendor_id = $1", [id])

    res.json({
      reviews: result.rows,
      total: Number.parseInt(countResult.rows[0].count),
      page: Number.parseInt(page),
      totalPages: Math.ceil(countResult.rows[0].count / limit),
    })
  } catch (error) {
    console.error("Get vendor ratings error:", error)
    res.status(500).json({ error: "Failed to get vendor ratings" })
  }
})

module.exports = router
