"use client"

import React, { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { Edit, Trash, Loader2, PlusCircle, MoreHorizontal, FileCode } from "lucide-react"
import Link from "next/link"
import { DataTableWithFilters } from "@/components/ui/data-table-with-filters"
import { ContadorSimple } from "@/components/ui/contador-simple"
import { DataTableColumn } from "@/components/ui/data-table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { 
  Dialog,
  DialogContent, 
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog"
import { apiClient } from "@/lib/apiClient"
import { IProveedor, TipoProveedor } from "@/types"

// Definir EstadoProveedor basado en TipoProveedor para DataTableWithFilters
// export type EstadoProveedor = TipoProveedor | 'TODOS'; // Ya no es necesario si usamos ContadorSimple directamente

// Tipo para la ordenación
type SortDirection = "asc" | "desc" | null;
type SortConfig = {
  key: string;
  direction: SortDirection;
};

// Función helper para normalizar texto (minúsculas, sin acentos)
const normalizeText = (text: string): string => {
  if (!text) return '';
  return text
    .toLowerCase()
    .normalize("NFD") // Descomponer caracteres acentuados
    .replace(/[^\w\s]/gi, '') // Eliminar caracteres no alfanuméricos excepto espacios
};

export default function ProveedoresPage() {
  const [proveedores, setProveedores] = useState<IProveedor[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [eliminandoId, setEliminandoId] = useState<string | null>(null)
  const [filtroTipo, setFiltroTipo] = useState<TipoProveedor | null>(null) // Para el ContadorSimple

  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: "nombre",
    direction: "asc"
  });
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  const [isInitialLoadDone, setIsInitialLoadDone] = useState(false);
  const prevSearchTermRef = useRef(searchTerm);

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [proveedorToDelete, setProveedorToDelete] = useState<IProveedor | null>(null);

  const fetchProveedores = async () => {
    setIsLoading(true)
    setError(null); 
    try {
      const response = await apiClient<IProveedor[]>('/api/proveedores');
      setProveedores(response);
    } catch (err: unknown) {
      console.error('Error al cargar proveedores:', err)
      const errorMessage = err instanceof Error ? err.message : "Error al cargar la lista de proveedores";
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
      setIsInitialLoadDone(true); // Asegurarse de que isInitialLoadDone se establece después del fetch inicial
    }
  }

  useEffect(() => {
    let initialPage = 1;
    if (typeof window !== 'undefined') {
      const savedPage = sessionStorage.getItem('proveedoresCurrentPage');
      if (savedPage) {
        try {
          const pageNumber = JSON.parse(savedPage);
          if (typeof pageNumber === 'number' && pageNumber > 0) {
            initialPage = pageNumber;
          } else {
             sessionStorage.removeItem('proveedoresCurrentPage');
          }
        } catch (e) {
           console.error("Error parseando sessionStorage:", e);
           sessionStorage.removeItem('proveedoresCurrentPage');
        }
      }
    }
    setCurrentPage(initialPage);
    fetchProveedores(); // Llamar fetchProveedores directamente aquí
  }, []); // Quitar isInitialLoadDone de las dependencias si fetch se llama solo una vez

  useEffect(() => {
    if (isInitialLoadDone && currentPage > 0 && typeof window !== 'undefined') {
      sessionStorage.setItem('proveedoresCurrentPage', JSON.stringify(currentPage));
    }
  }, [currentPage, isInitialLoadDone]);

   useEffect(() => {
    if (!isInitialLoadDone) return;
    if (searchTerm !== prevSearchTermRef.current) {
       setCurrentPage(1);
       prevSearchTermRef.current = searchTerm;
    }
  }, [searchTerm, isInitialLoadDone]);

  const normalizedSearchTerm = normalizeText(searchTerm);
  const filteredProveedores = proveedores.filter(
    (proveedor) => {
      const matchesSearch = !normalizedSearchTerm || 
        normalizeText(proveedor.nombre).includes(normalizedSearchTerm) ||
        normalizeText(proveedor.nif || '').includes(normalizedSearchTerm) ||
        normalizeText(proveedor.email || '').includes(normalizedSearchTerm);
      
      const matchesTipo = filtroTipo === null || proveedor.tipo === filtroTipo;
      
      return matchesSearch && matchesTipo;
    }
  );

  const sortedProveedores = [...filteredProveedores].sort((a, b) => {
    if (!sortConfig.key || !sortConfig.direction) return 0;

    type SortableValue = string | number | boolean | TipoProveedor | null | undefined;
    const key = sortConfig.key as keyof IProveedor;

    let valA: SortableValue = a[key] as SortableValue;
    let valB: SortableValue = b[key] as SortableValue;

    if (key === 'nif') {
        valA = String(valA || '');
        valB = String(valB || '');
    }
    
    if (valA === null || valA === undefined) return 1;
    if (valB === null || valB === undefined) return -1;

    if (typeof valA === 'number' && typeof valB === 'number') {
      return sortConfig.direction === 'asc' ? valA - valB : valB - valA;
    }
    if (typeof valA === 'string' && typeof valB === 'string') {
      return sortConfig.direction === 'asc' 
        ? valA.localeCompare(valB) 
        : valB.localeCompare(valA);
    }
    if (typeof valA === 'boolean' && typeof valB === 'boolean') {
        return sortConfig.direction === 'asc' 
        ? (valA === valB ? 0 : valA ? -1 : 1) 
        : (valA === valB ? 0 : valA ? 1 : -1); 
    }
    return sortConfig.direction === 'asc' 
      ? String(valA).localeCompare(String(valB))
      : String(valB).localeCompare(String(valA));
  });

  const pageCount = Math.ceil(sortedProveedores.length / itemsPerPage) || 1;
  const correctedCurrentPage = Math.min(currentPage, pageCount);
  const pageIndex = Math.max(0, correctedCurrentPage - 1);
  const startIndex = pageIndex * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const dataForCurrentPage = sortedProveedores.slice(startIndex, endIndex);

  useEffect(() => {
    if (!isLoading && currentPage !== correctedCurrentPage && correctedCurrentPage > 0) {
      const timer = setTimeout(() => setCurrentPage(correctedCurrentPage), 0);
      return () => clearTimeout(timer);
    }
  }, [currentPage, correctedCurrentPage, isLoading]);

  const handleTableChange = (pagination: { pageIndex: number; pageSize: number }, sort?: SortConfig) => {
    const newPage = pagination.pageIndex + 1;
    setCurrentPage(newPage);
    if (sort) {
      setSortConfig(sort);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const getProveedorTipo = (proveedor: IProveedor): TipoProveedor => proveedor.tipo;

  const handleDeleteProveedor = async () => {
    if (!proveedorToDelete) return;
    try {
      setEliminandoId(proveedorToDelete.id);
      await apiClient(`/api/proveedores/${proveedorToDelete.id}`, { method: "DELETE" });
      setProveedores(prev => prev.filter(p => p.id !== proveedorToDelete!.id));
      toast.success("Proveedor eliminado correctamente");
      setShowDeleteDialog(false);
      setProveedorToDelete(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al eliminar";
      toast.error(msg);
      console.error("Error eliminando proveedor:", err);
    } finally {
      setEliminandoId(null);
    }
  };

  // Componente personalizado para mostrar el contador de proveedores
  const ProveedoresCounter = () => (
    <div className="mb-4">
      <h2 className="text-sm font-medium text-gray-500 mb-2">Distribución de proveedores</h2>
      <ContadorSimple<IProveedor, TipoProveedor>
        items={proveedores} // Usar todos los proveedores para el contador
        tipo="proveedor"
        getEstadoFn={getProveedorTipo}
      />
    </div>
  );

  const columns: DataTableColumn<IProveedor>[] = [
    { 
      key: "nombre",
      header: "Nombre",
      sortable: true,
      minWidth: "180px",
      width: "25%",
      cell: (proveedor: IProveedor) => (
        <Link href={`/proveedores/${proveedor.id}`} className="hover:underline font-medium">
          {proveedor.nombre}
        </Link>
      ),
    },
    { 
      key: "nif", 
      header: "NIF/CIF", 
      sortable: true,
      width: "15%",
      minWidth: "120px",
      cell: (item: IProveedor) => <div>{item.nif || "—"}</div>, 
    },
    { 
      key: "email", 
      header: "Email", 
      sortable: true,
      width: "20%",
      minWidth: "150px",
      cell: (item: IProveedor) => item.email ? <a href={`mailto:${item.email}`} className="hover:underline">{item.email}</a> : "—",
    },
    { 
      key: "telefono", 
      header: "Teléfono", 
      sortable: true,
      width: "15%",
      minWidth: "120px",
      cell: (item: IProveedor) => <div>{item.telefono || "—"}</div>, 
    },
    { 
      key: "tipo", 
      header: "Tipo", 
      sortable: true,
      width: "10%",
      minWidth: "100px",
      cell: (item: IProveedor) => (
        <span className={`px-2 py-1 rounded-full text-xs ${ // Estilos condicionales para tipo
          item.tipo === TipoProveedor.BIENES 
            ? "bg-blue-100 text-blue-800" 
            : item.tipo === TipoProveedor.SERVICIOS
            ? "bg-green-100 text-green-800"
            : "bg-purple-100 text-purple-800" // Para MIXTO
        }`}>
          {item.tipo}
        </span>
      ), 
    },
    {
      key: "actions",
      header: "Acciones",
      width: "15%",
      minWidth: "110px",
      cell: (proveedor: IProveedor) => (
        <div className="flex justify-end gap-1"> {/* Reducido gap para acomodar botón directo */}
          <Button variant="ghost" size="icon" asChild className="h-8 w-8">
            <Link href={`/proveedores/editar/${proveedor.id}`}> 
              <Edit className="h-4 w-4" />
            </Link>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem 
                onClick={() => { setProveedorToDelete(proveedor); setShowDeleteDialog(true); }}
                disabled={eliminandoId === proveedor.id}
                className="text-red-600 flex items-center gap-2"
              >
                <Trash className="h-4 w-4" /> 
                <span>{eliminandoId === proveedor.id ? "Eliminando..." : "Eliminar"}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ];

  if (isLoading && proveedores.length === 0) {
    return (
      <div className="py-10 flex justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
          <p className="mt-2">Cargando proveedores...</p>
        </div>
      </div>
    );
  }

  if (error && proveedores.length === 0) {
    return (
      <div className="py-10">
        <div className="p-4 mb-4 text-red-800 rounded-lg bg-red-50">
          <p>{error}</p>
          <Button onClick={fetchProveedores} className="mt-4">
            Intentar de nuevo
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="py-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Proveedores</h1>
        <div className="flex gap-2">
          <Button 
            variant="outline"
            onClick={() => toast.info("Importar/Exportar para proveedores aún no implementado.")}
          >
            <FileCode className="mr-2 h-4 w-4" /> 
            Importar / Exportar
          </Button>
          <Link href="/proveedores/nuevo">
            <Button variant="default">
              <PlusCircle className="mr-2 h-4 w-4" /> Nuevo Proveedor
            </Button>
          </Link>
        </div>
      </div>

      {!isLoading && proveedores.length > 0 && <ProveedoresCounter />}

      <DataTableWithFilters<IProveedor, TipoProveedor>
        columns={columns}
        data={dataForCurrentPage}
        allFilteredData={sortedProveedores}
        allData={proveedores}
        filteredItemsCount={sortedProveedores.length}
        isLoading={isLoading}
        error={error}
        pageIndex={pageIndex}
        pageSize={itemsPerPage}
        pageCount={pageCount}
        onPaginationChange={handleTableChange}
        searchTerm={searchTerm}
        onSearchChange={handleSearchChange}
        sortConfig={sortConfig}
        tipo="proveedor"
        filtroEstado={filtroTipo} 
        setFiltroEstado={setFiltroTipo}
        getEstadoFn={getProveedorTipo}
        showContador={false}
        searchPlaceholder="Buscar por nombre, NIF, email..."
        emptyMessage="No hay proveedores registrados aún."
        searchEmptyMessage="No se encontraron proveedores que coincidan con tu búsqueda."
      />

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Eliminar proveedor?</DialogTitle>
            <DialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente el proveedor 
              <span className="font-medium"> {proveedorToDelete?.nombre}</span> y todos sus datos.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:justify-start"> {/* Sin mt-4 */}
            <Button
              type="button"
              variant="destructive"
              onClick={handleDeleteProveedor}
              disabled={!!eliminandoId}
            >
              {eliminandoId ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Eliminando...</>
              ) : (
                <><Trash className="mr-2 h-4 w-4" /> Eliminar</>
              )}
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setShowDeleteDialog(false)}
              disabled={!!eliminandoId}
            >
              Cancelar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 