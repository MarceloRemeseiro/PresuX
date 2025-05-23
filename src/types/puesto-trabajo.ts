export interface PuestoTrabajo {
  id: string;
  user_id: string;
  nombre: string;
  descripcion?: string | null;
  precio_dia: number;
  created_at: string;
  updated_at: string;
}

export interface CreatePuestoTrabajoData {
  nombre: string;
  descripcion?: string | null;
  precio_dia: number;
}

export interface UpdatePuestoTrabajoData {
  nombre?: string;
  descripcion?: string | null;
  precio_dia?: number;
} 