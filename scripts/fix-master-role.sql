-- Script para verificar y configurar el rol master

-- 1. Ver el rol actual del usuario master
SELECT id, email, role 
FROM profiles 
WHERE email IN ('presupuestaloficial@gmail.com', 'admin@presupuestalo.com');

-- 2. Actualizar el rol a 'master' si no lo es
UPDATE profiles 
SET role = 'master' 
WHERE email IN ('presupuestaloficial@gmail.com', 'admin@presupuestalo.com')
AND (role IS NULL OR role != 'master');

-- 3. Verificar que se aplicó el cambio
SELECT id, email, role 
FROM profiles 
WHERE email IN ('presupuestaloficial@gmail.com', 'admin@presupuestalo.com');
