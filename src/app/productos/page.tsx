"use client";

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
// Asumimos que DataTableColumn se exporta desde data-table o se importa directamente de tanstack
import { DataTableColumn } from '@/components/ui/data-table'; 
import { DataTableWithFilters, SortConfig } from '@/components/ui/data-table-with-filters';
import { IProductoConDetalles } from '@/types';
import { apiClient } from '@/lib/apiClient'; // Asumiendo esta ruta para apiClient
import { toast } from 'sonner'; // Para notificaciones de error
import { Edit, Eye } from 'lucide-react'; // Iconos para acciones

// Definición de columnas (se moverá a un archivo separado o se completará más adelante)
// Por ahora, un placeholder para evitar errores de TypeScript si DataTableWithFilters lo requiere inmediatamente.
const columns: DataTableColumn<IProductoConDetalles>[] = [];


// Interfaz para el dato crudo de Supabase con joins, debe coincidir con el select
// Esta interfaz ya no será necesaria aquí si la API devuelve IProductoConDetalles directamente
/*
interface IProductoFromSupabase {
  id: string;
  user_id: string;
  nombre: string;
  descripcion?: string | null;
  stock: number;
  precio: number | null;
  categoria_id: string; 
  marca_id?: string | null; 
  modelo?: string | null;
  precio_alquiler?: number | null;
  precio_compra_referencia?: number | null; 
  created_at: string;
  updated_at: string; 
  categorias_producto: { nombre: string } | null;
  marcas: { nombre: string } | null;
}
*/

// La función getProductos se reemplazará por una llamada a la API usando apiClient
/*
async function getProductos(supabaseClient: any, userId: string): Promise<IProductoConDetalles[]> {
  // ... lógica anterior ...
}
*/

// Función helper para normalizar texto (minúsculas, sin acentos)
const normalizeText = (text: string | null | undefined): string => {
  if (!text) return '';
  return text
    .toLowerCase()
    .normalize("NFD") // Descomponer caracteres acentuados
    .replace(/\p{Diacritic}/gu, "") // Eliminar diacríticos
    .replace(/[^\w\s.-]/gi, ''); // Permitir alfanuméricos, espacios, puntos y guiones (ej. para precios o modelos)
};

