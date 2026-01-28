"use client"

import { useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

export function GuestPlanRecovery() {
    const { toast } = useToast()
    const router = useRouter()
    const supabase = createClientComponentClient()
    const ranOnce = useRef(false)

    useEffect(() => {
        if (ranOnce.current) return
        ranOnce.current = true

        const checkPendingPlan = async () => {
            const storedPlan = localStorage.getItem("pending_guest_plan")
            if (!storedPlan) return

            try {
                const { data: { session } } = await supabase.auth.getSession()
                if (!session) return

                const { data, image } = JSON.parse(storedPlan)

                console.log("Found pending guest plan, recovering...")

                const response = await fetch("/api/editor-planos/save", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        name: "Plano Recuperado",
                        ...data,
                        projectId: null, // Ensure it creates a new project or handles it appropriately
                        variant: 'proposal'
                    }),
                })

                if (response.ok) {
                    const result = await response.json()
                    localStorage.removeItem("pending_guest_plan")

                    toast({
                        title: "Plano recuperado",
                        description: "Tu trabajo como invitado ha sido guardado correctamente."
                    })

                    // Optionally redirect to the editor immediately
                    router.push(`/dashboard/editor-planos/editar/${result.id}`)
                    router.refresh()
                } else {
                    console.error("Failed to save recovered plan")
                    toast({
                        title: "Error al recuperar",
                        description: "Hubo un problema al guardar tu plano pendiente.",
                        variant: "destructive"
                    })
                }
            } catch (error) {
                console.error("Error recovering guest plan:", error)
            }
        }

        checkPendingPlan()
    }, []) // eslint-disable-line react-hooks/exhaustive-deps

    return null
}
