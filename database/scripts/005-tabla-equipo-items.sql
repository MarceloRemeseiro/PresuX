-- Script para crear la tabla equipo_items y el tipo ENUM estado_equipo_enum

-- Primero, crear el tipo ENUM para el estado del equipo si no existe
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'estado_equipo_enum') THEN
        CREATE TYPE public.estado_equipo_enum AS ENUM (
            'DISPONIBLE',
            'ALQUILADO',
            'EN_REPARACION',
            'VENDIDO',
            'BAJA',
            'MANTENIMIENTO'
        );
    END IF;
END$$;

-- Tabla de Ítems de Equipo (unidades individuales de productos con número de serie)
CREATE TABLE IF NOT EXISTS public.equipo_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, -- Denormalizado para RLS y unicidad.
    producto_id UUID NOT NULL REFERENCES public.productos(id) ON DELETE CASCADE,
    numero_serie TEXT CHECK (char_length(numero_serie) <= 100),
    notas_internas TEXT CHECK (char_length(notas_internas) <= 1000),
    estado public.estado_equipo_enum NOT NULL DEFAULT 'DISPONIBLE',
    fecha_compra TIMESTAMPTZ,
    precio_compra NUMERIC(10, 2) CHECK (precio_compra >= 0),
    proveedor_id UUID REFERENCES public.proveedores(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    -- Unicidad: un producto no puede tener el mismo número de serie repetido para el mismo usuario.
    -- PostgreSQL trata los NULL en numero_serie como distintos, permitiendo múltiples items sin N/S para el mismo producto/usuario.
    CONSTRAINT uq_equipo_item_user_producto_nserie UNIQUE (user_id, producto_id, numero_serie)
);

-- Comentarios para la tabla equipo_items
COMMENT ON TABLE public.equipo_items IS 'Almacena unidades individuales (ítems) de productos, especialmente aquellos con número de serie.';
COMMENT ON COLUMN public.equipo_items.id IS 'Identificador único del ítem de equipo (UUID v4).';
COMMENT ON COLUMN public.equipo_items.user_id IS 'Referencia al usuario propietario del producto al que pertenece este ítem.';
COMMENT ON COLUMN public.equipo_items.producto_id IS 'FK al producto al que pertenece este ítem. Si se elimina el producto, se eliminan sus ítems.';
COMMENT ON COLUMN public.equipo_items.numero_serie IS 'Número de serie único para este producto y usuario (opcional, hasta 100 caracteres).';
COMMENT ON COLUMN public.equipo_items.notas_internas IS 'Notas internas para este ítem específico (hasta 1000 caracteres).';
COMMENT ON COLUMN public.equipo_items.estado IS 'Estado actual del ítem de equipo (ej: DISPONIBLE, ALQUILADO).';
COMMENT ON COLUMN public.equipo_items.fecha_compra IS 'Fecha de adquisición de este ítem específico.';
COMMENT ON COLUMN public.equipo_items.precio_compra IS 'Costo de adquisición real de este ítem específico (formato NUMERIC 10,2).';
COMMENT ON COLUMN public.equipo_items.proveedor_id IS 'FK opcional al proveedor de este ítem. Si se elimina el proveedor, este campo se establece a NULL.';
COMMENT ON COLUMN public.equipo_items.created_at IS 'Fecha y hora de creación del ítem.';
COMMENT ON COLUMN public.equipo_items.updated_at IS 'Fecha y hora de la última actualización del ítem.';

-- Habilitar RLS para la tabla equipo_items
ALTER TABLE public.equipo_items ENABLE ROW LEVEL SECURITY;

-- Política para permitir a los usuarios gestionar ítems de equipo que pertenecen a sus productos
-- (Se asume que el user_id en equipo_items es el mismo que el del producto referenciado)
DROP POLICY IF EXISTS "Permitir gestion completa de equipo_items propios" ON public.equipo_items;
CREATE POLICY "Permitir gestion completa de equipo_items propios"
    ON public.equipo_items
    FOR ALL
    TO authenticated
    USING (auth.uid() = user_id) -- Acceso basado en el user_id del ítem.
    WITH CHECK (auth.uid() = user_id);

-- Otra opción de política más estricta (requiere subconsulta o join en RLS, puede ser menos performante):
-- CREATE POLICY "Permitir gestion completa de equipo_items de productos propios"
--     ON public.equipo_items
--     FOR ALL
--     TO authenticated
--     USING (
--         (SELECT user_id FROM public.productos WHERE id = producto_id) = auth.uid()
--     )
--     WITH CHECK (
--         (SELECT user_id FROM public.productos WHERE id = producto_id) = auth.uid()
--     );


-- Trigger para actualizar automáticamente la columna updated_at en equipo_items
CREATE OR REPLACE FUNCTION public.handle_equipo_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_equipo_items_updated ON public.equipo_items;
CREATE TRIGGER on_equipo_items_updated
    BEFORE UPDATE ON public.equipo_items
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_equipo_items_updated_at();

-- Índices para la tabla equipo_items
CREATE INDEX IF NOT EXISTS idx_equipo_items_user_id ON public.equipo_items(user_id);
CREATE INDEX IF NOT EXISTS idx_equipo_items_producto_id ON public.equipo_items(producto_id);
CREATE INDEX IF NOT EXISTS idx_equipo_items_proveedor_id ON public.equipo_items(proveedor_id);
CREATE INDEX IF NOT EXISTS idx_equipo_items_numero_serie ON public.equipo_items(numero_serie);
CREATE INDEX IF NOT EXISTS idx_equipo_items_estado ON public.equipo_items(estado); 