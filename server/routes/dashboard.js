const express = require("express")
const router = express.Router()
const { authenticateToken } = require("../middleware/auth")
const pool = require("../database/connection")

// Get user dashboard data
router.get("/overview", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id

    // Get active bookings
    const activeBookingsQuery = `
      SELECT 
        b.*,
        v.make, v.model, v.image_url, v.license_plate,
        vn.name as vendor_name
      FROM bookings b
      JOIN vehicles v ON b.vehicle_id = v.id
      JOIN vendors vn ON v.vendor_id = vn.id
      WHERE b.user_id = $1 AND b.status IN ('confirmed', 'in_progress', 'picked_up')
      ORDER BY b.start_date ASC
    `

    // Get recent deliveries
    const recentDeliveriesQuery = `
      SELECT 
        d.*,
        dt.latitude, dt.longitude, dt.status as tracking_status
      FROM deliveries d
      LEFT JOIN delivery_tracking dt ON d.id = dt.delivery_id
      WHERE d.user_id = $1
      ORDER BY d.created_at DESC
      LIMIT 5
    `

    // Get user statistics
    const statsQuery = `
      SELECT 
        COUNT(CASE WHEN b.status = 'completed' THEN 1 END) as completed_bookings,
        COUNT(CASE WHEN d.status = 'delivered' THEN 1 END) as completed_deliveries,
        COALESCE(SUM(CASE WHEN b.status = 'completed' THEN b.total_amount ELSE 0 END), 0) as total_spent,
        COUNT(CASE WHEN b.created_at >= NOW() - INTERVAL '30 days' THEN 1 END) as bookings_this_month
      FROM bookings b
      FULL OUTER JOIN deliveries d ON b.user_id = d.user_id
      WHERE b.user_id = $1 OR d.user_id = $1
    `

    const [activeBookings, recentDeliveries, stats] = await Promise.all([
      pool.query(activeBookingsQuery, [userId]),
      pool.query(recentDeliveriesQuery, [userId]),
      pool.query(statsQuery, [userId]),
    ])

    res.json({
      activeBookings: activeBookings.rows,
      recentDeliveries: recentDeliveries.rows,
      stats: stats.rows[0] || {
        completed_bookings: 0,
        completed_deliveries: 0,
        total_spent: 0,
        bookings_this_month: 0,
      },
    })
  } catch (error) {
    console.error("Error fetching dashboard data:", error)
    res.status(500).json({ error: "Failed to fetch dashboard data" })
  }
})

// Get booking history
router.get("/bookings", authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query
    const offset = (page - 1) * limit

    let whereClause = "WHERE b.user_id = $1"
    const queryParams = [req.user.id]

    if (status) {
      whereClause += " AND b.status = $2"
      queryParams.push(status)
    }

    const bookingsQuery = `
      SELECT 
        b.*,
        v.make, v.model, v.image_url, v.license_plate,
        vn.name as vendor_name, vn.phone as vendor_phone
      FROM bookings b
      JOIN vehicles v ON b.vehicle_id = v.id
      JOIN vendors vn ON v.vendor_id = vn.id
      ${whereClause}
      ORDER BY b.created_at DESC
      LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}
    `

    queryParams.push(limit, offset)

    const result = await pool.query(bookingsQuery, queryParams)

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM bookings b
      ${whereClause}
    `

    const countResult = await pool.query(countQuery, queryParams.slice(0, -2))

    res.json({
      bookings: result.rows,
      pagination: {
        page: Number.parseInt(page),
        limit: Number.parseInt(limit),
        total: Number.parseInt(countResult.rows[0].total),
        pages: Math.ceil(countResult.rows[0].total / limit),
      },
    })
  } catch (error) {
    console.error("Error fetching booking history:", error)
    res.status(500).json({ error: "Failed to fetch booking history" })
  }
})

module.exports = router
