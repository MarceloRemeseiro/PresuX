import { z } from "zod";
import { productoIdSchema } from "./producto";
import { proveedorIdSchema } from "./proveedor"; // Asumiendo que existe y exporta proveedorIdSchema
import { EstadoEquipo } from "@/types/producto"; // Importar el enum directamente

export const equipoItemIdSchema = z.string().uuid({
  message: "El ID del ítem de equipo no es válido",
});

// Convertir el enum EstadoEquipo a un array de sus valores para Zod
const estadoEquipoValues = Object.values(EstadoEquipo) as [string, ...string[]];

export const baseEquipoItemSchema = z.object({
  producto_id: productoIdSchema, // FK a Producto, siempre requerido
  numero_serie: z.string()
    .max(100, { message: "El número de serie no puede exceder los 100 caracteres" })
    .transform(val => val.trim() === "" ? null : val) // Convertir string vacío a null
    .optional()
    .nullable(),
  notas_internas: z.string()
    .max(1000, { message: "Las notas internas no pueden exceder los 1000 caracteres" })
    .optional()
    .nullable(),
  estado: z.enum(estadoEquipoValues, {
    errorMap: () => ({ message: "Estado de equipo no válido" }),
  }).default(EstadoEquipo.DISPONIBLE),
  fecha_compra: z.string().datetime({ message: "Fecha de compra no válida" }).optional().nullable()
    .or(z.literal('').transform(() => null)), // Permitir string vacío y transformarlo a null
  precio_compra: z.number()
    .min(0, { message: "El precio de compra no puede ser negativo" })
    .optional()
    .nullable(),
  proveedor_id: proveedorIdSchema.optional().nullable(), // FK opcional a Proveedor
  // user_id se gestionará a nivel de API, derivado del producto o la sesión.
});

export const createEquipoItemSchema = baseEquipoItemSchema.extend({
  // Al crear, producto_id es absolutamente necesario y no puede venir de un partial.
  producto_id: productoIdSchema, 
  // El estado puede tener un default, pero también podría ser especificado al crear.
  estado: z.enum(estadoEquipoValues, {
    errorMap: () => ({ message: "Estado de equipo no válido" }),
  }).default(EstadoEquipo.DISPONIBLE),
});

export const updateEquipoItemSchema = baseEquipoItemSchema.partial().extend({
    // Asegurarse de que producto_id no se pueda cambiar en una actualización parcial de este schema.
    // La API se encargará de que el item siga perteneciendo al mismo producto.
    producto_id: productoIdSchema.optional(), 
});

// Ejemplo de cómo se podría usar el schema para un array de items (ej. creación masiva)
// export const createEquipoItemArraySchema = z.array(createEquipoItemSchema); 