/**
 * Tipos de proveedor.
 */
export enum TipoProveedor {
  BIENES = 'BIENES',
  SERVICIOS = 'SERVICIOS',
  MIXTO = 'MIXTO',
}

/**
 * Interfaz para la tabla 'proveedores'.
 * Representa un proveedor asociado a un usuario.
 */
export interface IProveedor {
  id: string; // uuid, clave primaria
  user_id: string; // uuid, referencia a profiles.id (dueño del proveedor)
  nombre: string;
  tipo: TipoProveedor; // Usando el enum TipoProveedor
  persona_de_contacto?: string | null;
  nif?: string | null;
  direccion?: string | null;
  ciudad?: string | null;
  email?: string | null;
  telefono?: string | null;
  es_intracomunitario?: boolean; // Podría aplicar o no, lo mantenemos por similitud
  created_at: string; // ISO 8601 date string
  updated_at: string; // ISO 8601 date string
  [key: string]: unknown; // Signatura de índice para compatibilidad
} 