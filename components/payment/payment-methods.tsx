"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { CreditCard, Plus, Trash2, Star } from "lucide-react"
import { stripePromise } from "@/lib/stripe"
import { paymentService, type PaymentMethod } from "@/lib/stripe"

function AddPaymentMethodForm({ onSuccess, onError }: { onSuccess: () => void; onError: (error: string) => void }) {
  const stripe = useStripe()
  const elements = useElements()
  const [loading, setLoading] = useState(false)
  const [setAsDefault, setSetAsDefault] = useState(false)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setLoading(true)

    if (!stripe || !elements) {
      onError("Stripe not loaded")
      setLoading(false)
      return
    }

    try {
      const cardElement = elements.getElement(CardElement)
      if (!cardElement) {
        throw new Error("Card element not found")
      }

      const { error, paymentMethod } = await stripe.createPaymentMethod({
        type: "card",
        card: cardElement,
      })

      if (error) {
        throw new Error(error.message)
      }

      await paymentService.addPaymentMethod(paymentMethod!.id, setAsDefault)
      onSuccess()
    } catch (err: any) {
      onError(err.message || "Failed to add payment method")
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
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="p-3 border rounded-lg">
        <CardElement options={cardElementOptions} />
      </div>

      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="setAsDefault"
          checked={setAsDefault}
          onChange={(e) => setSetAsDefault(e.target.checked)}
          className="rounded"
        />
        <label htmlFor="setAsDefault" className="text-sm">
          Set as default payment method
        </label>
      </div>

      <Button type="submit" className="w-full" disabled={loading || !stripe}>
        {loading ? "Adding..." : "Add Payment Method"}
      </Button>
    </form>
  )
}

function PaymentMethodsContent() {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)

  useEffect(() => {
    loadPaymentMethods()
  }, [])

  const loadPaymentMethods = async () => {
    try {
      setLoading(true)
      const methods = await paymentService.getPaymentMethods()
      setPaymentMethods(methods)
    } catch (err: any) {
      setError(err.message || "Failed to load payment methods")
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteMethod = async (methodId: string) => {
    try {
      await paymentService.deletePaymentMethod(methodId)
      await loadPaymentMethods()
    } catch (err: any) {
      setError(err.message || "Failed to delete payment method")
    }
  }

  const handleAddSuccess = () => {
    setDialogOpen(false)
    loadPaymentMethods()
  }

  const handleAddError = (error: string) => {
    setError(error)
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading payment methods...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <CreditCard className="w-5 h-5" />
            <span>Payment Methods</span>
          </CardTitle>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Add Card
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Payment Method</DialogTitle>
              </DialogHeader>
              <AddPaymentMethodForm onSuccess={handleAddSuccess} onError={handleAddError} />
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {paymentMethods.length === 0 ? (
          <div className="text-center py-8">
            <CreditCard className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No payment methods</h3>
            <p className="text-muted-foreground mb-4">Add a payment method to start booking vehicles</p>
          </div>
        ) : (
          <div className="space-y-3">
            {paymentMethods.map((method) => (
              <div key={method.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <p className="font-medium">•••• •••• •••• {method.lastFour}</p>
                      {method.isDefault && (
                        <Badge variant="secondary" className="flex items-center space-x-1">
                          <Star className="w-3 h-3" />
                          <span>Default</span>
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground capitalize">
                      {method.type} • Added {new Date(method.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteMethod(method.id)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export function PaymentMethods() {
  return (
    <Elements stripe={stripePromise}>
      <PaymentMethodsContent />
    </Elements>
  )
}
