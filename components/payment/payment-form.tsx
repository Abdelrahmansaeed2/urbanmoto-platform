"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { CreditCard, Lock, Plus } from "lucide-react"
import { stripePromise } from "@/lib/stripe"
import { paymentService, type PaymentMethod } from "@/lib/stripe"

interface PaymentFormProps {
  bookingId: string
  amount: number
  onPaymentSuccess: () => void
  onPaymentError: (error: string) => void
}

function PaymentFormContent({ bookingId, amount, onPaymentSuccess, onPaymentError }: PaymentFormProps) {
  const stripe = useStripe()
  const elements = useElements()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [selectedMethod, setSelectedMethod] = useState<string>("")
  const [useNewCard, setUseNewCard] = useState(false)
  const [saveCard, setSaveCard] = useState(false)

  useEffect(() => {
    loadPaymentMethods()
  }, [])

  const loadPaymentMethods = async () => {
    try {
      const methods = await paymentService.getPaymentMethods()
      setPaymentMethods(methods)
      if (methods.length > 0) {
        const defaultMethod = methods.find((m) => m.isDefault) || methods[0]
        setSelectedMethod(defaultMethod.id)
      } else {
        setUseNewCard(true)
      }
    } catch (err: any) {
      console.error("Failed to load payment methods:", err)
    }
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setLoading(true)
    setError("")

    if (!stripe || !elements) {
      setError("Stripe not loaded")
      setLoading(false)
      return
    }

    try {
      let paymentMethodId = selectedMethod

      if (useNewCard) {
        const cardElement = elements.getElement(CardElement)
        if (!cardElement) {
          throw new Error("Card element not found")
        }

        // Create payment method
        const { error: methodError, paymentMethod } = await stripe.createPaymentMethod({
          type: "card",
          card: cardElement,
        })

        if (methodError) {
          throw new Error(methodError.message)
        }

        paymentMethodId = paymentMethod!.id
      }

      // Create payment intent
      const paymentIntent = await paymentService.createPaymentIntent(bookingId, paymentMethodId, saveCard)

      if (paymentIntent.status === "requires_action") {
        // Handle 3D Secure or other authentication
        const { error: confirmError } = await stripe.confirmCardPayment(paymentIntent.clientSecret)

        if (confirmError) {
          throw new Error(confirmError.message)
        }
      }

      // Confirm payment on backend
      const result = await paymentService.confirmPayment(paymentIntent.id)

      if (result.success) {
        onPaymentSuccess()
      } else {
        throw new Error(result.message)
      }
    } catch (err: any) {
      setError(err.message || "Payment failed")
      onPaymentError(err.message || "Payment failed")
    } finally {
      setLoading(false)
    }
  }

  const cardElementOptions = {
    style: {
      base: {
        fontSize: "16px",
        color: "#424770",
        "::placeholder": {
          color: "#aab7c4",
        },
      },
    },
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <CreditCard className="w-5 h-5" />
          <span>Payment Information</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Payment Amount */}
          <div className="bg-muted/50 p-4 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold">Total Amount:</span>
              <span className="text-2xl font-bold">${amount.toFixed(2)}</span>
            </div>
          </div>

          {/* Existing Payment Methods */}
          {paymentMethods.length > 0 && !useNewCard && (
            <div className="space-y-3">
              <h4 className="font-medium">Select Payment Method</h4>
              {paymentMethods.map((method) => (
                <div
                  key={method.id}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedMethod === method.id ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:bg-gray-50"
                  }`}
                  onClick={() => setSelectedMethod(method.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center">
                        <CreditCard className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-medium">•••• •••• •••• {method.lastFour}</p>
                        <p className="text-sm text-muted-foreground capitalize">{method.type}</p>
                      </div>
                    </div>
                    {method.isDefault && <Badge variant="secondary">Default</Badge>}
                  </div>
                </div>
              ))}

              <Button
                type="button"
                variant="outline"
                onClick={() => setUseNewCard(true)}
                className="w-full bg-transparent"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add New Card
              </Button>
            </div>
          )}

          {/* New Card Form */}
          {useNewCard && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Add New Card</h4>
                {paymentMethods.length > 0 && (
                  <Button type="button" variant="ghost" size="sm" onClick={() => setUseNewCard(false)}>
                    Use Existing Card
                  </Button>
                )}
              </div>

              <div className="p-3 border rounded-lg">
                <CardElement options={cardElementOptions} />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox id="saveCard" checked={saveCard} onCheckedChange={setSaveCard} />
                <label htmlFor="saveCard" className="text-sm">
                  Save this card for future payments
                </label>
              </div>
            </div>
          )}

          {/* Security Notice */}
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <Lock className="w-4 h-4" />
            <span>Your payment information is secure and encrypted</span>
          </div>

          <Button type="submit" className="w-full" disabled={loading || !stripe}>
            {loading ? "Processing Payment..." : `Pay $${amount.toFixed(2)}`}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

export function PaymentForm(props: PaymentFormProps) {
  return (
    <Elements stripe={stripePromise}>
      <PaymentFormContent {...props} />
    </Elements>
  )
}
