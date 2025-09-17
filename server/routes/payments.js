const express = require("express")
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY)
const { pool } = require("../index")
const { authenticateToken } = require("../middleware/auth")

const router = express.Router()

// Create payment intent for booking
router.post("/intent", authenticateToken, async (req, res) => {
  try {
    const { bookingId, paymentMethodId, savePaymentMethod = false } = req.body

    // Get booking details
    const bookingResult = await pool.query(
      "SELECT id, total_amount, user_id, status FROM bookings WHERE id = $1 AND user_id = $2",
      [bookingId, req.user.id],
    )

    if (bookingResult.rows.length === 0) {
      return res.status(404).json({ error: "Booking not found" })
    }

    const booking = bookingResult.rows[0]

    if (booking.status !== "pending") {
      return res.status(400).json({ error: "Booking is not pending payment" })
    }

    // Create Stripe customer if doesn't exist
    let stripeCustomerId = null
    const customerResult = await pool.query("SELECT stripe_customer_id FROM users WHERE id = $1", [req.user.id])

    if (customerResult.rows[0]?.stripe_customer_id) {
      stripeCustomerId = customerResult.rows[0].stripe_customer_id
    } else {
      const customer = await stripe.customers.create({
        email: req.user.email,
        metadata: {
          userId: req.user.id,
        },
      })

      stripeCustomerId = customer.id
      await pool.query("UPDATE users SET stripe_customer_id = $1 WHERE id = $2", [stripeCustomerId, req.user.id])
    }

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(booking.total_amount * 100), // Convert to cents
      currency: "usd",
      customer: stripeCustomerId,
      payment_method: paymentMethodId,
      confirmation_method: "manual",
      confirm: true,
      return_url: `${process.env.FRONTEND_URL}/bookings/${bookingId}`,
      metadata: {
        bookingId: booking.id,
        userId: req.user.id,
      },
    })

    // Save payment method if requested
    if (savePaymentMethod && paymentMethodId) {
      const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId)

      await pool.query(
        `INSERT INTO payment_methods (user_id, type, provider, provider_payment_method_id, last_four)
         VALUES ($1, $2, 'stripe', $3, $4)
         ON CONFLICT (user_id, provider_payment_method_id) DO NOTHING`,
        [req.user.id, paymentMethod.type, paymentMethodId, paymentMethod.card?.last4 || "0000"],
      )
    }

    // Create transaction record
    await pool.query(
      `INSERT INTO booking_transactions (booking_id, amount, transaction_type, stripe_payment_intent_id, status)
       VALUES ($1, $2, 'payment', $3, 'pending')`,
      [bookingId, booking.total_amount, paymentIntent.id],
    )

    res.json({
      paymentIntent: {
        id: paymentIntent.id,
        client_secret: paymentIntent.client_secret,
        status: paymentIntent.status,
      },
    })
  } catch (error) {
    console.error("Create payment intent error:", error)
    res.status(500).json({ error: "Failed to create payment intent" })
  }
})

// Confirm payment
router.post("/confirm", authenticateToken, async (req, res) => {
  try {
    const { paymentIntentId } = req.body

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)

    if (paymentIntent.metadata.userId !== req.user.id) {
      return res.status(403).json({ error: "Not authorized" })
    }

    if (paymentIntent.status === "succeeded") {
      // Update booking status
      await pool.query("UPDATE bookings SET status = 'confirmed' WHERE id = $1", [paymentIntent.metadata.bookingId])

      // Update transaction status
      await pool.query("UPDATE booking_transactions SET status = 'completed' WHERE stripe_payment_intent_id = $1", [
        paymentIntentId,
      ])

      res.json({
        success: true,
        message: "Payment confirmed successfully",
      })
    } else {
      res.json({
        success: false,
        status: paymentIntent.status,
        message: "Payment requires additional action",
      })
    }
  } catch (error) {
    console.error("Confirm payment error:", error)
    res.status(500).json({ error: "Failed to confirm payment" })
  }
})

