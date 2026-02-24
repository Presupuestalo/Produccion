-- SQL para designar al Supermaster en la base de datos
-- Ejecuta este script en el Editor SQL de Supabase para sincronizar con los cambios de código.

UPDATE public.profiles
SET role = 'admin'
WHERE email = 'presupuestaloficial@gmail.com';

-- Si prefieres usar el ID directamente (más seguro):
-- UPDATE public.profiles SET role = 'admin' WHERE id = 'ID_DEL_USUARIO';

-- Verificación:
SELECT id, email, role FROM public.profiles WHERE email = 'presupuestaloficial@gmail.com';
