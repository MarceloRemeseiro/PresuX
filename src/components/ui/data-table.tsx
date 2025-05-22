"use client"

import { useState, useMemo } from "react"
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronLeft, ChevronRight } from "lucide-react"
import { 
  Table, 
  TableHeader, 
  TableBody, 
  TableHead, 
  TableRow, 
  TableCell 
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { SortConfig, SortDirection } from "./data-table-with-filters"

// Definimos los tipos para nuestras props
export interface DataTableColumn<T> {
  key: string
  header: string
  cell: (item: T) => React.ReactNode
  sortable?: boolean
  defaultSort?: "asc" | "desc"
  width?: string        // Ancho fijo de la columna (ej: "200px", "25%", etc.)
  minWidth?: string     // Ancho mínimo de la columna (ej: "100px")
  maxWidth?: string     // Ancho máximo de la columna (ej: "300px")
}

interface DataTableProps<T> {
  columns: DataTableColumn<T>[]
  data: T[]
  className?: string
  pageIndex: number // 0-indexed
  pageSize: number
  pageCount: number // total pages
  sortConfig?: SortConfig // Configuración de ordenación externa
  onPaginationChange: (
    pagination: { pageIndex: number; pageSize: number }, 
    sort?: SortConfig
  ) => void
}

export function DataTable<T extends Record<string, any>>({
  columns, 
  data,
  className, 
  pageIndex, // 0-indexed
  pageSize,
  pageCount,
  sortConfig: externalSortConfig, // Ordenación controlada externamente
  onPaginationChange,
}: DataTableProps<T>) {
  // Usar sortConfig externo si se proporciona, o crear uno interno
  const defaultSortColumn = columns.find(col => col.defaultSort);
  const defaultSortKey = defaultSortColumn?.key || (columns.length > 0 ? columns[0].key : "");
  const defaultSortDirection = defaultSortColumn?.defaultSort || null;
  
  // Estado interno solo se usa si no hay ordenación externa
  const [internalSortConfig, setInternalSortConfig] = useState<SortConfig>({ 
    key: defaultSortKey,
    direction: defaultSortDirection
  });
  
  // Usar el config externo si está disponible, sino el interno
  const currentSortConfig = externalSortConfig || internalSortConfig;
  
  // Manejar el cambio de ordenación
  const handleSort = (key: string) => {
    let direction: SortDirection = "asc";
    if (currentSortConfig.key === key) {
      if (currentSortConfig.direction === "asc") direction = "desc";
      else if (currentSortConfig.direction === "desc") direction = null; 
    }
    
    const newSortConfig: SortConfig = { key, direction };
    
    // Si hay un sortConfig externo, notificar al padre
    if (externalSortConfig) {
      onPaginationChange({ pageIndex: 0, pageSize }, newSortConfig);
    } else {
      // Si no, actualizar el estado interno
      setInternalSortConfig(newSortConfig);
      onPaginationChange({ pageIndex: 0, pageSize });
    }
  };

  const handlePreviousPage = () => {
    onPaginationChange({ pageIndex: Math.max(pageIndex - 1, 0), pageSize });
  };

  const handleNextPage = () => {
    onPaginationChange({ pageIndex: Math.min(pageIndex + 1, pageCount - 1), pageSize });
  };

  const getSortIcon = (key: string) => {
    if (currentSortConfig.key !== key || !currentSortConfig.direction) {
      return <ArrowUpDown className="ml-2 h-4 w-4 opacity-30" />;
    }
    return currentSortConfig.direction === "asc" ? <ArrowUp className="ml-2 h-4 w-4" /> : <ArrowDown className="ml-2 h-4 w-4" />;
  };

  // Función para generar el estilo de la columna basado en width, minWidth y maxWidth
  const getColumnStyle = (column: DataTableColumn<T>) => {
    const style: React.CSSProperties = {};
    if (column.width) style.width = column.width;
    if (column.minWidth) style.minWidth = column.minWidth;
    if (column.maxWidth) style.maxWidth = column.maxWidth;
    return style;
  };

  const currentPageForDisplay = pageIndex + 1;

  return (
    <div>
      <div className="rounded-md border overflow-hidden">
        <Table className={`${className} table-fixed w-full`}>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead 
                  key={column.key}
                  style={getColumnStyle(column)}
                  className="whitespace-nowrap"
                >
                  {column.sortable ? (
                    <Button
                      variant="ghost"
                      onClick={() => handleSort(column.key)}
                      className="h-auto px-2 py-1 font-medium flex items-center text-muted-foreground justify-start hover:bg-transparent hover:text-foreground"
                    >
                      {column.header}
                      {getSortIcon(column.key)}
                    </Button>
                  ) : (
                    <span className="px-2 py-1 font-medium text-muted-foreground">{column.header}</span>
                  )}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No hay datos disponibles.
                </TableCell>
              </TableRow>
            ) : (
              data.map((item, index) => (
                <TableRow key={item.id || index}> 
                  {columns.map((column) => (
                    <TableCell 
                      key={column.key}
                      style={getColumnStyle(column)}
                    >
                      {column.cell(item)}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {pageCount > 1 && (
         <div className="flex items-center justify-end space-x-2 py-4">
          <span className="text-sm text-muted-foreground">
            Página {currentPageForDisplay} de {pageCount}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={handlePreviousPage}
            disabled={pageIndex === 0}
          >
            <ChevronLeft className="h-4 w-4 mr-1"/>
            Anterior
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleNextPage}
            disabled={pageIndex >= pageCount - 1}
          >
            Siguiente
            <ChevronRight className="h-4 w-4 ml-1"/>
          </Button>
        </div>
      )}
    </div>
  );
} 