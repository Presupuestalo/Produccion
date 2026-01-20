-- Añadir material de suelo laminado a la base de datos
-- Código: 08-M-24 - SUELO LAMINADO

INSERT INTO price_master (
  id,
  code,
  category_id,
  subcategory,
  description,
  unit,
  labor_cost,
  material_cost,
  is_active
) VALUES
  (
    gen_random_uuid(),
    '08-M-24',
    8,
    'SUELO LAMINADO',
    'Coste del metro cuadrado de suelo laminado tipo click.',
    'm²',
    0.00,
    25.00,
    true
  );
