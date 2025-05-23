-- Script para sincronizar el stock de productos con la cantidad real de equipo_items
-- y crear triggers para mantenerlo automáticamente

-- 1. Función para actualizar el stock de un producto basado en sus items
CREATE OR REPLACE FUNCTION update_producto_stock(producto_id_param UUID)
RETURNS VOID AS $$
DECLARE
    item_count INTEGER;
BEGIN
    -- Contar los items del producto
    SELECT COUNT(*) INTO item_count
    FROM equipo_items 
    WHERE producto_id = producto_id_param;
    
    -- Actualizar el stock del producto
    UPDATE productos 
    SET stock = item_count, updated_at = NOW()
    WHERE id = producto_id_param;
END;
$$ LANGUAGE plpgsql;

-- 2. Función trigger para actualizar stock automáticamente
CREATE OR REPLACE FUNCTION trigger_update_producto_stock()
RETURNS TRIGGER AS $$
BEGIN
    -- Si es INSERT o DELETE, usar el producto_id correspondiente
    IF TG_OP = 'INSERT' THEN
        PERFORM update_producto_stock(NEW.producto_id);
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        PERFORM update_producto_stock(OLD.producto_id);
        RETURN OLD;
    ELSIF TG_OP = 'UPDATE' THEN
        -- Si cambió el producto_id, actualizar ambos productos
        IF OLD.producto_id != NEW.producto_id THEN
            PERFORM update_producto_stock(OLD.producto_id);
            PERFORM update_producto_stock(NEW.producto_id);
        ELSE
            PERFORM update_producto_stock(NEW.producto_id);
        END IF;
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 3. Crear triggers en la tabla equipo_items
DROP TRIGGER IF EXISTS trigger_equipo_items_stock_sync ON equipo_items;
CREATE TRIGGER trigger_equipo_items_stock_sync
    AFTER INSERT OR UPDATE OR DELETE ON equipo_items
    FOR EACH ROW
    EXECUTE FUNCTION trigger_update_producto_stock();

-- 4. Sincronizar todo el stock existente (corregir inconsistencias)
UPDATE productos 
SET stock = (
    SELECT COUNT(*) 
    FROM equipo_items 
    WHERE equipo_items.producto_id = productos.id
),
updated_at = NOW();

-- 5. Comentarios
COMMENT ON FUNCTION update_producto_stock(UUID) IS 'Actualiza el stock de un producto basado en la cantidad de equipo_items';
COMMENT ON FUNCTION trigger_update_producto_stock() IS 'Función trigger para mantener sincronizado el stock automáticamente';

-- 6. Verificar que todo quedó correctamente
SELECT 
    p.id,
    p.nombre,
    p.stock as stock_actual,
    COUNT(ei.id) as items_reales,
    CASE 
        WHEN p.stock = COUNT(ei.id) THEN 'OK'
        ELSE 'INCONSISTENTE'
    END as estado
FROM productos p
LEFT JOIN equipo_items ei ON ei.producto_id = p.id
GROUP BY p.id, p.nombre, p.stock
ORDER BY p.nombre; 