"use client"

import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem as SelectItemType } from "@/components/ui/select"
import { WindowPhotoUpload } from "./window-photo-upload"
import { WindowReporting } from "./window-reporting"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type React from "react"
import { useState, useEffect } from "react"
import { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Trash2, Info, Download } from "lucide-react"
import type { Room, Window } from "@/types/calculator"
import { getProjectById } from "@/lib/services/project-service"
import { useUserProfile } from "@/hooks/use-user-profile"
import type { WindowColor } from "@/types/calculator" // Import WindowColor type
import { createBrowserClient } from "@/lib/supabase/client"

type WindowsSectionProps = {
  rooms: Room[]
  updateRoom: (roomId: string, updates: Partial<Room>) => void
  projectId: string
  onAddStandaloneWindow?: () => void
}

const windowTypeIcons: Record<string, React.ReactNode> = {
  "Oscilo-Batiente": (
    <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-6 w-6">
      <rect x="4" y="4" width="32" height="32" rx="1" fill="#a3c9e8" stroke="#1e5a8a" />
      <rect x="8" y="8" width="24" height="24" fill="#bdd7ee" stroke="#1e5a8a" />
      <line x1="8" y1="8" x2="20" y2="20" stroke="#1e5a8a" strokeWidth="1" />
      <line x1="8" y1="32" x2="20" y2="20" stroke="#1e5a8a" strokeWidth="1" />
      <line x1="8" y1="8" x2="32" y2="8" stroke="#1e5a8a" strokeWidth="1" />
      <line x1="20" y1="20" x2="32" y2="8" stroke="#1e5a8a" strokeWidth="1" />
      <circle cx="8" cy="20" r="2" fill="#1e5a8a" />
      <rect x="16" y="30" width="8" height="3" fill="#1e5a8a" rx="1" />
    </svg>
  ),
  Fija: (
    <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-6 w-6">
      <rect x="4" y="4" width="32" height="32" rx="1" fill="#a3c9e8" stroke="#1e5a8a" />
      <rect x="8" y="8" width="24" height="24" fill="#bdd7ee" stroke="#1e5a8a" />
    </svg>
  ),
  Oscilante: (
    <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-6 w-6">
      <rect x="4" y="8" width="32" height="28" rx="1" fill="#a3c9e8" stroke="#1e5a8a" />
      <rect x="8" y="12" width="24" height="20" fill="#bdd7ee" stroke="#1e5a8a" />
      <rect x="14" y="4" width="12" height="6" fill="#a3c9e8" stroke="#1e5a8a" />
      <line x1="12" y1="32" x2="20" y2="18" stroke="#1e5a8a" strokeWidth="1" />
      <line x1="28" y1="32" x2="20" y2="18" stroke="#1e5a8a" strokeWidth="1" />
    </svg>
  ),
  Batiente: (
    <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-6 w-6">
      <rect x="4" y="4" width="32" height="32" rx="1" fill="#a3c9e8" stroke="#1e5a8a" />
      <rect x="8" y="8" width="24" height="24" fill="#bdd7ee" stroke="#1e5a8a" />
      <line x1="8" y1="8" x2="20" y2="20" stroke="#1e5a8a" strokeWidth="1" />
      <line x1="8" y1="32" x2="20" y2="20" stroke="#1e5a8a" strokeWidth="1" />
    </svg>
  ),
  Pivotante: (
    <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-6 w-6">
      <rect x="4" y="4" width="32" height="32" rx="1" fill="#a3c9e8" stroke="#1e5a8a" />
      <line x1="20" y1="4" x2="20" y2="36" stroke="#1e5a8a" strokeWidth="1.5" />
      <rect x="6" y="8" width="12" height="24" fill="#bdd7ee" stroke="#1e5a8a" />
      <rect x="22" y="8" width="12" height="24" fill="#bdd7ee" stroke="#1e5a8a" />
      <line x1="6" y1="8" x2="12" y2="20" stroke="#1e5a8a" strokeWidth="1" />
      <line x1="6" y1="32" x2="12" y2="20" stroke="#1e5a8a" strokeWidth="1" />
      <line x1="34" y1="8" x2="28" y2="20" stroke="#1e5a8a" strokeWidth="1" />
      <line x1="34" y1="32" x2="28" y2="20" stroke="#1e5a8a" strokeWidth="1" />
    </svg>
  ),
  Corredera: (
    <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-6 w-6">
      <rect x="4" y="4" width="32" height="32" rx="1" fill="#a3c9e8" stroke="#1e5a8a" />
      <line x1="20" y1="4" x2="20" y2="36" stroke="#1e5a8a" strokeWidth="1.5" />
      <rect x="6" y="8" width="12" height="24" fill="#bdd7ee" stroke="#1e5a8a" />
      <rect x="22" y="8" width="12" height="24" fill="#bdd7ee" stroke="#1e5a8a" />
      <path d="M10 18l-3 2 3 2" stroke="#1e5a8a" strokeWidth="1.5" fill="none" />
      <path d="M30 18l3 2-3 2" stroke="#1e5a8a" strokeWidth="1.5" fill="none" />
    </svg>
  ),
  "Oscilo-Paralela": (
    <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-6 w-6">
      <rect x="4" y="4" width="32" height="32" rx="1" fill="#a3c9e8" stroke="#1e5a8a" />
      <line x1="20" y1="4" x2="20" y2="36" stroke="#1e5a8a" strokeWidth="1.5" />
      <rect x="6" y="8" width="12" height="24" fill="#bdd7ee" stroke="#1e5a8a" />
      <rect x="22" y="8" width="12" height="24" fill="#bdd7ee" stroke="#1e5a8a" />
      <line x1="22" y1="8" x2="28" y2="20" stroke="#1e5a8a" strokeWidth="1" />
      <line x1="22" y1="32" x2="28" y2="20" stroke="#1e5a8a" strokeWidth="1" />
      <path d="M10 18l-3 2 3 2" stroke="#1e5a8a" strokeWidth="1.5" fill="none" />
    </svg>
  ),
  Plegable: (
    <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-6 w-6">
      <rect x="4" y="4" width="32" height="32" rx="1" fill="#a3c9e8" stroke="#1e5a8a" />
      <rect x="6" y="8" width="7" height="24" fill="#bdd7ee" stroke="#1e5a8a" />
      <rect x="13" y="8" width="7" height="24" fill="#bdd7ee" stroke="#1e5a8a" />
      <rect x="20" y="8" width="7" height="24" fill="#bdd7ee" stroke="#1e5a8a" />
      <rect x="27" y="8" width="7" height="24" fill="#bdd7ee" stroke="#1e5a8a" />
      <line x1="6" y1="8" x2="10" y2="20" stroke="#1e5a8a" strokeWidth="1" />
      <line x1="6" y1="32" x2="10" y2="20" stroke="#1e5a8a" strokeWidth="1" />
      <line x1="20" y1="8" x2="24" y2="20" stroke="#1e5a8a" strokeWidth="1" />
      <line x1="20" y1="32" x2="24" y2="20" stroke="#1e5a8a" strokeWidth="1" />
    </svg>
  ),
}

