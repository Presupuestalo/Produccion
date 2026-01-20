-- Actualizar los nombres de los conceptos de raseo previo en price_master

-- Actualizar 02-A-09: Raseo previo alicatados de pared
UPDATE price_master
SET 
  subcategory = 'RASEO PREVIO ALICATADOS DE PARED',
  description = 'Raseo de las paredes para obtener una base lisa y plomada antes de alicatar.'
WHERE code = '02-A-09';

-- Actualizar 02-A-10: Raseo previo embaldosados suelo
UPDATE price_master
SET 
  subcategory = 'RASEO PREVIO EMBALDOSADOS SUELO',
  description = 'Raseo del suelo para obtener una base lisa antes de embaldosar.'
WHERE code = '02-A-10';
