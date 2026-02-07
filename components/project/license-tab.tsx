"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Upload, FileText, Trash2, Download, Loader2, AlertCircle, Check, Calendar, Sparkles, Save } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { supabase } from "@/lib/supabase/client"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"

interface LicenseDocument {
  id: string
  project_id: string
  file_url: string
  file_name: string
  uploaded_at: string
  notes?: string
}

interface LicenseTabProps {
  projectId: string
}

export function LicenseTab({ projectId }: LicenseTabProps) {
  const [license, setLicense] = useState<LicenseDocument | null>(null)
  const [notes, setNotes] = useState("")
  const [isUploading, setIsUploading] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [hasTableError, setHasTableError] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    loadLicense()
  }, [projectId])

  const loadLicense = async () => {
    try {
      setIsLoading(true)
      setHasTableError(false)

      const { data, error } = await supabase
        .from("license_documents")
        .select("*")
        .eq("project_id", projectId)
        .order("uploaded_at", { ascending: false })
        .limit(1)
        .single()

      if (error && error.code !== "PGRST116") {
        if (error.message?.includes("does not exist")) {
          setHasTableError(true)
          return
        }
        throw error
      }

      if (data) {
        setLicense(data)
        setNotes(data.notes || "")
      }
    } catch (error) {
      console.error("Error loading license:", error)
      toast({
        title: "Error",
        description: "No se pudo cargar la licencia",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (file.type !== "application/pdf") {
      toast({
        title: "Formato no válido",
        description: "Solo se permiten archivos PDF",
        variant: "destructive",
      })
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "Archivo demasiado grande",
        description: "El archivo no puede superar los 10MB",
        variant: "destructive",
      })
      return
    }

    try {
      setIsUploading(true)

      if (license?.file_url) {
        try {
          const url = new URL(license.file_url)
          const pathParts = url.pathname.split("/")
          const storageIndex = pathParts.indexOf("pdfs")
          if (storageIndex !== -1) {
            const filePath = pathParts.slice(storageIndex + 1).join("/")
            await supabase.storage.from("pdfs").remove([filePath])
          }
        } catch (error) {
          console.error("Error deleting old file:", error)
        }
      }

      const { data: session } = await supabase.auth.getSession()
      if (!session.session) throw new Error("No session")

      const fileExt = file.name.split(".").pop()
      const fileName = `${session.session.user.id}/${projectId}/${Date.now()}.${fileExt}`

      const { data: uploadData, error: uploadError } = await supabase.storage.from("pdfs").upload(fileName, file, {
        cacheControl: "3600",
        upsert: false,
      })

      if (uploadError) throw uploadError

      const {
        data: { publicUrl },
      } = supabase.storage.from("pdfs").getPublicUrl(fileName)

      const { data, error } = await supabase
        .from("license_documents")
        .insert({
          project_id: projectId,
          file_url: publicUrl,
          file_name: file.name,
          notes: notes,
          uploaded_by: session.session.user.id,
        })
        .select()
        .single()

      if (error) throw error

      setLicense(data)
      toast({
        title: "Licencia subida",
        description: "La licencia se ha subida correctamente",
      })
    } catch (error: any) {
      console.group("🔴 Error Crítico en Subida de Licencia")
      console.error("Objeto Error:", error)

      // Capturar todas las propiedades posibles, incluso las no enumerables
      const detailedError: any = {}
      if (error) {
        Object.getOwnPropertyNames(error).forEach(key => {
          detailedError[key] = error[key]
        })
      }
      console.log("Detalles Técnicos:", detailedError)
      console.groupEnd()

      const errorMessage = error?.message || "Error desconocido al procesar el archivo. Revisa la consola."

      toast({
        title: "Error al subir",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  const handleDelete = async () => {
    if (!license) return

    try {
      const url = new URL(license.file_url)
      const pathParts = url.pathname.split("/")
      const storageIndex = pathParts.indexOf("pdfs")
      if (storageIndex !== -1) {
        const filePath = pathParts.slice(storageIndex + 1).join("/")
        await supabase.storage.from("pdfs").remove([filePath])
      }

      const { error } = await supabase.from("license_documents").delete().eq("id", license.id)

      if (error) throw error

      setLicense(null)
      setNotes("")
      toast({
        title: "Licencia eliminada",
        description: "La licencia se ha eliminado correctamente",
      })
    } catch (error) {
      console.error("Error deleting license:", error)
      toast({
        title: "Error",
        description: "No se pudo eliminar la licencia",
        variant: "destructive",
      })
    }
  }

  const handleSaveNotes = async () => {
    if (!license) return

    try {
      const { error } = await supabase.from("license_documents").update({ notes }).eq("id", license.id)

      if (error) throw error

      toast({
        title: "Notas guardadas",
        description: "Las notas se han guardado correctamente",
      })
    } catch (error) {
      console.error("Error saving notes:", error)
      toast({
        title: "Error",
        description: "No se pudieron guardar las notas",
        variant: "destructive",
      })
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (hasTableError) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Configuración requerida</AlertTitle>
        <AlertDescription>
          La funcionalidad de licencias requiere ejecutar el script de base de datos{" "}
          <code className="text-xs">add-client-dni-and-license-contract-tables.sql</code> desde el panel de scripts.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">
            Licencia del Ayuntamiento
          </h3>
          <p className="text-sm text-muted-foreground">
            Gestiona y almacena la documentación oficial de la obra
          </p>
        </div>
        {license && (
          <Badge variant="outline" className="w-fit bg-green-500/10 text-green-600 border-green-200 dark:border-green-900/50 flex gap-1.5 py-1 px-3">
            <Check className="h-3.5 w-3.5" />
            Documentación Activa
          </Badge>
        )}
      </div>

      {license ? (
        <div className="grid gap-6">
          <Card className="overflow-hidden border-none shadow-lg bg-gradient-to-br from-background to-muted/30">
            <div className="p-6">
              <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
                <div className="h-16 w-16 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <FileText className="h-8 w-8 text-primary" />
                </div>

                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-lg truncate mb-1">{license.file_name}</h4>
                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1.5 text-xs">
                      <Calendar className="h-3.5 w-3.5" />
                      Subido el {new Date(license.uploaded_at).toLocaleDateString("es-ES", {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Button variant="outline" size="sm" className="bg-background shadow-sm hover:bg-muted" asChild>
                    <a href={license.file_url} target="_blank" rel="noopener noreferrer">
                      <Download className="h-4 w-4 mr-2" />
                      Descargar
                    </a>
                  </Button>
                  <Button variant="ghost" size="sm" onClick={handleDelete} className="text-destructive hover:bg-destructive/10 hover:text-destructive">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Eliminar
                  </Button>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-muted/20 border-t">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Label htmlFor="notes" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Notas sobre la licencia
                  </Label>
                  <Sparkles className="h-3 w-3 text-primary animate-pulse" />
                </div>
                <Textarea
                  id="notes"
                  placeholder="Añade observaciones adicionales, condiciones especiales del ayuntamiento..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="min-h-[120px] bg-background/50 border-muted-foreground/20 focus:border-primary transition-all resize-none"
                />
                <div className="flex justify-end pt-1">
                  <Button onClick={handleSaveNotes} size="sm" className="shadow-md">
                    <Save className="h-4 w-4 mr-2" />
                    Actualizar Notas
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      ) : (
        <Card className="relative overflow-hidden border-2 border-dashed border-muted-foreground/20 bg-muted/5 transition-all hover:bg-muted/10 group">
          <div className="p-8 md:p-12">
            <div className="flex flex-col items-center justify-center text-center space-y-6">
              <div className="relative">
                <div className="h-20 w-20 rounded-full bg-primary/5 flex items-center justify-center transition-transform group-hover:scale-110 duration-300">
                  <Upload className="h-10 w-10 text-primary" />
                </div>
                <div className="absolute -top-1 -right-1">
                  <div className="h-4 w-4 bg-primary rounded-full animate-ping opacity-75" />
                  <div className="h-4 w-4 bg-primary rounded-full relative" />
                </div>
              </div>

              <div className="space-y-2 max-w-sm">
                <p className="text-xl font-bold">No hay licencia subida</p>
                <p className="text-sm text-muted-foreground">
                  Para proceder con la obra es necesario tener la licencia municipal aprobada. Sube el documento oficial en PDF.
                </p>
              </div>

              <div className="w-full max-w-md space-y-4 pt-4">
                <div className="space-y-2 text-left">
                  <Label htmlFor="notes-before" className="text-xs font-bold uppercase text-muted-foreground ml-1">
                    Anotaciones previas (opcional)
                  </Label>
                  <Textarea
                    id="notes-before"
                    placeholder="Escribe aquí cualquier aclaración sobre el estado de la solicitud..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="min-h-[100px] bg-background border-muted-foreground/20 resize-none shadow-sm"
                  />
                </div>

                <div className="flex flex-col items-center gap-3">
                  <Button
                    disabled={isUploading}
                    asChild
                    className="w-full sm:w-auto px-10 py-6 text-lg shadow-xl shadow-primary/20 transition-all hover:shadow-primary/30 active:scale-[0.98]"
                  >
                    <label htmlFor="license-upload" className="cursor-pointer">
                      {isUploading ? (
                        <>
                          <Loader2 className="h-5 w-5 mr-3 animate-spin" />
                          Procesando Archivo...
                        </>
                      ) : (
                        <>
                          <FileText className="h-5 w-5 mr-3" />
                          Subir Licencia (PDF)
                        </>
                      )}
                    </label>
                  </Button>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium">
                    Tamaño máximo: 10MB • Formato: PDF únicamente
                  </p>
                </div>
              </div>

              <input
                id="license-upload"
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={handleFileUpload}
                disabled={isUploading}
              />
            </div>
          </div>
        </Card>
      )}

      {!license && (
        <div className="flex items-start gap-4 p-4 rounded-xl bg-blue-500/5 border border-blue-500/10 text-blue-600 dark:text-blue-400">
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-bold mb-1">¿Por qué es importante?</p>
            <p className="opacity-80">
              Adjuntar la licencia oficial te permite tener toda la documentación del proyecto centralizada y accesible en cualquier momento para revisiones o inspecciones.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