const glassTypeIcons: Record<Window["glassType"], React.ReactNode> = {
  Sencillo: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-5 w-5">
      <rect x="3" y="3" width="18" height="18" rx="1" />
    </svg>
  ),
  Doble: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-5 w-5">
      <rect x="3" y="3" width="18" height="18" rx="1" />
      <line x1="12" y1="3" x2="12" y2="21" />
      <line x1="3" y1="12" x2="21" y2="12" />
    </svg>
  ),
  "Puerta Balcón": (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-5 w-5">
      <rect x="6" y="2" width="12" height="20" rx="1" />
      <line x1="6" y1="16" x2="18" y2="16" />
    </svg>
  ),
}

const windowTypes: string[] = [
  "Oscilo-Batiente",
  "Fija",
  "Oscilante",
  "Batiente",
  "Pivotante",
  "Corredera",
  "Oscilo-Paralela",
  "Plegable",
]
const glassTypes: Window["glassType"][] = ["Doble", "Puerta Balcón", "Sencillo"]

const windowColors: WindowColor[] = ["Blanco", "Negro", "Gris Antracita", "Imitación Madera"]

const WINDOW_PRICE_PER_SQM: Record<string, number> = {
  ES: 650, // España: 650€/m²
  AR: 300, // Argentina: precio ajustado
  MX: 350, // México
  CO: 320, // Colombia
  CL: 500, // Chile
  PE: 280, // Perú
  VE: 250, // Venezuela
  EC: 300, // Ecuador
  BO: 220, // Bolivia
  PY: 240, // Paraguay
  UY: 450, // Uruguay
  GT: 280, // Guatemala
  HN: 260, // Honduras
  SV: 270, // El Salvador
  NI: 240, // Nicaragua
  CR: 400, // Costa Rica
  PA: 350, // Panamá
  DO: 320, // República Dominicana
  CU: 200, // Cuba
  PR: 500, // Puerto Rico
  default: 400, // Precio por defecto para países no especificados
}

