-- Script para eliminar los textos (Montaje MO) y (MO) de las descripciones de precios
-- Ya que se da por hecho que es mano de obra al tener la sección de materiales separada

-- FONTANERÍA - Eliminar (Montaje MO)
UPDATE public.price_master SET subcategory = 'INSTALACIÓN INODORO' WHERE id = '03-F-06';
UPDATE public.price_master SET subcategory = 'COLOCACIÓN PLATO DE DUCHA' WHERE id = '03-F-07';
UPDATE public.price_master SET subcategory = 'INSTALACIÓN MUEBLE LAVABO' WHERE id = '03-F-08';
UPDATE public.price_master SET subcategory = 'INSTALACIÓN MAMPARA' WHERE id = '03-F-09';
UPDATE public.price_master SET subcategory = 'INSTALACIÓN GRIFO DUCHA' WHERE id = '03-F-10';
UPDATE public.price_master SET subcategory = 'INSTALACIÓN GRIFO LAVABO' WHERE id = '03-F-11';

-- FONTANERÍA - Eliminar (MO)
UPDATE public.price_master SET subcategory = 'MONTAJE FREGADERO, LAVADORA Y LAVAVAJILLAS' WHERE id = '03-F-12';
UPDATE public.price_master SET subcategory = 'MONTAJE Y COLOCACIÓN CAMPANA EXTRACTORA COCINA' WHERE id = '03-F-13';

-- CARPINTERÍA - Eliminar (MO)
UPDATE public.price_master SET subcategory = 'INSTALACIÓN PARQUET FLOTANTE' WHERE id = '04-C-02';
UPDATE public.price_master SET subcategory = 'INSTALACIÓN SUELO VINÍLICO' WHERE id = '04-C-03';
UPDATE public.price_master SET subcategory = 'SUMINISTRO Y COLOCACIÓN PREMARCOS' WHERE id = '04-C-05';
UPDATE public.price_master SET subcategory = 'SUMINISTRO Y COLOCACIÓN FORRO (MARCOS SIN PUERTA)' WHERE id = '04-C-06';
UPDATE public.price_master SET subcategory = 'COLOCACIÓN PUERTA ABATIBLE 1 HOJA' WHERE id = '04-C-07';
UPDATE public.price_master SET subcategory = 'COLOCACIÓN PUERTA CORREDERA' WHERE id = '04-C-08';
UPDATE public.price_master SET subcategory = 'COLOCACIÓN PUERTA ENTRADA (Blindada)' WHERE id = '04-C-09';

-- ALBAÑILERÍA - Eliminar (Colocación MO)
UPDATE public.price_master SET subcategory = 'ALICATADOS PARED' WHERE id = '02-A-06';
UPDATE public.price_master SET subcategory = 'EMBALDOSADO SUELOS' WHERE id = '02-A-07';
UPDATE public.price_master SET subcategory = 'EMBALDOSADO SUELO RADIANTE' WHERE id = '02-A-08';

-- ELECTRICIDAD - Eliminar (MO)
UPDATE public.price_master SET subcategory = 'SUMINISTRO Y COLOCACIÓN FOCOS' WHERE id = '05-E-14';

-- CALEFACCIÓN - Eliminar (Montaje MO) y (MO)
UPDATE public.price_master SET subcategory = 'COLOCACIÓN CALDERA DE GAS' WHERE id = '06-CAL-03';
UPDATE public.price_master SET subcategory = 'COLOCACIÓN Y MOVIMIENTO RADIADORES' WHERE id = '06-CAL-05';

-- CARPINTERÍA - Eliminar (MO y Materiales) para ser consistente
UPDATE public.price_master SET subcategory = 'COLOCACIÓN RODAPIÉ DM LACADO' WHERE id = '04-C-04';
