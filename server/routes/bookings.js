const express = require("express")
const { pool } = require("../index")
const { authenticateToken } = require("../middleware/auth")

const router = express.Router()

// Create vehicle booking
router.post("/vehicle", authenticateToken, async (req, res) => {
  try {
    const {
      vehicleId,
      startTime,
      endTime,
      pickupLatitude,
      pickupLongitude,
      pickupAddress,
      dropoffLatitude,
      dropoffLongitude,
      dropoffAddress,
      insuranceOptions = [],
    } = req.body

    // Validate vehicle availability
    const vehicleResult = await pool.query("SELECT id, hourly_rate, daily_rate, status FROM vehicles WHERE id = $1", [
      vehicleId,
    ])

    if (vehicleResult.rows.length === 0) {
      return res.status(404).json({ error: "Vehicle not found" })
    }

    const vehicle = vehicleResult.rows[0]

    if (vehicle.status !== "available") {
      return res.status(400).json({ error: "Vehicle is not available" })
    }

    // Check for conflicting bookings
    const conflictResult = await pool.query(
      `SELECT id FROM bookings 
       WHERE vehicle_id = $1 
         AND status IN ('confirmed', 'active') 
         AND (
           (start_time <= $2 AND end_time > $2) OR
           (start_time < $3 AND end_time >= $3) OR
           (start_time >= $2 AND end_time <= $3)
         )`,
      [vehicleId, startTime, endTime],
    )

    if (conflictResult.rows.length > 0) {
      return res.status(400).json({ error: "Vehicle is already booked for this time period" })
    }

    // Calculate total amount
    const start = new Date(startTime)
    const end = new Date(endTime)
    const durationHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60)
    const durationDays = Math.ceil(durationHours / 24)

    let totalAmount = 0
    if (durationHours <= 24) {
      totalAmount = durationHours * vehicle.hourly_rate
    } else {
      totalAmount = durationDays * vehicle.daily_rate
    }

    // Add insurance costs
    let insuranceCost = 0
    if (insuranceOptions.length > 0) {
      const insuranceResult = await pool.query(
        "SELECT SUM(daily_rate * $1) as total FROM insurance_options WHERE id = ANY($2)",
        [durationDays, insuranceOptions],
      )
      insuranceCost = Number.parseFloat(insuranceResult.rows[0].total) || 0
    }

    totalAmount += insuranceCost

    // Create booking
    const bookingResult = await pool.query(
      `INSERT INTO bookings (
        user_id, vehicle_id, booking_type, start_time, end_time,
        pickup_latitude, pickup_longitude, pickup_address,
        dropoff_latitude, dropoff_longitude, dropoff_address,
        total_amount, status
      ) VALUES ($1, $2, 'rental', $3, $4, $5, $6, $7, $8, $9, $10, $11, 'pending')
      RETURNING *`,
      [
        req.user.id,
        vehicleId,
        startTime,
        endTime,
        pickupLatitude,
        pickupLongitude,
        pickupAddress,
        dropoffLatitude,
        dropoffLongitude,
        dropoffAddress,
        totalAmount,
      ],
    )

    const booking = bookingResult.rows[0]

    // Update vehicle status
    await pool.query("UPDATE vehicles SET status = 'rented' WHERE id = $1", [vehicleId])

    res.status(201).json({
      message: "Booking created successfully",
      booking,
      totalAmount,
      durationHours: Math.round(durationHours * 100) / 100,
    })
  } catch (error) {
    console.error("Create booking error:", error)
    res.status(500).json({ error: "Failed to create booking" })
  }
})

// Get user's bookings
router.get("/my-bookings", authenticateToken, async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query
    const offset = (page - 1) * limit

    let query = `
      SELECT b.*, v.make, v.model, v.year, v.license_plate, v.color,
             vi.image_url as vehicle_image, vn.business_name as vendor_name
      FROM bookings b
      JOIN vehicles v ON b.vehicle_id = v.id
      LEFT JOIN vehicle_images vi ON v.id = vi.vehicle_id AND vi.is_primary = true
      LEFT JOIN vendors vn ON v.vendor_id = vn.id
      WHERE b.user_id = $1
    `

    const params = [req.user.id]
    let paramIndex = 2

    if (status) {
      query += ` AND b.status = $${paramIndex}`
      params.push(status)
      paramIndex++
    }

    query += ` ORDER BY b.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`
    params.push(limit, offset)

    const result = await pool.query(query, params)

    // Get total count
    let countQuery = "SELECT COUNT(*) FROM bookings WHERE user_id = $1"
    const countParams = [req.user.id]

    if (status) {
      countQuery += " AND status = $2"
      countParams.push(status)
    }

    const countResult = await pool.query(countQuery, countParams)

    res.json({
      bookings: result.rows,
      total: Number.parseInt(countResult.rows[0].count),
      page: Number.parseInt(page),
      totalPages: Math.ceil(countResult.rows[0].count / limit),
    })
  } catch (error) {
    console.error("Get bookings error:", error)
    res.status(500).json({ error: "Failed to get bookings" })
  }
})

