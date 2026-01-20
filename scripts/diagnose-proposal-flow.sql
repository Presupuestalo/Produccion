-- 1. Ver estructura de las tablas
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'lead_requests'
ORDER BY ordinal_position;

-- 2. Ver estructura de professional_proposals
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'professional_proposals'
ORDER BY ordinal_position;

-- 3. Ver estructura de projects
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'projects'
ORDER BY ordinal_position;

-- 4. Ver todas las propuestas profesionales
SELECT * FROM professional_proposals ORDER BY created_at DESC LIMIT 5;

-- 5. Ver los lead_requests
SELECT * FROM lead_requests ORDER BY created_at DESC LIMIT 5;

-- 6. Ver proyectos recientes
SELECT * FROM projects ORDER BY created_at DESC LIMIT 5;

-- 7. Ver perfiles
SELECT id, email, full_name, company_name, role 
FROM profiles 
ORDER BY created_at DESC 
LIMIT 10;
