-- Corregir phone_verified para Mikel Fernandez
UPDATE profiles 
SET phone_verified = true,
    updated_at = NOW()
WHERE email = 'mikelfedzmcc@gmail.com';

-- Verificar el resultado
SELECT id, email, full_name, phone, phone_verified 
FROM profiles 
WHERE email = 'mikelfedzmcc@gmail.com';
