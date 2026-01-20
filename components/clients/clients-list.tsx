"use client"

import type React from "react"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Mail, Phone, MapPin, FileText, User, Users } from "lucide-react"
import Link from "next/link"
import type { Project } from "@/types/project"
import { Badge } from "@/components/ui/badge"

interface ClientsListProps {
  projects: Project[] | null
  coordinationProjects: any[] | null
  error: string | null
}

// Tipo para representar un cliente extraído de los proyectos
interface ClientInfo {
  name: string
  email?: string
  phone?: string
  address?: string
  notes?: string
  projectCount: number
  projects: Array<{
    id: string
    title: string
    type: "regular" | "coordination"
  }>
}

export function ClientsList({ projects, coordinationProjects, error }: ClientsListProps) {
  // Estado para la búsqueda
  const [searchTerm, setSearchTerm] = useState("")

  const clients = useMemo(() => {
    const clientsMap = new Map<string, ClientInfo>()

    // Procesar proyectos regulares
    if (projects) {
      projects.forEach((project) => {
        const clientName = project.client
        if (!clientName) return

        if (clientsMap.has(clientName)) {
          const clientInfo = clientsMap.get(clientName)!
          clientInfo.projectCount++
          clientInfo.projects.push({
            id: project.id,
            title: project.title,
            type: "regular",
          })

          // Actualizar datos de contacto si están disponibles
          if (project.clientEmail && !clientInfo.email) {
            clientInfo.email = project.clientEmail
          }
          if (project.clientPhone && !clientInfo.phone) {
            clientInfo.phone = project.clientPhone
          }
          if (project.clientAddress && !clientInfo.address) {
            clientInfo.address = project.clientAddress
          }
          if (project.clientNotes && !clientInfo.notes) {
            clientInfo.notes = project.clientNotes
          }
        } else {
          clientsMap.set(clientName, {
            name: clientName,
            email: project.clientEmail,
            phone: project.clientPhone,
            address: project.clientAddress,
            notes: project.clientNotes,
            projectCount: 1,
            projects: [
              {
                id: project.id,
                title: project.title,
                type: "regular",
              },
            ],
          })
        }
      })
    }

    // Procesar proyectos de coordinación
    if (coordinationProjects) {
      coordinationProjects.forEach((coordProject) => {
        const clientName = coordProject.client_name
        if (!clientName) return

        if (clientsMap.has(clientName)) {
          const clientInfo = clientsMap.get(clientName)!
          clientInfo.projectCount++
          clientInfo.projects.push({
            id: coordProject.id,
            title: coordProject.project_name,
            type: "coordination",
          })

          // Actualizar datos de contacto si están disponibles
          if (coordProject.client_email && !clientInfo.email) {
            clientInfo.email = coordProject.client_email
          }
          if (coordProject.client_phone && !clientInfo.phone) {
            clientInfo.phone = coordProject.client_phone
          }
          if (coordProject.address && !clientInfo.address) {
            clientInfo.address = coordProject.address
          }
        } else {
          clientsMap.set(clientName, {
            name: clientName,
            email: coordProject.client_email,
            phone: coordProject.client_phone,
            address: coordProject.address,
            notes: undefined,
            projectCount: 1,
            projects: [
              {
                id: coordProject.id,
                title: coordProject.project_name,
                type: "coordination",
              },
            ],
          })
        }
      })
    }

    return Array.from(clientsMap.values())
  }, [projects, coordinationProjects])

  // Filtrar clientes según el término de búsqueda
  const filteredClients = useMemo(() => {
    if (!searchTerm.trim()) return clients

    const term = searchTerm.toLowerCase()
    return clients.filter(
      (client) =>
        client.name.toLowerCase().includes(term) ||
        (client.email && client.email.toLowerCase().includes(term)) ||
        (client.phone && client.phone.toLowerCase().includes(term)) ||
        (client.address && client.address.toLowerCase().includes(term)),
    )
  }, [clients, searchTerm])

  // Manejar cambios en el input de búsqueda
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium mb-2">Error al cargar proyectos</h3>
        <p className="text-muted-foreground mb-6">
          {error.includes("duedate")
            ? "Hay un problema con la estructura de la tabla. Utiliza el botón 'Recrear tabla de proyectos' para solucionarlo."
            : "Ha ocurrido un error al cargar los proyectos. Inténtalo de nuevo más tarde."}
        </p>
      </div>
    )
  }

  if (projects === null && coordinationProjects === null) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium mb-2">Cargando clientes...</h3>
      </div>
    )
  }

  if (clients.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-orange-100 mb-4">
          <Users className="h-6 w-6 text-orange-600" />
        </div>
        <h3 className="text-lg font-medium mb-2">No hay clientes</h3>
        <p className="text-muted-foreground mb-6">Crea proyectos con información de clientes para verlos aquí</p>
        <Link href="/dashboard/projects" className="text-primary hover:underline">
          Ir a Proyectos
        </Link>
      </div>
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {filteredClients.map((client) => (
        <Card key={client.name} className="h-full overflow-hidden transition-all hover:shadow-md">
          <CardHeader className="p-4">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center">
                <User className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">{client.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {client.projectCount} {client.projectCount === 1 ? "proyecto" : "proyectos"}
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="space-y-3">
              {client.email && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <a href={`mailto:${client.email}`} className="text-blue-600 hover:underline">
                    {client.email}
                  </a>
                </div>
              )}
              {client.phone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <a href={`tel:${client.phone}`} className="text-blue-600 hover:underline">
                    {client.phone}
                  </a>
                </div>
              )}
              {client.address && (
                <div className="flex items-start gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <span>{client.address}</span>
                </div>
              )}

              <div className="mt-4">
                <h4 className="text-sm font-medium mb-2">Proyectos:</h4>
                <ul className="space-y-1">
                  {client.projects.map((project) => (
                    <li key={project.id} className="text-sm flex items-center gap-2">
                      <Link
                        href={
                          project.type === "coordination"
                            ? `/dashboard/coordinacion/${project.id}`
                            : `/dashboard/projects/${project.id}`
                        }
                        className="flex items-center gap-1 text-blue-600 hover:underline"
                      >
                        <FileText className="h-3 w-3" />
                        {project.title}
                      </Link>
                      {project.type === "coordination" && (
                        <Badge variant="secondary" className="text-xs h-5">
                          Coordinación
                        </Badge>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
