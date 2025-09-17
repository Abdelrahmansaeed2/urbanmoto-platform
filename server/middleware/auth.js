const jwt = require("jsonwebtoken")
const { pool } = require("../index")

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization
    const token = authHeader && authHeader.split(" ")[1]

    if (!token) {
      return res.status(401).json({ error: "Access token required" })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "your-secret-key")

    // Get fresh user data
    const result = await pool.query(
      "SELECT id, email, first_name, last_name, user_type, is_active FROM users WHERE id = $1",
      [decoded.userId],
    )

    if (result.rows.length === 0 || !result.rows[0].is_active) {
      return res.status(401).json({ error: "Invalid or expired token" })
    }

    req.user = result.rows[0]
    next()
  } catch (error) {
    return res.status(403).json({ error: "Invalid token" })
  }
}

const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" })
    }

    if (!roles.includes(req.user.user_type)) {
      return res.status(403).json({ error: "Insufficient permissions" })
    }

    next()
  }
}

module.exports = { authenticateToken, requireRole }
