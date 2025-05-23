import { z } from "zod";

export const servicioIdSchema = z.string().uuid({
  message: "El ID del servicio no es válido",
});

export const baseServicioSchema = z.object({
  nombre: z.string()
    .min(2, { message: "El nombre del servicio debe tener al menos 2 caracteres" })
    .max(255, { message: "El nombre del servicio no puede exceder los 255 caracteres" }),
  descripcion: z.string()
    .max(1000, { message: "La descripción no puede exceder los 1000 caracteres" })
    .nullable()
    .optional(),
  precio_dia: z.number()
    .min(0, { message: "El precio por día debe ser mayor o igual a 0" })
    .max(99999.99, { message: "El precio por día no puede exceder 99,999.99" }),
});

export const createServicioSchema = baseServicioSchema;

export const updateServicioSchema = z.object({
  nombre: z.string()
    .min(2, { message: "El nombre del servicio debe tener al menos 2 caracteres" })
    .max(255, { message: "El nombre del servicio no puede exceder los 255 caracteres" })
    .optional(),
  descripcion: z.union([
    z.string().max(1000, { message: "La descripción no puede exceder los 1000 caracteres" }),
    z.null()
  ]).optional(),
  precio_dia: z.number()
    .min(0, { message: "El precio por día debe ser mayor o igual a 0" })
    .max(99999.99, { message: "El precio por día no puede exceder 99,999.99" })
    .optional(),
}); 