"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { supabase } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Building2, Home, Loader2, Globe } from "lucide-react"
import Link from "next/link"

const AVAILABLE_COUNTRIES = [
  // Europa
  { code: "ES", name: "España", flag: "🇪🇸" },
  // Norteamérica
  { code: "US", name: "Estados Unidos", flag: "🇺🇸" },
  { code: "MX", name: "México", flag: "🇲🇽" },
  // Centroamérica y Caribe
  { code: "GT", name: "Guatemala", flag: "🇬🇹" },
  { code: "HN", name: "Honduras", flag: "🇭🇳" },
  { code: "SV", name: "El Salvador", flag: "🇸🇻" },
  { code: "NI", name: "Nicaragua", flag: "🇳🇮" },
  { code: "CR", name: "Costa Rica", flag: "🇨🇷" },
  { code: "PA", name: "Panamá", flag: "🇵🇦" },
  { code: "CU", name: "Cuba", flag: "🇨🇺" },
  { code: "DO", name: "República Dominicana", flag: "🇩🇴" },
  // Sudamérica
  { code: "CO", name: "Colombia", flag: "🇨🇴" },
  { code: "VE", name: "Venezuela", flag: "🇻🇪" },
  { code: "EC", name: "Ecuador", flag: "🇪🇨" },
  { code: "PE", name: "Perú", flag: "🇵🇪" },
  { code: "BO", name: "Bolivia", flag: "🇧🇴" },
  { code: "PY", name: "Paraguay", flag: "🇵🇾" },
  { code: "UY", name: "Uruguay", flag: "🇺🇾" },
  { code: "AR", name: "Argentina", flag: "🇦🇷" },
  { code: "CL", name: "Chile", flag: "🇨🇱" },
  // África
  { code: "GQ", name: "Guinea Ecuatorial", flag: "🇬🇶" },
  { code: "GN", name: "Guinea", flag: "🇬🇳" },
]

