-- Script para crear la tabla productos

CREATE TABLE IF NOT EXISTS public.productos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    nombre TEXT NOT NULL CHECK (char_length(nombre) >= 3 AND char_length(nombre) <= 200),
    descripcion TEXT CHECK (char_length(descripcion) <= 1000),
    stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
    precio NUMERIC(10, 2) NOT NULL CHECK (precio >= 0),
    categoria_id UUID NOT NULL REFERENCES public.categorias_producto(id) ON DELETE RESTRICT,
    marca_id UUID REFERENCES public.marcas(id) ON DELETE SET NULL,
    modelo TEXT CHECK (char_length(modelo) <= 100),
    precio_alquiler_dia NUMERIC(10, 2) CHECK (precio_alquiler_dia >= 0),
    precio_compra_referencia NUMERIC(10, 2) CHECK (precio_compra_referencia >= 0),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_productos_user_nombre UNIQUE (user_id, nombre) -- Unicidad por nombre de producto para el mismo usuario
);

-- Comentarios para la tabla productos
COMMENT ON TABLE public.productos IS 'Almacena los productos ofrecidos, específicos por usuario.';
COMMENT ON COLUMN public.productos.id IS 'Identificador único del producto (UUID v4).';
COMMENT ON COLUMN public.productos.user_id IS 'Referencia al usuario propietario del producto.';
COMMENT ON COLUMN public.productos.nombre IS 'Nombre del producto (de 3 a 200 caracteres). Único por usuario.';
COMMENT ON COLUMN public.productos.descripcion IS 'Descripción detallada del producto (hasta 1000 caracteres).';
COMMENT ON COLUMN public.productos.stock IS 'Cantidad en stock del producto. Para productos serializados, este podría ser un conteo derivado.';
COMMENT ON COLUMN public.productos.precio IS 'Precio de venta de referencia del producto (formato NUMERIC 10,2).';
COMMENT ON COLUMN public.productos.categoria_id IS 'FK a la tabla categorias_producto. No se puede eliminar la categoría si hay productos asociados.';
COMMENT ON COLUMN public.productos.marca_id IS 'FK opcional a la tabla marcas. Si se elimina la marca, este campo se establece a NULL.';
COMMENT ON COLUMN public.productos.modelo IS 'Modelo específico del producto (hasta 100 caracteres).';
COMMENT ON COLUMN public.productos.precio_alquiler_dia IS 'Precio de alquiler del producto por unidad de tiempo (formato NUMERIC 10,2).';
COMMENT ON COLUMN public.productos.precio_compra_referencia IS 'Precio de compra de referencia para este tipo de producto (formato NUMERIC 10,2).';
COMMENT ON COLUMN public.productos.created_at IS 'Fecha y hora de creación del producto.';
COMMENT ON COLUMN public.productos.updated_at IS 'Fecha y hora de la última actualización del producto.';

-- Habilitar RLS para la tabla productos
ALTER TABLE public.productos ENABLE ROW LEVEL SECURITY;

-- Política para permitir a los usuarios gestionar (SELECT, INSERT, UPDATE, DELETE) sus propios productos
DROP POLICY IF EXISTS "Permitir gestion completa de productos propios" ON public.productos;
CREATE POLICY "Permitir gestion completa de productos propios"
    ON public.productos
    FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Trigger para actualizar automáticamente la columna updated_at en productos
CREATE OR REPLACE FUNCTION public.handle_productos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_productos_updated ON public.productos;
CREATE TRIGGER on_productos_updated
    BEFORE UPDATE ON public.productos
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_productos_updated_at();

-- Índices para la tabla productos
CREATE INDEX IF NOT EXISTS idx_productos_user_id ON public.productos(user_id);
CREATE INDEX IF NOT EXISTS idx_productos_categoria_id ON public.productos(categoria_id);
CREATE INDEX IF NOT EXISTS idx_productos_marca_id ON public.productos(marca_id);
CREATE INDEX IF NOT EXISTS idx_productos_nombre ON public.productos(nombre); -- Para búsquedas por nombre 