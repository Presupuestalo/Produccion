-- Script para limpiar el marketplace (Presmarket) y empezar de cero
-- Este script elimina solicitudes, ofertas, interacciones, reclamaciones y resetea contadores.

-- 1. Eliminar reclamaciones (hijo de lead_interactions)
DELETE FROM lead_claims;

-- 2. Eliminar propuestas de profesionales a leads (hijo de lead_requests)
DELETE FROM professional_proposals;

-- 3. Eliminar interacciones con leads (hijo de lead_requests)
DELETE FROM lead_interactions;

-- 4. Eliminar proyectos que son CLONES creados para profesionales tras comprar un lead
DO $$ 
BEGIN 
  -- Borramos por is_from_lead si la columna existe
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='projects' AND column_name='is_from_lead') THEN
    EXECUTE 'DELETE FROM projects WHERE is_from_lead = TRUE';
  END IF;
  
  -- Borramos por created_from_lead si la columna existe
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='projects' AND column_name='created_from_lead') THEN
    EXECUTE 'DELETE FROM projects WHERE created_from_lead IS NOT NULL';
  END IF;
END $$;

-- 5. Eliminar las solicitudes de leads (Presmarket)
-- Nota: Esto no borrará los proyectos originales de los propietarios, solo la "publicación" en el marketplace.
DELETE FROM lead_requests;

-- 6. Eliminar ofertas y solicitudes del sistema de presupuestos antiguo/paralelo (si existen)
DELETE FROM quote_offers;
DELETE FROM quote_requests;

-- 7. Limpiar transacciones de créditos que sean gastos o devoluciones de leads
-- Esto borra el rastro financiero de las compras de leads.
DELETE FROM credit_transactions WHERE type IN ('spent', 'refund');

-- 8. Resetear los contadores de gasto de las empresas en company_credits
UPDATE company_credits 
SET credits_spent_total = 0,
    updated_at = NOW();

-- 9. Resetear estadísticas de reclamaciones en los perfiles de profesionales
UPDATE profiles 
SET total_claims_submitted = 0,
    total_claims_approved = 0,
    total_claims_rejected = 0,
    claim_abuse_flag = FALSE;

DO $$ 
BEGIN 
  RAISE NOTICE 'Marketplace (Presmarket) limpiado exitosamente.';
END $$;
