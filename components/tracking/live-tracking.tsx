"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin, Phone, Clock, Navigation } from "lucide-react"

interface TrackingData {
  tracking: any[]
  currentLocation: any
}

interface LiveTrackingProps {
  bookingId?: string
  deliveryId?: string
  type: "booking" | "delivery"
}

export default function LiveTracking({ bookingId, deliveryId, type }: LiveTrackingProps) {
  const [trackingData, setTrackingData] = useState<TrackingData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (bookingId || deliveryId) {
      fetchTrackingData()
      // Set up polling for real-time updates
      const interval = setInterval(fetchTrackingData, 30000) // Update every 30 seconds
      return () => clearInterval(interval)
    }
  }, [bookingId, deliveryId])

  const fetchTrackingData = async () => {
    try {
      const token = localStorage.getItem("token")
      const endpoint =
        type === "booking" ? `/api/tracking/booking/${bookingId}` : `/api/tracking/delivery/${deliveryId}`

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${endpoint}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setTrackingData(data)
      }
    } catch (error) {
      console.error("Error fetching tracking data:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!trackingData) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-gray-500">No tracking information available</p>
        </CardContent>
      </Card>
    )
  }

  const { currentLocation, tracking } = trackingData

  const getStatusColor = (status: string) => {
    switch (status) {
      case "picked_up":
        return "bg-blue-100 text-blue-800"
      case "in_transit":
        return "bg-yellow-100 text-yellow-800"
      case "delivered":
        return "bg-green-100 text-green-800"
      case "completed":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="space-y-6">
      {/* Current Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Navigation className="h-5 w-5" />
            Live Tracking
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">Current Status</h3>
                <Badge className={getStatusColor(currentLocation.status)}>
                  {currentLocation.status.replace("_", " ").toUpperCase()}
                </Badge>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Last Updated</p>
                <p className="font-medium">{new Date(currentLocation.created_at).toLocaleTimeString()}</p>
              </div>
            </div>

            {currentLocation.driver_name && (
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h4 className="font-medium">Driver</h4>
                  <p className="text-sm text-gray-600">{currentLocation.driver_name}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  <span className="text-sm">{currentLocation.driver_phone}</span>
                </div>
              </div>
            )}

            {currentLocation.notes && (
              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-900">Update</h4>
                <p className="text-sm text-blue-800">{currentLocation.notes}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tracking History */}
      <Card>
        <CardHeader>
          <CardTitle>Tracking History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {tracking.map((update, index) => (
              <div key={update.id} className="flex items-start gap-4">
                <div className="flex flex-col items-center">
                  <div className={`w-3 h-3 rounded-full ${index === 0 ? "bg-blue-600" : "bg-gray-300"}`}></div>
                  {index < tracking.length - 1 && <div className="w-px h-8 bg-gray-200 mt-2"></div>}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <Badge className={getStatusColor(update.status)}>
                      {update.status.replace("_", " ").toUpperCase()}
                    </Badge>
                    <div className="flex items-center gap-1 text-sm text-gray-500">
                      <Clock className="h-4 w-4" />
                      {new Date(update.created_at).toLocaleString()}
                    </div>
                  </div>
                  {update.notes && <p className="text-sm text-gray-600 mt-1">{update.notes}</p>}
                  {update.latitude && update.longitude && (
                    <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                      <MapPin className="h-4 w-4" />
                      Location: {update.latitude.toFixed(6)}, {update.longitude.toFixed(6)}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
