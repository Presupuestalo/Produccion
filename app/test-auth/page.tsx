"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"

export default function TestAuthPage() {
  const [session, setSession] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [logs, setLogs] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  const addLog = (message: string) => {
    console.log(message)
    setLogs((prev) => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
  }

  useEffect(() => {
    checkSession()
  }, [])

  const checkSession = async () => {
    try {
      addLog("Verificando sesión...")
      const { data, error } = await supabase.auth.getSession()

      if (error) {
        addLog(`Error al obtener sesión: ${error.message}`)
        return
      }

      if (data.session) {
        addLog(`Sesión encontrada para: ${data.session.user.email}`)
        setSession(data.session)
        await checkProfile(data.session.user.id)
      } else {
        addLog("No hay sesión activa")
      }
    } catch (error: any) {
      addLog(`Error inesperado: ${error.message}`)
    }
  }

  const checkProfile = async (userId: string) => {
    try {
      addLog("Verificando perfil...")
      const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single()

      if (error) {
        addLog(`Error al obtener perfil: ${error.message} (código: ${error.code})`)
        setProfile(null)
      } else {
        addLog(`Perfil encontrado: ${JSON.stringify(data)}`)
        setProfile(data)
      }
    } catch (error: any) {
      addLog(`Error inesperado al verificar perfil: ${error.message}`)
    }
  }

  const createProfile = async () => {
    if (!session) {
      addLog("No hay sesión para crear perfil")
      return
    }

    setLoading(true)
    try {
      addLog("Creando perfil...")
      const { data, error } = await supabase
        .from("profiles")
        .insert({
          id: session.user.id,
          updated_at: new Date().toISOString(),
        })
        .select()

      if (error) {
        addLog(`Error al crear perfil: ${error.message}`)
      } else {
        addLog(`Perfil creado: ${JSON.stringify(data)}`)
        setProfile(data[0])
      }
    } catch (error: any) {
      addLog(`Error inesperado al crear perfil: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const setUserType = async (userType: string) => {
    if (!session) {
      addLog("No hay sesión para establecer tipo")
      return
    }

    setLoading(true)
    try {
      addLog(`Estableciendo tipo de usuario: ${userType}`)
      const { data, error } = await supabase
        .from("profiles")
        .update({
          user_type: userType,
          updated_at: new Date().toISOString(),
        })
        .eq("id", session.user.id)
        .select()

      if (error) {
        addLog(`Error al establecer tipo: ${error.message}`)
      } else {
        addLog(`Tipo establecido: ${JSON.stringify(data)}`)
        setProfile(data[0])
      }
    } catch (error: any) {
      addLog(`Error inesperado al establecer tipo: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const loginWithGoogle = async () => {
    try {
      addLog("Iniciando login con Google...")
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/test-auth`,
        },
      })

      if (error) {
        addLog(`Error en login con Google: ${error.message}`)
      } else {
        addLog("Redirigiendo a Google...")
      }
    } catch (error: any) {
      addLog(`Error inesperado en login: ${error.message}`)
    }
  }

  const logout = async () => {
    try {
      addLog("Cerrando sesión...")
      await supabase.auth.signOut()
      setSession(null)
      setProfile(null)
      addLog("Sesión cerrada")
    } catch (error: any) {
      addLog(`Error al cerrar sesión: ${error.message}`)
    }
  }

  return (
    <div className="container mx-auto p-8 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">Diagnóstico de Autenticación</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Estado Actual</h2>

          <div className="p-4 bg-gray-100 rounded">
            <h3 className="font-medium">Sesión:</h3>
            <pre className="text-sm mt-2 overflow-auto">
              {session ? JSON.stringify(session.user, null, 2) : "No hay sesión"}
            </pre>
          </div>

          <div className="p-4 bg-gray-100 rounded">
            <h3 className="font-medium">Perfil:</h3>
            <pre className="text-sm mt-2 overflow-auto">
              {profile ? JSON.stringify(profile, null, 2) : "No hay perfil"}
            </pre>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Acciones</h2>

          <div className="space-y-2">
            <Button onClick={checkSession} className="w-full">
              Verificar Sesión
            </Button>

            {!session && (
              <Button onClick={loginWithGoogle} className="w-full">
                Login con Google
              </Button>
            )}

            {session && !profile && (
              <Button onClick={createProfile} disabled={loading} className="w-full">
                Crear Perfil
              </Button>
            )}

            {session && profile && !profile.user_type && (
              <>
                <Button onClick={() => setUserType("professional")} disabled={loading} className="w-full">
                  Establecer como Profesional
                </Button>
                <Button onClick={() => setUserType("homeowner")} disabled={loading} className="w-full">
                  Establecer como Propietario
                </Button>
              </>
            )}

            {session && (
              <Button onClick={logout} variant="outline" className="w-full">
                Cerrar Sesión
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Logs</h2>
        <div className="bg-black text-green-400 p-4 rounded font-mono text-sm h-64 overflow-auto">
          {logs.map((log, index) => (
            <div key={index}>{log}</div>
          ))}
        </div>
        <Button onClick={() => setLogs([])} variant="outline" className="mt-2">
          Limpiar Logs
        </Button>
      </div>

      {session && profile && profile.user_type && (
        <div className="mt-6 p-4 bg-green-100 rounded">
          <h3 className="font-medium text-green-800">✅ Todo configurado correctamente</h3>
          <p className="text-green-700">Usuario: {session.user.email}</p>
          <p className="text-green-700">Tipo: {profile.user_type}</p>
          <Button onClick={() => (window.location.href = "/dashboard")} className="mt-2">
            Ir al Dashboard
          </Button>
        </div>
      )}
    </div>
  )
}
