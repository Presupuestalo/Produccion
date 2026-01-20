-- Insertar precios base de Pintura
INSERT INTO price_master (code, category_id, subcategory, description, unit, material_cost, labor_cost, base_price, profit_margin, final_price, is_custom) VALUES
  ('PIN001', '55555555-5555-5555-5555-555555555555', 'Paredes', 'Pintura plástica lisa en paredes', 'm²', 1.80, 4.20, 6.00, 20, 7.20, false),
  ('PIN002', '55555555-5555-5555-5555-555555555555', 'Paredes', 'Pintura plástica lisa en techos', 'm²', 1.80, 5.20, 7.00, 20, 8.40, false),
  ('PIN003', '55555555-5555-5555-5555-555555555555', 'Preparación', 'Emplastecido de paramentos', 'm²', 2.50, 6.50, 9.00, 20, 10.80, false),
  ('PIN004', '55555555-5555-5555-5555-555555555555', 'Preparación', 'Lijado y preparación de superficies', 'm²', 0.50, 3.50, 4.00, 20, 4.80, false),
  ('PIN005', '55555555-5555-5555-5555-555555555555', 'Esmaltes', 'Esmalte sintético en puertas', 'ud', 12.00, 28.00, 40.00, 20, 48.00, false),
  ('PIN006', '55555555-5555-5555-5555-555555555555', 'Esmaltes', 'Esmalte sintético en ventanas', 'ud', 15.00, 35.00, 50.00, 20, 60.00, false),
  ('PIN007', '55555555-5555-5555-5555-555555555555', 'Esmaltes', 'Esmalte sintético en radiadores', 'ud', 8.00, 22.00, 30.00, 20, 36.00, false)
ON CONFLICT (id) DO NOTHING;
