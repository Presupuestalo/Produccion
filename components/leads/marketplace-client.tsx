"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { MapPin, Euro, Calendar, Building2, Filter } from "lucide-react"
import { AccessLeadDialog } from "./access-lead-dialog"
import type { LeadRequest } from "@/types/marketplace"

interface MarketplaceClientProps {
  initialLeads: LeadRequest[]
  isAdmin: boolean
}

export function MarketplaceClient({ initialLeads, isAdmin }: MarketplaceClientProps) {
  const searchParams = useSearchParams()
  const [leads, setLeads] = useState<LeadRequest[]>(initialLeads)
  const [loading, setLoading] = useState(false)
  const [selectedLead, setSelectedLead] = useState<LeadRequest | null>(null)
  const [showAccessDialog, setShowAccessDialog] = useState(false)
  const [onlyMatchingPreferences, setOnlyMatchingPreferences] = useState(false)

  // Filtros
  const [cityFilter, setCityFilter] = useState("")
  const [provinceFilter, setProvinceFilter] = useState("")
  const [minBudget, setMinBudget] = useState("")
  const [maxBudget, setMaxBudget] = useState("")
  const [reformTypeFilter, setReformTypeFilter] = useState("all")

  useEffect(() => {
    loadLeads()
  }, [onlyMatchingPreferences, cityFilter, provinceFilter, minBudget, maxBudget, reformTypeFilter])

  const loadLeads = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (onlyMatchingPreferences) params.append("matchPreferences", "true")
      if (cityFilter) params.append("city", cityFilter)
      if (provinceFilter) params.append("province", provinceFilter)
      if (minBudget) params.append("minBudget", minBudget)
      if (maxBudget) params.append("maxBudget", maxBudget)
      if (reformTypeFilter !== "all") params.append("reformType", reformTypeFilter)

      const response = await fetch(`/api/leads/available?${params}`)
      if (response.ok) {
        const data = await response.json()
        setLeads(data.leads)
      }
    } catch (error) {
      console.error("Error loading leads:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleAccessLead = (lead: LeadRequest) => {
    setSelectedLead(lead)
    setShowAccessDialog(true)
  }

  const handleLeadAccessed = () => {
    loadLeads()
    setShowAccessDialog(false)
  }

  const clearFilters = () => {
    setCityFilter("")
    setProvinceFilter("")
    setMinBudget("")
    setMaxBudget("")
    setReformTypeFilter("all")
  }

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filtros
              </CardTitle>
              <CardDescription>Busca trabajos específicos</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={clearFilters}>
              Limpiar filtros
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Ciudad</Label>
              <Input
                placeholder="Madrid, Barcelona..."
                value={cityFilter}
                onChange={(e) => setCityFilter(e.target.value)}
              />
            </div>
            <div>
              <Label>Provincia</Label>
              <Input
                placeholder="Madrid, Barcelona..."
                value={provinceFilter}
                onChange={(e) => setProvinceFilter(e.target.value)}
              />
            </div>
            <div>
              <Label>Tipo de reforma</Label>
              <Select value={reformTypeFilter} onValueChange={setReformTypeFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="integral">Reforma integral</SelectItem>
                  <SelectItem value="kitchen">Cocina</SelectItem>
                  <SelectItem value="bathroom">Baño</SelectItem>
                  <SelectItem value="painting">Pintura</SelectItem>
                  <SelectItem value="flooring">Suelos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Presupuesto mínimo (€)</Label>
              <Input
                type="number"
                placeholder="10000"
                value={minBudget}
                onChange={(e) => setMinBudget(e.target.value)}
              />
            </div>
            <div>
              <Label>Presupuesto máximo (€)</Label>
              <Input
                type="number"
                placeholder="50000"
                value={maxBudget}
                onChange={(e) => setMaxBudget(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="match-preferences"
              checked={onlyMatchingPreferences}
              onCheckedChange={setOnlyMatchingPreferences}
            />
            <Label htmlFor="match-preferences">Solo mostrar trabajos que coincidan con mis preferencias</Label>
          </div>
        </CardContent>
      </Card>

      {/* Lista de leads */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Trabajos Disponibles</h2>
          <Badge variant="secondary">{leads.length} trabajos</Badge>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Cargando trabajos...</p>
          </div>
        ) : leads.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No hay trabajos disponibles en este momento</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {leads.map((lead) => (
              <Card key={lead.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{lead.reform_types?.[0] || "Reforma"}</Badge>
                        <Badge variant="secondary">{lead.companies_accessed_count || 0} de 3 empresas</Badge>
                      </div>

                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {lead.address_city}, {lead.address_province} ({lead.postal_code})
                        </span>
                        <span className="flex items-center gap-1">
                          <Euro className="h-4 w-4" />
                          {lead.estimated_budget?.toLocaleString()}€
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {new Date(lead.created_at).toLocaleDateString()}
                        </span>
                      </div>

                      {lead.homeowner_description && (
                        <p className="text-sm mt-2 line-clamp-2">{lead.homeowner_description}</p>
                      )}

                      {isAdmin && (
                        <div className="mt-2 p-2 bg-yellow-50 rounded text-sm">
                          <p className="font-semibold">Admin Info:</p>
                          <p>Cliente: {lead.homeowner_name}</p>
                          <p>Teléfono: {lead.homeowner_phone}</p>
                          <p>Email: {lead.homeowner_email}</p>
                        </div>
                      )}
                    </div>

                    <div className="ml-4">
                      <Button onClick={() => handleAccessLead(lead)}>
                        Ver detalles
                        <Building2 className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {selectedLead && (
        <AccessLeadDialog
          lead={selectedLead}
          open={showAccessDialog}
          onOpenChange={setShowAccessDialog}
          onSuccess={handleLeadAccessed}
          isAdmin={isAdmin}
        />
      )}
    </div>
  )
}
