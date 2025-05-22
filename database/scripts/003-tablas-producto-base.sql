-- Script para crear tablas base del módulo de productos: marcas y categorias_producto

-- Tabla de Marcas de Productos
CREATE TABLE IF NOT EXISTS public.marcas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    nombre TEXT NOT NULL CHECK (char_length(nombre) >= 2 AND char_length(nombre) <= 100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_user_marca_nombre UNIQUE (user_id, nombre)
);

-- Comentarios para la tabla marcas
COMMENT ON TABLE public.marcas IS 'Almacena las marcas de los productos, específicas por usuario.';
COMMENT ON COLUMN public.marcas.id IS 'Identificador único de la marca (UUID v4).';
COMMENT ON COLUMN public.marcas.user_id IS 'Referencia al usuario propietario de la marca.';
COMMENT ON COLUMN public.marcas.nombre IS 'Nombre de la marca (de 2 a 100 caracteres). Único por usuario.';
COMMENT ON COLUMN public.marcas.created_at IS 'Fecha y hora de creación de la marca.';
COMMENT ON COLUMN public.marcas.updated_at IS 'Fecha y hora de la última actualización de la marca.';

-- Habilitar RLS para la tabla marcas
ALTER TABLE public.marcas ENABLE ROW LEVEL SECURITY;

-- Política para permitir a los usuarios gestionar (SELECT, INSERT, UPDATE, DELETE) sus propias marcas
DROP POLICY IF EXISTS "Permitir gestion completa de marcas propias" ON public.marcas;
CREATE POLICY "Permitir gestion completa de marcas propias"
    ON public.marcas
    FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Trigger para actualizar automáticamente la columna updated_at en marcas
CREATE OR REPLACE FUNCTION public.handle_marcas_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_marcas_updated ON public.marcas;
CREATE TRIGGER on_marcas_updated
    BEFORE UPDATE ON public.marcas
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_marcas_updated_at();

-- Índices para marcas
CREATE INDEX IF NOT EXISTS idx_marcas_user_id ON public.marcas(user_id);

--------------------------------------------------------------------------------

-- Tabla de Categorías de Productos
CREATE TABLE IF NOT EXISTS public.categorias_producto (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    nombre TEXT NOT NULL CHECK (char_length(nombre) >= 2 AND char_length(nombre) <= 100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_user_categoria_producto_nombre UNIQUE (user_id, nombre)
);

-- Comentarios para la tabla categorias_producto
COMMENT ON TABLE public.categorias_producto IS 'Almacena las categorías de los productos, específicas por usuario.';
COMMENT ON COLUMN public.categorias_producto.id IS 'Identificador único de la categoría (UUID v4).';
COMMENT ON COLUMN public.categorias_producto.user_id IS 'Referencia al usuario propietario de la categoría.';
COMMENT ON COLUMN public.categorias_producto.nombre IS 'Nombre de la categoría (de 2 a 100 caracteres). Único por usuario.';
COMMENT ON COLUMN public.categorias_producto.created_at IS 'Fecha y hora de creación de la categoría.';
COMMENT ON COLUMN public.categorias_producto.updated_at IS 'Fecha y hora de la última actualización de la categoría.';

-- Habilitar RLS para la tabla categorias_producto
ALTER TABLE public.categorias_producto ENABLE ROW LEVEL SECURITY;

-- Política para permitir a los usuarios gestionar (SELECT, INSERT, UPDATE, DELETE) sus propias categorías de producto
DROP POLICY IF EXISTS "Permitir gestion completa de categorias_producto propias" ON public.categorias_producto;
CREATE POLICY "Permitir gestion completa de categorias_producto propias"
    ON public.categorias_producto
    FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Trigger para actualizar automáticamente la columna updated_at en categorias_producto
CREATE OR REPLACE FUNCTION public.handle_categorias_producto_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_categorias_producto_updated ON public.categorias_producto;
CREATE TRIGGER on_categorias_producto_updated
    BEFORE UPDATE ON public.categorias_producto
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_categorias_producto_updated_at();

-- Índices para categorias_producto
CREATE INDEX IF NOT EXISTS idx_categorias_producto_user_id ON public.categorias_producto(user_id);


-- Opcional: insertar algunas marcas y categorías de ejemplo (descomentar y adaptar si es necesario)
/*
WITH new_user AS (
    SELECT id FROM auth.users WHERE email = 'tu_email_de_prueba@example.com' -- Reemplazar con un email de usuario existente
)
INSERT INTO public.marcas (user_id, nombre)
SELECT (SELECT id FROM new_user), unnest(ARRAY['Sony', 'Canon', 'Nikon', 'Apple', 'Samsung', 'LG'])
ON CONFLICT (user_id, nombre) DO NOTHING;

WITH new_user AS (
    SELECT id FROM auth.users WHERE email = 'tu_email_de_prueba@example.com' -- Reemplazar con un email de usuario existente
)
INSERT INTO public.categorias_producto (user_id, nombre)
SELECT (SELECT id FROM new_user), unnest(ARRAY['Cámaras', 'Objetivos', 'Iluminación', 'Sonido', 'Ordenadores', 'Monitores'])
ON CONFLICT (user_id, nombre) DO NOTHING;
*/


-- PRINT 'Script 003-tablas-producto-base.sql ejecutado correctamente.'; -- Eliminado, no es SQL estándar de PostgreSQL 