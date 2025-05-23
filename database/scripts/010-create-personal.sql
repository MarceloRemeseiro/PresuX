-- Script para crear las tablas del módulo Personal
-- Ejecutar después de tener puestos_trabajo creados

-- Tabla principal de personal
CREATE TABLE IF NOT EXISTS personal (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre VARCHAR(100) NOT NULL,
  apellidos VARCHAR(100),
  email VARCHAR(255),
  telefono VARCHAR(20),
  dni_nif VARCHAR(20),
  fecha_alta DATE DEFAULT CURRENT_DATE,
  activo BOOLEAN DEFAULT true,
  notas TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla intermedia para la relación many-to-many entre personal y puestos de trabajo
CREATE TABLE IF NOT EXISTS personal_puestos_trabajo (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  personal_id UUID NOT NULL REFERENCES personal(id) ON DELETE CASCADE,
  puesto_trabajo_id UUID NOT NULL REFERENCES puestos_trabajo(id) ON DELETE CASCADE,
  fecha_asignacion DATE DEFAULT CURRENT_DATE,
  tarifa_por_hora DECIMAL(10,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Evitar duplicados: un personal no puede tener el mismo puesto asignado dos veces
  UNIQUE(personal_id, puesto_trabajo_id)
);

-- Índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_personal_user_id ON personal(user_id);
CREATE INDEX IF NOT EXISTS idx_personal_activo ON personal(activo);
CREATE INDEX IF NOT EXISTS idx_personal_puestos_personal_id ON personal_puestos_trabajo(personal_id);
CREATE INDEX IF NOT EXISTS idx_personal_puestos_puesto_id ON personal_puestos_trabajo(puesto_trabajo_id);

-- RLS (Row Level Security)
ALTER TABLE personal ENABLE ROW LEVEL SECURITY;
ALTER TABLE personal_puestos_trabajo ENABLE ROW LEVEL SECURITY;

-- Políticas para personal
CREATE POLICY "Los usuarios solo pueden ver su propio personal" ON personal
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Los usuarios solo pueden insertar su propio personal" ON personal
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Los usuarios solo pueden actualizar su propio personal" ON personal
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Los usuarios solo pueden eliminar su propio personal" ON personal
  FOR DELETE USING (auth.uid() = user_id);

-- Políticas para personal_puestos_trabajo
CREATE POLICY "Los usuarios solo pueden ver asignaciones de su propio personal" ON personal_puestos_trabajo
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM personal 
      WHERE personal.id = personal_puestos_trabajo.personal_id 
      AND personal.user_id = auth.uid()
    )
  );

CREATE POLICY "Los usuarios solo pueden insertar asignaciones para su propio personal" ON personal_puestos_trabajo
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM personal 
      WHERE personal.id = personal_puestos_trabajo.personal_id 
      AND personal.user_id = auth.uid()
    )
  );

CREATE POLICY "Los usuarios solo pueden actualizar asignaciones de su propio personal" ON personal_puestos_trabajo
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM personal 
      WHERE personal.id = personal_puestos_trabajo.personal_id 
      AND personal.user_id = auth.uid()
    )
  );

CREATE POLICY "Los usuarios solo pueden eliminar asignaciones de su propio personal" ON personal_puestos_trabajo
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM personal 
      WHERE personal.id = personal_puestos_trabajo.personal_id 
      AND personal.user_id = auth.uid()
    )
  );

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_personal_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER personal_updated_at_trigger
  BEFORE UPDATE ON personal
  FOR EACH ROW
  EXECUTE FUNCTION update_personal_updated_at();

CREATE TRIGGER personal_puestos_trabajo_updated_at_trigger
  BEFORE UPDATE ON personal_puestos_trabajo
  FOR EACH ROW
  EXECUTE FUNCTION update_personal_updated_at(); 