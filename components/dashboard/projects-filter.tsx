"use client"

import type React from "react"

import { useState } from "react"
import { Filter, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export type ProjectFilters = {
  search: string
  status: string
  sortBy: string
}

type ProjectsFilterProps = {
  filters: ProjectFilters
  onFilterChange: (filters: ProjectFilters) => void
}

export function ProjectsFilter({ filters, onFilterChange }: ProjectsFilterProps) {
  const [isOpen, setIsOpen] = useState(false)

  const toggleFilter = () => {
    setIsOpen(!isOpen)
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange({ ...filters, search: e.target.value })
  }

  const handleStatusChange = (value: string) => {
    onFilterChange({ ...filters, status: value })
  }

  const handleSortChange = (value: string) => {
    onFilterChange({ ...filters, sortBy: value })
  }

  return (
    <div className="mb-6">
      <div className="flex justify-between items-center">
        <Button variant="outline" size="sm" className="flex items-center gap-2" onClick={toggleFilter}>
          {isOpen ? <X className="h-4 w-4" /> : <Filter className="h-4 w-4" />}
          {isOpen ? "Cerrar filtros" : "Filtrar proyectos"}
        </Button>

        {filters.search || filters.status !== "todos" ? (
          <div className="text-sm text-muted-foreground">
            {filters.search && <span className="mr-2">Búsqueda: "{filters.search}"</span>}
            {filters.status !== "todos" && <span>Estado: {filters.status}</span>}
          </div>
        ) : null}
      </div>

      {isOpen && (
        <div className="grid gap-4 mt-4 md:grid-cols-3">
          <div>
            <label htmlFor="search" className="text-sm font-medium mb-1 block">
              Buscar
            </label>
            <Input
              id="search"
              placeholder="Buscar por nombre o cliente..."
              value={filters.search}
              onChange={handleSearchChange}
            />
          </div>

          <div>
            <label htmlFor="status" className="text-sm font-medium mb-1 block">
              Estado
            </label>
            <Select value={filters.status} onValueChange={handleStatusChange}>
              <SelectTrigger id="status">
                <SelectValue placeholder="Seleccionar estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="pendiente">Pendiente</SelectItem>
                <SelectItem value="en_progreso">En progreso</SelectItem>
                <SelectItem value="completado">Completado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label htmlFor="sortBy" className="text-sm font-medium mb-1 block">
              Ordenar por
            </label>
            <Select value={filters.sortBy} onValueChange={handleSortChange}>
              <SelectTrigger id="sortBy">
                <SelectValue placeholder="Ordenar por" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fecha_desc">Fecha (más reciente)</SelectItem>
                <SelectItem value="fecha_asc">Fecha (más antigua)</SelectItem>
                <SelectItem value="nombre_asc">Nombre (A-Z)</SelectItem>
                <SelectItem value="nombre_desc">Nombre (Z-A)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}
    </div>
  )
}
