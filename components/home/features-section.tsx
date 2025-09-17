import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Smartphone, MapPin, CreditCard, Shield, Clock, Users, Zap, Headphones } from "lucide-react"

export function FeaturesSection() {
  const features = [
    {
      icon: Smartphone,
      title: "Smart App Experience",
      description: "Intuitive mobile app with real-time tracking, instant booking, and seamless payments.",
      badge: "iOS & Android",
      color: "blue",
    },
    {
      icon: MapPin,
      title: "GPS Tracking",
      description: "Live location tracking for vehicles and deliveries with accurate ETAs and route optimization.",
      badge: "Real-time",
      color: "green",
    },
    {
      icon: CreditCard,
      title: "Flexible Payments",
      description: "Multiple payment options including cards, digital wallets, and in-app credits.",
      badge: "Secure",
      color: "purple",
    },
    {
      icon: Shield,
      title: "Insurance Coverage",
      description: "Comprehensive insurance protection for all rentals and deliveries with 24/7 support.",
      badge: "Protected",
      color: "orange",
    },
    {
      icon: Clock,
      title: "24/7 Availability",
      description: "Round-the-clock service with vehicles and delivery options available anytime.",
      badge: "Always Open",
      color: "indigo",
    },
    {
      icon: Users,
      title: "Community Driven",
      description: "Built by riders, for riders. Join thousands of satisfied customers in your city.",
      badge: "50K+ Users",
      color: "pink",
    },
    {
      icon: Zap,
      title: "Instant Unlock",
      description: "Scan QR code to instantly unlock vehicles. No waiting, no paperwork, just ride.",
      badge: "Quick Start",
      color: "yellow",
    },
    {
      icon: Headphones,
      title: "24/7 Support",
      description: "Dedicated customer support team available around the clock for any assistance.",
      badge: "Always Here",
      color: "teal",
    },
  ]

  const getColorClasses = (color: string) => {
    const colors = {
      blue: "bg-blue-100 text-blue-600 border-blue-200",
      green: "bg-green-100 text-green-600 border-green-200",
      purple: "bg-purple-100 text-purple-600 border-purple-200",
      orange: "bg-orange-100 text-orange-600 border-orange-200",
      indigo: "bg-indigo-100 text-indigo-600 border-indigo-200",
      pink: "bg-pink-100 text-pink-600 border-pink-200",
      yellow: "bg-yellow-100 text-yellow-600 border-yellow-200",
      teal: "bg-teal-100 text-teal-600 border-teal-200",
    }
    return colors[color as keyof typeof colors] || colors.blue
  }

  const getBadgeClasses = (color: string) => {
    const colors = {
      blue: "bg-blue-100 text-blue-800",
      green: "bg-green-100 text-green-800",
      purple: "bg-purple-100 text-purple-800",
      orange: "bg-orange-100 text-orange-800",
      indigo: "bg-indigo-100 text-indigo-800",
      pink: "bg-pink-100 text-pink-800",
      yellow: "bg-yellow-100 text-yellow-800",
      teal: "bg-teal-100 text-teal-800",
    }
    return colors[color as keyof typeof colors] || colors.blue
  }

  return (
    <section className="py-16 lg:py-24 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <Badge className="bg-blue-100 text-blue-800 mb-4" variant="secondary">
            Why Choose UrbanMoto
          </Badge>
          <h2 className="text-3xl lg:text-4xl font-bold mb-4 text-balance">
            Everything you need for{" "}
            <span className="bg-gradient-to-r from-blue-600 to-orange-500 bg-clip-text text-transparent">
              urban mobility
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto text-pretty">
            From instant vehicle access to reliable delivery services, we've built the complete platform for modern
            urban transportation.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <Card
              key={index}
              className="relative overflow-hidden border-2 hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
            >
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between mb-3">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center ${getColorClasses(feature.color)}`}
                  >
                    <feature.icon className="w-6 h-6" />
                  </div>
                  <Badge className={getBadgeClasses(feature.color)} variant="secondary">
                    {feature.badge}
                  </Badge>
                </div>
                <CardTitle className="text-lg">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
              </CardContent>

              {/* Decorative Element */}
              <div
                className={`absolute -bottom-2 -right-2 w-16 h-16 rounded-full opacity-10 ${getColorClasses(feature.color)}`}
              ></div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
