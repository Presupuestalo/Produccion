-- Script para añadir el concepto de retirada de radiadores con el código 01-D-20
-- Se utiliza 01-D-20 para evitar colisiones con 01-D-08 (Rodapié cerámico)

INSERT INTO public.price_master (
  id, 
  code, 
  category_id, 
  subcategory, 
  description, 
  unit, 
  final_price, 
  is_active
) VALUES (
  gen_random_uuid(), 
  '01-D-20', 
  (SELECT id FROM public.price_categories WHERE name = 'DERRIBOS' OR name = 'DERRIBO' LIMIT 1), 
  'RETIRADA DE RADIADORES', 
  'Desmontaje y retirada de radiadores de agua existentes, incluyendo transporte a punto limpio.', 
  'Ud', 
  15.15, 
  true
) ON CONFLICT (code) DO UPDATE SET 
  subcategory = EXCLUDED.subcategory,
  description = EXCLUDED.description,
  final_price = EXCLUDED.final_price;
