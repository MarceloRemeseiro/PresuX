export interface Servicio {
  id: string;
  user_id: string;
  nombre: string;
  descripcion?: string | null;
  precio_dia: number;
  created_at: string;
  updated_at: string;
}

export interface CreateServicioData {
  nombre: string;
  descripcion?: string | null;
  precio_dia: number;
}

export interface UpdateServicioData {
  nombre?: string;
  descripcion?: string | null;
  precio_dia?: number;
} 