// Get booking details
router.get("/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params

    const result = await pool.query(
      `SELECT b.*, v.make, v.model, v.year, v.license_plate, v.color, v.current_latitude, v.current_longitude,
              vi.image_url as vehicle_image, vn.business_name as vendor_name, vn.address as vendor_address,
              u.first_name as vendor_first_name, u.last_name as vendor_last_name, u.phone as vendor_phone
       FROM bookings b
       JOIN vehicles v ON b.vehicle_id = v.id
       LEFT JOIN vehicle_images vi ON v.id = vi.vehicle_id AND vi.is_primary = true
       LEFT JOIN vendors vn ON v.vendor_id = vn.id
       LEFT JOIN users u ON vn.user_id = u.id
       WHERE b.id = $1 AND (b.user_id = $2 OR vn.user_id = $2)`,
      [id, req.user.id],
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Booking not found" })
    }

    const booking = result.rows[0]

    // Get payment transactions
    const transactionsResult = await pool.query(
      "SELECT * FROM booking_transactions WHERE booking_id = $1 ORDER BY created_at DESC",
      [id],
    )

    booking.transactions = transactionsResult.rows

    res.json({ booking })
  } catch (error) {
    console.error("Get booking details error:", error)
    res.status(500).json({ error: "Failed to get booking details" })
  }
})

// Update booking status
router.patch("/:id/status", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params
    const { status, notes } = req.body

    const validStatuses = ["confirmed", "active", "completed", "cancelled"]
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: "Invalid status" })
    }

    // Get booking details
    const bookingResult = await pool.query(
      `SELECT b.*, v.vendor_id, vn.user_id as vendor_user_id
       FROM bookings b
       JOIN vehicles v ON b.vehicle_id = v.id
       JOIN vendors vn ON v.vendor_id = vn.id
       WHERE b.id = $1`,
      [id],
    )

    if (bookingResult.rows.length === 0) {
      return res.status(404).json({ error: "Booking not found" })
    }

    const booking = bookingResult.rows[0]

    // Check permissions
    const canUpdate =
      req.user.id === booking.user_id || // Customer
      req.user.id === booking.vendor_user_id || // Vendor
      req.user.user_type === "admin" // Admin

    if (!canUpdate) {
      return res.status(403).json({ error: "Not authorized to update this booking" })
    }

    // Update booking
    const result = await pool.query(
      "UPDATE bookings SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *",
      [status, id],
    )

    // Update vehicle status based on booking status
    let vehicleStatus = "available"
    if (status === "confirmed" || status === "active") {
      vehicleStatus = "rented"
    }

    await pool.query("UPDATE vehicles SET status = $1 WHERE id = $2", [vehicleStatus, booking.vehicle_id])

    // Log the status change
    await pool.query(
      `INSERT INTO audit_logs (user_id, action, resource_type, resource_id, new_values)
       VALUES ($1, 'status_update', 'booking', $2, $3)`,
      [req.user.id, id, JSON.stringify({ status, notes })],
    )

    res.json({
      message: "Booking status updated successfully",
      booking: result.rows[0],
    })
  } catch (error) {
    console.error("Update booking status error:", error)
    res.status(500).json({ error: "Failed to update booking status" })
  }
})

// Cancel booking
router.post("/:id/cancel", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params
    const { reason } = req.body

    const bookingResult = await pool.query("SELECT * FROM bookings WHERE id = $1 AND user_id = $2", [id, req.user.id])

    if (bookingResult.rows.length === 0) {
      return res.status(404).json({ error: "Booking not found" })
    }

    const booking = bookingResult.rows[0]

    if (booking.status === "completed" || booking.status === "cancelled") {
      return res.status(400).json({ error: "Cannot cancel this booking" })
    }

    // Update booking status
    await pool.query("UPDATE bookings SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP WHERE id = $1", [id])

    // Make vehicle available again
    await pool.query("UPDATE vehicles SET status = 'available' WHERE id = $1", [booking.vehicle_id])

    // Log cancellation
    await pool.query(
      `INSERT INTO audit_logs (user_id, action, resource_type, resource_id, new_values)
       VALUES ($1, 'cancellation', 'booking', $2, $3)`,
      [req.user.id, id, JSON.stringify({ reason })],
    )

    res.json({ message: "Booking cancelled successfully" })
  } catch (error) {
    console.error("Cancel booking error:", error)
    res.status(500).json({ error: "Failed to cancel booking" })
  }
})

module.exports = router
