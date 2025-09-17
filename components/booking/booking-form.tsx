"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, MapPin, CreditCard, Shield } from "lucide-react"
import { authService } from "@/lib/auth"

interface Vehicle {
  id: string
  make: string
  model: string
  year: number
  hourly_rate: number
  daily_rate: number
  battery_level: number
  range_km: number
  primary_image?: string
  vendor_name: string
}

interface BookingFormProps {
  vehicle: Vehicle
  onBookingComplete: (bookingId: string) => void
}

export function BookingForm({ vehicle, onBookingComplete }: BookingFormProps) {
  const [formData, setFormData] = useState({
    startTime: "",
    endTime: "",
    pickupAddress: "",
    dropoffAddress: "",
    pickupLatitude: 0,
    pickupLongitude: 0,
    dropoffLatitude: 0,
    dropoffLongitude: 0,
    insuranceOptions: [] as string[],
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [pricing, setPricing] = useState({
    duration: 0,
    baseAmount: 0,
    insuranceAmount: 0,
    totalAmount: 0,
  })

  useEffect(() => {
    calculatePricing()
  }, [formData.startTime, formData.endTime, formData.insuranceOptions])

  const calculatePricing = () => {
    if (!formData.startTime || !formData.endTime) {
      setPricing({ duration: 0, baseAmount: 0, insuranceAmount: 0, totalAmount: 0 })
      return
    }

    const start = new Date(formData.startTime)
    const end = new Date(formData.endTime)
    const durationHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60)

    if (durationHours <= 0) {
      setPricing({ duration: 0, baseAmount: 0, insuranceAmount: 0, totalAmount: 0 })
      return
    }

    let baseAmount = 0
    if (durationHours <= 24) {
      baseAmount = durationHours * vehicle.hourly_rate
    } else {
      const days = Math.ceil(durationHours / 24)
      baseAmount = days * vehicle.daily_rate
    }

    // Insurance calculation (simplified)
    const insuranceAmount = formData.insuranceOptions.length * 10 * Math.ceil(durationHours / 24)

    setPricing({
      duration: Math.round(durationHours * 100) / 100,
      baseAmount: Math.round(baseAmount * 100) / 100,
      insuranceAmount: Math.round(insuranceAmount * 100) / 100,
      totalAmount: Math.round((baseAmount + insuranceAmount) * 100) / 100,
    })
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleAddressChange = async (field: string, address: string) => {
    handleInputChange(field, address)

    // In production, use Google Places API for geocoding
    // For now, use mock coordinates
    if (field === "pickupAddress") {
      handleInputChange("pickupLatitude", 37.7749)
      handleInputChange("pickupLongitude", -122.4194)
    } else if (field === "dropoffAddress") {
      handleInputChange("dropoffLatitude", 37.7849)
      handleInputChange("dropoffLongitude", -122.4094)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      if (!formData.startTime || !formData.endTime) {
        throw new Error("Please select start and end times")
      }

      if (!formData.pickupAddress || !formData.dropoffAddress) {
        throw new Error("Please enter pickup and dropoff addresses")
      }

      const response = await authService.makeAuthenticatedRequest(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/bookings/vehicle`,
        {
          method: "POST",
          body: JSON.stringify({
            vehicleId: vehicle.id,
            ...formData,
          }),
        },
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to create booking")
      }

      const data = await response.json()
      onBookingComplete(data.booking.id)
    } catch (err: any) {
      setError(err.message || "Failed to create booking")
    } finally {
      setLoading(false)
    }
  }

  const minDateTime = new Date().toISOString().slice(0, 16)

  return (
    <div className="space-y-6">
      {/* Vehicle Summary */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-orange-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">🏍️</span>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">
                {vehicle.make} {vehicle.model} ({vehicle.year})
              </h3>
              <p className="text-sm text-muted-foreground">Vendor: {vehicle.vendor_name}</p>
              <div className="flex items-center space-x-4 mt-1">
                <Badge variant="secondary">
                  <span className="text-green-600">{vehicle.battery_level}% Battery</span>
                </Badge>
                <Badge variant="secondary">{vehicle.range_km} km Range</Badge>
              </div>
            </div>
            <div className="text-right">
              <p className="font-semibold">${vehicle.hourly_rate}/hr</p>
              <p className="text-sm text-muted-foreground">${vehicle.daily_rate}/day</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Booking Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="w-5 h-5" />
            <span>Booking Details</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Date and Time */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startTime">Start Date & Time</Label>
                <div className="relative">
                  <Clock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="startTime"
                    type="datetime-local"
                    value={formData.startTime}
                    onChange={(e) => handleInputChange("startTime", e.target.value)}
                    min={minDateTime}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="endTime">End Date & Time</Label>
                <div className="relative">
                  <Clock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="endTime"
                    type="datetime-local"
                    value={formData.endTime}
                    onChange={(e) => handleInputChange("endTime", e.target.value)}
                    min={formData.startTime || minDateTime}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Addresses */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="pickupAddress">Pickup Address</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="pickupAddress"
                    placeholder="Enter pickup address"
                    value={formData.pickupAddress}
                    onChange={(e) => handleAddressChange("pickupAddress", e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dropoffAddress">Drop-off Address</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="dropoffAddress"
                    placeholder="Enter drop-off address"
                    value={formData.dropoffAddress}
                    onChange={(e) => handleAddressChange("dropoffAddress", e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Insurance Options */}
            <div className="space-y-2">
              <Label className="flex items-center space-x-2">
                <Shield className="w-4 h-4" />
                <span>Insurance Options (Optional)</span>
              </Label>
              <Select
                value={formData.insuranceOptions.join(",")}
                onValueChange={(value) => handleInputChange("insuranceOptions", value ? value.split(",") : [])}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select insurance options" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No insurance</SelectItem>
                  <SelectItem value="basic">Basic Coverage (+$10/day)</SelectItem>
                  <SelectItem value="premium">Premium Coverage (+$20/day)</SelectItem>
                  <SelectItem value="basic,premium">Full Coverage (+$25/day)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Pricing Summary */}
            {pricing.totalAmount > 0 && (
              <Card className="bg-muted/50">
                <CardContent className="p-4">
                  <h4 className="font-semibold mb-3">Pricing Summary</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Duration:</span>
                      <span>{pricing.duration} hours</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Base Amount:</span>
                      <span>${pricing.baseAmount}</span>
                    </div>
                    {pricing.insuranceAmount > 0 && (
                      <div className="flex justify-between">
                        <span>Insurance:</span>
                        <span>${pricing.insuranceAmount}</span>
                      </div>
                    )}
                    <div className="border-t pt-2 flex justify-between font-semibold">
                      <span>Total Amount:</span>
                      <span>${pricing.totalAmount}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <Button type="submit" className="w-full" disabled={loading || pricing.totalAmount === 0}>
              {loading ? (
                "Creating Booking..."
              ) : (
                <span className="flex items-center space-x-2">
                  <CreditCard className="w-4 h-4" />
                  <span>Book Now - ${pricing.totalAmount}</span>
                </span>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
