"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { Loader2 } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { supabase } from "@/lib/supabase"

interface ProfileFormProps {
  userData: {
    id: string
    email?: string
    full_name?: string
    avatar_url?: string
    country?: string
    currency?: string
    tax_rate?: number
    updated_at?: string
  }
}

export function ProfileForm({ userData }: ProfileFormProps) {
  // Añadir estados para moneda e IVA
  const [fullName, setFullName] = useState(userData.full_name || "")
  const [country, setCountry] = useState(userData.country || "")
  const [currency, setCurrency] = useState(userData.currency || "")
  const [taxRate, setTaxRate] = useState(userData.tax_rate || 0)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  // Función para obtener las iniciales del nombre
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Actualizar los metadatos del usuario
      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          name: fullName,
          country: country,
        },
      })

      if (updateError) throw updateError

      // Verificar si existe la tabla profiles
      const { error: tableCheckError } = await supabase.from("profiles").select("id").limit(1)

      // Si la tabla existe, actualizar el perfil
      if (!tableCheckError) {
        const { error: profileError } = await supabase.from("profiles").upsert({
          id: userData.id,
          full_name: fullName,
          country: country,
          currency: currency,
          tax_rate: taxRate,
          updated_at: new Date().toISOString(),
        })

        if (profileError) throw profileError
      }

      toast({
        title: "Perfil actualizado",
        description: "Tu información de perfil ha sido actualizada correctamente",
      })

      router.refresh()
    } catch (error: any) {
      console.error("Error al actualizar perfil:", error)
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar el perfil",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <form onSubmit={handleSubmit}>
        <CardHeader>
          <CardTitle>Información Personal</CardTitle>
          <CardDescription>Actualiza tu información de perfil</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col items-center space-y-4">
            <Avatar className="h-24 w-24">
              <AvatarImage src={userData.avatar_url || ""} alt={fullName} />
              <AvatarFallback className="text-lg bg-orange-100 text-orange-700">
                {getInitials(fullName || "Usuario")}
              </AvatarFallback>
            </Avatar>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Correo electrónico</Label>
              <Input id="email" value={userData.email || ""} disabled className="bg-gray-50" />
              <p className="text-xs text-muted-foreground">
                El correo electrónico no se puede cambiar y se usa para iniciar sesión
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fullName">Nombre completo</Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Tu nombre completo"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="country">País (Zona Horaria)</Label>
              <Select value={country} onValueChange={setCountry}>
                <SelectTrigger id="country">
                  <SelectValue placeholder="Selecciona tu país" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  <SelectItem value="AR">Argentina (GMT-3)</SelectItem>
                  <SelectItem value="AU">Australia (GMT+8 a GMT+11)</SelectItem>
                  <SelectItem value="BO">Bolivia (GMT-4)</SelectItem>
                  <SelectItem value="BR">Brasil (GMT-3)</SelectItem>
                  <SelectItem value="CA">Canadá (GMT-3:30 a GMT-8)</SelectItem>
                  <SelectItem value="CL">Chile (GMT-4/GMT-3)</SelectItem>
                  <SelectItem value="CN">China (GMT+8)</SelectItem>
                  <SelectItem value="CO">Colombia (GMT-5)</SelectItem>
                  <SelectItem value="CR">Costa Rica (GMT-6)</SelectItem>
                  <SelectItem value="CU">Cuba (GMT-5/GMT-4)</SelectItem>
                  <SelectItem value="DO">República Dominicana (GMT-4)</SelectItem>
                  <SelectItem value="EC">Ecuador (GMT-5)</SelectItem>
                  <SelectItem value="EG">Egipto (GMT+2)</SelectItem>
                  <SelectItem value="SV">El Salvador (GMT-6)</SelectItem>
                  <SelectItem value="AE">Emiratos Árabes Unidos (GMT+4)</SelectItem>
                  <SelectItem value="ES">España (GMT+1/GMT+2)</SelectItem>
                  <SelectItem value="US">Estados Unidos (GMT-4 a GMT-10)</SelectItem>
                  <SelectItem value="PH">Filipinas (GMT+8)</SelectItem>
                  <SelectItem value="FR">Francia (GMT+1/GMT+2)</SelectItem>
                  <SelectItem value="GT">Guatemala (GMT-6)</SelectItem>
                  <SelectItem value="GQ">Guinea Ecuatorial (GMT+1)</SelectItem>
                  <SelectItem value="HN">Honduras (GMT-6)</SelectItem>
                  <SelectItem value="IN">India (GMT+5:30)</SelectItem>
                  <SelectItem value="ID">Indonesia (GMT+7 a GMT+9)</SelectItem>
                  <SelectItem value="JP">Japón (GMT+9)</SelectItem>
                  <SelectItem value="MX">México (GMT-5 a GMT-7)</SelectItem>
                  <SelectItem value="NI">Nicaragua (GMT-6)</SelectItem>
                  <SelectItem value="NZ">Nueva Zelanda (GMT+12/GMT+13)</SelectItem>
                  <SelectItem value="PA">Panamá (GMT-5)</SelectItem>
                  <SelectItem value="PY">Paraguay (GMT-4/GMT-3)</SelectItem>
                  <SelectItem value="PE">Perú (GMT-5)</SelectItem>
                  <SelectItem value="PT">Portugal (GMT+0/GMT+1)</SelectItem>
                  <SelectItem value="GB">Reino Unido (GMT+0/GMT+1)</SelectItem>
                  <SelectItem value="RU">Rusia (GMT+2 a GMT+12)</SelectItem>
                  <SelectItem value="SG">Singapur (GMT+8)</SelectItem>
                  <SelectItem value="ZA">Sudáfrica (GMT+2)</SelectItem>
                  <SelectItem value="UY">Uruguay (GMT-3)</SelectItem>
                  <SelectItem value="VE">Venezuela (GMT-4)</SelectItem>
                  <SelectItem value="OTHER">Otro</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Selecciona tu país para determinar la zona horaria correcta
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency">Moneda</Label>
              <Input
                id="currency"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                placeholder="Tu moneda"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="taxRate">Tasa de Impuesto</Label>
              <Input
                id="taxRate"
                value={taxRate.toString()}
                onChange={(e) => setTaxRate(Number.parseFloat(e.target.value))}
                placeholder="Tu tasa de impuesto"
                type="number"
              />
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end space-x-2">
          <Button variant="outline" type="button" onClick={() => router.back()}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : (
              "Guardar cambios"
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
