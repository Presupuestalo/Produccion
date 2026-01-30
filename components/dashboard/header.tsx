"use client"
import React, { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { createBrowserClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Menu,
  User,
  Settings,
  LogOut,
  Bell,
  ChevronDown,
  Coins,
  X,
  FileText,
  ClipboardList,
  Briefcase,
  BarChart,
  Users,
  Mail,
  Gift,
  Crown,
  PenTool,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Logo } from "@/components/ui/logo"
import { Badge } from "@/components/ui/badge"

function CalculatorIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-6 w-6 text-orange-600 dark:text-orange-400"
    >
      <rect width="16" height="20" x="4" y="2" rx="2"></rect>
      <line x1="8" x2="16" y1="6" y2="6"></line>
      <line x1="16" x2="16" y1="14" y2="18"></line>
      <path d="M16 10h.01"></path>
      <path d="M12 10h.01"></path>
      <path d="M8 10h.01"></path>
      <path d="M12 14h.01"></path>
      <path d="M8 14h.01"></path>
      <path d="M12 18h.01"></path>
      <path d="M8 18h.01"></path>
    </svg>
  )
}

export function DashboardHeader() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [userType, setUserType] = useState<string | null>(null)
  const [userName, setUserName] = useState<string>("")
  const [userAvatar, setUserAvatar] = useState<string>("")
  const [isAdmin, setIsAdmin] = useState(false)
  const [isMaster, setIsMaster] = useState(false)
  const [userCredits, setUserCredits] = useState<number>(0)
  const [isCoordinator, setIsCoordinator] = useState(false)
  const [isProUser, setIsProUser] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createBrowserClient()

  useEffect(() => {
    const getUserData = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()

        console.log("[v0] HEADER - Session:", session?.user?.email)

        if (session?.user) {
          const adminEmails = ["mikelfedz@gmail.com", "mikelfedzmcc@gmail.com", "presupuestaloficial@gmail.com"]
          const isAdminEmail = adminEmails.includes(session.user.email || "")

          const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("user_type, full_name, avatar_url, is_admin, role, work_mode, phone, phone_verified, email, subscription_plan")
            .eq("id", session.user.id)
            .single()

          console.log("[v0] HEADER - Profile query result:", { profile, error: profileError?.message })

          const effectiveUserType = profile?.user_type || session.user.user_metadata?.user_type || null
          setUserType(effectiveUserType)
          setUserName(
            profile?.full_name || session.user.user_metadata?.name || session.user.email?.split("@")[0] || "Usuario",
          )
          setUserAvatar(profile?.avatar_url || session.user.user_metadata?.picture || "")
          setIsAdmin(profile?.is_admin || isAdminEmail)
          setIsMaster(profile?.role === "master")
          setIsCoordinator(profile?.work_mode === "coordinator")

          // Set subscription plan
          const plan = profile?.subscription_plan?.toLowerCase() || "free"
          const isPro = ["pro", "premium", "enterprise", "business"].includes(plan)
          setIsProUser(isPro)

          if (
            effectiveUserType === "professional" ||
            effectiveUserType === "profesional" ||
            effectiveUserType === "company"
          ) {
            // Fetch credits via our API instead of direct Supabase to avoid 406/RLS issues
            const response = await fetch("/api/credits/balance")
            if (response.ok) {
              const data = await response.json()
              setUserCredits(data.credits_balance || 0)
            } else {
              console.warn("[v0] HEADER - Failed to fetch balance via API")
              // Fallback to 0 if API fails
              setUserCredits(0)
            }
          }
        }
      } catch (error) {
        console.error("[v0] HEADER - Error al obtener datos de usuario:", error)
      }
    }

    getUserData()
  }, [])

  useEffect(() => {
    const handleWorkModeChange = (event: CustomEvent<{ workMode: string }>) => {
      const newWorkMode = event.detail.workMode
      setIsCoordinator(newWorkMode === "coordinator")
    }

    window.addEventListener("workModeChanged", handleWorkModeChange as EventListener)

    return () => {
      window.removeEventListener("workModeChanged", handleWorkModeChange as EventListener)
    }
  }, [])

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut()
      router.push("/auth/login")
    } catch (error) {
      console.error("Error al cerrar sesión:", error)
    }
  }

  const getInitials = (name: string) => {
    if (!name) return "U"
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2)
  }

  const getNavItems = () => {
    interface NavItem {
      name: string
      href: string
      icon: () => React.ReactNode
      highlight?: boolean
    }

    const baseItems: NavItem[] = [
      {
        name: "Proyectos",
        href: "/dashboard/projects",
        icon: () => <FileText className="h-5 w-5" />,
      },
    ]

    // IA and Editor de Planos are restricted to MASTER
    if (isMaster) {
      baseItems.push({
        name: "Editor de Planos",
        href: "/dashboard/editor-planos",
        icon: () => <PenTool className="h-5 w-5" />,
      })
    }

    const isHomeowner = userType === "homeowner" || userType === "propietario"
    const isProfessional = userType === "professional" || userType === "profesional" || userType === "company"

    if (isHomeowner) {
      baseItems.push({
        name: "Mis Solicitudes",
        href: "/dashboard/mis-solicitudes",
        icon: () => <ClipboardList className="h-5 w-5" />,
      })
    }

    if (isProfessional) {
      if (isCoordinator) {
        baseItems.push({
          name: "Coordinación",
          href: "/dashboard/coordinacion",
          icon: () => <Users className="h-5 w-5" />,
        })
      }

      baseItems.push({
        name: "Precios",
        href: "/dashboard/precios",
        icon: () => <Coins className="h-5 w-5" />,
      })
      baseItems.push({
        name: "Clientes",
        href: "/dashboard/clients",
        icon: () => <Users className="h-5 w-5" />,
      })
    }

    if (isMaster) {
      baseItems.push({
        name: "Presmarket",
        href: "/dashboard/solicitudes-disponibles",
        icon: () => <Briefcase className="h-5 w-5" />,
        highlight: true,
      })
      baseItems.push({
        name: "Contabilidad",
        href: "/dashboard/contabilidad",
        icon: () => <BarChart className="h-5 w-5" />,
      })
      baseItems.push({
        name: "Citas",
        href: "/dashboard/citas",
        icon: () => <ChevronDown className="h-5 w-5" />,
      })
      baseItems.push({
        name: "IA",
        href: "/dashboard/ia",
        icon: () => <Settings className="h-5 w-5" />,
      })
    }

    baseItems.push({
      name: "Contacto",
      href: "/dashboard/contacto",
      icon: () => <Mail className="h-5 w-5" />,
    })

    if (isAdmin) {
      baseItems.push({
        name: "Panel Admin",
        href: "/dashboard/admin",
        icon: () => <ShieldCheck className="h-5 w-5 text-purple-600" />,
        highlight: true,
      })
    }

    return baseItems
  }

  const navItems = getNavItems()

  return (
    <>
      <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6">
        <div className="flex items-center gap-2 md:hidden">
          <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            <Menu className="h-6 w-6" />
            <span className="sr-only">Toggle menu</span>
          </Button>
          <Link href="/dashboard" className="flex items-center">
            <Logo size="md" />
          </Link>
        </div>

        <Link href="/dashboard" className="hidden md:flex items-center">
          <Logo size="lg" />
        </Link>

        <div className="hidden md:flex items-center gap-6">
          {navItems.map((item) => {
            const isRestricted = (item.name === "IA" || item.name === "Precios" || item.name === "Contabilidad") && !isProUser

            if (item.highlight) {
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "text-sm font-semibold px-3 py-1.5 rounded-full transition-colors",
                    pathname === item.href
                      ? "bg-orange-500 text-white"
                      : "bg-orange-100 text-orange-700 hover:bg-orange-200",
                  )}
                >
                  {item.name}
                </Link>
              )
            }

            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "text-sm font-medium text-muted-foreground hover:text-foreground flex items-center gap-1",
                  pathname === item.href && "text-foreground",
                )}
              >
                <span>{item.name}</span>
              </Link>
            )
          })}
        </div>

        <div className="ml-auto flex items-center gap-4">
          {isMaster && (userType === "professional" || userType === "profesional" || userType === "company") && (
            <Link
              href="/dashboard/creditos"
              className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-orange-100 text-orange-700 rounded-full text-sm font-medium hover:bg-orange-200 transition-colors"
            >
              <Coins className="h-4 w-4" />
              <span>{userCredits} créditos</span>
            </Link>
          )}

          {isMaster && (
            <Button variant="ghost" size="icon">
              <Bell className="h-5 w-5" />
              <span className="sr-only">Notifications</span>
            </Button>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <Avatar>
                  <AvatarImage src={userAvatar || "/placeholder.svg"} alt={userName} />
                  <AvatarFallback className="bg-orange-100 text-orange-700">{getInitials(userName)}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Mi cuenta</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/dashboard/profile" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Perfil
                </Link>
              </DropdownMenuItem>
              {(userType === "professional" || userType === "profesional" || userType === "company") && (
                <>
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/empresa" className="flex items-center gap-2">
                      <Settings className="h-4 w-4" />
                      Empresa
                    </Link>
                  </DropdownMenuItem>
                  {isMaster && (
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard/creditos" className="flex items-center gap-2">
                        <Coins className="h-4 w-4" />
                        Créditos ({userCredits})
                      </Link>
                    </DropdownMenuItem>
                  )}
                  {isMaster && (
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard/professional/works" className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Galería de Trabajos
                      </Link>
                    </DropdownMenuItem>
                  )}
                </>
              )}
              {isAdmin && (
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/admin/usuarios" className="flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    Panel Admin
                  </Link>
                </DropdownMenuItem>
              )}
              {isMaster && (userType === "professional" || userType === "profesional" || userType === "company") && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/referidos" className="flex items-center gap-2">
                      <Gift className="h-4 w-4 text-orange-500" />
                      <span>Programa de Referidos</span>
                    </Link>
                  </DropdownMenuItem>
                </>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Cerrar sesión
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Mobile navigation */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 bg-background md:hidden">
          <div className="flex h-16 items-center gap-4 border-b bg-background px-4">
            <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(false)}>
              <X className="h-6 w-6" />
              <span className="sr-only">Close menu</span>
            </Button>
            <Link href="/dashboard" className="flex items-center">
              <Logo size="md" />
            </Link>
          </div>
          <nav className="grid gap-2 p-4">
            {isMaster && (userType === "professional" || userType === "profesional" || userType === "company") && (
              <Link
                href="/dashboard/creditos"
                className="flex items-center justify-between gap-2 rounded-lg px-3 py-2 bg-orange-100 text-orange-700"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <div className="flex items-center gap-2">
                  <Coins className="h-5 w-5" />
                  Mis Créditos
                </div>
                <span className="bg-orange-600 text-white px-2 py-1 rounded-full text-sm font-medium">
                  {userCredits}
                </span>
              </Link>
            )}

            {navItems.map((item) => {
              const isRestricted = (item.name === "IA" || item.name === "Precios" || item.name === "Contabilidad") && !isProUser
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center justify-between rounded-lg px-3 py-2",
                    item.highlight
                      ? "bg-orange-50 text-orange-700 border-2 border-orange-300 font-semibold"
                      : "text-gray-500 bg-gray-100 hover:bg-gray-200 hover:text-gray-900",
                  )}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <div className="flex items-center gap-2">
                    {item.icon()}
                    {item.name}
                  </div>
                </Link>
              )
            })}
            {(userType === "professional" || userType === "profesional" || userType === "company") && (
              <Link
                href="/dashboard/referidos"
                className="w-full justify-start text-orange-600 hover:text-gray-900 mt-4 flex items-center gap-2"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Gift className="h-5 w-5 mr-2 text-orange-500" />
                Programa de Referidos
              </Link>
            )}
            {isAdmin && (
              <Link
                href="/dashboard/admin/usuarios"
                className="w-full justify-start text-orange-600 hover:text-gray-900 mt-4 flex items-center gap-2"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Settings className="h-5 w-5 mr-2" />
                Panel Admin
              </Link>
            )}
            <Button
              variant="ghost"
              className="w-full justify-start text-gray-500 hover:text-gray-900 mt-4"
              onClick={handleSignOut}
            >
              <LogOut className="mr-2 h-5 w-5" />
              Cerrar sesión
            </Button>
          </nav>
        </div>
      )}
    </>
  )
}
