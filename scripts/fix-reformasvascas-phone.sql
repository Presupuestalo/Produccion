-- Primero buscar el usuario reformasvascas@gmail.com
SELECT id, email, full_name, phone, phone_verified, created_at
FROM profiles
WHERE email = 'reformasvascas@gmail.com'
   OR email ILIKE '%reformasvascas%';

-- Si no aparece en profiles, buscar en auth.users
SELECT id, email, created_at
FROM auth.users
WHERE email = 'reformasvascas@gmail.com';

-- Actualizar phone_verified a true para reformasvascas@gmail.com
UPDATE profiles
SET phone_verified = true
WHERE email = 'reformasvascas@gmail.com'
   OR id IN (SELECT id FROM auth.users WHERE email = 'reformasvascas@gmail.com');

-- Verificar que se actualizó correctamente
SELECT id, email, full_name, phone, phone_verified
FROM profiles
WHERE email = 'reformasvascas@gmail.com'
   OR id IN (SELECT id FROM auth.users WHERE email = 'reformasvascas@gmail.com');
