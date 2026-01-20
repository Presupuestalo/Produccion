-- Poblar tabla price_master_peru con precios adaptados a Perú

-- Primero, obtener los IDs de las categorías
DO $$
DECLARE
  cat_derribo TEXT;
  cat_albanileria TEXT;
  cat_fontaneria TEXT;
  cat_carpinteria TEXT;
  cat_electricidad TEXT;
  cat_calefaccion TEXT;
  cat_limpieza TEXT;
  cat_materiales TEXT;
BEGIN
  -- Obtener IDs de categorías
  SELECT id INTO cat_derribo FROM price_categories WHERE name = 'DERRIBO';
  SELECT id INTO cat_albanileria FROM price_categories WHERE name = 'ALBAÑILERIA';
  SELECT id INTO cat_fontaneria FROM price_categories WHERE name = 'FONTANERIA';
  SELECT id INTO cat_carpinteria FROM price_categories WHERE name = 'CARPINTERIA';
  SELECT id INTO cat_electricidad FROM price_categories WHERE name = 'ELECTRICIDAD';
  SELECT id INTO cat_calefaccion FROM price_categories WHERE name = 'CALEFACCION';
  SELECT id INTO cat_limpieza FROM price_categories WHERE name = 'LIMPIEZA';
  SELECT id INTO cat_materiales FROM price_categories WHERE name = 'MATERIALES';

  -- Limpiar tabla si tiene datos
  DELETE FROM price_master_peru;

  -- CATEGORÍA: DERRIBO (adaptado a terminología peruana)
  INSERT INTO price_master_peru (id, code, category_id, subcategory, description, unit, labor_cost, material_cost, equipment_cost, other_cost, margin_percentage, final_price, is_active, created_at, updated_at) VALUES
  (gen_random_uuid(), 'DER001', cat_derribo, 'Muros', 'Demolición de muro de drywall existente, incluyendo mano de obra y desescombro', 'm²', 8.50, 2.00, 1.50, 1.00, 30, 16.90, true, NOW(), NOW()),
  (gen_random_uuid(), 'DER002', cat_derribo, 'Pisos', 'Picado de piso para retirada de mayólica o revestimiento cerámico existente', 'm²', 7.00, 1.50, 1.20, 0.80, 30, 13.65, true, NOW(), NOW()),
  (gen_random_uuid(), 'DER003', cat_derribo, 'Pisos', 'Picado de contrapiso y posterior desescombro', 'm²', 10.00, 2.00, 2.50, 1.50, 30, 20.80, true, NOW(), NOW()),
  (gen_random_uuid(), 'DER004', cat_derribo, 'Techos', 'Retirada y desescombro de cielo raso de drywall o similar', 'm²', 7.00, 1.50, 1.20, 0.80, 30, 13.65, true, NOW(), NOW()),
  (gen_random_uuid(), 'DER005', cat_derribo, 'Carpintería', 'Retirada de molduras de madera en perímetro de techos', 'ml', 0.70, 0.10, 0.05, 0.05, 30, 1.17, true, NOW(), NOW()),
  (gen_random_uuid(), 'DER006', cat_derribo, 'Carpintería', 'Desmontaje de contrazócalo de madera incluyendo rastreles inferiores', 'm²', 4.00, 0.80, 0.50, 0.30, 30, 7.28, true, NOW(), NOW());

  -- CATEGORÍA: ALBAÑILERIA (adaptado a terminología peruana)
  INSERT INTO price_master_peru (id, code, category_id, subcategory, description, unit, labor_cost, material_cost, equipment_cost, other_cost, margin_percentage, final_price, is_active, created_at, updated_at) VALUES
  (gen_random_uuid(), 'ALB001', cat_albanileria, 'Muros', 'Construcción de muro de drywall con estructura metálica', 'm²', 12.00, 8.00, 2.00, 1.50, 30, 30.55, true, NOW(), NOW()),
  (gen_random_uuid(), 'ALB002', cat_albanileria, 'Revestimientos', 'Tarrajeo de paredes con mezcla de cemento y arena', 'm²', 8.00, 4.00, 1.00, 0.80, 30, 17.94, true, NOW(), NOW()),
  (gen_random_uuid(), 'ALB003', cat_albanileria, 'Revestimientos', 'Instalación de mayólica en paredes con pegamento', 'm²', 10.00, 15.00, 1.50, 1.20, 30, 35.91, true, NOW(), NOW()),
  (gen_random_uuid(), 'ALB004', cat_albanileria, 'Pisos', 'Vaciado de contrapiso nivelado', 'm²', 8.00, 6.00, 2.00, 1.00, 30, 22.10, true, NOW(), NOW()),
  (gen_random_uuid(), 'ALB005', cat_albanileria, 'Pisos', 'Instalación de porcelanato en pisos', 'm²', 12.00, 20.00, 2.00, 1.50, 30, 46.15, true, NOW(), NOW());

  -- CATEGORÍA: FONTANERIA (adaptado a "gasfitería" en Perú)
  INSERT INTO price_master_peru (id, code, category_id, subcategory, description, unit, labor_cost, material_cost, equipment_cost, other_cost, margin_percentage, final_price, is_active, created_at, updated_at) VALUES
  (gen_random_uuid(), 'FON001', cat_fontaneria, 'Instalaciones', 'Instalación de punto de agua fría con tubería PVC', 'ud', 15.00, 8.00, 2.00, 1.50, 30, 34.45, true, NOW(), NOW()),
  (gen_random_uuid(), 'FON002', cat_fontaneria, 'Instalaciones', 'Instalación de punto de desagüe con tubería PVC', 'ud', 18.00, 10.00, 2.50, 2.00, 30, 42.25, true, NOW(), NOW()),
  (gen_random_uuid(), 'FON003', cat_fontaneria, 'Sanitarios', 'Instalación de inodoro con accesorios', 'ud', 25.00, 150.00, 5.00, 3.00, 30, 237.90, true, NOW(), NOW()),
  (gen_random_uuid(), 'FON004', cat_fontaneria, 'Sanitarios', 'Instalación de lavatorio con grifería', 'ud', 20.00, 120.00, 4.00, 2.50, 30, 190.45, true, NOW(), NOW());

  -- CATEGORÍA: CARPINTERIA
  INSERT INTO price_master_peru (id, code, category_id, subcategory, description, unit, labor_cost, material_cost, equipment_cost, other_cost, margin_percentage, final_price, is_active, created_at, updated_at) VALUES
  (gen_random_uuid(), 'CAR001', cat_carpinteria, 'Puertas', 'Suministro e instalación de puerta de madera', 'ud', 40.00, 200.00, 8.00, 5.00, 30, 328.90, true, NOW(), NOW()),
  (gen_random_uuid(), 'CAR002', cat_carpinteria, 'Closets', 'Fabricación e instalación de closet de melamina', 'ml', 80.00, 150.00, 15.00, 10.00, 30, 331.50, true, NOW(), NOW()),
  (gen_random_uuid(), 'CAR003', cat_carpinteria, 'Revestimientos', 'Instalación de contrazócalo de madera', 'ml', 3.00, 4.00, 0.50, 0.30, 30, 10.14, true, NOW(), NOW());

  -- CATEGORÍA: ELECTRICIDAD
  INSERT INTO price_master_peru (id, code, category_id, subcategory, description, unit, labor_cost, material_cost, equipment_cost, other_cost, margin_percentage, final_price, is_active, created_at, updated_at) VALUES
  (gen_random_uuid(), 'ELE001', cat_electricidad, 'Instalaciones', 'Punto de luz con cable y caja', 'ud', 12.00, 8.00, 1.50, 1.00, 30, 29.25, true, NOW(), NOW()),
  (gen_random_uuid(), 'ELE002', cat_electricidad, 'Instalaciones', 'Punto de tomacorriente doble', 'ud', 15.00, 10.00, 2.00, 1.20, 30, 36.66, true, NOW(), NOW()),
  (gen_random_uuid(), 'ELE003', cat_electricidad, 'Tableros', 'Instalación de tablero eléctrico 12 polos', 'ud', 80.00, 150.00, 15.00, 10.00, 30, 331.50, true, NOW(), NOW());

  -- CATEGORÍA: CALEFACCION (adaptado a "climatización" en Perú)
  INSERT INTO price_master_peru (id, code, category_id, subcategory, description, unit, labor_cost, material_cost, equipment_cost, other_cost, margin_percentage, final_price, is_active, created_at, updated_at) VALUES
  (gen_random_uuid(), 'CAL001', cat_calefaccion, 'Agua Caliente', 'Instalación de terma eléctrica 50 litros', 'ud', 60.00, 300.00, 12.00, 8.00, 30, 494.00, true, NOW(), NOW()),
  (gen_random_uuid(), 'CAL002', cat_calefaccion, 'Climatización', 'Instalación de aire acondicionado split', 'ud', 120.00, 800.00, 30.00, 20.00, 30, 1261.00, true, NOW(), NOW());

  -- CATEGORÍA: LIMPIEZA
  INSERT INTO price_master_peru (id, code, category_id, subcategory, description, unit, labor_cost, material_cost, equipment_cost, other_cost, margin_percentage, final_price, is_active, created_at, updated_at) VALUES
  (gen_random_uuid(), 'LIM001', cat_limpieza, 'Limpieza Final', 'Limpieza final de obra con materiales', 'm²', 2.00, 0.80, 0.30, 0.20, 30, 4.29, true, NOW(), NOW()),
  (gen_random_uuid(), 'LIM002', cat_limpieza, 'Desescombro', 'Retiro de desmonte y escombros', 'm³', 15.00, 5.00, 8.00, 3.00, 30, 40.30, true, NOW(), NOW());

  -- CATEGORÍA: MATERIALES
  INSERT INTO price_master_peru (id, code, category_id, subcategory, description, unit, labor_cost, material_cost, equipment_cost, other_cost, margin_percentage, final_price, is_active, created_at, updated_at) VALUES
  (gen_random_uuid(), 'MAT001', cat_materiales, 'Cemento', 'Cemento Portland tipo I bolsa 42.5kg', 'ud', 0.00, 22.00, 0.00, 0.50, 30, 29.25, true, NOW(), NOW()),
  (gen_random_uuid(), 'MAT002', cat_materiales, 'Agregados', 'Arena fina para construcción', 'm³', 0.00, 45.00, 5.00, 2.00, 30, 67.60, true, NOW(), NOW()),
  (gen_random_uuid(), 'MAT003', cat_materiales, 'Drywall', 'Plancha de drywall estándar 1.22x2.44m', 'ud', 0.00, 18.00, 0.00, 0.50, 30, 24.05, true, NOW(), NOW());

  RAISE NOTICE 'Precios de Perú insertados correctamente';
END $$;
