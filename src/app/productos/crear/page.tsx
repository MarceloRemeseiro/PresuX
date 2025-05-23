"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
import { IProducto, IMarca, ICategoriaProducto } from "@/types";

export default function CrearProductoPage() {
  const router = useRouter();

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
  const [isLoadingOptions, setIsLoadingOptions] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cargar categorías y marcas al montar el componente
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

  // Manejar cambios en los inputs
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
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
      
      // Preparar datos para envío
      const dataToSend = {
        nombre: formData.nombre,
        descripcion: formData.descripcion || null,
        categoria_id: formData.categoria_id,
        marca_id: formData.marca_id || null,
        modelo: formData.modelo || null,
        precio_alquiler: parseFloat(formData.precio_alquiler),
        precio_compra_referencia: formData.precio_compra_referencia ? parseFloat(formData.precio_compra_referencia) : null,
      };
      
      // Crear nuevo producto
      const nuevoProducto = await apiClient<IProducto>('/api/productos', { 
        method: "POST",
        body: dataToSend 
      });
      
      toast.success("Producto creado correctamente");
      
      // Redirigir a la página del producto creado
      setTimeout(() => {
        router.push(`/productos/${nuevoProducto.id}`);
      }, 1500);
    } catch (err: unknown) {
      console.error("Error creando producto:", err);
      const errorMessage = err instanceof Error ? err.message : "Error al crear el producto";
      setError(errorMessage);
      toast.error(errorMessage);
      setIsSaving(false);
    }
  };

  if (isLoadingOptions) {
    return (
      <div className="py-10 flex justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
          <p className="mt-2">Cargando formulario...</p>
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
            onClick={() => router.push("/productos")}
            className="mr-3"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Volver
          </Button>
          <h1 className="text-3xl font-bold">Nuevo Producto</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle>Información del Producto</CardTitle>
            <CardDescription>
              Completa los datos del nuevo producto. Los campos marcados con * son obligatorios.
              El stock se calculará automáticamente basado en los items que agregues.
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
                <h4 className="font-medium text-blue-900 mb-2">ℹ️ Sobre el stock y precios</h4>
                <div className="text-sm text-blue-700 space-y-2">
                  <p><strong>Stock:</strong> Se calcula automáticamente contando los items individuales del producto.</p>
                  <p><strong>Precio compra referencia:</strong> Es un precio orientativo general para este tipo de producto.</p>
                  <p><strong>Precios de compra específicos:</strong> Se registran en cada item individual (pueden variar por fecha, proveedor, etc.).</p>
                  <p><strong>Después de crear:</strong> Ve a la página del producto y usa &apos;Agregar Item&apos; para añadir unidades específicas con sus números de serie y precios de compra reales.</p>
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
              onClick={() => router.push("/productos")}
              disabled={isSaving}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creando...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Crear Producto
                </>
              )}
            </Button>
          </div>
        </Card>
      </form>
    </div>
  );
} 