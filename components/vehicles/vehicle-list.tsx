"use client"

import { useState, useEffect } from "react"
import { VehicleCard } from "./vehicle-card"
import { VehicleFilters } from "./vehicle-filters"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, MapPin, List, Grid } from "lucide-react"
import { authService } from "@/lib/auth"

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

interface FilterOptions {
  vehicleType: string
  maxPrice: number
  minBattery: number
  radius: number
  sortBy: string
}

export function VehicleList() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [filters, setFilters] = useState<FilterOptions>({
    vehicleType: "",
    maxPrice: 50,
    minBattery: 20,
    radius: 5,
    sortBy: "distance",
  })

  useEffect(() => {
    getCurrentLocation()
  }, [])

  useEffect(() => {
    if (location) {
      fetchVehicles()
    }
  }, [location, filters])

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          })
        },
        (error) => {
          console.error("Location error:", error)
          // Default to a sample location (e.g., San Francisco)
          setLocation({ lat: 37.7749, lng: -122.4194 })
        },
      )
    } else {
      setLocation({ lat: 37.7749, lng: -122.4194 })
    }
  }

  const fetchVehicles = async () => {
    if (!location) return

    setLoading(true)
    setError("")

    try {
      const params = new URLSearchParams({
        latitude: location.lat.toString(),
        longitude: location.lng.toString(),
        radius: filters.radius.toString(),
        minBattery: filters.minBattery.toString(),
      })

      if (filters.vehicleType) {
        params.append("vehicleType", filters.vehicleType)
      }

      if (filters.maxPrice > 0) {
        params.append("maxPrice", filters.maxPrice.toString())
      }

      const response = await authService.makeAuthenticatedRequest(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/vehicles/nearby?${params}`,
      )

      if (!response.ok) {
        throw new Error("Failed to fetch vehicles")
      }

      const data = await response.json()
      const sortedVehicles = data.vehicles

      // Apply sorting
      switch (filters.sortBy) {
        case "price_low":
          sortedVehicles.sort((a: Vehicle, b: Vehicle) => a.hourly_rate - b.hourly_rate)
          break
        case "price_high":
          sortedVehicles.sort((a: Vehicle, b: Vehicle) => b.hourly_rate - a.hourly_rate)
          break
        case "battery":
          sortedVehicles.sort((a: Vehicle, b: Vehicle) => b.battery_level - a.battery_level)
          break
        case "rating":
          sortedVehicles.sort((a: Vehicle, b: Vehicle) => (b.vendor_rating || 0) - (a.vendor_rating || 0))
          break
        default: // distance
          sortedVehicles.sort((a: Vehicle, b: Vehicle) => (a.distance || 0) - (b.distance || 0))
      }

      setVehicles(sortedVehicles)
    } catch (err: any) {
      setError(err.message || "Failed to load vehicles")
    } finally {
      setLoading(false)
    }
  }

  const handleVehicleSelect = (vehicleId: string) => {
    // Navigate to booking page
    window.location.href = `/booking/${vehicleId}`
  }

  const handleViewDetails = (vehicleId: string) => {
    // Navigate to vehicle details page
    window.location.href = `/vehicles/${vehicleId}`
  }

  const handleFiltersChange = (newFilters: FilterOptions) => {
    setFilters(newFilters)
  }

  const handleClearFilters = () => {
    setFilters({
      vehicleType: "",
      maxPrice: 50,
      minBattery: 20,
      radius: 5,
      sortBy: "distance",
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin" />
        <span className="ml-2">Finding vehicles near you...</span>
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Available Vehicles</h2>
          <p className="text-muted-foreground">{vehicles.length} vehicles found near you</p>
        </div>

        <div className="flex items-center space-x-2">
          <Button variant={viewMode === "grid" ? "default" : "outline"} size="sm" onClick={() => setViewMode("grid")}>
            <Grid className="w-4 h-4" />
          </Button>
          <Button variant={viewMode === "list" ? "default" : "outline"} size="sm" onClick={() => setViewMode("list")}>
            <List className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <VehicleFilters
        filters={filters}
        onFiltersChange={handleFiltersChange}
        onClearFilters={handleClearFilters}
        isOpen={filtersOpen}
        onToggle={() => setFiltersOpen(!filtersOpen)}
      />

      {vehicles.length === 0 ? (
        <div className="text-center py-12">
          <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No vehicles found</h3>
          <p className="text-muted-foreground">Try adjusting your filters or expanding your search radius</p>
        </div>
      ) : (
        <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-4"}>
          {vehicles.map((vehicle) => (
            <VehicleCard
              key={vehicle.id}
              vehicle={vehicle}
              onSelect={handleVehicleSelect}
              onViewDetails={handleViewDetails}
            />
          ))}
        </div>
      )}
    </div>
  )
}
