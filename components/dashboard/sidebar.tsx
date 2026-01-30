"use client"
import React, { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  LayoutDashboard,
  FileText,
  Settings,
  BarChart,
  LogOut,
  ChevronLeft,
  Calendar,
  Euro,
  Sparkles,
  Mail,
  ClipboardList,
  Briefcase,
} from "lucide-react" // Added ClipboardList icon for requests
import { getSupabase } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Logo, LogoIcon } from "@/components/ui/logo"

// Crear un contexto para compartir el estado del sidebar
import { createContext, useContext } from "react"

type SidebarContextType = {
  collapsed: boolean
  toggleSidebar: () => void
}

const SidebarContext = createContext<SidebarContextType | null>(null)

export const useSidebar = () => useContext(SidebarContext)

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  // Obtener el estado inicial del localStorage si está disponible
  const [collapsed, setCollapsed] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
    // Verificar si estamos en el cliente
    if (typeof window !== "undefined") {
      try {
        const savedState = localStorage.getItem("sidebarCollapsed")
        if (savedState) {
          setCollapsed(savedState === "true")
        }
      } catch (error) {
        console.error("Error al acceder a localStorage:", error)
      }
    }
  }, [])

  useEffect(() => {
    if (!isMounted) return

    try {
      const content = document.querySelector(".sidebar-content")
      if (content) {
        if (collapsed) {
          content.classList.remove("ml-64")
          content.classList.add("ml-16")
        } else {
          content.classList.remove("ml-16")
          content.classList.add("ml-64")
        }
      }
    } catch (error) {
      console.error("Error al manipular clases del sidebar:", error)
    }
  }, [collapsed, isMounted])

  const toggleSidebar = () => {
    try {
      const newState = !collapsed
      setCollapsed(newState)
      // Guardar el estado en localStorage
      if (typeof window !== "undefined") {
        localStorage.setItem("sidebarCollapsed", String(newState))
      }
    } catch (error) {
      console.error("Error al cambiar el estado del sidebar:", error)
    }
  }

  return <SidebarContext.Provider value={{ collapsed, toggleSidebar }}>{children}</SidebarContext.Provider>
}



