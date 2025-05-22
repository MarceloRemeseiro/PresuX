"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import { IProveedor, TipoProveedor } from "@/types"; // Cambiado a IProveedor, TipoProveedor

export default function NuevoProveedorPage() { // Cambiado nombre de función
  const router = useRouter();

  const [formData, setFormData] = useState({
    nombre: "",
    tipo: "", // TipoProveedor será un string del enum
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nombre || !formData.tipo) {
      toast.error("El nombre y tipo de proveedor son obligatorios"); // Mensaje cambiado
      return;
    }
    
    try {
      setIsSaving(true);
      setError(null);
      
      const nuevoProveedor = await apiClient<IProveedor>('/api/proveedores', { // Cambiado endpoint y tipo
        method: "POST",
        body: formData 
      });
      
      toast.success("Proveedor creado correctamente"); // Mensaje cambiado
      
      setTimeout(() => {
        router.push(`/proveedores/${nuevoProveedor.id}`); // Cambiada ruta
      }, 1500);
    } catch (err: unknown) {
      console.error("Error creating proveedor:", err); // Mensaje cambiado
      const errorMessage = err instanceof Error ? err.message : "Error al crear el proveedor"; // Mensaje cambiado
      setError(errorMessage);
      toast.error(errorMessage);
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
            onClick={() => router.push("/proveedores")} // Cambiada ruta
            className="mr-3"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Volver
          </Button>
          <h1 className="text-3xl font-bold">Nuevo Proveedor</h1> {/* Título cambiado */}
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle>Información del Proveedor</CardTitle> {/* Título cambiado */}
            <CardDescription>
              Completa los datos del nuevo proveedor. Los campos marcados con * son obligatorios.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Información básica</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="nombre" className="block text-sm font-medium">Nombre *</label>
                  <Input id="nombre" name="nombre" value={formData.nombre} onChange={handleChange} required />
                </div>
                <div className="space-y-2">
                  <label htmlFor="tipo" className="block text-sm font-medium">Tipo de proveedor *</label> {/* Texto cambiado */}
                  <select
                    id="tipo"
                    name="tipo"
                    value={formData.tipo}
                    onChange={handleChange}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    required
                  >
                    <option value="" disabled>Seleccionar tipo</option>
                    {/* Usar TipoProveedor para las opciones */}
                    <option value={TipoProveedor.BIENES}>BIENES</option>
                    <option value={TipoProveedor.SERVICIOS}>SERVICIOS</option>
                    <option value={TipoProveedor.MIXTO}>MIXTO</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label htmlFor="nif" className="block text-sm font-medium">NIF/CIF</label>
                  <Input id="nif" name="nif" value={formData.nif} onChange={handleChange} />
                </div>
                <div className="space-y-2">
                  <label htmlFor="persona_de_contacto" className="block text-sm font-medium">Persona de contacto</label>
                  <Input id="persona_de_contacto" name="persona_de_contacto" value={formData.persona_de_contacto} onChange={handleChange} />
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
                <label htmlFor="es_intracomunitario" className="text-sm font-medium">Proveedor intracomunitario</label> {/* Texto cambiado */}
              </div>
            </div>
            <div className="space-y-4 pt-4 border-t">
              <h3 className="text-lg font-medium">Información de contacto</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="email" className="block text-sm font-medium">Email</label>
                  <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} />
                </div>
                <div className="space-y-2">
                  <label htmlFor="telefono" className="block text-sm font-medium">Teléfono</label>
                  <Input id="telefono" name="telefono" value={formData.telefono} onChange={handleChange} />
                </div>
              </div>
            </div>
            <div className="space-y-4 pt-4 border-t">
              <h3 className="text-lg font-medium">Dirección</h3>
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <label htmlFor="direccion" className="block text-sm font-medium">Dirección</label>
                  <Input id="direccion" name="direccion" value={formData.direccion} onChange={handleChange} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="ciudad" className="block text-sm font-medium">Ciudad</label>
                    <Input id="ciudad" name="ciudad" value={formData.ciudad} onChange={handleChange} />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between p-6">
            <Button type="button" variant="outline" onClick={() => router.push("/proveedores")} disabled={isSaving}>Cancelar</Button> {/* Cambiada ruta */}
            <Button type="submit" disabled={isSaving}>
              {isSaving ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Guardando...</>
              ) : (
                <><Save className="mr-2 h-4 w-4" /> Crear Proveedor</> /* Texto cambiado */
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