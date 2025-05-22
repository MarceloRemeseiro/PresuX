/**
 * Archivo principal de exportación de tipos.
 * Re-exporta todos los tipos organizados por módulos.
 */

// Reexportamos los tipos organizados por módulo
export * from "./common";
export * from "./auth";
export * from "./cliente";
export * from "./proveedor";
export * from "./producto";

// Asegurarse que IProductoConDetalles se exporta si no lo hace el comodín de arriba
// (aunque `export *` debería cubrirlo si está exportado en producto.ts)
// Para ser explícito (opcional si `export *` funciona como se espera):
// export type { IProductoConDetalles } from './producto';

// Enum para estados genéricos, si se necesita globalmente
export enum EstadoGenerico {
    ACTIVO = 'ACTIVO',
    INACTIVO = 'INACTIVO',
    PENDIENTE = 'PENDIENTE',
    ARCHIVADO = 'ARCHIVADO'
}

// Tipos para la API de configuración global, si es necesaria
export interface IConfiguracionGlobal {
    // ... campos de configuración ...
    versionApi: string;
}

// Tipos para respuestas de API paginadas genéricas
export interface IPaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

// Tipos para opciones de Select
export interface IOpcionSelect {
    value: string;
    label: string;
}

