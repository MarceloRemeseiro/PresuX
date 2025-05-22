"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { Edit, Trash, Loader2, PlusCircle, MoreHorizontal, FileCode } from "lucide-react"
import Link from "next/link"
// import { useRouter } from "next/navigation" // Eliminado
import { DataTableWithFilters, EstadoCliente } from "@/components/ui/data-table-with-filters"
import { ContadorSimple } from "@/components/ui/contador-simple"
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
import { ImportExportDialog } from '@/components/clientes/ImportExportDialog'
import { apiClient } from "@/lib/apiClient"
import { ICliente } from "@/types"

// Tipo para la respuesta paginada de la API
// interface ClientesApiResponse { // Eliminada ya que no se usa
//   clientes: ICliente[];
//   total: number;
//   pagina: number;
//   limite: number;
// }

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

export default function ClientesPage() {
  // const router = useRouter() // Eliminado ya que no se usa
  const [clientes, setClientes] = useState<ICliente[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [eliminandoId, setEliminandoId] = useState<string | null>(null)
  // Estado para el filtro de tipo de cliente (null significa sin filtro)
  const [filtroTipo, setFiltroTipo] = useState<EstadoCliente | null>(null)

  // --- Estados para Ordenación y Paginación ---
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: "nombre", // Por defecto ordenar por nombre
    direction: "asc" // Ascendente
  });
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  const [isInitialLoadDone, setIsInitialLoadDone] = useState(false);
  const prevSearchTermRef = useRef(searchTerm);

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [clienteToDelete, setClienteToDelete] = useState<ICliente | null>(null);

  const fetchClientes = async () => {
    setIsLoading(true)
    setError(null); 
    try {
      const response = await apiClient<ICliente[]>('/api/clientes');
      setClientes(response);
    } catch (err: unknown) {
      console.error('Error al cargar clientes:', err)
      const errorMessage = err instanceof Error ? err.message : "Error al cargar la lista de clientes";
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  // 1. LEER PÁGINA AL MONTAR
  useEffect(() => {
    let initialPage = 1;
    if (typeof window !== 'undefined') {
      const savedPage = sessionStorage.getItem('clientesCurrentPage');
      if (savedPage) {
        try {
          const pageNumber = JSON.parse(savedPage);
          if (typeof pageNumber === 'number' && pageNumber > 0) {
            initialPage = pageNumber;
          } else {
             sessionStorage.removeItem('clientesCurrentPage');
          }
        } catch (e) {
           console.error("Error parseando sessionStorage:", e);
           sessionStorage.removeItem('clientesCurrentPage');
        }
      }
    }
    setCurrentPage(initialPage);
    setIsInitialLoadDone(true);
  }, []);

  // 2. GUARDAR PÁGINA AL CAMBIAR
  useEffect(() => {
    if (isInitialLoadDone && currentPage > 0 && typeof window !== 'undefined') {
      sessionStorage.setItem('clientesCurrentPage', JSON.stringify(currentPage));
    }
  }, [currentPage, isInitialLoadDone]);

  // 3. EFECTO PARA BÚSQUEDA (CON RESET DE PÁGINA SI CAMBIA)
   useEffect(() => {
    if (!isInitialLoadDone) return; // Esperar carga inicial

    if (searchTerm !== prevSearchTermRef.current) {
       setCurrentPage(1);
       prevSearchTermRef.current = searchTerm;
    }
  }, [searchTerm, isInitialLoadDone]);

  // 4. EFECTO PARA FETCH INICIAL
  useEffect(() => {
    if (isInitialLoadDone) {
      fetchClientes();
    }
  }, [isInitialLoadDone]);


  // Filtrar clientes basados en el término de búsqueda normalizado y el tipo de cliente
  const normalizedSearchTerm = normalizeText(searchTerm);
  const filteredClientes = clientes.filter(
    (cliente) => {
      // Primero filtrar por término de búsqueda
      const matchesSearch = !normalizedSearchTerm || 
        normalizeText(cliente.nombre).includes(normalizedSearchTerm) ||
        normalizeText(cliente.nif || '').includes(normalizedSearchTerm) ||
        normalizeText(cliente.email || '').includes(normalizedSearchTerm);
      
      // Luego filtrar por tipo si hay filtro activo
      const matchesTipo = filtroTipo === null || cliente.tipo === filtroTipo;
      
      return matchesSearch && matchesTipo;
    }
  );

  // Función para ordenar los datos
  const sortedClientes = [...filteredClientes].sort((a, b) => {
    if (!sortConfig.key || !sortConfig.direction) return 0;
    
    let aValue: string | number | null | undefined | boolean, bValue: string | number | null | undefined | boolean;
    
    switch (sortConfig.key) {
      case 'nombre':
        aValue = a.nombre;
        bValue = b.nombre;
        break;
      case 'nif':
        aValue = a.nif;
        bValue = b.nif;
        break;
      case 'email':
        aValue = a.email;
        bValue = b.email;
        break;
      case 'telefono':
        aValue = a.telefono;
        bValue = b.telefono;
        break;
      case 'tipo':
        aValue = a.tipo;
        bValue = b.tipo;
        break;
      default:
        aValue = null;
        bValue = null;
    }

    if (aValue === null || aValue === undefined) return 1;
    if (bValue === null || bValue === undefined) return -1;

    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
    }
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortConfig.direction === 'asc' 
        ? aValue.localeCompare(bValue) 
        : bValue.localeCompare(aValue);
    }
    return sortConfig.direction === 'asc' 
      ? String(aValue).localeCompare(String(bValue))
      : String(bValue).localeCompare(String(aValue));
  });

  // 5. CÁLCULO PAGINACIÓN FRONTEND
  const pageCount = Math.ceil(sortedClientes.length / itemsPerPage) || 1;
  const correctedCurrentPage = Math.min(currentPage, pageCount);
  const pageIndex = Math.max(0, correctedCurrentPage - 1);
  const startIndex = pageIndex * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const dataForCurrentPage = sortedClientes.slice(startIndex, endIndex);

  // 6. EFECTO DE CORRECCIÓN DE PÁGINA
  useEffect(() => {
    if (!isLoading && currentPage !== correctedCurrentPage && correctedCurrentPage > 0) {
      const timer = setTimeout(() => setCurrentPage(correctedCurrentPage), 0);
      return () => clearTimeout(timer);
    }
  }, [currentPage, correctedCurrentPage, isLoading]);

  // 7. HANDLER PAGINACIÓN Y ORDENACIÓN DATATABLE
  const handleTableChange = (pagination: { pageIndex: number; pageSize: number }, sort?: SortConfig) => {
    const newPage = pagination.pageIndex + 1;
    setCurrentPage(newPage);
    
    // Si hay una nueva configuración de ordenación, actualizar el estado
    if (sort) {
      setSortConfig(sort);
    }
  };

  // 8. HANDLE SEARCH CHANGE
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  // Función para obtener el tipo del cliente (para el contador de estados)
  const getClienteTipo = (cliente: ICliente): EstadoCliente => cliente.tipo as EstadoCliente;

  // Función para eliminar cliente
  const handleDeleteCliente = async () => {
    if (!clienteToDelete) return;
    
    try {
      setEliminandoId(clienteToDelete.id);
      await apiClient(`/api/clientes/${clienteToDelete.id}`, { method: "DELETE" });
      setClientes(clientes.filter(cliente => cliente.id !== clienteToDelete.id));
      toast.success("Cliente eliminado correctamente");
      setShowDeleteDialog(false);
      setClienteToDelete(null);
    } catch (error: unknown) {
      console.error("Error:", error);
      const errorMessage = error instanceof Error ? error.message : "Error al eliminar el cliente";
      toast.error(errorMessage);
    } finally {
      setEliminandoId(null);
    }
  };

  // Componente personalizado para mostrar el contador de clientes
  const ClientesCounter = () => (
    <div className="mb-4">
      <h2 className="text-sm font-medium text-gray-500 mb-2">Distribución de clientes</h2>
      <ContadorSimple
        items={clientes}
        tipo="cliente"
        getEstadoFn={getClienteTipo}
      />
    </div>
  );

  // Definir las columnas para la tabla
  const columns = [
    {
      key: "nombre",
      header: "Nombre",
      sortable: true,
      minWidth: "180px", // Ancho mínimo para evitar saltos
      width: "25%", // Porcentaje para mantener proporcional
      cell: (cliente: ICliente) => (
        <Link 
          href={`/clientes/${cliente.id}`} 
          className="hover:underline font-medium"
        >
          {cliente.nombre}
        </Link>
      )
    },
    {
      key: "nif",
      header: "CIF/NIF",
      sortable: true,
      width: "15%",
      minWidth: "120px",
      cell: (cliente: ICliente) => <div>{cliente.nif || "—"}</div>
    },
    {
      key: "email",
      header: "Email",
      sortable: true,
      width: "20%",
      minWidth: "150px",
      cell: (cliente: ICliente) => <div>{cliente.email || "—"}</div>
    },
    {
      key: "telefono",
      header: "Teléfono",
      sortable: true,
      width: "15%",
      minWidth: "120px",
      cell: (cliente: ICliente) => <div>{cliente.telefono || "—"}</div>
    },
    {
      key: "tipo",
      header: "Tipo",
      sortable: true,
      width: "10%",
      minWidth: "100px",
      cell: (cliente: ICliente) => (
        <span className={`px-2 py-1 rounded-full text-xs ${
          cliente.tipo === "EMPRESA" 
            ? "bg-blue-100 text-blue-800" 
            : cliente.tipo === "AUTONOMO"
            ? "bg-yellow-100 text-yellow-800"
            : "bg-green-100 text-green-800"
        }`}>
          {cliente.tipo}
        </span>
      )
    },
    {
      key: "actions",
      header: "Acciones",
      width: "15%", 
      minWidth: "110px",
      cell: (cliente: ICliente) => (
        <div className="flex justify-end gap-2">
          <Button 
            variant="ghost" 
            size="icon"
            asChild
          >
            <Link href={`/clientes/editar/${cliente.id}`}>
              <Edit className="h-4 w-4" />
            </Link>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem 
                onClick={() => {
                  setClienteToDelete(cliente);
                  setShowDeleteDialog(true);
                }}
                disabled={eliminandoId === cliente.id}
                className="text-red-600 flex items-center gap-2"
              >
                <Trash className="h-4 w-4" />
                <span>{eliminandoId === cliente.id ? "Eliminando..." : "Eliminar"}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )
    }
  ]

  if (isLoading && clientes.length === 0) {
    return (
      <div className="py-10 flex justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
          <p className="mt-2">Cargando clientes...</p>
        </div>
      </div>
    )
  }

  if (error && clientes.length === 0) {
    return (
      <div className="py-10">
        <div className="p-4 mb-4 text-red-800 rounded-lg bg-red-50">
          <p>{error}</p>
          <Button onClick={fetchClientes} className="mt-4">
            Intentar de nuevo
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="py-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Clientes</h1>
        <div className="flex gap-2">
        <ImportExportDialog
            trigger={
              <Button variant="outline">
                <FileCode className="mr-2 h-4 w-4" /> 
                Importar / Exportar
              </Button>
            }
            onImportSuccess={fetchClientes}
          />
          <Button asChild>
            <Link href="/clientes/nuevo">
              <PlusCircle className="mr-2 h-4 w-4" />
              Nuevo Cliente
            </Link>
          </Button>
          
        </div>
      </div>

      {!isLoading && clientes.length > 0 && <ClientesCounter />}

      <DataTableWithFilters
        // Datos generales
        data={dataForCurrentPage}
        allFilteredData={filteredClientes}
        allData={clientes}
        columns={columns}
        filteredItemsCount={filteredClientes.length}
        
        // Búsqueda
        searchTerm={searchTerm}
        onSearchChange={handleSearchChange}
        searchPlaceholder="Buscar por nombre, NIF o email..."
        
        // Filtro de estado - Ocultar el filtro de estado
        tipo="cliente"
        filtroEstado={filtroTipo}
        setFiltroEstado={setFiltroTipo}
        getEstadoFn={getClienteTipo}
        showContador={false} // Ocultamos el contador con filtros
        
        // Paginación y Ordenación
        pageIndex={pageIndex}
        pageSize={itemsPerPage}
        pageCount={pageCount}
        onPaginationChange={handleTableChange}
        sortConfig={sortConfig}
        
        // Estados de carga
        isLoading={isLoading}
        error={error}
        
        // Mensajes
        emptyMessage="No hay clientes registrados aún"
        searchEmptyMessage="No se encontraron clientes que coincidan con tu búsqueda"
      />
      
      {/* Diálogo de confirmación para eliminar */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Eliminar cliente?</DialogTitle>
            <DialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente el cliente
              <span className="font-medium"> {clienteToDelete?.nombre}</span> y todos sus datos.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:justify-start">
            <Button
              type="button"
              variant="destructive"
              onClick={handleDeleteCliente}
              disabled={eliminandoId !== null}
            >
              {eliminandoId ? (
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
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setShowDeleteDialog(false)}
              disabled={eliminandoId !== null}
            >
              Cancelar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 