import { z } from "zod";

export const puestoTrabajoIdSchema = z.string().uuid({
  message: "El ID del puesto de trabajo no es válido",
});

export const basePuestoTrabajoSchema = z.object({
  nombre: z.string()
    .min(2, { message: "El nombre del puesto debe tener al menos 2 caracteres" })
    .max(255, { message: "El nombre del puesto no puede exceder los 255 caracteres" }),
  descripcion: z.string()
    .max(1000, { message: "La descripción no puede exceder los 1000 caracteres" })
    .nullable()
    .optional(),
  precio_dia: z.number()
    .min(0, { message: "El precio por día debe ser mayor o igual a 0" })
    .max(99999.99, { message: "El precio por día no puede exceder 99,999.99" }),
});

export const createPuestoTrabajoSchema = basePuestoTrabajoSchema;

export const updatePuestoTrabajoSchema = z.object({
  nombre: z.string()
    .min(2, { message: "El nombre del puesto debe tener al menos 2 caracteres" })
    .max(255, { message: "El nombre del puesto no puede exceder los 255 caracteres" })
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