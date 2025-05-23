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
import { ModalCrearCategoria } from "@/components/ui/modal-crear-categoria";
import { ModalCrearMarca } from "@/components/ui/modal-crear-marca";
import { apiClient } from "@/lib/apiClient";
import { IProductoConDetalles, IMarca, ICategoriaProducto } from "@/types";

export default function EditarProductoPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const productoId = params.id;

  const [producto, setProducto] = useState<IProductoConDetalles | null>(null);
  const [formData, setFormData] = useState({
    nombre: "",
    descripcion: "",
    categoria_id: "",
    marca_id: "",
    modelo: "",
    precio_alquiler: "",
    precio_compra_referencia: "",
  });

  const [categorias, setCategorias] = useState<ICategoriaProducto[]>([]);
  const [marcas, setMarcas] = useState<IMarca[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingOptions, setIsLoadingOptions] = useState(true);
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
        
        // Inicializar el formulario con los datos del producto
        setFormData({
          nombre: data.nombre || "",
          descripcion: data.descripcion || "",
          categoria_id: data.categoria_id || "",
          marca_id: data.marca_id || "",
          modelo: data.modelo || "",
          precio_alquiler: data.precio_alquiler?.toString() || "",
          precio_compra_referencia: data.precio_compra_referencia?.toString() || "",
        });
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

  // Cargar categorías y marcas
  useEffect(() => {
    const loadOptions = async () => {
      try {
        setIsLoadingOptions(true);
        const [categoriasData, marcasData] = await Promise.all([
          apiClient<ICategoriaProducto[]>('/api/categorias-producto'),
          apiClient<IMarca[]>('/api/marcas')
        ]);
        setCategorias(categoriasData);
        setMarcas(marcasData);
      } catch (err) {
        console.error("Error cargando opciones:", err);
        toast.error("Error al cargar las opciones del formulario");
      } finally {
        setIsLoadingOptions(false);
      }
    };

    loadOptions();
  }, []);

  // Manejar cambios en los inputs
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Callback cuando se crea una nueva categoría
  const handleCategoriaCreated = (nuevaCategoria: ICategoriaProducto) => {
    setCategorias(prev => [...prev, nuevaCategoria].sort((a, b) => a.nombre.localeCompare(b.nombre)));
    setFormData(prev => ({ ...prev, categoria_id: nuevaCategoria.id }));
  };

  // Callback cuando se crea una nueva marca  
  const handleMarcaCreated = (nuevaMarca: IMarca) => {
    setMarcas(prev => [...prev, nuevaMarca].sort((a, b) => a.nombre.localeCompare(b.nombre)));
    setFormData(prev => ({ ...prev, marca_id: nuevaMarca.id }));
  };

  // Enviar formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nombre || !formData.categoria_id) {
      toast.error("El nombre y la categoría son obligatorios");
      return;
    }

    if (!formData.precio_alquiler) {
      toast.error("Debe especificar el precio de alquiler");
      return;
    }
    
    try {
      setIsSaving(true);
      setError(null);
      
      // Detectar cambios comparando con los datos originales
      const changedFields: Partial<{
        nombre: string;
        descripcion: string | null;
        categoria_id: string;
        marca_id: string | null;
        modelo: string | null;
        precio_alquiler: number;
        precio_compra_referencia: number | null;
      }> = {};

      if (producto) {
        if (formData.nombre !== producto.nombre) {
          changedFields.nombre = formData.nombre;
        }
        
        const newDescripcion = formData.descripcion || null;
        if (newDescripcion !== producto.descripcion) {
          changedFields.descripcion = newDescripcion;
        }
        
        if (formData.categoria_id !== producto.categoria_id) {
          changedFields.categoria_id = formData.categoria_id;
        }
        
        const newMarcaId = formData.marca_id || null;
        if (newMarcaId !== producto.marca_id) {
          changedFields.marca_id = newMarcaId;
        }
        
        const newModelo = formData.modelo || null;
        if (newModelo !== producto.modelo) {
          changedFields.modelo = newModelo;
        }
        
        const newPrecioAlquiler = parseFloat(formData.precio_alquiler);
        if (newPrecioAlquiler !== producto.precio_alquiler) {
          changedFields.precio_alquiler = newPrecioAlquiler;
        }
        
        const newPrecioCompraRef = formData.precio_compra_referencia ? parseFloat(formData.precio_compra_referencia) : null;
        if (newPrecioCompraRef !== producto.precio_compra_referencia) {
          changedFields.precio_compra_referencia = newPrecioCompraRef;
        }
      }
      
      if (Object.keys(changedFields).length === 0) {
        toast.success("No hay cambios para guardar");
        return;
      }
      
      // Actualizar producto
      await apiClient(`/api/productos/${productoId}`, { 
        method: "PUT",
        body: changedFields 
      });
      
      toast.success("Producto actualizado correctamente");
      
      // Redirigir a la página del producto después de un pequeño retraso
      setTimeout(() => {
        router.push(`/productos/${productoId}`);
      }, 1500);
    } catch (err: unknown) {
      console.error("Error actualizando producto:", err);
      const errorMessage = err instanceof Error ? err.message : "Error al actualizar el producto";
      setError(errorMessage);
      toast.error(errorMessage);
      setIsSaving(false);
    }
  };

  if (isLoading || isLoadingOptions) {
    return (
      <div className="py-10 flex justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
          <p className="mt-2">Cargando datos del producto...</p>
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
          <h1 className="text-3xl font-bold">Editar Producto</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle>Información del Producto</CardTitle>
            <CardDescription>
              Modifica los datos del producto. Los campos marcados con * son obligatorios.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Información básica */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Información básica</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="nombre" className="block text-sm font-medium">
                    Nombre del producto *
                  </label>
                  <Input
                    id="nombre"
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleChange}
                    placeholder="Ej: Cámara Canon EOS R5"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="categoria_id" className="block text-sm font-medium">
                    Categoría *
                  </label>
                  <div className="flex gap-2">
                    <select
                      id="categoria_id"
                      name="categoria_id"
                      value={formData.categoria_id}
                      onChange={handleChange}
                      className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      required
                    >
                      <option value="">Seleccionar categoría</option>
                      {categorias.map((categoria) => (
                        <option key={categoria.id} value={categoria.id}>
                          {categoria.nombre}
                        </option>
                      ))}
                    </select>
                    <ModalCrearCategoria onCategoriaCreated={handleCategoriaCreated} />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="marca_id" className="block text-sm font-medium">
                    Marca
                  </label>
                  <div className="flex gap-2">
                    <select
                      id="marca_id"
                      name="marca_id"
                      value={formData.marca_id}
                      onChange={handleChange}
                      className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <option value="">Sin marca específica</option>
                      {marcas.map((marca) => (
                        <option key={marca.id} value={marca.id}>
                          {marca.nombre}
                        </option>
                      ))}
                    </select>
                    <ModalCrearMarca onMarcaCreated={handleMarcaCreated} />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="modelo" className="block text-sm font-medium">
                    Modelo
                  </label>
                  <Input
                    id="modelo"
                    name="modelo"
                    value={formData.modelo}
                    onChange={handleChange}
                    placeholder="Ej: EOS R5"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="descripcion" className="block text-sm font-medium">
                  Descripción
                </label>
                <textarea
                  id="descripcion"
                  name="descripcion"
                  value={formData.descripcion}
                  onChange={handleChange}
                  placeholder="Descripción detallada del producto..."
                  rows={3}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
            </div>
            
            {/* Información de precios */}
            <div className="space-y-4 pt-4 border-t">
              <h3 className="text-lg font-medium">Precios</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="precio_alquiler" className="block text-sm font-medium">
                    Precio alquiler/día (€) *
                  </label>
                  <Input
                    id="precio_alquiler"
                    name="precio_alquiler"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.precio_alquiler}
                    onChange={handleChange}
                    placeholder="0.00"
                    required
                  />
                  <p className="text-xs text-gray-500">Precio fijo por día para alquilar este producto</p>
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="precio_compra_referencia" className="block text-sm font-medium">
                    Precio compra referencia (€)
                  </label>
                  <Input
                    id="precio_compra_referencia"
                    name="precio_compra_referencia"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.precio_compra_referencia}
                    onChange={handleChange}
                    placeholder="0.00"
                  />
                  <p className="text-xs text-gray-500">Precio orientativo de compra para este tipo de producto</p>
                </div>
              </div>
            </div>

            {/* Información adicional */}
            <div className="space-y-4 pt-4 border-t">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">ℹ️ Sobre el stock</h4>
                <div className="text-sm text-blue-700 space-y-2">
                  <p><strong>Stock actual:</strong> {producto?.stock || 0} unidades</p>
                  <p><strong>Gestión del stock:</strong> El stock se actualiza automáticamente al agregar o eliminar items individuales desde la página del producto.</p>
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
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Guardar Cambios
                </>
              )}
            </Button>
          </div>
        </Card>
      </form>
    </div>
  );
} 