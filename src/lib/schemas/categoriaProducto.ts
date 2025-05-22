import { z } from "zod";

export const categoriaProductoIdSchema = z.string().uuid({
  message: "El ID de la categoría de producto no es válido",
});

export const baseCategoriaProductoSchema = z.object({
  nombre: z.string()
    .min(2, { message: "El nombre de la categoría debe tener al menos 2 caracteres" })
    .max(100, { message: "El nombre de la categoría no puede exceder los 100 caracteres" }),
  // user_id se gestionará a nivel de API basado en la sesión del usuario
});

export const createCategoriaProductoSchema = baseCategoriaProductoSchema;

export const updateCategoriaProductoSchema = baseCategoriaProductoSchema.partial(); 