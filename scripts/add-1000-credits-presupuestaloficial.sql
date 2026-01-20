-- Script para añadir 1000 créditos de prueba a presupuestaloficial@gmail.com
-- Busca directamente en auth.users por email

DO $$
DECLARE
  target_user_id UUID;
  target_email TEXT := 'presupuestaloficial@gmail.com';
  existing_balance INT;
BEGIN
  -- Buscar el user_id en auth.users por email
  SELECT id INTO target_user_id
  FROM auth.users
  WHERE email = target_email;
  
  IF target_user_id IS NULL THEN
    RAISE NOTICE 'Usuario con email % no encontrado en auth.users', target_email;
    RETURN;
  END IF;
  
  RAISE NOTICE 'Usuario encontrado: % con ID: %', target_email, target_user_id;
  
  -- Verificar si ya existe en company_credits
  SELECT credits_balance INTO existing_balance
  FROM company_credits
  WHERE company_id = target_user_id;
  
  IF existing_balance IS NOT NULL THEN
    -- Actualizar balance existente
    UPDATE company_credits
    SET 
      credits_balance = credits_balance + 1000,
      credits_purchased_total = COALESCE(credits_purchased_total, 0) + 1000,
      updated_at = NOW()
    WHERE company_id = target_user_id;
    
    RAISE NOTICE 'Balance actualizado. Balance anterior: %, Nuevo balance: %', existing_balance, existing_balance + 1000;
  ELSE
    -- Crear nuevo registro
    INSERT INTO company_credits (
      company_id,
      credits_balance,
      credits_purchased_total,
      credits_spent_total,
      created_at,
      updated_at
    ) VALUES (
      target_user_id,
      1000,
      1000,
      0,
      NOW(),
      NOW()
    );
    
    RAISE NOTICE 'Nuevo registro creado con 1000 créditos para user_id: %', target_user_id;
  END IF;
  
  -- Usar columna 'type' en vez de 'transaction_type' y eliminar 'balance_after'
  -- Registrar la transacción
  INSERT INTO credit_transactions (
    company_id,
    amount,
    type,
    description,
    created_at
  ) VALUES (
    target_user_id,
    1000,
    'purchase',
    'Créditos de prueba añadidos manualmente',
    NOW()
  );
  
  RAISE NOTICE 'Transacción registrada correctamente';
  
END $$;

-- Verificar el resultado
SELECT 
  cc.company_id,
  au.email,
  p.full_name,
  p.company_name,
  cc.credits_balance,
  cc.credits_purchased_total,
  cc.credits_spent_total
FROM company_credits cc
JOIN auth.users au ON au.id = cc.company_id
LEFT JOIN profiles p ON p.id = cc.company_id
WHERE au.email = 'presupuestaloficial@gmail.com';
