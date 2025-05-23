-- =====================================================
-- Script 009: Crear tablas de Servicios y Puestos de Trabajo
-- =====================================================

-- 1. CREAR TABLA SERVICIOS
-- =====================================================
CREATE TABLE IF NOT EXISTS public.servicios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    precio_dia DECIMAL(10,2) NOT NULL CHECK (precio_dia >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    
    -- Constraints
    CONSTRAINT uq_servicio_user_nombre UNIQUE (user_id, nombre)
);

-- 2. CREAR TABLA PUESTOS DE TRABAJO
-- =====================================================
CREATE TABLE IF NOT EXISTS public.puestos_trabajo (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    precio_dia DECIMAL(10,2) NOT NULL CHECK (precio_dia >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    
    -- Constraints
    CONSTRAINT uq_puesto_user_nombre UNIQUE (user_id, nombre)
);

-- 3. HABILITAR RLS
-- =====================================================
ALTER TABLE public.servicios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.puestos_trabajo ENABLE ROW LEVEL SECURITY;

-- 4. CREAR POLÍTICAS RLS PARA SERVICIOS
-- =====================================================
-- Política para SELECT
CREATE POLICY "Los usuarios pueden ver sus propios servicios"
    ON public.servicios FOR SELECT
    USING (auth.uid() = user_id);

-- Política para INSERT
CREATE POLICY "Los usuarios pueden crear servicios"
    ON public.servicios FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Política para UPDATE
CREATE POLICY "Los usuarios pueden actualizar sus propios servicios"
    ON public.servicios FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Política para DELETE
CREATE POLICY "Los usuarios pueden eliminar sus propios servicios"
    ON public.servicios FOR DELETE
    USING (auth.uid() = user_id);

-- 5. CREAR POLÍTICAS RLS PARA PUESTOS DE TRABAJO
-- =====================================================
-- Política para SELECT
CREATE POLICY "Los usuarios pueden ver sus propios puestos de trabajo"
    ON public.puestos_trabajo FOR SELECT
    USING (auth.uid() = user_id);

-- Política para INSERT
CREATE POLICY "Los usuarios pueden crear puestos de trabajo"
    ON public.puestos_trabajo FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Política para UPDATE
CREATE POLICY "Los usuarios pueden actualizar sus propios puestos de trabajo"
    ON public.puestos_trabajo FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Política para DELETE
CREATE POLICY "Los usuarios pueden eliminar sus propios puestos de trabajo"
    ON public.puestos_trabajo FOR DELETE
    USING (auth.uid() = user_id);

-- 6. CREAR TRIGGERS PARA UPDATED_AT
-- =====================================================
-- Trigger para servicios
CREATE OR REPLACE FUNCTION update_servicios_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_servicios_updated_at
    BEFORE UPDATE ON public.servicios
    FOR EACH ROW
    EXECUTE FUNCTION update_servicios_updated_at();

-- Trigger para puestos de trabajo
CREATE OR REPLACE FUNCTION update_puestos_trabajo_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_puestos_trabajo_updated_at
    BEFORE UPDATE ON public.puestos_trabajo
    FOR EACH ROW
    EXECUTE FUNCTION update_puestos_trabajo_updated_at();

-- 7. CREAR ÍNDICES PARA RENDIMIENTO
-- =====================================================
-- Índices para servicios
CREATE INDEX IF NOT EXISTS idx_servicios_user_id ON public.servicios(user_id);
CREATE INDEX IF NOT EXISTS idx_servicios_nombre ON public.servicios(user_id, nombre);

-- Índices para puestos de trabajo
CREATE INDEX IF NOT EXISTS idx_puestos_trabajo_user_id ON public.puestos_trabajo(user_id);
CREATE INDEX IF NOT EXISTS idx_puestos_trabajo_nombre ON public.puestos_trabajo(user_id, nombre);

-- =====================================================
-- DATOS FICTICIOS (Solo para desarrollo/testing)
-- =====================================================

-- NOTA: Para agregar datos ficticios, necesitas reemplazar 'YOUR_USER_ID' 
-- con tu UUID de usuario real. Puedes obtenerlo con:
-- SELECT auth.uid();

-- Ejemplo de cómo agregar datos ficticios una vez que tengas tu user_id:

/*
-- Reemplaza 'YOUR_USER_ID' con tu UUID real
DO $$
DECLARE 
    demo_user_id UUID := 'YOUR_USER_ID'; -- ⚠️ CAMBIAR POR TU USER_ID REAL
BEGIN
    -- INSERTAR SERVICIOS FICTICIOS
    INSERT INTO public.servicios (user_id, nombre, descripcion, precio_dia) VALUES
    (demo_user_id, 'Transporte Especializado', 'Transporte de equipamiento audiovisual con vehículo especializado y seguros', 150.00),
    (demo_user_id, 'Servidor Streaming', 'Servidor dedicado para streaming en vivo multi-plataforma', 200.00),
    (demo_user_id, 'Edición de Video', 'Edición profesional de video con corrección de color y audio', 300.00),
    (demo_user_id, 'Post-Producción Avanzada', 'Colorización, efectos visuales y masterización de audio', 450.00),
    (demo_user_id, 'Preparación Técnica', 'Setup y preparación técnica del evento antes del inicio', 180.00),
    (demo_user_id, 'Backup de Datos', 'Servicio de backup en tiempo real durante la grabación', 100.00),
    (demo_user_id, 'Streaming Multi-Plataforma', 'Configuración y gestión de streaming simultáneo en múltiples plataformas', 250.00),
    (demo_user_id, 'Montaje de Equipos', 'Montaje y desmontaje profesional de equipamiento técnico', 120.00);

    -- INSERTAR PUESTOS DE TRABAJO FICTICIOS
    INSERT INTO public.puestos_trabajo (user_id, nombre, descripcion, precio_dia) VALUES
    (demo_user_id, 'Operador de Cámara', 'Operador especializado en cámaras profesionales y movimientos de cámara', 300.00),
    (demo_user_id, 'Técnico de Sonido', 'Técnico especializado en captación y mezcla de audio en directo', 250.00),
    (demo_user_id, 'Realizador', 'Director técnico y realizador para eventos en directo', 400.00),
    (demo_user_id, 'Director de Fotografía', 'Director de fotografía especializado en iluminación y composición', 450.00),
    (demo_user_id, 'Técnico de Iluminación', 'Especialista en diseño e implementación de iluminación profesional', 280.00),
    (demo_user_id, 'Operador de Grúa', 'Operador certificado para grúas y equipamiento de movimiento de cámara', 350.00),
    (demo_user_id, 'Técnico de Streaming', 'Especialista en configuración y monitoreo de streaming en vivo', 220.00),
    (demo_user_id, 'Asistente de Producción', 'Asistente general de producción y coordinación técnica', 150.00),
    (demo_user_id, 'Editor en Vivo', 'Editor especializado en edición y switching en tiempo real', 320.00),
    (demo_user_id, 'Técnico de Drones', 'Piloto certificado para operaciones con drones profesionales', 380.00);

    RAISE NOTICE 'Datos ficticios insertados correctamente para user_id: %', demo_user_id;
END $$;
*/

-- =====================================================
-- COMENTARIOS FINALES
-- =====================================================

-- Para obtener tu user_id y agregar datos ficticios:
-- 1. Ejecuta: SELECT auth.uid();
-- 2. Copia el UUID que te devuelve
-- 3. Reemplaza 'YOUR_USER_ID' en el bloque DO $$ de arriba
-- 4. Descomenta y ejecuta el bloque DO $$

-- Verificar que las tablas se crearon correctamente:
-- SELECT * FROM public.servicios;
-- SELECT * FROM public.puestos_trabajo; 