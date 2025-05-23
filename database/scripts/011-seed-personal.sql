-- Script para agregar datos ficticios de personal
-- Reemplaza 'YOUR_USER_ID_HERE' con tu UUID de usuario real

-- Alternativa 1: Si quieres usar el usuario autenticado actual
-- INSERT INTO personal (user_id, nombre, apellidos, email, telefono, dni_nif, fecha_alta, activo, notas)
-- VALUES 
--   (auth.uid(), 'Juan', 'García López', 'juan.garcia@email.com', '600123456', '12345678A', '2024-01-15', true, 'Técnico especializado en instalaciones eléctricas'),
--   -- ... resto de registros

-- Alternativa 2: Usando un USER_ID específico (reemplaza con tu UUID real)
-- Para obtener tu USER_ID, ejecuta: SELECT auth.uid();
INSERT INTO personal (user_id, nombre, apellidos, email, telefono, dni_nif, fecha_alta, activo, notas)
VALUES 
  -- Técnicos especializados
  ('YOUR_USER_ID_HERE', 'Juan', 'García López', 'juan.garcia@email.com', '600123456', '12345678A', '2024-01-15', true, 'Técnico especializado en instalaciones eléctricas'),
  ('YOUR_USER_ID_HERE', 'María', 'Fernández Silva', 'maria.fernandez@email.com', '600234567', '87654321B', '2024-02-01', true, 'Especialista en fontanería y calefacción'),
  ('YOUR_USER_ID_HERE', 'Carlos', 'Martín Ruiz', 'carlos.martin@email.com', '600345678', '11223344C', '2024-01-20', true, 'Experto en carpintería y ebanistería'),
  ('YOUR_USER_ID_HERE', 'Ana', 'López Herrera', 'ana.lopez@email.com', '600456789', '44332211D', '2024-02-10', true, 'Técnica en pintura y decoración'),
  
  -- Personal administrativo
  ('YOUR_USER_ID_HERE', 'Pedro', 'Sánchez Moreno', 'pedro.sanchez@email.com', '600567890', '55667788E', '2024-01-05', true, 'Coordinador de proyectos y gestión de obra'),
  ('YOUR_USER_ID_HERE', 'Laura', 'González Vega', 'laura.gonzalez@email.com', '600678901', '99887766F', '2024-02-15', true, 'Responsable de presupuestos y seguimiento'),
  
  -- Operarios generales
  ('YOUR_USER_ID_HERE', 'Diego', 'Ramírez Torres', 'diego.ramirez@email.com', '600789012', '66554433G', '2024-01-25', true, 'Operario polivalente con experiencia en construcción'),
  ('YOUR_USER_ID_HERE', 'Carmen', 'Jiménez Castro', 'carmen.jimenez@email.com', '600890123', '33221100H', '2024-02-05', true, 'Especialista en limpieza y acabados'),
  
  -- Personal especializado
  ('YOUR_USER_ID_HERE', 'Roberto', 'Muñoz Delgado', 'roberto.munoz@email.com', '600901234', '77889900I', '2024-01-30', true, 'Técnico en aire acondicionado y climatización'),
  ('YOUR_USER_ID_HERE', 'Silvia', 'Romero Peña', 'silvia.romero@email.com', '600012345', '00998877J', '2024-02-20', true, 'Diseñadora de interiores y asesora'),
  
  -- Personal de apoyo
  ('YOUR_USER_ID_HERE', 'Francisco', 'Guerrero León', 'francisco.guerrero@email.com', '600123789', '22334455K', '2024-01-10', true, 'Conductor y transportista especializado'),
  ('YOUR_USER_ID_HERE', 'Isabel', 'Vargas Molina', 'isabel.vargas@email.com', '600234890', '55443322L', '2024-02-12', true, 'Auxiliar administrativa y atención al cliente'),
  
  -- Algunos inactivos para testing
  ('YOUR_USER_ID_HERE', 'Miguel', 'Cruz Ortega', 'miguel.cruz@email.com', '600345901', '88776655M', '2023-12-15', false, 'Personal de baja temporal por formación'),
  ('YOUR_USER_ID_HERE', 'Elena', 'Navarro Ramos', 'elena.navarro@email.com', '600456012', '11009988N', '2023-11-20', false, 'Finalización de contrato estacional'),
  
  -- Personal sin algunos datos opcionales (para testing)
  ('YOUR_USER_ID_HERE', 'Alberto', 'Morales', NULL, '600567123', NULL, '2024-02-25', true, 'Técnico recién incorporado'),
  ('YOUR_USER_ID_HERE', 'Cristina', NULL, 'cristina.solo@email.com', NULL, '99001122O', '2024-02-28', true, NULL);

-- Para verificar los datos insertados:
-- SELECT * FROM personal WHERE user_id = 'YOUR_USER_ID_HERE' ORDER BY nombre; 