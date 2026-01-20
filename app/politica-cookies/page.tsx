export default function PoliticaCookiesPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <h1 className="text-4xl font-bold mb-8">Política de Cookies</h1>

        <div className="prose prose-gray dark:prose-invert max-w-none space-y-6">
          <section>
            <h2 className="text-2xl font-semibold mb-4">¿Qué son las cookies?</h2>
            <p>
              Una cookie es un fichero que se descarga en su ordenador al acceder a determinadas páginas web. Las
              cookies permiten a una página web, entre otras cosas, almacenar y recuperar información sobre los hábitos
              de navegación de un usuario o de su equipo y, dependiendo de la información que contengan y de la forma en
              que utilice su equipo, pueden utilizarse para reconocer al usuario.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">¿Qué tipos de cookies utiliza esta página web?</h2>

            <h3 className="text-xl font-semibold mt-6 mb-3">Cookies técnicas</h3>
            <p>
              Son aquellas que permiten al usuario la navegación a través de una página web, plataforma o aplicación y
              la utilización de las diferentes opciones o servicios que en ella existan como, por ejemplo, controlar el
              tráfico y la comunicación de datos, identificar la sesión, acceder a partes de acceso restringido,
              recordar los elementos que integran un pedido, realizar el proceso de compra de un pedido, realizar la
              solicitud de inscripción o participación en un evento, utilizar elementos de seguridad durante la
              navegación, almacenar contenidos para la difusión de vídeos o sonido o compartir contenidos a través de
              redes sociales.
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-3">Cookies de análisis</h3>
            <p>
              Son aquellas que permiten al responsable de las mismas, el seguimiento y análisis del comportamiento de
              los usuarios de los sitios web a los que están vinculadas. La información recogida mediante este tipo de
              cookies se utiliza en la medición de la actividad de los sitios web, aplicación o plataforma y para la
              elaboración de perfiles de navegación de los usuarios de dichos sitios, aplicaciones y plataformas, con el
              fin de introducir mejoras en función del análisis de los datos de uso que hacen los usuarios del servicio.
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-3">Cookies de terceros</h3>
            <p>
              Esta página web utiliza servicios de terceros que recopilan información con fines estadísticos y de uso de
              la web. En concreto, utilizamos:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Google Analytics:</strong> Para analizar el uso del sitio web y mejorar la experiencia del
                usuario
              </li>
              <li>
                <strong>Microsoft Clarity:</strong> Para entender cómo los usuarios interactúan con nuestro sitio web
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Cookies utilizadas en www.presupuestalo.com</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full border border-gray-300 dark:border-gray-700">
                <thead className="bg-gray-100 dark:bg-gray-800">
                  <tr>
                    <th className="border border-gray-300 dark:border-gray-700 px-4 py-2">Cookie</th>
                    <th className="border border-gray-300 dark:border-gray-700 px-4 py-2">Tipo</th>
                    <th className="border border-gray-300 dark:border-gray-700 px-4 py-2">Finalidad</th>
                    <th className="border border-gray-300 dark:border-gray-700 px-4 py-2">Duración</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-gray-300 dark:border-gray-700 px-4 py-2">_ga</td>
                    <td className="border border-gray-300 dark:border-gray-700 px-4 py-2">Análisis</td>
                    <td className="border border-gray-300 dark:border-gray-700 px-4 py-2">
                      Google Analytics - Distinguir usuarios
                    </td>
                    <td className="border border-gray-300 dark:border-gray-700 px-4 py-2">2 años</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 dark:border-gray-700 px-4 py-2">_gid</td>
                    <td className="border border-gray-300 dark:border-gray-700 px-4 py-2">Análisis</td>
                    <td className="border border-gray-300 dark:border-gray-700 px-4 py-2">
                      Google Analytics - Distinguir usuarios
                    </td>
                    <td className="border border-gray-300 dark:border-gray-700 px-4 py-2">24 horas</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 dark:border-gray-700 px-4 py-2">_clck</td>
                    <td className="border border-gray-300 dark:border-gray-700 px-4 py-2">Análisis</td>
                    <td className="border border-gray-300 dark:border-gray-700 px-4 py-2">
                      Microsoft Clarity - Identificar sesión
                    </td>
                    <td className="border border-gray-300 dark:border-gray-700 px-4 py-2">1 año</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 dark:border-gray-700 px-4 py-2">_clsk</td>
                    <td className="border border-gray-300 dark:border-gray-700 px-4 py-2">Análisis</td>
                    <td className="border border-gray-300 dark:border-gray-700 px-4 py-2">
                      Microsoft Clarity - Conectar múltiples páginas
                    </td>
                    <td className="border border-gray-300 dark:border-gray-700 px-4 py-2">1 día</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 dark:border-gray-700 px-4 py-2">cookie_consent</td>
                    <td className="border border-gray-300 dark:border-gray-700 px-4 py-2">Técnica</td>
                    <td className="border border-gray-300 dark:border-gray-700 px-4 py-2">
                      Almacenar preferencias de cookies
                    </td>
                    <td className="border border-gray-300 dark:border-gray-700 px-4 py-2">1 año</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">¿Cómo puedo desactivar o eliminar las cookies?</h2>
            <p>
              Puede usted permitir, bloquear o eliminar las cookies instaladas en su equipo mediante la configuración de
              las opciones del navegador instalado en su ordenador:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <a
                  href="https://support.google.com/chrome/answer/95647?hl=es"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  Google Chrome
                </a>
              </li>
              <li>
                <a
                  href="https://support.mozilla.org/es/kb/habilitar-y-deshabilitar-cookies-sitios-web-rastrear-preferencias"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  Mozilla Firefox
                </a>
              </li>
              <li>
                <a
                  href="https://support.apple.com/es-es/guide/safari/sfri11471/mac"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  Safari
                </a>
              </li>
              <li>
                <a
                  href="https://support.microsoft.com/es-es/microsoft-edge/eliminar-las-cookies-en-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  Microsoft Edge
                </a>
              </li>
            </ul>
            <p className="mt-4">
              Si tiene dudas sobre esta política de cookies, puede contactar con Presupuéstalo en
              soporte@presupuestalo.com
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Actualización de la Política de Cookies</h2>
            <p>
              Es posible que actualicemos la Política de Cookies de nuestro sitio web, por ello le recomendamos revisar
              esta política cada vez que acceda a nuestro sitio web con el objetivo de estar adecuadamente informado
              sobre cómo y para qué usamos las cookies.
            </p>
            <p className="mt-4">
              <strong>Última actualización:</strong>{" "}
              {new Date().toLocaleDateString("es-ES", { year: "numeric", month: "long", day: "numeric" })}
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
