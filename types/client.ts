export interface Client {
  id: string
  name: string
  email?: string
  phone?: string
  address?: string
  notes?: string
  created_at?: string
  user_id?: string
}

export type ClientFormData = Omit<Client, "id" | "created_at" | "user_id">
