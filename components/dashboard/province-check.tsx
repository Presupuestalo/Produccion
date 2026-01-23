"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { MapPin, AlertCircle, Loader2 } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PROVINCES_BY_COUNTRY } from "@/lib/utils/country-fields"
import { useToast } from "@/components/ui/use-toast"

export function ProvinceCheck() {
    const [isOpen, setIsOpen] = useState(false)
    const [userType, setUserType] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [selectedProvince, setSelectedProvince] = useState<string>("")
    const [userId, setUserId] = useState<string | null>(null)

    const router = useRouter()
    const pathname = usePathname()
    const { toast } = useToast()

    const provinces = PROVINCES_BY_COUNTRY["ES"] || []

    useEffect(() => {
        const checkProvince = async () => {
            // Don't check if we are already on the settings page
            if (pathname === "/dashboard/empresa") {
                setIsLoading(false)
                return
            }

            const supabase = await createClient()
            if (!supabase) {
                console.warn("[v0] Supabase client not available in ProvinceCheck")
                setIsLoading(false)
                return
            }

            const {
                data: { session },
            } = await supabase.auth.getSession()

            if (!session?.user) {
                setIsLoading(false)
                return
            }

            setUserId(session.user.id)

            // Check profile for user type
            const { data: profile } = await supabase
                .from("profiles")
                .select("user_type, country")
                .eq("id", session.user.id)
                .single()

            const effectiveUserType = profile?.user_type || session.user.user_metadata?.user_type
            setUserType(effectiveUserType)

            const isProfessional =
                effectiveUserType === "professional" ||
                effectiveUserType === "profesional" ||
                effectiveUserType === "company"

            // Solo aplicar para España (ES)
            const isSpain = profile?.country === "ES" || profile?.country === "España"

            if (isProfessional && isSpain) {
                // Check if province is set in company settings
                const { data: companySettings } = await supabase
                    .from("user_company_settings")
                    .select("company_province")
                    .eq("user_id", session.user.id)
                    .maybeSingle()

                if (!companySettings?.company_province) {
                    setIsOpen(true)
                }
            }
            setIsLoading(false)
        }

        checkProvince()
    }, [pathname])

    const handleSave = async () => {
        if (!selectedProvince || !userId) {
            console.error("[v0] Missing required data for save:", { selectedProvince, userId })
            toast({
                title: "Error",
                description: "Faltan datos para guardar. Por favor, asegúrate de haber seleccionado una provincia.",
                variant: "destructive",
            })
            return
        }

        setIsSaving(true)
        try {
            const supabase = await createClient()
            if (!supabase) throw new Error("Supabase client not available")

            console.log("[v0] Attempting to save province:", { userId, selectedProvince })

            // Simplificar el upsert: dejar que la DB maneje updated_at y detectar PK automáticamente
            const { error, data, status, statusText } = await supabase.from("user_company_settings").upsert(
                {
                    user_id: userId,
                    company_province: selectedProvince,
                },
                {
                    // Al ser user_id la PK, detecta el conflicto automáticamente
                    // Pero podemos ser explícitos si hay problemas
                    onConflict: 'user_id'
                }
            ).select()

            if (error) {
                console.error("[v0] Supabase error object:", error)
                console.error("[v0] Supabase error string:", String(error))
                throw new Error(error.message || "Error al guardar en ajustes de empresa")
            }

            // Sync with profiles table for notification consistency
            const { error: profileSyncError } = await supabase
                .from("profiles")
                .update({
                    address_province: selectedProvince,
                    service_provinces: [selectedProvince], // Initial area of action
                    country: "España" // Consistent with the hardcoded "ES" check in this component
                })
                .eq("id", userId)

            if (profileSyncError) {
                console.error("[v0] Error syncing with profile in ProvinceCheck:", profileSyncError)
                // We don't throw here to avoid blocking the user if company settings saved but profile didn't
            }

            console.log("[v0] Province saved and synced successfully")

            toast({
                title: "Provincia guardada",
                description: "Se ha actualizado la provincia de tu empresa y tu perfil correctamente.",
            })

            // Pequeño delay para que el toast sea legible
            setTimeout(() => {
                setIsOpen(false)
                router.refresh()
                // Forzar recarga si refresh no es suficiente
                if (window.location.pathname !== "/dashboard") {
                    // Quizás no sea necesario recargar todo, pero ayuda a limpiar el estado
                }
            }, 1000)

        } catch (error: any) {
            console.error("[v0] Final catch error:", error)
            toast({
                title: "Error al guardar",
                description: error.message || "No se pudo guardar la provincia directamente. Por favor, utiliza el botón 'Configuración completa'.",
                variant: "destructive",
            })
        } finally {
            setIsSaving(false)
        }
    }

    if (isLoading || !isOpen) return null

    return (
        <Dialog open={isOpen} onOpenChange={() => { }}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <div className="flex items-center gap-2 text-orange-600 mb-2">
                        <AlertCircle className="h-6 w-6" />
                        <DialogTitle className="text-xl">Provincia Requerida</DialogTitle>
                    </div>
                    <DialogDescription className="text-base">
                        Es <strong>obligatorio</strong> indicar la provincia de tu empresa para recibir notificaciones de nuevas solicitudes.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-6 flex flex-col items-center justify-center gap-6">
                    <div className="bg-orange-100 p-4 rounded-full">
                        <MapPin className="h-10 w-10 text-orange-600" />
                    </div>

                    <div className="w-full space-y-2">
                        <label className="text-sm font-medium">Selecciona tu provincia</label>
                        <Select value={selectedProvince} onValueChange={setSelectedProvince}>
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Seleccionar provincia..." />
                            </SelectTrigger>
                            <SelectContent className="max-h-[300px]">
                                {provinces.map((province) => (
                                    <SelectItem key={province} value={province}>
                                        {province}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <p className="text-xs text-muted-foreground text-center">
                        Si operas en toda España, selecciona la provincia donde se encuentra tu sede fiscal principal.
                    </p>
                </div>

                <DialogFooter className="flex flex-col gap-2 sm:flex-col">
                    <Button
                        onClick={handleSave}
                        disabled={!selectedProvince || isSaving}
                        className="w-full bg-orange-600 hover:bg-orange-700"
                    >
                        {isSaving ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Guardando...
                            </>
                        ) : (
                            "Guardar y Continuar"
                        )}
                    </Button>
                    <Button
                        variant="ghost"
                        onClick={() => router.push("/dashboard/empresa")}
                        className="w-full text-muted-foreground text-xs"
                    >
                        Configuración completa
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
