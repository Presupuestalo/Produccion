"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Upload, FileText, Trash2, Download, Loader2, AlertCircle } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { supabase } from "@/lib/supabase/client"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

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
        })
        .select()
        .single()

      if (error) throw error

      setLicense(data)
      toast({
        title: "Licencia subida",
        description: "La licencia se ha subida correctamente",
      })
    } catch (error) {
      console.error("Error uploading license:", error)
      toast({
        title: "Error",
        description: "No se pudo subir la licencia",
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
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-2">Licencia del Ayuntamiento</h3>
        <p className="text-sm text-muted-foreground">
          Sube aquí la licencia de obra concedida por el ayuntamiento en formato PDF
        </p>
      </div>

      {license ? (
        <Card className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <FileText className="h-10 w-10 text-primary" />
              <div>
                <p className="font-medium">{license.file_name}</p>
                <p className="text-sm text-muted-foreground">
                  Subido el {new Date(license.uploaded_at).toLocaleDateString("es-ES")}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" asChild>
                <a href={license.file_url} target="_blank" rel="noopener noreferrer">
                  <Download className="h-4 w-4 mr-2" />
                  Descargar
                </a>
              </Button>
              <Button variant="destructive" size="sm" onClick={handleDelete}>
                <Trash2 className="h-4 w-4 mr-2" />
                Eliminar
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notas sobre la licencia</Label>
            <Textarea
              id="notes"
              placeholder="Añade notas sobre la licencia, condiciones especiales, etc."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-[100px]"
            />
            <Button onClick={handleSaveNotes} size="sm">
              Guardar Notas
            </Button>
          </div>
        </Card>
      ) : (
        <Card className="p-12 border-dashed">
          <div className="flex flex-col items-center justify-center text-center space-y-4">
            <Upload className="h-12 w-12 text-muted-foreground" />
            <div>
              <p className="font-medium mb-1">No hay licencia subida</p>
              <p className="text-sm text-muted-foreground">Sube un archivo PDF con la licencia del ayuntamiento</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes-before">Notas (opcional)</Label>
              <Textarea
                id="notes-before"
                placeholder="Añade notas antes de subir la licencia"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="min-h-[80px] w-full"
              />
            </div>
            <Button disabled={isUploading} asChild>
              <label htmlFor="license-upload" className="cursor-pointer">
                {isUploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Subiendo...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Subir Licencia (PDF)
                  </>
                )}
              </label>
            </Button>
            <input
              id="license-upload"
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={handleFileUpload}
              disabled={isUploading}
            />
          </div>
        </Card>
      )}
    </div>
  )
}
