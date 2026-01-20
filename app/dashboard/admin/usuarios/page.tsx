'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { Badge } from '@/components/ui/badge'

interface User {
  id: string
  email: string
  user_type: string
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  created_at: string
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  console.log('[v0 ADMIN PAGE] Componente montado')

  useEffect(() => {
    console.log('[v0 ADMIN PAGE] useEffect ejecutándose...')
    loadUsers()
  }, [])

  const loadUsers = async () => {
    try {
      console.log('[v0 ADMIN PAGE] Cargando usuarios desde API...')
      const res = await fetch('/api/admin/users/list')
      console.log('[v0 ADMIN PAGE] Respuesta de API:', res.status, res.statusText)
      
      if (!res.ok) {
        const errorText = await res.text()
        console.error('[v0 ADMIN PAGE] Error en respuesta:', errorText)
        throw new Error('Error al cargar usuarios')
      }
      
      const data = await res.json()
      console.log('[v0 ADMIN PAGE] Usuarios cargados:', data.length, 'usuarios')
      console.log('[v0 ADMIN PAGE] Datos:', data)
      setUsers(data)
    } catch (error) {
      console.error('[v0 ADMIN PAGE] Error al cargar usuarios:', error)
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los usuarios',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const updateUserPlan = async (userId: string, plan: string) => {
    try {
      const res = await fetch('/api/admin/users/update-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, plan })
      })

      if (!res.ok) throw new Error('Error al actualizar plan')

      toast({
        title: 'Plan actualizado',
        description: `Usuario cambiado a plan ${plan}`
      })

      loadUsers()
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo actualizar el plan',
        variant: 'destructive'
      })
    }
  }

  const getPlanFromUser = (user: User): string => {
    if (!user.stripe_customer_id) return 'free'
    if (user.stripe_subscription_id?.includes('basic')) return 'basic'
    if (user.stripe_subscription_id?.includes('pro')) return 'pro'
    if (user.stripe_subscription_id?.includes('empresa')) return 'empresa'
    return 'free'
  }

  if (loading) {
    return <div className="p-8">Cargando usuarios...</div>
  }

  console.log('[v0 ADMIN PAGE] Renderizando página con', users.length, 'usuarios')

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Gestión de Usuarios</CardTitle>
          <CardDescription>
            Administra los planes de suscripción de los usuarios
          </CardDescription>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No se encontraron usuarios en el sistema</p>
              <Button 
                variant="outline" 
                onClick={loadUsers}
                className="mt-4"
              >
                Recargar
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {users.map((user) => {
                const currentPlan = getPlanFromUser(user)
                return (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex-1">
                      <p className="font-medium">{user.email}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {user.user_type || 'Sin tipo'}
                        </Badge>
                        <Badge
                          variant={currentPlan === 'free' ? 'secondary' : 'default'}
                          className="text-xs"
                        >
                          {currentPlan}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Select
                        value={currentPlan}
                        onValueChange={(plan) => updateUserPlan(user.id, plan)}
                      >
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Seleccionar plan" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="free">Free</SelectItem>
                          <SelectItem value="basic">Basic</SelectItem>
                          <SelectItem value="pro">Pro</SelectItem>
                          <SelectItem value="empresa">Empresa</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
