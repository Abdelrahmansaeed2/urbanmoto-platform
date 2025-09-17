"use client"

import { useParams } from "next/navigation"
import LiveTracking from "@/components/tracking/live-tracking"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function BookingTrackingPage() {
  const params = useParams()
  const bookingId = params.bookingId as string

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/dashboard">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">Track Your Booking</h1>
      </div>

      <LiveTracking bookingId={bookingId} type="booking" />
    </div>
  )
}
