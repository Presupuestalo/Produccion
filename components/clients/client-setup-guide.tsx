"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Info, Copy, Check, Database, Loader2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"

export function ClientSetupGuide() {
  const [copied, setCopied] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const sqlCode = `
-- Crear la tabla de clientes
CREATE TABLE public.clients (
id UUID PRIMARY KEY,
name TEXT NOT NULL,
email TEXT,
phone TEXT,
address TEXT,
notes TEXT,
user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Configurar seguridad RLS (Row Level Security)
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- Crear política para que los usuarios solo puedan ver sus propios clientes
CREATE POLICY "Users can view their own clients" 
ON public.clients 
FOR SELECT 
USING (auth.uid() = user_id);

-- Crear política para que los usuarios solo puedan insertar sus propios clientes
CREATE POLICY "Users can insert their own clients" 
ON public.clients 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Crear política para que los usuarios solo puedan actualizar sus propios clientes
CREATE POLICY "Users can update their own clients" 
ON public.clients 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Crear política para que los usuarios solo puedan eliminar sus propios clientes
CREATE POLICY "Users can delete their own clients" 
ON public.clients 
FOR DELETE 
USING (auth.uid() = user_id);
`.trim()

  const copyToClipboard = () => {
    navigator.clipboard.writeText(sqlCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const createTableAutomatically = async () => {
    setIsCreating(true)
    try {
      // Crear la tabla usando RPC
      const { data, error } = await fetch("/api/setup-clients-table", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      }).then((res) => res.json())

      if (error) {
        throw new Error(error)
      }

      toast({
        title: "¡Tabla creada correctamente!",
        description: "La tabla 'clients' ha sido creada en tu base de datos.",
      })

      // Refrescar la página después de un breve retraso
      setTimeout(() => {
        router.refresh()
      }, 1500)
    } catch (error: any) {
      console.error("Error al crear la tabla:", error)
      toast({
        title: "Error al crear la tabla",
        description:
          error.message || "No se pudo crear la tabla automáticamente. Por favor, sigue las instrucciones manuales.",
        variant: "destructive",
      })
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Configuración de la base de datos
        </CardTitle>
        <CardDescription>
          Es necesario crear la tabla "clients" en tu base de datos de Supabase para poder gestionar clientes.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Alert className="mb-6">
          <Info className="h-4 w-4" />
          <AlertTitle>La tabla "clients" no existe</AlertTitle>
          <AlertDescription>
            Debes crear la tabla "clients" en tu base de datos de Supabase para poder utilizar esta funcionalidad.
          </AlertDescription>
        </Alert>

        <div className="mb-6">
          <Button onClick={createTableAutomatically} disabled={isCreating} className="w-full gap-2">
            {isCreating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Creando tabla...
              </>
            ) : (
              <>
                <Database className="h-4 w-4" />
                Crear tabla automáticamente
              </>
            )}
          </Button>
          <p className="text-sm text-muted-foreground mt-2 text-center">
            Si el botón no funciona, sigue las instrucciones manuales a continuación.
          </p>
        </div>

        <Tabs defaultValue="sql">
          <TabsList className="mb-4">
            <TabsTrigger value="sql">SQL</TabsTrigger>
            <TabsTrigger value="instructions">Instrucciones</TabsTrigger>
          </TabsList>
          <TabsContent value="sql">
            <div className="relative">
              <pre className="bg-slate-950 text-slate-50 p-4 rounded-md overflow-x-auto text-sm">
                <code>{sqlCode}</code>
              </pre>
              <Button size="sm" variant="ghost" className="absolute top-2 right-2" onClick={copyToClipboard}>
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                <span className="sr-only">Copiar código</span>
              </Button>
            </div>
          </TabsContent>
          <TabsContent value="instructions">
            <div className="space-y-4">
              <h3 className="font-medium">Sigue estos pasos para crear la tabla:</h3>
              <ol className="list-decimal pl-5 space-y-2">
                <li>
                  Inicia sesión en tu{" "}
                  <a
                    href="https://app.supabase.io"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary underline"
                  >
                    panel de control de Supabase
                  </a>
                </li>
                <li>Selecciona tu proyecto</li>
                <li>Ve a la sección "SQL Editor" en el menú lateral</li>
                <li>Crea un nuevo script SQL</li>
                <li>Copia y pega el código SQL de la pestaña anterior</li>
                <li>Ejecuta el script haciendo clic en "Run"</li>
                <li>Verifica que la tabla se haya creado correctamente en la sección "Table Editor"</li>
              </ol>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter>
        <Button onClick={copyToClipboard} className="gap-2">
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          {copied ? "¡Copiado!" : "Copiar SQL"}
        </Button>
      </CardFooter>
    </Card>
  )
}
