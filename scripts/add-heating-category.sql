-- Añadir categoría CALEFACCIÓN
DO $$
DECLARE
  calefaccion_category_id UUID;
BEGIN
  -- Crear categoría CALEFACCIÓN
  INSERT INTO price_categories (name, description, icon, display_order, is_active)
  VALUES (
    'CALEFACCIÓN',
    'Instalaciones de calefacción y climatización',
    'Flame',
    6,
    true
  )
  RETURNING id INTO calefaccion_category_id;

  -- Insertar partidas de calefacción
  INSERT INTO price_master (
    code,
    category_id,
    subcategory,
    description,
    unit,
    labor_cost,
    material_cost,
    equipment_cost,
    other_cost,
    is_custom,
    user_id
  ) VALUES
  -- 06-CAL-010: Instalación de radiador eléctrico
  (
    '06-CAL-010',
    calefaccion_category_id,
    'Radiadores',
    'Instalación de radiador eléctrico',
    'ud',
    40.00,
    17.60,
    0.00,
    0.00,
    false,
    NULL
  ),
  -- 06-CAL-020: Resolución de acometida de gas en desplazamiento
  (
    '06-CAL-020',
    calefaccion_category_id,
    'Acometidas',
    'Resolución de acometida de gas en desplazamiento',
    'ud',
    40.00,
    17.60,
    0.00,
    0.00,
    false,
    NULL
  ),
  -- 06-CAL-030: Colocación caldera de gas (Montaje MO)
  (
    '06-CAL-030',
    calefaccion_category_id,
    'Calderas',
    'Mano de obra por la instalación completa de una nueva caldera',
    'ud',
    380.00,
    67.20,
    0.00,
    0.00,
    false,
    NULL
  ),
  -- 06-CAL-040: Red de tubería de cobre para radiador
  (
    '06-CAL-040',
    calefaccion_category_id,
    'Radiadores',
    'Instalación de la tubería desde la caldera hasta cada radiador',
    'ud',
    175.00,
    84.00,
    0.00,
    0.00,
    false,
    NULL
  ),
  -- 06-CAL-050: Colocación y movimiento radiadores (MO)
  (
    '06-CAL-050',
    calefaccion_category_id,
    'Radiadores',
    'Instalación de nuevo radiador o movimiento de uno existente',
    'ud',
    48.00,
    18.40,
    0.00,
    0.00,
    false,
    NULL
  ),
  -- 06-CAL-060: Legalización instalación de gas (certificación)
  (
    '06-CAL-060',
    calefaccion_category_id,
    'Legalización',
    'Emisión de certificados necesarios para la instalación de gas',
    'ud',
    320.00,
    140.00,
    0.00,
    0.00,
    false,
    NULL
  ),
  -- 06-CAL-070: Instalación suelo radiante húmedo
  (
    '06-CAL-070',
    calefaccion_category_id,
    'Suelo radiante',
    'Instalación de red de tubería de suelo radiante sobre base aislante',
    'm²',
    63.00,
    28.15,
    0.00,
    0.00,
    false,
    NULL
  ),
  -- 06-CAL-080: Acometida de gas (Aprox.)
  (
    '06-CAL-080',
    calefaccion_category_id,
    'Acometidas',
    'Coste estimado de la red de gas a la vivienda',
    'ud',
    1000.00,
    440.00,
    0.00,
    0.00,
    false,
    NULL
  ),
  -- 06-CAL-090: Cambio de radiadores radiador
  (
    '06-CAL-090',
    calefaccion_category_id,
    'Radiadores',
    'Sustitución de piezas de conexión del radiador',
    'ud',
    45.00,
    19.60,
    0.00,
    0.00,
    false,
    NULL
  ),
  -- 06-CAL-100: Instalación y conexionado de termo eléctrico
  (
    '06-CAL-100',
    calefaccion_category_id,
    'Termos',
    'Instalación y conexionado de termo eléctrico DBL',
    'ud',
    50.00,
    22.00,
    0.00,
    0.00,
    false,
    NULL
  );

  RAISE NOTICE 'Categoría CALEFACCIÓN y partidas añadidas correctamente';
END $$;