// Get user's payment methods
router.get("/methods", authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, type, provider, last_four, is_default, created_at
       FROM payment_methods
       WHERE user_id = $1
       ORDER BY is_default DESC, created_at DESC`,
      [req.user.id],
    )

    res.json({
      paymentMethods: result.rows,
    })
  } catch (error) {
    console.error("Get payment methods error:", error)
    res.status(500).json({ error: "Failed to get payment methods" })
  }
})

// Add payment method
router.post("/methods", authenticateToken, async (req, res) => {
  try {
    const { paymentMethodId, setAsDefault = false } = req.body

    // Get or create Stripe customer
    let stripeCustomerId = null
    const customerResult = await pool.query("SELECT stripe_customer_id FROM users WHERE id = $1", [req.user.id])

    if (customerResult.rows[0]?.stripe_customer_id) {
      stripeCustomerId = customerResult.rows[0].stripe_customer_id
    } else {
      const customer = await stripe.customers.create({
        email: req.user.email,
        metadata: {
          userId: req.user.id,
        },
      })

      stripeCustomerId = customer.id
      await pool.query("UPDATE users SET stripe_customer_id = $1 WHERE id = $2", [stripeCustomerId, req.user.id])
    }

    // Attach payment method to customer
    await stripe.paymentMethods.attach(paymentMethodId, {
      customer: stripeCustomerId,
    })

    // Get payment method details
    const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId)

    // Set other payment methods as non-default if this is default
    if (setAsDefault) {
      await pool.query("UPDATE payment_methods SET is_default = false WHERE user_id = $1", [req.user.id])
    }

    // Save to database
    const result = await pool.query(
      `INSERT INTO payment_methods (user_id, type, provider, provider_payment_method_id, last_four, is_default)
       VALUES ($1, $2, 'stripe', $3, $4, $5)
       RETURNING *`,
      [req.user.id, paymentMethod.type, paymentMethodId, paymentMethod.card?.last4 || "0000", setAsDefault],
    )

    res.status(201).json({
      message: "Payment method added successfully",
      paymentMethod: result.rows[0],
    })
  } catch (error) {
    console.error("Add payment method error:", error)
    res.status(500).json({ error: "Failed to add payment method" })
  }
})

// Delete payment method
router.delete("/methods/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params

    // Get payment method details
    const methodResult = await pool.query(
      "SELECT provider_payment_method_id FROM payment_methods WHERE id = $1 AND user_id = $2",
      [id, req.user.id],
    )

    if (methodResult.rows.length === 0) {
      return res.status(404).json({ error: "Payment method not found" })
    }

    const providerMethodId = methodResult.rows[0].provider_payment_method_id

    // Detach from Stripe
    await stripe.paymentMethods.detach(providerMethodId)

    // Delete from database
    await pool.query("DELETE FROM payment_methods WHERE id = $1 AND user_id = $2", [id, req.user.id])

    res.json({
      message: "Payment method deleted successfully",
    })
  } catch (error) {
    console.error("Delete payment method error:", error)
    res.status(500).json({ error: "Failed to delete payment method" })
  }
})

// Get transaction history
router.get("/transactions", authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query
    const offset = (page - 1) * limit

    const result = await pool.query(
      `SELECT bt.*, b.start_time, b.end_time, v.make, v.model, v.year
       FROM booking_transactions bt
       JOIN bookings b ON bt.booking_id = b.id
       LEFT JOIN vehicles v ON b.vehicle_id = v.id
       WHERE b.user_id = $1
       ORDER BY bt.created_at DESC
       LIMIT $2 OFFSET $3`,
      [req.user.id, limit, offset],
    )

    const countResult = await pool.query(
      `SELECT COUNT(*) FROM booking_transactions bt
       JOIN bookings b ON bt.booking_id = b.id
       WHERE b.user_id = $1`,
      [req.user.id],
    )

    res.json({
      transactions: result.rows,
      total: Number.parseInt(countResult.rows[0].count),
      page: Number.parseInt(page),
      totalPages: Math.ceil(countResult.rows[0].count / limit),
    })
  } catch (error) {
    console.error("Get transactions error:", error)
    res.status(500).json({ error: "Failed to get transactions" })
  }
})

// Webhook for Stripe events
router.post("/webhook", express.raw({ type: "application/json" }), async (req, res) => {
  const sig = req.headers["stripe-signature"]
  let event

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET)
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message)
    return res.status(400).send(`Webhook Error: ${err.message}`)
  }

  try {
    switch (event.type) {
      case "payment_intent.succeeded":
        const paymentIntent = event.data.object
        await handlePaymentSuccess(paymentIntent)
        break

      case "payment_intent.payment_failed":
        const failedPayment = event.data.object
        await handlePaymentFailure(failedPayment)
        break

      default:
        console.log(`Unhandled event type ${event.type}`)
    }

    res.json({ received: true })
  } catch (error) {
    console.error("Webhook handler error:", error)
    res.status(500).json({ error: "Webhook handler failed" })
  }
})

async function handlePaymentSuccess(paymentIntent) {
  const bookingId = paymentIntent.metadata.bookingId

  // Update booking status
  await pool.query("UPDATE bookings SET status = 'confirmed' WHERE id = $1", [bookingId])

  // Update transaction status
  await pool.query("UPDATE booking_transactions SET status = 'completed' WHERE stripe_payment_intent_id = $1", [
    paymentIntent.id,
  ])

  console.log(`Payment succeeded for booking ${bookingId}`)
}

async function handlePaymentFailure(paymentIntent) {
  const bookingId = paymentIntent.metadata.bookingId

  // Update transaction status
  await pool.query("UPDATE booking_transactions SET status = 'failed' WHERE stripe_payment_intent_id = $1", [
    paymentIntent.id,
  ])

  // Optionally cancel the booking or keep it pending for retry
  console.log(`Payment failed for booking ${bookingId}`)
}

module.exports = router
