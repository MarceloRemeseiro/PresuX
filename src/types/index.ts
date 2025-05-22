/**
 * Roles de usuario en el sistema.
 * Debe coincidir con el ENUM 'user_role' en la base de datos.
 */
export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
}

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
 * Interfaz para la tabla 'profiles'.
 * Representa el perfil de un usuario en el sistema.
 */
export interface IProfile {
  id: string; // uuid, clave primaria, referencia a auth.users.id
  email?: string | null; // Puede ser null si no se replica o se permite
  nombre_completo?: string | null;
  avatar_url?: string | null;
  rol?: UserRole | null; // Usando el enum UserRole
  created_at?: string; // ISO 8601 date string
  updated_at?: string; // ISO 8601 date string
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
}

// Aquí puedes añadir más interfaces y enums a medida que los necesitemos
// para otras tablas como TiposServicio, Productos, Presupuestos, Facturas, etc. 