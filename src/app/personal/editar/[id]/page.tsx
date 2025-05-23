"use client"

import { useState, useEffect, use } from "react"
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
import { updatePersonalSchema } from "@/lib/schemas/personal"
import { IPersonal, IPersonalFormData, IPersonalConPuestos } from "@/types/personal"

interface PuestoAsignado {
  puesto_trabajo_id: string
  nombre_puesto: string
  tarifa_por_dia?: number | null
}

interface EditarPersonalPageProps {
  params: Promise<{ id: string }>
}

export default function EditarPersonalPage({ params }: EditarPersonalPageProps) {
  const resolvedParams = use(params)
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingData, setIsLoadingData] = useState(true)
  const [personal, setPersonal] = useState<IPersonal | null>(null)
  const [formData, setFormData] = useState<IPersonalFormData>({
    nombre: "",
    apellidos: "",
    email: "",
    telefono: "",
    dni_nif: "",
    notas: "",
  })
  const [puestosAsignados, setPuestosAsignados] = useState<PuestoAsignado[]>([])
  const [puestosOriginales, setPuestosOriginales] = useState<PuestoAsignado[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Cargar datos del personal y sus puestos
  useEffect(() => {
    const fetchPersonal = async () => {
      try {
        // Cargar datos básicos del personal
        const personalData = await apiClient<IPersonal>(`/api/personal/${resolvedParams.id}`)
        setPersonal(personalData)
        
        // Llenar el formulario con los datos existentes
        setFormData({
          nombre: personalData.nombre || "",
          apellidos: personalData.apellidos || "",
          email: personalData.email || "",
          telefono: personalData.telefono || "",
          dni_nif: personalData.dni_nif || "",
          notas: personalData.notas || "",
        })

        // Cargar puestos asignados
        try {
          const personalConPuestos = await apiClient<IPersonalConPuestos>(`/api/personal/${resolvedParams.id}/puestos`)
          const puestosFormateados: PuestoAsignado[] = personalConPuestos.puestos_trabajo.map(puesto => ({
            puesto_trabajo_id: puesto.puesto_trabajo_id,
            nombre_puesto: puesto.nombre_puesto,
            tarifa_por_dia: puesto.tarifa_por_dia
          }))
          setPuestosAsignados(puestosFormateados)
          setPuestosOriginales(JSON.parse(JSON.stringify(puestosFormateados))) // Copia profunda
        } catch (puestosError) {
          console.error("Error al cargar puestos del personal:", puestosError)
          // No es error crítico, simplemente no tiene puestos asignados
        }
      } catch (error: any) {
        console.error("Error al cargar personal:", error)
        toast.error("Error al cargar los datos del personal")
        router.push("/personal")
      } finally {
        setIsLoadingData(false)
      }
    }

    fetchPersonal()
  }, [resolvedParams.id, router])

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

  // Función para comparar arrays de puestos
  const puestosHanCambiado = () => {
    if (puestosAsignados.length !== puestosOriginales.length) return true
    
    return puestosAsignados.some(puestoActual => {
      const puestoOriginal = puestosOriginales.find(p => p.puesto_trabajo_id === puestoActual.puesto_trabajo_id)
      if (!puestoOriginal) return true // Puesto nuevo
      return puestoOriginal.tarifa_por_dia !== puestoActual.tarifa_por_dia // Tarifa cambió
    }) || puestosOriginales.some(puestoOriginal => {
      return !puestosAsignados.find(p => p.puesto_trabajo_id === puestoOriginal.puesto_trabajo_id)
    }) // Puesto eliminado
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setErrors({})

    try {
      // Preparar datos para validación
      const dataToValidate = {
        ...formData,
        // Convertir campos vacíos a null
        apellidos: formData.apellidos?.trim() || null,
        email: formData.email?.trim() || null,
        telefono: formData.telefono?.trim() || null,
        dni_nif: formData.dni_nif?.trim() || null,
        notas: formData.notas?.trim() || null,
      }

      // Solo enviar campos que han cambiado
      const changedData: any = {}
      if (dataToValidate.nombre !== personal?.nombre) changedData.nombre = dataToValidate.nombre
      if (dataToValidate.apellidos !== personal?.apellidos) changedData.apellidos = dataToValidate.apellidos
      if (dataToValidate.email !== personal?.email) changedData.email = dataToValidate.email
      if (dataToValidate.telefono !== personal?.telefono) changedData.telefono = dataToValidate.telefono
      if (dataToValidate.dni_nif !== personal?.dni_nif) changedData.dni_nif = dataToValidate.dni_nif
      if (dataToValidate.notas !== personal?.notas) changedData.notas = dataToValidate.notas

      const hayDatosPersonalesCambiados = Object.keys(changedData).length > 0
      const hayPuestosCambiados = puestosHanCambiado()

      // Si no hay cambios, no hacer nada
      if (!hayDatosPersonalesCambiados && !hayPuestosCambiados) {
        toast.info("No se detectaron cambios")
        return
      }

      // Actualizar datos personales si hay cambios
      if (hayDatosPersonalesCambiados) {
        // Validar con Zod
        const validatedData = updatePersonalSchema.parse(changedData)
        
        await apiClient(`/api/personal/${resolvedParams.id}`, {
          method: 'PUT',
          body: JSON.stringify(validatedData),
        })
      }

      // Actualizar puestos si hay cambios
      if (hayPuestosCambiados) {
        try {
          const puestosData = {
            puestos_trabajo: puestosAsignados.map(puesto => ({
              puesto_trabajo_id: puesto.puesto_trabajo_id,
              tarifa_por_dia: puesto.tarifa_por_dia,
              fecha_asignacion: new Date().toISOString().split('T')[0]
            }))
          }

          console.log('Enviando datos de puestos:', puestosData) // Debug log
          console.log('Puestos asignados:', puestosAsignados) // Debug log

          await apiClient(`/api/personal/${resolvedParams.id}/puestos`, {
            method: 'PUT',
            body: JSON.stringify(puestosData),
          })
        } catch (puestosError) {
          console.error("Error al actualizar puestos:", puestosError)
          toast.error("Error al actualizar los puestos de trabajo")
          return
        }
      }

      toast.success("Personal actualizado correctamente")
      router.push("/personal")
      
    } catch (error: any) {
      console.error("Error al actualizar personal:", error)
      
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
        const errorMessage = error.message || "Error al actualizar el personal"
        toast.error(errorMessage)
      }
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoadingData) {
    return (
      <div className="py-10 flex justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
          <p className="mt-2">Cargando datos del personal...</p>
        </div>
      </div>
    )
  }

  if (!personal) {
    return (
      <div className="py-10">
        <div className="text-center">
          <p className="text-red-600">No se pudo cargar el personal</p>
          <Button asChild className="mt-4">
            <Link href="/personal">Volver al listado</Link>
          </Button>
        </div>
      </div>
    )
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
        <h1 className="text-3xl font-bold">
          Editar Personal: {personal.nombre} {personal.apellidos}
        </h1>
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
                      Actualizando...
                    </>
                  ) : (
                    "Actualizar Personal"
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