"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { X, Filter } from "lucide-react"

interface FilterOptions {
  vehicleType: string
  maxPrice: number
  minBattery: number
  radius: number
  sortBy: string
}

interface VehicleFiltersProps {
  filters: FilterOptions
  onFiltersChange: (filters: FilterOptions) => void
  onClearFilters: () => void
  isOpen: boolean
  onToggle: () => void
}

export function VehicleFilters({ filters, onFiltersChange, onClearFilters, isOpen, onToggle }: VehicleFiltersProps) {
  const [localFilters, setLocalFilters] = useState(filters)

  const handleFilterChange = (key: keyof FilterOptions, value: any) => {
    const newFilters = { ...localFilters, [key]: value }
    setLocalFilters(newFilters)
    onFiltersChange(newFilters)
  }

  const activeFiltersCount = Object.values(filters).filter(
    (value) => value !== "" && value !== 0 && value !== 5 && value !== 20 && value !== "distance",
  ).length

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={onToggle} className="flex items-center space-x-2 bg-transparent">
          <Filter className="w-4 h-4" />
          <span>Filters</span>
          {activeFiltersCount > 0 && (
            <Badge variant="secondary" className="ml-2">
              {activeFiltersCount}
            </Badge>
          )}
        </Button>

        {activeFiltersCount > 0 && (
          <Button variant="ghost" size="sm" onClick={onClearFilters}>
            <X className="w-4 h-4 mr-1" />
            Clear All
          </Button>
        )}
      </div>

      {isOpen && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Filter Vehicles</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Vehicle Type</Label>
              <Select
                value={localFilters.vehicleType}
                onValueChange={(value) => handleFilterChange("vehicleType", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All types</SelectItem>
                  <SelectItem value="electric_scooter">Electric Scooter</SelectItem>
                  <SelectItem value="scooter">Scooter</SelectItem>
                  <SelectItem value="motorbike">Motorbike</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Maximum Price (per hour)</Label>
              <div className="px-2">
                <Slider
                  value={[localFilters.maxPrice]}
                  onValueChange={(value) => handleFilterChange("maxPrice", value[0])}
                  max={100}
                  min={5}
                  step={5}
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-muted-foreground mt-1">
                  <span>$5</span>
                  <span className="font-medium">${localFilters.maxPrice}/hr</span>
                  <span>$100</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Minimum Battery Level</Label>
              <div className="px-2">
                <Slider
                  value={[localFilters.minBattery]}
                  onValueChange={(value) => handleFilterChange("minBattery", value[0])}
                  max={100}
                  min={10}
                  step={10}
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-muted-foreground mt-1">
                  <span>10%</span>
                  <span className="font-medium">{localFilters.minBattery}%</span>
                  <span>100%</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Search Radius</Label>
              <div className="px-2">
                <Slider
                  value={[localFilters.radius]}
                  onValueChange={(value) => handleFilterChange("radius", value[0])}
                  max={25}
                  min={1}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-muted-foreground mt-1">
                  <span>1 km</span>
                  <span className="font-medium">{localFilters.radius} km</span>
                  <span>25 km</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Sort By</Label>
              <Select value={localFilters.sortBy} onValueChange={(value) => handleFilterChange("sortBy", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="distance">Distance</SelectItem>
                  <SelectItem value="price_low">Price: Low to High</SelectItem>
                  <SelectItem value="price_high">Price: High to Low</SelectItem>
                  <SelectItem value="battery">Battery Level</SelectItem>
                  <SelectItem value="rating">Rating</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
