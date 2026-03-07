-- Actualizar el concepto de la manta a base aislante
UPDATE price_master 
SET subcategory = 'BASE AISLANTE',
    description = 'Suministro de lámina aislante bajo tarima.'
WHERE code = '10-M-11';

-- También en user_prices por si acaso
UPDATE user_prices 
SET subcategory = 'BASE AISLANTE',
    description = 'Suministro de lámina aislante bajo tarima.'
WHERE code = '10-M-11';
