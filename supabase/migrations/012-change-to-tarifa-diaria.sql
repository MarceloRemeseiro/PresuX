-- Cambiar tarifa_por_hora a tarifa_por_dia
-- Como las tarifas por hora eran calculadas desde precio_dia / 8, 
-- necesitamos multiplicar por 8 para mantener los valores existentes

-- Primero agregar la nueva columna
ALTER TABLE personal_puestos_trabajo 
ADD COLUMN tarifa_por_dia DECIMAL(10,2);

-- Convertir valores existentes (tarifa_por_hora * 8 = tarifa_por_dia)
UPDATE personal_puestos_trabajo 
SET tarifa_por_dia = COALESCE(tarifa_por_hora * 8, 0)
WHERE tarifa_por_hora IS NOT NULL;

-- Eliminar la columna antigua
ALTER TABLE personal_puestos_trabajo 
DROP COLUMN tarifa_por_hora;

-- Agregar comentario para claridad
COMMENT ON COLUMN personal_puestos_trabajo.tarifa_por_dia IS 'Tarifa diaria específica para este personal en este puesto'; 