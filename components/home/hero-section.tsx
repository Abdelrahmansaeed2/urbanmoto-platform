"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin, Search, Zap, Shield, Clock, Star } from "lucide-react"
import Link from "next/link"

export function HeroSection() {
  const [searchLocation, setSearchLocation] = useState("")

  const handleSearch = () => {
    if (searchLocation.trim()) {
      window.location.href = `/vehicles?location=${encodeURIComponent(searchLocation)}`
    }
  }

  const features = [
    {
      icon: Zap,
      title: "Instant Access",
      description: "Find and unlock vehicles in seconds",
    },
    {
      icon: Shield,
      title: "Fully Insured",
      description: "Comprehensive coverage for peace of mind",
    },
    {
      icon: Clock,
      title: "24/7 Available",
      description: "Rent anytime, anywhere in the city",
    },
    {
      icon: Star,
      title: "Top Rated",
      description: "4.8/5 stars from thousands of users",
    },
  ]

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-orange-50">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>

      <div className="container mx-auto px-4 py-16 lg:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="space-y-8">
            <div className="space-y-4">
              <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200" variant="secondary">
                🚀 Now available in 50+ cities
              </Badge>

              <h1 className="text-4xl lg:text-6xl font-bold leading-tight text-balance">
                Urban mobility{" "}
                <span className="bg-gradient-to-r from-blue-600 to-orange-500 bg-clip-text text-transparent">
                  reimagined
                </span>
              </h1>

              <p className="text-xl text-muted-foreground text-pretty">
                Rent scooters and motorbikes instantly, or send packages across the city with our reliable delivery
                network. Your journey starts here.
              </p>
            </div>

            {/* Search Bar */}
            <Card className="p-2 shadow-lg border-2 border-blue-100">
              <div className="flex items-center space-x-2">
                <div className="flex-1 flex items-center space-x-2">
                  <MapPin className="w-5 h-5 text-muted-foreground ml-2" />
                  <Input
                    placeholder="Enter your location..."
                    value={searchLocation}
                    onChange={(e) => setSearchLocation(e.target.value)}
                    className="border-0 focus-visible:ring-0 text-lg"
                    onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                  />
                </div>
                <Button onClick={handleSearch} size="lg" className="bg-blue-600 hover:bg-blue-700">
                  <Search className="w-5 h-5 mr-2" />
                  Find Vehicles
                </Button>
              </div>
            </Card>

            {/* Quick Actions */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700" asChild>
                <Link href="/vehicles">
                  <span className="text-lg">🏍️</span>
                  <span className="ml-2">Rent a Vehicle</span>
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="flex-1 border-2 border-orange-200 hover:bg-orange-50 bg-transparent"
                asChild
              >
                <Link href="/delivery">
                  <span className="text-lg">📦</span>
                  <span className="ml-2">Send a Package</span>
                </Link>
              </Button>
            </div>

            {/* Features Grid */}
            <div className="grid grid-cols-2 gap-4 pt-4">
              {features.map((feature, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <feature.icon className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">{feature.title}</h3>
                    <p className="text-xs text-muted-foreground">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Content - Hero Image/Illustration */}
          <div className="relative">
            <div className="relative z-10">
              {/* Main Hero Card */}
              <Card className="overflow-hidden shadow-2xl border-0 bg-gradient-to-br from-white to-blue-50">
                <CardContent className="p-0">
                  <div className="aspect-[4/3] bg-gradient-to-br from-blue-100 to-orange-100 flex items-center justify-center relative overflow-hidden">
                    {/* Background Pattern */}
                    <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>

                    {/* Vehicle Illustrations */}
                    <div className="relative z-10 text-center space-y-4">
                      <div className="text-8xl">🏍️</div>
                      <div className="flex justify-center space-x-4 text-4xl">
                        <span>🛵</span>
                        <span>🛴</span>
                        <span>📦</span>
                      </div>
                    </div>

                    {/* Floating Elements */}
                    <div className="absolute top-4 left-4">
                      <Badge className="bg-green-100 text-green-800" variant="secondary">
                        Available Now
                      </Badge>
                    </div>
                    <div className="absolute bottom-4 right-4">
                      <Badge className="bg-orange-100 text-orange-800" variant="secondary">
                        Fast Delivery
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Floating Stats Cards */}
              <Card className="absolute -bottom-4 -left-4 bg-white shadow-lg border-2 border-blue-100">
                <CardContent className="p-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">50K+</div>
                    <div className="text-xs text-muted-foreground">Happy Users</div>
                  </div>
                </CardContent>
              </Card>

              <Card className="absolute -top-4 -right-4 bg-white shadow-lg border-2 border-orange-100">
                <CardContent className="p-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">1M+</div>
                    <div className="text-xs text-muted-foreground">Trips Completed</div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Background Decorations */}
            <div className="absolute -top-8 -right-8 w-32 h-32 bg-blue-200 rounded-full opacity-20 blur-xl"></div>
            <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-orange-200 rounded-full opacity-20 blur-xl"></div>
          </div>
        </div>
      </div>
    </section>
  )
}