export function DashboardSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const sidebarContext = useSidebar()
  const collapsed = sidebarContext?.collapsed || false
  const toggleSidebar = sidebarContext?.toggleSidebar || (() => { })
  const [userType, setUserType] = useState<string | null>(null)
  const [isProUser, setIsProUser] = useState(false)
  const [isMaster, setIsMaster] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)

  // Obtener el tipo de usuario
  useEffect(() => {
    const getUserType = async () => {
      try {
        setIsLoading(true)
        console.log("[v0] Sidebar: Obteniendo tipo de usuario...")
        const supabase = await getSupabase()
        if (!supabase) return

        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (session?.user) {
          console.log("[v0] Sidebar: Usuario autenticado:", session.user.id)
          const adminEmails = ["mikelfedz@gmail.com", "mikelfedzmcc@gmail.com", "presupuestaloficial@gmail.com"]
          const isAdminEmail = adminEmails.includes(session.user.email || "")

          const { data: profile, error } = await supabase
            .from("profiles")
            .select("user_type, subscription_plan, role, is_admin")
            .eq("id", session.user.id)
            .single()

          if (error) {
            console.error("[v0] Sidebar: Error al obtener perfil:", error)
          }

          console.log("[v0] Sidebar: Perfil obtenido:", profile)
          console.log("[v0] Sidebar: user_type:", profile?.user_type)
          setUserType(profile?.user_type || null)
          setIsMaster(profile?.role === "master")
          setIsAdmin(profile?.is_admin || isAdminEmail)

          const plan = profile?.subscription_plan?.toLowerCase() || "free"
          const isPro = ["pro", "premium", "enterprise", "business"].includes(plan)
          setIsProUser(isPro)
        }
      } catch (error) {
        console.error("[v0] Sidebar: Error al obtener tipo de usuario:", error)
      } finally {
        setIsLoading(false)
      }
    }

    getUserType()
  }, [])

  // Configurar elementos de navegación según el tipo de usuario
  const getNavItems = () => {
    console.log("[v0] Sidebar: Generando menú para tipo de usuario:", userType)

    const baseItems = [
      {
        name: "Dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
        comingSoon: false,
      },
      {
        name: "Proyectos",
        href: "/dashboard/projects",
        icon: FileText,
        comingSoon: false,
      },
    ]

    if (isAdmin) {
      baseItems.push({
        name: "Panel Admin",
        href: "/dashboard/admin",
        icon: Settings, // Or ShieldCheck
        comingSoon: false,
      })
    }

    if (isMaster) {
      baseItems.push({
        name: "Editor 2D",
        href: "/dashboard/editor-planos",
        icon: Sparkles,
        comingSoon: false,
      })
    }

    if (userType === "homeowner" || userType === "propietario") {
      baseItems.push({
        name: "Mis Solicitudes",
        href: "/dashboard/mis-solicitudes",
        icon: ClipboardList,
        comingSoon: false,
      })
    }

    if (userType === "professional" || userType === "profesional") {
      console.log("[v0] Sidebar: Añadiendo menú Precios para usuario:", userType)
      baseItems.push({
        name: "Precios",
        href: "/dashboard/precios",
        icon: Euro,
        comingSoon: false,
      })
    } else if (userType === "company") {
      baseItems.push({
        name: "Precios",
        href: "/dashboard/precios",
        icon: Euro,
        comingSoon: false,
      })
    } else {
      console.log("[v0] Sidebar: NO añadiendo menú Precios. Tipo de usuario:", userType)
    }

    if (isMaster) {
      baseItems.push({
        name: "IA Asistente",
        href: "/dashboard/ia",
        icon: Sparkles,
        comingSoon: false,
      })
      baseItems.push({
        name: "Ofertas Disponibles",
        href: "/dashboard/professional/leads",
        icon: Briefcase,
        comingSoon: false,
      })
      baseItems.push({
        name: "Citas",
        href: "/dashboard/citas",
        icon: Calendar,
        comingSoon: false,
      })
      baseItems.push({
        name: "Contabilidad",
        href: "/dashboard/contabilidad",
        icon: BarChart,
        comingSoon: false,
      })
      baseItems.push({
        name: "Galería de Trabajos",
        href: "/dashboard/professional/works",
        icon: FileText,
        comingSoon: false,
      })
    }

    baseItems.push({
      name: "Contacto",
      href: "/dashboard/contacto",
      icon: Mail,
      comingSoon: false,
    })

    // Opciones comunes para todos
    baseItems.push(
      {
        name: "Agenda",
        href: "/dashboard/agenda",
        icon: Calendar,
        comingSoon: false,
      },
      {
        name: "Estadísticas",
        href: "/dashboard/stats",
        icon: BarChart,
        comingSoon: false,
      },
      {
        name: "Ajustes",
        href: "/dashboard/ajustes",
        icon: Settings,
        comingSoon: false,
      },
    )

    return baseItems
  }

  const navItems = getNavItems()

  return (
    <div
      className={cn(
        "fixed inset-y-0 left-0 z-10 flex flex-col bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-all duration-300 ease-in-out",
        collapsed ? "w-16" : "w-64",
      )}
    >
      <div className="flex items-center h-16 flex-shrink-0 px-4 border-b border-gray-200 dark:border-gray-700 justify-between">
        {!collapsed && (
          <Link href="/dashboard" className="flex items-center">
            <Logo size="md" />
          </Link>
        )}
        {collapsed && (
          <Link href="/dashboard" className="flex items-center justify-center w-full">
            <LogoIcon size={28} />
          </Link>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className={cn(
            "absolute -right-3 top-20 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full z-20",
            collapsed ? "rotate-180" : "",
          )}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex-1 flex flex-col overflow-y-auto pt-5 pb-4">
        <nav className="mt-5 flex-1 px-2 space-y-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex justify-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500"></div>
            </div>
          ) : (
            <ul className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon
                return (
                  <li key={item.name}>
                    {item.comingSoon ? (
                      <div
                        className={cn(
                          "text-gray-400 cursor-not-allowed group flex items-center py-2 text-sm font-medium rounded-md transition-colors",
                          collapsed ? "px-2 justify-center" : "px-2",
                        )}
                        title={collapsed ? `${item.name} (Próximamente)` : ""}
                      >
                        <Icon
                          className={cn("text-gray-300 flex-shrink-0 h-5 w-5", collapsed ? "mx-auto" : "mr-3")}
                          aria-hidden="true"
                        />
                        {!collapsed && (
                          <div className="flex items-center justify-between w-full">
                            <span>{item.name}</span>
                            <Badge variant="secondary" className="text-xs ml-2">
                              Próximamente
                            </Badge>
                          </div>
                        )}
                      </div>
                    ) : (
                      <Link
                        href={item.href}
                        className={cn(
                          pathname === item.href
                            ? "bg-gray-50 text-orange-600 dark:bg-gray-700 dark:text-orange-400"
                            : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white",
                          "group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors",
                          collapsed ? "justify-center" : "",
                        )}
                      >
                        <Icon
                          className={cn(
                            pathname === item.href
                              ? "text-orange-600 dark:text-orange-400"
                              : "text-gray-400 group-hover:text-gray-500 dark:text-gray-400 dark:group-hover:text-gray-300",
                            "flex-shrink-0 h-5 w-5",
                            collapsed ? "mx-auto" : "mr-3",
                          )}
                          aria-hidden="true"
                        />
                        {!collapsed && (
                          <div className="flex items-center justify-between w-full">
                            <span>{item.name}</span>
                          </div>
                        )}
                      </Link>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </nav>
      </div>

      <div className="flex-shrink-0 flex border-t border-gray-200 dark:border-gray-700 p-4">
        <Button
          variant="ghost"
          className={cn(
            "text-gray-600 dark:text-gray-300 transition-colors",
            collapsed ? "px-2 justify-center w-full" : "w-full justify-start",
          )}
          onClick={() => router.push("/")}
          title={collapsed ? "Cerrar sesión" : ""}
        >
          <LogOut className={cn("h-5 w-5", collapsed ? "mx-auto" : "mr-3")} />
          {!collapsed && "Cerrar sesión"}
        </Button>
      </div>
    </div>
  )
}
