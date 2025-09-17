import { PaymentMethods } from "@/components/payment/payment-methods"
import { TransactionHistory } from "@/components/payment/transaction-history"

export default function PaymentPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Payment & Billing</h1>
          <p className="text-muted-foreground">Manage your payment methods and view transaction history</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <PaymentMethods />
          <TransactionHistory />
        </div>
      </div>
    </div>
  )
}
