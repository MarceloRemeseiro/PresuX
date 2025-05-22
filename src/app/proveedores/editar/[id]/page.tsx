"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { apiClient } from "@/lib/apiClient";
import { IProveedor, TipoProveedor } from "@/types";

export default function EditarProveedorPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const proveedorId = params.id;

  const [proveedor, setProveedor] = useState<IProveedor | null>(null);
  const [formData, setFormData] = useState<{
    nombre: string;
    tipo: TipoProveedor | "";
    persona_de_contacto: string;
    nif: string;
    direccion: string;
    ciudad: string;
    email: string;
    telefono: string;
    es_intracomunitario: boolean;
  }>({ 
    nombre: "", tipo: "", persona_de_contacto: "", nif: "", direccion: "", ciudad: "", email: "", telefono: "", es_intracomunitario: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProveedor = async () => {
      try {
        setIsLoading(true); setError(null);
        const data = await apiClient<IProveedor>(`/api/proveedores/${proveedorId}`);
        setProveedor(data);
        setFormData({
          nombre: data.nombre || "", tipo: data.tipo || "", persona_de_contacto: data.persona_de_contacto || "",
          nif: data.nif || "", direccion: data.direccion || "", ciudad: data.ciudad || "",
          email: data.email || "", telefono: data.telefono || "", es_intracomunitario: data.es_intracomunitario || false,
        });
      } catch (err: unknown) {
        console.error("Error fetching proveedor:", err);
        const errorMessage = err instanceof Error ? err.message : "Error al cargar los datos del proveedor";
        setError(errorMessage); toast.error(errorMessage);
      } finally { setIsLoading(false); }
    };
    if (proveedorId) fetchProveedor();
  }, [proveedorId]);

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
      toast.error("El nombre y tipo de proveedor son obligatorios.");
      return;
    }
    try {
      setIsSaving(true); setError(null);
      const changedFields: Partial<typeof formData> = {};
      if (proveedor) { // Asegurarse de que proveedor no sea null
        for (const key in formData) {
          if (Object.prototype.hasOwnProperty.call(formData, key)) {
            const typedKey = key as keyof typeof formData;
            const formValue = formData[typedKey];
            const proveedorValue = proveedor[typedKey as keyof IProveedor];
            
            let valuesAreDifferent = false;
            if (typedKey === "tipo") {
              valuesAreDifferent = proveedorValue !== formValue && (formValue !== "" || proveedorValue != null);
            } else if (typedKey === "es_intracomunitario") {
              valuesAreDifferent = proveedorValue !== formValue;
            } else {
              valuesAreDifferent = proveedorValue !== formValue && (formValue !== "" || (proveedorValue !== null && proveedorValue !== undefined));
            }

            if (valuesAreDifferent) {
              // @ts-expect-error La inferencia de tipos aquí es compleja para el compilador.
              changedFields[typedKey] = formValue;
            }
          }
        }
      }

      if (Object.keys(changedFields).length === 0) {
        toast.success("No hay cambios para guardar."); // Usar success como en cliente para este mensaje
        setIsSaving(false); // Necesario resetear isSaving aquí también
        return;
      }
      await apiClient(`/api/proveedores/${proveedorId}`, { method: "PUT", body: changedFields });
      toast.success("Proveedor actualizado correctamente");
      setTimeout(() => { router.push(`/proveedores/${proveedorId}`); }, 1500);
    } catch (err: unknown) {
      console.error("Error al actualizar proveedor:", err);
      const message = err instanceof Error ? err.message : "Ocurrió un error desconocido";
      setError(message); toast.error(message);
    } finally { setIsSaving(false); }
  };

  if (isLoading) {
    return (
      <div className="py-10 flex justify-center"><div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto" /><p className="mt-2">Cargando datos del proveedor...</p>
      </div></div>
    );
  }

  if (error && !proveedor) { // Si hay error y no se pudo cargar el proveedor
    return (
      <div className="py-10"><div className="p-4 mb-4 text-red-800 rounded-lg bg-red-50">
        <p>{error}</p>
        <Button onClick={() => router.push("/proveedores")} className="mt-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Volver a Proveedores
        </Button>
      </div></div>
    );
  }

  return (
    <div className="py-10">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <Button variant="ghost" size="sm" onClick={() => router.push(proveedor ? `/proveedores/${proveedorId}` : '/proveedores')} className="mr-3">
            <ArrowLeft className="h-4 w-4 mr-1" />Volver
          </Button>
          <h1 className="text-3xl font-bold">Editar Proveedor</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="max-w-4xl mx-auto"> {/* Sin shadow-lg rounded-lg */}
          <CardHeader> {/* Sin bg-slate-50 */}
            <CardTitle>Información del Proveedor</CardTitle>
            <CardDescription>
              Actualiza los datos del proveedor. Los campos marcados con * son obligatorios.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6"> {/* Mantener space-y-6 de cliente */}
            {/* Información básica */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Información básica</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="nombre" className="block text-sm font-medium">Nombre *</label>
                  <Input id="nombre" name="nombre" value={formData.nombre} onChange={handleChange} required />
                </div>
                <div className="space-y-2">
                  <label htmlFor="tipo" className="block text-sm font-medium">Tipo de proveedor *</label>
                  <select
                    id="tipo" name="tipo" value={formData.tipo} onChange={handleChange} required
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="" disabled>Seleccionar tipo</option>
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
                  type="checkbox" id="es_intracomunitario" name="es_intracomunitario"
                  checked={formData.es_intracomunitario} onChange={handleChange}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" // Clases de cliente
                />
                <label htmlFor="es_intracomunitario" className="text-sm font-medium">Proveedor intracomunitario</label>
              </div>
            </div>
            
            {/* Información de contacto */}
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
            
            {/* Dirección */}
            <div className="space-y-4 pt-4 border-t">
              <h3 className="text-lg font-medium">Dirección</h3>
              <div className="grid grid-cols-1 gap-4"> {/* Cliente usa gap-4 aquí */}
                <div className="space-y-2">
                  <label htmlFor="direccion" className="block text-sm font-medium">Dirección</label>
                  <Input id="direccion" name="direccion" value={formData.direccion} onChange={handleChange} />
                </div>
                {/* En cliente, ciudad está en un subgrid, aquí lo ponemos igual para consistencia si es necesario */}
                {/* Pero cliente tiene un subgrid md:grid-cols-2 para ciudad y CP, aquí solo tenemos ciudad */}
                {/* Mantendremos ciudad simple por ahora, o lo adaptamos si se añade CP a proveedor */}
                <div className="space-y-2">
                    <label htmlFor="ciudad" className="block text-sm font-medium">Ciudad</label>
                    <Input id="ciudad" name="ciudad" value={formData.ciudad} onChange={handleChange} />
                </div>
              </div>
            </div>
          </CardContent>
          
          <CardFooter className="flex justify-between p-6"> {/* Sin bg-slate, con justify-between */}
            <Button type="button" variant="outline" onClick={() => router.push(proveedor ? `/proveedores/${proveedorId}` : '/proveedores')} disabled={isSaving}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSaving || isLoading}>
              {isSaving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Guardando...</> : <><Save className="mr-2 h-4 w-4" /> Guardar Cambios</>}
            </Button>
          </CardFooter>
        </Card>
      </form>

      {/* Mensaje de error debajo del formulario, si existe y no se está guardando */}
      {error && !isSaving && (
        <div className="p-4 mt-6 text-red-800 rounded-lg bg-red-50 max-w-4xl mx-auto"> {/* Clases de cliente */}
          <p className="font-medium">Error:</p> {/* Texto de cliente */}
          <p>{error}</p>
        </div>
      )}
    </div>
  );
} 