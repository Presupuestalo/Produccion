"use client"

import React, { useState, type ChangeEvent, type FormEvent } from "react"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { formatDecimalInput, parseDecimalInput, sanitizeDecimalInput } from "@/lib/utils/format"
import { SUPPORTED_COUNTRIES } from "@/types/user"
import { getCountryFieldLabels, getProvincesForCountry } from "@/lib/utils/country-fields"
import { useToast } from "@/components/ui/use-toast"

const PROVINCIAS_ESPANA = [
    "Álava", "Albacete", "Alicante", "Almería", "Asturias", "Ávila", "Badajoz", "Barcelona", "Burgos", "Cáceres",
    "Cádiz", "Cantabria", "Castellón", "Ciudad Real", "Córdoba", "Cuenca", "Girona", "Granada", "Guadalajara",
    "Guipúzcoa", "Huelva", "Huesca", "Islas Baleares", "Jaén", "La Coruña", "La Rioja", "Las Palmas", "León",
    "Lérida", "Lugo", "Madrid", "Málaga", "Murcia", "Navarra", "Orense", "Palencia", "Pontevedra", "Salamanca",
    "Santa Cruz de Tenerife", "Segovia", "Sevilla", "Soria", "Tarragona", "Teruel", "Toledo", "Valencia",
    "Valladolid", "Vizcaya", "Zamora", "Zaragoza",
]

const TIPOS_ESTRUCTURA = ["Hormigón", "Ladrillo", "Acero", "Mixta", "Madera", "Piedra", "Otro"]

interface ProjectFormData {
    title: string
    description: string
    client: string
    project_address: string
    street: string
    project_floor: string
    door: string
    city: string
    province: string
    country: string
    country_code: string
    structure_type: string
    ceiling_height: string
    has_elevator: string
    status: string
}

interface SavePlanDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSave: (projectData: ProjectFormData) => void
    isLoading?: boolean
}

