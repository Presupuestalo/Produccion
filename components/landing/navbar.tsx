"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Menu, X } from "lucide-react"
import { useState, useEffect } from "react"
import { Logo } from "@/components/ui/logo"

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

export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <header
      className={`sticky top-0 z-50 w-full border-b ${isScrolled ? "bg-background/95" : "bg-background"} backdrop-blur supports-[backdrop-filter]:bg-background/60`}
    >
      <div className="container flex h-16 items-center justify-between px-6 md:px-8">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center">
            <Logo size="lg" />
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          <Link href="/#features" className="text-sm font-medium hover:text-orange-500 transition-colors">
            Características
          </Link>
          <Link href="/#pricing" className="text-sm font-medium hover:text-orange-500 transition-colors">
            Precios
          </Link>
          <Link href="/contacto" className="text-sm font-medium hover:text-orange-500 transition-colors">
            Contacto
          </Link>
        </nav>

        <div className="hidden md:flex items-center gap-4">
          <Button asChild variant="ghost">
            <Link href="/auth/login">Iniciar sesión</Link>
          </Button>
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden p-2 -mr-2"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label={isMenuOpen ? "Cerrar menú" : "Abrir menú"}
        >
          {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="md:hidden px-6 py-4 bg-background/98 backdrop-blur-md border-b">
          <nav className="flex flex-col space-y-4">
            <Link
              href="/#features"
              className="text-base font-medium hover:text-orange-500 transition-colors py-1"
              onClick={() => setIsMenuOpen(false)}
            >
              Características
            </Link>
            <Link
              href="/#pricing"
              className="text-base font-medium hover:text-orange-500 transition-colors py-1"
              onClick={() => setIsMenuOpen(false)}
            >
              Precios
            </Link>
            <Link
              href="/contacto"
              className="text-base font-medium hover:text-orange-500 transition-colors py-1"
              onClick={() => setIsMenuOpen(false)}
            >
              Contacto
            </Link>
            <div className="pt-4 border-t">
              <Link
                href="/auth/login"
                className="text-base font-medium text-orange-600 hover:text-orange-500 transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Iniciar sesión
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}
