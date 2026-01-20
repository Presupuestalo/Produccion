-- Script para eliminar el concepto "ANULACIÓN INSTALACIÓN ELÉCTRICA/FONTANERÍA" (código 01-D-11)
-- de la tabla price_master de todos los países
-- NO afecta la lógica de presupuestos, solo elimina el precio maestro

-- Eliminar el concepto con código 01-D-11 de price_master
DELETE FROM price_master 
WHERE code = '01-D-11' OR code = 'MX-01-D-11';

-- Verificar que se eliminó correctamente
SELECT 
    CASE 
        WHEN COUNT(*) = 0 THEN 'Concepto 01-D-11 eliminado correctamente de price_master'
        ELSE 'ERROR: Todavía existen ' || COUNT(*) || ' registros con código 01-D-11'
    END as resultado
FROM price_master 
WHERE code = '01-D-11' OR code = 'MX-01-D-11';
