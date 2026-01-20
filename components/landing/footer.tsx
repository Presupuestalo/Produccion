import Link from "next/link"
import { Facebook, Instagram, Youtube } from "lucide-react"
import { Logo } from "@/components/ui/logo"

export function Footer() {
  return (
    <footer className="bg-gray-100 dark:bg-gray-900 py-12">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8">
          <div className="flex items-center mb-4 md:mb-0">
            <Logo size="md" />
          </div>
          <nav className="grid grid-cols-2 sm:grid-cols-3 md:flex items-center justify-center gap-x-8 gap-y-4 text-center md:text-left">
            <Link href="/" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Inicio
            </Link>
            <Link href="#features" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Características
            </Link>
            <Link href="#pricing" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Precios
            </Link>
            <Link href="#" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Blog
            </Link>
            <Link href="#" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Contacto
            </Link>
          </nav>
        </div>

        <div className="border-t border-gray-200 dark:border-gray-800 pt-8 pb-8">
          <div className="flex flex-col items-center gap-4">
            <p className="text-sm text-muted-foreground">Síguenos en redes sociales</p>
            <div className="flex gap-4">
              <Link
                href="https://www.facebook.com/profile.php?id=61584642298530"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-orange-600 dark:hover:text-orange-400 transition-colors"
                aria-label="Facebook"
              >
                <Facebook className="h-5 w-5" />
              </Link>
              <Link
                href="https://www.instagram.com/presupuestaloficial/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-orange-600 dark:hover:text-orange-400 transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="h-5 w-5" />
              </Link>
              <Link
                href="https://www.tiktok.com/@presupuestalo.com?_r=1&_t=ZN-914hRBIDMoA"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-orange-600 dark:hover:text-orange-400 transition-colors"
                aria-label="TikTok"
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
                </svg>
              </Link>
              <Link
                href="https://www.youtube.com/@presupuestaloficial"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-orange-600 dark:hover:text-orange-400 transition-colors"
                aria-label="YouTube"
              >
                <Youtube className="h-5 w-5" />
              </Link>
              <Link
                href="https://x.com/presupuestalo_"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-orange-600 dark:hover:text-orange-400 transition-colors"
                aria-label="X (Twitter)"
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </Link>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 dark:border-gray-800 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-muted-foreground mb-4 md:mb-0">
              © {new Date().getFullYear()} Presupuéstalo. Todos los derechos reservados.
            </p>
            <div className="flex flex-wrap justify-center gap-x-6 gap-y-2">
              <Link href="/aviso-legal" className="text-xs md:text-sm text-muted-foreground hover:text-foreground transition-colors">
                Aviso Legal
              </Link>
              <Link href="/politica-privacidad" className="text-xs md:text-sm text-muted-foreground hover:text-foreground transition-colors">
                Privacidad
              </Link>
              <Link href="/politica-cookies" className="text-xs md:text-sm text-muted-foreground hover:text-foreground transition-colors">
                Cookies
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
