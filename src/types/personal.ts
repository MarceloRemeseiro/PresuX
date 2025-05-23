/**
 * Tipos para el módulo de Personal
 */

export interface IPersonal extends Record<string, unknown> {
  id: string;
  user_id: string;
  nombre: string;
  apellidos?: string | null;
  email?: string | null;
  telefono?: string | null;
  dni_nif?: string | null;
  notas?: string | null;
  created_at: string; // ISO date string
  updated_at: string; // ISO date string
}

export interface IPersonalPuestoTrabajo {
  id: string;
  personal_id: string;
  puesto_trabajo_id: string;
  fecha_asignacion: string; // ISO date string
  tarifa_por_dia?: number | null;
  created_at: string;
  updated_at: string;
}

// Personal con sus puestos de trabajo asignados
export interface IPersonalConPuestos extends IPersonal {
  puestos_trabajo: Array<{
    id: string;
    puesto_trabajo_id: string;
    nombre_puesto: string;
    tarifa_por_dia?: number | null;
    fecha_asignacion: string;
  }>;
}

// Para formularios
export interface IPersonalFormData {
  nombre: string;
  apellidos?: string;
  email?: string;
  telefono?: string;
  dni_nif?: string;
  notas?: string;
  puestos_trabajo_ids?: string[]; // IDs de puestos asignados
} 