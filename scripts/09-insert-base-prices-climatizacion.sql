-- Insertar precios base de Climatización
INSERT INTO price_master (code, category_id, subcategory, description, unit, material_cost, labor_cost, base_price, profit_margin, final_price, is_custom) VALUES
  ('CLI001', '77777777-7777-7777-7777-777777777777', 'Calefacción', 'Radiador aluminio 600mm 6 elementos', 'ud', 85.00, 65.00, 150.00, 25, 187.50, false),
  ('CLI002', '77777777-7777-7777-7777-777777777777', 'Calefacción', 'Radiador aluminio 600mm 8 elementos', 'ud', 105.00, 70.00, 175.00, 25, 218.75, false),
  ('CLI003', '77777777-7777-7777-7777-777777777777', 'Calefacción', 'Radiador aluminio 600mm 10 elementos', 'ud', 125.00, 75.00, 200.00, 25, 250.00, false),
  ('CLI004', '77777777-7777-7777-7777-777777777777', 'Calefacción', 'Caldera de gas condensación 24kW', 'ud', 850.00, 450.00, 1300.00, 25, 1625.00, false),
  ('CLI005', '77777777-7777-7777-7777-777777777777', 'Calefacción', 'Termostato digital programable', 'ud', 45.00, 55.00, 100.00, 20, 120.00, false),
  ('CLI006', '77777777-7777-7777-7777-777777777777', 'Aire acondicionado', 'Split 2250 frigorías', 'ud', 380.00, 220.00, 600.00, 25, 750.00, false),
  ('CLI007', '77777777-7777-7777-7777-777777777777', 'Aire acondicionado', 'Split 3000 frigorías', 'ud', 480.00, 250.00, 730.00, 25, 912.50, false),
  ('CLI008', '77777777-7777-7777-7777-777777777777', 'Suelo radiante', 'Suelo radiante por m²', 'm²', 35.00, 25.00, 60.00, 25, 75.00, false)
ON CONFLICT (id) DO NOTHING;
