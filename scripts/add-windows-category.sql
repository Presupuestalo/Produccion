-- Añadir categoría VENTANAS
INSERT INTO price_categories (name, description, icon, display_order, is_active)
VALUES ('VENTANAS', 'Ventanas y cerramientos', '🪟', 8, true);

-- Obtener el ID de la categoría recién creada y añadir partidas
DO $$
DECLARE
  ventanas_category_id UUID;
BEGIN
  SELECT id INTO ventanas_category_id FROM price_categories WHERE name = 'VENTANAS';
  
  -- Usando estructura correcta con labor_cost y material_cost (40% labor, 60% material)
  INSERT INTO price_master (id, code, category_id, subcategory, description, unit, labor_cost, material_cost, equipment_cost, other_cost, is_custom, user_id) VALUES
  (gen_random_uuid(), '08-V-01', ventanas_category_id, 'VENTANAS PVC', 'VENTANA PVC OSCILOBATIENTE 1.20x1.20', 'ud', 180.00, 270.00, 0, 0, false, NULL::uuid),
  (gen_random_uuid(), '08-V-02', ventanas_category_id, 'VENTANAS PVC', 'VENTANA PVC CORREDERA 1.20x1.20', 'ud', 160.00, 240.00, 0, 0, false, NULL::uuid),
  (gen_random_uuid(), '08-V-03', ventanas_category_id, 'VENTANAS ALUMINIO', 'VENTANA ALUMINIO OSCILOBATIENTE 1.20x1.20', 'ud', 152.00, 228.00, 0, 0, false, NULL::uuid),
  (gen_random_uuid(), '08-V-04', ventanas_category_id, 'VENTANAS ALUMINIO', 'VENTANA ALUMINIO CORREDERA 1.20x1.20', 'ud', 140.00, 210.00, 0, 0, false, NULL::uuid),
  (gen_random_uuid(), '08-V-05', ventanas_category_id, 'PUERTAS BALCÓN', 'PUERTA BALCÓN PVC 0.80x2.10', 'ud', 220.00, 330.00, 0, 0, false, NULL::uuid),
  (gen_random_uuid(), '08-V-06', ventanas_category_id, 'PUERTAS BALCÓN', 'PUERTA BALCÓN ALUMINIO 0.80x2.10', 'ud', 200.00, 300.00, 0, 0, false, NULL::uuid),
  (gen_random_uuid(), '08-V-07', ventanas_category_id, 'VENTANAS ESPECIALES', 'VENTANA VELUX 0.78x0.98', 'ud', 260.00, 390.00, 0, 0, false, NULL::uuid),
  (gen_random_uuid(), '08-V-08', ventanas_category_id, 'PERSIANAS', 'PERSIANA ENROLLABLE', 'ud', 48.00, 72.00, 0, 0, false, NULL::uuid);
END $$;