export default function SelectUserTypePage() {
  const [isLoading, setIsLoading] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [userName, setUserName] = useState<string>("")
  const [checkingAuth, setCheckingAuth] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [selectedType, setSelectedType] = useState<"professional" | "homeowner" | null>(null)
  const [selectedCountry, setSelectedCountry] = useState<string>("ES")
  const router = useRouter()
  const searchParams = useSearchParams()
  const pendingPlan = searchParams?.get("pendingPlan")
  const billingType = searchParams?.get("billingType") || "monthly"
  const referralCode = searchParams?.get("ref") // Get referral code from URL

  useEffect(() => {
    const storedRef = typeof window !== "undefined" ? sessionStorage.getItem("referral_code") : null
    if (storedRef && !referralCode) {
      // If we have stored ref but not in URL, use stored one
      console.log("[v0] Using stored referral code:", storedRef)
    }

    const checkUser = async () => {
      try {
        console.log("🔍 Verificando sesión...")
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession()

        if (sessionError) {
          console.error("❌ Error al obtener sesión:", sessionError)
          setError("Error al verificar la sesión")
          return
        }

        if (!session) {
          console.log("❌ No hay sesión activa")
          setError("No hay sesión activa")
          setTimeout(() => router.push("/auth/login"), 2000)
          return
        }

        console.log("✅ Usuario autenticado:", session.user.email)
        setUser(session.user)
        setUserName(session.user.user_metadata?.name || session.user.user_metadata?.full_name || session.user.email)

        const { data: existingProfile } = await supabase
          .from("profiles")
          .select("user_type, country")
          .eq("id", session.user.id)
          .single()

        if (existingProfile?.user_type) {
          console.log("Usuario ya tiene tipo configurado, redirigiendo...")
          if (pendingPlan) {
            router.push(`/dashboard?pendingPlan=${pendingPlan}&billingType=${billingType}`)
          } else {
            router.push("/dashboard")
          }
          return
        }

        if (existingProfile?.country) {
          const countryEntry = AVAILABLE_COUNTRIES.find((c) => c.name === existingProfile.country)
          if (countryEntry) {
            setSelectedCountry(countryEntry.code)
          }
        }
      } catch (err) {
        console.error("Error al verificar usuario:", err)
        setError("Error al verificar el estado del usuario")
      } finally {
        setCheckingAuth(false)
      }
    }

    checkUser()
  }, [router, pendingPlan, billingType, referralCode])

  const handleContinue = async (userType: "professional" | "homeowner") => {
    if (!acceptedTerms) {
      setError("Debes aceptar los términos y condiciones para continuar")
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      console.log("[v0] Estableciendo tipo de usuario:", userType)
      console.log("[v0] País seleccionado:", selectedCountry)

      const countryName = AVAILABLE_COUNTRIES.find((c) => c.code === selectedCountry)?.name || "España"

      const { error: upsertError } = await supabase.from("profiles").upsert(
        {
          id: user.id,
          email: user.email,
          full_name: user.user_metadata?.name || user.user_metadata?.full_name || "",
          user_type: userType,
          country: selectedCountry,
          accepted_terms: true,
          terms_accepted_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "id",
          ignoreDuplicates: false,
        },
      )

      if (upsertError) {
        console.error("[v0] Error al establecer perfil:", upsertError)
        throw upsertError
      }

      console.log("[v0] Perfil establecido correctamente con país:", countryName)

      const effectiveReferralCode =
        referralCode || (typeof window !== "undefined" ? sessionStorage.getItem("referral_code") : null)

      if (effectiveReferralCode) {
        console.log("[v0] Procesando código de referencia:", effectiveReferralCode)
        try {
          const { data: codeData, error: codeError } = await supabase
            .from("referral_codes")
            .select("id, user_id, uses_count, max_uses, is_active")
            .eq("code", effectiveReferralCode)
            .eq("is_active", true)
            .single()

          if (codeError || !codeData) {
            console.warn("[v0] Código de referencia no válido:", effectiveReferralCode)
          } else if (codeData.uses_count >= codeData.max_uses) {
            console.warn("[v0] Código de referencia agotado:", effectiveReferralCode)
          } else if (codeData.user_id === user.id) {
            console.warn("[v0] No puedes usar tu propio código de referencia")
          } else {
            const { error: relError } = await supabase.from("referral_relationships").insert({
              referrer_id: codeData.user_id,
              referred_id: user.id,
              referral_code_id: codeData.id,
              status: "pending",
              created_at: new Date().toISOString(),
            })

            if (relError) {
              console.warn("[v0] Error al crear relación de referido:", relError)
            } else {
              console.log("[v0] Relación de referido creada correctamente")
              if (typeof window !== "undefined") {
                sessionStorage.removeItem("referral_code")
              }
            }
          }
        } catch (err) {
          console.error("[v0] Error procesando referencia:", err)
        }
      }

      const { data: profileData } = await supabase.from("profiles").select("created_at").eq("id", user.id).single()

      const isNewUser = profileData && new Date(profileData.created_at).getTime() > Date.now() - 60000

      if (isNewUser) {
        console.log("[v0] Enviando email de bienvenida...")
        try {
          const emailResponse = await fetch("/api/send-welcome-email", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              email: user.email,
              name: user.user_metadata?.name || user.user_metadata?.full_name || "",
              userType: userType === "professional" ? "profesional" : "propietario",
            }),
          })

          const emailData = await emailResponse.json()

          if (emailResponse.ok && emailData.success) {
            console.log("[v0] Email de bienvenida enviado correctamente")
          } else {
            console.warn("[v0] No se pudo enviar el email de bienvenida:", emailData.message || emailData.error)
          }
        } catch (emailError: any) {
          console.error("[v0] Error al enviar email de bienvenida:", emailError)
        }
      }

      await new Promise((resolve) => setTimeout(resolve, 500))

      console.log("[v0] Redirigiendo al dashboard...")
      if (pendingPlan) {
        router.push(`/dashboard?pendingPlan=${pendingPlan}&billingType=${billingType}`)
      } else {
        router.push("/dashboard")
      }
    } catch (error: any) {
      console.error("[v0] Error al establecer tipo de usuario:", error)
      setError(`Error al establecer tipo de usuario: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignOut = async () => {
    try {
      setIsLoading(true)
      await supabase.auth.signOut()
      router.push("/auth/login")
    } catch (error) {
      console.error("Error al cerrar sesión:", error)
      setError("Error al cerrar sesión")
      setIsLoading(false)
    }
  }

  if (checkingAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center p-6 bg-white rounded-lg shadow-md">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-orange-600" />
          <p>Verificando autenticación...</p>
        </div>
      </div>
    )
  }

  if (error && !selectedType) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center p-6 bg-white rounded-lg shadow-md">
          <div className="h-8 w-8 mx-auto bg-red-100 rounded-full flex items-center justify-center mb-4">
            <svg className="h-5 w-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <p className="text-red-600 font-medium mb-4">{error}</p>
          <Button onClick={() => router.push("/auth/login")} variant="outline">
            Volver al inicio de sesión
          </Button>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center p-6 bg-white rounded-lg shadow-md">
          <p>No hay usuario autenticado. Redirigiendo...</p>
        </div>
      </div>
    )
  }

  const selectedCountryData = AVAILABLE_COUNTRIES.find((c) => c.code === selectedCountry)

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">¡Bienvenido a Presupuéstalo!</h1>
          <p className="text-gray-600">Hola {userName}, para continuar necesitamos algunos datos:</p>
        </div>

        <div className="mb-6 p-6 bg-white rounded-lg shadow-sm border">
          <div className="flex items-center gap-2 mb-4">
            <Globe className="h-5 w-5 text-orange-600" />
            <h2 className="font-semibold text-gray-900">¿En qué país te encuentras?</h2>
          </div>
          <Select value={selectedCountry} onValueChange={setSelectedCountry}>
            <SelectTrigger className="w-full h-14 text-lg">
              <SelectValue>
                {selectedCountryData && (
                  <span className="flex items-center gap-3">
                    <span className="text-3xl">{selectedCountryData.flag}</span>
                    <span className="font-medium">{selectedCountryData.name}</span>
                  </span>
                )}
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="max-h-[300px]">
              {AVAILABLE_COUNTRIES.map((country) => (
                <SelectItem key={country.code} value={country.code} className="py-3 cursor-pointer">
                  <span className="flex items-center gap-3">
                    <span className="text-2xl">{country.flag}</span>
                    <span className="font-medium">{country.name}</span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <p className="text-xs text-gray-500 mt-2">
            Esto nos ayuda a personalizar tu experiencia y mostrarte funcionalidades disponibles en tu región.
          </p>
        </div>

        <div className="mb-4">
          <h2 className="font-semibold text-gray-900 text-center mb-4">¿Qué tipo de usuario eres?</h2>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card
            className={`cursor-pointer hover:shadow-lg transition-all ${selectedType === "professional" ? "ring-2 ring-orange-600" : ""
              }`}
            onClick={() => setSelectedType("professional")}
          >
            <CardHeader className="text-center">
              <Building2 className="h-12 w-12 mx-auto mb-4 text-orange-600" />
              <CardTitle>Soy Profesional</CardTitle>
              <CardDescription>Arquitecto, constructor, reformista o profesional del sector</CardDescription>
            </CardHeader>
          </Card>

          <Card
            className={`cursor-pointer hover:shadow-lg transition-all ${selectedType === "homeowner" ? "ring-2 ring-orange-600" : ""
              }`}
            onClick={() => setSelectedType("homeowner")}
          >
            <CardHeader className="text-center">
              <Home className="h-12 w-12 mx-auto mb-4 text-orange-600" />
              <CardTitle>Soy Propietario</CardTitle>
              <CardDescription>Propietario de vivienda que necesita hacer una reforma</CardDescription>
            </CardHeader>
          </Card>
        </div>

        <div className="mt-8 p-6 bg-white rounded-lg shadow-sm border">
          <div className="flex items-start space-x-3">
            <Checkbox
              id="terms"
              checked={acceptedTerms}
              onCheckedChange={(checked) => {
                setAcceptedTerms(checked as boolean)
                setError(null)
              }}
              className="mt-1"
            />
            <label htmlFor="terms" className="text-sm text-gray-700 leading-relaxed cursor-pointer">
              Acepto los{" "}
              <Link href="/aviso-legal" target="_blank" className="text-orange-600 hover:underline font-medium">
                términos y condiciones
              </Link>{" "}
              y la{" "}
              <Link href="/politica-privacidad" target="_blank" className="text-orange-600 hover:underline font-medium">
                política de privacidad
              </Link>{" "}
              de Presupuéstalo
            </label>
          </div>

          {error && <p className="text-sm text-red-600 mt-3">{error}</p>}

          <Button
            onClick={() => selectedType && handleContinue(selectedType)}
            disabled={isLoading || !selectedType || !acceptedTerms || !selectedCountry}
            className="w-full mt-6"
            size="lg"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            {!selectedCountry ? "Selecciona tu país" : !selectedType ? "Selecciona un tipo de usuario" : "Continuar"}
          </Button>
        </div>

        <div className="text-center mt-8">
          <Button variant="outline" onClick={handleSignOut} disabled={isLoading}>
            Cerrar sesión
          </Button>
        </div>
      </div>
    </div>
  )
}
