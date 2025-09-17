"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Receipt, ChevronLeft, ChevronRight } from "lucide-react"
import { paymentService } from "@/lib/stripe"

interface Transaction {
  id: string
  amount: number
  transactionType: string
  status: string
  createdAt: string
  make?: string
  model?: string
  year?: number
  startTime?: string
  endTime?: string
}

export function TransactionHistory() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    loadTransactions()
  }, [currentPage])

  const loadTransactions = async () => {
    try {
      setLoading(true)
      const data = await paymentService.getTransactions(currentPage, 10)
      setTransactions(data.transactions)
      setTotalPages(data.totalPages)
    } catch (err: any) {
      setError(err.message || "Failed to load transactions")
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "failed":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getTransactionTypeLabel = (type: string) => {
    switch (type) {
      case "payment":
        return "Payment"
      case "refund":
        return "Refund"
      case "fee":
        return "Fee"
      default:
        return type
    }
  }

  if (loading && transactions.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading transactions...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Receipt className="w-5 h-5" />
          <span>Transaction History</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {transactions.length === 0 ? (
          <div className="text-center py-8">
            <Receipt className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No transactions</h3>
            <p className="text-muted-foreground">Your payment history will appear here</p>
          </div>
        ) : (
          <div className="space-y-4">
            {transactions.map((transaction) => (
              <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Receipt className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium">
                        {transaction.make && transaction.model
                          ? `${transaction.make} ${transaction.model} (${transaction.year})`
                          : getTransactionTypeLabel(transaction.transactionType)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(transaction.createdAt).toLocaleDateString()} at{" "}
                        {new Date(transaction.createdAt).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>

                  {transaction.startTime && transaction.endTime && (
                    <p className="text-sm text-muted-foreground ml-13">
                      {new Date(transaction.startTime).toLocaleDateString()} -{" "}
                      {new Date(transaction.endTime).toLocaleDateString()}
                    </p>
                  )}
                </div>

                <div className="text-right">
                  <p className="font-semibold text-lg">
                    {transaction.transactionType === "refund" ? "+" : "-"}${transaction.amount.toFixed(2)}
                  </p>
                  <Badge className={getStatusColor(transaction.status)} variant="secondary">
                    {transaction.status}
                  </Badge>
                </div>
              </div>
            ))}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="bg-transparent"
                >
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  Previous
                </Button>

                <span className="text-sm text-muted-foreground">
                  Page {currentPage} of {totalPages}
                </span>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="bg-transparent"
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
