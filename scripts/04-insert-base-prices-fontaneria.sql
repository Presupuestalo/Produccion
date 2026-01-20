-- Insertar precios base de Fontanería
INSERT INTO price_master (code, category_id, subcategory, description, unit, material_cost, labor_cost, base_price, profit_margin, final_price, is_custom) VALUES
  ('FON001', '22222222-2222-2222-2222-222222222222', 'Instalación', 'Instalación de lavabo con grifo monomando', 'ud', 120.00, 80.00, 200.00, 25, 250.00, false),
  ('FON002', '22222222-2222-2222-2222-222222222222', 'Instalación', 'Instalación de inodoro con cisterna', 'ud', 150.00, 90.00, 240.00, 25, 300.00, false),
  ('FON003', '22222222-2222-2222-2222-222222222222', 'Instalación', 'Instalación de bañera acrílica', 'ud', 280.00, 150.00, 430.00, 25, 537.50, false),
  ('FON004', '22222222-2222-2222-2222-222222222222', 'Instalación', 'Instalación de plato de ducha', 'ud', 180.00, 120.00, 300.00, 25, 375.00, false),
  ('FON005', '22222222-2222-2222-2222-222222222222', 'Instalación', 'Instalación de mampara de ducha', 'ud', 200.00, 80.00, 280.00, 25, 350.00, false),
  ('FON006', '22222222-2222-2222-2222-222222222222', 'Tuberías', 'Tubería de PVC evacuación Ø110mm', 'm', 8.00, 12.00, 20.00, 20, 24.00, false),
  ('FON007', '22222222-2222-2222-2222-222222222222', 'Tuberías', 'Tubería de PVC evacuación Ø50mm', 'm', 4.00, 8.00, 12.00, 20, 14.40, false),
  ('FON008', '22222222-2222-2222-2222-222222222222', 'Tuberías', 'Tubería multicapa Ø16mm', 'm', 3.50, 6.00, 9.50, 20, 11.40, false),
  ('FON009', '22222222-2222-2222-2222-222222222222', 'Tuberías', 'Tubería multicapa Ø20mm', 'm', 4.50, 7.00, 11.50, 20, 13.80, false),
  ('FON010', '22222222-2222-2222-2222-222222222222', 'Desagües', 'Desagüe sifónico para ducha', 'ud', 25.00, 35.00, 60.00, 20, 72.00, false)
ON CONFLICT (id) DO NOTHING;
