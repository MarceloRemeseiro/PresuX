"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { apiClient } from "@/lib/apiClient";
import { ICliente, TipoCliente } from "@/types";

// Formulario simplificado, puede expandirse más adelante
export default function EditarClientePage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const clienteId = params.id;

  const [cliente, setCliente] = useState<ICliente | null>(null);
  const [formData, setFormData] = useState<{
    nombre: string;
    tipo: TipoCliente | "";
    persona_de_contacto: string;
    nif: string;
    direccion: string;
    ciudad: string;
    email: string;
    telefono: string;
    es_intracomunitario: boolean;
  }>({
    nombre: "",
    tipo: "",
    persona_de_contacto: "",
    nif: "",
    direccion: "",
    ciudad: "",
    email: "",
    telefono: "",
    es_intracomunitario: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cargar datos del cliente
  useEffect(() => {
    const fetchCliente = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await apiClient<ICliente>(`/api/clientes/${clienteId}`);
        setCliente(data);
        
        // Inicializar el formulario con los datos del cliente
        setFormData({
          nombre: data.nombre || "",
          tipo: data.tipo || "",
          persona_de_contacto: data.persona_de_contacto || "",
          nif: data.nif || "",
          direccion: data.direccion || "",
          ciudad: data.ciudad || "",
          email: data.email || "",
          telefono: data.telefono || "",
          es_intracomunitario: data.es_intracomunitario || false,
        });
      } catch (err: unknown) {
        console.error("Error fetching cliente:", err);
        const errorMessage = err instanceof Error ? err.message : "Error al cargar los datos del cliente";
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    if (clienteId) {
      fetchCliente();
    }
  }, [clienteId]);

  // Manejar cambios en los inputs
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  // Enviar formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsSaving(true);
      setError(null);
      
      const changedFields: Partial<typeof formData> = {};
      
      for (const key in formData) {
        if (Object.prototype.hasOwnProperty.call(formData, key)) {
          const typedKey = key as keyof typeof formData;
          const formValue = formData[typedKey];
          
          // Comparar con el valor original del cliente
          // Asegurarse de que cliente no sea null
          if (cliente) {
            const clienteValue = cliente[typedKey as keyof ICliente]; // Asumimos que ICliente tiene todas las keys de formData o son compatibles
            
            let valuesAreDifferent = false;
            if (typedKey === "tipo") {
              // Compara TipoCliente con (TipoCliente | "")
              // Si formValue es "", se considera diferente si clienteValue no era null/undefined (ya es TipoCliente)
              // Si formValue es un TipoCliente, se compara directamente.
              valuesAreDifferent = clienteValue !== formValue && (formValue !== "" || clienteValue != null);
            } else if (typedKey === "es_intracomunitario") {
              // Booleans: clienteValue puede ser boolean, formValue es boolean.
              // Si clienteValue fuera undefined/null (no debería si ICliente lo tiene), tratarlo como diferente.
              valuesAreDifferent = clienteValue !== formValue;
            } else {
              // Strings: clienteValue puede ser string | null | undefined. formValue es string.
              // Si formValue es "", se considera diferente si clienteValue no era ya "" o null/undefined.
              valuesAreDifferent = clienteValue !== formValue && (formValue !== "" || (clienteValue !== null && clienteValue !== undefined));
            }

            if (valuesAreDifferent) {
              // @ts-expect-error TypeScript seems to struggle with this specific assignment to a Partial index signature inside a loop.
              changedFields[typedKey] = formValue;
            }
          }
        }
      }
                  
      if (Object.keys(changedFields).length === 0) {
        toast.success("No hay cambios para guardar");
        return;
      }
      
      // Enviar los datos actualizados
      await apiClient(`/api/clientes/${clienteId}`, { 
        method: "PUT",
        body: changedFields 
      });
      
      toast.success("Cliente actualizado correctamente");
      
      // Redirigir después de un pequeño retraso para que se vea el toast
      setTimeout(() => {
        router.push(`/clientes/${clienteId}`);
      }, 1500);
    } catch (err: unknown) {
      console.error("Error al actualizar cliente:", err);
      const message =
        err instanceof Error ? err.message : "Ocurrió un error desconocido";
      setError(message);
      toast.error(message);
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="py-10 flex justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
          <p className="mt-2">Cargando datos del cliente...</p>
        </div>
      </div>
    )
  }

  if (error && !cliente) {
    return (
      <div className="py-10">
        <div className="p-4 mb-4 text-red-800 rounded-lg bg-red-50">
          <p>{error}</p>
          <Button onClick={() => router.push("/clientes")} className="mt-4">
            <ArrowLeft className="mr-2 h-4 w-4" /> Volver a Clientes
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="py-10">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => router.push(`/clientes/${clienteId}`)}
            className="mr-3"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Volver
          </Button>
          <h1 className="text-3xl font-bold">Editar Cliente</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle>Información del Cliente</CardTitle>
            <CardDescription>
              Actualiza los datos del cliente. Los campos marcados con * son obligatorios.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Información básica */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Información básica</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="nombre" className="block text-sm font-medium">
                    Nombre *
                  </label>
                  <Input
                    id="nombre"
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleChange}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="tipo" className="block text-sm font-medium">
                    Tipo de cliente *
                  </label>
                  <select
                    id="tipo"
                    name="tipo"
                    value={formData.tipo}
                    onChange={handleChange}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    required
                  >
                    <option value="" disabled>Seleccionar tipo</option>
                    <option value={TipoCliente.PARTICULAR}>PARTICULAR</option>
                    <option value={TipoCliente.EMPRESA}>EMPRESA</option>
                    <option value={TipoCliente.AUTONOMO}>AUTÓNOMO</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label htmlFor="nif" className="block text-sm font-medium">
                    NIF/CIF
                  </label>
                  <Input
                    id="nif"
                    name="nif"
                    value={formData.nif}
                    onChange={handleChange}
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="persona_de_contacto" className="block text-sm font-medium">
                    Persona de contacto
                  </label>
                  <Input
                    id="persona_de_contacto"
                    name="persona_de_contacto"
                    value={formData.persona_de_contacto}
                    onChange={handleChange}
                  />
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="es_intracomunitario"
                  name="es_intracomunitario"
                  checked={formData.es_intracomunitario}
                  onChange={handleChange}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="es_intracomunitario" className="text-sm font-medium">
                  Cliente intracomunitario
                </label>
              </div>
            </div>
            
            {/* Información de contacto */}
            <div className="space-y-4 pt-4 border-t">
              <h3 className="text-lg font-medium">Información de contacto</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="email" className="block text-sm font-medium">
                    Email
                  </label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                  />
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="telefono" className="block text-sm font-medium">
                    Teléfono
                  </label>
                  <Input
                    id="telefono"
                    name="telefono"
                    value={formData.telefono}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>
            
            {/* Dirección */}
            <div className="space-y-4 pt-4 border-t">
              <h3 className="text-lg font-medium">Dirección</h3>
              
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <label htmlFor="direccion" className="block text-sm font-medium">
                    Dirección
                  </label>
                  <Input
                    id="direccion"
                    name="direccion"
                    value={formData.direccion}
                    onChange={handleChange}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="ciudad" className="block text-sm font-medium">
                      Ciudad
                    </label>
                    <Input
                      id="ciudad"
                      name="ciudad"
                      value={formData.ciudad}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
          
          <CardFooter className="flex justify-between p-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push(`/clientes/${clienteId}`)}
              disabled={isSaving}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Guardar Cambios
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </form>

      {error && (
        <div className="p-4 mt-6 text-red-800 rounded-lg bg-red-50 max-w-4xl mx-auto">
          <p className="font-medium">Error:</p>
          <p>{error}</p>
        </div>
      )}
    </div>
  );
} 