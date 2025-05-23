"use client";

import { useState, useEffect } from "react";
import { Settings, AlertTriangle, ChevronDown, ChevronRight } from "lucide-react";
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
import { ConfigTable } from "@/components/ui/config-table";
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

interface ConfigSectionProps {
  title: string;
  description: string;
  isExpanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

function ConfigSection({ title, description, isExpanded, onToggle, children }: ConfigSectionProps) {
  return (
    <Card>
      <CardHeader className="cursor-pointer" onClick={onToggle}>
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <CardTitle className="flex items-center gap-2">
              {isExpanded ? (
                <ChevronDown className="h-4 w-4 text-gray-500" />
              ) : (
                <ChevronRight className="h-4 w-4 text-gray-500" />
              )}
              {title}
            </CardTitle>
            <CardDescription className="mt-1">{description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      {isExpanded && <CardContent>{children}</CardContent>}
    </Card>
  );
}

export default function ConfiguracionPage() {
  const [categorias, setCategorias] = useState<CategoriaConUso[]>([]);
  const [marcas, setMarcas] = useState<MarcaConUso[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [showDeleteErrorDialog, setShowDeleteErrorDialog] = useState(false);
  
  // Estados para controlar qué secciones están expandidas
  const [categoriasExpanded, setCategoriasExpanded] = useState(false);
  const [marcasExpanded, setMarcasExpanded] = useState(false);

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
    // Auto-expandir la sección cuando se crea una nueva categoría
    setCategoriasExpanded(true);
  };

  const handleMarcaCreated = (nuevaMarca: IMarca) => {
    const marcaConUso = { ...nuevaMarca, productCount: 0 };
    setMarcas(prev => [...prev, marcaConUso].sort((a, b) => a.nombre.localeCompare(b.nombre)));
    // Auto-expandir la sección cuando se crea una nueva marca
    setMarcasExpanded(true);
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

  // Componentes wrapper para normalizar las props de los modales
  const WrappedModalCrearCategoria = ({ onItemCreated }: { onItemCreated: (item: CategoriaConUso) => void }) => (
    <ModalCrearCategoria onCategoriaCreated={onItemCreated} />
  );

  const WrappedModalCrearMarca = ({ onItemCreated }: { onItemCreated: (item: MarcaConUso) => void }) => (
    <ModalCrearMarca onMarcaCreated={onItemCreated} />
  );

  return (
    <div className="py-10">
      <div className="flex items-center gap-3 mb-8">
        <Settings className="h-8 w-8 text-blue-600" />
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Configuración</h1>
          <p className="text-gray-600">Gestiona la configuración de tu sistema</p>
        </div>
      </div>

      <div className="space-y-4 max-w-4xl">
        {/* Sección de Categorías */}
        <ConfigSection
          title="Categorías de Productos"
          description="Gestiona las categorías disponibles para clasificar tus productos"
          isExpanded={categoriasExpanded}
          onToggle={() => setCategoriasExpanded(!categoriasExpanded)}
        >
          <ConfigTable
            items={categorias}
            itemType="categoría"
            itemTypePlural="categorías"
            onDelete={handleDeleteCategoria}
            CreateModal={WrappedModalCrearCategoria}
            onItemCreated={handleCategoriaCreated}
          />
        </ConfigSection>

        {/* Sección de Marcas */}
        <ConfigSection
          title="Marcas"
          description="Gestiona las marcas disponibles para tus productos"
          isExpanded={marcasExpanded}
          onToggle={() => setMarcasExpanded(!marcasExpanded)}
        >
          <ConfigTable
            items={marcas}
            itemType="marca"
            itemTypePlural="marcas"
            onDelete={handleDeleteMarca}
            CreateModal={WrappedModalCrearMarca}
            onItemCreated={handleMarcaCreated}
          />
        </ConfigSection>

        {/* Placeholder para futuras secciones de configuración */}
        <Card className="border-dashed border-2 border-gray-200">
          <CardContent className="flex items-center justify-center py-8">
            <p className="text-gray-500 text-sm">Más opciones de configuración próximamente...</p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 p-4 bg-blue-50 rounded-lg max-w-4xl">
        <h3 className="font-medium text-blue-900 mb-2">💡 Consejos</h3>
        <div className="text-sm text-blue-700 space-y-1">
          <p>• También puedes crear categorías y marcas directamente desde los formularios de productos usando los botones &apos;+&apos;.</p>
          <p>• Solo puedes eliminar categorías y marcas que no estén siendo utilizadas por ningún producto.</p>
          <p>• Para eliminar una categoría/marca en uso, primero cambia la categoría/marca en todos los productos que la utilizan.</p>
          <p>• Haz clic en los títulos de las secciones para expandir o contraer el contenido.</p>
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