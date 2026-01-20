-- Script para restaurar los créditos de presupuestaloficial@gmail.com a 1000
-- El usuario tiene 650 créditos pero debería tener 1000 para pruebas

DO $$
DECLARE
  target_user_id UUID;
  current_balance INTEGER;
BEGIN
  -- Buscar el usuario por email
  SELECT id INTO target_user_id
  FROM auth.users
  WHERE email = 'presupuestaloficial@gmail.com';

  IF target_user_id IS NULL THEN
    RAISE NOTICE 'Usuario no encontrado';
    RETURN;
  END IF;

  -- Obtener balance actual
  SELECT credits_balance INTO current_balance
  FROM company_credits
  WHERE company_id = target_user_id;

  RAISE NOTICE 'Usuario encontrado: %, Balance actual: %', target_user_id, current_balance;

  -- Actualizar a 1000 créditos
  UPDATE company_credits
  SET 
    credits_balance = 1000,
    credits_purchased_total = 1000,
    credits_spent_total = 0,
    updated_at = NOW()
  WHERE company_id = target_user_id;

  -- Eliminar transacciones de prueba
  DELETE FROM credit_transactions
  WHERE company_id = target_user_id;

  -- Eliminar interacciones de prueba para poder probar de nuevo
  DELETE FROM lead_interactions
  WHERE company_id = target_user_id;

  RAISE NOTICE 'Créditos restaurados a 1000. Transacciones e interacciones eliminadas.';
END $$;

-- Verificar resultado
SELECT 
  cc.company_id,
  p.full_name,
  au.email,
  cc.credits_balance,
  cc.credits_spent_total
FROM company_credits cc
JOIN auth.users au ON au.id = cc.company_id
LEFT JOIN profiles p ON p.id = cc.company_id
WHERE au.email = 'presupuestaloficial@gmail.com';
