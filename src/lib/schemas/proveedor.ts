import { z } from 'zod';
import { TipoProveedor } from '@/types';

export const proveedorIdSchema = z.string().uuid("El ID del proveedor debe ser un UUID válido");

export const baseProveedorSchema = z.object({
  nombre: z.string().min(2, "El nombre del proveedor debe tener al menos 2 caracteres").max(100, "El nombre del proveedor no puede exceder los 100 caracteres"),
  tipo: z.nativeEnum(TipoProveedor, { errorMap: () => ({ message: "Tipo de proveedor inválido" }) }),
  persona_de_contacto: z.string().max(100, "La persona de contacto no puede exceder los 100 caracteres").nullable().optional(),
  nif: z.string().max(20, "El NIF/CIF no puede exceder los 20 caracteres").nullable().optional(),
  direccion: z.string().max(255, "La dirección no puede exceder los 255 caracteres").nullable().optional(),
  ciudad: z.string().max(100, "La ciudad no puede exceder los 100 caracteres").nullable().optional(),
  email: z.string().email("Email inválido").max(100, "El email no puede exceder los 100 caracteres").nullable().optional(),
  telefono: z.string().max(20, "El teléfono no puede exceder los 20 caracteres").nullable().optional(),
  es_intracomunitario: z.boolean().optional(),
});

export const createProveedorSchema = baseProveedorSchema.extend({
  // Aquí podrían ir campos adicionales que solo son obligatorios en la creación
  // y no forman parte de IProveedor directamente o son manejados por la API (como user_id)
});

export const updateProveedorSchema = baseProveedorSchema.partial();

// Tipos inferidos de Zod para uso en el frontend/backend si es necesario
export type CreateProveedorInput = z.infer<typeof createProveedorSchema>;
export type UpdateProveedorInput = z.infer<typeof updateProveedorSchema>; 