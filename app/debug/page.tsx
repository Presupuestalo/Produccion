"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

export default function DebugPage() {
  const [session, setSession] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Obtener sesión
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
        console.log("Session data:", sessionData)
        console.log("Session error:", sessionError)
        setSession(sessionData.session)

        if (sessionData.session?.user) {
          // Obtener perfil
          const { data: profileData, error: profileError } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", sessionData.session.user.id)
            .single()

          console.log("Profile data:", profileData)
          console.log("Profile error:", profileError)
          setProfile(profileData)
          setError(profileError?.message || null)
        }
      } catch (err: any) {
        console.error("Debug error:", err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [])

  const createProfile = async () => {
    if (!session?.user) return

    try {
      const { data, error } = await supabase
        .from("profiles")
        .insert({
          id: session.user.id,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (error) throw error
      setProfile(data)
      setError(null)
    } catch (err: any) {
      setError(err.message)
    }
  }

  const updateUserType = async (userType: string) => {
    if (!session?.user) return

    try {
      const { data, error } = await supabase
        .from("profiles")
        .update({ user_type: userType })
        .eq("id", session.user.id)
        .select()
        .single()

      if (error) throw error
      setProfile(data)
      setError(null)
    } catch (err: any) {
      setError(err.message)
    }
  }

  if (loading) {
    return <div className="p-8">Cargando...</div>
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Debug de Autenticación</h1>

      <div className="space-y-6">
        <div className="bg-gray-100 p-4 rounded">
          <h2 className="font-semibold mb-2">Sesión:</h2>
          <pre className="text-sm overflow-auto">{JSON.stringify(session, null, 2)}</pre>
        </div>

        <div className="bg-gray-100 p-4 rounded">
          <h2 className="font-semibold mb-2">Perfil:</h2>
          <pre className="text-sm overflow-auto">{JSON.stringify(profile, null, 2)}</pre>
        </div>

        {error && (
          <div className="bg-red-100 p-4 rounded">
            <h2 className="font-semibold mb-2 text-red-800">Error:</h2>
            <p className="text-red-700">{error}</p>
          </div>
        )}

        <div className="space-x-4">
          {session?.user && !profile && <Button onClick={createProfile}>Crear Perfil</Button>}

          {profile && !profile.user_type && (
            <>
              <Button onClick={() => updateUserType("professional")}>Establecer como Profesional</Button>
              <Button onClick={() => updateUserType("homeowner")}>Establecer como Propietario</Button>
            </>
          )}

          <Button onClick={() => router.push("/dashboard")}>Ir al Dashboard</Button>

          <Button onClick={() => supabase.auth.signOut()}>Cerrar Sesión</Button>
        </div>
      </div>
    </div>
  )
}
