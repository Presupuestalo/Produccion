-- Eliminar suelo laminado de la base de datos
-- Se elimina tanto el material (08-M-24) como la instalación (04-C-19)

-- Eliminar material de suelo laminado
DELETE FROM price_master
WHERE code = '08-M-24';

-- Eliminar instalación de suelo laminado
DELETE FROM price_master
WHERE code = '04-C-19';

-- Verificar que se hayan eliminado correctamente
SELECT 
  CASE 
    WHEN COUNT(*) = 0 THEN 'Suelo laminado eliminado correctamente'
    ELSE 'ERROR: Aún existen registros de suelo laminado'
  END as resultado
FROM price_master
WHERE code IN ('08-M-24', '04-C-19');
