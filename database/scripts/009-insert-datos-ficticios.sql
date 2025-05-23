-- =====================================================
-- Script 009b: Insertar datos ficticios para Servicios y Puestos de Trabajo
-- =====================================================

-- ⚠️ IMPORTANTE: Reemplaza 'YOUR_USER_ID' con tu UUID real
-- Para obtenerlo ejecuta: SELECT auth.uid();

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
    RAISE NOTICE 'Servicios insertados: 8';
    RAISE NOTICE 'Puestos de trabajo insertados: 10';
END $$;

-- Verificar que los datos se insertaron correctamente
SELECT 'SERVICIOS' as tabla, COUNT(*) as total FROM public.servicios
UNION ALL
SELECT 'PUESTOS_TRABAJO' as tabla, COUNT(*) as total FROM public.puestos_trabajo;

-- Ver algunos ejemplos de los datos insertados
SELECT 'Servicios más baratos' as categoria, nombre, precio_dia 
FROM public.servicios 
ORDER BY precio_dia ASC 
LIMIT 3;

SELECT 'Puestos mejor pagados' as categoria, nombre, precio_dia 
FROM public.puestos_trabajo 
ORDER BY precio_dia DESC 
LIMIT 3; 