"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Plus, Trash2, Download, Loader2, Sparkles, ChevronUp, ChevronDown, PenTool, Building2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { supabase } from "@/lib/supabase/client"
import { getSubscriptionLimits } from "@/lib/services/subscription-limits-service"
import { AIPriceImportDialog } from "@/components/precios/ai-price-import-dialog"
import { Badge } from "@/components/ui/badge"
import { Lock } from "lucide-react"
import { SignaturePad } from "@/components/ui/signature-pad"

interface ContractClause {
  id?: string
  clause_number: number
  clause_text: string
  is_custom: boolean
}

interface ContractData {
  id?: string
  project_id: string
  budget_id?: string
  contract_data: any
  clauses: ContractClause[]
  signed_date?: string
  status: string
  client_signature_url?: string | null
  company_signature_url?: string | null
}

interface ContractTabProps {
  projectId: string
  projectData: any
  acceptedBudget: any
}

const DEFAULT_CLAUSES = [
  "Por el presente contrato, LA EMPRESA se compromete a reformar el inmueble que se especifica en el presupuesto anexo propiedad del CLIENTE, de acuerdo con las condiciones establecidas en el presente documento.",
  "Los materiales contratados son únicamente los que se pactan con el cliente, por lo que cualquier variación que se produzca durante la instalación y ejecución de los trabajos irá a cargo del CLIENTE. Previa comunicación y aceptación por parte del CLIENTE.",
  "Las reformas y las instalaciones se realizarán de acuerdo con el plano técnico. Cualquier modificación hecha podrá comportar una modificación del presupuesto previamente aceptado por el CLIENTE.",
  "La EMPRESA está obligada a: a) Ejecutar la obra con sujeción al proyecto inicial elaborado b) Suministrar la mano de obra necesaria para la realización de la obra encargada c) Cumplir con todas las obligaciones de carácter laboral que imponga la Ley y especialmente las de prevención de riesgos laborales.",
  "El CLIENTE se compromete a satisfacer el valor del presupuesto adjunto y firmado por ambas partes. Extras e I.V.A. no incluidos.",
  "En este Presupuesto y contrato, se aplicará una garantía según lo establecido por la LOE, referida exclusivamente a la mano de obra y trabajos de instalaciones y reformas. Los materiales, mobiliario y accesorios instalados tendrán la garantía que en cada caso establezca el respectivo fabricante, y/o vendedor. La garantía quedará extinguida en caso de una inadecuada utilización por parte del CLIENTE o por reparación o manipulación con personas ajenas a la EMPRESA.",
  "Todos los materiales, mobiliario y accesorios serán propiedad de la EMPRESA que se reserva su dominio, mientras no se haya pagado la totalidad del precio, siendo el CLIENTE únicamente su depositario hasta el momento.",
  "El CLIENTE facilitará a su cargo el suministro de agua y electricidad mientras duren las obras.",
  "La EMPRESA se hace responsable de los daños en concepto de responsabilidad civil, a ella imputable, reservándose el derecho a ejercer las acciones más adecuadas cuando haya sido perjudicada por el mismo concepto.",
  "La EMPRESA no se hace cargo ni responsable de los imprevistos que puedan surgir en el transcurso de las obras e instalaciones que no hayan estado visibles (vicios ocultos) y comprobadas antes de la firma de este contrato, tales como humedad de paredes, filtraciones de agua, conductos subterráneos, desguaces, conducciones eléctricas subterráneas, aislamientos, cambios de lugar de contadores eléctricos y de gas sin el debido permiso de las respectivas compañías contratadas por el cliente, y paredes en el ajuste de muebles.",
  "La EMPRESA declara que mantiene con sus trabajadores o en su caso con sus colaboradores o empresas subcontratadas la relación laboral o mercantil que en su caso proceda, siempre de acuerdo a la legislación española.",
  "Serán causa de resolución del contrato el incumplimiento de las obligaciones reflejadas en el presente contrato, pudiendo la parte no incumplidora exigir su cumplimiento, u optar por su resolución, con indemnización de los daños y perjuicios ocasionados. En todo lo no expresamente pactado en el presente contrato, se estará a lo dispuesto en el Código Civil y demás normas que sean de aplicación.",
  "En caso de discrepancias y de no existir acuerdo en la aplicación o interpretación del presente contrato, la EMPRESA y el CLIENTE se someten voluntariamente al arbitraje de la Junta Arbitral de Consumo que corresponda, sin renunciar, en cualquier caso, a sus propios fueros.",
  "La EMPRESA solicitará al CLIENTE permiso para poder hacer fotografías y video documental de la obra para hacer un seguimiento y publicarlas en su página web y en redes sociales, jamás indicando nombres de clientes ni dirección según ley de protección de datos.",
  "El CLIENTE se compromete a solicitar todos los permisos y licencias necesarios para llevar a cabo la reforma acordada en este contrato. Todos los costos asociados con la obtención de dichos permisos y licencias serán responsabilidad exclusiva del Cliente",
  "En caso q el cliente proporcione total o parcialmente los materiales necesarios para la ejecución de la obra , la empresa no asumira responsabilidad ni otorgara garantia alguna sobre efectos ,fallos, vicios ocultos ,calidad , resistencia o durabilidad,de dichos materiales ,asi mismo ,la empresa queda exenta de toda garantia",
]

