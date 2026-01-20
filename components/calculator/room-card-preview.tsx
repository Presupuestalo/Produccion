// Este archivo es solo para mostrar cómo se vería el componente con los cambios
// No es necesario incluirlo en el proyecto final

import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Lock } from "lucide-react"
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip"

export function RoomCardPreview() {
  return (
    <div className="border p-4 rounded-md">
      <h3 className="text-lg font-medium mb-4">Vista previa de la sección de bajar techo</h3>
      <TooltipProvider>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Checkbox id="lowerCeiling" checked={true} disabled={true} />
              <Label htmlFor="lowerCeiling" className="text-sm cursor-pointer">
                Bajar techo
              </Label>
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <Lock className="h-4 w-4 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent>
                <p>Bloqueado por "Bajar todos los techos"</p>
              </TooltipContent>
            </Tooltip>
          </div>

          <div className="space-y-1">
            <Label htmlFor="ceilingHeight" className="text-sm">
              Nueva altura (m)
            </Label>
            <Input id="ceilingHeight" type="text" value="2,20" placeholder="2,20" className="h-8 text-sm" />
          </div>
        </div>
      </TooltipProvider>

      <div className="mt-4 text-sm text-muted-foreground">
        <p>Cuando "Bajar todos los techos" está activado en la configuración global:</p>
        <ul className="list-disc pl-5 mt-2">
          <li>El checkbox "Bajar techo" estará activado y deshabilitado</li>
          <li>Se mostrará un campo para especificar la nueva altura del techo</li>
          <li>Por defecto, la altura será 30cm menos que la altura estándar</li>
        </ul>
      </div>
    </div>
  )
}
