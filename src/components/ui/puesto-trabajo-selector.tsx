"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { Plus, X, Loader2 } from "lucide-react"
import { apiClient } from "@/lib/apiClient"
import type { PuestoTrabajo } from "@/types/puesto-trabajo"

interface PuestoAsignado {
  puesto_trabajo_id: string
  nombre_puesto: string
  tarifa_por_dia?: number | null
}

interface PuestoTrabajoSelectorProps {
  puestosAsignados: PuestoAsignado[]
  onPuestosChange: (puestos: PuestoAsignado[]) => void
  disabled?: boolean
}

export function PuestoTrabajoSelector({ 
  puestosAsignados, 
  onPuestosChange, 
  disabled = false 
}: PuestoTrabajoSelectorProps) {
  const [puestosDisponibles, setPuestosDisponibles] = useState<PuestoTrabajo[]>([])
  const [isLoadingPuestos, setIsLoadingPuestos] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [isCreatingPuesto, setIsCreatingPuesto] = useState(false)
  const [selectedPuestoId, setSelectedPuestoId] = useState<string>("")
  const [tarifaPorDia, setTarifaPorDia] = useState<string>("")
  
  // Estados para crear nuevo puesto
  const [nuevoPuesto, setNuevoPuesto] = useState({
    nombre: "",
    descripcion: "",
    precio_dia: ""
  })

  // Cargar puestos disponibles
  useEffect(() => {
    const fetchPuestos = async () => {
      try {
        const response = await apiClient<{ puestosTrabajo: PuestoTrabajo[] }>('/api/puestos-trabajo')
        setPuestosDisponibles(response.puestosTrabajo)
      } catch (error) {
        console.error("Error al cargar puestos:", error)
        toast.error("Error al cargar los puestos de trabajo")
      } finally {
        setIsLoadingPuestos(false)
      }
    }

    fetchPuestos()
  }, [])

  // Filtrar puestos no asignados
  const puestosNoAsignados = puestosDisponibles.filter(puesto => 
    !puestosAsignados.some(asignado => asignado.puesto_trabajo_id === puesto.id)
  )

  // Manejar cambio de puesto seleccionado
  const handlePuestoChange = (puestoId: string) => {
    setSelectedPuestoId(puestoId)
    
    // Auto-llenar tarifa con el precio del puesto
    const puesto = puestosDisponibles.find(p => p.id === puestoId)
    if (puesto) {
      setTarifaPorDia(puesto.precio_dia.toString())
    }
  }

  const agregarPuesto = () => {
    if (!selectedPuestoId) return

    const puesto = puestosDisponibles.find(p => p.id === selectedPuestoId)
    if (!puesto) return

    // Usar la tarifa especificada o el precio del puesto por defecto
    const tarifa = tarifaPorDia ? parseFloat(tarifaPorDia) : puesto.precio_dia

    const nuevoPuestoAsignado: PuestoAsignado = {
      puesto_trabajo_id: puesto.id,
      nombre_puesto: puesto.nombre,
      tarifa_por_dia: tarifa
    }

    onPuestosChange([...puestosAsignados, nuevoPuestoAsignado])
    setSelectedPuestoId("")
    setTarifaPorDia("")
  }

  const quitarPuesto = (puestoTrabajoId: string) => {
    onPuestosChange(puestosAsignados.filter(p => p.puesto_trabajo_id !== puestoTrabajoId))
  }

  const actualizarTarifa = (puestoTrabajoId: string, nuevaTarifa: string) => {
    const nuevaTarifaNum = nuevaTarifa ? parseFloat(nuevaTarifa) : null
    onPuestosChange(
      puestosAsignados.map(p => 
        p.puesto_trabajo_id === puestoTrabajoId 
          ? { ...p, tarifa_por_dia: nuevaTarifaNum }
          : p
      )
    )
  }

  const crearNuevoPuesto = async () => {
    if (!nuevoPuesto.nombre.trim()) {
      toast.error("El nombre del puesto es obligatorio")
      return
    }

    const precioDia = parseFloat(nuevoPuesto.precio_dia)
    if (isNaN(precioDia) || precioDia < 0) {
      toast.error("El precio por día debe ser un número válido mayor o igual a 0")
      return
    }

    setIsCreatingPuesto(true)
    try {
      const response = await apiClient<{ puestoTrabajo: PuestoTrabajo }>('/api/puestos-trabajo', {
        method: 'POST',
        body: {
          nombre: nuevoPuesto.nombre.trim(),
          descripcion: nuevoPuesto.descripcion.trim() || null,
          precio_dia: precioDia
        }
      })

      // Agregar el nuevo puesto a la lista de disponibles
      const nuevoPuestoCreado = response.puestoTrabajo
      setPuestosDisponibles(prev => [...prev, nuevoPuestoCreado])
      
      // Seleccionarlo automáticamente
      setSelectedPuestoId(nuevoPuestoCreado.id)
      
      toast.success("Puesto de trabajo creado exitosamente")
      setShowCreateModal(false)
      setNuevoPuesto({ nombre: "", descripcion: "", precio_dia: "" })
    } catch (error: any) {
      console.error("Error al crear puesto:", error)
      toast.error(error.message || "Error al crear el puesto de trabajo")
    } finally {
      setIsCreatingPuesto(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Puestos de Trabajo</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        
        {/* Puestos asignados */}
        {puestosAsignados.length > 0 && (
          <div className="space-y-2">
            <Label>Puestos asignados:</Label>
            <div className="space-y-2">
              {puestosAsignados.map((puesto) => (
                <div key={puesto.puesto_trabajo_id} className="flex items-center gap-2 p-2 border rounded-md">
                  <Badge variant="secondary" className="flex-shrink-0">
                    {puesto.nombre_puesto}
                  </Badge>
                  <div className="flex items-center gap-2 flex-1">
                    <Label htmlFor={`tarifa-${puesto.puesto_trabajo_id}`} className="text-sm whitespace-nowrap">
                      Tarifa/día:
                    </Label>
                    <Input
                      id={`tarifa-${puesto.puesto_trabajo_id}`}
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={puesto.tarifa_por_dia || ""}
                      onChange={(e) => actualizarTarifa(puesto.puesto_trabajo_id, e.target.value)}
                      className="w-24"
                      disabled={disabled}
                    />
                    <span className="text-sm text-muted-foreground">€</span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => quitarPuesto(puesto.puesto_trabajo_id)}
                    disabled={disabled}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Agregar nuevo puesto */}
        <div className="space-y-3 pt-4 border-t">
          <Label>Agregar puesto:</Label>
          
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <Label className="text-sm">Puesto de trabajo</Label>
              <Select value={selectedPuestoId} onValueChange={handlePuestoChange} disabled={disabled || isLoadingPuestos}>
                <SelectTrigger>
                  <SelectValue placeholder={isLoadingPuestos ? "Cargando..." : "Seleccionar puesto"} />
                </SelectTrigger>
                <SelectContent>
                  {puestosNoAsignados.map((puesto) => (
                    <SelectItem key={puesto.id} value={puesto.id}>
                      <div className="flex flex-col">
                        <span className="font-medium">{puesto.nombre}</span>
                        <span className="text-xs text-muted-foreground">
                          {puesto.precio_dia}€/día
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="w-32">
              <Label className="text-sm">Tarifa/día (€)</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={tarifaPorDia}
                onChange={(e) => setTarifaPorDia(e.target.value)}
                disabled={disabled}
              />
            </div>
            
            <Button
              type="button"
              onClick={agregarPuesto}
              disabled={disabled || !selectedPuestoId}
              size="sm"
              className="mb-0"
            >
              Agregar
            </Button>
          </div>

          {/* Botón crear nuevo puesto */}
          <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
            <DialogTrigger asChild>
              <Button type="button" variant="outline" size="sm" disabled={disabled}>
                <Plus className="h-4 w-4 mr-2" />
                Crear nuevo puesto
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Crear Nuevo Puesto de Trabajo</DialogTitle>
                <DialogDescription>
                  Define un nuevo puesto de trabajo que podrás asignar al personal.
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="nombre-puesto">Nombre del Puesto *</Label>
                  <Input
                    id="nombre-puesto"
                    value={nuevoPuesto.nombre}
                    onChange={(e) => setNuevoPuesto(prev => ({ ...prev, nombre: e.target.value }))}
                    placeholder="Ej: Electricista, Fontanero, Administrativo..."
                    disabled={isCreatingPuesto}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="descripcion-puesto">Descripción</Label>
                  <Input
                    id="descripcion-puesto"
                    value={nuevoPuesto.descripcion}
                    onChange={(e) => setNuevoPuesto(prev => ({ ...prev, descripcion: e.target.value }))}
                    placeholder="Descripción opcional del puesto"
                    disabled={isCreatingPuesto}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="precio-dia-puesto">Precio por Día (€) *</Label>
                  <Input
                    id="precio-dia-puesto"
                    type="number"
                    step="0.01"
                    min="0"
                    value={nuevoPuesto.precio_dia}
                    onChange={(e) => setNuevoPuesto(prev => ({ ...prev, precio_dia: e.target.value }))}
                    placeholder="0.00"
                    disabled={isCreatingPuesto}
                  />
                </div>
              </div>
              
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowCreateModal(false)
                    setNuevoPuesto({ nombre: "", descripcion: "", precio_dia: "" })
                  }}
                  disabled={isCreatingPuesto}
                >
                  Cancelar
                </Button>
                <Button
                  type="button"
                  onClick={crearNuevoPuesto}
                  disabled={isCreatingPuesto}
                >
                  {isCreatingPuesto ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creando...
                    </>
                  ) : (
                    "Crear Puesto"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  )
} 