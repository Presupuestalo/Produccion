-- Poblar tabla price_master_peru con precios adaptados a Perú
-- Sin marcas, modelos ni colores - solo conceptos y descripciones

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

  -- Limpiar tabla existente
  DELETE FROM price_master_peru;

  -- DERRIBO (Demolición)
  INSERT INTO price_master_peru (id, code, category_id, subcategory, description, long_description, unit, labor_cost, material_cost, equipment_cost, other_cost, margin_percentage, is_active) VALUES
  (gen_random_uuid(), 'DER-001', cat_derribo, 'Tabiques', 'Demolición de tabique de drywall', 'Demolición de tabique de drywall incluyendo mano de obra y retiro de escombros', 'm²', 8.50, 2.30, 1.20, 0.80, 15, true),
  (gen_random_uuid(), 'DER-002', cat_derribo, 'Pisos', 'Picado de piso cerámico', 'Picado de piso cerámico o mayólica existente', 'm²', 7.20, 1.80, 1.50, 0.70, 15, true),
  (gen_random_uuid(), 'DER-003', cat_derribo, 'Pisos', 'Picado de contrapiso', 'Picado de contrapiso de concreto', 'm²', 10.50, 2.20, 2.80, 1.00, 15, true),
  (gen_random_uuid(), 'DER-004', cat_derribo, 'Techos', 'Retiro de cielo raso', 'Retiro de cielo raso de drywall o similar', 'm²', 7.20, 1.80, 1.50, 0.70, 15, true),
  (gen_random_uuid(), 'DER-005', cat_derribo, 'Carpintería', 'Retiro de puerta', 'Retiro de puerta de madera incluyendo marco', 'ud', 25.00, 5.00, 3.00, 2.00, 15, true);

  -- ALBAÑILERIA (Construcción)
  INSERT INTO price_master_peru (id, code, category_id, subcategory, description, long_description, unit, labor_cost, material_cost, equipment_cost, other_cost, margin_percentage, is_active) VALUES
  (gen_random_uuid(), 'ALB-001', cat_albanileria, 'Muros', 'Muro de drywall estándar', 'Construcción de muro divisorio con drywall estándar de 12.5mm', 'm²', 18.50, 12.30, 2.50, 1.20, 20, true),
  (gen_random_uuid(), 'ALB-002', cat_albanileria, 'Muros', 'Muro de ladrillo', 'Construcción de muro de ladrillo King Kong con mortero', 'm²', 28.00, 22.50, 3.50, 2.00, 20, true),
  (gen_random_uuid(), 'ALB-003', cat_albanileria, 'Revestimientos', 'Tarrajeo de muros', 'Tarrajeo de muros interiores con mezcla cemento-arena', 'm²', 12.50, 8.30, 1.80, 0.90, 20, true),
  (gen_random_uuid(), 'ALB-004', cat_albanileria, 'Revestimientos', 'Instalación de mayólica', 'Instalación de mayólica en muros con pegamento', 'm²', 22.00, 28.50, 2.50, 1.50, 20, true),
  (gen_random_uuid(), 'ALB-005', cat_albanileria, 'Pisos', 'Contrapiso de concreto', 'Vaciado de contrapiso de concreto pulido', 'm²', 15.50, 18.20, 3.80, 1.50, 20, true),
  (gen_random_uuid(), 'ALB-006', cat_albanileria, 'Pisos', 'Instalación de porcelanato', 'Instalación de porcelanato en pisos', 'm²', 25.00, 35.50, 3.00, 2.00, 20, true),
  (gen_random_uuid(), 'ALB-007', cat_albanileria, 'Techos', 'Cielo raso de drywall', 'Instalación de cielo raso con drywall', 'm²', 20.00, 15.50, 2.80, 1.50, 20, true);

  -- FONTANERIA (Gasfitería)
  INSERT INTO price_master_peru (id, code, category_id, subcategory, description, long_description, unit, labor_cost, material_cost, equipment_cost, other_cost, margin_percentage, is_active) VALUES
  (gen_random_uuid(), 'FON-001', cat_fontaneria, 'Agua', 'Instalación de tubería PVC agua fría', 'Instalación de tubería PVC SAP para agua fría', 'ml', 8.50, 6.20, 1.30, 0.80, 18, true),
  (gen_random_uuid(), 'FON-002', cat_fontaneria, 'Agua', 'Instalación de tubería CPVC agua caliente', 'Instalación de tubería CPVC para agua caliente', 'ml', 12.00, 9.50, 1.50, 1.00, 18, true),
  (gen_random_uuid(), 'FON-003', cat_fontaneria, 'Desagüe', 'Instalación de tubería PVC desagüe', 'Instalación de tubería PVC SAL para desagüe', 'ml', 9.50, 7.80, 1.50, 0.90, 18, true),
  (gen_random_uuid(), 'FON-004', cat_fontaneria, 'Sanitarios', 'Instalación de inodoro', 'Instalación de inodoro con accesorios', 'ud', 45.00, 15.00, 3.00, 2.50, 18, true),
  (gen_random_uuid(), 'FON-005', cat_fontaneria, 'Sanitarios', 'Instalación de lavatorio', 'Instalación de lavatorio con grifería', 'ud', 38.00, 12.00, 2.50, 2.00, 18, true),
  (gen_random_uuid(), 'FON-006', cat_fontaneria, 'Agua Caliente', 'Instalación de terma eléctrica', 'Instalación de terma eléctrica con conexiones', 'ud', 85.00, 25.00, 5.00, 4.00, 18, true);

  -- CARPINTERIA
  INSERT INTO price_master_peru (id, code, category_id, subcategory, description, long_description, unit, labor_cost, material_cost, equipment_cost, other_cost, margin_percentage, is_active) VALUES
  (gen_random_uuid(), 'CAR-001', cat_carpinteria, 'Puertas', 'Puerta contraplacada', 'Suministro e instalación de puerta contraplacada con marco', 'ud', 65.00, 180.00, 8.00, 5.00, 22, true),
  (gen_random_uuid(), 'CAR-002', cat_carpinteria, 'Puertas', 'Puerta de MDF', 'Suministro e instalación de puerta de MDF con marco', 'ud', 55.00, 150.00, 7.00, 4.50, 22, true),
  (gen_random_uuid(), 'CAR-003', cat_carpinteria, 'Ventanas', 'Ventana de aluminio', 'Suministro e instalación de ventana de aluminio con vidrio', 'm²', 85.00, 120.00, 10.00, 6.00, 22, true),
  (gen_random_uuid(), 'CAR-004', cat_carpinteria, 'Muebles', 'Mueble de cocina melamina', 'Fabricación e instalación de mueble de cocina en melamina', 'ml', 120.00, 180.00, 12.00, 8.00, 22, true),
  (gen_random_uuid(), 'CAR-005', cat_carpinteria, 'Closets', 'Closet de melamina', 'Fabricación e instalación de closet en melamina', 'ml', 110.00, 165.00, 11.00, 7.50, 22, true);

  -- ELECTRICIDAD
  INSERT INTO price_master_peru (id, code, category_id, subcategory, description, long_description, unit, labor_cost, material_cost, equipment_cost, other_cost, margin_percentage, is_active) VALUES
  (gen_random_uuid(), 'ELE-001', cat_electricidad, 'Cableado', 'Instalación de cable eléctrico', 'Instalación de cable eléctrico en tubería', 'ml', 4.50, 3.20, 0.80, 0.50, 18, true),
  (gen_random_uuid(), 'ELE-002', cat_electricidad, 'Salidas', 'Salida de tomacorriente', 'Instalación de salida para tomacorriente', 'pto', 28.00, 12.50, 2.00, 1.50, 18, true),
  (gen_random_uuid(), 'ELE-003', cat_electricidad, 'Salidas', 'Salida de iluminación', 'Instalación de salida para iluminación', 'pto', 25.00, 10.80, 1.80, 1.40, 18, true),
  (gen_random_uuid(), 'ELE-004', cat_electricidad, 'Tableros', 'Tablero eléctrico', 'Instalación de tablero eléctrico con interruptores', 'ud', 95.00, 180.00, 12.00, 8.00, 18, true),
  (gen_random_uuid(), 'ELE-005', cat_electricidad, 'Luminarias', 'Instalación de luminaria LED', 'Instalación de luminaria LED empotrada', 'ud', 22.00, 8.50, 1.50, 1.00, 18, true);

  -- CALEFACCION (Climatización)
  INSERT INTO price_master_peru (id, code, category_id, subcategory, description, long_description, unit, labor_cost, material_cost, equipment_cost, other_cost, margin_percentage, is_active) VALUES
  (gen_random_uuid(), 'CAL-001', cat_calefaccion, 'Aire Acondicionado', 'Instalación de aire acondicionado split', 'Instalación de equipo de aire acondicionado tipo split', 'ud', 180.00, 80.00, 25.00, 15.00, 20, true),
  (gen_random_uuid(), 'CAL-002', cat_calefaccion, 'Ventilación', 'Instalación de extractor', 'Instalación de extractor de aire para baño', 'ud', 35.00, 15.00, 3.00, 2.00, 20, true);

  -- LIMPIEZA
  INSERT INTO price_master_peru (id, code, category_id, subcategory, description, long_description, unit, labor_cost, material_cost, equipment_cost, other_cost, margin_percentage, is_active) VALUES
  (gen_random_uuid(), 'LIM-001', cat_limpieza, 'Limpieza Final', 'Limpieza final de obra', 'Limpieza completa de obra terminada', 'm²', 3.50, 1.80, 0.80, 0.40, 15, true),
  (gen_random_uuid(), 'LIM-002', cat_limpieza, 'Retiro', 'Retiro de desmonte', 'Retiro y eliminación de desmonte', 'm³', 45.00, 25.00, 15.00, 8.00, 15, true);

  -- MATERIALES
  INSERT INTO price_master_peru (id, code, category_id, subcategory, description, long_description, unit, labor_cost, material_cost, equipment_cost, other_cost, margin_percentage, is_active) VALUES
  (gen_random_uuid(), 'MAT-001', cat_materiales, 'Cemento', 'Cemento Portland tipo I', 'Bolsa de cemento Portland tipo I de 42.5kg', 'bls', 2.00, 22.50, 0.50, 0.30, 12, true),
  (gen_random_uuid(), 'MAT-002', cat_materiales, 'Arena', 'Arena gruesa', 'Metro cúbico de arena gruesa', 'm³', 8.00, 45.00, 12.00, 5.00, 12, true),
  (gen_random_uuid(), 'MAT-003', cat_materiales, 'Piedra', 'Piedra chancada', 'Metro cúbico de piedra chancada', 'm³', 8.00, 52.00, 12.00, 5.50, 12, true),
  (gen_random_uuid(), 'MAT-004', cat_materiales, 'Ladrillo', 'Ladrillo King Kong', 'Millar de ladrillos King Kong', 'mll', 15.00, 380.00, 25.00, 12.00, 12, true);

  RAISE NOTICE 'Precios de Perú insertados correctamente';
END $$;
