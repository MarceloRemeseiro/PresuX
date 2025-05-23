"use client";

import { useState, useEffect } from "react";
import { Trash2, Settings, AlertTriangle } from "lucide-react";
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
import { ModalCrearCategoria } from "@/components/ui/modal-crear-categoria";
import { ModalCrearMarca } from "@/components/ui/modal-crear-marca";
import { apiClient } from "@/lib/apiClient";
import { IMarca, ICategoriaProducto } from "@/types";

interface CategoriaConUso extends ICategoriaProducto {
  productCount?: number;
}

interface MarcaConUso extends IMarca {
  productCount?: number;
}

export default function ConfiguracionPage() {
  const [categorias, setCategorias] = useState<CategoriaConUso[]>([]);
  const [marcas, setMarcas] = useState<MarcaConUso[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [showDeleteErrorDialog, setShowDeleteErrorDialog] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const [categoriasData, marcasData, productosData] = await Promise.all([
          apiClient<ICategoriaProducto[]>('/api/categorias-producto'),
          apiClient<IMarca[]>('/api/marcas'),
          apiClient<any[]>('/api/productos') // Para contar usos
        ]);
        
        // Contar cuántos productos usan cada categoría
        const categoriasConUso = categoriasData.map(categoria => ({
          ...categoria,
          productCount: productosData.filter(p => p.categoria_id === categoria.id).length
        }));
        
        // Contar cuántos productos usan cada marca
        const marcasConUso = marcasData.map(marca => ({
          ...marca,
          productCount: productosData.filter(p => p.marca_id === marca.id).length
        }));
        
        setCategorias(categoriasConUso);
        setMarcas(marcasConUso);
      } catch (err) {
        console.error("Error cargando datos:", err);
        toast.error("Error al cargar los datos de configuración");
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  const handleCategoriaCreated = (nuevaCategoria: ICategoriaProducto) => {
    const categoriaConUso = { ...nuevaCategoria, productCount: 0 };
    setCategorias(prev => [...prev, categoriaConUso].sort((a, b) => a.nombre.localeCompare(b.nombre)));
  };

  const handleMarcaCreated = (nuevaMarca: IMarca) => {
    const marcaConUso = { ...nuevaMarca, productCount: 0 };
    setMarcas(prev => [...prev, marcaConUso].sort((a, b) => a.nombre.localeCompare(b.nombre)));
  };

  const handleDeleteCategoria = async (categoria: CategoriaConUso) => {
    if (categoria.productCount && categoria.productCount > 0) {
      setDeleteError(`No se puede eliminar la categoría '${categoria.nombre}' porque está siendo usada por ${categoria.productCount} producto${categoria.productCount === 1 ? '' : 's'}.`);
      setShowDeleteErrorDialog(true);
      return;
    }

    if (!window.confirm(`¿Estás seguro de eliminar la categoría '${categoria.nombre}'? Esta acción no se puede deshacer.`)) {
      return;
    }

    try {
      await apiClient(`/api/categorias-producto/${categoria.id}`, { method: 'DELETE' });
      setCategorias(prev => prev.filter(c => c.id !== categoria.id));
      toast.success('Categoría eliminada correctamente');
    } catch (err: any) {
      console.error('Error eliminando categoría:', err);
      const errorMessage = err?.message || 'Error al eliminar la categoría';
      setDeleteError(errorMessage);
      setShowDeleteErrorDialog(true);
    }
  };

  const handleDeleteMarca = async (marca: MarcaConUso) => {
    if (marca.productCount && marca.productCount > 0) {
      setDeleteError(`No se puede eliminar la marca '${marca.nombre}' porque está siendo usada por ${marca.productCount} producto${marca.productCount === 1 ? '' : 's'}.`);
      setShowDeleteErrorDialog(true);
      return;
    }

    if (!window.confirm(`¿Estás seguro de eliminar la marca '${marca.nombre}'? Esta acción no se puede deshacer.`)) {
      return;
    }

    try {
      await apiClient(`/api/marcas/${marca.id}`, { method: 'DELETE' });
      setMarcas(prev => prev.filter(m => m.id !== marca.id));
      toast.success('Marca eliminada correctamente');
    } catch (err: any) {
      console.error('Error eliminando marca:', err);
      const errorMessage = err?.message || 'Error al eliminar la marca';
      setDeleteError(errorMessage);
      setShowDeleteErrorDialog(true);
    }
  };

  if (isLoading) {
    return (
      <div className="py-10 flex justify-center">
        <p>Cargando configuración...</p>
      </div>
    );
  }

  return (
    <div className="py-10">
      <div className="flex items-center gap-3 mb-8">
        <Settings className="h-8 w-8 text-blue-600" />
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Configuración</h1>
          <p className="text-gray-600">Gestiona las categorías y marcas de productos</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Categorías */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Categorías de Productos</CardTitle>
                <CardDescription>
                  Gestiona las categorías disponibles para clasificar tus productos
                </CardDescription>
              </div>
              <ModalCrearCategoria onCategoriaCreated={handleCategoriaCreated} />
            </div>
          </CardHeader>
          <CardContent>
            {categorias.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                No hay categorías creadas aún
              </p>
            ) : (
              <div className="space-y-2">
                {categorias.map((categoria) => (
                  <div
                    key={categoria.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex-1">
                      <span className="font-medium">{categoria.nombre}</span>
                      <div className="text-xs text-gray-500 mt-1">
                        {categoria.productCount === 0 
                          ? 'No se usa en productos' 
                          : `Usada en ${categoria.productCount} producto${categoria.productCount === 1 ? '' : 's'}`
                        }
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteCategoria(categoria)}
                      className={
                        !!(categoria.productCount && categoria.productCount > 0)
                          ? 'text-gray-400 cursor-not-allowed'
                          : 'text-red-600 hover:text-red-700 hover:bg-red-50'
                      }
                      disabled={!!(categoria.productCount && categoria.productCount > 0)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Marcas */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Marcas</CardTitle>
                <CardDescription>
                  Gestiona las marcas disponibles para tus productos
                </CardDescription>
              </div>
              <ModalCrearMarca onMarcaCreated={handleMarcaCreated} />
            </div>
          </CardHeader>
          <CardContent>
            {marcas.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                No hay marcas creadas aún
              </p>
            ) : (
              <div className="space-y-2">
                {marcas.map((marca) => (
                  <div
                    key={marca.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex-1">
                      <span className="font-medium">{marca.nombre}</span>
                      <div className="text-xs text-gray-500 mt-1">
                        {marca.productCount === 0 
                          ? 'No se usa en productos' 
                          : `Usada en ${marca.productCount} producto${marca.productCount === 1 ? '' : 's'}`
                        }
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteMarca(marca)}
                      className={
                        !!(marca.productCount && marca.productCount > 0)
                          ? 'text-gray-400 cursor-not-allowed'
                          : 'text-red-600 hover:text-red-700 hover:bg-red-50'
                      }
                      disabled={!!(marca.productCount && marca.productCount > 0)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-medium text-blue-900 mb-2">💡 Consejos</h3>
        <div className="text-sm text-blue-700 space-y-1">
          <p>• También puedes crear categorías y marcas directamente desde los formularios de productos usando los botones &apos;+&apos;.</p>
          <p>• Solo puedes eliminar categorías y marcas que no estén siendo utilizadas por ningún producto.</p>
          <p>• Para eliminar una categoría/marca en uso, primero cambia la categoría/marca en todos los productos que la utilizan.</p>
        </div>
      </div>

      {/* Diálogo de error de eliminación */}
      <Dialog open={showDeleteErrorDialog} onOpenChange={setShowDeleteErrorDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              No se puede eliminar
            </DialogTitle>
            <DialogDescription>
              {deleteError}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setShowDeleteErrorDialog(false)}>
              Entendido
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 