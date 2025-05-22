import { clsx, type ClassValue } from "clsx";

/**
 * Combina múltiples clases de Tailwind utilizando clsx
 * @param inputs Clases CSS a combinar
 * @returns Cadena de clases combinadas
 */
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
} 