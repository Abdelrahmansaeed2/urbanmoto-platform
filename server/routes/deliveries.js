const express = require("express")
const { pool } = require("../index")
const { authenticateToken, requireRole } = require("../middleware/auth")

const router = express.Router()

// Create delivery quote
router.post("/quote", async (req, res) => {
  try {
    const { pickupLatitude, pickupLongitude, dropoffLatitude, dropoffLongitude, packageSize = "medium" } = req.body

    // Calculate distance (simplified - in production use Google Maps Distance Matrix API)
    const distance = calculateDistance(pickupLatitude, pickupLongitude, dropoffLatitude, dropoffLongitude)

    // Base pricing structure
    const baseFee = 5.0
    const perKmRate = 2.5
    const sizeMultipliers = {
      small: 1.0,
      medium: 1.2,
      large: 1.5,
    }

    const sizeMultiplier = sizeMultipliers[packageSize] || 1.2
    const distanceFee = distance * perKmRate
    const surgeFee = 0 // Could be dynamic based on demand

    const totalFee = (baseFee + distanceFee) * sizeMultiplier + surgeFee

    // Estimated duration (simplified)
    const estimatedDuration = Math.max(15, distance * 3) // 3 minutes per km, minimum 15 minutes

    const quote = {
      distance: Math.round(distance * 100) / 100,
      estimatedDuration: Math.round(estimatedDuration),
      baseFee,
      distanceFee: Math.round(distanceFee * 100) / 100,
      surgeFee,
      totalFee: Math.round(totalFee * 100) / 100,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
    }

    // Save quote to database
    const result = await pool.query(
      `INSERT INTO delivery_quotes (
        pickup_latitude, pickup_longitude, dropoff_latitude, dropoff_longitude,
        distance_km, estimated_duration_minutes, base_fee, distance_fee, surge_fee, total_fee, expires_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *`,
      [
        pickupLatitude,
        pickupLongitude,
        dropoffLatitude,
        dropoffLongitude,
        quote.distance,
        quote.estimatedDuration,
        quote.baseFee,
        quote.distanceFee,
        quote.surgeFee,
        quote.totalFee,
        quote.expiresAt,
      ],
    )

    res.json({
      quote: result.rows[0],
    })
  } catch (error) {
    console.error("Create delivery quote error:", error)
    res.status(500).json({ error: "Failed to create delivery quote" })
  }
})

// Create delivery order
router.post("/", authenticateToken, async (req, res) => {
  try {
    const {
      pickupLatitude,
      pickupLongitude,
      pickupAddress,
      pickupContactName,
      pickupContactPhone,
      dropoffLatitude,
      dropoffLongitude,
      dropoffAddress,
      dropoffContactName,
      dropoffContactPhone,
      packageSize,
      packageCategory,
      packageValue,
      scheduledPickup,
      items = [],
      quoteId,
    } = req.body

    // Validate quote if provided
    let deliveryFee = 0
    if (quoteId) {
      const quoteResult = await pool.query(
        "SELECT total_fee, expires_at FROM delivery_quotes WHERE id = $1 AND expires_at > NOW()",
        [quoteId],
      )

      if (quoteResult.rows.length === 0) {
        return res.status(400).json({ error: "Quote expired or not found" })
      }

      deliveryFee = quoteResult.rows[0].total_fee
    } else {
      // Calculate fee on the fly
      const distance = calculateDistance(pickupLatitude, pickupLongitude, dropoffLatitude, dropoffLongitude)
      const baseFee = 5.0
      const perKmRate = 2.5
      const sizeMultipliers = { small: 1.0, medium: 1.2, large: 1.5 }
      const sizeMultiplier = sizeMultipliers[packageSize] || 1.2
      deliveryFee = (baseFee + distance * perKmRate) * sizeMultiplier
    }

    // Create delivery order
    const orderResult = await pool.query(
      `INSERT INTO delivery_orders (
        user_id, pickup_latitude, pickup_longitude, pickup_address, pickup_contact_name, pickup_contact_phone,
        dropoff_latitude, dropoff_longitude, dropoff_address, dropoff_contact_name, dropoff_contact_phone,
        package_size, package_category, package_value, delivery_fee, scheduled_pickup, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, 'pending')
      RETURNING *`,
      [
        req.user.id,
        pickupLatitude,
        pickupLongitude,
        pickupAddress,
        pickupContactName,
        pickupContactPhone,
        dropoffLatitude,
        dropoffLongitude,
        dropoffAddress,
        dropoffContactName,
        dropoffContactPhone,
        packageSize,
        packageCategory,
        packageValue,
        deliveryFee,
        scheduledPickup,
      ],
    )

    const order = orderResult.rows[0]

    // Add order items
    if (items.length > 0) {
      for (const item of items) {
        await pool.query(
          "INSERT INTO order_items (delivery_order_id, item_name, quantity, weight_kg, dimensions) VALUES ($1, $2, $3, $4, $5)",
          [order.id, item.name, item.quantity || 1, item.weight || 0, JSON.stringify(item.dimensions || {})],
        )
      }
    }

    res.status(201).json({
      message: "Delivery order created successfully",
      order,
    })
  } catch (error) {
    console.error("Create delivery order error:", error)
    res.status(500).json({ error: "Failed to create delivery order" })
  }
})

