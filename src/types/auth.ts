/**
 * Roles de usuario en el sistema.
 * Debe coincidir con el ENUM 'user_role' en la base de datos.
 */
export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
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