import { ContactForm } from "@/components/contact-form"
import { Navbar } from "@/components/landing/navbar"
import { Footer } from "@/components/landing/footer"

export default function ContactoPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <section className="py-12 md:py-24">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center text-center mb-12">
              <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl">
                Contacta con nosotros
              </h1>
              <p className="mt-4 max-w-[700px] text-gray-500 md:text-xl dark:text-gray-400">
                ¿Tienes alguna pregunta o necesitas ayuda? Estamos aquí para ayudarte.
              </p>
            </div>
            <ContactForm />
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
