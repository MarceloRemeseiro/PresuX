import { z } from "zod";
import { productoIdSchema } from "./producto";
import { proveedorIdSchema } from "./proveedor";
import { EstadoEquipo } from "@/types/producto";

export const equipoItemIdSchema = z.string().uuid({
  message: "El ID del ítem de equipo no es válido",
});

// Usar los valores del enum EstadoEquipo
const estadosValidos = Object.values(EstadoEquipo) as [string, ...string[]];

export const baseEquipoItemSchema = z.object({
  numero_serie: z.string()
    .max(100, { message: "El número de serie no puede exceder los 100 caracteres" })
    .optional()
    .nullable()
    .transform(val => val && val.trim() === "" ? null : val), // Convertir string vacío a null
  notas_internas: z.string()
    .max(1000, { message: "Las notas internas no pueden exceder los 1000 caracteres" })
    .optional()
    .nullable()
    .transform(val => val && val.trim() === "" ? null : val),
  estado: z.enum(estadosValidos, {
    errorMap: () => ({ message: "Estado de equipo no válido" }),
  }).default(EstadoEquipo.DISPONIBLE),
  fecha_compra: z.string()
    .optional()
    .nullable()
    .transform(val => {
      if (!val || val.trim() === "") return null;
      // Si es una fecha en formato YYYY-MM-DD (del input date), la mantenemos así
      // Si es una fecha completa, también la aceptamos
      return val;
    }),
  precio_compra: z.number()
    .min(0, { message: "El precio de compra no puede ser negativo" })
    .optional()
    .nullable(),
  proveedor_id: proveedorIdSchema.optional().nullable(),
});

export const createEquipoItemSchema = baseEquipoItemSchema;

export const updateEquipoItemSchema = baseEquipoItemSchema.partial();

// Ejemplo de cómo se podría usar el schema para un array de items (ej. creación masiva)
// export const createEquipoItemArraySchema = z.array(createEquipoItemSchema); 