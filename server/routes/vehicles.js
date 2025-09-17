const express = require("express")
const { pool } = require("../index")
const { authenticateToken, requireRole } = require("../middleware/auth")
const { validateVehicle } = require("../middleware/validation")

const router = express.Router()

// Get nearby vehicles
router.get("/nearby", async (req, res) => {
  try {
    const { latitude, longitude, radius = 5, vehicleType, maxPrice, minBattery = 20 } = req.query

    if (!latitude || !longitude) {
      return res.status(400).json({ error: "Latitude and longitude are required" })
    }

    let query = `
      SELECT v.*, vi.image_url as primary_image, vn.business_name as vendor_name,
             vn.rating as vendor_rating,
             (6371 * acos(cos(radians($1)) * cos(radians(v.current_latitude)) 
             * cos(radians(v.current_longitude) - radians($2)) 
             + sin(radians($1)) * sin(radians(v.current_latitude)))) AS distance
      FROM vehicles v
      LEFT JOIN vehicle_images vi ON v.id = vi.vehicle_id AND vi.is_primary = true
      LEFT JOIN vendors vn ON v.vendor_id = vn.id
      WHERE v.status = 'available' 
        AND v.battery_level >= $3
        AND (6371 * acos(cos(radians($1)) * cos(radians(v.current_latitude)) 
             * cos(radians(v.current_longitude) - radians($2)) 
             + sin(radians($1)) * sin(radians(v.current_latitude)))) <= $4
    `

    const params = [
      Number.parseFloat(latitude),
      Number.parseFloat(longitude),
      Number.parseInt(minBattery),
      Number.parseFloat(radius),
    ]
    let paramIndex = 5

    if (vehicleType) {
      query += ` AND v.vehicle_type = $${paramIndex}`
      params.push(vehicleType)
      paramIndex++
    }

    if (maxPrice) {
      query += ` AND v.hourly_rate <= $${paramIndex}`
      params.push(Number.parseFloat(maxPrice))
      paramIndex++
    }

    query += ` ORDER BY distance ASC LIMIT 50`

    const result = await pool.query(query, params)

    res.json({
      vehicles: result.rows,
      count: result.rows.length,
    })
  } catch (error) {
    console.error("Get nearby vehicles error:", error)
    res.status(500).json({ error: "Failed to get nearby vehicles" })
  }
})

// Get vehicle details
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params

    const vehicleResult = await pool.query(
      `SELECT v.*, vn.business_name as vendor_name, vn.rating as vendor_rating,
              vn.address as vendor_address, vn.id as vendor_id
       FROM vehicles v
       LEFT JOIN vendors vn ON v.vendor_id = vn.id
       WHERE v.id = $1`,
      [id],
    )

    if (vehicleResult.rows.length === 0) {
      return res.status(404).json({ error: "Vehicle not found" })
    }

    const vehicle = vehicleResult.rows[0]

    // Get vehicle images
    const imagesResult = await pool.query(
      "SELECT image_url, is_primary FROM vehicle_images WHERE vehicle_id = $1 ORDER BY is_primary DESC",
      [id],
    )

    // Get recent reviews
    const reviewsResult = await pool.query(
      `SELECT r.rating, r.comment, r.created_at, u.first_name, u.last_name
       FROM reviews r
       JOIN users u ON r.user_id = u.id
       WHERE r.vehicle_id = $1
       ORDER BY r.created_at DESC
       LIMIT 10`,
      [id],
    )

    vehicle.images = imagesResult.rows
    vehicle.reviews = reviewsResult.rows

    res.json({ vehicle })
  } catch (error) {
    console.error("Get vehicle details error:", error)
    res.status(500).json({ error: "Failed to get vehicle details" })
  }
})

