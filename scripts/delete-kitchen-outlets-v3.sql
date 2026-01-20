-- Script para eliminar la partida "PUNTOS ENCHUFE APARATOS DE COCINA" (código 05-E-13)
-- Esta partida ya no es necesaria porque los enchufes de aparatos de cocina
-- ya están incluidos en los enchufes normales contabilizados por habitaciones

DO $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Eliminar todas las entradas con código '05-E-13' de la tabla price_master
  -- Esto incluye tanto precios base como personalizados de todos los usuarios
  DELETE FROM price_master 
  WHERE code = '05-E-13';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RAISE NOTICE 'Se eliminaron % registros de "PUNTOS ENCHUFE APARATOS DE COCINA" (código 05-E-13)', deleted_count;
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error al eliminar la partida: %', SQLERRM;
    RAISE;
END $$;