export function WindowsSection({ rooms, updateRoom, projectId, onAddStandaloneWindow }: WindowsSectionProps) {
  const [priceInputs, setPriceInputs] = useState<Record<string, string>>({})
  const [dimensionInputs, setDimensionInputs] = useState<Record<string, { width: string; height: string }>>({})
  const [projectData, setProjectData] = useState<{
    title?: string
    client?: string
    street?: string
    city?: string
    postalCode?: string
    country?: string
    project_address?: string
  } | null>(null)
  const [companyData, setCompanyData] = useState<{
    company_name?: string
    company_logo_url?: string
    company_tax_id?: string
    company_address?: string
    company_phone?: string
    company_email?: string
  } | null>(null)
  const [generalNotes, setGeneralNotes] = useState(
    "Este presupuesto será válido durante 30 días desde su fecha de emisión.",
  )

  const { userProfile, loading: profileLoading } = useUserProfile()
  const isOwner = userProfile?.user_type === "homeowner"

  const validRooms = useMemo(() => {
    if (!rooms || !Array.isArray(rooms)) return []
    return rooms.filter((room) => room && typeof room === "object")
  }, [rooms])

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createBrowserClient()

      // Load project data
      if (projectId) {
        const project = await getProjectById(projectId)
        if (project) {
          setProjectData(project)
        }
      }

      // Load company data
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        const { data: companySettings } = await supabase
          .from("user_company_settings")
          .select("company_name, company_logo_url, company_tax_id, company_address, company_phone, company_email")
          .eq("user_id", user.id)
          .single()

        if (companySettings) {
          setCompanyData(companySettings)
        }
      }
    }

    fetchData()
  }, [projectId])

  useEffect(() => {
    if (!Array.isArray(validRooms) || validRooms.length === 0) return

    const initialPrices: Record<string, string> = {}
    const initialDimensions: Record<string, { width: string; height: string }> = {}

    validRooms.forEach((room) => {
      if (!room || !Array.isArray(room.windows)) return

      room.windows.forEach((window) => {
        if (!window || !window.id) return

        const priceFormatted = (window.price || 0).toFixed(2).replace(".", ",")
        const priceParts = priceFormatted.split(",")
        const priceIntegerWithSeparator = priceParts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".")
        initialPrices[window.id] = priceIntegerWithSeparator + "," + priceParts[1]

        initialDimensions[window.id] = {
          width: (window.width || 0).toFixed(2).replace(".", ","),
          height: (window.height || 0).toFixed(2).replace(".", ","),
        }
      })
    })

    setPriceInputs(initialPrices)
    setDimensionInputs(initialDimensions)
  }, [validRooms])

  const addWindow = (roomId: string) => {
    const room = validRooms.find((r) => r.id === roomId)
    if (!room) return

    const defaultWidth = 1.2
    const defaultHeight = 1.2
    const sqm = defaultWidth * defaultHeight
    const country = userProfile?.country || "ES"
    const pricePerSqm = WINDOW_PRICE_PER_SQM[country] || WINDOW_PRICE_PER_SQM.default
    const estimatedPrice = sqm * pricePerSqm

    const newWindow: Window = {
      id: crypto.randomUUID(), // Usando crypto.randomUUID() en lugar de uuidv4()
      width: defaultWidth,
      height: defaultHeight,
      type: "Oscilo-Batiente",
      material: "PVC",
      opening: "Oscilo-Batiente", // Added missing property
      color: "Blanco", // Added missing property
      hasBlind: true,
      glassType: "Doble",
      hasMosquitera: false,
      description: `Ventana ${defaultWidth}x${defaultHeight} detectada`, // Updated description
      price: estimatedPrice, // Precio calculado automáticamente
      innerColor: "Blanco",
      outerColor: "Blanco",
      hasCatFlap: false,
      hasFixedPanel: false,
      hasMotor: false, // Añadido motor eléctrico por defecto
    }

    const currentWindows = Array.isArray(room.windows) ? room.windows : []
    const updatedWindows = [...currentWindows, newWindow]
    updateRoom(roomId, { windows: updatedWindows })
  }

  const removeWindow = (roomId: string, windowId: string) => {
    const room = validRooms.find((r) => r.id === roomId)
    if (!room) return

    if (!Array.isArray(room.windows)) {
      updateRoom(roomId, { windows: [] })
      return
    }

    const updatedWindows = room.windows.filter((w) => w.id !== windowId)
    updateRoom(roomId, { windows: updatedWindows })
  }

  const updateWindow = (roomId: string, windowId: string, updates: Partial<Window>) => {
    const room = validRooms.find((r) => r.id === roomId)
    if (!room) return

    if (!Array.isArray(room.windows)) {
      updateRoom(roomId, { windows: [] })
      return
    }

    const updatedWindows = room.windows.map((w) => (w.id === windowId ? { ...w, ...updates } : w))
    updateRoom(roomId, { windows: updatedWindows })
  }

  const handlePriceChange = (roomId: string, windowId: string, value: string) => {
    // Remove everything except numbers and comma
    const cleanValue = value.replace(/[^0-9,]/g, "")

    // Split by comma to handle decimals
    const parts = cleanValue.split(",")

    // Format the integer part with thousands separator
    let integerPart = parts[0].replace(/\./g, "") // Remove existing dots
    if (integerPart) {
      integerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ".")
    }

    // Reconstruct the value
    let formattedValue = integerPart
    if (parts.length > 1) {
      formattedValue += "," + parts[1].slice(0, 2) // Only allow 2 decimal places
    }

    setPriceInputs((prev) => ({ ...prev, [windowId]: formattedValue }))
  }

  const handlePriceBlur = (roomId: string, windowId: string) => {
    const value = priceInputs[windowId] || "0"
    const parsedValue = Number.parseFloat(value.replace(/\./g, "").replace(",", "."))

    if (!isNaN(parsedValue)) {
      updateWindow(roomId, windowId, { price: parsedValue })
      const formatted = parsedValue.toFixed(2).replace(".", ",")
      const parts = formatted.split(",")
      const integerWithSeparator = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".")
      setPriceInputs((prev) => ({
        ...prev,
        [windowId]: integerWithSeparator + "," + parts[1],
      }))
    } else {
      updateWindow(roomId, windowId, { price: 0 })
      setPriceInputs((prev) => ({ ...prev, [windowId]: "0,00" }))
    }
  }

  const handleExportToPDF = () => {
    console.log("[v0] handleExportToPDF - projectData:", projectData)
    console.log("[v0] handleExportToPDF - title:", projectData?.title, "client:", projectData?.client)

    const printWindow = window.open("", "_blank")
    if (!printWindow) {
      alert("Por favor, permite las ventanas emergentes para esta web.")
      return
    }

    let content = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Informe de Ventanas - ${projectData?.title || "Presupuesto"}</title>
        <style>
          body { 
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; 
            line-height: 1.6; 
            padding: 40px; 
            color: #333;
            background-color: #fff;
          }
          .header {
            border-bottom: 3px solid #ff6b35;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          .header h1 { 
            color: #ff6b35;
            margin: 0 0 10px 0;
            font-size: 28px;
          }
          .header-info {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            font-size: 14px;
            margin-top: 10px;
          }
          .header-info p {
            margin: 5px 0;
          }
          .header-label {
            font-weight: bold;
            color: #666;
          }
          h2 { 
            color: #333; 
            border-top: 2px solid #eee;
            padding-top: 15px;
            margin-top: 25px;
          }
          h2:first-of-type {
            border-top: none;
            padding-top: 0;
            margin-top: 0;
          }
          table { 
            width: 100%; 
            border-collapse: collapse; 
            margin-top: 15px;
            font-size: 13px;
          }
          th, td { 
            border: 1px solid #ddd; 
            padding: 10px; 
            text-align: left;
          }
          th { 
            background-color: #f5f5f5;
            font-weight: bold;
            color: #333;
          }
          tr:nth-child(even) { background-color: #fafafa; }
          .description-cell { 
            background-color: #f9f9f9; 
            font-style: italic; 
            color: #666; 
            font-size: 12px;
          }
          .price-col { 
            text-align: right; 
            white-space: nowrap;
            font-weight: 500;
          }
          .total { 
            font-weight: bold; 
            font-size: 16px; 
            margin-top: 25px; 
            padding: 15px;
            background-color: #f0f0f0;
            text-align: right;
            border-radius: 5px;
          }
          .room-title { 
            background-color: #ffe8db;
            padding: 12px;
            margin-top: 20px;
            font-size: 16px;
            font-weight: bold;
            border-radius: 5px;
            border-left: 4px solid #ff6b35;
          }
          .notes-section {
            margin-top: 30px;
            padding: 15px;
            background-color: #f9f9f9;
            border-left: 4px solid #ff6b35;
            font-size: 13px;
            line-height: 1.6;
          }
          .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            text-align: center;
            font-size: 12px;
            color: #999;
          }
          @media print {
            @page { size: A4; margin: 20mm; }
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <!-- Add company header with logo and data -->
          ${companyData?.company_name
        ? `
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; padding-bottom: 15px; border-bottom: 2px solid #e5730e;">
            ${companyData?.company_logo_url
          ? `
            <div style="flex-shrink: 0;">
              <img src="${companyData.company_logo_url}" alt="Logo" style="max-height: 60px; max-width: 150px; object-fit: contain;" crossorigin="anonymous" />
            </div>
            `
          : ""
        }
            <div style="text-align: right; font-size: 11px; color: #666;">
              <div style="font-weight: bold; font-size: 14px; color: #333; margin-bottom: 4px;">${companyData.company_name}</div>
              ${companyData?.company_tax_id ? `<div>CIF/NIF: ${companyData.company_tax_id}</div>` : ""}
              ${companyData?.company_address ? `<div>${companyData.company_address}</div>` : ""}
              ${companyData?.company_phone ? `<div>Tel: ${companyData.company_phone}</div>` : ""}
              ${companyData?.company_email ? `<div>${companyData.company_email}</div>` : ""}
            </div>
          </div>
          `
        : ""
      }
          <h1>Informe de Ventanas</h1>
          <div class="header-info">
            <p><span class="header-label">Proyecto:</span> ${projectData?.title || "Sin nombre"}</p>
            <p><span class="header-label">Cliente:</span> ${projectData?.client || "Sin especificar"}</p>
            <!-- Add project address -->
            ${projectData?.street || projectData?.city
        ? `
            <p><span class="header-label">Dirección:</span> ${[projectData?.street, projectData?.city, projectData?.postalCode].filter(Boolean).join(", ")}</p>
            `
        : ""
      }
          </div>
        </div>
    `

    if (!validRooms || validRooms.length === 0 || !validRooms.some((r) => r.windows && r.windows.length > 0)) {
      content += `<p style="text-align: center; color: #999; padding: 30px;">No hay ventanas registradas en este proyecto.</p>`
    } else {
      validRooms.forEach((room) => {
        if (room.windows && room.windows.length > 0) {
          content += `<div class="room-title">${room.customRoomType || `${room.type} ${room.number}`}</div>`
          content += `
            <table>
              <thead>
                <tr>
                  <th>Tipo</th>
                  <th>Medidas (Ancho x Alto)</th>
                  <th>Abertura</th>
                  <th>Material</th>
                  <th>Color (Int/Ext)</th>
                  <th>Extras</th>
                  ${!isOwner ? '<th class="price-col">Precio</th>' : ""}
                </tr>
              </thead>
              <tbody>
          `
          room.windows.forEach((window) => {
            const extras = []
            if (window.hasBlind) extras.push("Persiana")
            if (window.hasFixedPanel) extras.push("Fijo")
            if (window.hasMotor) extras.push("Motor")
            if (window.hasMosquitera) extras.push("Mosquitera")
            if (window.hasCatFlap) extras.push("Gatera")
            const glassTypeDisplayMap: Record<string, string> = {
              Sencillo: "Ventana Sencilla",
              Doble: "Ventana Doble",
              "Puerta Balcón": "Puerta de Balcón",
            }
            const displayGlassType = glassTypeDisplayMap[window.glassType] || window.glassType

            content += `
              <tr>
                <td>${displayGlassType}</td>
                <td>${window.width.toFixed(2).replace(".", ",")}m x ${window.height.toFixed(2).replace(".", ",")}m</td>
                <td>${window.type}</td>
                <td>${window.material}</td>
                <td>${window.innerColor || "Blanco"} / ${window.outerColor || "Blanco"}</td>
                <td>${extras.join(", ") || "Ninguno"}</td>
                ${!isOwner ? `<td class="price-col">${(window.price || 0).toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €</td>` : ""}
              </tr>
            `
            if (window.description) {
              content += `<tr><td colspan="${!isOwner ? "7" : "6"}" class="description-cell">${window.description}</td></tr>`
            }
          })
          content += `</tbody></table>`
        }
      })

      if (!isOwner) {
        content += `<div class="total">Coste Total: ${totalCost.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} € (sin IVA)</div>`
      }
    }

    content += `<div class="notes-section"><p>${generalNotes.replace(/\n/g, "<br>")}</p></div>`
    content += `
      <div class="footer">
        <p>Generado por Presupuéstalo - ${new Date().toLocaleDateString("es-ES")}</p>
      </div>
    `
    content += `</body></html>`

    printWindow.document.open()
    printWindow.document.write(content)
    printWindow.document.close()

    printWindow.onload = () => {
      printWindow.focus()
      printWindow.print()
    }
  }

  const totalCost = useMemo(() => {
    if (!Array.isArray(validRooms) || validRooms.length === 0) return 0

    return validRooms.reduce((total, room) => {
      if (!room || !room.windows) return total
      const roomTotal = Array.isArray(room.windows)
        ? room.windows.reduce((sum, window) => sum + (window?.price || 0), 0)
        : 0
      return total + roomTotal
    }, 0)
  }, [validRooms])

  const handleDimensionChange = (windowId: string, dimension: "width" | "height", value: string) => {
    const sanitizedValue = value.replace(/[^0-9,]/g, "").replace(/,(.*?),/g, "$1,")
    setDimensionInputs((prev) => ({
      ...prev,
      [windowId]: {
        ...prev[windowId],
        [dimension]: sanitizedValue,
      },
    }))
  }

  const handleDimensionBlur = (roomId: string, windowId: string, dimension: "width" | "height") => {
    const value = dimensionInputs[windowId]?.[dimension] || "0"
    const parsedValue = Number.parseFloat(value.replace(",", "."))

    if (!isNaN(parsedValue) && parsedValue > 0) {
      updateWindow(roomId, windowId, { [dimension]: parsedValue })

      const room = validRooms.find((r) => r.id === roomId)
      if (room) {
        const window = room.windows?.find((w) => w.id === windowId)
        if (window) {
          const newWidth = dimension === "width" ? parsedValue : window.width
          const newHeight = dimension === "height" ? parsedValue : window.height
          const sqm = newWidth * newHeight

          const country = userProfile?.country || "ES"
          const pricePerSqm = WINDOW_PRICE_PER_SQM[country] || WINDOW_PRICE_PER_SQM.default
          const estimatedPrice = sqm * pricePerSqm

          if (window.price === 0 || !window.price) {
            updateWindow(roomId, windowId, { price: estimatedPrice })
            setPriceInputs((prev) => ({
              ...prev,
              [windowId]: estimatedPrice.toFixed(2).replace(".", ","),
            }))
          }
        }
      }

      setDimensionInputs((prev) => ({
        ...prev,
        [windowId]: {
          ...prev[windowId],
          [dimension]: parsedValue.toFixed(2).replace(".", ","),
        },
      }))
    } else {
      updateWindow(roomId, windowId, { [dimension]: 0.1 })
      setDimensionInputs((prev) => ({
        ...prev,
        [windowId]: {
          ...prev[windowId],
          [dimension]: "0,10",
        },
      }))
    }
  }

  const formatPrice = (price: number): string => {
    return Math.round(price)
      .toString()
      .replace(/\B(?=(\d{3})+(?!\d))/g, ".")
  }

  if (profileLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Ventanas</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Cargando configuración...</p>
        </CardContent>
      </Card>
    )
  }

  if (!Array.isArray(validRooms)) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Ventanas</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Cargando datos de ventanas...</p>
        </CardContent>
      </Card>
    )
  }

  if (validRooms.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Gestión de Ventanas</CardTitle>
          <div className="flex flex-wrap gap-2 mt-3">
            <Button onClick={onAddStandaloneWindow} variant="default" size="sm" className="bg-orange-600 hover:bg-orange-700">
              <Plus className="h-4 w-4 mr-2" />
              Añadir Ventana
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 border-2 border-dashed rounded-lg bg-slate-50/50">
            <p className="text-muted-foreground mb-4">
              No hay ventanas registradas todavía.
            </p>
            <p className="text-sm text-slate-500 max-w-md mx-auto">
              Puedes añadir ventanas habitación por habitación desde la pestaña de "Reforma",
              o usar el botón superior para añadir ventanas sueltas (por ejemplo, si solo vas a cambiar carpintería).
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Gestión de Ventanas</CardTitle>
          <div className="flex gap-2 mt-3">
            {/* Export PDF button */}
            <Button onClick={handleExportToPDF} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Exportar a PDF
            </Button>
            {/* Add Standalone Window button */}
            <Button onClick={onAddStandaloneWindow} variant="default" size="sm" className="bg-orange-600 hover:bg-orange-700">
              <Plus className="h-4 w-4 mr-2" />
              Añadir Ventana
            </Button>
          </div>
          {isOwner && (
            <div className="flex items-start gap-2 mt-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <Info className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-amber-800">
                <strong>Estimación orientativa:</strong> El coste se calcula de forma aproximada en base a las
                dimensiones de cada ventana, incluyendo suministro, retirada y colocación. Para obtener un presupuesto
                definitivo, recomendamos consultar con un profesional especializado en carpintería metálica.
              </p>
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.isArray(validRooms) &&
            validRooms.map((room) => (
              <div key={room.id} className="border p-4 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-semibold">{room.customRoomType || `${room.type} ${room.number}`}</h4>
                  <Button size="sm" onClick={() => addWindow(room.id)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Añadir Ventana
                  </Button>
                </div>
                <div className="space-y-4">
                  {Array.isArray(room.windows) &&
                    room.windows.map((window) => (
                      <div key={window.id} className="border-t pt-4 space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-4">
                          {/* Glass Type Selection */}
                          <div className="space-y-2">
                            <Label className="text-xs font-semibold">Tipo</Label>
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                              {glassTypes.map((type) => (
                                <Button
                                  key={type}
                                  variant={window.glassType === type ? "default" : "outline"}
                                  className={`h-auto flex flex-col items-center justify-center p-2 gap-1 transition-colors ${window.glassType === type
                                    ? "bg-primary text-primary-foreground hover:bg-primary/75"
                                    : "border-2 hover:bg-primary hover:text-primary-foreground hover:border-primary"
                                    }`}
                                  onClick={() => {
                                    const updates: Partial<Window> = { glassType: type }
                                    if (type === "Puerta Balcón" && window.height < 2) {
                                      updates.height = 2.2
                                      // Recalcular precio con nueva altura
                                      const pricePerSqm =
                                        WINDOW_PRICE_PER_SQM[userProfile?.country || "ES"] ||
                                        WINDOW_PRICE_PER_SQM.default
                                      updates.price = Math.round(window.width * 2.2 * pricePerSqm)
                                    }
                                    updateWindow(room.id, window.id, updates)
                                  }}
                                >
                                  {glassTypeIcons[type]}
                                  <span className="text-xs">{type}</span>
                                  {window.glassType === type && (
                                    <span className="h-3 w-3 absolute top-1 right-1 text-primary-foreground">✓</span>
                                  )}
                                </Button>
                              ))}
                            </div>
                          </div>
                          {/* Window Type Selection */}
                          <div className="space-y-2 md:col-span-2">
                            <Label className="text-xs font-semibold">Abertura</Label>
                            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
                              {windowTypes.map((type) => (
                                <Button
                                  key={type}
                                  variant={window.type === type ? "default" : "outline"}
                                  className={`h-auto flex flex-col items-center justify-center p-2 gap-1 transition-colors ${window.type === type
                                    ? "bg-primary text-primary-foreground hover:bg-primary/75"
                                    : "border-2 hover:bg-primary hover:text-primary-foreground hover:border-primary"
                                    }`}
                                  onClick={() => updateWindow(room.id, window.id, { type: type as any })}
                                >
                                  {windowTypeIcons[type]}
                                  <span className="text-[10px] sm:text-xs text-center leading-tight">{type}</span>
                                  {window.type === type && (
                                    <span className="h-3 w-3 absolute top-1 right-1 text-primary-foreground">✓</span>
                                  )}
                                </Button>
                              ))}
                            </div>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-3 items-end pt-2">
                          <div className="space-y-1">
                            <Label htmlFor={`window-width-${window.id}`} className="text-xs">
                              Ancho (m)
                            </Label>
                            <Input
                              id={`window-width-${window.id}`}
                              type="text"
                              inputMode="decimal"
                              value={dimensionInputs[window.id]?.width || ""}
                              onChange={(e) => handleDimensionChange(window.id, "width", e.target.value)}
                              onBlur={() => handleDimensionBlur(room.id, window.id, "width")}
                              placeholder="0,00"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label htmlFor={`window-height-${window.id}`} className="text-xs">
                              Alto (m)
                            </Label>
                            <Input
                              id={`window-height-${window.id}`}
                              type="text"
                              inputMode="decimal"
                              value={dimensionInputs[window.id]?.height || ""}
                              onChange={(e) => handleDimensionChange(window.id, "height", e.target.value)}
                              onBlur={() => handleDimensionBlur(room.id, window.id, "height")}
                              placeholder="0,00"
                            />
                          </div>
                          {/* Material */}
                          <div className="space-y-1">
                            <Label htmlFor={`window-material-${window.id}`} className="text-xs">
                              Material
                            </Label>
                            <Select
                              value={window.material}
                              onValueChange={(value) =>
                                updateWindow(room.id, window.id, { material: value as Window["material"] })
                              }
                            >
                              <SelectTrigger id={`window-material-${window.id}`}>
                                <SelectValue placeholder="Material" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItemType value="Aluminio">Aluminio</SelectItemType>
                                <SelectItemType value="PVC">PVC</SelectItemType>
                                <SelectItemType value="Madera">Madera</SelectItemType>
                              </SelectContent>
                            </Select>
                          </div>
                          {/* Inner Color */}
                          <div className="space-y-1">
                            <Label htmlFor={`window-inner-color-${window.id}`} className="text-xs">
                              Color Interior
                            </Label>
                            <Select
                              value={window.innerColor || "Blanco"}
                              onValueChange={(value) =>
                                updateWindow(room.id, window.id, { innerColor: value as WindowColor })
                              }
                            >
                              <SelectTrigger id={`window-inner-color-${window.id}`}>
                                <SelectValue placeholder="Color interior" />
                              </SelectTrigger>
                              <SelectContent>
                                {windowColors.map((color) => (
                                  <SelectItemType key={color} value={color}>
                                    {color}
                                  </SelectItemType>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          {/* Outer Color */}
                          <div className="space-y-1">
                            <Label htmlFor={`window-outer-color-${window.id}`} className="text-xs">
                              Color Exterior
                            </Label>
                            <Select
                              value={window.outerColor || "Blanco"}
                              onValueChange={(value) =>
                                updateWindow(room.id, window.id, { outerColor: value as WindowColor })
                              }
                            >
                              <SelectTrigger id={`window-outer-color-${window.id}`}>
                                <SelectValue placeholder="Color exterior" />
                              </SelectTrigger>
                              <SelectContent>
                                {windowColors.map((color) => (
                                  <SelectItemType key={color} value={color}>
                                    {color}
                                  </SelectItemType>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-3 items-start pt-2">
                          <div className="space-y-1 md:col-span-2">
                            <Label htmlFor={`window-desc-${window.id}`} className="text-xs">
                              Descripción del producto
                            </Label>
                            <Input
                              id={`window-desc-${window.id}`}
                              placeholder="Ej: Ventana PVC, doble cristal climalit, oscilobatiente..."
                              value={window.description || ""}
                              onChange={(e) => updateWindow(room.id, window.id, { description: e.target.value })}
                              className="text-xs"
                              rows={2}
                            />
                          </div>
                          {!isOwner && (
                            <div className="space-y-1">
                              <Label htmlFor={`window-price-${window.id}`} className="text-xs font-semibold">
                                Precio (€)
                              </Label>
                              <Input
                                id={`window-price-${window.id}`}
                                type="text"
                                inputMode="decimal"
                                value={priceInputs[window.id] || ""}
                                onChange={(e) => handlePriceChange(room.id, window.id, e.target.value)}
                                onBlur={() => handlePriceBlur(room.id, window.id)}
                                placeholder="0,00"
                              />
                            </div>
                          )}
                        </div>
                        {/* Window Photo Upload */}
                        <WindowPhotoUpload projectId={projectId || ""} windowId={window.id} roomId={room.id} />
                        {/* Checkboxes and Actions */}
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pt-2 gap-2">
                          <div className="flex flex-wrap items-center gap-3 sm:gap-6">
                            {/* Blind */}
                            <div className="flex items-center space-x-2">
                              <input
                                id={`window-blind-${window.id}`}
                                type="checkbox"
                                checked={window.hasBlind}
                                onChange={(e) => updateWindow(room.id, window.id, { hasBlind: e.target.checked })}
                              />
                              <Label htmlFor={`window-blind-${window.id}`} className="text-xs cursor-pointer">
                                Persiana
                              </Label>
                            </div>
                            {/* Fixed */}
                            <div className="flex items-center space-x-2">
                              <input
                                id={`window-fixed-${window.id}`}
                                type="checkbox"
                                checked={window.hasFixedPanel || false}
                                onChange={(e) => updateWindow(room.id, window.id, { hasFixedPanel: e.target.checked })}
                              />
                              <Label htmlFor={`window-fixed-${window.id}`} className="text-xs cursor-pointer">
                                Fijo
                              </Label>
                            </div>
                            {/* Mosquitera */}
                            <div className="flex items-center space-x-2">
                              <input
                                id={`window-mosquitera-${window.id}`}
                                type="checkbox"
                                checked={window.hasMosquitera}
                                onChange={(e) => updateWindow(room.id, window.id, { hasMosquitera: e.target.checked })}
                              />
                              <Label htmlFor={`window-mosquitera-${window.id}`} className="text-xs cursor-pointer">
                                Mosquitera
                              </Label>
                            </div>
                            {/* Gatera */}
                            {window.glassType === "Puerta Balcón" && (
                              <div className="flex items-center space-x-2">
                                <input
                                  id={`window-catflap-${window.id}`}
                                  type="checkbox"
                                  checked={window.hasCatFlap}
                                  onChange={(e) => updateWindow(room.id, window.id, { hasCatFlap: e.target.checked })}
                                />
                                <Label htmlFor={`window-catflap-${window.id}`} className="text-xs cursor-pointer">
                                  Gatera
                                </Label>
                              </div>
                            )}
                            {/* Motor */}
                            <div className="flex items-center space-x-2">
                              <input
                                id={`window-motor-${window.id}`}
                                type="checkbox"
                                checked={window.hasMotor || false}
                                onChange={(e) => updateWindow(room.id, window.id, { hasMotor: e.target.checked })}
                              />
                              <Label htmlFor={`window-motor-${window.id}`} className="text-xs cursor-pointer">
                                Motor
                              </Label>
                            </div>
                          </div>
                          {/* Actions */}
                          <div>
                            <Button variant="ghost" size="icon" onClick={() => removeWindow(room.id, window.id)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  {(!room.windows || !Array.isArray(room.windows) || room.windows.length === 0) && (
                    <p className="text-xs text-muted-foreground">No hay ventanas en esta habitación.</p>
                  )}
                </div>
              </div>
            ))}
        </CardContent>
      </Card>
      <Card className="mt-6 border-orange-200 bg-orange-50">
        <WindowReporting
          projectId={projectId || ""}
          windows={validRooms.flatMap((r) => r.windows || [])}
          projectName={projectData?.title}
          projectAddress={projectData?.city || projectData?.project_address}
          companyName={companyData?.company_name}
          companyEmail={companyData?.company_email}
          companyPhone={companyData?.company_phone}
        />
      </Card>
    </>
  )
}
