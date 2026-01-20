import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { AuthProvider } from "@/components/auth/auth-provider"
import { ToastProvider } from "@/components/ui/toast-provider"
import { CookieConsentBanner } from "@/components/cookie-consent-banner"
import Script from "next/script"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Presupuéstalo - Cálculos rápidos para proyectos de reformas",
  description:
    "Calcula presupuestos de reformas con información mínima. Ahorra tiempo y obtén estimaciones precisas para tus proyectos.",
  generator: "v0.dev",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/favicon.svg",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || ""
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || ""

  return (
    <html lang="es" suppressHydrationWarning>
      {/* Google Analytics */}
      <Script src="https://www.googletagmanager.com/gtag/js?id=G-V6TH4192NL" strategy="afterInteractive" />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          
          // Set default consent to denied
          gtag('consent', 'default', {
            'analytics_storage': 'denied'
          });
          
          gtag('config', 'G-V6TH4192NL');
        `}
      </Script>

      {/* Microsoft Clarity */}
      <Script id="microsoft-clarity" strategy="afterInteractive">
        {`
          (function(c,l,a,r,i,t,y){
              c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
              t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
              y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
          })(window, document, "clarity", "script", "retnez88tk");
        `}
      </Script>

      <body className={inter.className} suppressHydrationWarning>
        <script
          dangerouslySetInnerHTML={{
            __html: `window.__SUPABASE_URL__=${JSON.stringify(supabaseUrl)};window.__SUPABASE_ANON_KEY__=${JSON.stringify(supabaseAnonKey)};`,
          }}
        />
        <AuthProvider>
          {children}
          <ToastProvider />
          <CookieConsentBanner />
        </AuthProvider>
      </body>
    </html>
  )
}
