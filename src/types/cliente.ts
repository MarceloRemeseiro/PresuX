export interface ICliente {
  id: string; // UUID v4
  nombre: string;
  apellido?: string;
  nombre_empresa?: string;
  cif_nif?: string; // Identificador fiscal (NIF/CIF en España)
  direccion?: string;
  codigo_postal?: string;
  ciudad?: string;
  provincia?: string;
  pais?: string;
  telefono?: string;
  email: string;
  notas?: string;
  created_at: Date;
  updated_at: Date;
} 