import { z } from "zod";

export const personalIdSchema = z.string().uuid({
  message: "El ID del personal no es válido",
});

export const basePersonalSchema = z.object({
  nombre: z.string()
    .min(2, { message: "El nombre debe tener al menos 2 caracteres" })
    .max(100, { message: "El nombre no puede exceder los 100 caracteres" }),
  apellidos: z.string()
    .max(100, { message: "Los apellidos no pueden exceder los 100 caracteres" })
    .optional()
    .nullable(),
  email: z.string()
    .email({ message: "Email inválido" })
    .optional()
    .nullable()
    .or(z.literal("")),
  telefono: z.string()
    .max(20, { message: "El teléfono no puede exceder los 20 caracteres" })
    .optional()
    .nullable(),
  dni_nif: z.string()
    .max(20, { message: "El DNI/NIF no puede exceder los 20 caracteres" })
    .optional()
    .nullable(),
  fecha_alta: z.string()
    .optional()
    .nullable(),
  activo: z.boolean()
    .default(true),
  notas: z.string()
    .max(500, { message: "Las notas no pueden exceder los 500 caracteres" })
    .optional()
    .nullable(),
  // user_id se gestionará a nivel de API basado en la sesión del usuario
});

// Schema para crear personal - simplificado y robusto
export const createPersonalSchema = z.object({
  nombre: z.string().min(1, 'El nombre es obligatorio'),
  apellidos: z.string().optional().nullable(),
  email: z.string().optional().nullable(),
  telefono: z.string().optional().nullable(),
  dni_nif: z.string().optional().nullable(),
  notas: z.string().optional().nullable(),
}).refine(data => {
  // Validación personalizada para email si no está vacío
  if (data.email && data.email.trim() !== '') {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(data.email);
  }
  return true;
}, {
  message: "Email inválido",
  path: ["email"]
});

// Schema para actualizar personal
export const updatePersonalSchema = z.object({
  nombre: z.string()
    .min(1, 'El nombre es obligatorio')
    .max(100, 'El nombre no puede tener más de 100 caracteres')
    .optional(),
    
  apellidos: z.string()
    .max(100, 'Los apellidos no pueden tener más de 100 caracteres')
    .optional()
    .nullable(),
    
  email: z.union([
    z.string().email('Email inválido').max(255, 'El email no puede tener más de 255 caracteres'),
    z.string().length(0),
    z.null()
  ]).optional(),
    
  telefono: z.string()
    .max(20, 'El teléfono no puede tener más de 20 caracteres')
    .optional()
    .nullable(),
    
  dni_nif: z.string()
    .max(20, 'El DNI/NIF no puede tener más de 20 caracteres')
    .optional()
    .nullable(),
    
  notas: z.string()
    .max(1000, 'Las notas no pueden tener más de 1000 caracteres')
    .optional()
    .nullable(),
});

// Schema para asignar puestos de trabajo
export const personalPuestoTrabajoSchema = z.object({
  puesto_trabajo_id: z.string().uuid({
    message: "El ID del puesto de trabajo no es válido",
  }),
  fecha_asignacion: z.string()
    .optional()
    .default(() => new Date().toISOString().split('T')[0]), // Fecha actual por defecto
  tarifa_por_dia: z.number()
    .min(0, { message: "La tarifa por día debe ser mayor o igual a 0" })
    .optional()
    .nullable(),
});

export const asignarPuestosTrabajoSchema = z.object({
  puestos_trabajo: z.array(personalPuestoTrabajoSchema)
    .min(1, { message: "Debe asignar al menos un puesto de trabajo" }),
});

// Schema para reemplazar puestos (permite array vacío para eliminar todos)
export const reemplazarPuestosTrabajoSchema = z.object({
  puestos_trabajo: z.array(personalPuestoTrabajoSchema)
    .optional()
    .default([]),
}); 