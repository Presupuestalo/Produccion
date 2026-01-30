
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, MessageCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export const dynamic = "force-dynamic";

export default async function DonationThankYouPage() {
  const supabase = await createClient();

  // Safe check for supabase client
  if (!supabase) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Error de configuración. Por favor contacta con soporte.</p>
      </div>
    )
  }

  const { data: { user } } = await supabase.auth.getUser();

  // Use the verified bot username
  const botUsername = "presupuestalobot";
  // Only generate link if user is logged in
  const telegramLink = user ? `https://t.me/${botUsername}?start=${user.id}` : "#";

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 mb-6">
            <CheckCircle2 className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">¡Muchas gracias por tu apoyo! ❤️</h1>
          <p className="text-xl text-gray-600">
            Tu contribución nos ayuda a seguir construyendo la mejor herramienta para profesionales de la reforma.
          </p>
        </div>

        <Card className="bg-white shadow-xl border-t-4 border-t-orange-500">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-2xl">Bienvenido a la comunidad privada</CardTitle>
            <CardDescription className="text-lg">
              Como agradecimiento, tienes acceso exclusivo a nuestro grupo de Telegram.
              <br />
              <span className="text-sm text-muted-foreground">(Es necesario vincular tu cuenta para poder entrar)</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            <div className="bg-blue-50 p-6 rounded-lg border border-blue-100 flex items-start gap-4">
              <div className="bg-blue-100 p-3 rounded-full shrink-0">
                <MessageCircle className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-blue-900 mb-2">¿Qué encontrarás aquí?</h3>
                <ul className="text-blue-800 space-y-2 list-disc list-inside">
                  <li>Votación de nuevas funcionalidades</li>
                  <li>Avances exclusivos del desarrollo</li>
                  <li>Contacto directo con el equipo</li>
                  <li>Comunidad con otros profesionales comprometidos</li>
                </ul>
              </div>
            </div>

            <div className="text-center p-4">
              <p className="text-gray-500 text-sm mb-4">
                {user
                  ? "Haz clic abajo para vincular tu cuenta y recibir tu invitación personal:"
                  : "Inicia sesión para reclamar tu acceso al grupo:"
                }
              </p>

              {user ? (
                <Button asChild size="lg" className="w-full sm:w-auto bg-[#24A1DE] hover:bg-[#1c8dbf] text-white gap-2 h-14 text-lg">
                  <Link href={telegramLink} target="_blank" rel="noopener noreferrer">
                    <MessageCircle className="w-6 h-6" />
                    Vincular y Unirse al Grupo
                  </Link>
                </Button>
              ) : (
                <Button asChild size="lg" className="w-full sm:w-auto bg-orange-600 hover:bg-orange-700 text-white gap-2 h-14 text-lg">
                  <Link href="/auth/login?redirect=/donar/gracias">
                    Iniciar Sesión para Unirme
                  </Link>
                </Button>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex justify-center border-t bg-gray-50 py-6">
            <Link href="/dashboard" className="text-gray-600 hover:text-gray-900 font-medium text-sm flex items-center hover:underline">
              Ir a mi Dashboard
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
