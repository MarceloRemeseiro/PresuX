"use client"

import { Search, Loader2, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DataTable, DataTableColumn } from "@/components/ui/data-table"
import { Contador, EstadoCliente, EstadoProveedor } from "@/components/ui/contador"
import { Card, CardContent } from "@/components/ui/card"

// El tipo EstadoType debe abarcar todos los posibles estados que maneje Contador.
// Por ahora, nos centramos en Cliente.
export type EstadoGenerico = EstadoCliente | EstadoProveedor | string | null;

// Tipo para la ordenación
export type SortDirection = "asc" | "desc" | null;
export type SortConfig = {
  key: string;
  direction: SortDirection;
};

// Re-exportamos los tipos de estado específicos para quien use este componente
export type { EstadoCliente, EstadoProveedor };

// S ahora es el tipo de estado REAL de un item, no puede ser null.
// El filtro activo sí puede ser S | null.
interface DataTableWithFiltersProps<T extends Record<string, unknown>, S extends Exclude<EstadoGenerico, null>> {
  // Datos y configuración
  columns: DataTableColumn<T>[];
  data: T[];
  allFilteredData?: T[];
  allData?: T[];
  filteredItemsCount: number;
  
  // Búsqueda
  searchTerm: string;
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  searchPlaceholder?: string;
  
  // Filtros de estado (Contador)
  tipo: "factura" | "presupuesto" | "gasto" | "cliente" | "categoria" | "proveedor" | "producto" | "personal";
  filtroEstado: S | null; // El filtro activo puede ser S o null (todos)
  setFiltroEstado: (estado: S | null) => void;
  getEstadoFn?: (item: T) => S; // Esta función debe devolver un estado válido S, no null
  showContador?: boolean;
  soloConteo?: boolean;
  
  // Filtros de puestos (opcional, para personal)
  puestosDisponibles?: {id: string, nombre: string}[];
  filtrosPuestos?: string[];
  onFiltrosPuestosChange?: (filtros: string[]) => void;
  
  // Ordenación
  sortConfig?: SortConfig;     // Configuración de ordenación actual
  
  // Paginación (controlada por el componente padre)
  pageIndex: number;    // 0-indexed
  pageSize: number;
  pageCount: number;    // Total de páginas
  onPaginationChange: (pagination: { pageIndex: number; pageSize: number }, sort?: SortConfig) => void;
  
  // Estados de Carga y Error
  isLoading?: boolean;
  error?: string | null;
  
  // Mensajes Personalizables
  emptyMessage?: string;
  searchEmptyMessage?: string;
  errorMessage?: string;
}

export function DataTableWithFilters<T extends Record<string, unknown>, S extends Exclude<EstadoGenerico, null>>({
  columns,
  data, // Estos son los datos ya paginados para la tabla
  allFilteredData, // Estos son todos los datos filtrados para el contador
  allData, // Todos los datos sin filtrar para mostrar totales reales
  filteredItemsCount, // Este es el total de items después de búsqueda Y filtro de tipo
  
  searchTerm,
  onSearchChange,
  searchPlaceholder = "Buscar...",
  
  tipo,
  filtroEstado,
  setFiltroEstado,
  getEstadoFn,
  showContador = true,
  soloConteo = false,
  
  puestosDisponibles,
  filtrosPuestos,
  onFiltrosPuestosChange,
  
  sortConfig,
  
  pageIndex,
  pageSize,
  pageCount,
  onPaginationChange,
  
  isLoading = false,
  error = null,
  
  emptyMessage = "No hay datos disponibles",
  searchEmptyMessage = "No se encontraron resultados",
  errorMessage = "Error al cargar los datos"
}: DataTableWithFiltersProps<T, S>) {
  
  // Siempre usamos allData para los conteos del contador si está disponible,
  // para asegurarnos que los conteos muestran los totales reales
  const dataForContador = allData || allFilteredData || data;

  // Manejar cambios de ordenación y paginación
  const handleTableChange = (
    pagination: { pageIndex: number; pageSize: number },
    newSortConfig?: SortConfig
  ) => {
    onPaginationChange(pagination, newSortConfig);
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row items-center gap-4 mb-4 mt-4">
          <div className="flex items-center flex-1 w-full md:w-auto">
            <Search className="h-4 w-4 mr-2 opacity-50 shrink-0" />
            <Input
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={onSearchChange}
              className="w-full"
            />
          </div>
          
          {showContador && getEstadoFn && (
            <Contador 
              items={dataForContador} // Usamos dataForContador que contiene todos los datos sin filtrar
              tipo={tipo}
              onFilterChange={setFiltroEstado}
              estadoActivo={filtroEstado}
              getEstadoFn={getEstadoFn}
              soloConteo={soloConteo}
            />
          )}
        </div>
        
        {/* Filtros de puestos */}
        {puestosDisponibles && puestosDisponibles.length > 0 && onFiltrosPuestosChange && (
          <div className="mb-4">
            <div className="flex flex-wrap gap-2">
              <span className="text-sm font-medium text-gray-700 py-1">Filtrar por puestos:</span>
              {puestosDisponibles.map((puesto) => (
                <Badge
                  key={puesto.id}
                  variant={filtrosPuestos?.includes(puesto.id) ? "default" : "outline"}
                  className="cursor-pointer hover:bg-gray-100"
                  onClick={() => {
                    const nuevosFiltros = filtrosPuestos?.includes(puesto.id)
                      ? filtrosPuestos.filter(id => id !== puesto.id)
                      : [...(filtrosPuestos || []), puesto.id];
                    onFiltrosPuestosChange(nuevosFiltros);
                  }}
                >
                  {puesto.nombre}
                  {filtrosPuestos?.includes(puesto.id) && (
                    <X className="h-3 w-3 ml-1" />
                  )}
                </Badge>
              ))}
              {filtrosPuestos && filtrosPuestos.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onFiltrosPuestosChange([])}
                  className="text-xs h-6"
                >
                  Limpiar filtros
                </Button>
              )}
            </div>
          </div>
        )}
        
        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin opacity-70" />
            <p className="ml-2">Cargando...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 text-red-700 p-4 rounded-md border border-red-200">
            <p className="font-semibold">Error</p>
            <p>{errorMessage || error}</p>
          </div>
        ) : filteredItemsCount === 0 ? ( // Usar filteredItemsCount para el mensaje de vacío
          <div className="text-center py-8 text-muted-foreground">
            {searchTerm || (filtroEstado && filtroEstado !== null) || (filtrosPuestos && filtrosPuestos.length > 0) // Si hay búsqueda, filtro de estado o filtros de puestos aplicados
              ? searchEmptyMessage
              : emptyMessage}
          </div>
        ) : (
          <DataTable 
            columns={columns} 
            data={data} // DataTable recibe solo los datos de la página actual
            pageIndex={pageIndex}
            pageSize={pageSize}
            pageCount={pageCount}
            sortConfig={sortConfig}
            onPaginationChange={handleTableChange}
          />
        )}
      </CardContent>
    </Card>
  );
} 