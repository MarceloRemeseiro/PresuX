import { z } from 'zod';
import { TipoCliente } from '@/types'; // Asegúrate que la ruta al enum sea correcta

export const ClienteSchema = z.object({
  // id se genera en la BD, user_id se toma de la sesión
  nombre: z.string()
    .min(1, { message: 'El nombre es requerido.' })
    .max(255),
  tipo: z.nativeEnum(TipoCliente, { errorMap: () => ({ message: 'Tipo de cliente inválido.' }) }),
  persona_de_contacto: z.string().max(255).optional().nullable(),
  nif: z.string().max(20).optional().nullable(),
  direccion: z.string().max(255).optional().nullable(),
  ciudad: z.string().max(100).optional().nullable(),
  email: z.string().email({ message: 'Email inválido.' }).optional().nullable(),
  telefono: z.string().max(20).optional().nullable(),
  es_intracomunitario: z.boolean().optional(),
  // created_at y updated_at son manejados por la BD
});

export type ClienteFormValues = z.infer<typeof ClienteSchema>; 