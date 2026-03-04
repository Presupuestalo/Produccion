-- SCRIPT DE MIGRACIÓN DE DATOS DE USUARIO (CORREGIDO V7)
-- Origen: hurtatisbuitragodelio (728b7573-bcf4-4288-90b7-cdf9a7fa7a20)
-- Destino: info@vascol.eus (63c55fc6-b2b9-4891-8b4d-2c159e0e59e4)

DO $$
DECLARE
    src_user_id UUID := '728b7573-bcf4-4288-90b7-cdf9a7fa7a20';
    dest_user_id UUID := '63c55fc6-b2b9-4891-8b4d-2c159e0e59e4';
    
    -- Variables para el bucle de proyectos
    p_record RECORD;
    new_project_id UUID;
    
    -- Variables para el bucle de presupuestos
    b_record RECORD;
    new_budget_id UUID;
    
    -- Variables para el bucle de planos (floor_plans)
    fp_record RECORD;
    
    -- Variables para el bucle de contratos
    c_record RECORD;
    new_contract_id UUID;

    -- Variables para SQL dinámico
    dyn_cols TEXT;
    has_user_id_col BOOLEAN;
BEGIN
    RAISE NOTICE 'Iniciando migración de % a %', src_user_id, dest_user_id;

    -- 1. Copiar configuración de empresa (user_company_settings)
    INSERT INTO user_company_settings (
        user_id, company_name, company_address, company_city, company_province, 
        company_country, company_postal_code, company_phone, company_email, 
        company_website, company_logo_url, default_presentation_text, 
        default_clarification_notes, show_vat, vat_percentage
    )
    SELECT 
        dest_user_id, company_name, company_address, company_city, company_province, 
        company_country, company_postal_code, company_phone, company_email, 
        company_website, company_logo_url, default_presentation_text, 
        default_clarification_notes, show_vat, vat_percentage
    FROM user_company_settings
    WHERE user_id = src_user_id
    ON CONFLICT (user_id) DO UPDATE SET
        company_name = EXCLUDED.company_name,
        company_address = EXCLUDED.company_address,
        company_city = EXCLUDED.company_city,
        company_province = EXCLUDED.company_province,
        company_postal_code = EXCLUDED.company_postal_code,
        company_phone = EXCLUDED.company_phone,
        company_email = EXCLUDED.company_email,
        company_website = EXCLUDED.company_website,
        company_logo_url = EXCLUDED.company_logo_url,
        default_presentation_text = EXCLUDED.default_presentation_text,
        default_clarification_notes = EXCLUDED.default_clarification_notes,
        show_vat = EXCLUDED.show_vat,
        vat_percentage = EXCLUDED.vat_percentage;

    -- 2. Copiar precios personalizados (price_master)
    -- NOTA: Omitimos base_price y final_price porque son GENERATED ALWAYS
    INSERT INTO price_master (
        id, code, category_id, subcategory, description, long_description, unit,
        labor_cost, material_cost, equipment_cost, other_cost,
        margin_percentage, is_active, is_custom, user_id, notes,
        color, brand, model
    )
    SELECT 
        gen_random_uuid(), -- Nuevo ID
        code, category_id, subcategory, description, long_description, unit,
        labor_cost, material_cost, equipment_cost, other_cost,
        margin_percentage, is_active, is_custom, dest_user_id, notes,
        color, brand, model
    FROM price_master
    WHERE user_id = src_user_id;

    -- 3. Copiar Planos 2D independientes (floor_plans) - DINÁMICO
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'floor_plans') THEN
        -- Detectar columnas excepto IDs y user_id
        SELECT string_agg(column_name, ', ')
        FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'floor_plans' 
        AND column_name NOT IN ('id', 'user_id', 'created_at', 'updated_at')
        INTO dyn_cols;

        EXECUTE format('
            INSERT INTO floor_plans (id, user_id, created_at, updated_at %s)
            SELECT gen_random_uuid(), $1, created_at, updated_at %s
            FROM floor_plans
            WHERE user_id = $2',
            CASE WHEN dyn_cols IS NOT NULL THEN ', ' || dyn_cols ELSE '' END,
            CASE WHEN dyn_cols IS NOT NULL THEN ', ' || dyn_cols ELSE '' END
        ) USING dest_user_id, src_user_id;
    END IF;

    -- 4. Copiar PROYECTOS y sus dependencias
    FOR p_record IN SELECT * FROM projects WHERE user_id = src_user_id LOOP
        new_project_id := gen_random_uuid();
        
        -- Insertar el proyecto clonado
        INSERT INTO projects (
            id, user_id, title, description, status, progress,
            client, client_email, client_phone, client_dni,
            street, project_floor, door, city, province, country,
            ceiling_height, structure_type, has_elevator,
            budget, color, duedate,
            license_status, license_date, contract_signed, contract_date,
            is_from_lead, created_at
        ) VALUES (
            new_project_id, dest_user_id, p_record.title, p_record.description, 
            p_record.status, p_record.progress, p_record.client, 
            p_record.client_email, p_record.client_phone, p_record.client_dni,
            p_record.street, p_record.project_floor, p_record.door, p_record.city, 
            p_record.province, p_record.country, p_record.ceiling_height, 
            p_record.structure_type, p_record.has_elevator,
            COALESCE(p_record.budget, 0), p_record.color, p_record.duedate,
            p_record.license_status, p_record.license_date, p_record.contract_signed, p_record.contract_date,
            COALESCE(p_record.is_from_lead, false), p_record.created_at
        );

        -- 4.1 Copiar calculator_data - DINÁMICO
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'calculator_data') THEN
            SELECT string_agg(column_name, ', ')
            FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = 'calculator_data' 
            AND column_name NOT IN ('id', 'project_id', 'user_id', 'created_at', 'updated_at')
            INTO dyn_cols;

            SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'calculator_data' AND column_name = 'user_id') INTO has_user_id_col;

            EXECUTE format('
                INSERT INTO calculator_data (id, project_id, created_at, updated_at %s %s)
                SELECT gen_random_uuid(), $1, created_at, updated_at %s %s
                FROM calculator_data
                WHERE project_id = $2',
                CASE WHEN has_user_id_col THEN ', user_id' ELSE '' END,
                CASE WHEN dyn_cols IS NOT NULL THEN ', ' || dyn_cols ELSE '' END,
                CASE WHEN has_user_id_col THEN ', $3' ELSE '' END,
                CASE WHEN dyn_cols IS NOT NULL THEN ', ' || dyn_cols ELSE '' END
            ) USING new_project_id, p_record.id, dest_user_id;
        END IF;

        -- 4.2 Copiar budget_settings - DINÁMICO
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'budget_settings') THEN
            SELECT string_agg(column_name, ', ')
            FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = 'budget_settings' 
            AND column_name NOT IN ('id', 'project_id', 'created_at', 'updated_at')
            INTO dyn_cols;

            EXECUTE format('
                INSERT INTO budget_settings (id, project_id %s)
                SELECT gen_random_uuid(), $1 %s
                FROM budget_settings
                WHERE project_id = $2',
                CASE WHEN dyn_cols IS NOT NULL THEN ', ' || dyn_cols ELSE '' END,
                CASE WHEN dyn_cols IS NOT NULL THEN ', ' || dyn_cols ELSE '' END
            ) USING new_project_id, p_record.id;
        END IF;

        -- 4.3 Copiar demolition_settings - DINÁMICO
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'demolition_settings') THEN
            SELECT string_agg(column_name, ', ')
            FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = 'demolition_settings' 
            AND column_name NOT IN ('id', 'project_id', 'created_at', 'updated_at')
            INTO dyn_cols;

            EXECUTE format('
                INSERT INTO demolition_settings (id, project_id %s)
                SELECT gen_random_uuid(), $1 %s
                FROM demolition_settings
                WHERE project_id = $2',
                CASE WHEN dyn_cols IS NOT NULL THEN ', ' || dyn_cols ELSE '' END,
                CASE WHEN dyn_cols IS NOT NULL THEN ', ' || dyn_cols ELSE '' END
            ) USING new_project_id, p_record.id;
        END IF;

        -- 4.4 Copiar project_floor_plans (PLANOS ASOCIADOS) - DINÁMICO (Sustituye el error de 'thumbnail')
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'project_floor_plans') THEN
            SELECT string_agg(column_name, ', ')
            FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = 'project_floor_plans' 
            AND column_name NOT IN ('id', 'project_id', 'user_id', 'created_at', 'updated_at')
            INTO dyn_cols;

            SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'project_floor_plans' AND column_name = 'user_id') INTO has_user_id_col;

            EXECUTE format('
                INSERT INTO project_floor_plans (id, project_id, created_at, updated_at %s %s)
                SELECT gen_random_uuid(), $1, created_at, updated_at %s %s
                FROM project_floor_plans
                WHERE project_id = $2',
                CASE WHEN has_user_id_col THEN ', user_id' ELSE '' END,
                CASE WHEN dyn_cols IS NOT NULL THEN ', ' || dyn_cols ELSE '' END,
                CASE WHEN has_user_id_col THEN ', $3' ELSE '' END,
                CASE WHEN dyn_cols IS NOT NULL THEN ', ' || dyn_cols ELSE '' END
            ) USING new_project_id, p_record.id, dest_user_id;
        END IF;

        -- 4.5 Copiar licencias
        INSERT INTO license_documents (id, project_id, file_url, file_name, notes, uploaded_by)
        SELECT gen_random_uuid(), new_project_id, file_url, file_name, notes, dest_user_id
        FROM license_documents
        WHERE project_id = p_record.id;

        -- 4.6 Copiar citas
        INSERT INTO appointments (
            id, user_id, name, description, project_id, appointment_date, 
            address, guest_email, reminder_enabled, reminder_minutes_before, 
            google_calendar_event_id, status
        )
        SELECT 
            gen_random_uuid(), dest_user_id, name, description, new_project_id, 
            appointment_date, address, guest_email, reminder_enabled, 
            reminder_minutes_before, google_calendar_event_id, status
        FROM appointments
        WHERE project_id = p_record.id;

        -- 4.7 Copiar PRESUPUESTOS del proyecto
        FOR b_record IN SELECT * FROM budgets WHERE project_id = p_record.id LOOP
            new_budget_id := gen_random_uuid();
            
            INSERT INTO budgets (
                id, project_id, user_id, version_number, name, description, 
                is_original, status, subtotal, 
                tax_rate, tax_amount, total, notes, created_at
            ) VALUES (
                new_budget_id, new_project_id, dest_user_id, b_record.version_number, 
                b_record.name, b_record.description, b_record.is_original, 
                b_record.status, b_record.subtotal, b_record.tax_rate, 
                b_record.tax_amount, b_record.total, b_record.notes, b_record.created_at
            );

            -- Copiar partidas del presupuesto
            INSERT INTO budget_line_items (
                id, budget_id, category, concept_code, concept, description, 
                unit, quantity, unit_price, total_price, is_custom, sort_order, notes
            )
            SELECT 
                gen_random_uuid(), new_budget_id, category, concept_code, concept, 
                description, unit, quantity, unit_price, total_price, 
                is_custom, sort_order, notes
            FROM budget_line_items
            WHERE budget_id = b_record.id;

            -- Copiar ajustes (budget_adjustments) - DINÁMICO
            IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'budget_adjustments') THEN
                SELECT string_agg(column_name, ', ')
                FROM information_schema.columns 
                WHERE table_schema = 'public' AND table_name = 'budget_adjustments' 
                AND column_name NOT IN ('id', 'budget_id', 'created_at', 'updated_at')
                INTO dyn_cols;

                EXECUTE format('
                    INSERT INTO budget_adjustments (id, budget_id %s)
                    SELECT gen_random_uuid(), $1 %s
                    FROM budget_adjustments
                    WHERE budget_id = $2',
                    CASE WHEN dyn_cols IS NOT NULL THEN ', ' || dyn_cols ELSE '' END,
                    CASE WHEN dyn_cols IS NOT NULL THEN ', ' || dyn_cols ELSE '' END
                ) USING new_budget_id, b_record.id;
            END IF;

            -- Copiar contratos asociados a este presupuesto
            FOR c_record IN SELECT * FROM contracts WHERE budget_id = b_record.id LOOP
                new_contract_id := gen_random_uuid();
                
                INSERT INTO contracts (
                    id, project_id, budget_id, contract_data, created_at, 
                    signed_date, client_signature_url, company_signature_url, status
                ) VALUES (
                    new_contract_id, new_project_id, new_budget_id, c_record.contract_data, 
                    c_record.created_at, c_record.signed_date, c_record.client_signature_url, 
                    c_record.company_signature_url, c_record.status
                );

                -- Copiar cláusulas del contrato
                INSERT INTO contract_clauses (id, contract_id, clause_number, clause_text, is_custom)
                SELECT gen_random_uuid(), new_contract_id, clause_number, clause_text, is_custom
                FROM contract_clauses
                WHERE contract_id = c_record.id;
            END LOOP;
        END LOOP;

    END LOOP;

    RAISE NOTICE 'Migración completada con éxito.';
END $$;
