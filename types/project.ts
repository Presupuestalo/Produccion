export interface Project {
  id: string
  title: string
  description: string
  // Datos básicos del cliente
  client: string
  client_dni?: string // Added DNI field for client
  clientEmail?: string // Cambiado a camelCase para la interfaz
  clientPhone?: string // Cambiado a camelCase para la interfaz
  client_address?: string // @deprecated: usar client_street, client_city, etc.
  client_country?: string
  client_street?: string
  client_city?: string
  client_province?: string
  clientNotes?: string // Cambiado a camelCase para la interfaz
  // Dirección de la reforma
  project_address?: string
  street?: string
  project_floor?: string | number
  door?: string
  city?: string
  province?: string
  country?: string // @deprecated: use country_code instead
  country_code?: string // ISO code where the reform is located
  ceiling_height?: string | number
  structure_type?: string
  has_elevator?: string | number | boolean
  // Resto de campos del proyecto
  progress: number
  status: "Borrador" | "Entregado" | "En Obra" | "Rechazado"
  duedate?: string
  dueDate?: string // Mantener esta para compatibilidad
  budget?: number
  color: string
  created_at?: string
  user_id?: string
  // Nuevos campos para licencia y contrato
  license_status?: "No iniciado" | "En trámite" | "Concedida" | "Rechazada"
  license_date?: string
  contract_signed?: boolean
  contract_date?: string
}

export type ProjectFormData = Omit<Project, "id" | "progress" | "color" | "created_at" | "user_id"> & {
  progress?: number
  color?: string
}

// Interfaz para actividades del proyecto
export interface ProjectActivity {
  id: string
  project_id: string
  description: string
  date: string
  type: "visita" | "decisión" | "compra" | "trámite" | "otro"
  created_at?: string
  user_id?: string
}

export type ProjectActivityFormData = Omit<ProjectActivity, "id" | "created_at" | "user_id">

// Nueva interfaz para citas del proyecto
export interface ProjectAppointment {
  id: string
  project_id: string
  title: string
  description?: string
  date: string
  time: string
  duration: number // en minutos
  location?: string
  attendees?: string
  status: "pendiente" | "confirmada" | "cancelada" | "completada"
  activity_id?: string
  created_at?: string
  user_id?: string
  // Campo para la relación con el proyecto (para consultas JOIN)
  projects?: {
    title: string
  }
}

export type ProjectAppointmentFormData = Omit<
  ProjectAppointment,
  "id" | "created_at" | "user_id" | "activity_id" | "projects"
>
