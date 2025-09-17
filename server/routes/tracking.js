const express = require("express")
const router = express.Router()
const { authenticateToken } = require("../middleware/auth")
const pool = require("../database/connection")

// Get real-time tracking for booking
router.get("/booking/:bookingId", authenticateToken, async (req, res) => {
  try {
    const { bookingId } = req.params

    const trackingQuery = `
      SELECT 
        t.*,
        b.status as booking_status,
        v.make, v.model, v.license_plate,
        u.name as driver_name, u.phone as driver_phone
      FROM tracking t
      JOIN bookings b ON t.booking_id = b.id
      JOIN vehicles v ON b.vehicle_id = v.id
      LEFT JOIN users u ON t.driver_id = u.id
      WHERE t.booking_id = $1 AND b.user_id = $2
      ORDER BY t.created_at DESC
    `

    const result = await pool.query(trackingQuery, [bookingId, req.user.id])

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Tracking information not found" })
    }

    res.json({
      tracking: result.rows,
      currentLocation: result.rows[0],
    })
  } catch (error) {
    console.error("Error fetching tracking:", error)
    res.status(500).json({ error: "Failed to fetch tracking information" })
  }
})

// Update location (for drivers/delivery personnel)
router.post("/update-location", authenticateToken, async (req, res) => {
  try {
    const { bookingId, latitude, longitude, status, notes } = req.body

    const insertQuery = `
      INSERT INTO tracking (booking_id, driver_id, latitude, longitude, status, notes)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `

    const result = await pool.query(insertQuery, [bookingId, req.user.id, latitude, longitude, status, notes])

    // Update booking status if provided
    if (status) {
      await pool.query("UPDATE bookings SET status = $1 WHERE id = $2", [status, bookingId])
    }

    res.json({ tracking: result.rows[0] })
  } catch (error) {
    console.error("Error updating location:", error)
    res.status(500).json({ error: "Failed to update location" })
  }
})

// Get delivery tracking
router.get("/delivery/:deliveryId", authenticateToken, async (req, res) => {
  try {
    const { deliveryId } = req.params

    const trackingQuery = `
      SELECT 
        dt.*,
        d.status as delivery_status,
        d.pickup_address, d.delivery_address,
        u.name as driver_name, u.phone as driver_phone
      FROM delivery_tracking dt
      JOIN deliveries d ON dt.delivery_id = d.id
      LEFT JOIN users u ON dt.driver_id = u.id
      WHERE dt.delivery_id = $1 AND d.user_id = $2
      ORDER BY dt.created_at DESC
    `

    const result = await pool.query(trackingQuery, [deliveryId, req.user.id])

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Delivery tracking not found" })
    }

    res.json({
      tracking: result.rows,
      currentLocation: result.rows[0],
    })
  } catch (error) {
    console.error("Error fetching delivery tracking:", error)
    res.status(500).json({ error: "Failed to fetch delivery tracking" })
  }
})

module.exports = router
