"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Mail, Send, CheckCircle2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export function ContactForm() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    console.log("[v0] Formulario de contacto: Iniciando envío...")
    setIsSubmitting(true)

    const formData = new FormData(e.currentTarget)
    const data = {
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      subject: formData.get("subject") as string,
      message: formData.get("message") as string,
    }

    console.log("[v0] Formulario de contacto: Datos del formulario:", data)

    try {
      console.log("[v0] Formulario de contacto: Llamando a /api/contact...")
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      console.log("[v0] Formulario de contacto: Respuesta recibida, status:", response.status)

      if (!response.ok) {
        const errorData = await response.json()
        console.error("[v0] Formulario de contacto: Error en respuesta:", errorData)
        throw new Error(errorData.details || errorData.error || "Error al enviar el mensaje")
      }

      const result = await response.json()
      console.log("[v0] Formulario de contacto: ✅ Éxito:", result)

      setIsSuccess(true)
      toast({
        title: "Mensaje enviado",
        description: "Recibido, en breve recibirá una contestación.",
      })

      // Reset form
      ;(e.target as HTMLFormElement).reset()

      // Reset success message after 5 seconds
      setTimeout(() => setIsSuccess(false), 5000)
    } catch (error) {
      console.error("[v0] Formulario de contacto: ❌ Error:", error)
      toast({
        title: "Error al enviar",
        description:
          error instanceof Error ? error.message : "No se pudo enviar el mensaje. Por favor, inténtalo de nuevo.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
      console.log("[v0] Formulario de contacto: Proceso finalizado")
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Mail className="h-6 w-6 text-orange-600" />
          <CardTitle>Contacto</CardTitle>
        </div>
        <CardDescription>Envíanos tu consulta y te responderemos lo antes posible</CardDescription>
      </CardHeader>
      <CardContent>
        {isSuccess ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <CheckCircle2 className="h-16 w-16 text-green-600 mb-4" />
            <h3 className="text-xl font-semibold mb-2">¡Mensaje enviado!</h3>
            <p className="text-muted-foreground">Recibido, en breve recibirá una contestación.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre</Label>
              <Input id="name" name="name" placeholder="Tu nombre" required disabled={isSubmitting} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" placeholder="tu@email.com" required disabled={isSubmitting} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="subject">Asunto</Label>
              <Input
                id="subject"
                name="subject"
                placeholder="¿En qué podemos ayudarte?"
                required
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Descripción</Label>
              <Textarea
                id="message"
                name="message"
                placeholder="Cuéntanos más sobre tu consulta..."
                rows={6}
                required
                disabled={isSubmitting}
              />
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Enviar mensaje
                </>
              )}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  )
}
