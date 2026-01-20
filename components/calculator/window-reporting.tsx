"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Mail, Send } from "lucide-react"
import type { Window } from "@/types/calculator"
import { Textarea } from "@/components/ui/textarea"

interface WindowReportingProps {
  projectId: string
  windows: Window[]
  projectName?: string
  projectAddress?: string
  companyName?: string
  companyEmail?: string
  companyPhone?: string
}

export function WindowReporting({
  projectId,
  windows,
  projectName,
  projectAddress,
  companyName,
  companyEmail,
  companyPhone,
}: WindowReportingProps) {
  const [hasProfessional, setHasProfessional] = useState<boolean | null>(null)
  const [professionalEmail, setProfessionalEmail] = useState("")
  const [professionalName, setProfessionalName] = useState("")
  const [description, setDescription] = useState("")
  const [homeownerEmail, setHomeownerEmail] = useState("")
  const [homeownerName, setHomeownerName] = useState("")
  const [sending, setSending] = useState(false)
  const [message, setMessage] = useState("")

  useEffect(() => {
    if (companyEmail) {
      setHomeownerEmail(companyEmail)
    }
    if (companyName) {
      setHomeownerName(companyName)
    }
  }, [companyEmail, companyName])

  const handleSendToProfessional = async () => {
    if (!professionalEmail || !windows.length) return

    setSending(true)
    setMessage("")
    try {
      const res = await fetch("/api/windows/send-report", {
        method: "POST",
        body: JSON.stringify({
          projectId,
          recipientEmail: professionalEmail,
          recipientName: professionalName,
          windows,
          description,
          projectName,
          projectAddress,
          companyName,
          companyPhone,
        }),
      })

      const data = await res.json()

      if (res.ok) {
        setMessage("✓ Informe enviado al ventanero correctamente")
        setProfessionalEmail("")
        setProfessionalName("")
        setDescription("")
      } else {
        console.error("[v0] API Error:", data)
        setMessage(`✗ ${data.error || "Error al enviar el informe"}`)
      }
    } catch (error: any) {
      console.error("[v0] Fetch Error:", error)
      setMessage(`✗ ${error.message || "Error al enviar el informe"}`)
    } finally {
      setSending(false)
    }
  }

  const handleRequestQuote = async () => {
    if (!homeownerEmail || !windows.length) return

    setSending(true)
    setMessage("")
    try {
      const res = await fetch("/api/windows/request-quote", {
        method: "POST",
        body: JSON.stringify({
          projectName,
          projectAddress,
          homeownerEmail,
          homeownerName,
          windows,
          companyName,
          companyPhone,
        }),
      })

      const data = await res.json()

      if (res.ok) {
        setMessage("✓ Solicitud de cotización enviada. Nos pondremos en contacto pronto")
      } else {
        console.error("[v0] API Error:", data)
        setMessage(`✗ ${data.error || "Error al enviar la solicitud"}`)
      }
    } catch (error: any) {
      console.error("[v0] Fetch Error:", error)
      setMessage(`✗ ${error.message || "Error al enviar la solicitud"}`)
    } finally {
      setSending(false)
    }
  }

  if (hasProfessional === null) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Enviar Informe
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">¿Tienes un ventanero de confianza?</p>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button onClick={() => setHasProfessional(true)} className="flex-1">
              Sí
            </Button>
            <Button onClick={() => setHasProfessional(false)} variant="outline" className="flex-1">
              Solicitar Presupuesto
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          {hasProfessional ? "Enviar a Ventanero" : "Solicitar Cotización"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {hasProfessional ? (
          <>
            <div className="space-y-2">
              <Label>Email del Ventanero</Label>
              <Input
                type="email"
                placeholder="ventanero@example.com"
                value={professionalEmail}
                onChange={(e) => setProfessionalEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Nombre del Ventanero (opcional)</Label>
              <Input
                placeholder="Nombre"
                value={professionalName}
                onChange={(e) => setProfessionalName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Descripción (opcional)</Label>
              <Textarea
                placeholder="Información adicional sobre el proyecto..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="h-20 resize-none"
              />
            </div>
            <Button onClick={handleSendToProfessional} disabled={!professionalEmail || sending} className="w-full">
              <Send className="h-4 w-4 mr-2" />
              {sending ? "Enviando..." : "Enviar Informe"}
            </Button>
          </>
        ) : (
          <>
            <div className="space-y-2">
              <Label>Email de contacto</Label>
              <Input
                type="email"
                placeholder="tu@example.com"
                value={homeownerEmail}
                onChange={(e) => setHomeownerEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Nombre / Empresa</Label>
              <Input
                placeholder="Nombre o empresa"
                value={homeownerName}
                onChange={(e) => setHomeownerName(e.target.value)}
              />
            </div>
            <Button
              onClick={handleRequestQuote}
              disabled={!homeownerEmail || !homeownerName || sending}
              className="w-full"
            >
              <Send className="h-4 w-4 mr-2" />
              {sending ? "Enviando..." : "Solicitar Cotización"}
            </Button>
          </>
        )}

        {message && <p className="text-sm text-center mt-2">{message}</p>}

        <Button onClick={() => setHasProfessional(null)} variant="outline" className="w-full">
          Cambiar
        </Button>
      </CardContent>
    </Card>
  )
}
