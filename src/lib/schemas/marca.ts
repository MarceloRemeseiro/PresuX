import { z } from "zod";

export const marcaIdSchema = z.string().uuid({
  message: "El ID de la marca no es válido",
});

export const baseMarcaSchema = z.object({
  nombre: z.string()
    .min(2, { message: "El nombre de la marca debe tener al menos 2 caracteres" })
    .max(100, { message: "El nombre de la marca no puede exceder los 100 caracteres" }),
  // user_id se gestionará a nivel de API basado en la sesión del usuario
});

export const createMarcaSchema = baseMarcaSchema;

export const updateMarcaSchema = baseMarcaSchema.partial(); 