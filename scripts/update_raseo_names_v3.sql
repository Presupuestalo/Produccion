-- Actualizar nombres de raseo previo en price_master
-- 02-A-09: Raseo previo alicatados de pared
-- 02-A-10: Raseo previo embaldosados suelo

UPDATE price_master
SET 
  concept = 'RASEO PREVIO ALICATADOS DE PARED',
  description = 'Raseo de las paredes para obtener una base lisa y plomada antes de alicatar.'
WHERE code = '02-A-09';

UPDATE price_master
SET 
  concept = 'RASEO PREVIO EMBALDOSADOS SUELO',
  description = 'Raseo del suelo para obtener una base lisa y nivelada antes de embaldosar.'
WHERE code = '02-A-10';
