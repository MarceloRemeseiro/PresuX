"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { 
  ArrowLeft, 
  Loader2, 
  Edit, 
  Trash, 
  Plus,
  Package,
  Building,
  Tag,
  Calendar,
  DollarSign,
  Hash,
  FileText
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { apiClient } from "@/lib/apiClient";
import { IProductoConDetalles } from "@/types/producto";
import { DataTable, DataTableColumn } from "@/components/ui/data-table";

interface EquipoItem extends Record<string, unknown> {
  id: string;
  numero_serie: string | null;
  notas_internas: string | null;
  estado: 'DISPONIBLE' | 'ALQUILADO' | 'MANTENIMIENTO' | 'DAÑADO';
  fecha_compra: string | null;
  precio_compra: number | null;
  created_at: string;
  updated_at: string;
  producto_id: string;
  proveedor_id: string | null;
  producto_nombre: string;
  proveedor_nombre: string | null;
}

export default function ProductoDetallePage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const productoId = params.id;

  const [producto, setProducto] = useState<IProductoConDetalles | null>(null);
  const [equipoItems, setEquipoItems] = useState<EquipoItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingItems, setIsLoadingItems] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

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

    const fetchEquipoItems = async () => {
      try {
        setIsLoadingItems(true);
        const data = await apiClient<EquipoItem[]>(`/api/productos/${productoId}/items`);
        setEquipoItems(data);
      } catch (err: unknown) {
        console.error("Error fetching equipo items:", err);
        toast.error("Error al cargar el stock del producto");
      } finally {
        setIsLoadingItems(false);
      }
    };

    if (productoId) {
      fetchProducto();
      fetchEquipoItems();
    }
  }, [productoId]);

  // Función para formatear fechas
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('es', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(date);
  };

  // Función para formatear moneda
  const formatCurrency = (value: number | null | undefined) => {
    if (value === null || value === undefined) return '-';
    return new Intl.NumberFormat('es', {
      style: 'currency',
      currency: 'EUR'
    }).format(value);
  };

  // Función para obtener el color del estado
  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'DISPONIBLE':
        return 'bg-green-100 text-green-800';
      case 'ALQUILADO':
        return 'bg-blue-100 text-blue-800';
      case 'MANTENIMIENTO':
        return 'bg-yellow-100 text-yellow-800';
      case 'DAÑADO':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Función para mostrar el estado de forma amigable
  const getEstadoDisplay = (estado: string) => {
    switch (estado) {
      case 'DISPONIBLE':
        return 'Disponible';
      case 'ALQUILADO':
        return 'Alquilado';
      case 'MANTENIMIENTO':
        return 'Mantenimiento';
      case 'DAÑADO':
        return 'Dañado';
      default:
        return estado;
    }
  };

  // Configuración de columnas para la tabla de equipo items
  const columns: DataTableColumn<EquipoItem>[] = [
    {
      key: 'numero_serie',
      header: 'Número de Serie',
      cell: (item) => (
        <div className="font-medium">
          {item.numero_serie || 'Sin asignar'}
        </div>
      ),
      sortable: true,
      width: '20%'
    },
    {
      key: 'estado',
      header: 'Estado',
      cell: (item) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getEstadoColor(item.estado)}`}>
          {getEstadoDisplay(item.estado)}
        </span>
      ),
      sortable: true,
      width: '15%'
    },
    {
      key: 'fecha_compra',
      header: 'Fecha Compra',
      cell: (item) => (
        <span className="text-sm">
          {item.fecha_compra ? formatDate(item.fecha_compra) : '-'}
        </span>
      ),
      sortable: true,
      width: '15%'
    },
    {
      key: 'precio_compra',
      header: 'Precio Compra',
      cell: (item) => (
        <span className="font-medium">
          {formatCurrency(item.precio_compra)}
        </span>
      ),
      sortable: true,
      width: '15%'
    },
    {
      key: 'proveedor_nombre',
      header: 'Proveedor',
      cell: (item) => (
        <span className="text-sm">
          {item.proveedor_nombre || '-'}
        </span>
      ),
      sortable: true,
      width: '20%'
    },
    {
      key: 'acciones',
      header: 'Acciones',
      cell: (item) => (
        <div className="flex justify-end gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleEditItem(item.id)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleDeleteItem(item.id)}
          >
            <Trash className="h-4 w-4" />
          </Button>
        </div>
      ),
      width: '15%',
      minWidth: '110px'
    }
  ];

  const handleEditItem = (itemId: string) => {
    router.push(`/productos/${productoId}/items/editar/${itemId}`);
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!window.confirm("¿Estás seguro de que quieres eliminar este item? Esta acción no se puede deshacer.")) {
      return;
    }
    
    try {
      await apiClient(`/api/productos/${productoId}/items/${itemId}`, { method: "DELETE" });
      
      toast.success("Item eliminado correctamente");
      
      // Actualizar la lista de items
      const updatedItems = equipoItems.filter(item => item.id !== itemId);
      setEquipoItems(updatedItems);
      
      // Recargar datos del producto para actualizar el stock
      try {
        const data = await apiClient<IProductoConDetalles>(`/api/productos/${productoId}`);
        setProducto(data);
      } catch (err) {
        console.error("Error updating producto data:", err);
      }
    } catch (err: unknown) {
      console.error("Error deleting item:", err);
      const errorMessage = err instanceof Error ? err.message : "Error al eliminar el item";
      toast.error(errorMessage);
    }
  };

  const handleDelete = async () => {
    if (!producto) return;
    
    try {
      setIsDeleting(true);
      await apiClient(`/api/productos/${producto.id}`, { method: "DELETE" });
      
      toast.success("Producto y sus items eliminados correctamente");
      setShowDeleteDialog(false);
      
      // Redirigir después de un pequeño retraso para que se vea el toast
      setTimeout(() => {
        router.push("/productos");
      }, 1500);
    } catch (err: unknown) {
      console.error("Error deleting producto:", err);
      const errorMessage = err instanceof Error ? err.message : "Error al eliminar el producto";
      toast.error(errorMessage);
      setIsDeleting(false);
    }
  };

  if (isLoading) {
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
            onClick={() => router.push("/productos")}
            className="mr-3"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Volver
          </Button>
          <h1 className="text-3xl font-bold">Detalle del Producto</h1>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/productos/editar/${productoId}`}>
              <Edit className="mr-2 h-4 w-4" />
              Editar
            </Link>
          </Button>
          <Button 
            variant="destructive" 
            onClick={() => setShowDeleteDialog(true)}
            disabled={isDeleting}
          >
            <Trash className="mr-2 h-4 w-4" />
            Eliminar
          </Button>
        </div>
      </div>

      {producto && (
        <div className="space-y-6">
          {/* Información del Producto */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5 text-blue-600" />
                <div>
                  <CardTitle className="text-xl">{producto.nombre}</CardTitle>
                  <CardDescription>
                    {producto.marca_nombre} - {producto.modelo}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="flex items-center gap-2">
                  <Building className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-500">Categoría</p>
                    <p className="font-medium">{producto.categoria_nombre}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Tag className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-500">Stock Total</p>
                    <p className="font-medium">{producto.stock}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-500">Precio Alquiler/día</p>
                    <p className="font-medium">{formatCurrency(producto.precio_alquiler)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-500">Creado</p>
                    <p className="font-medium">{formatDate(producto.created_at)}</p>
                  </div>
                </div>
              </div>
              
              {/* Segunda fila con precio compra referencia si existe */}
              {producto.precio_compra_referencia && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-500">Precio Compra Referencia</p>
                      <p className="font-medium">{formatCurrency(producto.precio_compra_referencia)}</p>
                    </div>
                  </div>
                </div>
              )}
              
              {producto.descripcion && (
                <>
                  <Separator />
                  <div className="flex items-start gap-2">
                    <FileText className="h-4 w-4 text-gray-500 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500">Descripción</p>
                      <p className="text-sm">{producto.descripcion}</p>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Stock / Equipo Items */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Hash className="h-5 w-5" />
                    Stock del Producto
                  </CardTitle>
                  <CardDescription>
                    Gestiona los items individuales de este producto
                  </CardDescription>
                </div>
                <Button onClick={() => router.push(`/productos/${productoId}/items/agregar`)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Agregar Item
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingItems ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : (
                <DataTable
                  data={equipoItems}
                  columns={columns}
                  pageIndex={0}
                  pageSize={equipoItems.length}
                  pageCount={1}
                  onPaginationChange={() => {}}
                />
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Diálogo de confirmación para eliminar */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Eliminar producto?</DialogTitle>
            <DialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente el producto 
              <strong> &apos;{producto?.nombre}&apos;</strong> y todos sus items asociados.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowDeleteDialog(false)}
              disabled={isDeleting}
            >
              Cancelar
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Eliminando...
                </>
              ) : (
                <>
                  <Trash className="mr-2 h-4 w-4" />
                  Eliminar
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 