const express = require("express")
const cors = require("cors")
const helmet = require("helmet")
const dotenv = require("dotenv")
const { Pool } = require("pg")
const http = require("http")
const socketIo = require("socket.io")

// Load environment variables
dotenv.config()

const app = express()
const server = http.createServer(app)
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
  },
})

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://localhost:5432/urbanmoto",
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
})

// Middleware
app.use(helmet())
app.use(cors())
app.use(express.json({ limit: "10mb" }))
app.use(express.urlencoded({ extended: true }))

// Routes
app.use("/api/auth", require("./routes/auth"))
app.use("/api/users", require("./routes/users"))
app.use("/api/vehicles", require("./routes/vehicles"))
app.use("/api/vendors", require("./routes/vendors"))
app.use("/api/bookings", require("./routes/bookings"))
app.use("/api/deliveries", require("./routes/deliveries"))
app.use("/api/payments", require("./routes/payments"))
app.use("/api/tracking", require("./routes/tracking"))
app.use("/api/reviews", require("./routes/reviews"))
app.use("/api/search", require("./routes/search"))

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() })
})

// Socket.io for real-time tracking
io.on("connection", (socket) => {
  console.log("User connected:", socket.id)

  socket.on("join-tracking", (bookingId) => {
    socket.join(`tracking-${bookingId}`)
  })

  socket.on("location-update", (data) => {
    socket.to(`tracking-${data.bookingId}`).emit("location-update", data)
  })

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id)
  })
})

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({ error: "Something went wrong!" })
})

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({ error: "Route not found" })
})

const PORT = process.env.PORT || 5000

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})

module.exports = { app, pool, io }
