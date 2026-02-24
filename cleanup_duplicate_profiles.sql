-- 1. IDENTIFICAR ORFANOS
-- Este SELECT te mostrará qué perfiles no tienen un usuario real en auth.users
SELECT p.id, p.email, p.role
FROM public.profiles p
LEFT JOIN auth.users au ON p.id = au.id
WHERE au.id IS NULL AND p.email = 'presupuestaloficial@gmail.com';

-- 2. LIMPIEZA DE DUPLICADOS HUÉRFANOS
-- Este comando borrará los perfiles que NO tengan un usuario activo en auth.users
DELETE FROM public.profiles
WHERE id IN (
    SELECT p.id
    FROM public.profiles p
    LEFT JOIN auth.users au ON p.id = au.id
    WHERE au.id IS NULL AND p.email = 'presupuestaloficial@gmail.com'
);

-- 3. VERIFICACIÓN FINAL
-- Solo debería quedar 1 fila vinculada al usuario real
SELECT p.id, p.email, p.role
FROM public.profiles p
JOIN auth.users au ON p.id = au.id
WHERE au.email = 'presupuestaloficial@gmail.com';
