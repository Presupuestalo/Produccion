-- Restaurar créditos de presupuestaloficial@gmail.com
-- Se descontaron 15 créditos incorrectamente, deberían haber sido 350

DO $$
DECLARE
  target_user_id UUID;
BEGIN
  -- Buscar el usuario por email
  SELECT id INTO target_user_id
  FROM auth.users
  WHERE email = 'presupuestaloficial@gmail.com';
  
  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuario no encontrado';
  END IF;
  
  -- Restaurar los 15 créditos descontados incorrectamente
  UPDATE company_credits
  SET 
    credits_balance = 1000,
    credits_spent_total = 0,
    updated_at = NOW()
  WHERE company_id = target_user_id;
  
  -- Eliminar las transacciones incorrectas
  DELETE FROM credit_transactions
  WHERE company_id = target_user_id
    AND type = 'spent';
  
  -- Eliminar las interacciones de lead incorrectas
  DELETE FROM lead_interactions
  WHERE company_id = target_user_id
    AND action = 'accessed';
  
  -- Resetear el contador del lead si fue incrementado
  UPDATE lead_requests
  SET 
    companies_accessed_count = GREATEST(0, companies_accessed_count - 1),
    companies_accessed_ids = array_remove(companies_accessed_ids, target_user_id)
  WHERE target_user_id = ANY(companies_accessed_ids);
  
  RAISE NOTICE 'Créditos restaurados a 1000 para presupuestaloficial@gmail.com';
END $$;

-- Verificar el resultado
SELECT 
  cc.credits_balance,
  cc.credits_spent_total,
  u.email
FROM company_credits cc
JOIN auth.users u ON u.id = cc.company_id
WHERE u.email = 'presupuestaloficial@gmail.com';
