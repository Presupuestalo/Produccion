import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, TrendingUp, Users, DollarSign } from "lucide-react"

interface StatsCardProps {
  title: string
  value: string | number
  description?: string
  iconType?: "file" | "trend" | "user" | "dollar"
  color?: string
}

export function StatsCard({ title, value, description, iconType = "file", color = "bg-blue-500" }: StatsCardProps) {
  // Función para determinar qué ícono mostrar
  const getIcon = () => {
    switch (iconType) {
      case "file":
        return <FileText className="h-4 w-4 text-white" />
      case "trend":
        return <TrendingUp className="h-4 w-4 text-white" />
      case "user":
        return <Users className="h-4 w-4 text-white" />
      case "dollar":
        return <DollarSign className="h-4 w-4 text-white" />
      default:
        return <FileText className="h-4 w-4 text-white" />
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className={`${color} p-2 rounded-full`}>{getIcon()}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </CardContent>
    </Card>
  )
}
