-- Insertar datos ficticios de personal
-- Nota: Usa el user_id del usuario autenticado actual o uno ficticio para desarrollo

-- Insertar personal de ejemplo (estos IDs son ficticios, ajusta según necesidad)
INSERT INTO personal (id, user_id, nombre, apellidos, email, telefono, dni_nif, notas) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', '00000000-0000-0000-0000-000000000000', 'Carlos', 'Martínez López', 'carlos.martinez@email.com', '666123456', '12345678A', 'Técnico especialista en electricidad'),
  ('550e8400-e29b-41d4-a716-446655440002', '00000000-0000-0000-0000-000000000000', 'Ana', 'García Rodríguez', 'ana.garcia@email.com', '666234567', '23456789B', 'Administrativa con experiencia en facturación'),
  ('550e8400-e29b-41d4-a716-446655440003', '00000000-0000-0000-0000-000000000000', 'Miguel', 'Fernández Torres', 'miguel.fernandez@email.com', '666345678', '34567890C', 'Operario de construcción con 10 años de experiencia'),
  ('550e8400-e29b-41d4-a716-446655440004', '00000000-0000-0000-0000-000000000000', 'Laura', 'Sánchez Pérez', 'laura.sanchez@email.com', '666456789', '45678901D', 'Contable titulada'),
  ('550e8400-e29b-41d4-a716-446655440005', '00000000-0000-0000-0000-000000000000', 'David', 'Ruiz Moreno', 'david.ruiz@email.com', '666567890', '56789012E', 'Fontanero oficial de primera'),
  ('550e8400-e29b-41d4-a716-446655440006', '00000000-0000-0000-0000-000000000000', 'Carmen', 'Jiménez Vega', 'carmen.jimenez@email.com', '666678901', '67890123F', 'Arquitecta técnica'),
  ('550e8400-e29b-41d4-a716-446655440007', '00000000-0000-0000-0000-000000000000', 'Pablo', 'Morales Castro', 'pablo.morales@email.com', '666789012', '78901234G', 'Soldador especializado'),
  ('550e8400-e29b-41d4-a716-446655440008', '00000000-0000-0000-0000-000000000000', 'Isabel', 'Romero Díaz', 'isabel.romero@email.com', '666890123', '89012345H', 'Secretaria de dirección'),
  ('550e8400-e29b-41d4-a716-446655440009', '00000000-0000-0000-0000-000000000000', 'Javier', 'Herrera Luna', 'javier.herrera@email.com', '666901234', '90123456I', 'Conductor de maquinaria pesada'),
  ('550e8400-e29b-41d4-a716-446655440010', '00000000-0000-0000-0000-000000000000', 'Teresa', 'Vargas Prieto', 'teresa.vargas@email.com', '666012345', '01234567J', 'Ingeniera industrial'),
  ('550e8400-e29b-41d4-a716-446655440011', '00000000-0000-0000-0000-000000000000', 'Roberto', 'Castillo Ramos', 'roberto.castillo@email.com', '666123450', '12345670K', 'Albañil con certificación'),
  ('550e8400-e29b-41d4-a716-446655440012', '00000000-0000-0000-0000-000000000000', 'Silvia', 'Ortega Núñez', 'silvia.ortega@email.com', '666234501', '23456701L', 'Diseñadora gráfica'),
  ('550e8400-e29b-41d4-a716-446655440013', '00000000-0000-0000-0000-000000000000', 'Fernando', 'Delgado Silva', 'fernando.delgado@email.com', '666345012', '34567012M', 'Pintor profesional'),
  ('550e8400-e29b-41d4-a716-446655440014', '00000000-0000-0000-0000-000000000000', 'Mónica', 'Reyes Aguilar', 'monica.reyes@email.com', '666450123', '45670123N', 'Recepcionista multiidioma'),
  ('550e8400-e29b-41d4-a716-446655440015', '00000000-0000-0000-0000-000000000000', 'Antonio', 'Mendoza Flores', 'antonio.mendoza@email.com', '666501234', '56701234O', 'Carpintero ebanista'),
  ('550e8400-e29b-41d4-a716-446655440016', '00000000-0000-0000-0000-000000000000', 'Beatriz', 'Peña Rubio', 'beatriz.pena@email.com', '666612345', '67012345P', 'Decoradora de interiores');

-- Nota: Los datos incluyen una mezcla de:
-- - Personal técnico (electricistas, fontaneros, soldadores, etc.)
-- - Personal administrativo (contables, secretarias, recepcionistas)
-- - Personal operario (albañiles, pintores, carpinteros)
-- - Personal especializado (arquitectas, ingenieras, diseñadoras)
--
-- Para usar en producción:
-- 1. Reemplaza el user_id '00000000-0000-0000-0000-000000000000' por el ID real del usuario
-- 2. Ajusta los datos según tu equipo real
-- 3. Considera eliminar algunos registros si no necesitas tantos datos de prueba 