export default function ProductosPage() {
  const [productosOriginales, setProductosOriginales] = useState<IProductoConDetalles[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'nombre', direction: 'asc' });
  const [currentPage, setCurrentPage] = useState(1); // 1-indexed
  const [itemsPerPage, setItemsPerPage] = useState(10); // O el valor que prefieras
  // Estado y función no-op para las props de filtro de estado que requiere DataTableWithFilters
  const [filtroEstadoProducto, setFiltroEstadoProducto] = useState<string | null>(null);
  const handleFiltroEstadoProductoChange = (estado: string | null) => {
    setFiltroEstadoProducto(estado);
    // Aquí podríamos añadir lógica si tuviéramos filtros de estado para productos
    setCurrentPage(1); // Resetear a la primera página si cambia el filtro de estado
  };

  // useEffect para cargar productos
  useEffect(() => {
    const fetchProductos = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Asumimos que la API devuelve un array de IProductoConDetalles
        const data = await apiClient<IProductoConDetalles[]>('/api/productos');
        setProductosOriginales(data);
      } catch (err) {
        console.error('Error al cargar productos:', err);
        const errorMessage = err instanceof Error ? err.message : "Error al cargar la lista de productos";
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProductos();
  }, []);

  // Lógica de filtrado, ordenación y paginación (se implementará a continuación)
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    setCurrentPage(1); // Resetear a la primera página con nueva búsqueda
  };

  const handleSortChange = (newSortConfig?: SortConfig) => {
    if (newSortConfig) {
      setSortConfig(newSortConfig);
    } else { // Si no hay newSortConfig, es un ciclo: asc -> desc -> null (sin ordenar) -> asc
      if (sortConfig.direction === 'asc') {
        setSortConfig({ ...sortConfig, direction: 'desc' });
      } else if (sortConfig.direction === 'desc') {
        setSortConfig({ ...sortConfig, direction: null }); // Opcional: permitir "sin ordenar"
      } else {
        setSortConfig({ ...sortConfig, direction: 'asc' });
      }
    }
    setCurrentPage(1);
  };
  
  const filteredProductos = useMemo(() => {
    if (!searchTerm) return productosOriginales;
    const normalizedSearch = normalizeText(searchTerm);
    return productosOriginales.filter(producto => 
      normalizeText(producto.nombre).includes(normalizedSearch) ||
      normalizeText(producto.categoria_nombre).includes(normalizedSearch) ||
      normalizeText(producto.marca_nombre).includes(normalizedSearch) ||
      normalizeText(producto.modelo).includes(normalizedSearch)
      // Añadir más campos a la búsqueda si es necesario
    );
  }, [productosOriginales, searchTerm]);

  const sortedProductos = useMemo(() => {
    if (!sortConfig.key || !sortConfig.direction) return filteredProductos;
    
    return [...filteredProductos].sort((a, b) => {
      let aValue: string | number | null | undefined;
      let bValue: string | number | null | undefined;

      // Acceder a los valores de forma segura
      switch (sortConfig.key) {
        case 'nombre':
        case 'categoria_nombre':
        case 'marca_nombre':
        case 'modelo':
          aValue = normalizeText(a[sortConfig.key as keyof IProductoConDetalles] as string | undefined);
          bValue = normalizeText(b[sortConfig.key as keyof IProductoConDetalles] as string | undefined);
          break;
        case 'stock':
        case 'precio':
        case 'precio_alquiler':
          aValue = a[sortConfig.key as keyof IProductoConDetalles] as number | null | undefined;
          bValue = b[sortConfig.key as keyof IProductoConDetalles] as number | null | undefined;
          break;
        default:
          return 0;
      }

      if (aValue === null || aValue === undefined) return sortConfig.direction === 'asc' ? 1 : -1;
      if (bValue === null || bValue === undefined) return sortConfig.direction === 'asc' ? -1 : 1;

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
      }
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortConfig.direction === 'asc' 
          ? aValue.localeCompare(bValue) 
          : bValue.localeCompare(aValue);
      }
      return 0;
    });
  }, [filteredProductos, sortConfig]);

  const paginatedProductos = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedProductos.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedProductos, currentPage, itemsPerPage]);

  const pageCount = useMemo(() => {
    return Math.ceil(sortedProductos.length / itemsPerPage);
  }, [sortedProductos, itemsPerPage]);

  const handlePaginationChange = (pagination: { pageIndex: number; pageSize: number }, newSortConfig?: SortConfig) => {
    setCurrentPage(pagination.pageIndex + 1); // DataTable usa 0-indexed, nosotros 1-indexed
    setItemsPerPage(pagination.pageSize);
    if (newSortConfig) { // Si DataTableWithFilters pasa una nueva config de sort, la aplicamos
      handleSortChange(newSortConfig);
    }
  };

  // Definición de columnas (placeholder, se completará después)
  const columnsDefinition: DataTableColumn<IProductoConDetalles>[] = useMemo(() => [
    {
      key: "nombre",
      header: "Nombre",
      cell: (item) => <div className="font-medium truncate" title={item.nombre}>{item.nombre}</div>,
      sortable: true,
      width: "25%",
      minWidth: "180px",
    },
    {
      key: "marca_nombre",
      header: "Marca",
      cell: (item) => item.marca_nombre || "N/A",
      sortable: true,
      width: "15%",
      minWidth: "120px",
    },
    {
      key: "modelo",
      header: "Modelo",
      cell: (item) => item.modelo || "N/A",
      sortable: true,
      width: "15%",
      minWidth: "120px",
    },
    {
      key: "categoria_nombre",
      header: "Categoría",
      cell: (item) => item.categoria_nombre || "N/A",
      sortable: true,
      width: "15%",
      minWidth: "120px",
    },
    {
      key: "stock",
      header: "Stock",
      cell: (item) => <div className="text-right">{item.stock}</div>,
      sortable: true,
      width: "10%", 
      minWidth: "70px", 
    },
    {
      key: "precio_alquiler", // La clave sigue siendo precio_alquiler para los datos
      header: "Precio (€)",      // Pero el encabezado ahora es "Precio"
      cell: (item) => {
        const precioAlquiler = item.precio_alquiler;
        return <div className="text-right">{precioAlquiler === null || precioAlquiler === undefined || isNaN(precioAlquiler) ? "-" : precioAlquiler.toFixed(2)}</div>;
      },
      sortable: true,
      width: "10%",
      minWidth: "100px",
    },
    {
      key: "acciones",
      header: "Acciones",
      cell: (item) => { 
        return (
          <div className="flex justify-end gap-2">
            <Button 
              variant="ghost" 
              size="icon"
              asChild
            >
              <Link href={`/productos/${item.id}`}>
                <Eye className="h-4 w-4" />
              </Link>
            </Button>
            <Button 
              variant="ghost" 
              size="icon"
              asChild
            >
              <Link href={`/productos/editar/${item.id}`}>
                <Edit className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        );
      },
      sortable: false, 
      width: "15%", 
      minWidth: "110px", 
    },
  ], []);


  // El return se modificará para usar DataTableWithFilters
  if (isLoading && productosOriginales.length === 0) return (
    <div className="container mx-auto py-10 px-4 md:px-6 flex justify-center items-center min-h-[300px]">
      <p>Cargando productos...</p> {/* Podríamos usar un LoaderIcon aquí */}
    </div>
  );
  
  // No mostramos error si ya hay datos, el toast ya informó
  if (error && productosOriginales.length === 0) return (
    <div className="container mx-auto py-10 px-4 md:px-6">
      <p className="text-red-500">Error al cargar productos: {error}</p>
    </div>
  );
  
  // Este return es un placeholder, lo actualizaremos para usar DataTableWithFilters
  return (
    <div className="py-10">
      <div className="flex items-center justify-between mb-8 px-4 md:px-6">
        <h1 className="text-3xl font-bold tracking-tight">Gestión de Productos</h1>
        <Link href="/productos/crear">
          <Button>Crear Nuevo Producto</Button>
        </Link>
      </div>
      
      <DataTableWithFilters<IProductoConDetalles, string> // Especificamos los tipos genéricos
        columns={columnsDefinition}
        data={paginatedProductos}
        // Pasamos sortedProductos para el conteo de items filtrados y posiblemente para el contador si se usara
        allFilteredData={sortedProductos} 
        allData={productosOriginales} // Para el contador, si se usara
        filteredItemsCount={sortedProductos.length}
        
        searchTerm={searchTerm}
        onSearchChange={handleSearchChange}
        searchPlaceholder="Buscar por nombre, categoría, marca, modelo..."
        
        // Props del contador (omitidas por ahora para productos)
        // DataTableWithFilters requiere 'tipo' pero no necesariamente las funciones de filtro si showContador es false o no se usa.
        // Podríamos pasar un tipo genérico y funciones no-op si es estrictamente necesario por la interfaz,
        // o idealmente DataTableWithFilters debería manejar showContador=false sin requerir getEstadoFn.
        // Por ahora, asumimos que si showContador no se pasa o es false, no se usan las otras props de estado.
        // Si 'tipo' es obligatorio, le pasaremos un valor placeholder y showContador={false}
        tipo="producto" // Placeholder, el contador no se mostrará para productos
        filtroEstado={filtroEstadoProducto} // Prop requerida
        setFiltroEstado={handleFiltroEstadoProductoChange} // Prop requerida
        // getEstadoFn para productos no es necesario ya que showContador es false
        // Si fuera necesario, sería algo como: getEstadoFn={(item) => item.algunEstadoDeProducto || "DEFAULT_STATE"}
        showContador={false} // No mostramos el contador de estados para productos

        sortConfig={sortConfig}
        
        pageIndex={currentPage - 1} // DataTable usa 0-indexed
        pageSize={itemsPerPage}
        pageCount={pageCount}
        onPaginationChange={handlePaginationChange}
        
        // Mostrar loading solo si no hay datos y se está cargando. Si hay datos, la carga es en segundo plano.
        isLoading={isLoading && productosOriginales.length === 0} 
        // Mostrar error solo si no hay datos y hay un error. Si hay datos, el error se notificó por toast.
        error={productosOriginales.length === 0 ? error : null} 
        
        emptyMessage="No hay productos para mostrar. ¡Crea tu primer producto!"
        searchEmptyMessage="No se encontraron productos con los filtros aplicados."
        errorMessage="Ocurrió un error al cargar los productos."
      />
    </div>
  );
} 