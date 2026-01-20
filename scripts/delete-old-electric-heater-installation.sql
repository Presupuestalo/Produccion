-- Script para eliminar el precio obsoleto 07-CAL-01
-- Fecha: 2025-01-20
-- Descripción: Elimina "INSTALACIÓN DE RADIADOR ELÉCTRICO" que ya no se usa

-- Primero eliminar todos los precios por país asociados
-- Convertimos el UUID a TEXT porque price_master_by_country.price_master_id es TEXT
DELETE FROM price_master_by_country
WHERE price_master_id IN (
  SELECT id::TEXT FROM price_master WHERE code = '07-CAL-01'
);

-- Luego eliminar el precio master
DELETE FROM price_master
WHERE code = '07-CAL-01';

-- Mensaje de confirmación
DO $$
BEGIN
  RAISE NOTICE 'Precio 07-CAL-01 (INSTALACIÓN DE RADIADOR ELÉCTRICO) eliminado correctamente de price_master y price_master_by_country para todos los países';
END $$;
