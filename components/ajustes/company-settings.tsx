"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, Upload, X } from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  getCountryFieldLabels,
  getProvincesForCountry,
  getCurrencyForCountry,
  getCurrencySymbolForCountry,
} from "@/lib/utils/country-fields"
import { PhoneInputWithCountry } from "@/components/shared/phone-input-with-country"
import { compressImage } from "@/lib/utils/image-utils"

const COUNTRY_NAMES: Record<string, string> = {
  ES: "España",
  MX: "México",
  AR: "Argentina",
  CO: "Colombia",
  CL: "Chile",
  PE: "Perú",
  US: "Estados Unidos",
  EC: "Ecuador",
  VE: "Venezuela",
  GT: "Guatemala",
  CU: "Cuba",
  BO: "Bolivia",
  DO: "República Dominicana",
  HN: "Honduras",
  PY: "Paraguay",
  SV: "El Salvador",
  NI: "Nicaragua",
  CR: "Costa Rica",
  PA: "Panamá",
  UY: "Uruguay",
  GQ: "Guinea Ecuatorial",
  GN: "Guinea",
}

interface CompanySettingsProps {
  userId: string
  userData?: {
    company_name?: string
    website?: string
    phone?: string
    address?: string
    email?: string
    country?: string
  }
}

function CompanySettings({ userId, userData = {} }: CompanySettingsProps) {
  const [profileCountry, setProfileCountry] = useState<string>("ES")
  const [formData, setFormData] = useState({
    company_name: userData.company_name || "",
    company_address: userData.address || "",
    company_city: "",
    company_province: "",
    company_country: userData.country || "ES",
    company_postal_code: "",
    company_tax_id: "",
    company_phone: userData.phone || "",
    company_email: userData.email || "",
    company_website: userData.website || "",
    company_logo_url: "",
    default_presentation_text: "",
    default_clarification_notes: "",
    show_vat: false,
    vat_percentage: 21,
  })
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingSettings, setIsLoadingSettings] = useState(true)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    loadSettings()
  }, [userId])

  const loadSettings = async () => {
    try {
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("country")
        .eq("id", userId)
        .maybeSingle()

      if (profileError) {
        console.error("[v0] Error loading profile country:", profileError)
      }

      let userCountry = profileData?.country || userData.country || "ES"
      if (userCountry === "España") userCountry = "ES"
      setProfileCountry(userCountry)

      const { data, error } = await supabase
        .from("user_company_settings")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle()

      if (error && error.code !== "PGRST116") throw error

      if (data) {
        setFormData({
          company_name: data.company_name || userData.company_name || "",
          company_address: data.company_address || userData.address || "",
          company_city: data.company_city || "",
          company_province: data.company_province || "",
          company_country: userCountry,
          company_postal_code: data.company_postal_code || "",
          company_tax_id: data.company_tax_id || "",
          company_phone: data.company_phone || userData.phone || "",
          company_email: data.company_email || userData.email || "",
          company_website: data.company_website || userData.website || "",
          company_logo_url: data.company_logo_url || "",
          default_presentation_text: data.default_presentation_text || "",
          default_clarification_notes: data.default_clarification_notes || "",
          show_vat: data.show_vat || false,
          vat_percentage: data.vat_percentage || 21,
        })
        if (data.company_logo_url) {
          setLogoPreview(data.company_logo_url)
        }
      } else {
        setFormData((prev) => ({ ...prev, company_country: userCountry }))
      }
    } catch (error: any) {
      console.error("[v0] Error loading company settings:", error)
    } finally {
      setIsLoadingSettings(false)
    }
  }

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setLogoFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setLogoPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const removeLogo = () => {
    setLogoFile(null)
    setLogoPreview(null)
    setFormData({ ...formData, company_logo_url: "" })
  }

  const handleProvinceChange = (province: string) => {
    setFormData({ ...formData, company_province: province })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      let logoUrl = formData.company_logo_url

      if (logoFile) {
        // Comprimir el logo antes de subirlo
        const compressedLogo = await compressImage(logoFile, 800, 0.7)

        const fileExt = compressedLogo.name.split(".").pop()
        const fileName = `${userId}/${Date.now()}.${fileExt}`

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("company-logos")
          .upload(fileName, compressedLogo, {
            cacheControl: "3600",
            upsert: true,
          })

        if (uploadError) {
          console.error("[v0] Error uploading logo:", uploadError)
          throw new Error("No se pudo subir el logo. Asegúrate de que el storage esté configurado correctamente.")
        }

        const {
          data: { publicUrl },
        } = supabase.storage.from("company-logos").getPublicUrl(fileName)

        logoUrl = publicUrl
      }

      const isSpain = profileCountry === "ES" || profileCountry === "España"

      if (isSpain && availableProvinces && !formData.company_province) {
        toast({
          title: "Provincia requerida",
          description: "La provincia es obligatoria para los profesionales en España para poder recibir notificaciones de leads.",
          variant: "destructive",
        })
        setIsLoading(false)
        return
      }

      const { error } = await supabase.from("user_company_settings").upsert(
        {
          user_id: userId,
          company_name: formData.company_name,
          company_address: formData.company_address,
          company_city: formData.company_city,
          company_province: formData.company_province,
          company_country: formData.company_country,
          company_postal_code: formData.company_postal_code,
          company_tax_id: formData.company_tax_id,
          company_phone: formData.company_phone,
          company_email: formData.company_email,
          company_website: formData.company_website,
          company_logo_url: logoUrl,
          default_presentation_text: formData.default_presentation_text,
          default_clarification_notes: formData.default_clarification_notes,
          show_vat: formData.show_vat,
          vat_percentage: formData.vat_percentage,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "user_id",
        },
      )

      if (error) {
        console.error("[v0] Error saving company settings:", error)
        throw error
      }

      toast({
        title: "Configuración guardada",
        description: "La configuración de tu empresa ha sido actualizada correctamente",
      })

      router.refresh()
    } catch (error: any) {
      console.error("[v0] Error saving company settings:", error)
      toast({
        title: "Error",
        description: error.message || "No se pudo guardar la configuración",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoadingSettings) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  const fieldLabels = getCountryFieldLabels(formData.company_country)
  const availableProvinces = getProvincesForCountry(formData.company_country)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configuración de Empresa</CardTitle>
        <CardDescription>
          Configura los datos de tu empresa que aparecerán en los presupuestos por defecto
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Logo */}
          <div className="space-y-2">
            <Label>Logo de la empresa</Label>
            <div className="flex items-start gap-4">
              {logoPreview ? (
                <div className="relative w-32 h-32 border rounded-lg overflow-hidden">
                  <Image src={logoPreview || "/placeholder.svg"} alt="Logo preview" fill className="object-contain" />
                  <button
                    type="button"
                    onClick={removeLogo}
                    className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="w-32 h-32 border-2 border-dashed rounded-lg flex items-center justify-center">
                  <Upload className="h-8 w-8 text-muted-foreground" />
                </div>
              )}
              <div className="flex-1 space-y-2">
                <Input type="file" accept="image/*" onChange={handleLogoChange} className="cursor-pointer" />
                <p className="text-xs text-muted-foreground">
                  Sube el logo de tu empresa (PNG, JPG, SVG). Tamaño recomendado: 200x200px
                </p>
              </div>
            </div>
          </div>

          {/* Company Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Datos de la Empresa</h3>

            <div className="space-y-2">
              <Label htmlFor="company_name">Nombre de la empresa *</Label>
              <Input
                id="company_name"
                value={formData.company_name}
                onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                placeholder="Tu Empresa"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="company_tax_id">{fieldLabels.taxId}</Label>
              <Input
                id="company_tax_id"
                value={formData.company_tax_id}
                onChange={(e) => setFormData({ ...formData, company_tax_id: e.target.value })}
                placeholder={
                  formData.company_country === "ES"
                    ? "B12345678"
                    : formData.company_country === "US"
                      ? "12-3456789"
                      : formData.company_country === "GB"
                        ? "GB123456789"
                        : formData.company_country === "FR"
                          ? "12345678901234"
                          : "Tax ID"
                }
              />
              <p className="text-xs text-muted-foreground">{fieldLabels.taxIdDescription}</p>
            </div>

            <div className="space-y-2">
              <Label>País</Label>
              <div className="flex items-center gap-2 p-3 bg-muted rounded-md border">
                <span className="text-base">{COUNTRY_NAMES[profileCountry] || profileCountry}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Moneda: {getCurrencySymbolForCountry(profileCountry)} ({getCurrencyForCountry(profileCountry)})
              </p>
              <p className="text-xs text-muted-foreground">
                El país se estableció durante el registro y no puede modificarse.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="company_address">Dirección (Calle y número)</Label>
              <Input
                id="company_address"
                value={formData.company_address}
                onChange={(e) => setFormData({ ...formData, company_address: e.target.value })}
                placeholder="Calle Principal 123"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="company_province">
                  {fieldLabels.province} {(profileCountry === "ES" || profileCountry === "España") && availableProvinces && "*"}
                </Label>
                {availableProvinces ? (
                  <Select value={formData.company_province} onValueChange={handleProvinceChange}>
                    <SelectTrigger>
                      <SelectValue placeholder={`Selecciona ${fieldLabels.province.toLowerCase()}`} />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                      {availableProvinces.map((province) => (
                        <SelectItem key={province} value={province}>
                          {province}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    id="company_province"
                    value={formData.company_province}
                    onChange={(e) => setFormData({ ...formData, company_province: e.target.value })}
                    placeholder={fieldLabels.province}
                  />
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="company_city">Ciudad</Label>
                <Input
                  id="company_city"
                  value={formData.company_city}
                  onChange={(e) => setFormData({ ...formData, company_city: e.target.value })}
                  placeholder="Ciudad"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="company_postal_code">Código Postal</Label>
              <Input
                id="company_postal_code"
                value={formData.company_postal_code}
                onChange={(e) => setFormData({ ...formData, company_postal_code: e.target.value })}
                placeholder={
                  formData.company_country === "ES"
                    ? "28013"
                    : formData.company_country === "US"
                      ? "10001"
                      : formData.company_country === "GB"
                        ? "SW1A 1AA"
                        : "Código postal"
                }
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="company_phone">Teléfono</Label>
                <PhoneInputWithCountry
                  value={formData.company_phone}
                  onChange={(phone) => setFormData({ ...formData, company_phone: phone })}
                  defaultCountry={formData.company_country}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="company_email">Email</Label>
                <Input
                  id="company_email"
                  type="email"
                  value={formData.company_email}
                  onChange={(e) => setFormData({ ...formData, company_email: e.target.value })}
                  placeholder="info@tuempresa.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="company_website">Sitio web (opcional)</Label>
              <Input
                id="company_website"
                value={formData.company_website}
                onChange={(e) => setFormData({ ...formData, company_website: e.target.value })}
                placeholder="www.tuempresa.com"
              />
            </div>
          </div>

          {/* Default Texts */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Textos por Defecto</h3>
            <p className="text-sm text-muted-foreground">
              Estos textos aparecerán en todos tus presupuestos, pero podrás personalizarlos individualmente
            </p>

            <div className="space-y-2">
              <Label htmlFor="default_presentation_text">Texto de presentación</Label>
              <Textarea
                id="default_presentation_text"
                value={formData.default_presentation_text}
                onChange={(e) => setFormData({ ...formData, default_presentation_text: e.target.value })}
                placeholder="Nos permitimos hacerle entrega del presupuesto solicitado..."
                rows={6}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="default_clarification_notes">Notas aclaratorias</Label>
              <Textarea
                id="default_clarification_notes"
                value={formData.default_clarification_notes}
                onChange={(e) => setFormData({ ...formData, default_clarification_notes: e.target.value })}
                placeholder="Consideraciones adicionales: ..."
                rows={6}
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                "Guardar configuración"
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

export default CompanySettings
export { CompanySettings }
