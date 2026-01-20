"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { History, TrendingUp, TrendingDown, ArrowRightLeft, Coins, ShoppingCart } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"

interface Transaction {
  id: string
  type: string
  amount: number
  description: string
  created_at: string
  payment_amount?: number
  lead_request_id?: string
}

export function CreditPurchaseHistory() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/credits/transactions")
      .then((res) => res.json())
      .then((data) => {
        setTransactions(data.transactions || [])
        setLoading(false)
      })
      .catch((err) => {
        console.error("Error loading transactions:", err)
        setLoading(false)
      })
  }, [])

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "purchase":
        return <ShoppingCart className="h-4 w-4 text-green-600" />
      case "spend":
      case "lead_access":
        return <TrendingDown className="h-4 w-4 text-red-500" />
      case "refund":
        return <TrendingUp className="h-4 w-4 text-blue-500" />
      default:
        return <ArrowRightLeft className="h-4 w-4 text-gray-500" />
    }
  }

  const getTransactionBadge = (type: string) => {
    switch (type) {
      case "purchase":
        return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Compra</Badge>
      case "spend":
      case "lead_access":
        return <Badge className="bg-red-100 text-red-700 hover:bg-red-100">Uso</Badge>
      case "refund":
        return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">Devolución</Badge>
      default:
        return <Badge variant="secondary">{type}</Badge>
    }
  }

  const formatAmount = (amount: number, type: string) => {
    const isPositive = type === "purchase" || type === "refund"
    return (
      <span className={isPositive ? "text-green-600 font-semibold" : "text-red-500 font-semibold"}>
        {isPositive ? "+" : "-"}
        {Math.abs(amount).toLocaleString()} cr.
      </span>
    )
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Historial de Créditos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-20" />
            </div>
          ))}
        </CardContent>
      </Card>
    )
  }

  // Calcular totales
  const totalPurchased = transactions.filter((t) => t.type === "purchase").reduce((sum, t) => sum + t.amount, 0)

  const totalSpent = transactions
    .filter((t) => t.type === "spend" || t.type === "lead_access")
    .reduce((sum, t) => sum + Math.abs(t.amount), 0)

  const totalRefunded = transactions.filter((t) => t.type === "refund").reduce((sum, t) => sum + t.amount, 0)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          Historial de Créditos
        </CardTitle>
        <CardDescription>Tus compras y movimientos de créditos</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Resumen */}
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <p className="text-xs text-green-600 mb-1">Comprados</p>
            <p className="text-lg font-bold text-green-700">{totalPurchased.toLocaleString()}</p>
          </div>
          <div className="text-center p-3 bg-red-50 rounded-lg">
            <p className="text-xs text-red-600 mb-1">Usados</p>
            <p className="text-lg font-bold text-red-700">{totalSpent.toLocaleString()}</p>
          </div>
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <p className="text-xs text-blue-600 mb-1">Devueltos</p>
            <p className="text-lg font-bold text-blue-700">{totalRefunded.toLocaleString()}</p>
          </div>
        </div>

        {/* Lista de transacciones */}
        {transactions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Coins className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>No hay movimientos de créditos todavía</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {transactions.slice(0, 20).map((tx) => (
              <div
                key={tx.id}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {getTransactionIcon(tx.type)}
                  <div>
                    <p className="text-sm font-medium line-clamp-1">{tx.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(tx.created_at), "d MMM yyyy, HH:mm", { locale: es })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {formatAmount(tx.amount, tx.type)}
                  {getTransactionBadge(tx.type)}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
