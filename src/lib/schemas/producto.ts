import { z } from "zod";
import { marcaIdSchema } from "./marca"; // Usaremos el ID schema de marca
import { categoriaProductoIdSchema } from "./categoriaProducto"; // Usaremos el ID schema de categoria

export const productoIdSchema = z.string().uuid({
  message: "El ID del producto no es válido",
});

export const baseProductoSchema = z.object({
  nombre: z.string()
    .min(3, { message: "El nombre del producto debe tener al menos 3 caracteres" })
    .max(200, { message: "El nombre del producto no puede exceder los 200 caracteres" }),
  descripcion: z.string()
    .max(1000, { message: "La descripción no puede exceder los 1000 caracteres" })
    .optional()
    .nullable(),
  stock: z.number()
    .int({ message: "El stock debe ser un número entero" })
    .min(0, { message: "El stock no puede ser negativo" })
    .default(0),
  precio: z.number()
    .min(0, { message: "El precio no puede ser negativo" }),
  categoria_id: categoriaProductoIdSchema, // FK
  marca_id: marcaIdSchema.optional().nullable(), // FK opcional
  modelo: z.string()
    .max(100, { message: "El modelo no puede exceder los 100 caracteres" })
    .optional()
    .nullable(),
  precio_alquiler: z.number()
    .min(0, { message: "El precio de alquiler no puede ser negativo" })
    .optional()
    .nullable(),
  precio_compra_referencia: z.number()
    .min(0, { message: "El precio de compra de referencia no puede ser negativo" })
    .optional()
    .nullable(),
  // user_id se gestionará a nivel de API
});

export const createProductoSchema = baseProductoSchema;

export const updateProductoSchema = baseProductoSchema.partial(); 