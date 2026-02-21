-- Insert script for missing door prices

DO $$
DECLARE
    cat_derribos UUID;
    cat_carpinteria UUID;
BEGIN
    -- Get Category IDs
    SELECT id INTO cat_derribos FROM price_categories WHERE name ILIKE '%DERRIBOS%' LIMIT 1;
    SELECT id INTO cat_carpinteria FROM price_categories WHERE name ILIKE '%CARPINTERÍA%' LIMIT 1;

    -- 1. Demolición de puerta doble abatible (01-D-21)
    IF NOT EXISTS (SELECT 1 FROM price_master WHERE code = '01-D-21') THEN
        INSERT INTO price_master (
            id, category_id, code, subcategory, description, unit, material_cost, labor_cost, is_active
        ) VALUES (
            gen_random_uuid(), cat_derribos, '01-D-21', 'Desmontaje de puerta doble abatible',
            'Desmontaje de bloque de puerta doble abatible, incluyendo hoja, cerco, tapajuntas, garras y retirada de escombros al contenedor.',
            'ud', 0.00, 45.00, true
        );
    ELSE
        UPDATE price_master SET is_active = true WHERE code = '01-D-21';
    END IF;

    -- 2. Demolición de puerta corredera exterior (01-D-22)
    IF NOT EXISTS (SELECT 1 FROM price_master WHERE code = '01-D-22') THEN
        INSERT INTO price_master (
            id, category_id, code, subcategory, description, unit, material_cost, labor_cost, is_active
        ) VALUES (
            gen_random_uuid(), cat_derribos, '01-D-22', 'Desmontaje de puerta corredera exterior',
            'Desmontaje de bloque de puerta corredera exterior con guías/carril, manual o automática, y retirada al contenedor.',
            'ud', 0.00, 40.00, true
        );
    ELSE
        UPDATE price_master SET is_active = true WHERE code = '01-D-22';
    END IF;

    -- 3. Suministro e instalación de puerta corredera exterior (05-C-18)
    IF NOT EXISTS (SELECT 1 FROM price_master WHERE code = '05-C-18') THEN
        INSERT INTO price_master (
            id, category_id, code, subcategory, description, unit, material_cost, labor_cost, is_active
        ) VALUES (
            gen_random_uuid(), cat_carpinteria, '05-C-18', 'Puerta corredera exterior',
            'Suministro y colocación de puerta corredera exterior (vista), incluyendo guías, herrajes, tapajuntas y ajuste de hoja.',
            'ud', 185.00, 70.00, true
        );
    ELSE
        UPDATE price_master SET is_active = true WHERE code = '05-C-18';
    END IF;

    -- 4. Suministro e instalación de puerta doble abatible (05-C-20)
    IF NOT EXISTS (SELECT 1 FROM price_master WHERE code = '05-C-20') THEN
        INSERT INTO price_master (
            id, category_id, code, subcategory, description, unit, material_cost, labor_cost, is_active
        ) VALUES (
            gen_random_uuid(), cat_carpinteria, '05-C-20', 'Puerta doble abatible',
            'Suministro y colocación de puerta doble abatible (dos hojas), lacada o madera, incluyendo cerco, tapajuntas, herrajes y manillas.',
            'ud', 250.00, 90.00, true
        );
    ELSE
        UPDATE price_master SET is_active = true WHERE code = '05-C-20';
    END IF;
    
    -- 5. Suministro e instalación de premarco doble (05-C-21)
    IF NOT EXISTS (SELECT 1 FROM price_master WHERE code = '05-C-21') THEN
        INSERT INTO price_master (
            id, category_id, code, subcategory, description, unit, material_cost, labor_cost, is_active
        ) VALUES (
            gen_random_uuid(), cat_carpinteria, '05-C-21', 'Premarco doble',
            'Suministro y colocación de premarco de madera de pino para puerta doble abatible, recibido con yeso o espuma de poliuretano.',
            'ud', 40.00, 25.00, true
        );
    ELSE
        UPDATE price_master SET is_active = true WHERE code = '05-C-21';
    END IF;

END $$;
