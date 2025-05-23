"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PuestoTrabajoSelector } from "@/components/ui/puesto-trabajo-selector"
import { toast } from "sonner"
import { Loader2, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { apiClient } from "@/lib/apiClient"
import { createPersonalSchema } from "@/lib/schemas/personal"
import { IPersonalFormData } from "@/types/personal"

interface PuestoAsignado {
  puesto_trabajo_id: string
  nombre_puesto: string
  tarifa_por_dia?: number | null
}

export default function CrearPersonalPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState<IPersonalFormData>({
    nombre: "",
    apellidos: "",
    email: "",
    telefono: "",
    dni_nif: "",
    notas: "",
  })
  const [puestosAsignados, setPuestosAsignados] = useState<PuestoAsignado[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    
    // Limpiar error del campo cuando el usuario empiece a escribir
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ""
      }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setErrors({})

    try {
      // Preparar datos transformando strings vacíos a null
      const cleanData = {
        nombre: formData.nombre.trim(),
        apellidos: formData.apellidos?.trim() || null,
        email: formData.email?.trim() || null,
        telefono: formData.telefono?.trim() || null,
        dni_nif: formData.dni_nif?.trim() || null,
        notas: formData.notas?.trim() || null,
      }

      console.log('Datos a enviar para crear personal:', cleanData) // Debug log

      // Crear el personal primero
      const personalResponse = await apiClient<{ personal: { id: string } }>('/api/personal', {
        method: 'POST',
        body: JSON.stringify(cleanData),
      })

      // Si hay puestos asignados, los agregamos después
      if (puestosAsignados.length > 0) {
        const puestosData = {
          puestos_trabajo: puestosAsignados.map(puesto => ({
            puesto_trabajo_id: puesto.puesto_trabajo_id,
            tarifa_por_dia: puesto.tarifa_por_dia,
            fecha_asignacion: new Date().toISOString().split('T')[0]
          }))
        }

        await apiClient(`/api/personal/${personalResponse.personal.id}/puestos`, {
          method: 'POST',
          body: JSON.stringify(puestosData),
        })
      }

      toast.success("Personal creado correctamente")
      router.push("/personal")
      
    } catch (error: any) {
      console.error("Error al crear personal:", error)
      
      if (error.name === 'ZodError') {
        // Errores de validación de Zod
        const newErrors: Record<string, string> = {}
        error.issues.forEach((issue: any) => {
          const field = issue.path[0]
          if (field) {
            newErrors[field] = issue.message
          }
        })
        setErrors(newErrors)
        toast.error("Por favor, revisa los errores en el formulario")
      } else {
        // Errores de API
        const errorMessage = error.message || "Error al crear el personal"
        toast.error(errorMessage)
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="py-10">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/personal">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">Crear Nuevo Personal</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-6xl">
        {/* Información básica */}
        <Card>
          <CardHeader>
            <CardTitle>Información Personal</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Nombre y Apellidos */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nombre" className="required">
                    Nombre *
                  </Label>
                  <Input
                    id="nombre"
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleInputChange}
                    className={errors.nombre ? "border-red-500" : ""}
                    disabled={isLoading}
                  />
                  {errors.nombre && (
                    <p className="text-red-500 text-sm">{errors.nombre}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="apellidos">Apellidos</Label>
                  <Input
                    id="apellidos"
                    name="apellidos"
                    value={formData.apellidos}
                    onChange={handleInputChange}
                    className={errors.apellidos ? "border-red-500" : ""}
                    disabled={isLoading}
                  />
                  {errors.apellidos && (
                    <p className="text-red-500 text-sm">{errors.apellidos}</p>
                  )}
                </div>
              </div>

              {/* Email y Teléfono */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={errors.email ? "border-red-500" : ""}
                    disabled={isLoading}
                  />
                  {errors.email && (
                    <p className="text-red-500 text-sm">{errors.email}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="telefono">Teléfono</Label>
                  <Input
                    id="telefono"
                    name="telefono"
                    value={formData.telefono}
                    onChange={handleInputChange}
                    className={errors.telefono ? "border-red-500" : ""}
                    disabled={isLoading}
                  />
                  {errors.telefono && (
                    <p className="text-red-500 text-sm">{errors.telefono}</p>
                  )}
                </div>
              </div>

              {/* DNI/NIF */}
              <div className="space-y-2">
                <Label htmlFor="dni_nif">DNI/NIF</Label>
                <Input
                  id="dni_nif"
                  name="dni_nif"
                  value={formData.dni_nif}
                  onChange={handleInputChange}
                  className={errors.dni_nif ? "border-red-500" : ""}
                  disabled={isLoading}
                />
                {errors.dni_nif && (
                  <p className="text-red-500 text-sm">{errors.dni_nif}</p>
                )}
              </div>

              {/* Notas */}
              <div className="space-y-2">
                <Label htmlFor="notas">Notas</Label>
                <Textarea
                  id="notas"
                  name="notas"
                  value={formData.notas}
                  onChange={handleInputChange}
                  rows={4}
                  className={errors.notas ? "border-red-500" : ""}
                  disabled={isLoading}
                  placeholder="Información adicional sobre el personal (habilidades, experiencia, etc.)"
                />
                {errors.notas && (
                  <p className="text-red-500 text-sm">{errors.notas}</p>
                )}
              </div>

              {/* Botones */}
              <div className="flex gap-4 pt-4">
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creando...
                    </>
                  ) : (
                    "Crear Personal"
                  )}
                </Button>
                
                <Button type="button" variant="outline" asChild disabled={isLoading}>
                  <Link href="/personal">
                    Cancelar
                  </Link>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Puestos de trabajo */}
        <PuestoTrabajoSelector
          puestosAsignados={puestosAsignados}
          onPuestosChange={setPuestosAsignados}
          disabled={isLoading}
        />
      </div>

      <style jsx global>{`
        .required::after {
          content: "*";
          color: red;
          margin-left: 4px;
        }
      `}</style>
    </div>
  )
} 