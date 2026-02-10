"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { isMasterUser } from "@/lib/services/auth-service"
import { createClient } from "@/lib/supabase/client"
import { MASTER_EMAILS, checkFeature } from "@/lib/feature-flags"
import * as SubscriptionLimitsService from "@/lib/services/subscription-limits-service"

export default function AIDebugPage() {
    const [debugInfo, setDebugInfo] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function loadDebugInfo() {
            try {
                const supabase = await createClient()

                if (!supabase) {
                    setDebugInfo({ error: "Failed to initialize Supabase client" })
                    setLoading(false)
                    return
                }

                // Get user
                const { data: { user } } = await supabase.auth.getUser()

                // Get profile
                const { data: profile } = await supabase
                    .from("profiles")
                    .select("id, email, role, user_type, subscription_plan")
                    .eq("id", user?.id || "")
                    .single()

                // Get subscription limits
                const limits = await SubscriptionLimitsService.getSubscriptionLimits()

                // Check master status
                const masterStatus = await isMasterUser()

                // Check feature flags
                const aiGenerationFlag = checkFeature("AI_GENERATION", user?.email)

                setDebugInfo({
                    user: {
                        id: user?.id,
                        email: user?.email,
                    },
                    profile,
                    checks: {
                        isMasterUser: masterStatus,
                        isMasterEmail: MASTER_EMAILS.includes(user?.email || ""),
                        hasAIFeatureFlag: aiGenerationFlag,
                        roleInDB: profile?.role,
                        aiLimits: limits?.aiPriceImport,
                    },
                    shouldHaveAccess: masterStatus || aiGenerationFlag || limits?.aiPriceImport,
                })
            } catch (error) {
                console.error("Error loading debug info:", error)
                setDebugInfo({ error: String(error) })
            } finally {
                setLoading(false)
            }
        }

        loadDebugInfo()
    }, [])

    if (loading) {
        return <div className="p-8">Cargando información de depuración...</div>
    }

    return (
        <div className="container mx-auto p-8 space-y-6">
            <h1 className="text-3xl font-bold">🔍 Diagnóstico de Herramientas IA</h1>

            <Card>
                <CardHeader>
                    <CardTitle>Usuario Actual</CardTitle>
                    <CardDescription>Información del usuario autenticado</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                    <div className="flex items-center gap-2">
                        <span className="font-medium">ID:</span>
                        <code className="text-sm bg-muted px-2 py-1 rounded">{debugInfo?.user?.id}</code>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="font-medium">Email:</span>
                        <code className="text-sm bg-muted px-2 py-1 rounded">{debugInfo?.user?.email}</code>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Perfil en Base de Datos</CardTitle>
                    <CardDescription>Datos del perfil del usuario</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                    <div className="flex items-center gap-2">
                        <span className="font-medium">Rol:</span>
                        <Badge variant={debugInfo?.profile?.role === "master" ? "default" : "secondary"}>
                            {debugInfo?.profile?.role || "NO CONFIGURADO"}
                        </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="font-medium">Tipo:</span>
                        <Badge variant="outline">{debugInfo?.profile?.user_type || "N/A"}</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="font-medium">Plan:</span>
                        <Badge variant="outline">{debugInfo?.profile?.subscription_plan || "N/A"}</Badge>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Verificaciones de Acceso a IA</CardTitle>
                    <CardDescription>Estado de las diferentes comprobaciones</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                        <span>isMasterUser() - Función principal</span>
                        <Badge variant={debugInfo?.checks?.isMasterUser ? "default" : "destructive"}>
                            {debugInfo?.checks?.isMasterUser ? "✅ TRUE" : "❌ FALSE"}
                        </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                        <span>Email en lista MASTER_EMAILS</span>
                        <Badge variant={debugInfo?.checks?.isMasterEmail ? "default" : "secondary"}>
                            {debugInfo?.checks?.isMasterEmail ? "✅ SÍ" : "❌ NO"}
                        </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                        <span>AI_GENERATION feature flag</span>
                        <Badge variant={debugInfo?.checks?.hasAIFeatureFlag ? "default" : "secondary"}>
                            {debugInfo?.checks?.hasAIFeatureFlag ? "✅ HABILITADO" : "❌ DESHABILITADO"}
                        </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                        <span>Rol en base de datos</span>
                        <Badge variant={debugInfo?.checks?.roleInDB === "master" ? "default" : "secondary"}>
                            {debugInfo?.checks?.roleInDB || "NO CONFIGURADO"}
                        </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                        <span>Límites de suscripción (aiPriceImport)</span>
                        <Badge variant={debugInfo?.checks?.aiLimits ? "default" : "secondary"}>
                            {debugInfo?.checks?.aiLimits ? "✅ PERMITIDO" : "❌ BLOQUEADO"}
                        </Badge>
                    </div>
                </CardContent>
            </Card>

            <Card className={debugInfo?.shouldHaveAccess ? "border-green-500" : "border-red-500"}>
                <CardHeader>
                    <CardTitle className={debugInfo?.shouldHaveAccess ? "text-green-600" : "text-red-600"}>
                        {debugInfo?.shouldHaveAccess ? "✅ DIAGNÓSTICO: DEBERÍAS TENER ACCESO" : "❌ DIAGNÓSTICO: NO TIENES ACCESO"}
                    </CardTitle>
                    <CardDescription>
                        {debugInfo?.shouldHaveAccess
                            ? "Todas las verificaciones indican que deberías poder usar herramientas de IA"
                            : "Alguna verificación está fallando y bloqueando el acceso a IA"}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {!debugInfo?.shouldHaveAccess && (
                        <div className="bg-red-50 dark:bg-red-950/20 p-4 rounded-lg">
                            <p className="text-sm text-red-800 dark:text-red-200 font-medium mb-2">
                                Posibles soluciones:
                            </p>
                            <ul className="list-disc list-inside text-sm text-red-700 dark:text-red-300 space-y-1">
                                <li>Cierra sesión y vuelve a iniciar sesión</li>
                                <li>Limpia la caché del navegador (Ctrl+Shift+Del)</li>
                                <li>Verifica que el servidor está reiniciado</li>
                                <li>Ejecuta el script fix-master-role.sql en Supabase</li>
                            </ul>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Datos Completos (Debug)</CardTitle>
                </CardHeader>
                <CardContent>
                    <pre className="text-xs bg-muted p-4 rounded overflow-auto max-h-96">
                        {JSON.stringify(debugInfo, null, 2)}
                    </pre>
                </CardContent>
            </Card>
        </div>
    )
}
