-- Tabla de pagos de clientes vinculados a proyectos
CREATE TABLE IF NOT EXISTS client_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  concept TEXT NOT NULL,
  payment_method TEXT CHECK (payment_method IN ('efectivo', 'transferencia', 'tarjeta', 'cheque', 'otro')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_client_payments_project_id ON client_payments(project_id);
CREATE INDEX IF NOT EXISTS idx_client_payments_user_id ON client_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_client_payments_date ON client_payments(payment_date);

-- Políticas RLS
ALTER TABLE client_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Los usuarios pueden ver sus propios pagos"
  ON client_payments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Los usuarios pueden crear pagos"
  ON client_payments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Los usuarios pueden actualizar sus propios pagos"
  ON client_payments FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Los usuarios pueden eliminar sus propios pagos"
  ON client_payments FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_client_payments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER client_payments_updated_at
  BEFORE UPDATE ON client_payments
  FOR EACH ROW
  EXECUTE FUNCTION update_client_payments_updated_at();
