-- Script para eliminar la columna precio de productos
-- Solo mantenemos precio_alquiler y precio_compra_referencia

-- Eliminar la columna precio que está causando problemas
ALTER TABLE public.productos 
DROP COLUMN IF EXISTS precio;

-- Actualizar comentarios para clarificar los campos restantes
COMMENT ON COLUMN public.productos.precio_alquiler IS 'Precio de alquiler del producto por día (formato NUMERIC 10,2). Campo obligatorio.';
COMMENT ON COLUMN public.productos.precio_compra_referencia IS 'Precio de compra de referencia orientativo para este tipo de producto (formato NUMERIC 10,2). Campo opcional.'; 