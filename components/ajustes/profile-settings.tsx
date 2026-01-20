"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { Loader2 } from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

interface ProfileSettingsProps {
  userData: {
    id: string
    email?: string
    full_name?: string
    user_type?: string
    bio?: string
    company_name?: string
    website?: string
    phone?: string
    address?: string
    city?: string
    province?: string
    country?: string
    portfolio_public?: boolean
  }
}

export function ProfileSettings({ userData }: ProfileSettingsProps) {
  const [formData, setFormData] = useState({
    full_name: userData.full_name || "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: formData.full_name,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userData.id)

      if (error) throw error

      toast({
        title: "Perfil actualizado",
        description: "Tu información ha sido guardada correctamente",
      })

      router.refresh()
    } catch (error: any) {
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
      <CardHeader>
        <CardTitle>Información del Perfil</CardTitle>
        <CardDescription>Actualiza tu información personal básica</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6" autoComplete="off">
          <div className="space-y-2">
            <Label htmlFor="full_name">Nombre completo *</Label>
            <Input
              id="full_name"
              name="profile_full_name"
              autoComplete="name"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="profile_email"
              type="email"
              autoComplete="email"
              value={userData.email}
              disabled
              className="bg-gray-50"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="user_type">Tipo de cuenta</Label>
            <Input
              id="user_type"
              value={userData.user_type === "professional" ? "Profesional" : "Propietario"}
              disabled
              className="bg-gray-50"
            />
            <p className="text-xs text-muted-foreground">
              El tipo de cuenta no se puede modificar una vez seleccionado
            </p>
          </div>

          <div className="flex justify-end">
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
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
