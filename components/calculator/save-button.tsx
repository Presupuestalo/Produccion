"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Save, Check } from "lucide-react"
import { saveAllProjectData } from "@/lib/services/calculator-service"
import type { Room, GlobalConfig, DemolitionSettings, ElectricalConfig } from "@/types/calculator"

interface SaveButtonProps {
  projectId: string
  rooms: Room[]
  reformRooms: Room[]
  demolitionConfig: GlobalConfig
  reformConfig: GlobalConfig
  demolitionSettings: DemolitionSettings
  electricalConfig: ElectricalConfig
  partitions: any[]
  wallLinings: any[]
  activeTab: "demolition" | "reform"
}

export function SaveButton({
  projectId,
  rooms,
  reformRooms,
  demolitionConfig,
  reformConfig,
  demolitionSettings,
  electricalConfig,
  partitions,
  wallLinings,
  activeTab,
}: SaveButtonProps) {
  const [isSaving, setIsSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const handleSave = async () => {
    if (!projectId) return

    setIsSaving(true)
    setSaved(false)

    try {
      console.log(`[v0] SAVE BUTTON - Guardando todos los datos del proyecto`)
      console.log(`[v0] SAVE BUTTON - Habitaciones demolición: ${rooms.length}`)
      console.log(`[v0] SAVE BUTTON - Habitaciones reforma: ${reformRooms.length}`)
      console.log(`[v0] SAVE BUTTON - Tabiques: ${partitions.length}`)
      console.log(`[v0] SAVE BUTTON - Trasdosados: ${wallLinings.length}`)
      console.log(`[v0] SAVE BUTTON - Configuración demolición:`, demolitionConfig)
      console.log(`[v0] SAVE BUTTON - Configuración reforma:`, reformConfig)
      console.log(`[v0] SAVE BUTTON - Configuración eléctrica:`, electricalConfig)

      const success = await saveAllProjectData(projectId, {
        rooms,
        reformRooms,
        demolitionConfig,
        reformConfig,
        demolitionSettings,
        electricalConfig,
        partitions,
        wallLinings,
      })

      if (success) {
        console.log(`[v0] SAVE BUTTON - Guardado exitoso de todos los datos`)
        setSaved(true)
        setTimeout(() => {
          setSaved(false)
        }, 2000)
      } else {
        console.error(`[v0] SAVE BUTTON - Error al guardar los datos`)
      }
    } catch (error) {
      console.error("Error al guardar:", error)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Button
      onClick={handleSave}
      disabled={isSaving}
      variant={saved ? "outline" : "default"}
      className={saved ? "bg-green-100 text-green-800 border-green-300" : ""}
    >
      {isSaving ? (
        <span className="flex items-center gap-2">
          <span className="animate-spin">🔄</span> Guardando...
        </span>
      ) : saved ? (
        <span className="flex items-center gap-2">
          <Check className="h-4 w-4" /> Guardado
        </span>
      ) : (
        <span className="flex items-center gap-2">
          <Save className="h-4 w-4" /> Guardar
        </span>
      )}
    </Button>
  )
}
