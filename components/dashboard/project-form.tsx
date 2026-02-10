"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { AlertCircle } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createProject, updateProject } from "@/lib/services/project-service"
import type { Project, ProjectFormData } from "@/types/project"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { saveProjectDemolitionSettings, getProjectDemolitionSettings } from "@/lib/services/demolition-service"
import { saveDemolitionSettings as saveDemolitionSettingsToCalculator } from "@/lib/services/calculator-service"
import type { DemolitionSettings } from "@/types/calculator"
import { getCalculatorConfig, saveCalculatorConfig } from "@/lib/services/calculator-config-service"
import { Button } from "@/components/ui/button"
import { Save, Check, Loader2 } from "lucide-react"
import { DemolitionSettings as DemolitionSettingsComponent } from "@/components/calculator/demolition-settings"
import { Card } from "@/components/ui/card"
import { supabase } from "@/lib/supabase/client"
import { LicenseTab } from "@/components/project/license-tab"
import { ContractTab } from "@/components/project/contract-tab"
import { formatDecimalInput, parseDecimalInput, sanitizeDecimalInput } from "@/lib/utils/format"
import { getCountryFieldLabels, getProvincesForCountry } from "@/lib/utils/country-fields"
import { SUPPORTED_COUNTRIES } from "@/types/user"

// Añadir initialTab a las props
interface ProjectFormProps {
  project?: Project
  isEmbedded?: boolean
  initialTab?: string
  isNew?: boolean // Added isNew prop
  projectData?: ProjectFormData // Added projectData prop
  onSuccess?: () => void // Added onSuccess prop
}

// Definir la interfaz para los ajustes eléctricos
interface ElectricalRoomSettings {
  name: string
  lightPoints: number
  outlets: number
  switches: number
  crossover: number
  outdoor: number
}

// Actualizar los valores predeterminados para asegurar que estén dentro de los rangos permitidos
const defaultDemolitionSettings: DemolitionSettings = {
  floorTileThickness: 0.02, // 2 cm (dentro del rango 0.005-0.1)
  wallTileThickness: 0.015, // 1.5 cm (dentro del rango 0.005-0.05)
  woodExpansionCoef: 1.4, // (dentro del rango 1.1-2.0)
  ceramicExpansionCoef: 1.4, // (dentro del rango 1.2-2.0)
  containerSize: 5, // 5 m³ (uno de los valores permitidos: 3, 5, 7, 10, 15, 20, 30)
  mortarBaseThickness: 0.04, // 4 cm
  mortarBaseExpansionCoef: 1.2, // Coef. de esponjamiento solera
  wallExpansionCoef: 1.3, // Coef. Esponjamiento de tabiques
  ceilingThickness: 0.015, // 1.5 cm
  ceilingExpansionCoef: 1.4, // Coef. esponjamiento falso techo
  wallThickness: 10, // 10 cm
  floorTileExpansionCoef: 1.4,
  woodenFloorExpansionCoef: 1.4,
  woodenFloorThickness: 0.02, // 2 cm
}

// Definir los rangos válidos para cada campo
const validationRanges = {
  floorTileThickness: { min: 0.005, max: 0.1, step: 0.001 },
  wallTileThickness: { min: 0.005, max: 0.05, step: 0.001 },
  woodExpansionCoef: { min: 1.1, max: 2.0, step: 0.1 },
  ceramicExpansionCoef: { min: 1.2, max: 2.0, step: 0.1 },
  containerSize: { validValues: [3, 4, 5, 7, 10, 15, 20, 30] },
  mortarBaseThickness: { min: 0.01, max: 0.15, step: 0.001 },
  mortarBaseExpansionCoef: { min: 1.1, max: 2.0, step: 0.1 },
  wallExpansionCoef: { min: 1.1, max: 2.0, step: 0.1 },
  ceilingThickness: { min: 0.005, max: 0.05, step: 0.001 },
  ceilingExpansionCoef: { min: 1.1, max: 2.0, step: 0.1 },
  wallThickness: { min: 1, max: 50, step: 1 },
  floorTileExpansionCoef: { min: 1.1, max: 2.0, step: 0.1 },
  woodenFloorExpansionCoef: { min: 1.1, max: 2.0, step: 0.1 },
  woodenFloorThickness: { min: 0.005, max: 0.1, step: 0.001 },
}

// Valores predeterminados para los ajustes eléctricos
const defaultElectricalSettings: ElectricalRoomSettings[] = [
  { name: "Cocina", lightPoints: 2, outlets: 8, switches: 2, crossover: 0, outdoor: 0 },
  { name: "Cocina Abierta", lightPoints: 3, outlets: 10, switches: 3, crossover: 1, outdoor: 0 },
  { name: "Cocina Americana", lightPoints: 3, outlets: 10, switches: 3, crossover: 1, outdoor: 0 },
  { name: "Baño", lightPoints: 2, outlets: 3, switches: 1, crossover: 0, outdoor: 0 },
  { name: "Dormitorio", lightPoints: 1, outlets: 4, switches: 2, crossover: 1, outdoor: 0 },
  { name: "Salón", lightPoints: 2, outlets: 6, switches: 3, crossover: 1, outdoor: 0 },
  { name: "Pasillo", lightPoints: 2, outlets: 2, switches: 2, crossover: 1, outdoor: 0 },
  { name: "Hall", lightPoints: 2, outlets: 2, switches: 2, crossover: 1, outdoor: 0 },
  { name: "Terraza", lightPoints: 1, outlets: 1, switches: 1, crossover: 0, outdoor: 1 },
  { name: "Trastero", lightPoints: 1, outlets: 2, switches: 1, crossover: 0, outdoor: 0 },
  { name: "Vestidor", lightPoints: 1, outlets: 2, switches: 1, crossover: 0, outdoor: 0 },
]

