-- Crear tabla de personal
CREATE TABLE IF NOT EXISTS personal (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre VARCHAR(100) NOT NULL,
  apellidos VARCHAR(100),
  email VARCHAR(255),
  telefono VARCHAR(20),
  dni_nif VARCHAR(20),
  notas TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla de relación personal_puestos_trabajo
CREATE TABLE IF NOT EXISTS personal_puestos_trabajo (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  personal_id UUID NOT NULL REFERENCES personal(id) ON DELETE CASCADE,
  puesto_trabajo_id UUID NOT NULL REFERENCES puestos_trabajo(id) ON DELETE CASCADE,
  fecha_asignacion TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  tarifa_por_hora DECIMAL(10,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Evitar duplicados de la misma asignación
  UNIQUE(personal_id, puesto_trabajo_id)
);

-- Índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_personal_user_id ON personal(user_id);
CREATE INDEX IF NOT EXISTS idx_personal_nombre ON personal(nombre);
CREATE INDEX IF NOT EXISTS idx_personal_email ON personal(email);
CREATE INDEX IF NOT EXISTS idx_personal_dni_nif ON personal(dni_nif);

CREATE INDEX IF NOT EXISTS idx_personal_puestos_personal_id ON personal_puestos_trabajo(personal_id);
CREATE INDEX IF NOT EXISTS idx_personal_puestos_puesto_id ON personal_puestos_trabajo(puesto_trabajo_id);

-- RLS (Row Level Security)
ALTER TABLE personal ENABLE ROW LEVEL SECURITY;
ALTER TABLE personal_puestos_trabajo ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para personal
CREATE POLICY "Users can view their own personal"
  ON personal FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own personal"
  ON personal FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own personal"
  ON personal FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own personal"
  ON personal FOR DELETE
  USING (auth.uid() = user_id);

-- Políticas RLS para personal_puestos_trabajo
CREATE POLICY "Users can view their own personal_puestos_trabajo"
  ON personal_puestos_trabajo FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM personal 
      WHERE personal.id = personal_puestos_trabajo.personal_id 
      AND personal.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own personal_puestos_trabajo"
  ON personal_puestos_trabajo FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM personal 
      WHERE personal.id = personal_puestos_trabajo.personal_id 
      AND personal.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own personal_puestos_trabajo"
  ON personal_puestos_trabajo FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM personal 
      WHERE personal.id = personal_puestos_trabajo.personal_id 
      AND personal.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM personal 
      WHERE personal.id = personal_puestos_trabajo.personal_id 
      AND personal.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own personal_puestos_trabajo"
  ON personal_puestos_trabajo FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM personal 
      WHERE personal.id = personal_puestos_trabajo.personal_id 
      AND personal.user_id = auth.uid()
    )
  );

-- Triggers para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_personal_updated_at
  BEFORE UPDATE ON personal
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_personal_puestos_trabajo_updated_at
  BEFORE UPDATE ON personal_puestos_trabajo
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column(); 