// Get user's delivery orders
router.get("/my-orders", authenticateToken, async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query
    const offset = (page - 1) * limit

    let query = `
      SELECT do.*, u.first_name as driver_first_name, u.last_name as driver_last_name, u.phone as driver_phone
      FROM delivery_orders do
      LEFT JOIN users u ON do.driver_id = u.id
      WHERE do.user_id = $1
    `

    const params = [req.user.id]
    let paramIndex = 2

    if (status) {
      query += ` AND do.status = $${paramIndex}`
      params.push(status)
      paramIndex++
    }

    query += ` ORDER BY do.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`
    params.push(limit, offset)

    const result = await pool.query(query, params)

    // Get total count
    let countQuery = "SELECT COUNT(*) FROM delivery_orders WHERE user_id = $1"
    const countParams = [req.user.id]

    if (status) {
      countQuery += " AND status = $2"
      countParams.push(status)
    }

    const countResult = await pool.query(countQuery, countParams)

    res.json({
      orders: result.rows,
      total: Number.parseInt(countResult.rows[0].count),
      page: Number.parseInt(page),
      totalPages: Math.ceil(countResult.rows[0].count / limit),
    })
  } catch (error) {
    console.error("Get delivery orders error:", error)
    res.status(500).json({ error: "Failed to get delivery orders" })
  }
})

// Get available delivery orders (for drivers)
router.get("/available", authenticateToken, requireRole(["driver", "admin"]), async (req, res) => {
  try {
    const { latitude, longitude, radius = 10 } = req.query

    if (!latitude || !longitude) {
      return res.status(400).json({ error: "Driver location is required" })
    }

    const result = await pool.query(
      `SELECT do.*,
              (6371 * acos(cos(radians($1)) * cos(radians(do.pickup_latitude)) 
               * cos(radians(do.pickup_longitude) - radians($2)) 
               + sin(radians($1)) * sin(radians(do.pickup_latitude)))) AS distance
       FROM delivery_orders do
       WHERE do.status = 'pending' 
         AND do.driver_id IS NULL
         AND (6371 * acos(cos(radians($1)) * cos(radians(do.pickup_latitude)) 
              * cos(radians(do.pickup_longitude) - radians($2)) 
              + sin(radians($1)) * sin(radians(do.pickup_latitude)))) <= $3
       ORDER BY distance ASC
       LIMIT 20`,
      [Number.parseFloat(latitude), Number.parseFloat(longitude), Number.parseFloat(radius)],
    )

    res.json({
      orders: result.rows,
      count: result.rows.length,
    })
  } catch (error) {
    console.error("Get available orders error:", error)
    res.status(500).json({ error: "Failed to get available orders" })
  }
})

// Accept delivery order (drivers)
router.post("/:id/accept", authenticateToken, requireRole(["driver", "admin"]), async (req, res) => {
  try {
    const { id } = req.params

    const result = await pool.query(
      "UPDATE delivery_orders SET driver_id = $1, status = 'assigned', updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND status = 'pending' AND driver_id IS NULL RETURNING *",
      [req.user.id, id],
    )

    if (result.rows.length === 0) {
      return res.status(400).json({ error: "Order not available or already assigned" })
    }

    res.json({
      message: "Delivery order accepted successfully",
      order: result.rows[0],
    })
  } catch (error) {
    console.error("Accept delivery order error:", error)
    res.status(500).json({ error: "Failed to accept delivery order" })
  }
})

// Update delivery status
router.patch("/:id/status", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params
    const { status, notes } = req.body

    const validStatuses = ["assigned", "picked_up", "in_transit", "delivered", "cancelled"]
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: "Invalid status" })
    }

    // Get order details
    const orderResult = await pool.query("SELECT * FROM delivery_orders WHERE id = $1", [id])

    if (orderResult.rows.length === 0) {
      return res.status(404).json({ error: "Delivery order not found" })
    }

    const order = orderResult.rows[0]

    // Check permissions
    const canUpdate =
      req.user.id === order.user_id || // Customer
      req.user.id === order.driver_id || // Driver
      req.user.user_type === "admin" // Admin

    if (!canUpdate) {
      return res.status(403).json({ error: "Not authorized to update this order" })
    }

    // Update order
    const result = await pool.query(
      "UPDATE delivery_orders SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *",
      [status, id],
    )

    // Log the status change
    await pool.query(
      `INSERT INTO audit_logs (user_id, action, resource_type, resource_id, new_values)
       VALUES ($1, 'status_update', 'delivery_order', $2, $3)`,
      [req.user.id, id, JSON.stringify({ status, notes })],
    )

    res.json({
      message: "Delivery status updated successfully",
      order: result.rows[0],
    })
  } catch (error) {
    console.error("Update delivery status error:", error)
    res.status(500).json({ error: "Failed to update delivery status" })
  }
})

// Helper function to calculate distance between two points
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371 // Radius of the Earth in kilometers
  const dLat = (lat2 - lat1) * (Math.PI / 180)
  const dLon = (lon2 - lon1) * (Math.PI / 180)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

module.exports = router
