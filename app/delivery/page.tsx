import { DeliveryForm } from "@/components/delivery/delivery-form"

export default function DeliveryPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Send a Package</h1>
        <p className="text-muted-foreground">Fast and reliable delivery service</p>
      </div>
      <DeliveryForm />
    </div>
  )
}
