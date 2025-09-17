const { RateLimiterMemory } = require("rate-limiter-flexible")

const rateLimiter = new RateLimiterMemory({
  keyGenerator: (req) => req.ip,
  points: 5, // Number of requests
  duration: 60, // Per 60 seconds
})

const rateLimiterMiddleware = async (req, res, next) => {
  try {
    await rateLimiter.consume(req.ip)
    next()
  } catch (rejRes) {
    res.status(429).json({
      error: "Too many requests",
      retryAfter: Math.round(rejRes.msBeforeNext / 1000) || 1,
    })
  }
}

module.exports = { rateLimiter: rateLimiterMiddleware }
