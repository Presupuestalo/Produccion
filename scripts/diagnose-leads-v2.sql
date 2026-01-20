-- Diagnóstico de leads en el marketplace

-- 1. Ver todos los lead_requests
SELECT 
  id,
  status,
  selected_company,
  companies_accessed_count,
  expires_at,
  city,
  province,
  estimated_budget,
  created_at,
  homeowner_id
FROM lead_requests
ORDER BY created_at DESC
LIMIT 20;

-- 2. Contar leads por status
SELECT status, COUNT(*) as cantidad
FROM lead_requests
GROUP BY status;

-- 3. Ver leads "open" específicamente
SELECT 
  id,
  status,
  selected_company,
  CASE 
    WHEN selected_company IS NULL THEN 'NULL'
    WHEN selected_company = '' THEN 'EMPTY STRING'
    ELSE 'HAS VALUE: ' || selected_company::text
  END as selected_company_debug,
  companies_accessed_count,
  expires_at > NOW() as not_expired,
  city,
  province
FROM lead_requests
WHERE status = 'open'
ORDER BY created_at DESC;

-- 4. Ver perfiles de profesionales
SELECT id, email, user_type, is_admin, full_name
FROM profiles
WHERE user_type = 'professional' OR user_type = 'company'
LIMIT 10;
