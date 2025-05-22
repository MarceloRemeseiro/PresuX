/**
 * Tipos comunes utilizados en toda la aplicación.
 * Tipos genéricos que pueden ser utilizados por múltiples módulos.
 */

// Tipo para la ordenación de tablas
export type SortDirection = "asc" | "desc" | null;
export type SortConfig = {
  key: string;
  direction: SortDirection;
};

// Añadir aquí otros tipos comunes según sea necesario 