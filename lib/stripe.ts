import { loadStripe } from "@stripe/stripe-js"

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

export { stripePromise }

export interface PaymentMethod {
  id: string
  type: string
  provider: string
  lastFour: string
  isDefault: boolean
  createdAt: string
}

export interface PaymentIntent {
  id: string
  clientSecret: string
  status: string
}

export class PaymentService {
  private baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"

  async createPaymentIntent(
    bookingId: string,
    paymentMethodId?: string,
    savePaymentMethod = false,
  ): Promise<PaymentIntent> {
    const response = await fetch(`${this.baseUrl}/payments/intent`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("urbanmoto_token")}`,
      },
      body: JSON.stringify({
        bookingId,
        paymentMethodId,
        savePaymentMethod,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || "Failed to create payment intent")
    }

    const data = await response.json()
    return data.paymentIntent
  }

  async confirmPayment(paymentIntentId: string): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${this.baseUrl}/payments/confirm`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("urbanmoto_token")}`,
      },
      body: JSON.stringify({ paymentIntentId }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || "Failed to confirm payment")
    }

    return await response.json()
  }

  async getPaymentMethods(): Promise<PaymentMethod[]> {
    const response = await fetch(`${this.baseUrl}/payments/methods`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("urbanmoto_token")}`,
      },
    })

    if (!response.ok) {
      throw new Error("Failed to get payment methods")
    }

    const data = await response.json()
    return data.paymentMethods
  }

  async addPaymentMethod(paymentMethodId: string, setAsDefault = false): Promise<PaymentMethod> {
    const response = await fetch(`${this.baseUrl}/payments/methods`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("urbanmoto_token")}`,
      },
      body: JSON.stringify({
        paymentMethodId,
        setAsDefault,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || "Failed to add payment method")
    }

    const data = await response.json()
    return data.paymentMethod
  }

  async deletePaymentMethod(methodId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/payments/methods/${methodId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("urbanmoto_token")}`,
      },
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || "Failed to delete payment method")
    }
  }

  async getTransactions(page = 1, limit = 20) {
    const response = await fetch(`${this.baseUrl}/payments/transactions?page=${page}&limit=${limit}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("urbanmoto_token")}`,
      },
    })

    if (!response.ok) {
      throw new Error("Failed to get transactions")
    }

    return await response.json()
  }
}

export const paymentService = new PaymentService()
