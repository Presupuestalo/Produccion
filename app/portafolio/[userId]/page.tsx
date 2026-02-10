import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Star, MapPin, Globe, Phone, Mail } from "lucide-react"
import Link from "next/link"

export default async function PortafolioPublicoPage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params
  const supabase = await createClient()

  if (!supabase) {
    notFound()
  }

  // Obtener perfil del profesional
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .eq("user_type", "professional")
    .eq("portfolio_public", true)
    .single()

  if (!profile) {
    notFound()
  }

  // Obtener proyectos públicos del portafolio
  const { data: portfolioItems } = await supabase
    .from("professional_portfolio")
    .select("*, projects(*)")
    .eq("user_id", userId)
    .eq("is_public", true)
    .order("is_featured", { ascending: false })
    .order("display_order", { ascending: true })

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header del profesional */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-start gap-6">
              <div className="h-24 w-24 rounded-full bg-orange-100 flex items-center justify-center text-3xl font-bold text-orange-600">
                {profile.full_name?.charAt(0) || "P"}
              </div>
              <div className="flex-1">
                <h1 className="text-3xl font-bold mb-2">{profile.company_name || profile.full_name}</h1>
                {profile.bio && <p className="text-gray-600 mb-4">{profile.bio}</p>}
                <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                  {profile.city && (
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {profile.city}, {profile.province}
                    </div>
                  )}
                  {profile.website && (
                    <Link
                      href={profile.website}
                      target="_blank"
                      className="flex items-center gap-1 hover:text-orange-600"
                    >
                      <Globe className="h-4 w-4" />
                      Sitio web
                    </Link>
                  )}
                  {profile.phone && (
                    <div className="flex items-center gap-1">
                      <Phone className="h-4 w-4" />
                      {profile.phone}
                    </div>
                  )}
                  {profile.email && (
                    <Link href={`mailto:${profile.email}`} className="flex items-center gap-1 hover:text-orange-600">
                      <Mail className="h-4 w-4" />
                      Contactar
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Proyectos del portafolio */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold mb-6">Proyectos Realizados</h2>

          {!portfolioItems || portfolioItems.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <p>Este profesional aún no ha publicado proyectos en su portafolio.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {portfolioItems.map((item: any) => (
                <Card key={item.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="aspect-video bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center">
                    <span className="text-4xl font-bold text-orange-600">{item.title?.charAt(0) || "P"}</span>
                  </div>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-lg">{item.title}</h3>
                      {item.is_featured && (
                        <Badge variant="secondary" className="flex items-center gap-1">
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        </Badge>
                      )}
                    </div>
                    {item.description && (
                      <p className="text-sm text-muted-foreground line-clamp-3">{item.description}</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
