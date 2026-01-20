import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function PoliticaPrivacidadPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <Link href="/">
          <Button variant="ghost" className="mb-8">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver al inicio
          </Button>
        </Link>

        <article className="bg-white rounded-lg shadow-sm p-8 md:p-12">
          <h1 className="text-4xl font-bold mb-4">Política de Privacidad</h1>
          <p className="text-muted-foreground mb-8">
            Última actualización:{" "}
            {new Date().toLocaleDateString("es-ES", { year: "numeric", month: "long", day: "numeric" })}
          </p>

          <div className="prose prose-gray max-w-none space-y-8">
            <section>
              <h2 className="text-2xl font-semibold mb-4">1. Información que Recopilamos</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                En Presupuéstalo, recopilamos la siguiente información cuando utilizas nuestra plataforma:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>
                  <strong>Información de cuenta:</strong> Nombre, correo electrónico, contraseña (encriptada), tipo de
                  usuario (reformista o cliente).
                </li>
                <li>
                  <strong>Información de proyectos:</strong> Datos de proyectos de reforma, presupuestos, planos,
                  mediciones y especificaciones técnicas.
                </li>
                <li>
                  <strong>Información de uso:</strong> Datos sobre cómo utilizas la plataforma, incluyendo páginas
                  visitadas, funciones utilizadas y tiempo de uso.
                </li>
                <li>
                  <strong>Información técnica:</strong> Dirección IP, tipo de navegador, sistema operativo, y datos de
                  dispositivo.
                </li>
                <li>
                  <strong>Archivos subidos:</strong> Planos, imágenes y documentos que subas a la plataforma para
                  análisis o generación de presupuestos.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">2. Cómo Utilizamos tu Información</h2>
              <p className="text-gray-700 leading-relaxed mb-4">Utilizamos la información recopilada para:</p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Proporcionar y mantener nuestros servicios de cálculo de presupuestos y gestión de proyectos.</li>
                <li>Procesar y analizar planos mediante inteligencia artificial.</li>
                <li>Generar presupuestos automáticos basados en tus especificaciones.</li>
                <li>Mejorar y personalizar tu experiencia en la plataforma.</li>
                <li>Comunicarnos contigo sobre actualizaciones, nuevas funciones y soporte técnico.</li>
                <li>Analizar el uso de la plataforma para mejorar nuestros servicios.</li>
                <li>Cumplir con obligaciones legales y proteger nuestros derechos.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">3. Compartir Información</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                No vendemos tu información personal. Podemos compartir tu información en las siguientes circunstancias:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>
                  <strong>Proveedores de servicios:</strong> Compartimos información con proveedores que nos ayudan a
                  operar la plataforma (hosting, análisis, procesamiento de pagos).
                </li>
                <li>
                  <strong>Servicios de IA:</strong> Utilizamos servicios de terceros para procesamiento de imágenes y
                  generación de contenido mediante IA.
                </li>
                <li>
                  <strong>Cumplimiento legal:</strong> Podemos divulgar información si es requerido por ley o para
                  proteger nuestros derechos.
                </li>
                <li>
                  <strong>Con tu consentimiento:</strong> Compartiremos información con terceros cuando nos des tu
                  consentimiento explícito.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">4. Seguridad de los Datos</h2>
              <p className="text-gray-700 leading-relaxed">
                Implementamos medidas de seguridad técnicas y organizativas para proteger tu información personal contra
                acceso no autorizado, pérdida, destrucción o alteración. Esto incluye encriptación de datos en tránsito
                y en reposo, controles de acceso estrictos, y auditorías de seguridad regulares.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">5. Retención de Datos</h2>
              <p className="text-gray-700 leading-relaxed">
                Conservamos tu información personal mientras tu cuenta esté activa o según sea necesario para
                proporcionarte servicios. Puedes solicitar la eliminación de tu cuenta y datos asociados en cualquier
                momento desde la configuración de tu perfil.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">6. Tus Derechos</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                De acuerdo con el RGPD y la legislación española de protección de datos, tienes derecho a:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>
                  <strong>Acceso:</strong> Solicitar una copia de tu información personal.
                </li>
                <li>
                  <strong>Rectificación:</strong> Corregir información inexacta o incompleta.
                </li>
                <li>
                  <strong>Supresión:</strong> Solicitar la eliminación de tu información personal.
                </li>
                <li>
                  <strong>Portabilidad:</strong> Recibir tus datos en un formato estructurado y de uso común.
                </li>
                <li>
                  <strong>Oposición:</strong> Oponerte al procesamiento de tus datos personales.
                </li>
                <li>
                  <strong>Limitación:</strong> Solicitar la limitación del procesamiento de tus datos.
                </li>
              </ul>
              <p className="text-gray-700 leading-relaxed mt-4">
                Para ejercer estos derechos, contacta con nosotros a través de la configuración de tu cuenta o enviando
                un correo a{" "}
                <a href="mailto:soporte@presupuestalo.com" className="text-orange-600 hover:underline">
                  soporte@presupuestalo.com
                </a>
                .
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">7. Cookies y Tecnologías Similares</h2>
              <p className="text-gray-700 leading-relaxed">
                Utilizamos cookies y tecnologías similares para mejorar tu experiencia, analizar el uso de la plataforma
                y personalizar el contenido. Puedes gestionar tus preferencias de cookies en la configuración de tu
                navegador. Para más información, consulta nuestra Política de Cookies.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">8. Servicios de Terceros</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Nuestra plataforma utiliza los siguientes servicios de terceros:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>
                  <strong>Supabase:</strong> Para autenticación y almacenamiento de datos.
                </li>
                <li>
                  <strong>Vercel:</strong> Para hosting y despliegue de la aplicación.
                </li>
                <li>
                  <strong>Google Analytics:</strong> Para análisis de uso de la plataforma.
                </li>
                <li>
                  <strong>Microsoft Clarity:</strong> Para análisis de comportamiento de usuarios.
                </li>
                <li>
                  <strong>Servicios de IA:</strong> Para procesamiento de imágenes y generación de contenido.
                </li>
              </ul>
              <p className="text-gray-700 leading-relaxed mt-4">
                Estos servicios tienen sus propias políticas de privacidad que te recomendamos revisar.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">9. Menores de Edad</h2>
              <p className="text-gray-700 leading-relaxed">
                Nuestros servicios no están dirigidos a menores de 18 años. No recopilamos intencionalmente información
                personal de menores. Si descubrimos que hemos recopilado información de un menor, la eliminaremos de
                inmediato.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">10. Cambios a esta Política</h2>
              <p className="text-gray-700 leading-relaxed">
                Podemos actualizar esta Política de Privacidad periódicamente. Te notificaremos sobre cambios
                significativos publicando la nueva política en esta página y actualizando la fecha de "Última
                actualización". Te recomendamos revisar esta política regularmente.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">11. Contacto</h2>
              <p className="text-gray-700 leading-relaxed">
                Si tienes preguntas sobre esta Política de Privacidad o sobre cómo manejamos tu información personal,
                puedes contactarnos en:
              </p>
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <p className="text-gray-700">
                  <strong>Email:</strong>{" "}
                  <a href="mailto:soporte@presupuestalo.com" className="text-orange-600 hover:underline">
                    soporte@presupuestalo.com
                  </a>
                </p>
                <p className="text-gray-700 mt-2">
                  <strong>Presupuéstalo</strong>
                </p>
                <p className="text-gray-700">Plataforma de cálculo de presupuestos para reformas</p>
              </div>
            </section>
          </div>
        </article>
      </div>
    </div>
  )
}
