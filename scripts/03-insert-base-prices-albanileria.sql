-- Insertar precios base de Albañilería
INSERT INTO price_master (code, category_id, subcategory, description, unit, material_cost, labor_cost, base_price, profit_margin, final_price, is_custom) VALUES
  ('ALB001', '11111111-1111-1111-1111-111111111111', 'Demolición', 'Demolición de tabique de ladrillo', 'm²', 0, 8.50, 8.50, 15, 9.78, false),
  ('ALB002', '11111111-1111-1111-1111-111111111111', 'Demolición', 'Demolición de solado', 'm²', 0, 12.00, 12.00, 15, 13.80, false),
  ('ALB003', '11111111-1111-1111-1111-111111111111', 'Demolición', 'Demolición de alicatado', 'm²', 0, 10.00, 10.00, 15, 11.50, false),
  ('ALB004', '11111111-1111-1111-1111-111111111111', 'Tabiquería', 'Tabique de ladrillo hueco doble 7cm', 'm²', 12.50, 18.00, 30.50, 20, 36.60, false),
  ('ALB005', '11111111-1111-1111-1111-111111111111', 'Tabiquería', 'Tabique de pladur simple 48mm', 'm²', 8.00, 12.00, 20.00, 20, 24.00, false),
  ('ALB006', '11111111-1111-1111-1111-111111111111', 'Tabiquería', 'Tabique de pladur doble 70mm', 'm²', 14.00, 16.00, 30.00, 20, 36.00, false),
  ('ALB007', '11111111-1111-1111-1111-111111111111', 'Solados', 'Solado de gres porcelánico 60x60', 'm²', 18.00, 22.00, 40.00, 25, 50.00, false),
  ('ALB008', '11111111-1111-1111-1111-111111111111', 'Solados', 'Solado de gres porcelánico imitación madera', 'm²', 22.00, 22.00, 44.00, 25, 55.00, false),
  ('ALB009', '11111111-1111-1111-1111-111111111111', 'Alicatados', 'Alicatado de azulejo 30x60', 'm²', 15.00, 20.00, 35.00, 25, 43.75, false),
  ('ALB010', '11111111-1111-1111-1111-111111111111', 'Alicatados', 'Alicatado de azulejo 20x20', 'm²', 12.00, 18.00, 30.00, 25, 37.50, false),
  ('ALB011', '11111111-1111-1111-1111-111111111111', 'Enfoscados', 'Enfoscado maestreado de paramentos verticales', 'm²', 3.50, 8.00, 11.50, 20, 13.80, false),
  ('ALB012', '11111111-1111-1111-1111-111111111111', 'Enfoscados', 'Enfoscado fratasado de paramentos horizontales', 'm²', 4.00, 10.00, 14.00, 20, 16.80, false)
ON CONFLICT (id) DO NOTHING;