// Modificar la declaración de la función para incluir initialTab
export function ProjectForm({
  project,
  isEmbedded = false,
  initialTab = "project",
  isNew = false,
  projectData,
  onSuccess,
}: ProjectFormProps) {
  const [editingSection, setEditingSection] = useState<string | null>(null)

  // Actualizar el estado inicial y el selector de estados
  const [formData, setFormData] = useState<ProjectFormData>({
    title: project?.title || "",
    description: project?.description || "",
    client: project?.client || "",
    clientEmail: project?.clientEmail || "",
    clientPhone: project?.clientPhone || "",
    client_address: project?.client_address || "", // Cambiado a snake_case
    clientNotes: project?.clientNotes || "",
    project_address: project?.project_address || "", // Cambiado a snake_case
    budget: project?.budget ?? 0,
    dueDate: project?.duedate || new Date().toISOString().split("T")[0],
    // Nuevos campos para licencia y contrato
    license_status: project?.license_status || "No iniciado",
    license_date: project?.license_date || "",
    contract_signed: project?.contract_signed || false,
    contract_date: project?.contract_date || "",
    street: project?.street || "",
    project_floor: project?.project_floor ?? "",
    door: project?.door || "",
    city: project?.city || "",
    province: project?.province || "",
    country: project?.country || "",
    ceiling_height: project?.ceiling_height ?? "",
    structure_type: project?.structure_type || "",
    has_elevator: project?.has_elevator || "", // Ya no necesita conversión
    // Añadir DNI a formData
    client_dni: project?.client_dni || "",
    // Campos que se añadieron después de la creación inicial del proyecto
    progress: project?.progress || 0,
    status: project?.status || "Borrador",
    color: project?.color || "#000000",
  })

  // Estado para los ajustes de demolición
  const [demolitionSettings, setDemolitionSettings] = useState<DemolitionSettings>({
    ...defaultDemolitionSettings,
    // Si hay valores en project?.id, se sobreescribirán con useEffect
  })

  // Estado para los ajustes eléctricos
  const [electricalSettings, setElectricalSettings] = useState<ElectricalRoomSettings[]>(defaultElectricalSettings)

  // Estado para la configuración de la calculadora (para mantener wallDemolitionArea)
  const [calculatorConfig, setCalculatorConfig] = useState<any>(null)
  // Estado para errores de validación
  const [validationErrors, setValidationErrors] = useState<Record<keyof DemolitionSettings, string>>({
    floorTileThickness: "",
    wallTileThickness: "",
    woodExpansionCoef: "",
    ceramicExpansionCoef: "",
    containerSize: "",
    mortarBaseThickness: "",
    mortarBaseExpansionCoef: "",
    wallExpansionCoef: "",
    ceilingThickness: "",
    ceilingExpansionCoef: "",
    woodenFloorThickness: "",
  })
  // Modificar la inicialización del estado activeTab para usar initialTab
  const [activeTab, setActiveTab] = useState<string>(initialTab)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingSettings, setIsLoadingSettings] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [newRoomName, setNewRoomName] = useState("")
  const [customRoomName, setCustomRoomName] = useState("")
  const router = useRouter()
  const { toast } = useToast()

  // Estados para almacenar los datos iniciales
  const [initialFormData, setInitialFormData] = useState<ProjectFormData>({
    title: project?.title || "",
    description: project?.description || "",
    client: project?.client || "",
    clientEmail: project?.clientEmail || "",
    clientPhone: project?.clientPhone || "",
    client_address: project?.client_address || "", // Cambiado a snake_case
    clientNotes: project?.clientNotes || "",
    project_address: project?.project_address || "", // Cambiado a snake_case
    budget: project?.budget ?? 0,
    dueDate: project?.duedate || new Date().toISOString().split("T")[0],
    license_status: project?.license_status || "No iniciado",
    license_date: project?.license_date || "",
    contract_signed: project?.contract_signed || false,
    contract_date: project?.contract_date || "",
    street: project?.street || "",
    project_floor: project?.project_floor ?? "",
    door: project?.door || "",
    city: project?.city || "",
    province: project?.province || "",
    country: project?.country || "",
    ceiling_height: project?.ceiling_height ?? "",
    structure_type: project?.structure_type || "",
    has_elevator: project?.has_elevator || "", // Ya no necesita conversión
    client_dni: project?.client_dni || "",
    // Campos que se añadieron después de la creación inicial del proyecto
    progress: project?.progress || 0,
    status: project?.status || "Borrador",
    color: project?.color || "#000000",
  })

  const [initialDemolitionSettings, setInitialDemolitionSettings] = useState<DemolitionSettings>({
    ...defaultDemolitionSettings,
    // Si hay valores en project?.id, se sobreescribirán con useEffect
  })

  const [initialElectricalSettings, setInitialElectricalSettings] =
    useState<ElectricalRoomSettings[]>(defaultElectricalSettings)

  const [acceptedBudget, setAcceptedBudget] = useState<any>(null)

  const [alturaInput, setAlturaInput] = useState("")

  const [userCountry, setUserCountry] = useState<string>("ES")
  const [userRole, setUserRole] = useState<string | null>(null)

  useEffect(() => {
    console.log("[v0] ProjectForm - Estado del componente:", {
      isNew,
      isLoading,
      saveSuccess,
      hasProjectData: !!projectData,
      projectId: projectData?.id,
    })
  }, [isLoading, saveSuccess, isNew, projectData])

  useEffect(() => {
    console.log("[v0] FORM - Estado inicial:", {
      hasProject: !!project,
      projectId: project?.id,
      isEmbedded,
      initialTab,
    })
  }, [])

  // Cargar el país del perfil del usuario
  useEffect(() => {
    const loadUserCountry = async () => {
      console.log("[v0] Cargando perfil de usuario...")
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        console.log("[v0] Usuario ID:", user.id)
        const { data: profile, error } = await supabase
          .from("profiles")
          .select("country, user_type")
          .eq("id", user.id)
          .single()

        console.log("[v0] Perfil cargado:", profile)
        console.log("[v0] Error al cargar perfil:", error)

        if (profile?.country) {
          setUserCountry(profile.country)
          // Si es un proyecto nuevo, establecer el país por defecto
          if (!project?.id && !formData.country_code) {
            setFormData((prev) => ({ ...prev, country_code: profile.country }))
          }
        }
        if (profile?.user_type) {
          console.log("[v0] user_type detectado:", profile.user_type)
          setUserRole(profile.user_type)
        } else {
          console.log("[v0] No se encontró user_type, asumiendo homeowner")
          setUserRole("homeowner")
        }
      }
    }
    loadUserCountry()
  }, [])

  // Cargar los ajustes de demolición y la configuración de la calculadora si hay un proyecto
  useEffect(() => {
    if (project?.id) {
      setIsLoadingSettings(true)

      const projectFormData: ProjectFormData = {
        title: project.title || "",
        description: project.description || "",
        client: project.client || "",
        clientEmail: project.clientEmail || "",
        clientPhone: project.clientPhone || "",
        client_address: project.client_address || "",
        clientNotes: project.clientNotes || "",
        project_address: project.project_address || "",
        budget: project.budget ?? 0,
        dueDate: project.duedate || new Date().toISOString().split("T")[0],
        license_status: project.license_status || "No iniciado",
        license_date: project.license_date || "",
        contract_signed: project.contract_signed || false,
        contract_date: project.contract_date || "",
        street: project.street || "",
        project_floor: project.project_floor ?? "",
        door: project.door || "",
        city: project.city || "",
        province: project.province || "",
        country: project.country || "",
        country_code: project.country_code || "ES",
        ceiling_height: project.ceiling_height ?? "",
        structure_type: project.structure_type || "",
        has_elevator: project.has_elevator || "",
        client_dni: project.client_dni || "",
        // Campos que se añadieron después de la creación inicial del proyecto
        progress: project.progress || 0,
        status: project.status || "Borrador",
        color: project.color || "#000000",
      }

      setFormData(projectFormData)
      setInitialFormData(projectFormData)
      if (project.ceiling_height) {
        setAlturaInput(formatDecimalInput(project.ceiling_height))
      }

      // Cargar ajustes de demolición
      const loadDemolitionSettings = getProjectDemolitionSettings(project.id)
        .then((settings) => {
          if (settings) {
            // Asegurarse de que todos los campos tengan valores, usando los predeterminados como respaldo
            const completeSettings = {
              ...defaultDemolitionSettings, // Valores predeterminados como base
              ...settings, // Sobreescribir con los valores guardados
            }
            setDemolitionSettings(completeSettings)
            setInitialDemolitionSettings(completeSettings) // Guardar los ajustes iniciales
          }
        })
        .catch((error) => {
          console.error("Error al cargar ajustes de demolición:", error)
          // En caso de error, mantener los valores predeterminados
          setDemolitionSettings(defaultDemolitionSettings)
          setInitialDemolitionSettings(defaultDemolitionSettings) // Guardar los ajustes iniciales
        })

      // Cargar configuración de la calculadora
      const loadCalculatorConfig = getCalculatorConfig(project.id)
        .then((config) => {
          if (config) {
            setCalculatorConfig(config)

            // Si hay ajustes eléctricos guardados, cargarlos
            if (config.electricalSettings) {
              try {
                const savedElectricalSettings = JSON.parse(config.electricalSettings)
                if (Array.isArray(savedElectricalSettings) && savedElectricalSettings.length > 0) {
                  setElectricalSettings(savedElectricalSettings)
                  setInitialElectricalSettings([...savedElectricalSettings]) // Guardar los ajustes iniciales
                }
              } catch (e) {
                console.error("Error al parsear ajustes eléctricos:", e)
              }
            }
          }
        })
        .catch((error) => {
          console.error("Error al cargar configuración de la calculadora:", error)
        })

      const loadAcceptedBudget = async () => {
        try {
          const { data, error } = await supabase
            .from("budgets")
            .select("*")
            .eq("project_id", project.id)
            .eq("status", "approved")
            .single()

          if (data && !error) {
            setAcceptedBudget(data)
          }
        } catch (error) {
          console.error("Error loading accepted budget:", error)
        }
      }

      loadAcceptedBudget()

      // Esperar a que ambas promesas se resuelvan
      Promise.all([loadDemolitionSettings, loadCalculatorConfig]).finally(() => {
        setIsLoadingSettings(false)
      })
    } else {
      // If no project, set initial values to defaults
      setInitialFormData({
        title: "",
        description: "",
        client: "",
        clientEmail: "",
        clientPhone: "",
        client_address: "",
        clientNotes: "",
        project_address: "",
        budget: 0,
        dueDate: new Date().toISOString().split("T")[0],
        license_status: "No iniciado",
        license_date: "",
        contract_signed: false,
        contract_date: "",
        street: "",
        project_floor: "",
        door: "",
        city: "",
        province: "",
        country: "",
        ceiling_height: "",
        structure_type: "",
        has_elevator: "",
        client_dni: "", // Set default for DNI
        // Set default values for new internationalization fields
        country_code: userCountry,
        client_country: userCountry,
        client_street: "",
        client_city: "",
        client_province: "",
        // Campos que se añadieron después de la creación inicial del proyecto
        progress: 0,
        status: "Borrador",
        color: "#000000",
      })
      setInitialDemolitionSettings(defaultDemolitionSettings)
      setInitialElectricalSettings(defaultElectricalSettings)
    }
  }, [project?.id])

  // Validar los ajustes de demolición cuando cambien
  useEffect(() => {
    validateDemolitionSettingsRealTime(demolitionSettings)
  }, [demolitionSettings])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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

  // Modificar el manejador de cambios numéricos
  const handleNumberChange = (id: string, value: string) => {
    // If the field is empty, set it to empty string instead of 0
    if (value === "") {
      setFormData((prev) => ({
        ...prev,
        [id]: "",
      }))
      return
    }

    // Allow only digits, one decimal point/comma
    if (!/^[0-9]*[.,]?[0-9]*$/.test(value)) {
      return
    }

    // Store the actual string value during editing
    setFormData((prev) => ({
      ...prev,
      [id]: value,
    }))
  }

  // Manejador para checkbox
  const handleCheckboxChange = (id: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      [id]: checked,
    }))
  }

  // Modificar el manejador de cambios en los ajustes de demolición
  const handleDemolitionSettingChange = (field: keyof DemolitionSettings, value: string) => {
    // Si el campo está vacío, permitir temporalmente para facilitar la edición
    if (value === "") {
      setDemolitionSettings((prev) => ({
        ...prev,
        [field]: "",
      }))
      return
    }

    // Permitir la entrada de números con decimales (usando punto o coma)
    if (!/^[0-9]*[.,]?[0-9]*$/.test(value)) {
      return
    }

    // Actualizar el valor tal cual durante la edición
    setDemolitionSettings((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  // Manejador para cambiar los ajustes eléctricos
  const handleElectricalSettingChange = (index: number, field: keyof ElectricalRoomSettings, value: number) => {
    // Asegurarse de que el valor no sea negativo
    const newValue = Math.max(0, value)

    setElectricalSettings((prev) => {
      const newSettings = [...prev]
      newSettings[index] = {
        ...newSettings[index],
        [field]: newValue,
      }
      return newSettings
    })
  }

  // Función para incrementar un valor eléctrico
  const incrementElectricalValue = (index: number, field: keyof ElectricalRoomSettings) => {
    setElectricalSettings((prev) => {
      const newSettings = [...prev]
      newSettings[index] = {
        ...newSettings[index],
        [field]: newSettings[index][field] + 1,
      }
      return newSettings
    })
  }

  // Función para decrementar un valor eléctrico
  const decrementElectricalValue = (index: number, field: keyof ElectricalRoomSettings) => {
    setElectricalSettings((prev) => {
      const newSettings = [...prev]
      newSettings[index] = {
        ...newSettings[index],
        [field]: Math.max(0, newSettings[index][field] - 1),
      }
      return newSettings
    })
  }

  // Función para validar los ajustes de demolición en tiempo real
  const validateDemolitionSettingsRealTime = (settings: DemolitionSettings) => {
    const errors: Record<keyof DemolitionSettings, string> = {
      wallThickness: "",
      floorTileThickness: "",
      wallTileThickness: "",
      woodExpansionCoef: "",
      ceramicExpansionCoef: "",
      containerSize: "",
      floorTileExpansionCoef: "",
      woodenFloorThickness: "",
      woodenFloorExpansionCoef: "",
      mortarBaseThickness: "",
      mortarBaseExpansionCoef: "",
      wallExpansionCoef: "",
      ceilingThickness: "",
      ceilingExpansionCoef: "",
    }

    // Validar cada campo solo si tiene un valor
    if (settings.floorTileThickness !== "") {
      const value =
        typeof settings.floorTileThickness === "string"
          ? Number.parseFloat(settings.floorTileThickness.replace(",", "."))
          : settings.floorTileThickness

      if (!isNaN(value)) {
        if (value < validationRanges.floorTileThickness.min || value > validationRanges.floorTileThickness.max) {
          errors.floorTileThickness = `Debe estar entre ${validationRanges.floorTileThickness.min} y ${validationRanges.floorTileThickness.max} m`
        }
      }
    }

    if (settings.wallTileThickness !== "") {
      const value =
        typeof settings.wallTileThickness === "string"
          ? Number.parseFloat(settings.wallTileThickness.replace(",", "."))
          : settings.wallTileThickness

      if (!isNaN(value)) {
        if (value < validationRanges.wallTileThickness.min || value > validationRanges.wallTileThickness.max) {
          errors.wallTileThickness = `Debe estar entre ${validationRanges.wallTileThickness.min} y ${validationRanges.wallTileThickness.max} m`
        }
      }
    }

    if (settings.woodExpansionCoef !== "") {
      const value =
        typeof settings.woodExpansionCoef === "string"
          ? Number.parseFloat(settings.woodExpansionCoef.replace(",", "."))
          : settings.woodExpansionCoef

      if (!isNaN(value)) {
        if (value < validationRanges.woodExpansionCoef.min || value > validationRanges.woodExpansionCoef.max) {
          errors.woodExpansionCoef = `Debe estar entre ${validationRanges.woodExpansionCoef.min} y ${validationRanges.woodExpansionCoef.max}`
        }
      }
    }

    if (settings.ceramicExpansionCoef !== "") {
      const value =
        typeof settings.ceramicExpansionCoef === "string"
          ? Number.parseFloat(settings.ceramicExpansionCoef.replace(",", "."))
          : settings.ceramicExpansionCoef

      if (!isNaN(value)) {
        if (value < validationRanges.ceramicExpansionCoef.min || value > validationRanges.ceramicExpansionCoef.max) {
          errors.ceramicExpansionCoef = `Debe estar entre ${validationRanges.ceramicExpansionCoef.min} y ${validationRanges.ceramicExpansionCoef.max}`
        }
      }
    }

    if (settings.containerSize !== "" && typeof settings.containerSize === "string") {
      const value = Number.parseFloat(settings.containerSize.replace(",", "."))

      if (!isNaN(value) && !validationRanges.containerSize.validValues.includes(value)) {
        errors.containerSize = `Debe ser uno de los siguientes valores: ${validationRanges.containerSize.validValues.join(", ")} m³`
      }
    }

    if (settings.mortarBaseThickness !== "") {
      const value =
        typeof settings.mortarBaseThickness === "string"
          ? Number.parseFloat(settings.mortarBaseThickness.replace(",", "."))
          : settings.mortarBaseThickness

      if (!isNaN(value)) {
        if (value < validationRanges.mortarBaseThickness.min || value > validationRanges.mortarBaseThickness.max) {
          errors.mortarBaseThickness = `Debe estar entre ${validationRanges.mortarBaseThickness.min} y ${validationRanges.mortarBaseThickness.max} m`
        }
      }
    }

    if (settings.mortarBaseExpansionCoef !== "") {
      const value =
        typeof settings.mortarBaseExpansionCoef === "string"
          ? Number.parseFloat(settings.mortarBaseExpansionCoef.replace(",", "."))
          : settings.mortarBaseExpansionCoef

      if (!isNaN(value)) {
        if (
          value < validationRanges.mortarBaseExpansionCoef.min ||
          value > validationRanges.mortarBaseExpansionCoef.max
        ) {
          errors.mortarBaseExpansionCoef = `Debe estar entre ${validationRanges.mortarBaseExpansionCoef.min} y ${validationRanges.mortarBaseExpansionCoef.max}`
        }
      }
    }

    if (settings.wallExpansionCoef !== "") {
      const value =
        typeof settings.wallExpansionCoef === "string"
          ? Number.parseFloat(settings.wallExpansionCoef.replace(",", "."))
          : settings.wallExpansionCoef

      if (!isNaN(value)) {
        if (value < validationRanges.wallExpansionCoef.min || value > validationRanges.wallExpansionCoef.max) {
          errors.wallExpansionCoef = `Debe estar entre ${validationRanges.wallExpansionCoef.min} y ${validationRanges.wallExpansionCoef.max}`
        }
      }
    }

    if (settings.ceilingThickness !== "") {
      const value =
        typeof settings.ceilingThickness === "string"
          ? Number.parseFloat(settings.ceilingThickness.replace(",", "."))
          : settings.ceilingThickness

      if (!isNaN(value)) {
        if (value < validationRanges.ceilingThickness.min || value > validationRanges.ceilingThickness.max) {
          errors.ceilingThickness = `Debe estar entre ${validationRanges.ceilingThickness.min} y ${validationRanges.ceilingThickness.max} m`
        }
      }
    }

    if (settings.ceilingExpansionCoef !== "") {
      const value =
        typeof settings.ceilingExpansionCoef === "string"
          ? Number.parseFloat(settings.ceilingExpansionCoef.replace(",", "."))
          : settings.ceilingExpansionCoef

      if (!isNaN(value)) {
        if (value < validationRanges.ceilingExpansionCoef.min || value > validationRanges.ceilingExpansionCoef.max) {
          errors.ceilingExpansionCoef = `Debe estar entre ${validationRanges.ceilingExpansionCoef.min} y ${validationRanges.ceilingExpansionCoef.max}`
        }
      }
    }

    if (settings.woodenFloorThickness !== "") {
      const value =
        typeof settings.woodenFloorThickness === "string"
          ? Number.parseFloat(settings.woodenFloorThickness.replace(",", "."))
          : settings.woodenFloorThickness

      if (!isNaN(value)) {
        if (value < validationRanges.woodenFloorThickness.min || value > validationRanges.woodenFloorThickness.max) {
          errors.woodenFloorThickness = `Debe estar entre ${validationRanges.woodenFloorThickness.min} y ${validationRanges.woodenFloorThickness.max} m`
        }
      }
    }

    setValidationErrors(errors)
  }

  // Función para restaurar valores predeterminados
  const resetToDefaults = () => {
    setDemolitionSettings(defaultDemolitionSettings)
    setValidationErrors({
      floorTileThickness: "",
      wallTileThickness: "",
      woodExpansionCoef: "",
      ceramicExpansionCoef: "",
      containerSize: "",
      mortarBaseThickness: "",
      mortarBaseExpansionCoef: "",
      wallExpansionCoef: "",
      ceilingThickness: "",
      ceilingExpansionCoef: "",
      woodenFloorThickness: "",
    })
  }

  // Función para calcular el volumen de escombros basado en el área y el grosor
  const calculateDebrisVolume = (area: number, thickness: number, expansionCoef: number) => {
    // Convertir grosor de cm a m si es necesario
    const thicknessInMeters = thickness > 1 ? thickness / 100 : thickness
    // Calcular volumen (m³) = área (m²) * grosor (m) * coeficiente de esponjamiento
    return area * thicknessInMeters * expansionCoef
  }

  // Función para restaurar los valores predeterminados de electricidad
  const resetElectricalDefaults = () => {
    setElectricalSettings(defaultElectricalSettings)
  }

  function hasFormDataChanged(current: ProjectFormData, initial: ProjectFormData): boolean {
    const keysToCheck: (keyof ProjectFormData)[] = [
      "title",
      "description",
      "client",
      "clientEmail",
      "clientPhone",
      "client_address",
      "clientNotes",
      "client_dni",
      "project_address",
      "progress",
      "status",
      "dueDate",
      "budget",
      "color",
      "street",
      "project_floor",
      "door",
      "city",
      "province",
      "country",
      "ceiling_height",
      "structure_type",
      "has_elevator",
    ]

    console.log("[v0] hasFormDataChanged - Checking for changes...")
    let hasChanges = false

    for (const key of keysToCheck) {
      const currentValue = current[key]
      const initialValue = initial[key]

      if (currentValue !== initialValue) {
        console.log(`[v0] hasFormDataChanged - Campo "${key}" cambió:`, {
          before: initialValue,
          after: currentValue,
        })
        hasChanges = true
      }
    }

    if (!hasChanges) {
      console.log("[v0] hasFormDataChanged - No se detectaron cambios")
    }

    return hasChanges
  }

  function normalizeFormDataForComparison(data: ProjectFormData): any {
    // Crear una copia normalizada para comparación
    const normalized: any = {}

    Object.keys(data).forEach((key) => {
      const value = data[key as keyof ProjectFormData]

      // Normalizar null, undefined y cadenas vacías a null para comparación consistente
      if (value === "" || value === undefined || value === null) {
        normalized[key] = null
      } else if (typeof value === "number") {
        // Asegurar que los números sean consistentes
        normalized[key] = value
      } else if (typeof value === "boolean") {
        // Mantener booleanos tal cual
        normalized[key] = value
      } else if (typeof value === "string") {
        // Recortar espacios en blanco de las cadenas
        const trimmed = value.trim()
        normalized[key] = trimmed === "" ? null : trimmed
      } else {
        normalized[key] = value
      }
    })

    return normalized
  }

  function hasDemolitionSettingsChanged(current: DemolitionSettings, initial: DemolitionSettings): boolean {
    const changed = JSON.stringify(current) !== JSON.stringify(initial)

    if (changed) {
      console.log("[v0] DemolitionSettings cambió:")
      console.log("[v0] - Actual:", current)
      console.log("[v0] - Inicial:", initial)
    }

    return changed
  }

  function hasElectricalSettingsChanged(current: ElectricalRoomSettings[], initial: ElectricalRoomSettings[]): boolean {
    const changed = JSON.stringify(current) !== JSON.stringify(initial)

    if (changed) {
      console.log("[v0] ElectricalSettings cambió:")
      console.log("[v0] - Actual:", current)
      console.log("[v0] - Inicial:", initial)
    }

    return changed
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    console.log("[v0] SUBMIT - handleSubmit iniciado")
    console.log("[v0] SUBMIT - Estados antes del reset:", { isLoading, saveSuccess })
    setIsLoading(false)
    setSaveSuccess(false)

    console.log("[v0] SUBMIT - isNew:", isNew)
    console.log("[v0] SUBMIT - projectData:", projectData)

    if (!formData.title.trim()) {
      toast({
        title: "Nombre de proyecto requerido",
        description: "Por favor, introduce el nombre del proyecto",
        variant: "destructive",
      })
      setActiveTab("project")
      return
    }

    // Convertir valores de cadena a números para guardar
    const numericFormData = {
      ...formData,
      budget:
        typeof formData.budget === "string"
          ? Number.parseFloat(formData.budget.replace(",", ".")) || 0
          : formData.budget,
      progress: typeof formData.progress === "string" ? Number.parseFloat(formData.progress) : formData.progress || 0,
    }

    // Convertir valores de cadena de ajustes de demolición a números y validar rangos
    const numericDemolitionSettings = normalizeAndValidateDemolitionSettings(demolitionSettings)

    setIsLoading(true)
    try {
      // Usar numericFormData en lugar de formData
      const dataToSubmit = {
        ...numericFormData,
        client_email: numericFormData.clientEmail,
        client_phone: numericFormData.clientPhone,
        client_notes: numericFormData.clientNotes,
        client_dni: numericFormData.client_dni,
        progress: numericFormData.progress,
        status: numericFormData.status,
        color: numericFormData.color,
      }

      console.log("[v0] SUBMIT - Datos a enviar:", dataToSubmit)

      let projectId: string

      if (project?.id) {
        console.log("[v0] SUBMIT - Actualizando proyecto existente:", project.id)
        await updateProject(project.id, dataToSubmit)
        projectId = project.id
        toast({
          title: "Proyecto actualizado",
          description: "El proyecto se ha actualizado correctamente",
        })
      } else {
        console.log("[v0] SUBMIT - Creando nuevo proyecto")
        const newProject = await createProject(dataToSubmit)
        projectId = newProject.id
        toast({
          title: "Proyecto creado",
          description: "El proyecto se ha creado correctamente",
        })
      }

      const demolitionSettingsChanged = hasDemolitionSettingsChanged(demolitionSettings, initialDemolitionSettings)
      if (demolitionSettingsChanged) {
        try {
          console.log("[v0] SUBMIT - Guardando ajustes de demolición")
          await saveProjectDemolitionSettings(projectId, numericDemolitionSettings)
          // También guardar en la tabla de la calculadora para mantener la sincronización
          await saveDemolitionSettingsToCalculator(projectId, numericDemolitionSettings)
        } catch (settingsError) {
          console.error("[v0] SUBMIT - Error al guardar ajustes de demolición:", settingsError)
        }
      }

      // Guardar ajustes eléctricos si cambiaron
      const electricalSettingsChanged = hasElectricalSettingsChanged(electricalSettings, initialElectricalSettings)
      if (electricalSettingsChanged || demolitionSettingsChanged) {
        try {
          console.log("[v0] SUBMIT - Actualizando configuración de calculadora")
          const currentConfig = await getCalculatorConfig(projectId)

          if (currentConfig) {
            const wallDemolitionArea = currentConfig.wallDemolitionArea || calculatorConfig?.wallDemolitionArea || 0
            const wallThickness = numericDemolitionSettings.wallThickness
            const ceramicExpansionCoef = numericDemolitionSettings.ceramicExpansionCoef

            const configToSave: any = { ...currentConfig }

            if (wallDemolitionArea > 0 && demolitionSettingsChanged) {
              const debrisVolume = calculateDebrisVolume(wallDemolitionArea, wallThickness, ceramicExpansionCoef)
              configToSave.wallDemolitionArea = wallDemolitionArea
              configToSave.wallDebrisVolume = debrisVolume
            }

            if (electricalSettingsChanged) {
              configToSave.electricalSettings = JSON.stringify(electricalSettings)
            }

            await saveCalculatorConfig(projectId, configToSave)
          } else if (electricalSettingsChanged) {
            await saveCalculatorConfig(projectId, {
              electricalSettings: JSON.stringify(electricalSettings),
            })
          }
        } catch (configError) {
          console.error("[v0] SUBMIT - Error al actualizar configuración de la calculadora:", configError)
        }
      }

      console.log("[v0] SUBMIT - Actualizando valores iniciales después del guardado")
      setInitialFormData({ ...formData })
      setInitialDemolitionSettings({ ...demolitionSettings })
      setInitialElectricalSettings([...electricalSettings])

      setIsLoading(false)
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 2000)

      if (onSuccess) {
        onSuccess()
      }

      if (!isEmbedded) {
        setTimeout(() => {
          // Si estamos editando un proyecto existente, nos quedamos en la edición y preservamos la pestaña
          // Si es un proyecto nuevo, redirigimos a la vista general del proyecto
          const destination = project?.id
            ? `/dashboard/projects/${projectId}/edit?tab=${activeTab}`
            : `/dashboard/projects/${projectId}`

          router.push(destination)
          router.refresh()
        }, 500)
      }
    } catch (error: any) {
      console.error("[v0] SUBMIT - Error al guardar el proyecto:", error)
      toast({
        title: "Error",
        description: error.message || "No se pudo guardar el proyecto. Inténtalo de nuevo.",
        variant: "destructive",
      })
      setIsLoading(false)
    }
  }

  // Función para normalizar y validar los ajustes de demolición
  const normalizeAndValidateDemolitionSettings = (settings: DemolitionSettings): DemolitionSettings => {
    const normalized = { ...settings }

    // Convertir y normalizar cada valor
    if (typeof normalized.floorTileThickness === "string") {
      const value = Number.parseFloat(normalized.floorTileThickness.replace(",", "."))
      normalized.floorTileThickness = isNaN(value)
        ? 0.02
        : Math.max(0.005, Math.min(0.1, Math.round(value * 1000) / 1000))
    }

    if (typeof normalized.wallTileThickness === "string") {
      const value = Number.parseFloat(normalized.wallTileThickness.replace(",", "."))
      normalized.wallTileThickness = isNaN(value)
        ? 0.015
        : Math.max(0.005, Math.min(0.05, Math.round(value * 1000) / 1000))
    }

    if (typeof normalized.woodExpansionCoef === "string") {
      const value = Number.parseFloat(normalized.woodExpansionCoef.replace(",", "."))
      normalized.woodExpansionCoef = isNaN(value) ? 1.4 : Math.max(1.1, Math.min(2.0, Math.round(value * 10) / 10))
    }

    if (typeof normalized.ceramicExpansionCoef === "string") {
      const value = Number.parseFloat(normalized.ceramicExpansionCoef.replace(",", "."))
      normalized.ceramicExpansionCoef = isNaN(value) ? 1.4 : Math.max(1.2, Math.min(2.0, Math.round(value * 10) / 10))
    }

    if (typeof normalized.containerSize === "string") {
      const value = Number.parseFloat(normalized.containerSize.replace(",", "."))
      const validSizes = validationRanges.containerSize.validValues
      normalized.containerSize = isNaN(value) ? 5 : validSizes.includes(value) ? value : 5
    }

    // Normalizar los nuevos campos
    if (typeof normalized.mortarBaseThickness === "string") {
      const value = Number.parseFloat(normalized.mortarBaseThickness.replace(",", "."))
      normalized.mortarBaseThickness = isNaN(value)
        ? 0.04
        : Math.max(0.01, Math.min(0.15, Math.round(value * 1000) / 1000))
    }

    if (typeof normalized.mortarBaseExpansionCoef === "string") {
      const value = Number.parseFloat(normalized.mortarBaseExpansionCoef.replace(",", "."))
      normalized.mortarBaseExpansionCoef = isNaN(value)
        ? 1.2
        : Math.max(1.1, Math.min(2.0, Math.round(value * 10) / 10))
    }

    if (typeof normalized.wallExpansionCoef === "string") {
      const value = Number.parseFloat(normalized.wallExpansionCoef.replace(",", "."))
      normalized.wallExpansionCoef = isNaN(value) ? 1.3 : Math.max(1.1, Math.min(2.0, Math.round(value * 10) / 10))
    }

    if (typeof normalized.ceilingThickness === "string") {
      const value = Number.parseFloat(normalized.ceilingThickness.replace(",", "."))
      normalized.ceilingThickness = isNaN(value)
        ? 0.015
        : Math.max(0.005, Math.min(0.05, Math.round(value * 1000) / 1000))
    }

    if (typeof normalized.ceilingExpansionCoef === "string") {
      const value = Number.parseFloat(normalized.ceilingExpansionCoef.replace(",", "."))
      normalized.ceilingExpansionCoef = isNaN(value) ? 1.4 : Math.max(1.1, Math.min(2.0, Math.round(value * 10) / 10))
    }

    if (typeof normalized.woodThickness === "string") {
      const value = Number.parseFloat(normalized.woodThickness.replace(",", "."))
      normalized.woodThickness = isNaN(value) ? 0.02 : Math.max(0.005, Math.min(0.1, Math.round(value * 1000) / 1000))
    }

    return normalized
  }

  // Removed status field from showLicenseAndContract condition
  const showLicenseAndContract = true

  // Verificar si hay algún error de validación
  const hasAnyValidationError = Object.values(validationErrors).some((error) => error !== "")

  // Función para añadir una nueva habitación
  const addNewRoom = () => {
    if (newRoomName) {
      const roomName = newRoomName === "Otro" && customRoomName ? customRoomName : newRoomName
      setElectricalSettings((prev) => [
        ...prev,
        { name: roomName, lightPoints: 1, outlets: 2, switches: 1, crossover: 0, outdoor: 0 },
      ])
      setNewRoomName("")
      setCustomRoomName("")
    }
  }

  // Función para eliminar una habitación
  const removeRoom = (index: number) => {
    setElectricalSettings((prev) => prev.filter((_, i) => i !== index))
  }

  const selectedCountry = formData.country_code || userCountry
  const countryLabels = getCountryFieldLabels(selectedCountry)
  const provincesForCountry = getProvincesForCountry(selectedCountry)

  const isHomeowner = userRole === "homeowner" || userRole === "propietario"
  console.log("[v0] Renderizando ProjectForm - userRole:", userRole, "| isHomeowner:", isHomeowner)

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="mb-6 overflow-x-auto scrollbar-hide">
          <TabsList
            className={`inline-flex w-max min-w-full h-auto gap-1 bg-muted/50 p-1 rounded-lg ${isHomeowner ? "md:grid md:grid-cols-2 md:w-full" : "md:grid md:grid-cols-5 md:w-full"}`}
          >
            <TabsTrigger
              value="project"
              className="flex-shrink-0 whitespace-nowrap px-3 py-2 text-sm font-medium rounded-md transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:text-foreground data-[state=inactive]:hover:bg-muted"
            >
              Proyecto
            </TabsTrigger>
            {!isHomeowner && (
              <TabsTrigger
                value="client"
                className="flex-shrink-0 whitespace-nowrap px-3 py-2 text-sm font-medium rounded-md transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:text-foreground data-[state=inactive]:hover:bg-muted"
              >
                Cliente
              </TabsTrigger>
            )}
            <TabsTrigger
              value="license"
              className="flex-shrink-0 whitespace-nowrap px-3 py-2 text-sm font-medium rounded-md transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:text-foreground data-[state=inactive]:hover:bg-muted"
            >
              Licencia
            </TabsTrigger>
            <TabsTrigger
              value="contract"
              className="flex-shrink-0 whitespace-nowrap px-3 py-2 text-sm font-medium rounded-md transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:text-foreground data-[state=inactive]:hover:bg-muted"
            >
              Contrato
            </TabsTrigger>
            {!isHomeowner && (
              <TabsTrigger
                value="demolition"
                className={`flex-shrink-0 whitespace-nowrap px-3 py-2 text-sm font-medium rounded-md transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:text-foreground data-[state=inactive]:hover:bg-muted ${hasAnyValidationError ? "text-red-500" : ""}`}
              >
                Ajustes
                {hasAnyValidationError && <AlertCircle className="h-3 w-3 ml-1 inline" />}
              </TabsTrigger>
            )}
          </TabsList>
        </div>
        {/* End of tab styling change */}

        <TabsContent value="project" className="space-y-4 pt-4">
          <div className="grid gap-6 max-w-4xl mx-auto">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Información Básica</h3>
                <div className="grid gap-4">
                  <div className="grid gap-2 max-w-2xl">
                    <Label htmlFor="title">Nombre del proyecto *</Label>
                    <Input
                      id="title"
                      placeholder="Reforma integral"
                      value={formData.title}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="grid gap-2 max-w-md">
                    <Label htmlFor="dueDate">Fecha de creación</Label>
                    <div className="p-3 bg-gray-50 rounded-md border text-gray-500">
                      {formData.dueDate ? new Date(formData.dueDate).toLocaleDateString("es-ES") : "Sin fecha"}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4">Ubicación del Proyecto</h3>
                <div className="grid gap-4">
                  <div className="grid gap-2 max-w-md">
                    <Label htmlFor="country_code">País *</Label>
                    <Select
                      value={formData.country_code || userCountry}
                      onValueChange={(value) => setFormData({ ...formData, country_code: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona país" />
                      </SelectTrigger>
                      <SelectContent>
                        {SUPPORTED_COUNTRIES.map((country) => (
                          <SelectItem key={country.code} value={country.code}>
                            {country.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4 max-w-3xl">
                    <div className="grid gap-2">
                      <Label htmlFor="street">Calle y número *</Label>
                      <Input
                        id="street"
                        placeholder="Calle Mayor, 123"
                        value={formData.street}
                        onChange={handleChange}
                        required
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="project_floor">Planta *</Label>
                      <Input
                        id="project_floor"
                        type="number"
                        min="0"
                        max="50"
                        placeholder="0"
                        value={formData.project_floor}
                        onChange={handleChange}
                        required
                      />
                      <p className="text-xs text-muted-foreground">
                        0 = Planta baja, números positivos = plantas superiores
                      </p>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4 max-w-3xl">
                    <div className="grid gap-2">
                      <Label htmlFor="door">Puerta/Mano</Label>
                      <Input id="door" placeholder="A, B, Izq, Der..." value={formData.door} onChange={handleChange} />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="city">Ciudad *</Label>
                      <Input id="city" placeholder="Madrid" value={formData.city} onChange={handleChange} required />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4 max-w-3xl">
                    <div className="grid gap-2">
                      <Label htmlFor="province">{countryLabels.province} *</Label>
                      {provincesForCountry ? (
                        <Select
                          value={formData.province}
                          onValueChange={(value) => setFormData({ ...formData, province: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={`Selecciona ${countryLabels.province.toLowerCase()}`} />
                          </SelectTrigger>
                          <SelectContent>
                            {provincesForCountry.map((province) => (
                              <SelectItem key={province} value={province}>
                                {province}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input
                          id="province"
                          placeholder={countryLabels.province}
                          value={formData.province}
                          onChange={handleChange}
                          required
                        />
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4">Datos Técnicos</h3>
                <div className="grid gap-4">
                  <div className="grid md:grid-cols-2 gap-4 max-w-3xl">
                    <div className="grid gap-2">
                      <Label htmlFor="ceiling_height">Altura máxima al techo (m) *</Label>
                      <Input
                        id="ceiling_height"
                        type="text"
                        inputMode="decimal"
                        value={alturaInput}
                        onChange={(e) => {
                          const sanitized = sanitizeDecimalInput(e.target.value)
                          setAlturaInput(sanitized)
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
                      <p className="text-xs text-muted-foreground">Sin falsos techos</p>
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="structure_type">Tipo de estructura *</Label>
                      <Select
                        value={formData.structure_type}
                        onValueChange={(value) => setFormData({ ...formData, structure_type: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona tipo obligatorio" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Hormigón">Hormigón</SelectItem>
                          <SelectItem value="Madera">Madera</SelectItem>
                          <SelectItem value="Mixta">Mixta</SelectItem>
                          <SelectItem value="Otro">Otro</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid gap-2 max-w-md">
                    <Label htmlFor="has_elevator">¿Tiene ascensor? *</Label>
                    <Select
                      value={formData.has_elevator}
                      onValueChange={(value) => setFormData({ ...formData, has_elevator: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona si tiene ascensor" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Sí">Sí</SelectItem>
                        <SelectItem value="No">No</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Importante para calcular costes de transporte de materiales
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="client" className="space-y-4 pt-4">
          <div className="grid gap-6 max-w-4xl mx-auto">
            <div>
              <h3 className="text-lg font-semibold mb-4">Información del Cliente</h3>
              <div className="grid gap-4">
                <div className="grid gap-2 max-w-2xl">
                  <Label htmlFor="client">Nombre del cliente</Label>
                  <Input
                    id="client"
                    placeholder="Nombre completo del cliente"
                    value={formData.client}
                    onChange={handleChange}
                  />
                </div>

                <div className="grid gap-2 max-w-md">
                  <Label htmlFor="client_dni">DNI/NIE (opcional)</Label>
                  <Input
                    id="client_dni"
                    placeholder="12345678A"
                    value={formData.client_dni || ""}
                    onChange={handleChange}
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4 max-w-3xl">
                  <div className="grid gap-2">
                    <Label htmlFor="clientEmail">Email</Label>
                    <Input
                      id="clientEmail"
                      type="email"
                      placeholder="cliente@email.com"
                      value={formData.clientEmail}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="clientPhone">Teléfono</Label>
                    <Input
                      id="clientPhone"
                      type="tel"
                      placeholder="600 123 456"
                      value={formData.clientPhone}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-3">Dirección del Cliente</h4>

                  <div className="grid gap-4">
                    <div className="grid gap-2 max-w-md">
                      <Label htmlFor="client_country">País</Label>
                      <Select
                        value={formData.client_country || userCountry}
                        onValueChange={(value) => setFormData({ ...formData, client_country: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona país" />
                        </SelectTrigger>
                        <SelectContent>
                          {SUPPORTED_COUNTRIES.map((country) => (
                            <SelectItem key={country.code} value={country.code}>
                              {country.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid gap-2 max-w-2xl">
                      <Label htmlFor="client_street">Calle y número</Label>
                      <Input
                        id="client_street"
                        placeholder="Calle Mayor, 123"
                        value={formData.client_street || ""}
                        onChange={handleChange}
                      />
                    </div>

                    <div className="grid md:grid-cols-2 gap-4 max-w-3xl">
                      <div className="grid gap-2">
                        <Label htmlFor="client_city">Ciudad</Label>
                        <Input
                          id="client_city"
                          placeholder="Ciudad"
                          value={formData.client_city || ""}
                          onChange={handleChange}
                        />
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="client_province">
                          {getCountryFieldLabels(formData.client_country || userCountry).province}
                        </Label>
                        <Input
                          id="client_province"
                          placeholder={getCountryFieldLabels(formData.client_country || userCountry).province}
                          value={formData.client_province || ""}
                          onChange={handleChange}
                        />
                      </div>
                    </div>

                  </div>
                </div>

                <div className="grid gap-2 max-w-2xl">
                  <Label htmlFor="clientNotes">Notas del cliente</Label>
                  <Textarea
                    id="clientNotes"
                    placeholder="Notas adicionales sobre el cliente"
                    className="min-h-[100px]"
                    value={formData.clientNotes}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="license" className="space-y-4 pt-4">
          {project?.id ? (
            <LicenseTab projectId={project.id} />
          ) : (
            <Card className="p-12">
              <div className="text-center space-y-4">
                <p className="text-lg font-medium">Guarda el proyecto primero</p>
                <p className="text-sm text-muted-foreground">
                  Debes guardar el proyecto antes de poder subir la licencia
                </p>
              </div>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="contract" className="space-y-4 pt-4">
          {project?.id ? (
            <ContractTab projectId={project.id} projectData={formData} acceptedBudget={acceptedBudget} />
          ) : (
            <Card className="p-12">
              <div className="text-center space-y-4">
                <p className="text-lg font-medium">Guarda el proyecto primero</p>
                <p className="text-sm text-muted-foreground">
                  Debes guardar el proyecto antes de poder generar el contrato
                </p>
              </div>
            </Card>
          )}
        </TabsContent>

        {!isHomeowner && (
          <TabsContent value="demolition" className="space-y-4 pt-4">
            <div className="grid gap-4">
              <DemolitionSettingsComponent
                settings={demolitionSettings}
                updateSettings={(updates) => {
                  setDemolitionSettings((prev) => ({ ...prev, ...updates }))
                }}
                projectId={project?.id}
              />
            </div>
          </TabsContent>
        )}
      </Tabs>

      {activeTab !== "demolition" && (
        <div className="sticky bottom-0 bg-background border-t pt-4 pb-6 -mx-4 px-4 md:mx-0 md:px-0">
          <Button type="submit" className="w-full" size="lg" disabled={isLoading || saveSuccess}>
            {isLoading ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Guardando cambios...
              </>
            ) : saveSuccess ? (
              <>
                <Check className="h-5 w-5 mr-2" />
                Cambios guardados
              </>
            ) : (
              <>
                <Save className="h-5 w-5 mr-2" />
                Guardar cambios
              </>
            )}
          </Button>
        </div>
      )}
    </form>
  )
}
