import { Card, CardContent } from "@/components/ui/card"
import { TrendingUp, Users, MapPin, Package } from "lucide-react"

export function StatsSection() {
  const stats = [
    {
      icon: Users,
      value: "50,000+",
      label: "Active Users",
      description: "Riders and drivers across the platform",
      color: "blue",
    },
    {
      icon: MapPin,
      value: "25",
      label: "Cities",
      description: "Available in major metropolitan areas",
      color: "green",
    },
    {
      icon: TrendingUp,
      value: "1M+",
      label: "Trips Completed",
      description: "Successful rides and deliveries",
      color: "orange",
    },
    {
      icon: Package,
      value: "500K+",
      label: "Packages Delivered",
      description: "Safe and timely deliveries",
      color: "purple",
    },
  ]

  const getColorClasses = (color: string) => {
    const colors = {
      blue: "from-blue-500 to-blue-600",
      green: "from-green-500 to-green-600",
      orange: "from-orange-500 to-orange-600",
      purple: "from-purple-500 to-purple-600",
    }
    return colors[color as keyof typeof colors] || colors.blue
  }

  return (
    <section className="py-16 lg:py-24 bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl lg:text-4xl font-bold mb-4 text-balance">
            Trusted by thousands of{" "}
            <span className="bg-gradient-to-r from-blue-600 to-orange-500 bg-clip-text text-transparent">
              urban commuters
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto text-pretty">
            Join the growing community of riders, drivers, and businesses who rely on UrbanMoto for their daily
            transportation needs.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <Card key={index} className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div
                    className={`w-12 h-12 rounded-xl bg-gradient-to-br ${getColorClasses(stat.color)} flex items-center justify-center`}
                  >
                    <stat.icon className="w-6 h-6 text-white" />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="text-3xl font-bold text-gray-900">{stat.value}</div>
                  <div className="text-lg font-semibold text-gray-700">{stat.label}</div>
                  <div className="text-sm text-muted-foreground">{stat.description}</div>
                </div>

                {/* Background Decoration */}
                <div
                  className={`absolute -top-4 -right-4 w-24 h-24 bg-gradient-to-br ${getColorClasses(stat.color)} rounded-full opacity-5`}
                ></div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Additional Info */}
        <div className="text-center mt-12">
          <div className="inline-flex items-center space-x-2 bg-white rounded-full px-6 py-3 shadow-md">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-gray-700">Growing every day</span>
          </div>
        </div>
      </div>
    </section>
  )
}
