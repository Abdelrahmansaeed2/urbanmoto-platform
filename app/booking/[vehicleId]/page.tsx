"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { BookingForm } from "@/components/booking/booking-form"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2 } from "lucide-react"
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

export default function BookingPage() {
  const params = useParams()
  const router = useRouter()
  const [vehicle, setVehicle] = useState<Vehicle | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    fetchVehicle()
  }, [params.vehicleId])

  const fetchVehicle = async () => {
    try {
      const response = await authService.makeAuthenticatedRequest(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/vehicles/${params.vehicleId}`,
      )

      if (!response.ok) {
        throw new Error("Vehicle not found")
      }

      const data = await response.json()
      setVehicle(data.vehicle)
    } catch (err: any) {
      setError(err.message || "Failed to load vehicle")
    } finally {
      setLoading(false)
    }
  }

  const handleBookingComplete = (bookingId: string) => {
    router.push(`/bookings/${bookingId}`)
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin" />
          <span className="ml-2">Loading vehicle details...</span>
        </div>
      </div>
    )
  }

  if (error || !vehicle) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <AlertDescription>{error || "Vehicle not found"}</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Book Vehicle</h1>
        <BookingForm vehicle={vehicle} onBookingComplete={handleBookingComplete} />
      </div>
    </div>
  )
}