// Add new vehicle (vendors only)
router.post("/", authenticateToken, requireRole(["vendor", "admin"]), validateVehicle, async (req, res) => {
  try {
    const {
      make,
      model,
      year,
      vehicleType,
      licensePlate,
      color,
      rangeKm,
      hourlyRate,
      dailyRate,
      currentLatitude,
      currentLongitude,
    } = req.body

    // Get vendor ID
    const vendorResult = await pool.query("SELECT id FROM vendors WHERE user_id = $1", [req.user.id])

    if (vendorResult.rows.length === 0) {
      return res.status(400).json({ error: "Vendor profile not found" })
    }

    const vendorId = vendorResult.rows[0].id

    const result = await pool.query(
      `INSERT INTO vehicles (vendor_id, make, model, year, vehicle_type, license_plate, 
                            color, range_km, hourly_rate, daily_rate, current_latitude, current_longitude)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING *`,
      [
        vendorId,
        make,
        model,
        year,
        vehicleType,
        licensePlate,
        color,
        rangeKm,
        hourlyRate,
        dailyRate,
        currentLatitude,
        currentLongitude,
      ],
    )

    res.status(201).json({
      message: "Vehicle added successfully",
      vehicle: result.rows[0],
    })
  } catch (error) {
    console.error("Add vehicle error:", error)
    if (error.code === "23505") {
      // Unique constraint violation
      res.status(400).json({ error: "License plate already exists" })
    } else {
      res.status(500).json({ error: "Failed to add vehicle" })
    }
  }
})

// Update vehicle
router.put("/:id", authenticateToken, requireRole(["vendor", "admin"]), async (req, res) => {
  try {
    const { id } = req.params
    const updates = req.body

    // Verify ownership (vendors can only update their own vehicles)
    if (req.user.user_type === "vendor") {
      const ownershipResult = await pool.query(
        `SELECT v.id FROM vehicles v
         JOIN vendors vn ON v.vendor_id = vn.id
         WHERE v.id = $1 AND vn.user_id = $2`,
        [id, req.user.id],
      )

      if (ownershipResult.rows.length === 0) {
        return res.status(403).json({ error: "Not authorized to update this vehicle" })
      }
    }

    // Build dynamic update query
    const allowedFields = [
      "make",
      "model",
      "year",
      "vehicle_type",
      "color",
      "battery_level",
      "range_km",
      "hourly_rate",
      "daily_rate",
      "current_latitude",
      "current_longitude",
      "status",
    ]

    const updateFields = []
    const values = []
    let paramIndex = 1

    Object.keys(updates).forEach((key) => {
      if (allowedFields.includes(key)) {
        updateFields.push(`${key} = $${paramIndex}`)
        values.push(updates[key])
        paramIndex++
      }
    })

    if (updateFields.length === 0) {
      return res.status(400).json({ error: "No valid fields to update" })
    }

    values.push(id)
    const query = `UPDATE vehicles SET ${updateFields.join(", ")}, updated_at = CURRENT_TIMESTAMP WHERE id = $${paramIndex} RETURNING *`

    const result = await pool.query(query, values)

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Vehicle not found" })
    }

    res.json({
      message: "Vehicle updated successfully",
      vehicle: result.rows[0],
    })
  } catch (error) {
    console.error("Update vehicle error:", error)
    res.status(500).json({ error: "Failed to update vehicle" })
  }
})

// Get vendor's vehicles
router.get("/vendor/my-vehicles", authenticateToken, requireRole(["vendor", "admin"]), async (req, res) => {
  try {
    const vendorResult = await pool.query("SELECT id FROM vendors WHERE user_id = $1", [req.user.id])

    if (vendorResult.rows.length === 0) {
      return res.status(400).json({ error: "Vendor profile not found" })
    }

    const vendorId = vendorResult.rows[0].id

    const result = await pool.query(
      `SELECT v.*, vi.image_url as primary_image,
              COUNT(b.id) as total_bookings,
              AVG(r.rating) as average_rating
       FROM vehicles v
       LEFT JOIN vehicle_images vi ON v.id = vi.vehicle_id AND vi.is_primary = true
       LEFT JOIN bookings b ON v.id = b.vehicle_id AND b.status = 'completed'
       LEFT JOIN reviews r ON v.id = r.vehicle_id
       WHERE v.vendor_id = $1
       GROUP BY v.id, vi.image_url
       ORDER BY v.created_at DESC`,
      [vendorId],
    )

    res.json({
      vehicles: result.rows,
      count: result.rows.length,
    })
  } catch (error) {
    console.error("Get vendor vehicles error:", error)
    res.status(500).json({ error: "Failed to get vehicles" })
  }
})

module.exports = router
