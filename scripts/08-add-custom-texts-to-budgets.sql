-- Añadir campos de texto personalizables a la tabla budgets
-- Estos campos permiten personalizar la introducción y notas por presupuesto
-- Si son NULL, se usarán los valores por defecto de budget_settings

ALTER TABLE budgets
ADD COLUMN IF NOT EXISTS custom_introduction_text TEXT,
ADD COLUMN IF NOT EXISTS custom_additional_notes TEXT;

-- Comentarios para documentar las columnas
COMMENT ON COLUMN budgets.custom_introduction_text IS 'Texto de introducción personalizado para este presupuesto. Si es NULL, se usa el texto por defecto de budget_settings';
COMMENT ON COLUMN budgets.custom_additional_notes IS 'Notas aclaratorias personalizadas para este presupuesto. Si es NULL, se usan las notas por defecto de budget_settings';
