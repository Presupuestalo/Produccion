-- Insertar precios base de Carpintería
INSERT INTO price_master (code, category_id, subcategory, description, unit, material_cost, labor_cost, base_price, profit_margin, final_price, is_custom) VALUES
  ('CAR001', '44444444-4444-4444-4444-444444444444', 'Puertas', 'Puerta interior lisa blanca 72,5cm', 'ud', 85.00, 65.00, 150.00, 25, 187.50, false),
  ('CAR002', '44444444-4444-4444-4444-444444444444', 'Puertas', 'Puerta interior lisa blanca 82,5cm', 'ud', 95.00, 65.00, 160.00, 25, 200.00, false),
  ('CAR003', '44444444-4444-4444-4444-444444444444', 'Puertas', 'Puerta corredera empotrada', 'ud', 180.00, 120.00, 300.00, 25, 375.00, false),
  ('CAR004', '44444444-4444-4444-4444-444444444444', 'Ventanas', 'Ventana PVC 120x120cm', 'ud', 220.00, 80.00, 300.00, 25, 375.00, false),
  ('CAR005', '44444444-4444-4444-4444-444444444444', 'Ventanas', 'Ventana PVC 150x120cm', 'ud', 280.00, 90.00, 370.00, 25, 462.50, false),
  ('CAR006', '44444444-4444-4444-4444-444444444444', 'Armarios', 'Armario empotrado 2 puertas correderas', 'ml', 180.00, 120.00, 300.00, 30, 390.00, false),
  ('CAR007', '44444444-4444-4444-4444-444444444444', 'Armarios', 'Interior de armario con baldas y barra', 'ml', 80.00, 60.00, 140.00, 25, 175.00, false),
  ('CAR008', '44444444-4444-4444-4444-444444444444', 'Rodapiés', 'Rodapié lacado blanco 7cm', 'ml', 4.50, 3.50, 8.00, 20, 9.60, false),
  ('CAR009', '44444444-4444-4444-4444-444444444444', 'Rodapiés', 'Rodapié DM lacado 10cm', 'ml', 6.00, 4.00, 10.00, 20, 12.00, false)
ON CONFLICT (id) DO NOTHING;
