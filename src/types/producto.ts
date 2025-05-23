// El enum EstadoEquipo ya está definido abajo, no se necesita importar de ./index

export enum EstadoEquipo {
  DISPONIBLE = "DISPONIBLE",
  ALQUILADO = "ALQUILADO",
  MANTENIMIENTO = "MANTENIMIENTO",
  DAÑADO = "DAÑADO",
  VENDIDO = "VENDIDO",
  BAJA = "BAJA",
}

// Interfaz base para Marcas
export interface IMarca {
  id: string;
  user_id: string;
  nombre: string;
  created_at: string;
  updated_at: string;
  [key: string]: unknown; // Para permitir otras propiedades si es necesario
}

// Interfaz base para Categorías de Producto
export interface ICategoriaProducto {
  id: string;
  user_id: string;
  nombre: string;
  created_at: string;
  updated_at: string;
  [key: string]: unknown;
}

// Interfaz base para Productos
export interface IProducto {
  id: string;
  user_id: string;
  nombre: string;
  descripcion?: string | null;
  stock: number;
  categoria_id: string;
  marca_id?: string | null;
  modelo?: string | null;
  precio_alquiler?: number | null; // Cambiado
  precio_compra_referencia?: number | null; // Precio de compra orientativo o para depreciación
  created_at: string;
  updated_at: string;
  // Campos que pueden venir de joins en las API routes, pero no son parte directa de la tabla productos
  categorias_producto?: { nombre: string } | null; // Para el nombre de la categoría
  marcas?: { nombre: string } | null; // Para el nombre de la marca
  [key: string]: unknown;
}

// Definición simplificada y explícita para la tabla de productos
export interface IProductoConDetalles {
  id: string;
  nombre: string;
  stock: number;
  precio_alquiler?: number | null; // Cambiado
  categoria_nombre?: string;
  marca_nombre?: string;
  // Campos adicionales de IProducto que podrían ser necesarios para que el tipo sea completo
  // y evitar problemas de inferencia si se usa en otros contextos que esperan IProducto.
  user_id: string;
  descripcion?: string | null;
  modelo?: string | null;
  precio_compra_referencia?: number | null;
  created_at: string;
  updated_at: string;
  categoria_id: string; // FK
  marca_id?: string | null; // FK
  [key: string]: any; // Añadido para compatibilidad con Record<string, unknown>
}

// Interfaz base para Ítems de Equipo (unidades individuales de productos)
export interface IEquipoItem {
  id: string;
  user_id: string; // Denormalizado para RLS y unicidad con numero_serie y producto_id.
  producto_id: string;
  numero_serie?: string | null;
  notas_internas?: string | null;
  estado: EstadoEquipo; // Usará el enum definido arriba
  fecha_compra?: string | null;
  precio_compra?: number | null;
  proveedor_id?: string | null;
  created_at: string;
  updated_at: string;
  // Campos que pueden venir de joins
  productos?: { nombre: string } | null; 
  proveedores?: { nombre: string } | null;
  [key: string]: unknown;
}

// Podríamos añadir IEquipoItemConDetalles si es necesario en el futuro

// Más interfaces vendrán aquí más adelante 