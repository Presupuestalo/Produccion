-- Script para eliminar la partida "PUNTOS ENCHUFE APARATOS DE COCINA" de la tabla price_master
-- Esta partida ya no es necesaria porque los enchufes de aparatos de cocina
-- ya están incluidos en los enchufes normales de las habitaciones

DO $$
BEGIN
  -- Eliminar la partida de enchufes de aparatos de cocina
  DELETE FROM price_master 
  WHERE code = '05-E-13' 
    AND description ILIKE '%PUNTOS ENCHUFE APARATOS DE COCINA%';
  
  RAISE NOTICE 'Partida "PUNTOS ENCHUFE APARATOS DE COCINA" eliminada correctamente';
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error al eliminar la partida: %', SQLERRM;
END $$;
