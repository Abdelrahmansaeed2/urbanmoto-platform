"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Star, MapPin, Battery, Clock } from "lucide-react"
import Image from "next/image"

interface Vehicle {
  id: string
  make: string
  model: string
  year: number
  vehicle_type: string
  color: string
  battery_level: number
  range_km: number
  hourly_rate: number
  daily_rate: number
  distance?: number
  primary_image?: string
  vendor_name: string
  vendor_rating: number
}

interface VehicleCardProps {
  vehicle: Vehicle
  onSelect: (vehicleId: string) => void
  onViewDetails: (vehicleId: string) => void
}

export function VehicleCard({ vehicle, onSelect, onViewDetails }: VehicleCardProps) {
  const getBatteryColor = (level: number) => {
    if (level >= 70) return "text-green-600"
    if (level >= 30) return "text-yellow-600"
    return "text-red-600"
  }

  const getVehicleTypeIcon = (type: string) => {
    switch (type) {
      case "electric_scooter":
        return "🛴"
      case "scooter":
        return "🛵"
      case "motorbike":
        return "🏍️"
      default:
        return "🚲"
    }
  }

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-200">
      <div className="relative h-48">
        {vehicle.primary_image ? (
          <Image
            src={vehicle.primary_image || "/placeholder.svg"}
            alt={`${vehicle.make} ${vehicle.model}`}
            fill
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-blue-100 to-orange-100 flex items-center justify-center">
            <span className="text-6xl">{getVehicleTypeIcon(vehicle.vehicle_type)}</span>
          </div>
        )}

        <div className="absolute top-2 left-2">
          <Badge variant="secondary" className="bg-white/90 text-black">
            {vehicle.vehicle_type.replace("_", " ").toUpperCase()}
          </Badge>
        </div>

        <div className="absolute top-2 right-2">
          <Badge variant="secondary" className={`bg-white/90 ${getBatteryColor(vehicle.battery_level)}`}>
            <Battery className="w-3 h-3 mr-1" />
            {vehicle.battery_level}%
          </Badge>
        </div>
      </div>

      <CardContent className="p-4">
        <div className="space-y-3">
          <div>
            <h3 className="font-semibold text-lg">
              {vehicle.make} {vehicle.model}
            </h3>
            <p className="text-sm text-muted-foreground">
              {vehicle.year} • {vehicle.color}
            </p>
          </div>

          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-1">
              <MapPin className="w-4 h-4 text-muted-foreground" />
              <span>{vehicle.distance ? `${vehicle.distance.toFixed(1)} km away` : "Location available"}</span>
            </div>

            <div className="flex items-center space-x-1">
              <Star className="w-4 h-4 text-yellow-500 fill-current" />
              <span>{vehicle.vendor_rating?.toFixed(1) || "New"}</span>
            </div>
          </div>

          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-1">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span>{vehicle.range_km} km range</span>
            </div>

            <div className="text-right">
              <p className="font-semibold">${vehicle.hourly_rate}/hr</p>
              <p className="text-xs text-muted-foreground">${vehicle.daily_rate}/day</p>
            </div>
          </div>

          <div className="text-xs text-muted-foreground">
            <p>Vendor: {vehicle.vendor_name}</p>
          </div>

          <div className="flex space-x-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 bg-transparent"
              onClick={() => onViewDetails(vehicle.id)}
            >
              View Details
            </Button>
            <Button size="sm" className="flex-1 bg-blue-600 hover:bg-blue-700" onClick={() => onSelect(vehicle.id)}>
              Book Now
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
