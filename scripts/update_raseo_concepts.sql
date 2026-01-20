-- Script para actualizar los conceptos de raseo previo en todos los idiomas
-- 02-A-09: Raseo previo alicatados de pared (wall leveling before wall tiling)
-- 02-A-10: Raseo previo embaldosados suelo (floor leveling before floor tiling)

-- España
UPDATE price_master 
SET 
  subcategory = 'RASEO PREVIO ALICATADOS DE PARED',
  concept = 'Raseo de las paredes para obtener una base lisa y plomada antes de alicatar.'
WHERE code = '02-A-09' AND country_id = (SELECT id FROM countries WHERE code = 'ES');

UPDATE price_master 
SET 
  subcategory = 'RASEO PREVIO EMBALDOSADOS SUELO',
  concept = 'Raseo y nivelación del suelo para obtener una base lisa antes de embaldosar.'
WHERE code = '02-A-10' AND country_id = (SELECT id FROM countries WHERE code = 'ES');

-- Perú
UPDATE price_master 
SET 
  subcategory = 'TARRAJEO PREVIO ENCHAPES DE PARED',
  concept = 'Tarrajeo de las paredes para obtener una base lisa y plomada antes de enchapar.'
WHERE code = '02-A-09' AND country_id = (SELECT id FROM countries WHERE code = 'PE');

UPDATE price_master 
SET 
  subcategory = 'TARRAJEO PREVIO PISOS',
  concept = 'Tarrajeo y nivelación del piso para obtener una base lisa antes de colocar mayólica.'
WHERE code = '02-A-10' AND country_id = (SELECT id FROM countries WHERE code = 'PE');

-- Bolivia
UPDATE price_master 
SET 
  subcategory = 'REVOQUE PREVIO ENCHAPES DE PARED',
  concept = 'Revoque de las paredes para obtener una base lisa y plomada antes de colocar mayólica.'
WHERE code = '02-A-09' AND country_id = (SELECT id FROM countries WHERE code = 'BO');

UPDATE price_master 
SET 
  subcategory = 'REVOQUE PREVIO PISOS',
  concept = 'Revoque y nivelación del piso para obtener una base lisa antes de embaldosar.'
WHERE code = '02-A-10' AND country_id = (SELECT id FROM countries WHERE code = 'BO');

-- Actualizar también en la tabla price_categories si existe
UPDATE price_categories 
SET name = 'RASEO PREVIO ALICATADOS DE PARED'
WHERE name = 'RASEO PREVIO ALICATADOS';

UPDATE price_categories 
SET name = 'RASEO PREVIO EMBALDOSADOS SUELO'
WHERE name = 'RASEO PREVIO LEVANTES TABIQUERÍA';
