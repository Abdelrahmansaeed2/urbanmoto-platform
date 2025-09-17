const Joi = require("joi")

const validateAuth = (req, res, next) => {
  const schema = Joi.object({
    email: Joi.string().email().required(),
    phone: Joi.string()
      .pattern(/^\+?[\d\s-()]+$/)
      .optional(),
    password: Joi.string().min(8).required(),
    firstName: Joi.string().min(2).max(50).required(),
    lastName: Joi.string().min(2).max(50).required(),
    userType: Joi.string().valid("customer", "driver", "vendor").optional(),
  })

  const { error } = schema.validate(req.body)
  if (error) {
    return res.status(400).json({ error: error.details[0].message })
  }

  next()
}

const validateVehicle = (req, res, next) => {
  const schema = Joi.object({
    make: Joi.string().required(),
    model: Joi.string().required(),
    year: Joi.number()
      .integer()
      .min(2000)
      .max(new Date().getFullYear() + 1)
      .required(),
    vehicleType: Joi.string().valid("scooter", "motorbike", "electric_scooter").required(),
    licensePlate: Joi.string().required(),
    color: Joi.string().required(),
    rangeKm: Joi.number().positive().required(),
    hourlyRate: Joi.number().positive().required(),
    dailyRate: Joi.number().positive().required(),
    currentLatitude: Joi.number().min(-90).max(90).required(),
    currentLongitude: Joi.number().min(-180).max(180).required(),
  })

  const { error } = schema.validate(req.body)
  if (error) {
    return res.status(400).json({ error: error.details[0].message })
  }

  next()
}

module.exports = { validateAuth, validateVehicle }
