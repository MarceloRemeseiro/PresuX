"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { toast, Toaster } from "sonner";
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
import { TipoCliente } from "@/types";

export default function NuevoClientePage() {
  const router = useRouter();

  const [formData, setFormData] = useState({
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
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    
    if (!formData.nombre || !formData.tipo) {
      toast.error("El nombre y tipo de cliente son obligatorios");
      return;
    }
    
    try {
      setIsSaving(true);
      setError(null);
      
      // Crear nuevo cliente
      const nuevoCliente = await apiClient('/api/clientes', { 
        method: "POST",
        body: formData 
      });
      
      toast.success("Cliente creado correctamente");
      
      // Redirigir después de un pequeño retraso para que se vea el toast
      setTimeout(() => {
        router.push(`/clientes/${nuevoCliente.id}`);
      }, 1500);
    } catch (err: any) {
      console.error("Error creating cliente:", err);
      setError(err.message || "Error al crear el cliente");
      toast.error(err.message || "Error al crear el cliente");
      setIsSaving(false);
    }
  };

  return (
    <div className="py-10">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => router.push("/clientes")}
            className="mr-3"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Volver
          </Button>
          <h1 className="text-3xl font-bold">Nuevo Cliente</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle>Información del Cliente</CardTitle>
            <CardDescription>
              Completa los datos del nuevo cliente. Los campos marcados con * son obligatorios.
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
          
          <CardFooter className="flex justify-between border-t p-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/clientes")}
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
                  Crear Cliente
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

      <Toaster />
    </div>
  );
} 