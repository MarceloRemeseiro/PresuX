"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { toast } from "sonner"
import { Edit, Trash, Loader2, PlusCircle } from "lucide-react"
import Link from "next/link"
import { DataTableWithFilters } from "@/components/ui/data-table-with-filters"
import { 
  Dialog,
  DialogContent, 
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog"
import { apiClient } from "@/lib/apiClient"
import { IPersonal, IPersonalConPuestos } from "@/types/personal"
import { Contador } from "@/components/ui/contador"

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

export default function PersonalPage() {
  const [personal, setPersonal] = useState<IPersonalConPuestos[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [eliminandoId, setEliminandoId] = useState<string | null>(null)
  
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
  const [personalToDelete, setPersonalToDelete] = useState<IPersonalConPuestos | null>(null);

  // Estado para filtro de puesto activo (para el contador)
  const [filtroPuestoActivo, setFiltroPuestoActivo] = useState<string | null>(null)

  const fetchPersonal = async () => {
    setIsLoading(true)
    setError(null); 
    try {
      // Cargar lista básica de personal
      const personalBasico = await apiClient<IPersonal[]>('/api/personal');
      
      // Para cada personal, cargar sus puestos
      const personalConPuestos: IPersonalConPuestos[] = await Promise.all(
        personalBasico.map(async (persona) => {
          try {
            const personalConPuestosData = await apiClient<IPersonalConPuestos>(`/api/personal/${persona.id}/puestos`);
            return personalConPuestosData;
          } catch (error) {
            // Si falla cargar puestos, devolver el personal sin puestos
            console.warn(`Error al cargar puestos para ${persona.nombre}:`, error);
            return {
              ...persona,
              puestos_trabajo: []
            } as IPersonalConPuestos;
          }
        })
      );
      
      setPersonal(personalConPuestos);
      
    } catch (err: unknown) {
      console.error('Error al cargar personal:', err)
      const errorMessage = err instanceof Error ? err.message : "Error al cargar la lista de personal";
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
      const savedPage = sessionStorage.getItem('personalCurrentPage');
      if (savedPage) {
        try {
          const pageNumber = JSON.parse(savedPage);
          if (typeof pageNumber === 'number' && pageNumber > 0) {
            initialPage = pageNumber;
          } else {
             sessionStorage.removeItem('personalCurrentPage');
          }
        } catch (e) {
           console.error("Error parseando sessionStorage:", e);
           sessionStorage.removeItem('personalCurrentPage');
        }
      }
    }
    setCurrentPage(initialPage);
    setIsInitialLoadDone(true);
  }, []);

  // 2. GUARDAR PÁGINA AL CAMBIAR
  useEffect(() => {
    if (isInitialLoadDone && currentPage > 0 && typeof window !== 'undefined') {
      sessionStorage.setItem('personalCurrentPage', JSON.stringify(currentPage));
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
      fetchPersonal();
    }
  }, [isInitialLoadDone]);

  // Filtrar personal basados en el término de búsqueda normalizado y filtros de puestos
  const normalizedSearchTerm = normalizeText(searchTerm);
  const filteredPersonal = personal.filter(
    (persona) => {
      // Filtro por búsqueda
      const matchesSearch = !normalizedSearchTerm || 
        normalizeText(persona.nombre).includes(normalizedSearchTerm) ||
        normalizeText(persona.apellidos || '').includes(normalizedSearchTerm) ||
        normalizeText(persona.dni_nif || '').includes(normalizedSearchTerm) ||
        normalizeText(persona.email || '').includes(normalizedSearchTerm) ||
        // Buscar también en nombres de puestos
        persona.puestos_trabajo?.some(puesto => 
          normalizeText(puesto.nombre_puesto).includes(normalizedSearchTerm)
        );
      
      // Filtro por puestos del contador
      const matchesPuestoContador = !filtroPuestoActivo || 
        persona.puestos_trabajo?.some(puesto => 
          puesto.nombre_puesto === filtroPuestoActivo
        ) ||
        (filtroPuestoActivo === "Sin puesto" && (!persona.puestos_trabajo || persona.puestos_trabajo.length === 0));
      
      return matchesSearch && matchesPuestoContador;
    }
  );

  // Función para ordenar los datos
  const sortedPersonal = [...filteredPersonal].sort((a, b) => {
    if (!sortConfig.key || !sortConfig.direction) return 0;
    
    let aValue: string | number | null | undefined, bValue: string | number | null | undefined;
    
    switch (sortConfig.key) {
      case 'nombre':
        aValue = a.nombre;
        bValue = b.nombre;
        break;
      case 'apellidos':
        aValue = a.apellidos;
        bValue = b.apellidos;
        break;
      case 'dni_nif':
        aValue = a.dni_nif;
        bValue = b.dni_nif;
        break;
      case 'email':
        aValue = a.email;
        bValue = b.email;
        break;
      case 'telefono':
        aValue = a.telefono;
        bValue = b.telefono;
        break;
      default:
        aValue = null;
        bValue = null;
    }

    if (aValue === null || aValue === undefined) return 1;
    if (bValue === null || bValue === undefined) return -1;

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
  const pageCount = Math.ceil(sortedPersonal.length / itemsPerPage) || 1;
  const correctedCurrentPage = Math.min(currentPage, pageCount);
  const pageIndex = Math.max(0, correctedCurrentPage - 1);
  const startIndex = pageIndex * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const dataForCurrentPage = sortedPersonal.slice(startIndex, endIndex);

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
    setSearchTerm(e.target.value)
  }

  // Función para obtener el puesto de una persona (para el contador)
  const getPuestoPersona = (persona: IPersonalConPuestos): string => {
    if (persona.puestos_trabajo && persona.puestos_trabajo.length > 0) {
      return persona.puestos_trabajo[0].nombre_puesto;
    }
    return "Sin puesto";
  }

  // Función para eliminar personal
  const handleDeletePersonal = async () => {
    if (!personalToDelete) return;
    
    try {
      setEliminandoId(personalToDelete.id);
      await apiClient(`/api/personal/${personalToDelete.id}`, { method: "DELETE" });
      setPersonal(personal.filter(persona => persona.id !== personalToDelete.id));
      toast.success("Personal eliminado correctamente");
      setShowDeleteDialog(false);
      setPersonalToDelete(null);
    } catch (error: unknown) {
      console.error("Error:", error);
      const errorMessage = error instanceof Error ? error.message : "Error al eliminar el personal";
      toast.error(errorMessage);
    } finally {
      setEliminandoId(null);
    }
  };

  // Definir las columnas para la tabla
  const columns = [
    {
      key: "nombre",
      header: "Nombre",
      sortable: true,
      minWidth: "180px",
      width: "25%",
      cell: (persona: IPersonalConPuestos) => (
        <div className="font-medium">
          {persona.nombre} {persona.apellidos || ''}
        </div>
      )
    },
    {
      key: "puestos",
      header: "Puestos",
      sortable: false,
      width: "30%",
      minWidth: "200px",
      cell: (persona: IPersonalConPuestos) => (
        <div className="flex flex-wrap gap-1">
          {persona.puestos_trabajo && persona.puestos_trabajo.length > 0 ? (
            persona.puestos_trabajo.map((puesto) => (
              <Badge 
                key={puesto.puesto_trabajo_id} 
                variant="secondary"
                className="text-xs cursor-pointer hover:bg-gray-200"
                title={`Tarifa: ${puesto.tarifa_por_dia ? `${puesto.tarifa_por_dia}€/día` : 'Sin tarifa'} - Click para filtrar`}
                onClick={() => setFiltroPuestoActivo(puesto.nombre_puesto)}
              >
                {puesto.nombre_puesto}
              </Badge>
            ))
          ) : (
            <Badge 
              variant="outline"
              className="text-xs cursor-pointer hover:bg-gray-100"
              onClick={() => setFiltroPuestoActivo("Sin puesto")}
            >
              Sin puestos
            </Badge>
          )}
        </div>
      )
    },
    {
      key: "email",
      header: "Email",
      sortable: true,
      width: "20%",
      minWidth: "150px",
      cell: (persona: IPersonalConPuestos) => <div>{persona.email || "—"}</div>
    },
    {
      key: "telefono",
      header: "Teléfono",
      sortable: true,
      width: "15%",
      minWidth: "120px",
      cell: (persona: IPersonalConPuestos) => <div>{persona.telefono || "—"}</div>
    },
    {
      key: "actions",
      header: "Acciones",
      width: "15%", 
      minWidth: "120px",
      cell: (persona: IPersonalConPuestos) => (
        <div className="flex justify-end gap-2">
          <Button 
            variant="ghost" 
            size="sm"
            asChild
            title="Editar"
          >
            <Link href={`/personal/editar/${persona.id}`}>
              <Edit className="h-4 w-4 mr-1" />
              Editar
            </Link>
          </Button>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => {
              setPersonalToDelete(persona);
              setShowDeleteDialog(true);
            }}
            disabled={eliminandoId === persona.id}
            title="Eliminar"
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Trash className="h-4 w-4 mr-1" />
            {eliminandoId === persona.id ? "..." : "Eliminar"}
          </Button>
        </div>
      )
    }
  ]

  // Componente personalizado para mostrar el contador de personal por puestos
  const PersonalCounter = () => (
    <div className="mb-4">
      <h2 className="text-sm font-medium text-gray-500 mb-2">Distribución por puestos</h2>
      <Contador
        items={personal}
        tipo="personal"
        onFilterChange={setFiltroPuestoActivo}
        estadoActivo={filtroPuestoActivo}
        getEstadoFn={getPuestoPersona}
      />
    </div>
  );

  if (isLoading && personal.length === 0) {
    return (
      <div className="py-10 flex justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
          <p className="mt-2">Cargando personal...</p>
        </div>
      </div>
    )
  }

  if (error && personal.length === 0) {
    return (
      <div className="py-10">
        <div className="p-4 mb-4 text-red-800 rounded-lg bg-red-50">
          <p>{error}</p>
          <Button onClick={fetchPersonal} className="mt-4">
            Intentar de nuevo
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="py-10">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Personal</h1>
          <p className="text-gray-600 mt-1">Gestiona tu equipo y asigna puestos de trabajo</p>
        </div>
        <Button asChild>
          <Link href="/personal/crear">
            <PlusCircle className="mr-2 h-4 w-4" />
            Nuevo Personal
          </Link>
        </Button>
      </div>

      {!isLoading && personal.length > 0 && <PersonalCounter />}

      <DataTableWithFilters
        // Datos generales
        data={dataForCurrentPage}
        allFilteredData={filteredPersonal}
        allData={personal}
        columns={columns}
        filteredItemsCount={filteredPersonal.length}
        
        // Búsqueda
        searchTerm={searchTerm}
        onSearchChange={handleSearchChange}
        searchPlaceholder="Buscar por nombre, email o puesto..."
        
        // Configurar contador para personal
        tipo="personal"
        filtroEstado={filtroPuestoActivo}
        setFiltroEstado={setFiltroPuestoActivo}
        getEstadoFn={getPuestoPersona}
        showContador={false}
        
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
        emptyMessage="No hay personal registrado aún"
        searchEmptyMessage="No se encontró personal que coincida con tu búsqueda"
      />
      
      {/* Diálogo de confirmación para eliminar */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Eliminar personal?</DialogTitle>
            <DialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente a
              <span className="font-medium"> {personalToDelete?.nombre} {personalToDelete?.apellidos}</span> y todos sus datos.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:justify-start">
            <Button
              type="button"
              variant="destructive"
              onClick={handleDeletePersonal}
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