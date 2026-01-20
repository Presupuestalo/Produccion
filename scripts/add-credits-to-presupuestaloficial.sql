-- Script para añadir 1000 créditos a presupuestaloficial para pruebas
-- Primero obtenemos el ID del usuario por su email/company_name

DO $$
DECLARE
    user_id UUID;
    current_balance INTEGER;
BEGIN
    -- Buscar el usuario presupuestaloficial por nombre de empresa o email
    SELECT id INTO user_id 
    FROM profiles 
    WHERE LOWER(company_name) LIKE '%presupuestaloficial%' 
       OR LOWER(full_name) LIKE '%presupuestaloficial%'
       OR LOWER(email) LIKE '%presupuestaloficial%'
    LIMIT 1;
    
    IF user_id IS NULL THEN
        RAISE NOTICE 'No se encontró el usuario presupuestaloficial';
        RETURN;
    END IF;
    
    RAISE NOTICE 'Usuario encontrado: %', user_id;
    
    -- Verificar si ya tiene registro en company_credits
    SELECT credits_balance INTO current_balance
    FROM company_credits
    WHERE company_id = user_id;
    
    IF current_balance IS NULL THEN
        -- Crear registro con 1000 créditos
        INSERT INTO company_credits (company_id, credits_balance, credits_purchased_total, credits_spent_total)
        VALUES (user_id, 1000, 1000, 0);
        RAISE NOTICE 'Creado nuevo registro con 1000 créditos';
    ELSE
        -- Actualizar balance añadiendo 1000 créditos
        UPDATE company_credits
        SET credits_balance = credits_balance + 1000,
            credits_purchased_total = credits_purchased_total + 1000,
            updated_at = NOW()
        WHERE company_id = user_id;
        RAISE NOTICE 'Actualizado balance de % a % créditos', current_balance, current_balance + 1000;
    END IF;
    
    -- Registrar la transacción
    INSERT INTO credit_transactions (company_id, amount, type, description, created_at)
    VALUES (user_id, 1000, 'purchase', 'Créditos de prueba añadidos manualmente', NOW());
    
    RAISE NOTICE 'Transacción registrada correctamente';
END $$;

-- Verificar el resultado
SELECT 
    p.id,
    p.full_name,
    p.company_name,
    p.email,
    cc.credits_balance,
    cc.credits_purchased_total,
    cc.credits_spent_total
FROM profiles p
LEFT JOIN company_credits cc ON cc.company_id = p.id
WHERE LOWER(p.company_name) LIKE '%presupuestaloficial%' 
   OR LOWER(p.full_name) LIKE '%presupuestaloficial%'
   OR LOWER(p.email) LIKE '%presupuestaloficial%';
