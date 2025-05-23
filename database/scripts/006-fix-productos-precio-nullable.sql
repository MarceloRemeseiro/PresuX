-- Script para corregir el schema de productos
-- Hacer que el campo precio sea nullable y renombrar precio_alquiler_dia

-- 1. Hacer que el campo precio permita NULL (ya que no lo usamos para precio general)
ALTER TABLE public.productos 
ALTER COLUMN precio DROP NOT NULL;

-- 2. Renombrar precio_alquiler_dia a precio_alquiler para consistencia con el código
ALTER TABLE public.productos 
RENAME COLUMN precio_alquiler_dia TO precio_alquiler;

-- 3. Actualizar comentarios para reflejar los cambios
COMMENT ON COLUMN public.productos.precio IS 'Precio de venta de referencia del producto (formato NUMERIC 10,2). Opcional, puede ser NULL.';
COMMENT ON COLUMN public.productos.precio_alquiler IS 'Precio de alquiler del producto por día (formato NUMERIC 10,2).'; 