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
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { apiClient } from "@/lib/apiClient";
import { IProductoConDetalles, IProveedor, EstadoEquipo } from "@/types";

export default function AgregarEquipoItemPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const productoId = params.id;

  const [producto, setProducto] = useState<IProductoConDetalles | null>(null);
  const [proveedores, setProveedores] = useState<IProveedor[]>([]);
  const [formData, setFormData] = useState({
    numero_serie: "",
    notas_internas: "",
    estado: "disponible" as "disponible" | "alquilado" | "mantenimiento" | "dañado",
    fecha_compra: "",
    precio_compra: "",
    proveedor_id: "",
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingProveedores, setIsLoadingProveedores] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cargar datos del producto
  useEffect(() => {
    const fetchProducto = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await apiClient<IProductoConDetalles>(`/api/productos/${productoId}`);
        setProducto(data);
      } catch (err: unknown) {
        console.error("Error fetching producto:", err);
        const errorMessage = err instanceof Error ? err.message : "Error al cargar los datos del producto";
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    if (productoId) {
      fetchProducto();
    }
  }, [productoId]);

  // Cargar proveedores
  useEffect(() => {
    const fetchProveedores = async () => {
      try {
        setIsLoadingProveedores(true);
        const data = await apiClient<IProveedor[]>('/api/proveedores');
        setProveedores(data);
      } catch (err) {
        console.error("Error cargando proveedores:", err);
        toast.error("Error al cargar la lista de proveedores");
      } finally {
        setIsLoadingProveedores(false);
      }
    };

    fetchProveedores();
  }, []);

  // Manejar cambios en los inputs
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Mapear estados del frontend a la base de datos
  const mapEstadoToDb = (estadoFrontend: string): string => {
    switch (estadoFrontend) {
      case "disponible":
        return EstadoEquipo.DISPONIBLE;
      case "alquilado":
        return EstadoEquipo.ALQUILADO;
      case "mantenimiento":
        return EstadoEquipo.MANTENIMIENTO;
      case "dañado":
        return EstadoEquipo.DAÑADO;
      default:
        return EstadoEquipo.DISPONIBLE;
    }
  };

  // Enviar formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsSaving(true);
      setError(null);
      
      // Preparar datos para envío
      const dataToSend = {
        numero_serie: formData.numero_serie || null,
        notas_internas: formData.notas_internas || null,
        estado: mapEstadoToDb(formData.estado), // Mapear al valor de la BD
        fecha_compra: formData.fecha_compra || null,
        precio_compra: formData.precio_compra ? parseFloat(formData.precio_compra) : null,
        proveedor_id: formData.proveedor_id || null,
      };
      
      // Crear nuevo equipo-item
      await apiClient(`/api/productos/${productoId}/items`, { 
        method: "POST",
        body: dataToSend 
      });
      
      toast.success("Item agregado correctamente");
      
      // Redirigir a la página del producto
      setTimeout(() => {
        router.push(`/productos/${productoId}`);
      }, 1500);
    } catch (err: unknown) {
      console.error("Error creando item:", err);
      const errorMessage = err instanceof Error ? err.message : "Error al agregar el item";
      setError(errorMessage);
      toast.error(errorMessage);
      setIsSaving(false);
    }
  };

  if (isLoading || isLoadingProveedores) {
    return (
      <div className="py-10 flex justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
          <p className="mt-2">Cargando formulario...</p>
        </div>
      </div>
    );
  }

  if (error && !producto) {
    return (
      <div className="py-10">
        <div className="p-4 mb-4 text-red-800 rounded-lg bg-red-50">
          <p>{error}</p>
          <Button onClick={() => router.push("/productos")} className="mt-4">
            <ArrowLeft className="mr-2 h-4 w-4" /> Volver a Productos
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="py-10">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => router.push(`/productos/${productoId}`)}
            className="mr-3"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Volver
          </Button>
          <h1 className="text-3xl font-bold">Agregar Item al Producto</h1>
        </div>
      </div>

      {producto && (
        <div className="mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div>
                  <h2 className="text-lg font-semibold">{producto.nombre}</h2>
                  <p className="text-sm text-gray-600">
                    {producto.marca_nombre} {producto.modelo && `- ${producto.modelo}`}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle>Información del Item</CardTitle>
            <CardDescription>
              Completa los datos del nuevo item. Todos los campos son opcionales excepto el estado.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Información básica */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Información básica</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="numero_serie" className="block text-sm font-medium">
                    Número de Serie
                  </label>
                  <Input
                    id="numero_serie"
                    name="numero_serie"
                    value={formData.numero_serie}
                    onChange={handleChange}
                    placeholder="Ej: ABC123456"
                  />
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="estado" className="block text-sm font-medium">
                    Estado *
                  </label>
                  <select
                    id="estado"
                    name="estado"
                    value={formData.estado}
                    onChange={handleChange}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    required
                  >
                    <option value="disponible">Disponible</option>
                    <option value="alquilado">Alquilado</option>
                    <option value="mantenimiento">En Mantenimiento</option>
                    <option value="dañado">Dañado</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="notas_internas" className="block text-sm font-medium">
                  Notas Internas
                </label>
                <textarea
                  id="notas_internas"
                  name="notas_internas"
                  value={formData.notas_internas}
                  onChange={handleChange}
                  placeholder="Notas internas sobre este item..."
                  rows={3}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
            </div>
            
            {/* Información de compra */}
            <div className="space-y-4 pt-4 border-t">
              <h3 className="text-lg font-medium">Información de Compra</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label htmlFor="fecha_compra" className="block text-sm font-medium">
                    Fecha de Compra
                  </label>
                  <Input
                    id="fecha_compra"
                    name="fecha_compra"
                    type="date"
                    value={formData.fecha_compra}
                    onChange={handleChange}
                  />
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="precio_compra" className="block text-sm font-medium">
                    Precio de Compra (€)
                  </label>
                  <Input
                    id="precio_compra"
                    name="precio_compra"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.precio_compra}
                    onChange={handleChange}
                    placeholder="0.00"
                  />
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="proveedor_id" className="block text-sm font-medium">
                    Proveedor
                  </label>
                  <select
                    id="proveedor_id"
                    name="proveedor_id"
                    value={formData.proveedor_id}
                    onChange={handleChange}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="">Sin proveedor específico</option>
                    {proveedores.map((proveedor) => (
                      <option key={proveedor.id} value={proveedor.id}>
                        {proveedor.nombre}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {error && (
              <div className="p-4 text-red-800 rounded-lg bg-red-50">
                <p>{error}</p>
              </div>
            )}
          </CardContent>
          
          <div className="flex justify-end gap-3 p-6 pt-0">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => router.push(`/productos/${productoId}`)}
              disabled={isSaving}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Agregando...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Agregar Item
                </>
              )}
            </Button>
          </div>
        </Card>
      </form>
    </div>
  );
} 