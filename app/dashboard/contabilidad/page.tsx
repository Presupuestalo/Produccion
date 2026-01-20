"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { createBrowserClient } from "@supabase/ssr"
import { Plus, TrendingUp, TrendingDown, DollarSign, Pencil, Trash2 } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"

type Expense = {
  id: string
  date: string
  concept: string
  amount: number
  category: string
  notes?: string
  project_id?: string
}

type Payment = {
  id: string
  project_id?: string
  amount: number
  payment_date: string
  concept: string
  payment_method?: string
  notes?: string
  project?: {
    name: string
  }
}

type ChartData = {
  name: string
  ingresos: number
  gastos: number
  beneficio: number
}

export default function ContabilidadPage() {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  const [expenses, setExpenses] = useState<Expense[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [isExpenseDialogOpen, setIsExpenseDialogOpen] = useState(false)
  const [isIncomeDialogOpen, setIsIncomeDialogOpen] = useState(false)
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null)
  const [filterPeriod, setFilterPeriod] = useState<"month" | "quarter" | "year">("month")
  const [loading, setLoading] = useState(true)

  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null)
  const [editingPaymentId, setEditingPaymentId] = useState<string | null>(null)

  // Form state for expenses
  const [expenseFormData, setExpenseFormData] = useState({
    date: format(new Date(), "yyyy-MM-dd"),
    concept: "",
    amount: "",
    category: "otros",
    notes: "",
  })

  const [incomeFormData, setIncomeFormData] = useState({
    payment_date: format(new Date(), "yyyy-MM-dd"),
    concept: "",
    amount: "",
    payment_method: "transferencia",
    notes: "",
  })

  useEffect(() => {
    loadData()
  }, [filterPeriod])

  const loadData = async () => {
    setLoading(true)
    try {
      console.log("[v0] Cargando datos de contabilidad...")
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) {
        console.log("[v0] No hay sesión")
        return
      }

      console.log("[v0] Usuario autenticado:", session.user.id)

      // Calcular rango de fechas según el periodo
      const now = new Date()
      let startDate: Date
      let endDate: Date

      switch (filterPeriod) {
        case "month":
          startDate = new Date(now.getFullYear(), now.getMonth(), 1)
          endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0)
          break
        case "quarter":
          startDate = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1)
          endDate = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3 + 3, 0)
          break
        case "year":
          startDate = new Date(now.getFullYear(), 0, 1)
          endDate = new Date(now.getFullYear(), 11, 31)
          break
      }

      console.log("[v0] Rango de fechas:", format(startDate, "yyyy-MM-dd"), "a", format(endDate, "yyyy-MM-dd"))

      // Cargar gastos
      const { data: expensesData, error: expensesError } = await supabase
        .from("expenses")
        .select("*")
        .eq("user_id", session.user.id)
        .gte("date", format(startDate, "yyyy-MM-dd"))
        .lte("date", format(endDate, "yyyy-MM-dd"))
        .order("date", { ascending: false })

      console.log("[v0] Gastos cargados:", expensesData?.length || 0, "error:", expensesError)

      const { data: paymentsData, error: paymentsError } = await supabase
        .from("client_payments")
        .select("*")
        .eq("user_id", session.user.id)
        .gte("payment_date", format(startDate, "yyyy-MM-dd"))
        .lte("payment_date", format(endDate, "yyyy-MM-dd"))
        .order("payment_date", { ascending: false })

      console.log("[v0] Ingresos cargados:", paymentsData?.length || 0, "error:", paymentsError)
      console.log("[v0] Datos de ingresos:", paymentsData)

      setExpenses(expensesData || [])
      setPayments(paymentsData || [])
    } catch (error) {
      console.error("Error al cargar datos:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveExpense = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) return

      const expenseData = {
        ...expenseFormData,
        amount: Number.parseFloat(expenseFormData.amount),
        user_id: session.user.id,
      }

      if (editingExpense) {
        await supabase.from("expenses").update(expenseData).eq("id", editingExpense.id)
      } else {
        await supabase.from("expenses").insert(expenseData)
      }

      setIsExpenseDialogOpen(false)
      resetExpenseForm()
      loadData()
    } catch (error) {
      console.error("Error al guardar gasto:", error)
    }
  }

  const handleSaveIncome = async () => {
    console.log("[v0] Guardando ingreso con datos:", incomeFormData)

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      console.log("[v0] Sesión obtenida:", session ? "Usuario autenticado" : "No hay sesión")

      if (!session) {
        console.error("[v0] No hay sesión activa")
        return
      }

      const incomeData = {
        ...incomeFormData,
        amount: Number.parseFloat(incomeFormData.amount),
        user_id: session.user.id,
        project_id: null, // Permitir ingresos sin proyecto
      }

      console.log("[v0] Datos a guardar:", incomeData)

      if (editingPayment) {
        console.log("[v0] Actualizando ingreso existente ID:", editingPayment.id)
        const { data, error } = await supabase
          .from("client_payments")
          .update(incomeData)
          .eq("id", editingPayment.id)
          .select()

        if (error) {
          console.error("[v0] Error al actualizar:", error)
          throw error
        }
        console.log("[v0] Ingreso actualizado exitosamente:", data)
      } else {
        console.log("[v0] Insertando nuevo ingreso")
        const { data, error } = await supabase.from("client_payments").insert(incomeData).select()

        if (error) {
          console.error("[v0] Error al insertar:", error)
          throw error
        }
        console.log("[v0] Ingreso insertado exitosamente:", data)
      }

      setIsIncomeDialogOpen(false)
      resetIncomeForm()
      await loadData()
      console.log("[v0] Datos recargados exitosamente")
    } catch (error) {
      console.error("[v0] Error al guardar ingreso:", error)
      alert(`Error al guardar ingreso: ${error instanceof Error ? error.message : "Error desconocido"}`)
    }
  }

  const handleDeleteExpense = async (id: string) => {
    if (!confirm("¿Estás seguro de eliminar este gasto?")) return

    try {
      await supabase.from("expenses").delete().eq("id", id)
      loadData()
    } catch (error) {
      console.error("Error al eliminar gasto:", error)
    }
  }

  const handleDeleteIncome = async (id: string) => {
    if (!confirm("¿Estás seguro de eliminar este ingreso?")) return

    try {
      await supabase.from("client_payments").delete().eq("id", id)
      loadData()
    } catch (error) {
      console.error("Error al eliminar ingreso:", error)
    }
  }

  const handleEditExpense = (expense: Expense) => {
    setEditingExpense(expense)
    setExpenseFormData({
      date: expense.date,
      concept: expense.concept,
      amount: expense.amount.toString(),
      category: expense.category,
      notes: expense.notes || "",
    })
    setIsExpenseDialogOpen(true)
  }

  const handleEditIncome = (payment: Payment) => {
    setEditingPayment(payment)
    setIncomeFormData({
      payment_date: payment.payment_date,
      concept: payment.concept,
      amount: payment.amount.toString(),
      payment_method: payment.payment_method || "transferencia",
      notes: payment.notes || "",
    })
    setIsIncomeDialogOpen(true)
  }

  const handleInlineExpenseUpdate = async (id: string, field: keyof Expense, value: any) => {
    try {
      await supabase
        .from("expenses")
        .update({ [field]: value })
        .eq("id", id)
      setExpenses(expenses.map((e) => (e.id === id ? { ...e, [field]: value } : e)))
    } catch (error) {
      console.error("Error al actualizar gasto:", error)
    }
  }

  const handleInlineIncomeUpdate = async (id: string, field: keyof Payment, value: any) => {
    try {
      await supabase
        .from("client_payments")
        .update({ [field]: value })
        .eq("id", id)
      setPayments(payments.map((p) => (p.id === id ? { ...p, [field]: value } : p)))
    } catch (error) {
      console.error("Error al actualizar ingreso:", error)
    }
  }

  const resetExpenseForm = () => {
    setExpenseFormData({
      date: format(new Date(), "yyyy-MM-dd"),
      concept: "",
      amount: "",
      category: "otros",
      notes: "",
    })
    setEditingExpense(null)
  }

  const resetIncomeForm = () => {
    setIncomeFormData({
      payment_date: format(new Date(), "yyyy-MM-dd"),
      concept: "",
      amount: "",
      payment_method: "transferencia",
      notes: "",
    })
    setEditingPayment(null)
  }

  // Calcular métricas
  const totalIngresos = payments.reduce((sum, p) => sum + p.amount, 0)
  const totalGastos = expenses.reduce((sum, e) => sum + e.amount, 0)
  const beneficio = totalIngresos - totalGastos
  const margenBeneficio = totalIngresos > 0 ? ((beneficio / totalIngresos) * 100).toFixed(1) : "0"

  // Preparar datos para gráficos
  const getChartData = (): ChartData[] => {
    const dataMap = new Map<string, ChartData>()

    // Agregar ingresos
    payments.forEach((payment) => {
      const monthKey = format(new Date(payment.payment_date), "MMM yyyy", { locale: es })
      if (!dataMap.has(monthKey)) {
        dataMap.set(monthKey, { name: monthKey, ingresos: 0, gastos: 0, beneficio: 0 })
      }
      const data = dataMap.get(monthKey)!
      data.ingresos += payment.amount
    })

    // Agregar gastos
    expenses.forEach((expense) => {
      const monthKey = format(new Date(expense.date), "MMM yyyy", { locale: es })
      if (!dataMap.has(monthKey)) {
        dataMap.set(monthKey, { name: monthKey, ingresos: 0, gastos: 0, beneficio: 0 })
      }
      const data = dataMap.get(monthKey)!
      data.gastos += expense.amount
    })

    // Calcular beneficio
    dataMap.forEach((data) => {
      data.beneficio = data.ingresos - data.gastos
    })

    return Array.from(dataMap.values())
  }

  const chartData = getChartData()

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      proveedores: "Proveedores",
      compras: "Compras",
      nominas: "Nóminas",
      combustible: "Combustible",
      otros: "Otros",
    }
    return labels[category] || category
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Contabilidad</h1>
          <p className="text-muted-foreground">Gestión financiera de tu empresa</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setIsIncomeDialogOpen(true)} variant="outline">
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Ingreso
          </Button>
          <Button onClick={() => setIsExpenseDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Gasto
          </Button>
        </div>
      </div>

      {/* Métricas principales */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ingresos Totales</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{totalIngresos.toFixed(2)} €</div>
            <p className="text-xs text-muted-foreground">{payments.length} cobros registrados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gastos Totales</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{totalGastos.toFixed(2)} €</div>
            <p className="text-xs text-muted-foreground">{expenses.length} gastos registrados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Beneficio</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${beneficio >= 0 ? "text-blue-600" : "text-red-600"}`}>
              {beneficio.toFixed(2)} €
            </div>
            <p className="text-xs text-muted-foreground">Margen: {margenBeneficio}%</p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Evolución Mensual</CardTitle>
            <CardDescription>Comparativa de ingresos y gastos</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Implementar gráfico de evolución mensual */}
            {/* Placeholder for LineChart */}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Beneficio Mensual</CardTitle>
            <CardDescription>Resultado neto por mes</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Implementar gráfico de beneficio mensual */}
            {/* Placeholder for BarChart */}
          </CardContent>
        </Card>
      </div>

      {/* Diálogo de ingresos */}
      <Dialog open={isIncomeDialogOpen} onOpenChange={setIsIncomeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingPayment ? "Editar Ingreso" : "Nuevo Ingreso"}</DialogTitle>
            <DialogDescription>Registra un nuevo ingreso en tu contabilidad</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="income-date">Fecha</Label>
              <Input
                id="income-date"
                type="date"
                value={incomeFormData.payment_date}
                onChange={(e) => setIncomeFormData({ ...incomeFormData, payment_date: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="income-concept">Concepto</Label>
              <Input
                id="income-concept"
                placeholder="Ej: Pago cliente proyecto X"
                value={incomeFormData.concept}
                onChange={(e) => setIncomeFormData({ ...incomeFormData, concept: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="income-amount">Importe (€)</Label>
              <Input
                id="income-amount"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={incomeFormData.amount}
                onChange={(e) => setIncomeFormData({ ...incomeFormData, amount: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="income-method">Método de pago</Label>
              <Select
                value={incomeFormData.payment_method}
                onValueChange={(value) => setIncomeFormData({ ...incomeFormData, payment_method: value })}
              >
                <SelectTrigger id="income-method">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="transferencia">Transferencia</SelectItem>
                  <SelectItem value="efectivo">Efectivo</SelectItem>
                  <SelectItem value="tarjeta">Tarjeta</SelectItem>
                  <SelectItem value="cheque">Cheque</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="income-notes">Notas (opcional)</Label>
              <Textarea
                id="income-notes"
                placeholder="Añade notas adicionales"
                value={incomeFormData.notes}
                onChange={(e) => setIncomeFormData({ ...incomeFormData, notes: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsIncomeDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveIncome}>Guardar Ingreso</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo de gastos */}
      <Dialog open={isExpenseDialogOpen} onOpenChange={setIsExpenseDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingExpense ? "Editar Gasto" : "Nuevo Gasto"}</DialogTitle>
            <DialogDescription>Registra un nuevo gasto en tu contabilidad</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="expense-date">Fecha</Label>
              <Input
                id="expense-date"
                type="date"
                value={expenseFormData.date}
                onChange={(e) => setExpenseFormData({ ...expenseFormData, date: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="expense-concept">Concepto</Label>
              <Input
                id="expense-concept"
                placeholder="Ej: Compra materiales"
                value={expenseFormData.concept}
                onChange={(e) => setExpenseFormData({ ...expenseFormData, concept: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="expense-amount">Importe (€)</Label>
              <Input
                id="expense-amount"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={expenseFormData.amount}
                onChange={(e) => setExpenseFormData({ ...expenseFormData, amount: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="expense-category">Categoría</Label>
              <Select
                value={expenseFormData.category}
                onValueChange={(value) => setExpenseFormData({ ...expenseFormData, category: value })}
              >
                <SelectTrigger id="expense-category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="proveedores">Proveedores</SelectItem>
                  <SelectItem value="compras">Compras</SelectItem>
                  <SelectItem value="nominas">Nóminas</SelectItem>
                  <SelectItem value="combustible">Combustible</SelectItem>
                  <SelectItem value="otros">Otros</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="expense-notes">Notas (opcional)</Label>
              <Textarea
                id="expense-notes"
                placeholder="Añade notas adicionales"
                value={expenseFormData.notes}
                onChange={(e) => setExpenseFormData({ ...expenseFormData, notes: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsExpenseDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveExpense}>Guardar Gasto</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Tabla de ingresos */}
      <Card>
        <CardHeader>
          <CardTitle>Ingresos</CardTitle>
          <CardDescription>Gestiona tus ingresos - Haz clic en cualquier celda para editar</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Concepto</TableHead>
                    <TableHead>Método</TableHead>
                    <TableHead className="text-right">Importe</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell>
                        {editingPaymentId === payment.id ? (
                          <Input
                            type="date"
                            defaultValue={payment.payment_date}
                            onBlur={(e) => {
                              handleInlineIncomeUpdate(payment.id, "payment_date", e.target.value)
                              setEditingPaymentId(null)
                            }}
                            autoFocus
                          />
                        ) : (
                          <div onClick={() => setEditingPaymentId(payment.id)} className="cursor-pointer">
                            {format(new Date(payment.payment_date), "dd/MM/yyyy")}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {editingPaymentId === payment.id ? (
                          <Input
                            defaultValue={payment.concept}
                            onBlur={(e) => {
                              handleInlineIncomeUpdate(payment.id, "concept", e.target.value)
                              setEditingPaymentId(null)
                            }}
                          />
                        ) : (
                          <div onClick={() => setEditingPaymentId(payment.id)} className="cursor-pointer">
                            {payment.concept}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {editingPaymentId === payment.id ? (
                          <Select
                            defaultValue={payment.payment_method || "transferencia"}
                            onValueChange={(value) => {
                              handleInlineIncomeUpdate(payment.id, "payment_method", value)
                              setEditingPaymentId(null)
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="transferencia">Transferencia</SelectItem>
                              <SelectItem value="efectivo">Efectivo</SelectItem>
                              <SelectItem value="tarjeta">Tarjeta</SelectItem>
                              <SelectItem value="cheque">Cheque</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <div onClick={() => setEditingPaymentId(payment.id)} className="cursor-pointer capitalize">
                            {payment.payment_method || "transferencia"}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {editingPaymentId === payment.id ? (
                          <Input
                            type="number"
                            step="0.01"
                            defaultValue={payment.amount}
                            onBlur={(e) => {
                              handleInlineIncomeUpdate(payment.id, "amount", Number.parseFloat(e.target.value))
                              setEditingPaymentId(null)
                            }}
                            className="text-right"
                          />
                        ) : (
                          <div
                            onClick={() => setEditingPaymentId(payment.id)}
                            className="cursor-pointer font-medium text-green-600"
                          >
                            {payment.amount.toFixed(2)} €
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="icon" onClick={() => handleEditIncome(payment)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteIncome(payment.id)}
                            className="text-orange-500 hover:text-white hover:bg-orange-500"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-green-50 font-semibold">
                    <TableCell colSpan={3}>Total Ingresos</TableCell>
                    <TableCell className="text-right text-green-600 text-lg">{totalIngresos.toFixed(2)} €</TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tabla de gastos */}
      <Card>
        <CardHeader>
          <CardTitle>Gastos</CardTitle>
          <CardDescription>Gestiona tus gastos - Haz clic en cualquier celda para editar</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Concepto</TableHead>
                    <TableHead>Categoría</TableHead>
                    <TableHead className="text-right">Importe</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expenses.map((expense) => (
                    <TableRow key={expense.id}>
                      <TableCell>
                        {editingExpenseId === expense.id ? (
                          <Input
                            type="date"
                            defaultValue={expense.date}
                            onBlur={(e) => {
                              handleInlineExpenseUpdate(expense.id, "date", e.target.value)
                              setEditingExpenseId(null)
                            }}
                            autoFocus
                          />
                        ) : (
                          <div onClick={() => setEditingExpenseId(expense.id)} className="cursor-pointer">
                            {format(new Date(expense.date), "dd/MM/yyyy")}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {editingExpenseId === expense.id ? (
                          <Input
                            defaultValue={expense.concept}
                            onBlur={(e) => {
                              handleInlineExpenseUpdate(expense.id, "concept", e.target.value)
                              setEditingExpenseId(null)
                            }}
                          />
                        ) : (
                          <div onClick={() => setEditingExpenseId(expense.id)} className="cursor-pointer">
                            {expense.concept}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {editingExpenseId === expense.id ? (
                          <Select
                            defaultValue={expense.category}
                            onValueChange={(value) => {
                              handleInlineExpenseUpdate(expense.id, "category", value)
                              setEditingExpenseId(null)
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="proveedores">Proveedores</SelectItem>
                              <SelectItem value="compras">Compras</SelectItem>
                              <SelectItem value="nominas">Nóminas</SelectItem>
                              <SelectItem value="combustible">Combustible</SelectItem>
                              <SelectItem value="otros">Otros</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <div onClick={() => setEditingExpenseId(expense.id)} className="cursor-pointer">
                            {getCategoryLabel(expense.category)}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {editingExpenseId === expense.id ? (
                          <Input
                            type="number"
                            step="0.01"
                            defaultValue={expense.amount}
                            onBlur={(e) => {
                              handleInlineExpenseUpdate(expense.id, "amount", Number.parseFloat(e.target.value))
                              setEditingExpenseId(null)
                            }}
                            className="text-right"
                          />
                        ) : (
                          <div
                            onClick={() => setEditingExpenseId(expense.id)}
                            className="cursor-pointer font-medium text-red-600"
                          >
                            {expense.amount.toFixed(2)} €
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="icon" onClick={() => handleEditExpense(expense)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteExpense(expense.id)}
                            className="text-orange-500 hover:text-white hover:bg-orange-500"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-red-50 font-semibold">
                    <TableCell colSpan={3}>Total Gastos</TableCell>
                    <TableCell className="text-right text-red-600 text-lg">{totalGastos.toFixed(2)} €</TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
