
-- Eliminar material antiguo duplicado o incorrecto
DELETE FROM public.price_master 
WHERE id = '905fed3c-5be2-4932-bd65-e02058248e32';

-- Insertar Puerta Corredera Exterior en MATERIALES (España)
-- Código: 10-M-26
-- Descripción: Puerta corredera exterior con carril
-- Categoría: MATERIALES (0d110423-99b0-4c31-b61a-6d6b1ee629c5)
-- Subcategoría: PUERTA CORREDERA CON CARRIL
INSERT INTO public.price_master (
    id,
    code,
    category_id,
    subcategory,
    description,
    long_description,
    unit,
    labor_cost,
    material_cost,
    equipment_cost,
    other_cost,
    margin_percentage,
    waste_percentage,
    is_active
) VALUES (
    gen_random_uuid(),
    '10-M-26',
    '0d110423-99b0-4c31-b61a-6d6b1ee629c5', -- ID de MATERIALES
    'PUERTA CORREDERA CON CARRIL', -- Subcategoría solicitada
    'Puerta corredera exterior con carril',
    'Suministro e instalación de puerta corredera exterior de aluminio reforzado, incluye carril de rodadura inferior, herrajes de seguridad y guiado superior.',
    'ud',
    0,
    300,
    0,
    0,
    0,
    0,
    true
);
