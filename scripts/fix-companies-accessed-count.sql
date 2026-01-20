-- Script para diagnosticar y corregir el companies_accessed_count
-- Primero verificar los datos actuales

-- 1. Ver todas las interacciones
SELECT 
  li.id as interaction_id,
  li.lead_request_id,
  li.company_id,
  li.action,
  li.accessed_at,
  lr.client_name,
  lr.companies_accessed_count,
  lr.companies_accessed_ids
FROM lead_interactions li
LEFT JOIN lead_requests lr ON li.lead_request_id = lr.id
ORDER BY li.accessed_at DESC;

-- 2. Ver el estado actual de lead_requests
SELECT 
  id,
  client_name,
  companies_accessed_count,
  companies_accessed_ids,
  max_companies,
  status
FROM lead_requests
ORDER BY created_at DESC;

-- 3. Sincronizar companies_accessed_count basándose en lead_interactions
-- Esto cuenta las interacciones reales y actualiza el contador
UPDATE lead_requests lr
SET companies_accessed_count = (
  SELECT COUNT(DISTINCT li.company_id)
  FROM lead_interactions li
  WHERE li.lead_request_id = lr.id
  AND li.action = 'accessed'
);

-- 4. Sincronizar companies_accessed_ids basándose en lead_interactions
UPDATE lead_requests lr
SET companies_accessed_ids = (
  SELECT COALESCE(array_agg(DISTINCT li.company_id), ARRAY[]::uuid[])
  FROM lead_interactions li
  WHERE li.lead_request_id = lr.id
  AND li.action = 'accessed'
);

-- 5. Verificar el resultado
SELECT 
  id,
  client_name,
  companies_accessed_count,
  companies_accessed_ids,
  max_companies
FROM lead_requests
ORDER BY created_at DESC;
