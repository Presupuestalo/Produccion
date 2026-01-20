"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Upload, FileText, Trash2, Loader2, Download } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { supabase } from "@/lib/supabase/client"

interface LicenseUploadProps {
  projectId: string
}

interface License {
  id: string
  file_url: string
  file_name: string
  file_size: number
  uploaded_at: string
}

export function LicenseUpload({ projectId }: LicenseUploadProps) {
  const [license, setLicense] = useState<License | null>(null)
  const [uploading, setUploading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  // Load existing license
  useState(() => {
    const loadLicense = async () => {
      try {
        const { data, error } = await supabase
          .from("project_licenses")
          .select("*")
          .eq("project_id", projectId)
          .maybeSingle()

        if (error) throw error
        if (data) setLicense(data)
      } catch (error) {
        console.error("Error loading license:", error)
      } finally {
        setLoading(false)
      }
    }
    loadLicense()
  })

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (file.type !== "application/pdf") {
      toast({
        title: "Tipo de archivo no válido",
        description: "Solo se permiten archivos PDF",
        variant: "destructive",
      })
      return
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "Archivo demasiado grande",
        description: "El archivo no puede superar los 10MB",
        variant: "destructive",
      })
      return
    }

    try {
      setUploading(true)

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

      // Save to database
      const { data, error } = await supabase
        .from("project_licenses")
        .insert({
          project_id: projectId,
          file_url: publicUrl,
          file_name: file.name,
          file_size: file.size,
          user_id: session.session.user.id,
        })
        .select()
        .single()

      if (error) throw error

      setLicense(data)
      toast({
        title: "Licencia subida",
        description: "La licencia se ha subido correctamente",
      })
    } catch (error) {
      console.error("Error uploading license:", error)
      toast({
        title: "Error",
        description: "No se pudo subir la licencia",
        variant: "destructive",
      })
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async () => {
    if (!license) return

    try {
      setDeleting(true)

      // Extract storage path from public URL
      const url = new URL(license.file_url)
      const pathParts = url.pathname.split("/")
      const storageIndex = pathParts.indexOf("pdfs")
      if (storageIndex !== -1) {
        const filePath = pathParts.slice(storageIndex + 1).join("/")
        await supabase.storage.from("pdfs").remove([filePath])
      }

      // Delete from database
      const { error } = await supabase.from("project_licenses").delete().eq("id", license.id)

      if (error) throw error

      setLicense(null)
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
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Licencia del Ayuntamiento</CardTitle>
        <CardDescription>Sube la licencia de obra concedida por el ayuntamiento (PDF)</CardDescription>
      </CardHeader>
      <CardContent>
        {license ? (
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <FileText className="h-8 w-8 text-primary" />
              <div>
                <p className="font-medium">{license.file_name}</p>
                <p className="text-sm text-muted-foreground">
                  {(license.file_size / 1024 / 1024).toFixed(2)} MB •{" "}
                  {new Date(license.uploaded_at).toLocaleDateString("es-ES")}
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
              <Button variant="destructive" size="sm" onClick={handleDelete} disabled={deleting}>
                {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed rounded-lg">
            <Upload className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground mb-4">No hay licencia subida</p>
            <Button disabled={uploading} asChild>
              <label className="cursor-pointer">
                {uploading ? (
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
                <input type="file" accept="application/pdf" className="hidden" onChange={handleFileUpload} />
              </label>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
