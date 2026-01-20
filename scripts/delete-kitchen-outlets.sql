-- Eliminar la partida "PUNTOS ENCHUFE APARATOS DE COCINA" de la tabla master_prices
-- Esta partida ya está incluida en los enchufes normales de las habitaciones

DELETE FROM master_prices 
WHERE code = '05-E-13' 
AND concept ILIKE '%PUNTOS ENCHUFE APARATOS DE COCINA%';

-- Verificar que se eliminó correctamente
SELECT code, concept, unit, price 
FROM master_prices 
WHERE code = '05-E-13';
