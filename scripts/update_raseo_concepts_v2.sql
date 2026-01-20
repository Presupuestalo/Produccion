-- Actualizar conceptos de raseo previo en price_master
-- 02-A-09: Raseo previo alicatados de pared
-- 02-A-10: Raseo previo embaldosados suelo

UPDATE price_master
SET 
  subcategory = 'RASEO PREVIO ALICATADOS PARED',
  description = 'Raseo de las paredes para obtener una base lisa y plomada antes de alicatar.'
WHERE code = '02-A-09';

UPDATE price_master
SET 
  subcategory = 'RASEO PREVIO EMBALDOSADOS SUELO',
  description = 'Raseo y nivelación del suelo antes de embaldosar.'
WHERE code = '02-A-10';
