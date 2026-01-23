-- 1. Identificar y borrar duplicados quedándonos solo con uno por empresa
DELETE FROM company_credits 
WHERE id NOT IN (
    SELECT MIN(id) 
    FROM company_credits 
    GROUP BY company_id
);

-- 2. Asegurar que existe la restricción UNIQUE en company_id
-- (Si ya existe, esto fallará o no hará nada si usamos un bloque DO)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'company_credits_company_id_key'
    ) THEN
        ALTER TABLE company_credits ADD CONSTRAINT company_credits_company_id_key UNIQUE (company_id);
    END IF;
END $$;

-- 3. Habilitar RLS si estuviera deshabilitado (aunque parece que está dando 406 por falta de políticas)
ALTER TABLE company_credits ENABLE ROW LEVEL SECURITY;

-- 4. Crear o reemplazar políticas de RLS para que el usuario pueda ver su propio balance
DROP POLICY IF EXISTS "Companies can view their own credits" ON company_credits;
CREATE POLICY "Companies can view their own credits" 
ON company_credits 
FOR SELECT 
USING (auth.uid() = company_id);

-- 5. Opcional: Permitir al sistema (service_role) todo, aunque esto es por defecto
-- La política de arriba permite que el cliente (supabase-js en el navegador) vea los datos.