export function SavePlanDialog({ open, onOpenChange, onSave, isLoading = false }: SavePlanDialogProps) {
    const [activeTab, setActiveTab] = useState<string>("project")
    const [alturaInput, setAlturaInput] = useState("")
    const { toast } = useToast()

    const [formData, setFormData] = useState<ProjectFormData>({
        title: "",
        description: "",
        client: "",
        project_address: "",
        street: "",
        project_floor: "",
        door: "",
        city: "",
        province: "",
        country: "España",
        country_code: "ES",
        structure_type: "",
        ceiling_height: "",
        has_elevator: "",
        status: "Borrador",
    })

    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { id, value } = e.target
        setFormData((prev) => ({
            ...prev,
            [id]: value,
        }))
    }

    const handleSelectChange = (id: string, value: string) => {
        setFormData((prev) => ({
            ...prev,
            [id]: value,
        }))
    }

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault()

        if (!formData.title.trim()) {
            toast({ title: "Título requerido", description: "Por favor, introduce el título del proyecto", variant: "destructive" })
            setActiveTab("project")
            return
        }

        if (!String(formData.ceiling_height).trim()) {
            toast({ title: "Altura requerida", description: "Por favor, introduce la altura máxima al techo", variant: "destructive" })
            setActiveTab("project")
            return
        }

        if (!formData.structure_type) {
            toast({ title: "Tipo de estructura requerido", description: "Por favor, selecciona el tipo de estructura", variant: "destructive" })
            setActiveTab("project")
            return
        }

        if (!formData.street?.trim() || !formData.city?.trim() || !formData.province?.trim()) {
            toast({ title: "Ubicación requerida", description: "Por favor, completa los campos de ubicación", variant: "destructive" })
            setActiveTab("location")
            return
        }

        if (!formData.has_elevator) {
            toast({ title: "Ascensor requerido", description: "Por favor, indica si tiene ascensor", variant: "destructive" })
            setActiveTab("location")
            return
        }

        // Process data similar to CreateProjectButton
        const processedData = {
            ...formData,
            ceiling_height: parseDecimalInput(String(formData.ceiling_height || "0")).toString()
        }

        onSave(processedData)
    }

    const fieldLabels = getCountryFieldLabels(formData.country_code || "ES")
    const availableProvinces = getProvincesForCountry(formData.country_code || "ES")

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Guardar Plano y Crear Proyecto</DialogTitle>
                        <DialogDescription>
                            Este será tu primer plano ("Estado Actual"). Completa los datos para crear el proyecto que lo contendrá.
                        </DialogDescription>
                    </DialogHeader>

                    <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="project">Proyecto</TabsTrigger>
                            <TabsTrigger value="location">Ubicación</TabsTrigger>
                        </TabsList>

                        <TabsContent value="project" className="space-y-4 pt-4">
                            <div className="grid gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="title">Nombre del proyecto *</Label>
                                    <Input
                                        id="title"
                                        placeholder="Ej: Reforma integral piso centro"
                                        value={formData.title}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>



                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="ceiling_height">Altura techo (m) *</Label>
                                        <Input
                                            id="ceiling_height"
                                            value={alturaInput}
                                            onChange={(e) => {
                                                const sanitized = sanitizeDecimalInput(e.target.value)
                                                setAlturaInput(sanitized)
                                                setFormData((prev) => ({ ...prev, ceiling_height: sanitized }))
                                            }}
                                            onBlur={() => {
                                                const parsed = parseDecimalInput(alturaInput || "0")
                                                const formatted = formatDecimalInput(parsed)
                                                setAlturaInput(formatted)
                                                setFormData((prev) => ({ ...prev, ceiling_height: formatted }))
                                            }}
                                            placeholder="2,60"
                                            required
                                        />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="structure_type">Estructura *</Label>
                                        <Select
                                            value={formData.structure_type}
                                            onValueChange={(value) => handleSelectChange("structure_type", value)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Selecciona tipo" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {TIPOS_ESTRUCTURA.map((tipo) => (
                                                    <SelectItem key={tipo} value={tipo}>{tipo}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="location" className="space-y-4 pt-4">
                            <div className="grid gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="country_code">País *</Label>
                                    <Select
                                        value={formData.country_code}
                                        onValueChange={(value) => {
                                            handleSelectChange("country_code", value)
                                            const countryName = SUPPORTED_COUNTRIES.find((c) => c.code === value)?.name || "España"
                                            handleSelectChange("country", countryName)
                                            handleSelectChange("province", "")
                                        }}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="País" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {SUPPORTED_COUNTRIES.map((country) => (
                                                <SelectItem key={country.code} value={country.code}>{country.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="street">Calle y número *</Label>
                                    <Input id="street" value={formData.street} onChange={handleChange} required />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="city">Ciudad *</Label>
                                        <Input id="city" value={formData.city} onChange={handleChange} required />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="province">{fieldLabels.province} *</Label>
                                        {availableProvinces ? (
                                            <Select value={formData.province} onValueChange={(v) => handleSelectChange("province", v)}>
                                                <SelectTrigger><SelectValue placeholder="Selecciona" /></SelectTrigger>
                                                <SelectContent className="max-h-[200px]">
                                                    {availableProvinces.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                        ) : (
                                            <Input id="province" value={formData.province} onChange={handleChange} required />
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="project_floor">Planta *</Label>
                                        <Input id="project_floor" type="number" value={formData.project_floor} onChange={handleChange} required />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="has_elevator">¿Ascensor? *</Label>
                                        <Select value={formData.has_elevator} onValueChange={(v) => handleSelectChange("has_elevator", v)}>
                                            <SelectTrigger><SelectValue placeholder="Selecciona" /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Sí">Sí</SelectItem>
                                                <SelectItem value="No">No</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </div>
                        </TabsContent>


                    </Tabs>

                    <DialogFooter className="mt-6">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={isLoading} className="bg-orange-600 hover:bg-orange-700">
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Guardar y Crear Proyecto
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
