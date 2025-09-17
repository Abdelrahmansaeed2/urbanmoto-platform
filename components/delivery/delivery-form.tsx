"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Package, MapPin, User, Phone, DollarSign, Clock } from "lucide-react"
import { authService } from "@/lib/auth"

interface DeliveryQuote {
  id: string
  distance: number
  estimatedDuration: number
  totalFee: number
  expiresAt: string
}

export function DeliveryForm() {
  const [formData, setFormData] = useState({
    pickupAddress: "",
    pickupContactName: "",
    pickupContactPhone: "",
    dropoffAddress: "",
    dropoffContactName: "",
    dropoffContactPhone: "",
    packageSize: "medium",
    packageCategory: "general",
    packageValue: "",
    scheduledPickup: "",
    items: [{ name: "", quantity: 1, weight: 0 }],
  })
  const [quote, setQuote] = useState<DeliveryQuote | null>(null)
  const [loading, setLoading] = useState(false)
  const [quoteLoading, setQuoteLoading] = useState(false)
  const [error, setError] = useState("")

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleItemChange = (index: number, field: string, value: any) => {
    const newItems = [...formData.items]
    newItems[index] = { ...newItems[index], [field]: value }
    setFormData((prev) => ({ ...prev, items: newItems }))
  }

  const addItem = () => {
    setFormData((prev) => ({
      ...prev,
      items: [...prev.items, { name: "", quantity: 1, weight: 0 }],
    }))
  }

  const removeItem = (index: number) => {
    if (formData.items.length > 1) {
      const newItems = formData.items.filter((_, i) => i !== index)
      setFormData((prev) => ({ ...prev, items: newItems }))
    }
  }

  const getQuote = async () => {
    if (!formData.pickupAddress || !formData.dropoffAddress) {
      setError("Please enter both pickup and dropoff addresses")
      return
    }

    setQuoteLoading(true)
    setError("")

    try {
      // In production, use Google Geocoding API to get coordinates
      // For now, use mock coordinates
      const mockPickupCoords = { lat: 37.7749, lng: -122.4194 }
      const mockDropoffCoords = { lat: 37.7849, lng: -122.4094 }

      const response = await authService.makeAuthenticatedRequest(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/deliveries/quote`,
        {
          method: "POST",
          body: JSON.stringify({
            pickupLatitude: mockPickupCoords.lat,
            pickupLongitude: mockPickupCoords.lng,
            dropoffLatitude: mockDropoffCoords.lat,
            dropoffLongitude: mockDropoffCoords.lng,
            packageSize: formData.packageSize,
          }),
        },
      )

      if (!response.ok) {
        throw new Error("Failed to get quote")
      }

      const data = await response.json()
      setQuote(data.quote)
    } catch (err: any) {
      setError(err.message || "Failed to get quote")
    } finally {
      setQuoteLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      if (!quote) {
        throw new Error("Please get a quote first")
      }

      // Mock coordinates (in production, use geocoding)
      const mockPickupCoords = { lat: 37.7749, lng: -122.4194 }
      const mockDropoffCoords = { lat: 37.7849, lng: -122.4094 }

      const response = await authService.makeAuthenticatedRequest(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/deliveries`,
        {
          method: "POST",
          body: JSON.stringify({
            ...formData,
            pickupLatitude: mockPickupCoords.lat,
            pickupLongitude: mockPickupCoords.lng,
            dropoffLatitude: mockDropoffCoords.lat,
            dropoffLongitude: mockDropoffCoords.lng,
            packageValue: Number.parseFloat(formData.packageValue) || 0,
            quoteId: quote.id,
          }),
        },
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to create delivery order")
      }

      const data = await response.json()
      // Navigate to order tracking page
      window.location.href = `/deliveries/${data.order.id}`
    } catch (err: any) {
      setError(err.message || "Failed to create delivery order")
    } finally {
      setLoading(false)
    }
  }

  const minDateTime = new Date().toISOString().slice(0, 16)

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Package className="w-5 h-5" />
            <span>Create Delivery Order</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Pickup Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Pickup Information</h3>

              <div className="space-y-2">
                <Label htmlFor="pickupAddress">Pickup Address</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="pickupAddress"
                    placeholder="Enter pickup address"
                    value={formData.pickupAddress}
                    onChange={(e) => handleInputChange("pickupAddress", e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="pickupContactName">Contact Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="pickupContactName"
                      placeholder="Contact person name"
                      value={formData.pickupContactName}
                      onChange={(e) => handleInputChange("pickupContactName", e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pickupContactPhone">Contact Phone</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="pickupContactPhone"
                      type="tel"
                      placeholder="Contact phone number"
                      value={formData.pickupContactPhone}
                      onChange={(e) => handleInputChange("pickupContactPhone", e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Dropoff Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Dropoff Information</h3>

              <div className="space-y-2">
                <Label htmlFor="dropoffAddress">Dropoff Address</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="dropoffAddress"
                    placeholder="Enter dropoff address"
                    value={formData.dropoffAddress}
                    onChange={(e) => handleInputChange("dropoffAddress", e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dropoffContactName">Contact Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="dropoffContactName"
                      placeholder="Contact person name"
                      value={formData.dropoffContactName}
                      onChange={(e) => handleInputChange("dropoffContactName", e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dropoffContactPhone">Contact Phone</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="dropoffContactPhone"
                      type="tel"
                      placeholder="Contact phone number"
                      value={formData.dropoffContactPhone}
                      onChange={(e) => handleInputChange("dropoffContactPhone", e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Package Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Package Information</h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Package Size</Label>
                  <Select
                    value={formData.packageSize}
                    onValueChange={(value) => handleInputChange("packageSize", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="small">Small (up to 2kg)</SelectItem>
                      <SelectItem value="medium">Medium (2-10kg)</SelectItem>
                      <SelectItem value="large">Large (10-25kg)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select
                    value={formData.packageCategory}
                    onValueChange={(value) => handleInputChange("packageCategory", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">General</SelectItem>
                      <SelectItem value="food">Food</SelectItem>
                      <SelectItem value="documents">Documents</SelectItem>
                      <SelectItem value="electronics">Electronics</SelectItem>
                      <SelectItem value="clothing">Clothing</SelectItem>
                      <SelectItem value="fragile">Fragile Items</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="packageValue">Package Value ($)</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="packageValue"
                      type="number"
                      placeholder="0.00"
                      value={formData.packageValue}
                      onChange={(e) => handleInputChange("packageValue", e.target.value)}
                      className="pl-10"
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="scheduledPickup">Scheduled Pickup (Optional)</Label>
                <div className="relative">
                  <Clock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="scheduledPickup"
                    type="datetime-local"
                    value={formData.scheduledPickup}
                    onChange={(e) => handleInputChange("scheduledPickup", e.target.value)}
                    min={minDateTime}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>

            {/* Get Quote */}
            <div className="flex space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={getQuote}
                disabled={quoteLoading}
                className="flex-1 bg-transparent"
              >
                {quoteLoading ? "Getting Quote..." : "Get Quote"}
              </Button>
            </div>

            {/* Quote Display */}
            {quote && (
              <Card className="bg-muted/50">
                <CardContent className="p-4">
                  <h4 className="font-semibold mb-3">Delivery Quote</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Distance</p>
                      <p className="font-semibold">{quote.distance} km</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Duration</p>
                      <p className="font-semibold">{quote.estimatedDuration} min</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Total Fee</p>
                      <p className="font-semibold text-lg">${quote.totalFee}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Expires</p>
                      <p className="font-semibold text-xs">{new Date(quote.expiresAt).toLocaleTimeString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <Button type="submit" className="w-full" disabled={loading || !quote}>
              {loading ? "Creating Order..." : `Create Delivery Order${quote ? ` - $${quote.totalFee}` : ""}`}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
