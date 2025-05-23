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
import { ConfigTableWithPrice } from "@/components/ui/config-table-with-price";
import { ModalCrearCategoria } from "@/components/ui/modal-crear-categoria";
import { ModalCrearMarca } from "@/components/ui/modal-crear-marca";
import { ModalCrearServicio } from "@/components/ui/modal-crear-servicio";
import { ModalCrearPuestoTrabajo } from "@/components/ui/modal-crear-puesto-trabajo";
import { apiClient } from "@/lib/apiClient";
import { IMarca, ICategoriaProducto } from "@/types";
import type { Servicio } from "@/types/servicio";
import type { PuestoTrabajo } from "@/types/puesto-trabajo";

interface CategoriaConUso extends ICategoriaProducto {
  productCount?: number;
}

interface MarcaConUso extends IMarca {
  productCount?: number;
}

interface ServicioConUso extends Servicio {
  productCount?: number; // Para futuro uso en presupuestos
}

interface PuestoTrabajoConUso extends PuestoTrabajo {
  productCount?: number; // Para futuro uso en presupuestos
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
  const [servicios, setServicios] = useState<ServicioConUso[]>([]);
  const [puestosTrabajo, setPuestosTrabajo] = useState<PuestoTrabajoConUso[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [showDeleteErrorDialog, setShowDeleteErrorDialog] = useState(false);
  
  // Estados para controlar qué secciones están expandidas
  const [categoriasExpanded, setCategoriasExpanded] = useState(false);
  const [marcasExpanded, setMarcasExpanded] = useState(false);
  const [serviciosExpanded, setServiciosExpanded] = useState(false);
  const [puestosTrabajoExpanded, setPuestosTrabajoExpanded] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const [categoriasData, marcasData, productosData, serviciosData, puestosTrabajoData] = await Promise.all([
          apiClient<ICategoriaProducto[]>('/api/categorias-producto'),
          apiClient<IMarca[]>('/api/marcas'),
          apiClient<any[]>('/api/productos'), // Para contar usos
          apiClient<{ servicios: Servicio[] }>('/api/servicios'),
          apiClient<{ puestosTrabajo: PuestoTrabajo[] }>('/api/puestos-trabajo'),
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

        // Para servicios y puestos de trabajo, por ahora productCount será 0
        // TODO: Implementar conteo cuando se agreguen a presupuestos
        const serviciosConUso = serviciosData.servicios.map(servicio => ({
          ...servicio,
          productCount: 0
        }));

        const puestosTrabajoConUso = puestosTrabajoData.puestosTrabajo.map(puesto => ({
          ...puesto,
          productCount: 0
        }));
        
        setCategorias(categoriasConUso);
        setMarcas(marcasConUso);
        setServicios(serviciosConUso);
        setPuestosTrabajo(puestosTrabajoConUso);
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
    setCategoriasExpanded(true);
  };

  const handleMarcaCreated = (nuevaMarca: IMarca) => {
    const marcaConUso = { ...nuevaMarca, productCount: 0 };
    setMarcas(prev => [...prev, marcaConUso].sort((a, b) => a.nombre.localeCompare(b.nombre)));
    setMarcasExpanded(true);
  };

  const handleServicioCreated = (nuevoServicio: Servicio) => {
    const servicioConUso = { ...nuevoServicio, productCount: 0 };
    setServicios(prev => [...prev, servicioConUso].sort((a, b) => a.nombre.localeCompare(b.nombre)));
    setServiciosExpanded(true);
  };

  const handlePuestoTrabajoCreated = (nuevoPuesto: PuestoTrabajo) => {
    const puestoConUso = { ...nuevoPuesto, productCount: 0 };
    setPuestosTrabajo(prev => [...prev, puestoConUso].sort((a, b) => a.nombre.localeCompare(b.nombre)));
    setPuestosTrabajoExpanded(true);
  };

  const handleServicioUpdated = (servicioActualizado: Servicio) => {
    setServicios(prev => 
      prev.map(s => s.id === servicioActualizado.id ? { ...servicioActualizado, productCount: s.productCount } : s)
        .sort((a, b) => a.nombre.localeCompare(b.nombre))
    );
  };

  const handlePuestoTrabajoUpdated = (puestoActualizado: PuestoTrabajo) => {
    setPuestosTrabajo(prev => 
      prev.map(p => p.id === puestoActualizado.id ? { ...puestoActualizado, productCount: p.productCount } : p)
        .sort((a, b) => a.nombre.localeCompare(b.nombre))
    );
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

  const handleDeleteServicio = async (servicio: ServicioConUso) => {
    if (servicio.productCount && servicio.productCount > 0) {
      setDeleteError(`No se puede eliminar el servicio '${servicio.nombre}' porque está siendo usado en ${servicio.productCount} presupuesto${servicio.productCount === 1 ? '' : 's'}.`);
      setShowDeleteErrorDialog(true);
      return;
    }

    if (!window.confirm(`¿Estás seguro de eliminar el servicio '${servicio.nombre}'? Esta acción no se puede deshacer.`)) {
      return;
    }

    try {
      await apiClient(`/api/servicios/${servicio.id}`, { method: 'DELETE' });
      setServicios(prev => prev.filter(s => s.id !== servicio.id));
      toast.success('Servicio eliminado correctamente');
    } catch (err: any) {
      console.error('Error eliminando servicio:', err);
      const errorMessage = err?.message || 'Error al eliminar el servicio';
      setDeleteError(errorMessage);
      setShowDeleteErrorDialog(true);
    }
  };

  const handleDeletePuestoTrabajo = async (puesto: PuestoTrabajoConUso) => {
    if (puesto.productCount && puesto.productCount > 0) {
      setDeleteError(`No se puede eliminar el puesto '${puesto.nombre}' porque está siendo usado en ${puesto.productCount} presupuesto${puesto.productCount === 1 ? '' : 's'}.`);
      setShowDeleteErrorDialog(true);
      return;
    }

    if (!window.confirm(`¿Estás seguro de eliminar el puesto de trabajo '${puesto.nombre}'? Esta acción no se puede deshacer.`)) {
      return;
    }

    try {
      await apiClient(`/api/puestos-trabajo/${puesto.id}`, { method: 'DELETE' });
      setPuestosTrabajo(prev => prev.filter(p => p.id !== puesto.id));
      toast.success('Puesto de trabajo eliminado correctamente');
    } catch (err: any) {
      console.error('Error eliminando puesto de trabajo:', err);
      const errorMessage = err?.message || 'Error al eliminar el puesto de trabajo';
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

  const WrappedModalCrearServicio = ({ onItemCreated }: { onItemCreated: (item: ServicioConUso) => void }) => (
    <ModalCrearServicio onServicioCreated={onItemCreated} />
  );

  const WrappedModalCrearPuestoTrabajo = ({ onItemCreated }: { onItemCreated: (item: PuestoTrabajoConUso) => void }) => (
    <ModalCrearPuestoTrabajo onPuestoTrabajoCreated={onItemCreated} />
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

        {/* Sección de Servicios */}
        <ConfigSection
          title="Servicios Técnicos"
          description="Gestiona los servicios técnicos disponibles para tus presupuestos"
          isExpanded={serviciosExpanded}
          onToggle={() => setServiciosExpanded(!serviciosExpanded)}
        >
          <ConfigTableWithPrice
            items={servicios}
            itemType="servicio"
            itemTypePlural="servicios"
            apiEndpoint="/api/servicios"
            onDelete={handleDeleteServicio}
            onUpdate={handleServicioUpdated}
            CreateModal={WrappedModalCrearServicio}
            onItemCreated={handleServicioCreated}
          />
        </ConfigSection>

        {/* Sección de Puestos de Trabajo */}
        <ConfigSection
          title="Puestos de Trabajo"
          description="Gestiona los puestos de trabajo profesionales disponibles para tus presupuestos"
          isExpanded={puestosTrabajoExpanded}
          onToggle={() => setPuestosTrabajoExpanded(!puestosTrabajoExpanded)}
        >
          <ConfigTableWithPrice
            items={puestosTrabajo}
            itemType="puesto de trabajo"
            itemTypePlural="puestos de trabajo"
            apiEndpoint="/api/puestos-trabajo"
            onDelete={handleDeletePuestoTrabajo}
            onUpdate={handlePuestoTrabajoUpdated}
            CreateModal={WrappedModalCrearPuestoTrabajo}
            onItemCreated={handlePuestoTrabajoCreated}
          />
        </ConfigSection>
      </div>

      <div className="mt-8 p-4 bg-blue-50 rounded-lg max-w-4xl">
        <h3 className="font-medium text-blue-900 mb-2">💡 Consejos</h3>
        <div className="text-sm text-blue-700 space-y-1">
          <p>• Los <strong>servicios técnicos</strong> y <strong>puestos de trabajo</strong> muestran el precio por día.</p>
          <p>• Haz clic en el botón <strong>editar (✏️)</strong> para modificar nombre, precio y descripción.</p>
          <p>• Los precios se formatean automáticamente en euros con decimales cuando es necesario.</p>
          <p>• Solo puedes eliminar elementos que no estén siendo utilizados en presupuestos activos.</p>
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