export function ContractTab({ projectId, projectData, acceptedBudget }: ContractTabProps) {
  const [contract, setContract] = useState<ContractData | null>(null)
  const [clauses, setClauses] = useState<ContractClause[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isGeneratingClause, setIsGeneratingClause] = useState(false)
  const [isExportingPDF, setIsExportingPDF] = useState(false)
  const [newClausePrompt, setNewClausePrompt] = useState("")
  const [bankAccount, setBankAccount] = useState("")
  const [clientSignature, setClientSignature] = useState<string | null>(null)
  const [companySignature, setCompanySignature] = useState<string | null>(null)
  const [signedDate, setSignedDate] = useState<string>(new Date().toISOString().split("T")[0])
  const [companyData, setCompanyData] = useState<any>(null)
  const [hasContractAccess, setHasContractAccess] = useState<boolean>(true)
  const [canUseAI, setCanUseAI] = useState<boolean>(true)
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    console.log("[v0] ContractTab mounted with:", { projectId, projectData, acceptedBudget })
    checkAccess()
    loadContract()
    loadCompanyData()
  }, [projectId])

  const checkAccess = async () => {
    try {
      const limits = await getSubscriptionLimits()
      // El contrato ahora está habilitado para todas las suscripciones (Free, Basic y Pro)
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        // Obtenemos el plan de suscripción del perfil
        const { data: profile } = await supabase.from('profiles').select('plan, subscription_plan').eq('id', user.id).single()
        const plan = (profile?.plan || profile?.subscription_plan || 'free').toLowerCase()
        const isFree = plan === 'free' || plan === 'gratuito'

        // El contrato ahora está habilitado para todas las suscripciones, pero la IA no para los free
        setHasContractAccess(true)
        setCanUseAI(!isFree)
      }
    } catch (error) {
      console.error("Error checking contract access:", error)
    }
  }

  const loadContract = async () => {
    try {
      setIsLoading(true)
      console.log("[v0] Loading contract for project:", projectId)

      const { data: contractData, error: contractError } = await supabase
        .from("contracts")
        .select("*")
        .eq("project_id", projectId)
        .maybeSingle()

      if (contractError && contractError.code !== "PGRST116") {
        console.error("[v0] Error loading contract:", contractError)
        throw contractError
      }

      if (contractData) {
        console.log("[v0] Contract found:", contractData)
        setContract(contractData)
        setClauses(contractData.contract_data?.clauses || [])
        setBankAccount(contractData.contract_data?.bank_account || "")
        setClientSignature(contractData.client_signature_url || null)
        setCompanySignature(contractData.company_signature_url || null)
        if (contractData.signed_date) setSignedDate(contractData.signed_date)
      } else {
        // Initialize with default clauses
        console.log("[v0] No contract found, initializing with default clauses:", DEFAULT_CLAUSES.length)
        const defaultClauses = DEFAULT_CLAUSES.map((text, index) => ({
          clause_number: index + 1,
          clause_text: text,
          is_custom: false,
        }))
        setClauses(defaultClauses)
        console.log("[v0] Default clauses set:", defaultClauses.length)
      }
    } catch (error) {
      console.error("[v0] Error loading contract:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadCompanyData = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        const { data: userCompanySettings, error: companyError } = await supabase
          .from("user_company_settings")
          .select(
            "company_name, company_address, company_tax_id, company_phone, company_email, company_website, company_logo_url",
          )
          .eq("user_id", user.id)
          .maybeSingle()

        if (!companyError && userCompanySettings) {
          setCompanyData(userCompanySettings)
          console.log("[v0] Company data loaded for contract:", userCompanySettings)
        }
      }
    } catch (error) {
      console.error("[v0] Error loading company data:", error)
    }
  }

  const uploadSignature = async (dataUrl: string, type: "client" | "company") => {
    if (!dataUrl || dataUrl.startsWith("http")) return dataUrl

    const response = await fetch(dataUrl)
    const blob = await response.blob()
    const { data: sessionData } = await supabase.auth.getSession()
    if (!sessionData.session) throw new Error("No session")

    const fileName = `${sessionData.session.user.id}/${projectId}/signatures/${type}_${Date.now()}.png`

    const { error: uploadError } = await supabase.storage
      .from("pdfs") // Using pdfs bucket for now as it's already configured
      .upload(fileName, blob, { contentType: "image/png" })

    if (uploadError) throw uploadError

    const { data: { publicUrl } } = supabase.storage.from("pdfs").getPublicUrl(fileName)
    return publicUrl
  }

  const handleSaveContract = async () => {
    try {
      setIsSaving(true)

      let clientSigUrl = clientSignature
      let companySigUrl = companySignature

      if (clientSignature && clientSignature.startsWith("data:")) {
        clientSigUrl = await uploadSignature(clientSignature, "client")
      }
      if (companySignature && companySignature.startsWith("data:")) {
        companySigUrl = await uploadSignature(companySignature, "company")
      }

      const contractDataToSave = {
        project_id: projectId,
        budget_id: acceptedBudget?.id,
        contract_data: {
          client_name: projectData.client,
          client_dni: projectData.client_dni,
          client_address: projectData.client_address,
          project_address: `${projectData.street}, ${projectData.project_floor ? `Planta ${projectData.project_floor},` : ""} ${projectData.door ? `Puerta ${projectData.door},` : ""} ${projectData.city}, ${projectData.province}`,
          budget_amount:
            acceptedBudget?.accepted_amount_with_vat ||
            acceptedBudget?.accepted_amount_without_vat ||
            acceptedBudget?.total_with_vat ||
            acceptedBudget?.total_without_vat ||
            0,
          bank_account: bankAccount,
          clauses: clauses, // Store clauses directly in contract_data
        },
        client_signature_url: clientSigUrl,
        company_signature_url: companySigUrl,
        signed_date: signedDate,
        status: (clientSigUrl && companySigUrl) ? "signed" : "draft",
      }

      const { data, error } = await supabase
        .from("contracts")
        .upsert(contractDataToSave, { onConflict: "project_id" })
        .select()
        .single()

      if (error) throw error

      setContract(data) // Update local contract state with the new data
      setClientSignature(clientSigUrl)
      setCompanySignature(companySigUrl)

      toast({
        title: "Contrato guardado",
        description: (clientSigUrl && companySigUrl) ? "El contrato ha sido firmado y guardado" : "El borrador ha sido guardado",
      })
    } catch (error: any) {
      console.error("Error saving contract:", error)
      toast({
        title: "Error al guardar",
        description: error.message || "No se pudo guardar el contrato",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleAddClause = () => {
    const newClause: ContractClause = {
      clause_number: clauses.length + 1,
      clause_text: "",
      is_custom: true,
    }
    setClauses([...clauses, newClause])
  }

  const handleGenerateClauseWithAI = async () => {
    if (!newClausePrompt.trim()) {
      toast({
        title: "Prompt vacío",
        description: "Escribe una descripción de la cláusula que quieres generar",
        variant: "destructive",
      })
      return
    }

    try {
      setIsGeneratingClause(true)

      const response = await fetch("/api/ia/generate-clause", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt: newClausePrompt }),
      })

      if (!response.ok) {
        throw new Error("Error al generar cláusula")
      }

      const { text } = await response.json()

      const newClause: ContractClause = {
        clause_number: clauses.length + 1,
        clause_text: text,
        is_custom: true,
      }

      setClauses([...clauses, newClause])
      setNewClausePrompt("")

      toast({
        title: "Cláusula generada",
        description: "La cláusula se ha generado con IA correctamente",
      })
    } catch (error) {
      console.error("Error generating clause:", error)
      toast({
        title: "Error",
        description: "No se pudo generar la cláusula con IA",
        variant: "destructive",
      })
    } finally {
      setIsGeneratingClause(false)
    }
  }

  const handleUpdateClause = (index: number, text: string) => {
    const updatedClauses = [...clauses]
    updatedClauses[index].clause_text = text
    setClauses(updatedClauses)
  }

  const handleDeleteClause = (index: number) => {
    const updatedClauses = clauses.filter((_, i) => i !== index)
    // Renumber clauses
    updatedClauses.forEach((clause, i) => {
      clause.clause_number = i + 1
    })
    setClauses(updatedClauses)
  }

  const handleExportPDF = async () => {
    try {
      setIsExportingPDF(true)

      // Dynamic import to avoid SSR issues
      const html2pdf = (await import("html2pdf.js")).default

      const element = document.getElementById("contract-print-view")
      if (!element) {
        throw new Error("Contract content not found")
      }

      element.style.position = "relative"
      element.style.left = "0"
      element.style.visibility = "visible"
      element.style.zIndex = "9999"

      // Wait for fonts and images to load
      await new Promise((resolve) => setTimeout(resolve, 500))

      const opt = {
        margin: [15, 10, 15, 10] as [number, number, number, number], // top, left, bottom, right in mm
        filename: `contrato-${projectData.client || "cliente"}-${new Date().toISOString().split("T")[0]}.pdf`,
        image: { type: "jpeg" as const, quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          letterRendering: true,
          logging: false,
          width: 794, // A4 width in pixels at 96 DPI
          windowWidth: 794,
        },
        jsPDF: { unit: "mm" as const, format: "a4" as const, orientation: "portrait" as const },
        pagebreak: { mode: ["avoid-all", "css", "legacy"] as any },
      }

      await html2pdf().set(opt).from(element).save()

      element.style.position = "absolute"
      element.style.left = "0"
      element.style.visibility = "hidden"
      element.style.zIndex = "-9999"

      toast({
        title: "PDF exportado",
        description: "El contrato se ha exportado correctamente",
      })
    } catch (error) {
      console.error("Error exporting PDF:", error)
      toast({
        title: "Error",
        description: "No se pudo exportar el PDF",
        variant: "destructive",
      })
    } finally {
      setIsExportingPDF(false)
    }
  }

  const handleMoveClauseUp = (index: number) => {
    if (index === 0) return // Can't move first clause up

    const updatedClauses = [...clauses]
    // Swap with previous clause
    const temp = updatedClauses[index]
    updatedClauses[index] = updatedClauses[index - 1]
    updatedClauses[index - 1] = temp

    // Renumber clauses
    updatedClauses.forEach((clause, i) => {
      clause.clause_number = i + 1
    })

    setClauses(updatedClauses)
  }

  const handleMoveClauseDown = (index: number) => {
    if (index === clauses.length - 1) return // Can't move last clause down

    const updatedClauses = [...clauses]
    // Swap with next clause
    const temp = updatedClauses[index]
    updatedClauses[index] = updatedClauses[index + 1]
    updatedClauses[index + 1] = temp

    // Renumber clauses
    updatedClauses.forEach((clause, i) => {
      clause.clause_number = i + 1
    })

    setClauses(updatedClauses)
  }

  const budgetAmount = acceptedBudget?.accepted_amount_with_vat
    ? acceptedBudget.accepted_amount_with_vat
    : acceptedBudget?.accepted_amount_without_vat
      ? acceptedBudget.accepted_amount_without_vat
      : 0

  const hasVAT =
    acceptedBudget?.accepted_includes_vat === true ||
    (acceptedBudget?.accepted_amount_with_vat && !acceptedBudget?.accepted_amount_without_vat)

  const vatText = hasVAT ? "IVA incluido" : "IVA no incluido"

  console.log("[v0] Rendering contract with:", {
    clausesCount: clauses.length,
    budgetAmount,
    hasVAT,
    acceptedBudget,
    isLoading,
  })

  if (!hasContractAccess) {
    return (
      <div className="space-y-6">
        <Card className="p-12 border-dashed bg-slate-50/50 dark:bg-slate-900/20">
          <div className="flex flex-col items-center justify-center text-center space-y-6 max-w-md mx-auto">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
              <Lock className="h-10 w-10 text-primary" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-center gap-2">
                <h3 className="text-2xl font-bold italic tracking-tight uppercase">Contrato de Obra</h3>
                <Badge className="bg-gradient-to-r from-purple-600 to-blue-600 border-none text-[10px] font-bold py-0 h-5">PRO</Badge>
              </div>
              <p className="text-muted-foreground">
                La personalización de contratos y la generación de cláusulas con IA es una función exclusiva para usuarios con plan <span className="font-semibold text-foreground italic">BASIC</span> o <span className="font-semibold text-foreground italic">PRO</span>.
              </p>
            </div>
            <div className="grid gap-4 w-full pt-2">
              <Button
                size="lg"
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 border-none shadow-md shadow-purple-500/20"
                onClick={() => setShowUpgradeDialog(true)}
              >
                <Sparkles className="mr-2 h-4 w-4 text-purple-200" />
                Desbloquear Contratos con IA
              </Button>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium">
                Protege tu negocio con textos legales profesionales
              </p>
            </div>
          </div>
        </Card>

        <AIPriceImportDialog
          open={showUpgradeDialog}
          onOpenChange={setShowUpgradeDialog}
          mode="contract"
        />
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div
        id="contract-print-view"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "794px", // A4 width in pixels
          zIndex: -9999,
          visibility: "hidden",
          backgroundColor: "white",
        }}
      >
        <div
          style={{
            fontFamily: "Arial, sans-serif",
            fontSize: "11pt",
            width: "794px",
            minHeight: "1123px", // A4 height in pixels
            padding: "56px 38px", // 15mm top/bottom, 10mm left/right converted to pixels
            lineHeight: "1.5",
            color: "#000",
            boxSizing: "border-box",
            backgroundColor: "white",
          }}
        >
          <div
            style={{
              marginBottom: "20px",
              paddingBottom: "15px",
              borderBottom: "2px solid #333",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: "20px",
            }}
          >
            <div style={{ flexShrink: 0, width: "100px" }}>
              {companyData?.company_logo_url && (
                <img
                  src={companyData.company_logo_url || "/placeholder.svg"}
                  alt="Logo"
                  style={{
                    height: "60px",
                    width: "auto",
                    objectFit: "contain",
                    maxWidth: "100px",
                    display: "block",
                  }}
                  crossOrigin="anonymous"
                />
              )}
            </div>

            <div style={{ flex: 1, textAlign: "right", minWidth: 0, maxWidth: "550px" }}>
              <div
                style={{
                  fontSize: "14pt",
                  fontWeight: "bold",
                  marginBottom: "8px",
                  wordWrap: "break-word",
                  overflowWrap: "break-word",
                  hyphens: "auto",
                }}
              >
                {companyData?.company_name || "NOMBRE DE LA EMPRESA"}
              </div>
              <div
                style={{
                  fontSize: "9pt",
                  lineHeight: "1.4",
                  wordWrap: "break-word",
                  overflowWrap: "break-word",
                  hyphens: "auto",
                }}
              >
                {companyData?.company_tax_id && (
                  <div style={{ marginBottom: "2px" }}>CIF: {companyData.company_tax_id}</div>
                )}
                {companyData?.company_address && (
                  <div style={{ marginBottom: "2px" }}>{companyData.company_address}</div>
                )}
                {companyData?.company_phone && (
                  <div style={{ marginBottom: "2px" }}>Tel: {companyData.company_phone}</div>
                )}
                {companyData?.company_email && (
                  <div style={{ marginBottom: "2px", wordBreak: "break-all" }}>Email: {companyData.company_email}</div>
                )}
                {companyData?.company_website && (
                  <div style={{ wordBreak: "break-all" }}>Web: {companyData.company_website}</div>
                )}
              </div>
            </div>
          </div>

          <h1
            style={{
              fontSize: "14pt",
              fontWeight: "bold",
              textAlign: "center",
              marginBottom: "6mm",
              marginTop: "3mm",
            }}
          >
            CONTRATO DE OBRA Y REFORMA DE INMUEBLE
          </h1>

          <div
            style={{
              marginBottom: "5mm",
              padding: "3mm",
              backgroundColor: "#f3f4f6",
              borderRadius: "2mm",
              lineHeight: "1.4",
            }}
          >
            <p style={{ fontSize: "10pt", margin: 0, textAlign: "justify" }}>
              En el presente contrato, <strong>LA EMPRESA</strong> hace referencia a la empresa contratista que
              ejecutará la obra, y <strong>EL CLIENTE</strong> hace referencia al propietario del inmueble que contrata
              los servicios.
            </p>
          </div>

          <div
            style={{
              marginBottom: "5mm",
              border: "1px solid #ddd",
              padding: "4mm",
              backgroundColor: "#f9fafb",
              borderRadius: "2mm",
            }}
          >
            <p style={{ fontWeight: "bold", marginBottom: "2mm", fontSize: "11pt" }}>
              IMPORTE DEL PRESUPUESTO ORIGINAL:
            </p>
            <p style={{ fontSize: "16pt", fontWeight: "bold", margin: "2mm 0" }}>
              {new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(budgetAmount)}
            </p>
            <p style={{ fontSize: "9pt", color: "#666", margin: 0 }}>({vatText})</p>
          </div>

          <div
            style={{
              marginBottom: "5mm",
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "5mm",
            }}
          >
            <div>
              <p style={{ fontWeight: "bold", marginBottom: "2mm", fontSize: "10pt" }}>
                A LA ATENCIÓN DE (EL CLIENTE):
              </p>
              <p style={{ fontSize: "9pt", marginBottom: "1mm", wordWrap: "break-word" }}>
                <strong>Nombre:</strong> {projectData.client || "Cliente sin nombre"}
              </p>
              <p style={{ fontSize: "9pt", marginBottom: "1mm", wordWrap: "break-word" }}>
                <strong>D.N.I.:</strong> {projectData.client_dni || "Sin DNI"}
              </p>
              <p style={{ fontSize: "9pt", wordWrap: "break-word" }}>
                <strong>Dirección:</strong> {projectData.client_address || "Sin dirección"}
              </p>
            </div>

            <div>
              <p style={{ fontWeight: "bold", marginBottom: "2mm", fontSize: "10pt" }}>DIRECCIÓN DE LA REFORMA:</p>
              <p style={{ fontSize: "9pt", wordWrap: "break-word" }}>
                {projectData.street}
                {projectData.project_floor && `, Planta ${projectData.project_floor}`}
                {projectData.door && `, Puerta ${projectData.door}`}
                {`, ${projectData.city}, ${projectData.province}`}
              </p>
            </div>
          </div>

          <div style={{ marginBottom: "5mm", marginTop: "6mm" }}>
            <h2
              style={{
                fontWeight: "bold",
                fontSize: "12pt",
                marginBottom: "4mm",
                borderBottom: "1px solid #ddd",
                paddingBottom: "2mm",
              }}
            >
              Cláusulas del Contrato
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "3mm" }}>
              {clauses.map((clause, index) => (
                <div key={index} style={{ pageBreakInside: "avoid" }}>
                  <p
                    style={{
                      textAlign: "justify",
                      lineHeight: "1.5",
                      fontSize: "10pt",
                      margin: 0,
                      wordWrap: "break-word",
                      overflowWrap: "break-word",
                    }}
                  >
                    <strong>{clause.clause_number}.-</strong> {clause.clause_text}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div
            style={{
              marginBottom: "5mm",
              borderTop: "1px solid #ddd",
              paddingTop: "4mm",
              marginTop: "6mm",
              pageBreakInside: "avoid",
            }}
          >
            <h2 style={{ fontWeight: "bold", fontSize: "11pt", marginBottom: "3mm" }}>Método de Pago</h2>
            <p style={{ marginBottom: "2mm", fontSize: "10pt", wordWrap: "break-word" }}>
              Los ingresos se realizarán a la cuenta: <strong>{bankAccount || "ES00 0000 0000 0000 0000 0000"}</strong>
            </p>
            <p style={{ fontSize: "9pt", color: "#666" }}>
              Los pagos se realizarán mediante transferencia bancaria a la cuenta indicada.
            </p>
          </div>

          <div
            style={{
              marginTop: "8mm",
              borderTop: "1px solid #ddd",
              paddingTop: "5mm",
              pageBreakInside: "avoid",
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "8mm",
                marginBottom: "6mm",
              }}
            >
              <div>
                <p style={{ fontWeight: "bold", marginBottom: "3mm", fontSize: "10pt" }}>FIRMA DEL CLIENTE:</p>
                <div style={{ borderBottom: "1px solid black", height: "18mm", marginBottom: "2mm" }}>
                  {clientSignature && (
                    <img
                      src={clientSignature}
                      alt="Firma del Cliente"
                      style={{ height: "100%", width: "auto", objectFit: "contain" }}
                    />
                  )}
                </div>
                <p style={{ fontSize: "9pt", marginBottom: "1mm" }}>
                  Nombre: {projectData.client || "_________________"}
                </p>
                <p style={{ fontSize: "9pt" }}>DNI: {projectData.client_dni || "_________________"}</p>
              </div>
              <div>
                <p style={{ fontWeight: "bold", marginBottom: "3mm", fontSize: "10pt" }}>FIRMA DE LA EMPRESA:</p>
                <div style={{ borderBottom: "1px solid black", height: "18mm", marginBottom: "2mm" }}>
                  {companySignature && (
                    <img
                      src={companySignature}
                      alt="Firma de la Empresa"
                      style={{ height: "100%", width: "auto", objectFit: "contain" }}
                    />
                  )}
                </div>
                <p style={{ fontSize: "9pt", marginBottom: "1mm" }}>Nombre: _________________</p>
                <p style={{ fontSize: "9pt" }}>Cargo: _________________</p>
              </div>
            </div>
            <div style={{ textAlign: "center", marginTop: "5mm" }}>
              <p style={{ fontWeight: "bold", marginBottom: "2mm", fontSize: "10pt" }}>FECHA DE FIRMA:</p>
              <p style={{ fontSize: "10pt" }}>{signedDate ? new Date(signedDate).toLocaleDateString('es-ES') : "_____ / _____ / _____"}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Contrato de Obra y Reforma</h3>
          <p className="text-sm text-muted-foreground">
            Genera y personaliza el contrato con el cliente basado en el presupuesto aceptado
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleExportPDF} variant="outline" disabled={isExportingPDF}>
            {isExportingPDF ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Exportando...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Exportar PDF
              </>
            )}
          </Button>
          <Button onClick={handleSaveContract} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Guardando...
              </>
            ) : (
              "Guardar Contrato"
            )}
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        <Card className="p-6">
          <h4 className="font-bold text-center text-xl mb-6">CONTRATO DE OBRA Y REFORMA DE INMUEBLE</h4>

          <div className="mb-6 p-4 bg-muted/50 rounded-lg">
            <p className="text-sm">
              En el presente contrato, <span className="font-semibold">LA EMPRESA</span> hace referencia a la empresa
              contratista que ejecutará la obra, y <span className="font-semibold">EL CLIENTE</span> hace referencia al
              propietario del inmueble que contrata los servicios.
            </p>
          </div>

          <div className="space-y-4 text-sm">
            <div>
              <p className="font-medium mb-2">IMPORTE DEL PRESUPUESTO ORIGINAL:</p>
              <p className="text-2xl font-bold text-primary">
                {new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(budgetAmount)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">({vatText})</p>
            </div>

            <div className="border-t pt-4">
              <p className="font-medium mb-2">A LA ATENCIÓN DE (EL CLIENTE):</p>
              <p>{projectData.client || "Cliente sin nombre"}</p>
              <p>D.N.I.: {projectData.client_dni || "Sin DNI"}</p>
              <p>DIRECCIÓN: {projectData.client_address || "Sin dirección"}</p>
            </div>

            <div>
              <p className="font-medium mb-2">DIRECCIÓN DE LA REFORMA:</p>
              <p>
                {projectData.street}
                {projectData.project_floor && `, Planta ${projectData.project_floor}`}
                {projectData.door && `, Puerta ${projectData.door}`}
                {`, ${projectData.city}, ${projectData.province}`}
              </p>
            </div>
          </div>
        </Card>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">Cláusulas del Contrato</h4>
            <Button onClick={handleAddClause} variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Añadir Cláusula
            </Button>
          </div>

          {clauses.map((clause, index) => (
            <Card key={index} className="p-4">
              <div className="flex items-start gap-3">
                <div className="flex flex-col gap-1 pt-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors"
                    onClick={() => handleMoveClauseUp(index)}
                    disabled={index === 0}
                  >
                    <ChevronUp className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors"
                    onClick={() => handleMoveClauseDown(index)}
                    disabled={index === clauses.length - 1}
                  >
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </div>
                <span className="font-medium text-sm pt-2 min-w-[30px]">{clause.clause_number}.-</span>
                <Textarea
                  value={clause.clause_text}
                  onChange={(e) => handleUpdateClause(index, e.target.value)}
                  className="flex-1 min-h-[80px]"
                  placeholder="Escribe el texto de la cláusula..."
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDeleteClause(index)}
                  className="mt-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all duration-200"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>

        <Card className="p-6">
          <h4 className="font-medium mb-4">Método de Pago</h4>
          <div className="space-y-4">
            <div>
              <Label htmlFor="bank-account">Cuenta bancaria para los ingresos</Label>
              <Input
                id="bank-account"
                value={bankAccount}
                onChange={(e) => setBankAccount(e.target.value)}
                placeholder="ES00 0000 0000 0000 0000 0000"
                className="mt-2 font-mono"
              />
              <p className="text-xs text-muted-foreground mt-2">
                Los ingresos se realizarán mediante transferencia bancaria a la cuenta indicada
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h4 className="font-medium mb-4">Firmas</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  <PenTool className="h-4 w-4 text-primary" />
                  Firma del Cliente
                </Label>
                {clientSignature && clientSignature.startsWith("http") && (
                  <Badge variant="outline" className="text-xs bg-green-500/10 text-green-600 border-green-200">
                    Firmado
                  </Badge>
                )}
              </div>
              <div className="h-48">
                <SignaturePad
                  onSave={setClientSignature}
                  defaultValue={clientSignature || undefined}
                  placeholder="El cliente debe firmar aquí"
                />
              </div>
              <p className="text-[10px] text-muted-foreground text-center uppercase tracking-wider">
                {projectData.client || "Nombre del Cliente"}
              </p>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-primary" />
                  Firma de la Empresa
                </Label>
                {companySignature && companySignature.startsWith("http") && (
                  <Badge variant="outline" className="text-xs bg-green-500/10 text-green-600 border-green-200">
                    Firmado
                  </Badge>
                )}
              </div>
              <div className="h-48">
                <SignaturePad
                  onSave={setCompanySignature}
                  defaultValue={companySignature || undefined}
                  placeholder="La empresa debe firmar aquí"
                />
              </div>
              <p className="text-[10px] text-muted-foreground text-center uppercase tracking-wider">
                Representante Legal
              </p>
            </div>
          </div>
          <div className="mt-8 border-t pt-6">
            <div className="max-w-xs">
              <Label htmlFor="sign-date">Fecha de Firma</Label>
              <Input
                id="sign-date"
                type="date"
                className="mt-2"
                value={signedDate}
                onChange={(e) => setSignedDate(e.target.value)}
              />
            </div>
          </div>
        </Card>
      </div>

      {canUseAI && (
        <Card className="p-6 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20 shadow-sm border-purple-100 dark:border-purple-900/50">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-600" />
              <h4 className="font-medium">Generar Cláusula con IA</h4>
            </div>
            <p className="text-sm text-muted-foreground">
              Describe qué tipo de cláusula necesitas y la IA la generará por ti
            </p>
            <div className="flex gap-2">
              <Input
                placeholder="Ej: Cláusula sobre penalizaciones por retraso en la entrega"
                value={newClausePrompt}
                onChange={(e) => setNewClausePrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault()
                    handleGenerateClauseWithAI()
                  }
                }}
              />
              <Button onClick={handleGenerateClauseWithAI} disabled={isGeneratingClause}>
                {isGeneratingClause ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generando...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generar
                  </>
                )}
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
