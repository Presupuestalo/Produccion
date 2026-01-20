-- Insertar precios base de Materiales (con color, marca y modelo)
INSERT INTO price_master (code, category_id, subcategory, description, unit, material_cost, labor_cost, base_price, profit_margin, final_price, color, brand, model, is_custom) VALUES
  -- Platos de ducha
  ('MAT001', '66666666-6666-6666-6666-666666666666', 'Platos de ducha', 'PLATO DE DUCHA DE RESINA 80x80', 'ud', 120.00, 0, 120.00, 25, 150.00, 'BLANCO', 'Roca', 'Terran', false),
  ('MAT002', '66666666-6666-6666-6666-666666666666', 'Platos de ducha', 'PLATO DE DUCHA DE RESINA 90x90', 'ud', 140.00, 0, 140.00, 25, 175.00, 'BLANCO', 'Roca', 'Terran', false),
  ('MAT003', '66666666-6666-6666-6666-666666666666', 'Platos de ducha', 'PLATO DE DUCHA DE RESINA 100x80', 'ud', 150.00, 0, 150.00, 25, 187.50, 'BLANCO', 'Roca', 'Terran', false),
  ('MAT004', '66666666-6666-6666-6666-666666666666', 'Platos de ducha', 'PLATO DE DUCHA DE RESINA 120x80', 'ud', 170.00, 0, 170.00, 25, 212.50, 'BLANCO', 'Roca', 'Terran', false),
  ('MAT005', '66666666-6666-6666-6666-666666666666', 'Platos de ducha', 'PLATO DE DUCHA DE RESINA 80x80', 'ud', 130.00, 0, 130.00, 25, 162.50, 'GRIS', 'Roca', 'Terran', false),
  ('MAT006', '66666666-6666-6666-6666-666666666666', 'Platos de ducha', 'PLATO DE DUCHA DE RESINA 90x90', 'ud', 150.00, 0, 150.00, 25, 187.50, 'GRIS', 'Roca', 'Terran', false),
  ('MAT007', '66666666-6666-6666-6666-666666666666', 'Platos de ducha', 'PLATO DE DUCHA DE RESINA 80x80', 'ud', 135.00, 0, 135.00, 25, 168.75, 'NEGRO', 'Roca', 'Terran', false),
  
  -- Sanitarios
  ('MAT010', '66666666-6666-6666-6666-666666666666', 'Sanitarios', 'INODORO COMPACTO', 'ud', 180.00, 0, 180.00, 25, 225.00, 'BLANCO', 'Roca', 'Dama', false),
  ('MAT011', '66666666-6666-6666-6666-666666666666', 'Sanitarios', 'LAVABO SUSPENDIDO 60CM', 'ud', 95.00, 0, 95.00, 25, 118.75, 'BLANCO', 'Roca', 'Meridian', false),
  ('MAT012', '66666666-6666-6666-6666-666666666666', 'Sanitarios', 'LAVABO SUSPENDIDO 80CM', 'ud', 120.00, 0, 120.00, 25, 150.00, 'BLANCO', 'Roca', 'Meridian', false),
  
  -- Griferías
  ('MAT020', '66666666-6666-6666-6666-666666666666', 'Grifería', 'GRIFO MONOMANDO LAVABO', 'ud', 45.00, 0, 45.00, 25, 56.25, 'CROMADO', 'Grohe', 'Eurosmart', false),
  ('MAT021', '66666666-6666-6666-6666-666666666666', 'Grifería', 'GRIFO MONOMANDO DUCHA', 'ud', 55.00, 0, 55.00, 25, 68.75, 'CROMADO', 'Grohe', 'Eurosmart', false),
  ('MAT022', '66666666-6666-6666-6666-666666666666', 'Grifería', 'GRIFO MONOMANDO BAÑERA', 'ud', 75.00, 0, 75.00, 25, 93.75, 'CROMADO', 'Grohe', 'Eurosmart', false),
  ('MAT023', '66666666-6666-6666-6666-666666666666', 'Grifería', 'GRIFO MONOMANDO LAVABO', 'ud', 55.00, 0, 55.00, 25, 68.75, 'NEGRO MATE', 'Grohe', 'Eurosmart', false),
  
  -- Azulejos
  ('MAT030', '66666666-6666-6666-6666-666666666666', 'Azulejos', 'AZULEJO PORCELÁNICO 30X60', 'm²', 18.00, 0, 18.00, 30, 23.40, 'BLANCO', 'Porcelanosa', 'Bottega', false),
  ('MAT031', '66666666-6666-6666-6666-666666666666', 'Azulejos', 'AZULEJO PORCELÁNICO 30X60', 'm²', 20.00, 0, 20.00, 30, 26.00, 'GRIS', 'Porcelanosa', 'Bottega', false),
  ('MAT032', '66666666-6666-6666-6666-666666666666', 'Azulejos', 'AZULEJO PORCELÁNICO 30X60', 'm²', 22.00, 0, 22.00, 30, 28.60, 'BEIGE', 'Porcelanosa', 'Bottega', false)
ON CONFLICT (id) DO NOTHING;
