-- Insertar precios base de Electricidad
INSERT INTO price_master (code, category_id, subcategory, description, unit, material_cost, labor_cost, base_price, profit_margin, final_price, is_custom) VALUES
  ('ELE001', '33333333-3333-3333-3333-333333333333', 'Puntos de luz', 'Punto de luz sencillo', 'ud', 8.00, 25.00, 33.00, 20, 39.60, false),
  ('ELE002', '33333333-3333-3333-3333-333333333333', 'Puntos de luz', 'Punto de luz conmutado', 'ud', 12.00, 35.00, 47.00, 20, 56.40, false),
  ('ELE003', '33333333-3333-3333-3333-333333333333', 'Enchufes', 'Base de enchufe 16A', 'ud', 6.00, 20.00, 26.00, 20, 31.20, false),
  ('ELE004', '33333333-3333-3333-3333-333333333333', 'Enchufes', 'Base de enchufe con toma de tierra', 'ud', 8.00, 22.00, 30.00, 20, 36.00, false),
  ('ELE005', '33333333-3333-3333-3333-333333333333', 'Mecanismos', 'Interruptor simple', 'ud', 4.00, 15.00, 19.00, 20, 22.80, false),
  ('ELE006', '33333333-3333-3333-3333-333333333333', 'Mecanismos', 'Conmutador', 'ud', 5.00, 18.00, 23.00, 20, 27.60, false),
  ('ELE007', '33333333-3333-3333-3333-333333333333', 'Cuadros', 'Cuadro eléctrico vivienda 4 estancias', 'ud', 180.00, 220.00, 400.00, 25, 500.00, false),
  ('ELE008', '33333333-3333-3333-3333-333333333333', 'Cuadros', 'Magnetotérmico 16A', 'ud', 12.00, 15.00, 27.00, 20, 32.40, false),
  ('ELE009', '33333333-3333-3333-3333-333333333333', 'Cuadros', 'Diferencial 25A 30mA', 'ud', 35.00, 20.00, 55.00, 20, 66.00, false),
  ('ELE010', '33333333-3333-3333-3333-333333333333', 'Cableado', 'Cable H07V-K 1,5mm² (por metro)', 'm', 0.80, 1.20, 2.00, 15, 2.30, false),
  ('ELE011', '33333333-3333-3333-3333-333333333333', 'Cableado', 'Cable H07V-K 2,5mm² (por metro)', 'm', 1.20, 1.50, 2.70, 15, 3.11, false)
ON CONFLICT (id) DO NOTHING;
