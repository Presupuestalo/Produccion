"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Copy, Share2, Users, Gift, CheckCircle, Clock, AlertCircle, Check } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

interface ReferralStats {
  code: string | null
  maxUses: number
  usesCount: number
  remainingUses: number
  totalReferrals: number
  pendingReferrals: number
  phoneVerifiedReferrals: number
  convertedReferrals: number
  rewardedReferrals: number
  totalCreditsEarned: number
  referrals: {
    id: string
    referredName: string
    referredEmail: string
    status: string
    plan: string | null
    createdAt: string
    rewardedAt: string | null
  }[]
}

export function ReferralDashboard() {
  const [stats, setStats] = useState<ReferralStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [copiedCode, setCopiedCode] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)
  const router = useRouter()

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/referrals/stats")
      if (response.status === 401) {
        router.push("/dashboard/planes")
        return
      }
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error("Error fetching referral stats:", error)
    } finally {
      setLoading(false)
    }
  }

  const generateCode = async () => {
    setGenerating(true)
    try {
      const response = await fetch("/api/referrals/get-code")
      if (response.ok) {
        const data = await response.json()
        setStats((prev) => (prev ? { ...prev, code: data.code } : null))
        toast.success("Código de referido generado")
        fetchStats()
      }
    } catch (error) {
      toast.error("Error al generar código")
    } finally {
      setGenerating(false)
    }
  }

  const copyCode = () => {
    if (stats?.code) {
      navigator.clipboard.writeText(stats.code)
      setCopiedCode(true)
      toast.success("Código copiado al portapapeles")
      setTimeout(() => setCopiedCode(false), 2000)
    }
  }

  const copyLink = () => {
    if (stats?.code) {
      const link = `${window.location.origin}/auth/register?ref=${stats.code}`
      navigator.clipboard.writeText(link)
      setCopiedLink(true)
      toast.success("Enlace copiado al portapapeles")
      setTimeout(() => setCopiedLink(false), 2000)
    }
  }

  const shareWhatsApp = () => {
    if (stats?.code) {
      const link = `${window.location.origin}/auth/register?ref=${stats.code}`
      const message = `¡Únete a Presupuéstalo y obtén 100-150 créditos gratis! Usa mi código de referido: ${stats.code} o regístrate aquí: ${link}`
      window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank")
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
            <Clock className="w-3 h-3 mr-1" />
            Pendiente
          </Badge>
        )
      case "phone_verified":
        return (
          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Teléfono verificado
          </Badge>
        )
      case "converted":
        return (
          <Badge variant="secondary" className="bg-purple-100 text-purple-800">
            <Gift className="w-3 h-3 mr-1" />
            Convertido
          </Badge>
        )
      case "rewarded":
        return (
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Recompensado
          </Badge>
        )
      case "expired":
        return (
          <Badge variant="secondary" className="bg-gray-100 text-gray-800">
            <AlertCircle className="w-3 h-3 mr-1" />
            Expirado
          </Badge>
        )
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Código de referido */}
      <Card className="border-orange-200 bg-gradient-to-br from-orange-50 to-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5 text-orange-500" />
            Tu código de referido
          </CardTitle>
          <CardDescription>Comparte tu código y gana créditos cuando tus referidos contraten un plan</CardDescription>
        </CardHeader>
        <CardContent>
          {stats?.code ? (
            <div className="space-y-4">
              <div className="flex gap-2">
                <Input
                  value={stats.code}
                  readOnly
                  className="font-mono text-lg font-bold text-center bg-white border-2 border-orange-200"
                />
                <Button
                  variant="outline"
                  onClick={copyCode}
                  className={`transition-all duration-300 ${copiedCode ? "bg-green-100 border-green-300" : "hover:bg-orange-100"}`}
                >
                  {copiedCode ? (
                    <Check className="h-4 w-4 text-green-600 animate-pulse" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={copyLink}
                  variant="outline"
                  className={`flex-1 transition-all duration-300 ${copiedLink ? "bg-green-100 border-green-300 text-green-700" : "bg-orange-50 border-orange-200 hover:bg-orange-100"}`}
                >
                  {copiedLink ? (
                    <>
                      <Check className="h-4 w-4 mr-2 text-green-600" />
                      Enlace copiado
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-2" />
                      Copiar enlace
                    </>
                  )}
                </Button>
                <Button
                  onClick={shareWhatsApp}
                  className="flex-1 bg-green-500 hover:bg-green-600 transition-all duration-200 hover:shadow-lg hover:scale-105 active:scale-95"
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  Compartir WhatsApp
                </Button>
              </div>

              <p className="text-sm text-muted-foreground text-center font-medium">
                Usos restantes: <span className="text-orange-600">{stats.remainingUses}</span> de {stats.maxUses}
              </p>
            </div>
          ) : (
            <Button
              onClick={generateCode}
              disabled={generating}
              className="w-full bg-orange-500 hover:bg-orange-600 transition-all duration-200 hover:shadow-lg"
            >
              {generating ? "Generando..." : "Generar código de referido"}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Recompensas */}
      <Card className="border-green-200 bg-gradient-to-br from-green-50 to-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5 text-green-600" />
            Recompensas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-center">
            <div className="bg-gradient-to-br from-orange-100 to-orange-50 p-4 rounded-lg border border-orange-200 hover:shadow-md transition-shadow">
              <p className="text-3xl font-bold text-orange-600">{stats?.totalCreditsEarned || 0}</p>
              <p className="text-sm text-muted-foreground mt-1">Créditos ganados</p>
            </div>
            <div className="bg-gradient-to-br from-green-100 to-green-50 p-4 rounded-lg border border-green-200 hover:shadow-md transition-shadow">
              <p className="text-3xl font-bold text-green-600">{stats?.rewardedReferrals || 0}</p>
              <p className="text-sm text-muted-foreground mt-1">Referidos completados</p>
            </div>
          </div>

          <div className="mt-4 p-4 bg-white border-2 border-orange-100 rounded-lg">
            <p className="text-sm font-medium mb-2 text-orange-900">Recompensas por plan:</p>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>
                • Plan Basic: <span className="font-semibold text-orange-600">100 créditos</span> para ti y tu referido
              </li>
              <li>
                • Plan Pro: <span className="font-semibold text-orange-600">150 créditos</span> para ti y tu referido
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Lista de referidos */}
      <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-600" />
            Tus referidos ({stats?.totalReferrals || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {stats?.referrals && stats.referrals.length > 0 ? (
            <div className="space-y-3">
              {stats.referrals.map((referral) => (
                <div
                  key={referral.id}
                  className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 hover:border-orange-200 hover:shadow-md transition-all duration-200"
                >
                  <div>
                    <p className="font-medium text-gray-900">{referral.referredName}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(referral.createdAt).toLocaleDateString("es-ES")}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {referral.plan && (
                      <Badge variant="outline" className="bg-blue-50 border-blue-200">
                        {referral.plan}
                      </Badge>
                    )}
                    {getStatusBadge(referral.status)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">Aún no tienes referidos</p>
              <p className="text-sm mt-1">Comparte tu código para empezar a ganar créditos</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
