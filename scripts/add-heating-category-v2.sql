-- Añadir categoría CALEFACCIÓN y sus partidas
DO $$
DECLARE
  calefaccion_category_id UUID;
BEGIN
  -- Crear la categoría CALEFACCIÓN
  INSERT INTO price_categories (name, description, icon, display_order, is_active)
  VALUES (
    'CALEFACCIÓN',
    'Instalación y configuración de sistemas de calefacción',
    'Flame',
    6,
    true
  )
  RETURNING id INTO calefaccion_category_id;

  -- Añadiendo gen_random_uuid() para generar IDs automáticamente
  -- Insertar partidas de calefacción
  INSERT INTO price_master (
    id, code, category_id, subcategory, description, unit,
    labor_cost, material_cost, equipment_cost, other_cost,
    is_custom, user_id
  ) VALUES
  -- 06-CAL-010: Instalación de radiador eléctrico
  (
    gen_random_uuid(),
    '06-CAL-010',
    calefaccion_category_id,
    'Radiadores',
    'INSTALACIÓN DE RADIADOR ELÉCTRICO',
    'ud',
    40.00,
    17.00,
    0,
    0,
    false,
    NULL
  ),
  -- 06-CAL-020: Resolución de acometida de gas en desplazamiento
  (
    gen_random_uuid(),
    '06-CAL-020',
    calefaccion_category_id,
    'Gas',
    'RESOLUCIÓN DE ACOMETIDA DE GAS-IN DESPLAZAMIENTO',
    'ud',
    40.00,
    17.00,
    0,
    0,
    false,
    NULL
  ),
  -- 06-CAL-030: Colocación caldera de gas (Montaje MO)
  (
    gen_random_uuid(),
    '06-CAL-030',
    calefaccion_category_id,
    'Calderas',
    'COLOCACIÓN CALDERA DE GAS (Montaje MO)',
    'ud',
    383.00,
    164.00,
    0,
    0,
    false,
    NULL
  ),
  -- 06-CAL-040: Red de tubería de cobre para radiador
  (
    gen_random_uuid(),
    '06-CAL-040',
    calefaccion_category_id,
    'Tuberías',
    'RED DE TUBERÍA DE COBRE PARA RADIADOR',
    'ud',
    175.00,
    75.00,
    0,
    0,
    false,
    NULL
  ),
  -- 06-CAL-050: Colocación y movimiento radiadores (MO)
  (
    gen_random_uuid(),
    '06-CAL-050',
    calefaccion_category_id,
    'Radiadores',
    'COLOCACIÓN Y MOVIMIENTO RADIADORES (MO)',
    'ud',
    60.00,
    26.00,
    0,
    0,
    false,
    NULL
  ),
  -- 06-CAL-060: Legalización instalación de gas (certificación)
  (
    gen_random_uuid(),
    '06-CAL-060',
    calefaccion_category_id,
    'Legalización',
    'LEGALIZACIÓN INSTALACIÓN DE GAS (Certificación)',
    'ud',
    322.00,
    138.00,
    0,
    0,
    false,
    NULL
  ),
  -- 06-CAL-070: Instalación suelo radiante húmedo
  (
    gen_random_uuid(),
    '06-CAL-070',
    calefaccion_category_id,
    'Suelo Radiante',
    'INSTALACIÓN SUELO RADIANTE HÚMEDO',
    'm²',
    64.00,
    27.00,
    0,
    0,
    false,
    NULL
  ),
  -- 06-CAL-080: Acometida de gas (Aprox.)
  (
    gen_random_uuid(),
    '06-CAL-080',
    calefaccion_category_id,
    'Gas',
    'ACOMETIDA DE GAS (Aprox.)',
    'ud',
    1000.00,
    440.00,
    0,
    0,
    false,
    NULL
  ),
  -- 06-CAL-090: Cambio de radiadores radiador
  (
    gen_random_uuid(),
    '06-CAL-090',
    calefaccion_category_id,
    'Radiadores',
    'CAMBIO DE RADIADORES RADIADOR',
    'ud',
    45.00,
    19.00,
    0,
    0,
    false,
    NULL
  ),
  -- 06-CAL-100: Instalación y conexionado de termo eléctrico
  (
    gen_random_uuid(),
    '06-CAL-100',
    calefaccion_category_id,
    'Termos',
    'INSTALACIÓN Y CONEXIONADO DE TERMO ELÉCTRICO',
    'ud',
    137.00,
    59.00,
    0,
    0,
    false,
    NULL
  );

  RAISE NOTICE 'Categoría CALEFACCIÓN creada con ID: %', calefaccion_category_id;
  RAISE NOTICE 'Se han insertado 10 partidas de calefacción';
END $$;
