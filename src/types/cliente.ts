/**
 * Tipos de cliente.
 * Debe coincidir con el CHECK constraint de la columna 'tipo' en la tabla 'clientes'.
 */
export enum TipoCliente {
  PARTICULAR = 'PARTICULAR',
  EMPRESA = 'EMPRESA',
  AUTONOMO = 'AUTONOMO',
}

/**
 * Interfaz para la tabla 'clientes'.
 * Representa un cliente asociado a un usuario.
 */
export interface ICliente {
  id: string; // uuid, clave primaria
  user_id: string; // uuid, referencia a profiles.id (dueño del cliente)
  nombre: string;
  tipo: TipoCliente; // Usando el enum TipoCliente
  persona_de_contacto?: string | null;
  nif?: string | null;
  direccion?: string | null;
  ciudad?: string | null;
  email?: string | null;
  telefono?: string | null;
  es_intracomunitario?: boolean;
  created_at: string; // ISO 8601 date string
  updated_at: string; // ISO 8601 date string
  [key: string]: unknown; // Signatura de índice cambiada a unknown
} 